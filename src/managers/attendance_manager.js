/**
 * Manager for attendance and sanctions
 */
import { BaseManager } from './base_manager.js';
import { ABSENCES_URL, SANCTIONS_URL } from '../constants.js';
import * as parsers from '../parsers/index.js';

/**
 * Handles fetching of absences and sanctions
 */
export class AttendanceManager extends BaseManager {
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
