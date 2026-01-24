/**
 * Base manager for shared logic
 */

/**
 * Base class for all managers
 */
export class BaseManager {
    /**
     * @param {import('../school_app_client.js').SchoolAppClient} client - Client instance
     */
    constructor(client) {
        this.client = client;
        this.httpClient = client.httpClient;
        this.auth = client.auth;
    }

    /**
     * Ensures the client is logged in before making requests
     * @returns {boolean} True if logged in
     */
    ensureLoggedIn() {
        if (!this.auth.isLoggedIn()) {
            console.error('Not logged in! Call login() first.');
            return false;
        }
        return true;
    }

    /**
     * Helper to fetch content, update CSRF, and parse
     * @param {string} url - URL to fetch
     * @param {Object} parser - Parser module with parse function
     * @param {Object} params - Query parameters
     * @param {boolean} refreshCsrf - Whether to refresh CSRF token
     * @returns {Promise<any>} Parsed data or null
     */
    async getJsonOrParse(url, parser, params = null, refreshCsrf = true) {
        if (!this.ensureLoggedIn()) {
            return null;
        }

        const response = await this.httpClient.get(url, params);
        const { code, url: responseUrl, content } = response;

        if (response.isUnauthorized) {
            console.error(`[BaseManager] Unauthorized access to ${url}. Resetting login state.`);
            this.auth.setLoginState(false);
            return null;
        }

        if (!content) {
            return null;
        }

        if (refreshCsrf) {
            this.auth.updateCsrfToken(content);
        }

        return parser.parse(content);
    }
}
