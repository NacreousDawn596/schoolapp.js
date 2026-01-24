/**
 * Centralized constants for the School App API
 */

export const BASE_URL = "https://schoolapp.ensam-umi.ac.ma";

// Endpoints
export const LOGIN_URL = `${BASE_URL}/login`;
export const INDEX_URL = `${BASE_URL}/index`;
export const MODULES_URL = `${BASE_URL}/plan-etudes-view/modules`;
export const FILIERES_URL = `${BASE_URL}/plan-etudes-view/filieres`;

// Student Grade Endpoints
export const CURRENT_ELEM_URL = `${BASE_URL}/student/noteselem-encours`;
export const CURRENT_MOD_URL = `${BASE_URL}/student/notesmod-encours`;
export const ELEM_URL = `${BASE_URL}/student/noteselem`;
export const MOD_URL = `${BASE_URL}/student/notesmod`;
export const ANNEES_URL = `${BASE_URL}/student/notesannee`;
export const SEMESTRES_URL = `${BASE_URL}/student/notessem`;

// Absence and Sanctions Endpoints
export const ABSENCES_URL = `${BASE_URL}/student/absence/bilan`;
export const SANCTIONS_URL = `${BASE_URL}/student/absence/sanctions`;

// Stats Endpoints
export const EVAL_STAT_URL = `${BASE_URL}/notes-stat/elemevalsat`;
export const MOD_STAT_URL = `${BASE_URL}/notes-stat/modsat`;
export const ANNEE_STAT_URL = `${BASE_URL}/notes-stat/anneesat`;
export const SEM_STAT_URL = `${BASE_URL}/notes-stat/semsat`;

// Default Headers
export const DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
};
