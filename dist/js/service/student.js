document.addEventListener('DOMContentLoaded', function() {
    // Pastikan user sudah login
    if (!checkAuth()) return;
    
    // Set event untuk form tambah murid
    const formMurid = document.getElementById('formMurid');
    formMurid.addEventListener('submit', handleAddStudent);
    
    // Set event untuk tombol edit dan delete
    document.getElementById('studentTableBody').addEventListener('click', handleTableActions);
    
    // Set event untuk form edit murid
    document.getElementById('btnSaveEdit').addEventListener('click', handleEditStudent);
    
    // Set event untuk konfirmasi hapus murid
    document.getElementById('btnConfirmDelete').addEventListener('click', confirmDeleteStudent);
    
    // Set event untuk pencarian
    document.getElementById('searchButton').addEventListener('click', handleSearch);
    document.getElementById('searchInput').addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            handleSearch();
        }
    });
    
    // Set event untuk filter kelas
    document.getElementById('filterAll').addEventListener('click', function() { filterByClass('all'); });
    document.getElementById('filterKelas1').addEventListener('click', function() { filterByClass('1'); });
    document.getElementById('filterKelas2').addEventListener('click', function() { filterByClass('2'); });
    document.getElementById('filterKelas3').addEventListener('click', function() { filterByClass('3'); });
    document.getElementById('filterKelas4').addEventListener('click', function() { filterByClass('4'); });
    document.getElementById('filterKelas5').addEventListener('click', function() { filterByClass('5'); });
    document.getElementById('filterKelas6').addEventListener('click', function() { filterByClass('6'); });
    
    // Load data murid saat halaman dimuat
    loadStudents();
});

// Fungsi untuk memuat data murid dari API
async function loadStudents() {
    try {
        showLoading(true);
        
        const token = localStorage.getItem('token');
        const response = await fetch(`${CONFIG.API_URL}/api/students`, {
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
            throw new Error('Gagal memuat data murid');
        }
        
        const result = await response.json();
        renderStudents(result.data || result);
    } catch (error) {
        console.error('Error loading students:', error);
        alert('Gagal memuat data murid. Silakan coba lagi.');
    } finally {
        showLoading(false);
    }
}

// Fungsi untuk menampilkan data murid ke dalam tabel
function renderStudents(students) {
    const tbody = document.getElementById('studentTableBody');
    tbody.innerHTML = '';
    
    if (!students || students.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="7" class="text-center">Tidak ada data murid</td>';
        tbody.appendChild(tr);
        return;
    }
    
    students.forEach(student => {
        const tr = document.createElement('tr');       
        // Gabungkan class dan spesifiClass (mis. 1 + A = 1A)
        const kelas = student.class && student.spesifiClass 
            ? `${student.class}${student.spesifiClass}` 
            : '-';
        
        const imageUrl = student.image 
            ? `${CONFIG.API_URL}/${student.image.replace('public/', '')}` 
            : 'assets/img/default-student.png';
            
        tr.innerHTML = `
            <td>${student.id}</td>
            <td><img src="${imageUrl}" alt="Foto ${student.name}" class="student-image" data-full-image="${imageUrl}"></td>
            <td>${student.nisn || '-'}</td>
            <td>${student.name}</td>
            <td>${student.address || '-'}</td>
            <td>${kelas}</td>
            <td>${student.parent || '-'}</td>
            <td>
                <button class="btn btn-primary btn-sm me-1 btn-edit" data-id="${student.id}">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-danger btn-sm btn-delete" data-id="${student.id}" data-name="${student.name}">
                    <i class="fas fa-trash"></i> Hapus
                </button>
            </td>
        `;
        tbody.appendChild(tr);
        
        // Tambahkan event handler untuk gambar setelah ditambahkan ke DOM
        const img = tr.querySelector('.student-image');
        img.addEventListener('error', function() {
            if (!this.hasAttribute('data-using-default')) {
                this.setAttribute('data-using-default', 'true');
                this.src = 'assets/img/default-student.png';
                console.log('Using default image');
            }
        });
    });
    
    // Setup event listener untuk klik gambar
    setupImageClickHandlers();
}
// Tambahkan fungsi setupImageClickHandlers
function setupImageClickHandlers() {
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("fullSizeImage");
    const closeBtn = document.querySelector(".image-modal-close");
    
    // Get all student images
    const images = document.querySelectorAll(".student-image");
    
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

// Fungsi untuk filter berdasarkan kelas
function filterByClass(classFilter) {
    const tableRows = document.querySelectorAll('#studentTableBody tr');
    
    // Hapus highlight dari semua tombol
    document.querySelectorAll('.btn-group [id^="filter"]').forEach(button => {
        button.classList.remove('active');
    });
    
    // Tambahkan highlight ke tombol yang aktif
    document.getElementById(classFilter === 'all' ? 'filterAll' : `filterKelas${classFilter}`).classList.add('active');
    
    tableRows.forEach(row => {
        const classCell = row.querySelector('td:nth-child(6)').textContent;
        
        if (classFilter === 'all' || classCell.startsWith(classFilter)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}
// Fungsi untuk menambah murid baru
async function handleAddStudent(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Menyimpan...';
    
    try {
        // Sesuaikan field dengan struktur API
        const formData = new FormData();
        formData.append('nisn', document.getElementById('inputNISN').value);
        formData.append('name', document.getElementById('inputNama').value);
        
        // Pisahkan kelas menjadi class dan spesifiClass (misal 1A → class=1, spesifiClass=A)
        const kelasValue = document.getElementById('inputKelas').value; // mis: "1A"
        const classValue = kelasValue.charAt(0); // Ambil digit pertama: "1"
        const spesifiClassValue = kelasValue.substring(1); // Ambil karakter selanjutnya: "A"
        
        formData.append('class', classValue);
        formData.append('spesifiClass', spesifiClassValue);
        
        // Sesuaikan field lain
        formData.append('parent', document.getElementById('inputNamaOrangTua').value);
        formData.append('address', document.getElementById('inputAlamat').value);
        formData.append('age', '0'); // Tambahkan nilai default jika diperlukan
        
        const imageInput = document.getElementById('inputImage');
        if (imageInput.files.length > 0) {
            formData.append('image', imageInput.files[0]);
        }
        
        const token = localStorage.getItem('token');
        const response = await fetch(`${CONFIG.API_URL}/api/students`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gagal menambahkan murid: ${errorText}`);
        }
        
        // Reset form
        document.getElementById('formMurid').reset();
        
        // Reload data murid
        loadStudents();
        
        alert('Data murid berhasil ditambahkan');
    } catch (error) {
        console.error('Error adding student:', error);
        alert('Gagal menambahkan data murid: ' + error.message);
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
        const response = await fetch(`${CONFIG.API_URL}/api/students/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Gagal memuat data murid');
        }
        
        const result = await response.json();
        const student = result.data || result;
        
        // Gabungkan class dan spesifiClass untuk dropdown kelas
        const kelas = student.class && student.spesifiClass 
            ? `${student.class}${student.spesifiClass}` 
            : '';
        
        // Populate form fields
        document.getElementById('editId').value = student.id;
        document.getElementById('editNISN').value = student.nisn || '';
        document.getElementById('editNama').value = student.name || '';
        document.getElementById('editKelas').value = kelas;
        document.getElementById('editNamaOrangTua').value = student.parent || '';
        document.getElementById('editAlamat').value = student.address || '';
        
        // Show current image if exists
        const currentImage = document.getElementById('currentImage');
        if (student.image) {
            currentImage.src = `${CONFIG.API_URL}/${student.image.replace('public/', '')}`;
            currentImage.onerror = function() {
                this.src = 'assets/img/default-student.png';
                console.log('Edit modal: Image failed to load:', this.src);
            };
            document.getElementById('currentImageContainer').style.display = 'block';
        } else {
            document.getElementById('currentImageContainer').style.display = 'none';
        }
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editMuridModal'));
        modal.show();
    } catch (error) {
        console.error('Error fetching student details:', error);
        alert('Gagal memuat detail murid. Silakan coba lagi.');
    }
}

// Fungsi untuk menyimpan perubahan data murid
async function handleEditStudent() {
    const id = document.getElementById('editId').value;
    const btnSave = document.getElementById('btnSaveEdit');
    const originalText = btnSave.innerHTML;
    
    btnSave.disabled = true;
    btnSave.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Menyimpan...';
    
    try {
        const formData = new FormData();
        formData.append('nisn', document.getElementById('editNISN').value);
        formData.append('name', document.getElementById('editNama').value);
        
        // Pisahkan kelas menjadi class dan spesifiClass
        const kelasValue = document.getElementById('editKelas').value; // mis: "1A"
        const classValue = kelasValue.charAt(0); // Ambil digit pertama: "1"
        const spesifiClassValue = kelasValue.substring(1); // Ambil karakter selanjutnya: "A"
        
        formData.append('class', classValue);
        formData.append('spesifiClass', spesifiClassValue);
        
        // Sesuaikan field lain
        formData.append('parent', document.getElementById('editNamaOrangTua').value);
        formData.append('address', document.getElementById('editAlamat').value);
        
        const imageInput = document.getElementById('editImage');
        if (imageInput.files.length > 0) {
            formData.append('image', imageInput.files[0]);
        }
        
        const token = localStorage.getItem('token');
        const response = await fetch(`${CONFIG.API_URL}/api/students/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gagal memperbarui data murid: ${errorText}`);
        }
        
        // Reload data murid
        loadStudents();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editMuridModal'));
        modal.hide();
        
        alert('Data murid berhasil diperbarui');
    } catch (error) {
        console.error('Error updating student:', error);
        alert('Gagal memperbarui data murid: ' + error.message);
    } finally {
        btnSave.disabled = false;
        btnSave.innerHTML = originalText;
    }
}
// Fungsi untuk menampilkan modal konfirmasi hapus
function showDeleteModal(id, name) {
    document.getElementById('deleteMuridName').textContent = name;
    document.getElementById('btnConfirmDelete').dataset.id = id;
    
    const modal = new bootstrap.Modal(document.getElementById('deleteMuridModal'));
    modal.show();
}

// Fungsi untuk menghapus data murid
async function confirmDeleteStudent() {
    const id = document.getElementById('btnConfirmDelete').dataset.id;
    const btnDelete = document.getElementById('btnConfirmDelete');
    const originalText = btnDelete.innerHTML;
    
    btnDelete.disabled = true;
    btnDelete.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Menghapus...';
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${CONFIG.API_URL}/api/students/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Gagal menghapus data murid');
        }
        
        // Reload data murid
        loadStudents();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteMuridModal'));
        modal.hide();
        
        alert('Data murid berhasil dihapus');
    } catch (error) {
        console.error('Error deleting student:', error);
        alert('Gagal menghapus data murid. Silakan coba lagi.');
    } finally {
        btnDelete.disabled = false;
        btnDelete.innerHTML = originalText;
    }
}

// Fungsi untuk pencarian murid
function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const rows = document.querySelectorAll('#studentTableBody tr');
    
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