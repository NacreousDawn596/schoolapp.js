/**
 * Module type representing a module (collection of elements) with grades
 */
const { BaseType } = require('./base.js');
const { MOD_STAT_URL } = require('../constants.js');

/**
 * Represents a module (collection of elements) with grades
 */
class Module extends BaseType {
    /**
     * Fetch module statistics
     * @returns {Promise<Object|null>} Statistics object or null
     */
    async fetchStats() {
        const params = {
            'eval': "MOYMOD",
            'codemod': this.CodeMod ?? null,
            'note': this.Moy ?? null,
            'au': this.AU ?? null
        };

        const stats = await this._getStats(MOD_STAT_URL, params);
        if (stats) {
            this._stats.MOYMOD = stats;
        }
        return stats;
    }

    /**
     * Get module statistics
     * @returns {Promise<Object|null>} Module statistics
     */
    async stats() {
        return this._stats.MOYMOD || await this.fetchStats();
    }
}

module.exports = { Module };
