// Auto-detect environment dan pilih URL yang sesuai
const CONFIG = (function() {
    // Deteksi environment berdasarkan hostname
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
    
    const isDevelopment = isLocalhost || window.location.hostname.includes('dev.');
    const isStaging = window.location.hostname.includes('staging.');
    
    // Tentukan API URL berdasarkan environment
    let apiUrl = 'https://api.sdnjatingaleh2.com'; // Production default
    
    if (isLocalhost) {
        apiUrl = 'http://127.0.0.1:3000'; // Local development
    } else if (isDevelopment) {
        apiUrl = 'https://dev-api.sdnjatingaleh2.com'; // Development server
    } else if (isStaging) {
        apiUrl = 'https://staging-api.sdnjatingaleh2.com'; // Staging server
    }
    
    return {
        API_URL: apiUrl,
        DEFAULT_IMAGE_PATH: 'assets/img/default-image.png',
        DEFAULT_USER_IMAGE: 'assets/img/default-user.png',
        DEFAULT_STUDENT_IMAGE: 'assets/img/default-student.png',
        APP_NAME: 'SDN Jatingaleh 2 Admin',
        ENVIRONMENT: isLocalhost ? 'development' : (isStaging ? 'staging' : 'production')
    };
})();

console.log(`Running in ${CONFIG.ENVIRONMENT} mode with API: ${CONFIG.API_URL}`);