document.addEventListener('DOMContentLoaded', function() {
    // Pastikan user sudah login
    if (!checkAuth()) return;
    
    // Set event untuk form upload gallery
    const uploadForm = document.getElementById('galleryUploadForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleUploadGallery);
    }
    
    // Event delegation untuk tombol delete di tabel
    const galleryTable = document.getElementById('galleryTable');
    if (galleryTable) {
        galleryTable.addEventListener('click', handleTableActions);
    }
    
    // Load data gallery saat halaman dimuat
    loadGallery();
});

// Fungsi untuk memuat data gallery dari API
async function loadGallery() {
    try {
        showLoading(true);
        
        const token = localStorage.getItem('token');
        // Gunakan CONFIG.API_URL
        const response = await fetch(`${CONFIG.API_URL}/api/gallery`, {
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
            throw new Error('Gagal memuat data gallery');
        }
        
        const result = await response.json();
        renderGallery(result.data || result);
    } catch (error) {
        console.error('Error loading gallery:', error);
        showError('Gagal memuat data gallery. Silakan coba lagi.');
    } finally {
        showLoading(false);
    }
}

// Fungsi untuk menampilkan data gallery ke dalam tabel
function renderGallery(galleryItems) {
    const tbody = document.querySelector('#galleryTable tbody');
    tbody.innerHTML = '';
    
    if (!galleryItems || galleryItems.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="5" class="text-center">Tidak ada data gallery</td>';
        tbody.appendChild(tr);
        return;
    }
    
    galleryItems.forEach(item => {
        const tr = document.createElement('tr');
        const imageUrl = item.foto 
            ? `${CONFIG.API_URL}/${item.foto.replace('public/', '')}` 
            : CONFIG.DEFAULT_IMAGE_PATH;
            
        tr.innerHTML = `
            <td>${item.id}</td>
            <td>${item.nama}</td>
            <td><img src="${imageUrl}" alt="Foto ${item.nama}" class="gallery-image" data-full-image="${imageUrl}" style="max-width:100px; max-height:100px; object-fit:cover;"></td>
            <td>${new Date(item.createdAt).toLocaleString()}</td>
            <td>
                <button class="btn btn-danger btn-sm btn-delete" data-id="${item.id}" data-name="${item.nama}">
                    <i class="fas fa-trash"></i> Hapus
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
        
        // Tambahkan event handler untuk gambar setelah ditambahkan ke DOM
        const img = tr.querySelector('.gallery-image');
        img.addEventListener('error', function() {
            // Cek apakah sudah menggunakan gambar default untuk menghindari infinite loop
            if (!this.hasAttribute('data-using-default')) {
                this.setAttribute('data-using-default', 'true');
                this.src = 'assets/img/default-image.png';
                console.log('Using default image');
            }
        });
    });
    
    // Setup event listener untuk klik gambar untuk memperbesar
    setupGalleryImageClickHandlers();
}

// Fungsi untuk menangani upload gallery
async function handleUploadGallery(event) {
    event.preventDefault();
    
    const submitBtn = document.querySelector('#galleryUploadForm button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Mengupload...';
    
    try {
        const formData = new FormData();
        formData.append('nama', document.getElementById('photoName').value);
        
        const photoFile = document.getElementById('photoFile').files[0];
        if (!photoFile) {
            throw new Error('Silakan pilih file gambar');
        }
        
        formData.append('foto', photoFile);
        
        const token = localStorage.getItem('token');
        const response = await fetch(`${CONFIG.API_URL}/api/gallery`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gagal mengupload gambar: ${errorText}`);
        }
        
        // Reset form
        document.getElementById('galleryUploadForm').reset();
        
        // Reload gallery
        loadGallery();
        
        alert('Gambar berhasil diupload');
    } catch (error) {
        console.error('Error uploading gallery item:', error);
        alert(error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// Fungsi untuk menangani aksi pada tabel (delete)
function handleTableActions(event) {
    const deleteBtn = event.target.closest('.btn-delete');
    if (!deleteBtn) return;
    
    const id = deleteBtn.dataset.id;
    const name = deleteBtn.dataset.name;
    
    if (confirm(`Apakah Anda yakin ingin menghapus "${name}"?`)) {
        deleteGalleryItem(id, deleteBtn);
    }
}

// Fungsi untuk menghapus item gallery
async function deleteGalleryItem(id, button) {
    const originalHtml = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${CONFIG.API_URL}/api/gallery/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Gagal menghapus gambar');
        }
        
        // Reload gallery
        loadGallery();
        
        alert('Gambar berhasil dihapus');
    } catch (error) {
        console.error('Error deleting gallery item:', error);
        alert('Gagal menghapus gambar. Silakan coba lagi.');
        button.disabled = false;
        button.innerHTML = originalHtml;
    }
}

// Fungsi untuk setup image click handlers
function setupGalleryImageClickHandlers() {
    // Cari modal atau buat modal jika belum ada
    let modal = document.getElementById("galleryImageModal");
    
    // Jika modal belum ada, buat elemen modal
    if (!modal) {
        modal = document.createElement('div');
        modal.id = "galleryImageModal";
        modal.className = "modal fade";
        modal.tabIndex = "-1";
        modal.setAttribute('aria-hidden', 'true');
        modal.innerHTML = `
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Preview Gambar</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body text-center">
                        <img id="fullSizeGalleryImage" src="" alt="Full Size Image" class="img-fluid">
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Inisialisasi modal Bootstrap
    const modalInstance = new bootstrap.Modal(modal);
    const modalImage = document.getElementById('fullSizeGalleryImage');
    
    // Tambahkan event listener ke semua gambar gallery
    const galleryImages = document.querySelectorAll('.gallery-image');
    galleryImages.forEach(img => {
        img.style.cursor = 'pointer';
        img.addEventListener('click', function() {
            modalImage.src = this.getAttribute('data-full-image');
            modalInstance.show();
        });
    });
}

// Fungsi untuk menampilkan/menyembunyikan loading
function showLoading(show) {
    // Cek jika sudah ada elemen loading
    let loadingSpinner = document.getElementById('galleryLoadingSpinner');
    
    // Jika belum ada dan perlu ditampilkan, buat elemen
    if (!loadingSpinner && show) {
        const tableParent = document.querySelector('#galleryTable').parentNode;
        loadingSpinner = document.createElement('div');
        loadingSpinner.id = 'galleryLoadingSpinner';
        loadingSpinner.className = 'text-center my-4';
        loadingSpinner.innerHTML = `
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Memuat data gallery...</p>
        `;
        tableParent.insertBefore(loadingSpinner, document.querySelector('#galleryTable'));
    }
    
    // Atur visibility
    if (loadingSpinner) {
        loadingSpinner.style.display = show ? 'block' : 'none';
    }
    
    document.querySelector('#galleryTable').style.display = show ? 'none' : 'table';
}

// Fungsi untuk menampilkan error
function showError(message) {
    alert(message);
}