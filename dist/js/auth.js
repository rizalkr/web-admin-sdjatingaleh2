document.addEventListener('DOMContentLoaded', function() {   
    // Cek apakah halaman adalah login.html
    if (!window.location.pathname.includes('login.html')) {
        // Periksa token saat memuat halaman (kecuali di halaman login)
        checkAuth();
        
        // Tambahkan event listener untuk tombol logout
        const logoutBtn = document.getElementById('logout');
        if (logoutBtn) {
            console.log('Logout button found, adding listener');
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Logout clicked');
                logout();
            });
        } else {
            console.warn('Logout button not found');
        }
    }
});

// Fungsi untuk memeriksa autentikasi
function checkAuth() {
    const token = localStorage.getItem('token');
    console.log('Checking auth token:', token ? 'Token exists' : 'No token');
    
    if (!token) {
        console.log('No token found, redirecting to login');
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Fungsi untuk logout
function logout() {
    console.log('Performing logout');
    localStorage.removeItem('token');
    console.log('Token removed, redirecting to login');
    window.location.href = 'login.html';
}