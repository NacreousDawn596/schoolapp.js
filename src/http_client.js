/**
 * Universal HTTP Client
 *
 * A single, runtime-agnostic HTTP implementation built on top of the standard
 * `fetch()` API. It works identically across Node.js, Cloudflare Workers,
 * React Native, Android React Native, browsers, Bun, and Deno.
 *
 * It does NOT depend on Axios, Node's `http`/`https` modules, `tough-cookie`,
 * or any browser/Node/Worker/React-Native specific API.
 */

const { DEFAULT_HEADERS } = require("./constants.js");

/* -------------------------------------------------------------------------- */
/*                               FETCH DETECTION                              */
/* -------------------------------------------------------------------------- */

if (
  typeof globalThis === "undefined" ||
  typeof globalThis.fetch !== "function"
) {
  throw new Error("schoolapp requires a runtime with fetch() support.");
}

const MAX_REDIRECTS = 5;
const DEFAULT_TIMEOUT = 15000;

/* -------------------------------------------------------------------------- */
/*                            SET-COOKIE EXTRACTION                           */
/* -------------------------------------------------------------------------- */

/**
 * Split a raw `set-cookie` header string (as returned by `Headers.get`) into
 * individual `Set-Cookie` values. The native `getSetCookie()` path already
 * returns an array, so this only matters for runtimes that combine multiple
 * cookies into a single comma-separated header.
 *
 * The split avoids breaking inside an `Expires=...` date (which contains a
 * comma) by only splitting on commas followed by a fresh `name=` token.
 */
function splitSetCookieHeader(header) {
  if (!header || typeof header !== "string") return [];
  return header.split(/,(?=\s*[^;,=\s]+\s*=)/).map((s) => s.trim()).filter(Boolean);
}

/**
 * Extract `Set-Cookie` headers from a Fetch response in a runtime-safe way.
 *
 * Prefer `response.headers.getSetCookie()` (Node 18.17+, Cloudflare Workers,
 * modern browsers) and fall back to `response.headers.get("set-cookie")`.
 */
function getSetCookies(response) {
  const headers = response && response.headers;
  if (!headers) return [];

  if (typeof headers.getSetCookie === "function") {
    const cookies = headers.getSetCookie();
    if (Array.isArray(cookies) && cookies.length) return cookies;
  }

  if (typeof headers.get === "function") {
    return splitSetCookieHeader(headers.get("set-cookie"));
  }

  return [];
}

/* -------------------------------------------------------------------------- */
/*                                 COOKIE JAR                                 */
/* -------------------------------------------------------------------------- */

/**
 * A portable in-memory cookie jar.
 *
 * Fetch does not provide consistent automatic cookie persistence across all
 * runtimes, so the client maintains its own jar. Cookies are stored per
 * domain/host and are only ever sent back to a matching origin.
 */
class CookieJar {
  constructor() {
    // Map<domainOrHost (lowercase), Map<name, record>>
    this.cookies = new Map();
  }

  /**
   * Return the `Cookie` header string for a URL, or an empty string when no
   * cookies apply.
   * @param {string} url
   * @returns {Promise<string>}
   */
  async get(url) {
    const u = new URL(url);
    const hostname = u.hostname.toLowerCase();
    const secure = u.protocol === "https:";
    const path = u.pathname || "/";
    const now = Date.now();

    const pairs = [];

    for (const byName of this.cookies.values()) {
      for (const record of byName.values()) {
        if (record.expires !== null && record.expires <= now) continue;

        if (record.hostOnly) {
          if (record.domain !== hostname) continue;
        } else {
          if (hostname !== record.domain && !hostname.endsWith("." + record.domain)) {
            continue;
          }
        }

        if (!this._pathMatches(path, record.path)) continue;
        if (record.secure && !secure) continue;

        pairs.push(`${record.name}=${record.value}`);
      }
    }

    return pairs.length ? pairs.join("; ") : "";
  }

  /**
   * Store a `Set-Cookie` value for the given URL.
   * @param {string} url
   * @param {string} cookieHeader
   * @returns {Promise<void>}
   */
  async set(url, cookieHeader) {
    const record = this._parseSetCookie(url, cookieHeader);
    if (!record) return;

    let byName = this.cookies.get(record.domain);

    if (record.delete) {
      if (byName) byName.delete(record.name);
      return;
    }

    if (!byName) {
      byName = new Map();
      this.cookies.set(record.domain, byName);
    }

    byName.set(record.name, record);
  }

  /**
   * Remove all stored cookies.
   * @returns {Promise<void>}
   */
  async clear() {
    this.cookies.clear();
  }

  /* ------------------------------- internals ------------------------------ */

  _pathMatches(requestPath, cookiePath) {
    if (requestPath === cookiePath) return true;
    if (!requestPath.startsWith(cookiePath)) return false;
    if (cookiePath.endsWith("/")) return true;
    return requestPath.charAt(cookiePath.length) === "/";
  }

  _defaultPath(u) {
    const p = u.pathname || "/";
    if (!p || p[0] !== "/") return "/";
    const idx = p.lastIndexOf("/");
    return idx <= 0 ? "/" : p.slice(0, idx);
  }

  _parseSetCookie(url, header) {
    if (!header || typeof header !== "string") return null;

    const u = new URL(url);
    const hostname = u.hostname.toLowerCase();

    const parts = header.split(";");
    const first = parts[0];
    const eqIdx = first.indexOf("=");

    let name;
    let value;
    if (eqIdx === -1) {
      name = first.trim();
      value = "";
    } else {
      name = first.slice(0, eqIdx).trim();
      value = first.slice(eqIdx + 1).trim();
    }
    if (!name) return null;

    let domain = hostname;
    let hostOnly = true;
    let path = this._defaultPath(u);
    let secure = false;
    let maxAge = null;
    let expiresRaw = null;

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i].trim();
      if (!part) continue;

      const eq = part.indexOf("=");
      const key = (eq === -1 ? part : part.slice(0, eq)).trim().toLowerCase();
      const val = eq === -1 ? "" : part.slice(eq + 1).trim();

      switch (key) {
        case "domain":
          if (val) {
            domain = val.replace(/^\./, "").toLowerCase();
            hostOnly = false;
          }
          break;
        case "path":
          if (val) path = val;
          break;
        case "secure":
          secure = true;
          break;
        case "max-age":
          maxAge = parseInt(val, 10);
          break;
        case "expires":
          expiresRaw = Date.parse(val);
          break;
        default:
          break;
      }
    }

    let expires = null;
    let shouldDelete = false;

    if (!Number.isNaN(maxAge) && maxAge !== null) {
      if (maxAge <= 0) {
        shouldDelete = true;
      } else {
        expires = Date.now() + maxAge * 1000;
      }
    } else if (expiresRaw !== null && !Number.isNaN(expiresRaw)) {
      expires = expiresRaw;
      if (expires <= Date.now()) shouldDelete = true;
    }

    return {
      domain,
      hostOnly,
      name,
      value,
      path,
      secure,
      expires,
      delete: shouldDelete,
    };
  }
}

/* -------------------------------------------------------------------------- */
/*                            NETWORK GUARD (MOBILE)                           */
/* -------------------------------------------------------------------------- */

let isNetworkReady = null;

/**
 * Inject an optional connectivity checker (primarily for React Native):
 *
 *   setNetworkChecker(() => netInfo.isInternetReachable === true);
 *
 * @param {Function|null} fn
 */
function setNetworkChecker(fn) {
  isNetworkReady = fn;
}

/* -------------------------------------------------------------------------- */
/*                                HTTP CLIENT                                 */
/* -------------------------------------------------------------------------- */

class HTTPClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.cookieJar = new CookieJar();
    this.onUnauthorized = null;
    this.timeout = DEFAULT_TIMEOUT;
  }

  setUnauthorizedHandler(handler) {
    this.onUnauthorized = handler;
  }

  async resetSession() {
    await this.cookieJar.clear();
  }

  /* ------------------------------- internals ------------------------------ */

  _networkNotReady() {
    return typeof isNetworkReady === "function" && !isNetworkReady();
  }

  async _parseBody(response) {
    const text = await response.text();
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      try {
        return JSON.parse(text);
      } catch (e) {
        return text;
      }
    }

    return text;
  }

  _detectLogin(currentUrl, data) {
    if (
      typeof data !== "string" ||
      data.length >= 50000 ||
      currentUrl.includes("/login")
    ) {
      return;
    }

    const lower = data.toLowerCase();
    if (
      lower.includes("login-box") ||
      lower.includes('name="email"') ||
      lower.includes("sign in")
    ) {
      if (this.onUnauthorized) {
        // A failure inside the handler must never destroy the HTTP response.
        try {
          this.onUnauthorized();
        } catch (e) {
          /* ignore handler errors */
        }
      }
    }
  }

  /**
   * Core transport. Throws meaningful errors on failure.
   * Returns `{ status, url, data }`.
   */
  async _request(method, url, data = null, headers = {}) {
    if (this._networkNotReady()) {
      throw new Error("Network not ready");
    }

    let currentUrl = url.startsWith("http")
      ? url
      : new URL(url, this.baseUrl).toString();

    let currentMethod = method;
    let currentData = data;
    const currentHeaders = { ...headers };

    let redirectCount = 0;

    while (true) {
      // Attach cookies from the jar before every hop.
      const cookies = await this.cookieJar.get(currentUrl);

      const requestHeaders = {
        ...DEFAULT_HEADERS,
        ...currentHeaders,
        // Cache prevention via ordinary HTTP headers only (no Fetch `cache`).
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      };

      // The cookie jar takes precedence; a user-supplied Cookie header is
      // overridden so the session stays consistent across runtimes.
      if (cookies) {
        requestHeaders.Cookie = cookies;
      }

      const controller =
        typeof AbortController !== "undefined" ? new AbortController() : null;

      let timer = null;
      if (controller && this.timeout != null && this.timeout > 0) {
        timer = setTimeout(() => controller.abort(), this.timeout);
      }

      let response;
      try {
        response = await fetch(currentUrl, {
          method: currentMethod,
          headers: requestHeaders,
          body:
            currentData !== null && currentData !== undefined
              ? currentData
              : undefined,
          redirect: "manual",
          signal: controller ? controller.signal : undefined,
        });
      } catch (e) {
        if (e && e.name === "AbortError") {
          throw new Error("Request timeout", { cause: e });
        }
        throw e;
      } finally {
        if (timer) clearTimeout(timer);
      }

      // Persist any cookies returned by this hop.
      const setCookies = getSetCookies(response);
      for (const cookie of setCookies) {
        await this.cookieJar.set(currentUrl, cookie);
      }

      const status = response.status;
      const location = response.headers.get("location");

      // Manual redirect handling.
      if (status >= 300 && status < 400 && location) {
        redirectCount++;

        if (redirectCount > MAX_REDIRECTS) {
          throw new Error("Too many redirects");
        }

        if (this._networkNotReady()) {
          throw new Error("Lost network during redirect");
        }

        currentUrl = new URL(location, currentUrl).toString();

        // 301 / 302 / 303: convert POST (and other non-idempotent methods)
        // to GET and drop the request body.
        if ([301, 302, 303].includes(status)) {
          if (currentMethod !== "GET" && currentMethod !== "HEAD") {
            currentMethod = "GET";
            currentData = null;
            delete currentHeaders["Content-Type"];
          }
        }
        // 307 / 308: preserve method and body.

        continue;
      }

      const data = await this._parseBody(response);

      this._detectLogin(currentUrl, data);

      return {
        status,
        url: currentUrl,
        data,
      };
    }
  }

  /* --------------------------------- GET ---------------------------------- */

  async get(url, params = null) {
    try {
      let finalUrl = url;

      if (params) {
        const u = new URL(
          url.startsWith("http") ? url : new URL(url, this.baseUrl)
        );
        for (const [k, v] of Object.entries(params)) {
          if (v !== null && v !== undefined) {
            u.searchParams.append(k, v);
          }
        }
        finalUrl = u.toString();
      }

      const res = await this._request("GET", finalUrl);

      return {
        code: res.status,
        url: res.url,
        content: res.data,
      };
    } catch (e) {
      return { code: null, url: null, content: null };
    }
  }

  /* --------------------------------- POST --------------------------------- */

  async post(url, data, referer = null) {
    try {
      const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        Origin: this.baseUrl,
      };

      if (referer) headers.Referer = referer;

      const body = new URLSearchParams(data).toString();

      const res = await this._request("POST", url, body, headers);

      return {
        code: res.status,
        url: res.url,
        content: res.data,
      };
    } catch (e) {
      return { code: null, url: null, content: null };
    }
  }
}

module.exports = { HTTPClient, CookieJar, setNetworkChecker, getSetCookies };
