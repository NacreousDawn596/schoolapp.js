/**
 * Element type representing a module element (subject) with grades
 */
import { BaseType } from './base.js';
import { EVAL_STAT_URL } from '../constants.js';

/**
 * Represents a module element (subject) with grades
 */
export class Element extends BaseType {
    /**
     * Generic stat fetcher for element evaluations
     * @param {string} evalType - Evaluation type (NoteCC, NoteEX, NoteTP, MoyElem)
     * @returns {Promise<Object|null>} Statistics object or null
     */
    async fetchStats(evalType) {
        const noteMap = {
            "NoteCC": this.CC ?? null,
            "NoteEX": this.EX ?? null,
            "NoteTP": this.TP ?? null,
            "MoyElem": this.Moy ?? null
        };

        const params = {
            'eval': evalType,
            'codeelem': this.CodeElem,
            'note': noteMap[evalType],
            'au': this.AU
        };

        const stats = await this._getStats(EVAL_STAT_URL, params);
        if (stats) {
            this._stats[evalType] = stats;
        }
        return stats;
    }

    /**
     * Get CC (Continuous Evaluation) statistics
     * @returns {Promise<Object|null>} CC statistics
     */
    async ccStats() {
        return this._stats.NoteCC || await this.fetchStats("NoteCC");
    }

    /**
     * Get EX (Exam) statistics
     * @returns {Promise<Object|null>} Exam statistics
     */
    async exStats() {
        return this._stats.NoteEX || await this.fetchStats("NoteEX");
    }

    /**
     * Get TP (Practical Work) statistics
     * @returns {Promise<Object|null>} TP statistics
     */
    async tpStats() {
        return this._stats.NoteTP || await this.fetchStats("NoteTP");
    }

    /**
     * Get overall average statistics
     * @returns {Promise<Object|null>} Average statistics
     */
    async moyStats() {
        return this._stats.MoyElem || await this.fetchStats("MoyElem");
    }
}
