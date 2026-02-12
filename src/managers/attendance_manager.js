/**
 * Manager for attendance and sanctions
 */
const { BaseManager } = require('./base_manager.js');
const { ABSENCES_URL, SANCTIONS_URL } = require('../constants.js');
const parsers = require('../parsers/index.js');

/**
 * Handles fetching of absences and sanctions
 */
class AttendanceManager extends BaseManager {
    /**
     * Get absences data
     * @returns {Promise<Object|null>} Absences object with summary and details
     */
    async getAbsences() {
        return await this.getJsonOrParse(ABSENCES_URL, parsers.absences);
    }

    /**
     * Get sanctions data
     * @returns {Promise<Object|null>} Sanctions object
     */
    async getSanctions() {
        return await this.getJsonOrParse(SANCTIONS_URL, parsers.sanctions);
    }
}

module.exports = { AttendanceManager };
