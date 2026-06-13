/**
 * Base class for domain models
 */

const { parse } = require('../parsers/stats.js');

/**
 * Base class for all domain models with client access
 */
class BaseType {
    /**
     * @param {import('../school_app_client.js').SchoolAppClient} client - Client instance
     * @param {Object} data - Data object to initialize properties
     */
    constructor(client, data) {
        this.client = client;

        // Dynamically assign all data properties
        for (const [key, value] of Object.entries(data)) {
            // Clean up keys for valid JavaScript properties
            const cleanKey = key
                .replace(/ /g, '_')
                .replace(/é/g, 'e')
                .replace(/è/g, 'e');
            this[cleanKey] = value;
        }

        this._stats = {};
    }

    /**
     * Ensures the client is logged in before making requests
     * @returns {boolean} True if logged in
     * @private
     */
    _ensureLoggedIn() {
        if (!this.client.auth.isLoggedIn()) {
            console.error('Not logged in! Call login() first.');
            return false;
        }
        return true;
    }

    /**
     * Generic stat fetcher
     * @param {string} url - Stats URL
     * @param {Object} params - Query parameters
     * @returns {Promise<Object|null>} Stats object or null
     * @private
     */
    async _getStats(url, params) {
        if (!this._ensureLoggedIn()) {
            return null;
        }

        // Add CSRF token to params
        params._csrf = this.client.auth.csrfToken;

        const { code, url: responseUrl, content } = await this.client.httpClient.get(url, params);
        return parse(content);
    }
}

module.exports = { BaseType };
