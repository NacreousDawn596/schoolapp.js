/**
 * Authentication and CSRF token management (Node + Mobile safe)
 * Session only dies when server actually kills it
 */
import { LOGIN_URL } from './constants.js';

/**
 * Handles authentication and CSRF token management with intelligent session suspicion
 */
export class AuthManager {
    /**
     * @param {import('./http_client.js').HTTPClient} httpClient - HTTP client instance
     * @param {string} baseUrl - Base URL for the API
     */
    constructor(httpClient, baseUrl) {
        this.httpClient = httpClient;
        this.baseUrl = baseUrl;
        this.loginUrl = LOGIN_URL;
        this.csrfToken = null;
        this.loggedIn = false;

        // Internal auth suspicion tracking
        this._authSuspect = false;
        this._confirming = false;

        // HTTP client may SUSPECT auth loss — never reset immediately
        this.httpClient.setUnauthorizedHandler(() => {
            if (!this._authSuspect) {
                console.warn('[AuthManager] Unauthorized suspected (but not confirmed)');
                this._authSuspect = true;
            }
        });
    }

    /* ------------------------------------------------------------------------ */
    /*                              INTERNAL UTILS                               */
    /* ------------------------------------------------------------------------ */

    /**
     * Reset all authentication state
     */
    resetAuthState() {
        this.loggedIn = false;
        this.csrfToken = null;
        this._authSuspect = false;
    }

    /**
     * Extract CSRF token from HTML content
     * @param {string} htmlContent - HTML content to parse
     * @returns {string|null} CSRF token if found
     */
    static extractCsrfToken(htmlContent) {
        if (!htmlContent) return null;

        // Try standard patterns with more flexibility
        let match = htmlContent.match(/name=["']_csrf["']\s+value=["']([^"']+)["']/);
        if (match) return match[1];

        // Try alternative order (value first)
        match = htmlContent.match(/value=["']([^"']+)["']\s+name=["']_csrf["']/);
        if (match) return match[1];

        return null;
    }

    /**
     * Update CSRF token from HTML content
     * @param {string} htmlContent - HTML content to parse
     * @returns {boolean} True if token was updated
     */
    updateCsrfToken(htmlContent) {
        const newCsrf = AuthManager.extractCsrfToken(htmlContent);
        if (newCsrf) {
            console.log('[Auth] CSRF Token found:', newCsrf.substring(0, 10) + '...');
            this.csrfToken = newCsrf;
            return true;
        }

        // Debug: check if csrf exists but wasn't matched
        if (htmlContent && htmlContent.includes('_csrf')) {
            console.log('[Auth] "_csrf" found in content but regex failed!');
            // Locate the string context
            const idx = htmlContent.indexOf('_csrf');
            console.log('[Auth] Context:', htmlContent.substring(
                Math.max(0, idx - 50), 
                Math.min(htmlContent.length, idx + 100)
            ));
        } else if (htmlContent) {
            console.log('[Auth] "_csrf" NOT found in content.');
        }

        return false;
    }

    /* ------------------------------------------------------------------------ */
    /*                        SESSION CONFIRMATION                              */
    /* ------------------------------------------------------------------------ */

    /**
     * Check if session is still valid WITHOUT logging in again
     * Safe to call on app start / reconnect
     * @returns {Promise<boolean>} True if session is valid
     */
    async checkSession() {
        try {
            const { code, url, content } = await this.httpClient.get(this.loginUrl);

            // If redirected away from login page, session is valid
            if (url && !url.includes('/login')) {
                this.loggedIn = true;
                this._authSuspect = false;
                return true;
            }

            // If we're still on login page, session is dead
            this.resetAuthState();
            return false;
        } catch (error) {
            console.warn('[Auth] Session check failed:', error.message);
            return false;
        }
    }

    /**
     * Confirm whether the session is ACTUALLY lost.
     * This is the ONLY place where auth state may be reset after suspicion.
     * @returns {Promise<boolean>} True if session confirmed lost
     */
    async confirmSessionLoss() {
        if (!this._authSuspect || this._confirming) {
            return false;
        }

        this._confirming = true;

        try {
            const { code, url, content } = await this.httpClient.get(this.loginUrl);

            // If we're on login page (not redirected), session is confirmed lost
            if (url && url.includes('/login')) {
                console.warn('[Auth] Session confirmed lost (redirected to /login)');
                this.resetAuthState();
                return true;
            }

            // False alarm — session still valid, cookies were accepted
            console.log('[Auth] Session suspicion cleared — false alarm');
            this.loggedIn = true;
            this._authSuspect = false;
            return false;

        } catch (error) {
            console.warn('[Auth] Session confirmation failed:', error.message);
            return false;
        } finally {
            this._confirming = false;
        }
    }

    /* ------------------------------------------------------------------------ */
    /*                                  LOGIN                                    */
    /* ------------------------------------------------------------------------ */

    /**
     * Login and maintain session
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<boolean>} True if login successful
     */
    async login(email, password) {
        if (this.loggedIn) {
            console.log('[Auth] Already logged in!');
            return true;
        }

        console.log('[Auth] Fetching login page...');
        const { code, url, content } = await this.httpClient.get(this.loginUrl);

        console.log(`[Auth] Fetched login page code: ${code}, url: ${url}`);

        // Check if we were redirected away from login (already logged in via cookies)
        if (url && !url.includes('/login')) {
            console.log('[Auth] Already logged in (cookie-based).');
            this.loggedIn = true;
            this._authSuspect = false;
            return true;
        }

        if (content) console.log(`[Auth] Content available, length: ${content.length}`);

        if (!content || !this.updateCsrfToken(content)) {
            console.error('[Auth] Failed to fetch login page or retrieve CSRF token.');
            if (content) {
                console.log('[Auth] Content dump (2000 chars):', content.substring(0, 2000));
                console.log('[Auth] Contains "form"?', content.includes('<form'));
                console.log('[Auth] Contains "input"?', content.includes('<input'));
                console.log('[Auth] Contains "Sign In"?', content.includes('Sign In') || content.includes('Se connecter'));
            }
            return false;
        }

        console.log('[Auth] Got CSRF token, logging in...');
        const loginData = {
            '_csrf': this.csrfToken,
            'email': email,
            'password': password
        };

        const response = await this.httpClient.post(
            this.loginUrl,
            loginData,
            this.loginUrl
        );

        // Robust check: if we are still on the login page, it failed
        const isLoginPage = response.url?.includes('/login') || 
                           (response.content && (
                               response.content.includes('Sign In') ||
                               response.content.includes('name="email"') ||
                               response.content.includes('login-box') ||
                               response.content.includes('login')
                           ));

        if (isLoginPage) {
            console.error('[Auth] Login failed! Still on login page.');
            this.resetAuthState();
            
            // Try to find an error message
            if (response.content && response.content.includes('alert-danger')) {
                console.error('[Auth] Server returned error alert.');
            }
            return false;
        }

        console.log('[Auth] Login successful!');
        this.loggedIn = true;
        this._authSuspect = false;
        return true;
    }

    /* ------------------------------------------------------------------------ */
    /*                                  LOGOUT                                   */
    /* ------------------------------------------------------------------------ */

    /**
     * Logout and reset session
     * @returns {Promise<void>}
     */
    async logout() {
        await this.httpClient.resetSession();
        this.resetAuthState();
    }

    /* ------------------------------------------------------------------------ */
    /*                                  STATE                                    */
    /* ------------------------------------------------------------------------ */

    /**
     * Check if currently logged in
     * @returns {boolean} True if logged in
     */
    isLoggedIn() {
        return this.loggedIn;
    }

    /**
     * Check if authentication is suspected lost
     * @returns {boolean} True if auth is suspected lost
     */
    isAuthSuspect() {
        return this._authSuspect;
    }

    /**
     * Explicitly set login state (use with caution)
     * @param {boolean} state - Login state
     */
    setLoginState(state) {
        this.loggedIn = state;
        if (state) {
            this._authSuspect = false;
        }
    }

    /**
     * Fetch a fresh CSRF token from a specific page
     * @param {string} url - URL to fetch CSRF token from
     * @returns {Promise<boolean>} True if token was refreshed
     */
    async refreshCsrfFromUrl(url) {
        try {
            const { code, url: responseUrl, content } = await this.httpClient.get(url);
            if (content && this.updateCsrfToken(content)) {
                return true;
            }
            return false;
        } catch (error) {
            console.warn('[Auth] CSRF refresh warning:', error.message);
            return false;
        }
    }
}