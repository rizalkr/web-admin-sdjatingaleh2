document.addEventListener('DOMContentLoaded', function() {
    // Pastikan user sudah login
    if (!checkAuth()) return;
    
    // Load semua data untuk dashboard
    loadTeachersSummary();
    loadComplaintsSummary(); 
    loadStudentsSummary();
    loadNewsSummary();
});

// Fungsi untuk memuat ringkasan data guru
async function loadTeachersSummary() {
    try {
        showLoading('teacherTableBody');
        
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/teachers?limit=5', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Gagal memuat data guru');
        }
        
        const result = await response.json();
        const teachers = result.data || result;
        
        const tbody = document.getElementById('teacherTableBody');
        tbody.innerHTML = '';
        
        if (!teachers || teachers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Tidak ada data guru</td></tr>';
            return;
        }
        
        teachers.forEach(teacher => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${teacher.id}</td>
                <td>${teacher.nuptk || '-'}</td>
                <td>${teacher.name}</td>
                <td>${teacher.subject || '-'}</td>
                <td>${teacher.email || '-'}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading teacher summary:', error);
        document.getElementById('teacherTableBody').innerHTML = 
            '<tr><td colspan="5" class="text-center text-danger">Gagal memuat data guru</td></tr>';
    }
}

// Fungsi untuk memuat ringkasan data aduan
async function loadComplaintsSummary() {
    try {
        showLoading('complaintTableBody');
        
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/complaints?limit=5', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Gagal memuat data aduan');
        }
        
        const result = await response.json();
        const complaints = result.data || result;
        
        const tbody = document.getElementById('complaintTableBody');
        tbody.innerHTML = '';
        
        if (!complaints || complaints.length === 0) {
            tbody.innerHTML = '<tr><td colspan="2" class="text-center">Tidak ada data aduan</td></tr>';
            return;
        }
        
        complaints.forEach(complaint => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${complaint.namaPengadu || '-'}</td>
                <td>${complaint.pesanAduan || '-'}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading complaints summary:', error);
        document.getElementById('complaintTableBody').innerHTML = 
            '<tr><td colspan="2" class="text-center text-danger">Gagal memuat data aduan</td></tr>';
    }
}

// Fungsi untuk memuat ringkasan data murid
async function loadStudentsSummary() {
    try {
        showLoading('studentTableBody');
        
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/students?limit=10', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Gagal memuat data murid');
        }
        
        const result = await response.json();
        const students = result.data || result;
        
        const tbody = document.getElementById('studentTableBody');
        tbody.innerHTML = '';
        
        if (!students || students.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">Tidak ada data murid</td></tr>';
            return;
        }
        
        students.forEach(student => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${student.id}</td>
                <td>${student.nisn || '-'}</td>
                <td>${student.name}</td>
                <td>${student.class || '-'}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading students summary:', error);
        document.getElementById('studentTableBody').innerHTML = 
            '<tr><td colspan="4" class="text-center text-danger">Gagal memuat data murid</td></tr>';
    }
}

// Fungsi untuk memuat ringkasan berita
async function loadNewsSummary() {
    try {
        showLoading('newsTableBody');
        
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/news?limit=10', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Gagal memuat data berita');
        }
        
        const result = await response.json();
        const newsList = result.data || result;
        
        const tbody = document.getElementById('newsTableBody');
        tbody.innerHTML = '';
        
        if (!newsList || newsList.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">Tidak ada data berita</td></tr>';
            return;
        }
        
        newsList.forEach(news => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${news.id}</td>
                <td>${news.title}</td>
                <td>${new Date(news.createdAt).toLocaleDateString()}</td>
                <td>${news.status === 'published' ? '<span class="badge bg-success">Published</span>' : '<span class="badge bg-warning">Draft</span>'}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading news summary:', error);
        document.getElementById('newsTableBody').innerHTML = 
            '<tr><td colspan="4" class="text-center text-danger">Gagal memuat data berita</td></tr>';
    }
}

// Fungsi untuk menampilkan loading
function showLoading(tableId) {
    document.getElementById(tableId).innerHTML = `
        <tr>
            <td colspan="10" class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Memuat data...</p>
            </td>
        </tr>
    `;
}