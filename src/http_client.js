/**
 * Universal HTTP Client (Node.js + React Native / Android)
 */

const axios = require("axios");
const { DEFAULT_HEADERS } = require("./constants.js");

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
  const { CookieJar } = require("tough-cookie");
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
      const [cookieContent] = cookie.split(";");
      const [name, ...valueParts] = cookieContent.split("=");
      const key = name.trim();
      const value = valueParts.join("=").trim();

      // Parse existing cookies into a map
      const existingStr = this.cookies[host] || "";
      const cookieMap = {};
      
      existingStr.split(";").forEach(c => {
        if (!c.trim()) return;
        const [cName, ...cValueParts] = c.split("=");
        if (cName) cookieMap[cName.trim()] = cValueParts.join("=").trim();
      });

      // Update or add new cookie
      cookieMap[key] = value;

      // Reconstruct cookie string
      this.cookies[host] = Object.entries(cookieMap)
        .map(([k, v]) => `${k}=${v}`)
        .join("; ");
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
function setNetworkChecker(fn) {
  isNetworkReady = fn;
}

/* -------------------------------------------------------------------------- */
/*                               HTTP CLIENT                                  */
/* -------------------------------------------------------------------------- */

class HTTPClient {
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

      // Optimized detection: check if response contains common login page markers
      if (
        typeof response.data === "string" &&
        response.data.length < 50000 && // Assume huge pages (>50k) aren't simple login pages
        !currentUrl.includes("/login")
      ) {
        const data = response.data.toLowerCase();
        if (data.includes("login-box") || data.includes('name="email"') || data.includes("sign in")) {
          if (this.onUnauthorized) {
            this.onUnauthorized();
          }
        }
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

module.exports = { setNetworkChecker, HTTPClient };
