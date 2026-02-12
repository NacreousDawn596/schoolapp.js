/**
 * Centralized constants for the School App API
 */

const BASE_URL = "https://schoolapp.ensam-umi.ac.ma";

// Endpoints
const LOGIN_URL = `${BASE_URL}/login`;
const INDEX_URL = `${BASE_URL}/index`;
const MODULES_URL = `${BASE_URL}/plan-etudes-view/modules`;
const FILIERES_URL = `${BASE_URL}/plan-etudes-view/filieres`;

// Student Grade Endpoints
const CURRENT_ELEM_URL = `${BASE_URL}/student/noteselem-encours`;
const CURRENT_MOD_URL = `${BASE_URL}/student/notesmod-encours`;
const ELEM_URL = `${BASE_URL}/student/noteselem`;
const MOD_URL = `${BASE_URL}/student/notesmod`;
const ANNEES_URL = `${BASE_URL}/student/notesannee`;
const SEMESTRES_URL = `${BASE_URL}/student/notessem`;

// Absence and Sanctions Endpoints
const ABSENCES_URL = `${BASE_URL}/student/absence/bilan`;
const SANCTIONS_URL = `${BASE_URL}/student/absence/sanctions`;

// Stats Endpoints
const EVAL_STAT_URL = `${BASE_URL}/notes-stat/elemevalsat`;
const MOD_STAT_URL = `${BASE_URL}/notes-stat/modsat`;
const ANNEE_STAT_URL = `${BASE_URL}/notes-stat/anneesat`;
const SEM_STAT_URL = `${BASE_URL}/notes-stat/semsat`;

// Default Headers
const DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
};

module.exports = {
    BASE_URL,
    LOGIN_URL,
    INDEX_URL,
    MODULES_URL,
    FILIERES_URL,
    CURRENT_ELEM_URL,
    CURRENT_MOD_URL,
    ELEM_URL,
    MOD_URL,
    ANNEES_URL,
    SEMESTRES_URL,
    ABSENCES_URL,
    SANCTIONS_URL,
    EVAL_STAT_URL,
    MOD_STAT_URL,
    ANNEE_STAT_URL,
    SEM_STAT_URL,
    DEFAULT_HEADERS
};
