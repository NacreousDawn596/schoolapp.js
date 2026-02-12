/**
 * Manager for grades and academic results
 */
const { BaseManager } = require('./base_manager.js');
const {
    CURRENT_ELEM_URL, CURRENT_MOD_URL, ELEM_URL, MOD_URL,
    ANNEES_URL, SEMESTRES_URL
} = require('../constants.js');
const parsers = require('../parsers/index.js');
const types = require('../types/index.js');

/**
 * Handles fetching of grades for elements, modules, years, and semesters
 */
class GradesManager extends BaseManager {
    /**
     * Get element notes (grades)
     * @param {boolean} current - If true, fetch only current semester
     * @returns {Promise<Array<types.Element>>} Array of Element objects
     */
    async getElementNotes(current = false) {
        const url = current ? CURRENT_ELEM_URL : ELEM_URL;
        const data = await this.getJsonOrParse(url, parsers.noteElem);
        return data ? data.map(item => new types.Element(this.client, item)) : [];
    }

    /**
     * Get module notes (grades)
     * @param {boolean} current - If true, fetch only current semester
     * @returns {Promise<Array<types.Module>>} Array of Module objects
     */
    async getModuleNotes(current = false) {
        const url = current ? CURRENT_MOD_URL : MOD_URL;
        const data = await this.getJsonOrParse(url, parsers.noteMod);
        return data ? data.map(item => new types.Module(this.client, item)) : [];
    }

    /**
     * Get academic years
     * @returns {Promise<Array<types.Annee>>} Array of Annee objects
     */
    async getYears() {
        const data = await this.getJsonOrParse(ANNEES_URL, parsers.annees);
        return data ? data.map(item => new types.Annee(this.client, item)) : [];
    }

    /**
     * Get semesters
     * @returns {Promise<Array<types.Semestre>>} Array of Semestre objects
     */
    async getSemesters() {
        const data = await this.getJsonOrParse(SEMESTRES_URL, parsers.semestres);
        return data ? data.map(item => new types.Semestre(this.client, item)) : [];
    }
}

module.exports = { GradesManager };
