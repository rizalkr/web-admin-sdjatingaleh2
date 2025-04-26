document.addEventListener('DOMContentLoaded', function() {
    // Pastikan user sudah login
    if (!checkAuth()) return;
    
    // Set event untuk form tambah guru
    const formGuru = document.getElementById('formGuru');
    formGuru.addEventListener('submit', handleAddTeacher);
    
    // Set event untuk tombol edit dan delete
    document.getElementById('teacherTableBody').addEventListener('click', handleTableActions);
    
    // Set event untuk form edit guru
    document.getElementById('btnSaveEdit').addEventListener('click', handleEditTeacher);
    
    // Set event untuk konfirmasi hapus guru
    document.getElementById('btnConfirmDelete').addEventListener('click', confirmDeleteTeacher);
    
    // Set event untuk pencarian
    document.getElementById('searchButton').addEventListener('click', handleSearch);
    document.getElementById('searchInput').addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            handleSearch();
        }
    });
    
    // Load data guru saat halaman dimuat
    loadTeachers();
});

// Fungsi untuk memuat data guru dari API
async function loadTeachers() {
    try {
        showLoading(true);
        
        const token = localStorage.getItem('token');
        const response = await fetch(`${CONFIG.API_URL}/api/teachers`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                // Token tidak valid, redirect ke login
                localStorage.removeItem('token');
                window.location.href = 'login.html';
                return;
            }
            throw new Error('Gagal memuat data guru');
        }
        
        const result = await response.json();
        renderTeachers(result.data || result);
    } catch (error) {
        console.error('Error loading teachers:', error);
        alert('Gagal memuat data guru. Silakan coba lagi.');
    } finally {
        showLoading(false);
    }
}

// Fungsi untuk menampilkan data guru ke dalam tabel
function renderTeachers(teachers) {
    const tbody = document.getElementById('teacherTableBody');
    tbody.innerHTML = '';
    
    if (!teachers || teachers.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="7" class="text-center">Tidak ada data guru</td>';
        tbody.appendChild(tr);
        return;
    }
    
    teachers.forEach(teacher => {
        const tr = document.createElement('tr');
        
        const imageUrl = teacher.image 
            ? `${CONFIG.API_URL}/${teacher.image.replace('public/', '')}`
            : 'assets/img/default-user.png';
            
        // Perubahan di sini: Hapus onerror inline dan ganti dengan event listener
        tr.innerHTML = `
            <td>${teacher.id}</td>
            <td><img src="${imageUrl}" alt="Foto ${teacher.name}" class="teacher-image" data-full-image="${imageUrl}"></td>
            <td>${teacher.nuptk || '-'}</td>
            <td>${teacher.name}</td>
            <td>${teacher.subject || '-'}</td>
            <td>${teacher.email || '-'}</td>
            <td>
                <button class="btn btn-primary btn-sm me-1 btn-edit" data-id="${teacher.id}">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-danger btn-sm btn-delete" data-id="${teacher.id}" data-name="${teacher.name}">
                    <i class="fas fa-trash"></i> Hapus
                </button>
            </td>
        `;
        tbody.appendChild(tr);
        
        // Tambahkan event handler untuk gambar setelah ditambahkan ke DOM
        const img = tr.querySelector('.teacher-image');
        img.addEventListener('error', function() {
            // Cek apakah sudah menggunakan gambar default untuk menghindari infinite loop
            if (!this.hasAttribute('data-using-default')) {
                this.setAttribute('data-using-default', 'true');
                this.src = 'assets/img/default-user.png';
                console.log('Using default image');
            }
        });
    });
    
    // Setup event listener untuk klik gambar
    setupImageClickHandlers();
}

// Tambahkan fungsi ini setelah renderTeachers
function setupImageClickHandlers() {
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("fullSizeImage");
    const closeBtn = document.querySelector(".image-modal-close");
    
    // Get all teacher images
    const images = document.querySelectorAll(".teacher-image");
    
    // Add click event to each image
    images.forEach(img => {
        img.addEventListener("click", function() {
            modal.style.display = "block";
            modalImg.src = this.getAttribute("data-full-image");
        });
    });
    
    // Close modal when clicking X
    closeBtn.addEventListener("click", function() {
        modal.style.display = "none";
    });
    
    // Close modal when clicking outside the image
    modal.addEventListener("click", function(e) {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });
}

// Tambahkan juga setup image click di bagian document ready
document.addEventListener('DOMContentLoaded', function() {
    // Kode yang sudah ada
    
    // Setup handler untuk klik pada gambar 
    document.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('teacher-image')) {
            const modal = document.getElementById("imageModal");
            const modalImg = document.getElementById("fullSizeImage");
            modal.style.display = "block";
            modalImg.src = e.target.getAttribute("data-full-image");
        }
    });
});
// Fungsi untuk menambah guru baru
async function handleAddTeacher(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Menyimpan...';
    
    try {
        const formData = new FormData();
        formData.append('nuptk', document.getElementById('inputNUPTK').value);
        formData.append('name', document.getElementById('inputNama').value);
        formData.append('subject', document.getElementById('inputKelas').value);
        formData.append('email', document.getElementById('inputWaliKelas').value);
        // Tambahkan username - generatedkan saja dari name (tanpa spasi, lowercase)
        const username = document.getElementById('inputNama').value
            .toLowerCase()
            .replace(/\s+/g, '')
            .replace(/[^a-z0-9]/gi, '');
        formData.append('username', username);
        
        const imageInput = document.getElementById('inputImage');
        if (imageInput.files.length > 0) {
            formData.append('image', imageInput.files[0]);
        }
        
        const token = localStorage.getItem('token');
        const response = await fetch(`${CONFIG.API_URL}/api/teachers`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gagal menambahkan guru: ${errorText}`);
        }
        
        // Reset form
        document.getElementById('formGuru').reset();
        
        // Reload data guru
        loadTeachers();
        
        alert('Data guru berhasil ditambahkan');
    } catch (error) {
        console.error('Error adding teacher:', error);
        alert('Gagal menambahkan data guru. Silakan coba lagi.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// Fungsi untuk menangani aksi pada tabel (edit dan delete)
function handleTableActions(event) {
    const target = event.target.closest('button');
    if (!target) return;
    
    const id = target.dataset.id;
    
    if (target.classList.contains('btn-edit')) {
        showEditModal(id);
    } else if (target.classList.contains('btn-delete')) {
        const name = target.dataset.name;
        showDeleteModal(id, name);
    }
}

// Fungsi untuk menampilkan modal edit
async function showEditModal(id) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${CONFIG.API_URL}/api/teachers/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Gagal memuat data guru');
        }
        
        const result = await response.json();
        const teacher = result.data || result;
        
        // Populate form fields
        document.getElementById('editId').value = teacher.id;
        document.getElementById('editNUPTK').value = teacher.nuptk || '';
        document.getElementById('editNama').value = teacher.name || '';
        document.getElementById('editKelas').value = teacher.subject || '';
        document.getElementById('editWaliKelas').value = teacher.email || '';
        
        // Show current image if exists
        const currentImage = document.getElementById('currentImage');
        if (teacher.image) {
            currentImage.src = `h${CONFIG.API_URL}/${teacher.image.replace('public/', '')}`; // Path sudah termasuk public/
            currentImage.onerror = function() {
                this.src = 'assets/img/default-user.png';
                console.log('Edit modal: Image failed to load:', this.src);
            };
            document.getElementById('currentImageContainer').style.display = 'block';
        } else {
            document.getElementById('currentImageContainer').style.display = 'none';
        }
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editGuruModal'));
        modal.show();
    } catch (error) {
        console.error('Error fetching teacher details:', error);
        alert('Gagal memuat detail guru. Silakan coba lagi.');
    }
}

// Fungsi untuk menyimpan perubahan data guru
async function handleEditTeacher() {
    const id = document.getElementById('editId').value;
    const btnSave = document.getElementById('btnSaveEdit');
    const originalText = btnSave.innerHTML;
    
    btnSave.disabled = true;
    btnSave.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Menyimpan...';
    
    try {
        const formData = new FormData();
        formData.append('nuptk', document.getElementById('editNUPTK').value);
        formData.append('name', document.getElementById('editNama').value);
        formData.append('subject', document.getElementById('editKelas').value);
        formData.append('email', document.getElementById('editWaliKelas').value);
        
        const imageInput = document.getElementById('editImage');
        if (imageInput.files.length > 0) {
            formData.append('image', imageInput.files[0]);
        }
        
        const token = localStorage.getItem('token');
        const response = await fetch(`${CONFIG.API_URL}/api/teachers/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gagal memperbarui data guru: ${errorText}`);
        }
        
        // Reload data guru
        loadTeachers();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editGuruModal'));
        modal.hide();
        
        alert('Data guru berhasil diperbarui');
    } catch (error) {
        console.error('Error updating teacher:', error);
        alert('Gagal memperbarui data guru. Silakan coba lagi.');
    } finally {
        btnSave.disabled = false;
        btnSave.innerHTML = originalText;
    }
}

// Fungsi untuk menampilkan modal konfirmasi hapus
function showDeleteModal(id, name) {
    document.getElementById('deleteGuruName').textContent = name;
    document.getElementById('btnConfirmDelete').dataset.id = id;
    
    const modal = new bootstrap.Modal(document.getElementById('deleteGuruModal'));
    modal.show();
}

// Fungsi untuk menghapus data guru
async function confirmDeleteTeacher() {
    const id = document.getElementById('btnConfirmDelete').dataset.id;
    const btnDelete = document.getElementById('btnConfirmDelete');
    const originalText = btnDelete.innerHTML;
    
    btnDelete.disabled = true;
    btnDelete.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Menghapus...';
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${CONFIG.API_URL}/api/teachers/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Gagal menghapus data guru');
        }
        
        // Reload data guru
        loadTeachers();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteGuruModal'));
        modal.hide();
        
        alert('Data guru berhasil dihapus');
    } catch (error) {
        console.error('Error deleting teacher:', error);
        alert('Gagal menghapus data guru. Silakan coba lagi.');
    } finally {
        btnDelete.disabled = false;
        btnDelete.innerHTML = originalText;
    }
}

// Fungsi untuk pencarian guru
function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const rows = document.querySelectorAll('#teacherTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Fungsi untuk menampilkan/menyembunyikan loading spinner
function showLoading(show) {
    document.getElementById('loadingSpinner').style.display = show ? 'block' : 'none';
    document.getElementById('dataTable').style.display = show ? 'none' : 'table';
}