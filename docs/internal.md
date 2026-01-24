# Core Utilities

Documentation for the underlying infrastructure of the SchoolApp.js library.

## `HTTPClient`

Handles all network requests and cookie management.

### Properties
- **`baseUrl`**: The API base URL.
- **`cookieJar`**: Instance of `tough-cookie` Store.
- **`client`**: The `axios` instance.

### Methods
- **`async get(url, params = null)`**: Performs a GET request.
- **`async post(url, data, referer = null)`**: Performs a POST request.

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
