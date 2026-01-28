/**
 * Universal HTTP Client (Node.js + React Native / Android)
 */

import axios from "axios";
import { DEFAULT_HEADERS } from "./constants.js";

/* -------------------------------------------------------------------------- */
/*                               ENV DETECTION                                */
/* -------------------------------------------------------------------------- */

const isNode =
  typeof process !== "undefined" &&
  process.versions != null &&
  process.versions.node != null;

/* -------------------------------------------------------------------------- */
/*                            COOKIE JAR ABSTRACTION                           */
/* -------------------------------------------------------------------------- */

let CookieJarImpl = null;

if (isNode) {
  // Node.js: use tough-cookie
  const { CookieJar } = await import("tough-cookie");
  CookieJarImpl = class {
    constructor() {
      this.jar = new CookieJar();
    }
    async get(url) {
      return this.jar.getCookieString(url);
    }
    async set(url, cookie) {
      return this.jar.setCookie(cookie, url);
    }
    async clear() {
      return this.jar.removeAllCookies();
    }
  };
} else {
  // React Native: in-memory cookies (safe for mobile)
  CookieJarImpl = class {
    constructor() {
      this.cookies = {};
    }
    async get(url) {
      const host = new URL(url).origin;
      return this.cookies[host] || "";
    }
    async set(url, cookie) {
      const host = new URL(url).origin;
      const value = cookie.split(";")[0];
      this.cookies[host] = this.cookies[host]
        ? `${this.cookies[host]}; ${value}`
        : value;
    }
    async clear() {
      this.cookies = {};
    }
  };
}

/* -------------------------------------------------------------------------- */
/*                            NETWORK GUARD (MOBILE)                           */
/* -------------------------------------------------------------------------- */

let isNetworkReady = null;

/**
 * Inject from React Native:
 * setNetworkChecker(() => netInfo.isInternetReachable === true)
 */
export function setNetworkChecker(fn) {
  isNetworkReady = fn;
}

/* -------------------------------------------------------------------------- */
/*                               HTTP CLIENT                                  */
/* -------------------------------------------------------------------------- */

export class HTTPClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.cookieJar = new CookieJarImpl();
    this.onUnauthorized = null;

    this.client = axios.create({
      timeout: 15000,
      headers: {
        ...DEFAULT_HEADERS,
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      validateStatus: status => status < 500,
      maxRedirects: 0, // we handle redirects manually
    });
  }

  setUnauthorizedHandler(handler) {
    this.onUnauthorized = handler;
  }

  async resetSession() {
    await this.cookieJar.clear();
  }

  /* ------------------------------------------------------------------------ */
  /*                               CORE REQUEST                                */
  /* ------------------------------------------------------------------------ */

  async _request(method, url, data = null, headers = {}) {
    if (!isNode && isNetworkReady && !isNetworkReady()) {
      throw new Error("Network not ready");
    }

    let currentUrl = url.startsWith("http")
      ? url
      : new URL(url, this.baseUrl).toString();

    let redirectCount = 0;
    const MAX_REDIRECTS = 5;

    while (redirectCount <= MAX_REDIRECTS) {
      const cookies = await this.cookieJar.get(currentUrl);

      const config = {
        method,
        url: currentUrl,
        headers: {
          ...headers,
          ...(cookies ? { Cookie: cookies } : {}),
        },
        data,
        maxRedirects: 0,
      };

      const response = await this.client.request(config);

      // Save cookies
      const setCookie = response.headers["set-cookie"];
      if (setCookie) {
        const cookiesArr = Array.isArray(setCookie)
          ? setCookie
          : [setCookie];

        for (const c of cookiesArr) {
          await this.cookieJar.set(currentUrl, c);
        }
      }

      // Handle redirects
      if (
        response.status >= 300 &&
        response.status < 400 &&
        response.headers.location
      ) {
        redirectCount++;

        if (!isNode && isNetworkReady && !isNetworkReady()) {
          throw new Error("Lost network during redirect");
        }

        currentUrl = new URL(
          response.headers.location,
          currentUrl
        ).toString();

        if ([301, 302, 303].includes(response.status)) {
          method = "GET";
          data = null;
          delete headers["Content-Type"];
        }

        continue;
      }

      // Detect login page (session expired)
      if (
        typeof response.data === "string" &&
        !currentUrl.includes("/login") &&
        (response.data.includes("Sign In") ||
          response.data.includes("login-box") ||
          response.data.includes('name="_csrf"'))
      ) {
        await this.resetSession();
        if (this.onUnauthorized) this.onUnauthorized();
      }

      return response;
    }

    throw new Error("Too many redirects");
  }

  /* ------------------------------------------------------------------------ */
  /*                                   GET                                    */
  /* ------------------------------------------------------------------------ */

  async get(url, params = null) {
    try {
      let finalUrl = url;

      if (params) {
        const u = new URL(
          url.startsWith("http") ? url : new URL(url, this.baseUrl)
        );
        Object.entries(params).forEach(([k, v]) => {
          if (v !== null && v !== undefined) {
            u.searchParams.append(k, v);
          }
        });
        finalUrl = u.toString();
      }

      const res = await this._request("GET", finalUrl);

      return {
        code: res.status,
        url: res.request?.responseURL || res.config.url,
        content: res.data,
      };
    } catch (e) {
      return { code: null, url: null, content: null };
    }
  }

  /* ------------------------------------------------------------------------ */
  /*                                   POST                                   */
  /* ------------------------------------------------------------------------ */

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
        url: res.request?.responseURL || res.config.url,
        content: res.data,
      };
    } catch (e) {
      return { code: null, url: null, content: null };
    }
  }
}
