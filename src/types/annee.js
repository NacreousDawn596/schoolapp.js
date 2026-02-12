/**
 * Annee (Academic Year) type representing an academic year result
 */
const { BaseType } = require('./base.js');
const { ANNEE_STAT_URL } = require('../constants.js');

/**
 * Represents an academic year result
 */
class Annee extends BaseType {
    /**
     * Fetch year statistics
     * @returns {Promise<Object|null>} Statistics object or null
     */
    async fetchStats() {
        const params = {
            'eval': "MoyAn",
            'niveau': this.Niveau ?? null,
            'filiere': this.Filiere ?? null,
            'au': this.AU ?? null,
            'note': this.Moy_Annee ?? null
        };

        const stats = await this._getStats(ANNEE_STAT_URL, params);
        if (stats) {
            this._stats.MoyAn = stats;
        }
        return stats;
    }

    /**
     * Get year statistics
     * @returns {Promise<Object|null>} Year statistics
     */
    async stats() {
        return this._stats.MoyAn || await this.fetchStats();
    }
}

module.exports = { Annee };
