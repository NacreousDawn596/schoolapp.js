/**
 * Professional client for interacting with the School App
 */
import { HTTPClient } from './http_client.js';
import { AuthManager } from './auth.js';
import { BASE_URL } from './constants.js';
import {
    GradesManager,
    AttendanceManager,
    ProfileManager,
    CourseManager
} from './managers/index.js';

/**
 * Main client for the School App API
 */
export class SchoolAppClient {
    /**
     * @param {string} baseUrl - Base URL for the API (optional)
     */
    constructor(baseUrl = BASE_URL) {
        this.baseUrl = baseUrl;
        this.httpClient = new HTTPClient(this.baseUrl);
        this.httpClient.setUnauthorizedHandler(() => {
            this.auth?.handleUnauthorized?.();
        });
        this.auth = new AuthManager(this.httpClient, this.baseUrl);

        // Initialize Managers
        this.grades = new GradesManager(this);
        this.attendance = new AttendanceManager(this);
        this.profile = new ProfileManager(this);
        this.courses = new CourseManager(this);
    }

    /**
     * Authenticate user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<boolean>} True if login successful
     */
    async login(email, password) {
        return await this.auth.login(email, password);
    }

    async logout() {
        await this.httpClient.resetSession();
        await this.auth.logout?.();
    }

    async resetSession() {
        await this.httpClient.resetSession();
    }

    // ---------------------------------------------------------
    // Legacy / Convenience methods for backward compatibility
    // ---------------------------------------------------------

    /**
     * Get student profile
     * @returns {Promise<Object|null>} Profile data
     */
    async getProfile() {
        return await this.profile.getProfile();
    }

    /**
     * Get filieres (academic programs)
     * @returns {Promise<Array<Object>|null>} Array of filiere objects
     */
    async getFilieres() {
        return await this.profile.getFilieres();
    }

    /**
     * Get absences
     * @returns {Promise<Object|null>} Absences data
     */
    async getAbsences() {
        return await this.attendance.getAbsences();
    }

    /**
     * Get sanctions
     * @returns {Promise<Object|null>} Sanctions data
     */
    async getSanctions() {
        return await this.attendance.getSanctions();
    }

    /**
     * Get element notes
     * @returns {Promise<Array>} Array of Element objects
     */
    async getElemNote() {
        return await this.grades.getElementNotes();
    }

    /**
     * Get current element notes
     * @returns {Promise<Array>} Array of Element objects for current semester
     */
    async getCurrentElemNote() {
        return await this.grades.getElementNotes(true);
    }

    /**
     * Get module notes
     * @returns {Promise<Array>} Array of Module objects
     */
    async getModNote() {
        return await this.grades.getModuleNotes();
    }

    /**
     * Get current module notes
     * @returns {Promise<Array>} Array of Module objects for current semester
     */
    async getCurrentModNote() {
        return await this.grades.getModuleNotes(true);
    }

    /**
     * Get academic years
     * @returns {Promise<Array>} Array of Annee objects
     */
    async getAnnee() {
        return await this.grades.getYears();
    }

    /**
     * Get semesters
     * @returns {Promise<Array>} Array of Semestre objects
     */
    async getSemestre() {
        return await this.grades.getSemesters();
    }

    /**
     * Get modules for specific niveau/filiere/semestre
     * @param {string} niveau - Academic level
     * @param {string} filiere - Program code
     * @param {string} semestre - Semester
     * @param {boolean} refreshCsrf - Whether to refresh CSRF token
     * @returns {Promise<Object|null>} Modules data
     */
    async getModules(niveau, filiere, semestre, refreshCsrf = false) {
        return await this.courses.getModules(niveau, filiere, semestre, refreshCsrf);
    }
}
