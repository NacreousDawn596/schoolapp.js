/**
 * SchoolApp.js - Professional School App API Client
 * 
 * A JavaScript library for interacting with the SchoolApp platform.
 * Provides clean, object-oriented access to grades, attendance, and profile data.
 */

export { SchoolAppClient } from './src/school_app_client.js';
export { HTTPClient } from './src/http_client.js';
export { AuthManager } from './src/auth.js';

// Re-export types for convenience
export * from './src/types/index.js';

// Re-export managers for advanced usage
export * from './src/managers/index.js';

// Version
export const VERSION = '2.0.0';
