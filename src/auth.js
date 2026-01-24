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
        const match = htmlContent.match(/name="_csrf"\s+value="([^"]+)"/);
        return match ? match[1] : null;
    }

    /**
     * Update CSRF token from HTML content
     * @param {string} htmlContent - HTML content to parse
     * @returns {boolean} True if token was updated
     */
    updateCsrfToken(htmlContent) {
        const newCsrf = AuthManager.extractCsrfToken(htmlContent);
        if (newCsrf) {
            this.csrfToken = newCsrf;
            return true;
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

        if (!content || !this.updateCsrfToken(content)) {
            console.error('Failed to fetch login page or retrieve CSRF token.');
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
