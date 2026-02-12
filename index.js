/**
 * SchoolApp.js - Professional School App API Client
 * 
 * A JavaScript library for interacting with the SchoolApp platform.
 * Provides clean, object-oriented access to grades, attendance, and profile data.
 */

const { SchoolAppClient } = require('./src/school_app_client.js');
const { HTTPClient } = require('./src/http_client.js');
const { AuthManager } = require('./src/auth.js');

// Export main classes
module.exports = {
    SchoolAppClient,
    HTTPClient,
    AuthManager,
    VERSION: '2.2.0',
};

// Re-export types and managers for convenience
try {
    Object.assign(module.exports, require('./src/types/index.js'));
    Object.assign(module.exports, require('./src/managers/index.js'));
} catch (e) {
    // Ignore if these files don't exist or have issues
    console.warn('Warning: Could not load additional exports:', e.message);
}
