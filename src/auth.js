/**
 * Authentication and CSRF token management
 */
import { LOGIN_URL } from './constants.js';

/**
 * Handles authentication and CSRF token management
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
    }

    /**
     * Extract CSRF token from HTML content
     * @param {string} htmlContent - HTML content to parse
     * @returns {string|null} CSRF token if found
     */
    static extractCsrfToken(htmlContent) {
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
        if (htmlContent.includes('_csrf')) {
            console.log('[Auth] "_csrf" found in content but regex failed!');
            // Locate the string context
            const idx = htmlContent.indexOf('_csrf');
            console.log('[Auth] Context:', htmlContent.substring(Math.max(0, idx - 50), Math.min(htmlContent.length, idx + 100)));
        } else {
            console.log('[Auth] "_csrf" NOT found in content.');
        }

        return false;
    }

    /**
     * Login and maintain session
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<boolean>} True if login successful
     */
    async login(email, password) {
        if (this.loggedIn) {
            console.log('Already logged in!');
            return true;
        }

        console.log('Fetching login page...');
        const { code, url, content } = await this.httpClient.get(this.loginUrl);

        console.log(`[Auth] fetched login page code: ${code}, url: ${url}`);

        // Check if we were redirected to the index/home page (already logged in)
        if (url && (url.includes('/index') || url.includes('/home') || url.includes('schoolapp.ensam-umi.ac.ma/$'))) {
            console.log('[Auth] Redirected to index - User already logged in.');
            this.loggedIn = true;
            return true;
        }

        if (content) console.log(`[Auth] Content available, length: ${content.length}`);

        if (!content || !this.updateCsrfToken(content)) {
            console.error('Failed to fetch login page or retrieve CSRF token.');
            if (content) {
                console.log('Content dump (2000 chars):', content.substring(0, 2000));
                console.log('Contains "form"?', content.includes('<form'));
                console.log('Contains "input"?', content.includes('<input'));
                console.log('Contains "Sign In"?', content.includes('Sign In') || content.includes('Se connecter'));
            }
            return false;
        }

        console.log('Got CSRF token, logging in...');
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
        // Check for specific login elements in the response content
        const isLoginPage = response.content && (
            response.content.includes('Sign In') ||
            response.content.includes('name="email"') ||
            response.content.includes('login-box')
        );

        if (isLoginPage) {
            console.error('Login failed! Still on login page.');
            // Try to find an error message
            if (response.content.includes('alert-danger')) {
                console.error('Server returned error alert.');
            }
            return false;
        }

        if (response.url && response.url.includes('/login') && response.url.includes('error')) {
            console.error('Login failed! Invalid credentials (url check).');
            return false;
        }

        console.log('Login successful!');
        this.loggedIn = true;
        return true;
    }

    /**
     * Check if currently logged in
     * @returns {boolean} True if logged in
     */
    isLoggedIn() {
        return this.loggedIn;
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
            console.warn('CSRF refresh warning:', error.message);
            return false;
        }
    }
}
