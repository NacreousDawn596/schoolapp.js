/**
 * Manager for courses and study plans
 */
import { BaseManager } from './base_manager.js';
import { MODULES_URL } from '../constants.js';
import * as parsers from '../parsers/index.js';

/**
 * Handles fetching of modules and study plans
 */
export class CourseManager extends BaseManager {
    /**
     * Fetch modules for specific niveau/filiere/semestre
     * @param {string} niveau - Academic level (e.g., "1A", "2A")
     * @param {string} filiere - Program code (e.g., "API-MPT")
     * @param {string} semestre - Semester (e.g., "S1", "S2")
     * @param {boolean} refreshCsrf - Whether to refresh CSRF token before request
     * @returns {Promise<Object|null>} Modules data object
     */
    async getModules(niveau, filiere, semestre, refreshCsrf = false) {
        if (!this.ensureLoggedIn()) {
            return null;
        }

        // Always GET modules page first to refresh CSRF token
        console.log('Opening modules page to refresh state...');
        const { code, url, content } = await this.httpClient.get(MODULES_URL);

        if (!content) {
            return null;
        }

        this.auth.updateCsrfToken(content);

        if (refreshCsrf) {
            await this.auth.refreshCsrfFromUrl(MODULES_URL);
        }

        console.log(`Fetching modules for ${niveau} ${filiere} ${semestre}...`);
        const modulesData = {
            '_csrf': this.auth.csrfToken,
            'niveau': niveau,
            'filiere': filiere,
            'semestre': semestre
        };

        const response = await this.httpClient.post(
            MODULES_URL,
            modulesData,
            MODULES_URL
        );

        return parsers.modules.parse(response.content);
    }
}
