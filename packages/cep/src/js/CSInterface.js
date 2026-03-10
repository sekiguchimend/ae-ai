/**
 * CSInterface.js - Adobe CEP Communication Interface
 *
 * NOTE: This is a placeholder. In production, use the official CSInterface.js
 * from Adobe's CEP Resources:
 * https://github.com/Adobe-CEP/CEP-Resources/tree/master/CEP_11.x/CSInterface.js
 *
 * For development/testing outside of AE, this mock provides basic functionality.
 */

function CSInterface() {
    this.hostEnvironment = {
        appName: 'AEFT',
        appVersion: '24.0.0'
    };
}

CSInterface.prototype.evalScript = function(script, callback) {
    // In actual CEP environment, this communicates with ExtendScript
    // For development, we simulate a response
    if (typeof callback === 'function') {
        try {
            // Mock: Return the script as a string for testing
            setTimeout(function() {
                callback('{"success": true, "message": "Mock response"}');
            }, 100);
        } catch (e) {
            callback('EvalScript error.');
        }
    }
};

CSInterface.prototype.getHostEnvironment = function() {
    return this.hostEnvironment;
};

CSInterface.prototype.getSystemPath = function(pathType) {
    // SystemPath constants
    var paths = {
        USER_DATA: '/Users/user/Library/Application Support/Adobe',
        COMMON_FILES: '/Library/Application Support/Adobe',
        MY_DOCUMENTS: '/Users/user/Documents',
        APPLICATION: '/Applications/Adobe After Effects 2024',
        EXTENSION: ''
    };
    return paths[pathType] || '';
};

CSInterface.prototype.openURLInDefaultBrowser = function(url) {
    window.open(url, '_blank');
};

CSInterface.prototype.requestOpenExtension = function(extensionId) {
    console.log('Request to open extension: ' + extensionId);
};

CSInterface.prototype.closeExtension = function() {
    console.log('Closing extension');
};

// Make it available globally
window.CSInterface = CSInterface;
