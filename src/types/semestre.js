/**
 * Semestre (Semester) type representing a semester result
 */
import { BaseType } from './base.js';
import { SEM_STAT_URL } from '../constants.js';

/**
 * Represents a semester result
 */
export class Semestre extends BaseType {
    /**
     * Fetch semester statistics
     * @returns {Promise<Object|null>} Statistics object or null
     */
    async fetchStats() {
        const params = {
            'eval': "MoySem",
            'niveau': this.Niveau ?? null,
            'filiere': this.Filiere ?? null,
            'semestre': this.Semestre ?? null,
            'au': this.AU ?? null,
            'note': this.Moy_SEM ?? null
        };

        const stats = await this._getStats(SEM_STAT_URL, params);
        if (stats) {
            this._stats.MoySem = stats;
        }
        return stats;
    }

    /**
     * Get semester statistics
     * @returns {Promise<Object|null>} Semester statistics
     */
    async stats() {
        return this._stats.MoySem || await this.fetchStats();
    }
}
