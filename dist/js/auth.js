// Fungsi untuk memeriksa apakah user sudah login
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        // Redirect ke halaman login jika belum login
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Fungsi untuk logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Fungsi untuk mendapatkan token
function getToken() {
    return localStorage.getItem('token');
}

// Fungsi untuk mengirimkan API request dengan auth header
async function apiRequest(url, method = 'GET', data = null) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options = {
        method: method,
        headers: headers
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, options);
        
        // Jika status 401 (Unauthorized), redirect ke login
        if (response.status === 401) {
            logout();
            return null;
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

// Jalankan pemeriksaan auth saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    // Skip pengecekan untuk halaman login
    if (window.location.pathname.includes('login.html')) {
        return;
    }
    
    checkAuth();
    
    // Setup tombol logout
    const logoutButton = document.getElementById('logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
});