document.addEventListener('DOMContentLoaded', function () {
    // Pastikan user sudah login
    if (!checkAuth()) return;

    // Search functionality
    document.getElementById('searchButton').addEventListener('click', function() {
        const searchInput = document.getElementById('searchInput').value.toLowerCase();
        const tableRows = document.querySelectorAll('#dataTable tbody tr');

        tableRows.forEach(row => {
            const rowData = row.textContent.toLowerCase();
            row.style.display = rowData.includes(searchInput) ? '' : 'none';
        });
    });

    // Allow search on Enter key press
    document.getElementById('searchInput').addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            document.getElementById('searchButton').click();
        }
    });

    // Status filter buttons
    document.getElementById('filterAll').addEventListener('click', function() {
        filterByStatus('all');
    });

    document.getElementById('filterQueue').addEventListener('click', function() {
        filterByStatus('Dalam Antrian');
    });

    document.getElementById('filterRead').addEventListener('click', function() {
        filterByStatus('Dibaca');
    });

    document.getElementById('filterResolved').addEventListener('click', function() {
        filterByStatus('Resolved');
    });

    function filterByStatus(status) {
        const tableRows = document.querySelectorAll('#dataTable tbody tr');
        tableRows.forEach(row => {
            const statusCell = row.querySelector('td:nth-child(6)').textContent;
            row.style.display = (status === 'all' || statusCell.includes(status)) ? '' : 'none';
        });
    }

    // Status change and resolve buttons menggunakan event delegation
    document.querySelector('#dataTable tbody').addEventListener('click', function(event) {
        const target = event.target.closest('button');
        if (!target) return;

        // Handle status change
        if (target.classList.contains('btn-status')) {
            if (target.disabled) return;
            
            const row = target.closest('tr');
            const complaintId = row.querySelector('td:nth-child(1)').textContent;
            const statusCell = row.querySelector('td:nth-child(6) span');
            const newStatus = target.dataset.status === 'read' ? 'dibaca' : 'antrian';
            const newBadgeClass = target.dataset.status === 'read' ? 'bg-info' : 'bg-warning';
            
            // Show loading state
            target.disabled = true;
            const originalContent = target.innerHTML;
            target.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
            
            // Send API request to update status
            updateComplaintStatus(complaintId, newStatus)
                .then(success => {
                    if (success) {
                        // Update UI after successful API call
                        const displayText = newStatus === 'dibaca' ? 'Dibaca' : 'Dalam Antrian';
                        statusCell.textContent = displayText;
                        statusCell.className = `badge ${newBadgeClass}`;
                        
                        if (target.dataset.status === 'read') {
                            target.innerHTML = '<i class="fas fa-clock"></i> Antrian';
                            target.className = 'btn btn-warning btn-sm me-1 btn-status';
                            target.dataset.status = 'queue';
                        } else {
                            target.innerHTML = '<i class="fas fa-eye"></i> Dibaca';
                            target.className = 'btn btn-info btn-sm me-1 btn-status';
                            target.dataset.status = 'read';
                        }
                    } else {
                        // Restore button if failed
                        target.innerHTML = originalContent;
                        alert('Gagal mengupdate status. Silakan coba lagi.');
                    }
                })
                .finally(() => {
                    target.disabled = false;
                });
        }
        // Handle resolve button
        else if (target.classList.contains('btn-resolve')) {
            if (target.disabled) return;
            
            const row = target.closest('tr');
            const complaintId = row.querySelector('td:nth-child(1)').textContent;
            const statusCell = row.querySelector('td:nth-child(6) span');
            
            // Show loading state
            target.disabled = true;
            const originalContent = target.innerHTML;
            target.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
            
            // Send API request to update status - menggunakan 'terselesaikan' bukan 'resolved'
            updateComplaintStatus(complaintId, 'terselesaikan')
                .then(success => {
                    if (success) {
                        // Update UI after successful API call
                        statusCell.textContent = 'Resolved';
                        statusCell.className = 'badge bg-success';
                        
                        row.querySelectorAll('button').forEach(btn => {
                            btn.disabled = true;
                        });
                        target.innerHTML = '<i class="fas fa-check"></i> Resolved';
                    } else {
                        // Restore button if failed
                        target.innerHTML = originalContent;
                        target.disabled = false;
                        alert('Gagal menyelesaikan aduan. Silakan coba lagi.');
                    }
                });
        }
    });

    // Function to handle API updates
    async function updateComplaintStatus(complaintId, newStatus) {
        try {
            console.log(`Mengirim permintaan update status: ${complaintId} ke ${newStatus}`);
            
            // Get token from localStorage
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Token tidak ditemukan, redirect ke login');
                window.location.href = '../login.html';
                return false;
            }
            
            const response = await fetch(`http://localhost:3000/api/complaints/${complaintId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`  // Tambahkan token di header
                },
                body: JSON.stringify({ status: newStatus })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error updating status:', errorText);
                
                // Jika error 401, redirect ke login
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    window.location.href = '../login.html';
                }
                
                return false;
            }
            
            console.log(`Status berhasil diperbarui menjadi: ${newStatus}`);
            return true;
        } catch (error) {
            console.error('Error updating status:', error);
            return false;
        }
    }

    // Load data from API
    loadComplaints();
    
    async function loadComplaints() {
        try {
            const token = localStorage.getItem('token');
            const apiUrl = 'http://localhost:3000/api/complaints';
            
            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch complaints');
            }
            
            const result = await response.json();
            const aduanData = result.data;
            const tbody = document.querySelector('#dataTable tbody');
            tbody.innerHTML = '';
            
            aduanData.forEach(item => {
                const { badgeClass, displayText } = formatStatus(item.status);
                const tr = document.createElement('tr');
                
                // Tentukan status tombol berdasarkan status aduan
                const statusBtnText = item.status === 'antrian' ? 'Dibaca' : 'Antrian';
                const statusBtnIcon = item.status === 'antrian' ? 'fa-eye' : 'fa-clock';
                const statusBtnClass = item.status === 'antrian' ? 'btn-info' : 'btn-warning';
                const statusBtnDataStatus = item.status === 'antrian' ? 'read' : 'queue';
                
                // Tentukan apakah tombol harus dinonaktifkan
                const buttonsDisabled = item.status === 'terselesaikan' ? 'disabled' : '';
                
                tr.innerHTML = `
                    <td>${item.id}</td>
                    <td>${new Date(item.createdAt).toLocaleDateString()}</td>
                    <td>${item.namaPengadu}</td>
                    <td>${item.subject || ''}</td>
                    <td>${item.pesanAduan}</td>
                    <td><span class="badge ${badgeClass}">${displayText}</span></td>
                    <td>
                        <button class="btn ${statusBtnClass} btn-sm me-1 btn-status" data-status="${statusBtnDataStatus}" ${buttonsDisabled}>
                            <i class="fas ${statusBtnIcon}"></i> ${statusBtnText}
                        </button>
                        <button class="btn btn-success btn-sm btn-resolve" ${buttonsDisabled}>
                            <i class="fas fa-check"></i> Resolve
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    function formatStatus(status) {
        let badgeClass = 'bg-secondary';
        let displayText = status;
        if (status === 'antrian') {
            badgeClass = 'bg-warning';
            displayText = 'Dalam Antrian';
        } else if (status === 'dibaca') {
            badgeClass = 'bg-info';
            displayText = 'Dibaca';
        } else if (status === 'terselesaikan') {
            badgeClass = 'bg-success';
            displayText = 'Resolved';
        }
        return { badgeClass, displayText };
    }
});