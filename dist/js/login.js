document.addEventListener('DOMContentLoaded', function() {
    console.log('Login page loaded');
    
    // Cek jika sudah login, redirect ke dashboard
    if (localStorage.getItem('token')) {
        console.log('Token found, redirecting to dashboard');
        window.location.href = 'index.html';
        return;
    }

    // Handle form submission
    document.querySelector('form').addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Form submitted');
        
        const username = document.getElementById('inputUsername').value;
        const password = document.getElementById('inputPassword').value;
        
        console.log('Login attempt with username:', username);
        
        if (!username || !password) {
            alert('Username dan password harus diisi');
            return;
        }
        
        // Tampilkan loading
        const loginButton = document.querySelector('.btn-primary');
        const originalText = loginButton.textContent;
        loginButton.textContent = 'Loading...';
        loginButton.disabled = true;
        
        // Payload untuk debugging
        const payload = { username, password };
        console.log('Sending payload:', payload);
        
        // Kirim request ke API
        console.log('Sending request to: http://localhost:3000/api/auth/login');
        fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(response => {
            console.log('Response status:', response.status);
            
            // Cek jika response tidak OK
            if (!response.ok) {
                console.error('Non-OK response:', response.status, response.statusText);
                throw new Error('Login failed: ' + response.statusText);
            }
            
            return response.text();  // Dapatkan respons sebagai text dahulu
        })
        .then(text => {
            console.log('Raw response text:', text);
            
            // Coba parse response sebagai JSON
            try {
                const data = JSON.parse(text);
                console.log('Parsed response data:', data);
                
                // Periksa apakah ada token dalam respons
                if (data.token) {
                    console.log('Login successful, token received');
                    // Simpan token ke localStorage
                    localStorage.setItem('token', data.token);
                    
                    console.log('Token saved, redirecting to dashboard');
                    // Redirect ke dashboard
                    window.location.href = 'index.html';
                } else {
                    console.error('Login failed: No token in response');
                    alert('Login gagal: Token tidak ditemukan dalam respons');
                    loginButton.textContent = originalText;
                    loginButton.disabled = false;
                }
            } catch (e) {
                console.error('Failed to parse response as JSON:', e);
                alert('Format respons tidak valid');
                loginButton.textContent = originalText;
                loginButton.disabled = false;
            }
        })
        .catch(error => {
            console.error('Fetch error details:', error);
            alert('Terjadi kesalahan saat login: ' + error.message);
            loginButton.textContent = originalText;
            loginButton.disabled = false;
        });
    });

    // Log jika tombol login tidak ditemukan
    if (!document.querySelector('.btn-primary')) {
        console.error('Login button not found in DOM');
    }
});