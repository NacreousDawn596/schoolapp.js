/**
 * Manager for student profile and programs
 */
const { BaseManager } = require('./base_manager.js');
const { INDEX_URL, FILIERES_URL } = require('../constants.js');
const parsers = require('../parsers/index.js');

/**
 * Handles fetching of student profile and filieres
 */
class ProfileManager extends BaseManager {
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

module.exports = { ProfileManager };
