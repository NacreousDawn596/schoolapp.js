/**
 * Manager for student profile and programs
 */
import { BaseManager } from './base_manager.js';
import { INDEX_URL, FILIERES_URL } from '../constants.js';
import * as parsers from '../parsers/index.js';

/**
 * Handles fetching of student profile and filieres
 */
export class ProfileManager extends BaseManager {
    /**
     * Get student profile data
     * @returns {Promise<Object|null>} Profile object with detailed user information
     */
    async getProfile() {
        return await this.getJsonOrParse(INDEX_URL, parsers.profile);
    }

    /**
     * Get filieres (academic programs)
     * @returns {Promise<Array<Object>|null>} Array of filiere objects
     */
    async getFilieres() {
        return await this.getJsonOrParse(FILIERES_URL, parsers.filieres);
    }
}
