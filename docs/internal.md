# Core Utilities

Documentation for the underlying infrastructure of the SchoolApp.js library.

## `HTTPClient`

Handles all network requests and cookie management. Built on the standard
`fetch()` API (no Axios, no `http`/`https`, no `tough-cookie`), so it runs
identically in Node.js, Cloudflare Workers, React Native, browsers, Bun, and
Deno.

### Properties
- **`baseUrl`**: The API base URL.
- **`cookieJar`**: Instance of the portable `CookieJar` (in-memory, per-origin).
- **`timeout`**: Request timeout in milliseconds (default `15000`).
- **`onUnauthorized`**: Optional callback invoked when a login page is detected.

### Methods
- **`async get(url, params = null)`**: Performs a GET request.
- **`async post(url, data, referer = null)`**: Performs a POST request
  (`application/x-www-form-urlencoded`).
- **`async resetSession()`**: Clears the cookie jar.
- **`setUnauthorizedHandler(handler)`**: Sets the login-detection callback.

## `CookieJar`

A portable in-memory cookie store. Cookies are keyed by origin/domain and are
only ever sent back to a matching origin. Exposes `get(url)`, `set(url, cookie)`,
and `clear()`.

---

## `AuthManager`

Handles authentication and CSRF token extraction.

### Properties
- **`csrfToken`**: The active CSRF token for POST requests.
- **`loggedIn`**: Authentication state.

### Methods
- **`async login(email, password)`**: Performs the login handshake.
- **`extractCsrfToken(htmlContent)`**: Static method to find the token in HTML.
- **`updateCsrfToken(htmlContent)`**: Updates internal state from a response.
- **`async refreshCsrfFromUrl(url)`**: Refreshes the token by visiting a page.
