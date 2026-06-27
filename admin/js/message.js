const API_URL =
    window.location.hostname === "localhost"
        ? "http://localhost:5000/api"
        : "https://portfolio-wu0n.onrender.com/api";

// Admin Dashboard Logic
async function verifyAdmin() {

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.replace("/admin/login.html");
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/auth/me`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error("Unauthorized");
        }

        const data = await response.json();

        console.log(data.admin);

    } catch (error) {

        localStorage.removeItem("token");
        localStorage.removeItem("admin");

        window.location.replace("/admin/login.html");
    }
}

async function apiFetch(url, options = {}) {
    const token = localStorage.getItem("token");

    console.log("TOKEN:", token);

    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...(options.headers || {})
        }
    });

    return response;
}

// ============================================
// MESSAGES PAGE - Full Detail View
// ============================================

document.addEventListener('DOMContentLoaded', async () => {

    await verifyAdmin();

    // ELEMENTS
    const messagesList = document.getElementById('messagesList');
    const emptyState = document.getElementById('emptyState');
    const searchInput = document.getElementById('searchInput');
    const filterSelect = document.getElementById('filterSelect');
    const prevPage = document.getElementById('prevPage');
    const nextPage = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    const totalCount = document.getElementById('totalCount');
    const unreadCount = document.getElementById('unreadCount');
    const readCount = document.getElementById('readCount');
    const archivedCount = document.getElementById('archivedCount');
    const newMessagesBadge = document.getElementById('newMessagesBadge');
    const refreshBtn = document.getElementById('refreshBtn');
    const themeBtn = document.getElementById('themeBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const loadingScreen = document.getElementById('loadingScreen');
    const todayEl = document.getElementById('today');

    // Modal Elements
    const modal = document.getElementById('messageModal');
    const modalBody = document.getElementById('modalBody');
    const closeModal = document.getElementById('closeModal');
    const markReadBtn = document.getElementById('markReadBtn');
    const archiveBtn = document.getElementById('archiveBtn');
    const restoreBtn = document.getElementById('restoreBtn');
    const deleteBtn = document.getElementById('deleteBtn');

    // Bulk Actions
    const bulkSelectBtn = document.getElementById('bulkSelectBtn');
    const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
    const bulkArchiveBtn = document.getElementById('bulkArchiveBtn');

    // Stat filters
    const statItems = document.querySelectorAll('.stat-item');
    // ==========================================
    // STATE
    // ==========================================
    let messages = [];
    let filteredMessages = [];
    let currentPage = 1;
    const itemsPerPage = 10;
    let selectedIds = new Set();
    let currentViewingId = null;
    let currentFilter = 'all';

    // ==========================================
    // INITIALIZATION
    // ==========================================
    await loadMessages();
    await updateStats();

    applyTheme();

    hideLoading();

    function setToday() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        todayEl.textContent = now.toLocaleDateString('en-US', options);
    }

    function hideLoading() {
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
        }, 500);
    }

    // ==========================================
    // LOAD MESSAGES
    // ==========================================
    async function loadMessages() {
        try {
            const response = await apiFetch(`${API_URL}/messages`);

            if (!response) return;

            const data = await response.json();

            messages = data.messages || data;

            applyFilters();
        } catch (error) {
            console.error(error);
            showToast("Failed to load messages", "error");
        }
    }
    // ==========================================
    // FILTER & SEARCH
    // ==========================================
    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const statusFilter = filterSelect.value;

        filteredMessages = messages.filter(msg => {
            const matchesSearch =
                msg.name.toLowerCase().includes(searchTerm) ||
                msg.email.toLowerCase().includes(searchTerm) ||
                msg.subject.toLowerCase().includes(searchTerm);

            const matchesStatus = statusFilter === 'all' || msg.status === statusFilter;

            return matchesSearch && matchesStatus;
        });

        // Sort by date (newest first)
        filteredMessages.sort((a, b) => b.date - a.date);

        currentPage = 1;
        updateStats();
        renderMessages();
    }

    // ==========================================
    // UPDATE STATS
    // ==========================================
    async function updateStats() {
        try {

            const response = await apiFetch(
                `${API_URL}/messages/stats`
            );

            if (!response) return;

            const data = await response.json();

            totalCount.textContent = data.stats.total;
            unreadCount.textContent = data.stats.unread;
            readCount.textContent = data.stats.read;
            archivedCount.textContent = data.stats.archived;
            newMessagesBadge.textContent = data.stats.unread;

        } catch (error) {
            console.error(error);
        }
    }
    // ==========================================
    // RENDER MESSAGES
    // ==========================================
    function renderMessages() {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageItems = filteredMessages.slice(start, end);

        if (pageItems.length === 0) {
            messagesList.innerHTML = '';
            emptyState.classList.add('visible');
            updatePagination();
            return;
        }

        emptyState.classList.remove('visible');

        messagesList.innerHTML = pageItems.map(msg => {
            const isSelected = selectedIds.has(msg.id);
            const isUnread = msg.status === 'new';
            const initials = msg.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            const statusClass = msg.status;
            const dateStr = formatDate(msg.date);

            return `
        <div class="message-item ${isUnread ? 'unread' : ''} ${isSelected ? 'selected' : ''}" data-id="${msg.id}">
          <input type="checkbox" class="message-checkbox" ${isSelected ? 'checked' : ''}>
          
          <div class="message-avatar ${isUnread ? 'unread-avatar' : ''}">
            ${initials}
          </div>
          
          <div class="message-name">
            ${escapeHtml(msg.name)}
            <span class="email-sub">${escapeHtml(msg.email)}</span>
          </div>
          
          <div class="message-subject" title="${escapeHtml(msg.subject)}">
            ${escapeHtml(msg.subject)}
          </div>
          
          <div class="message-preview" title="${escapeHtml(msg.message)}">
            ${escapeHtml(msg.message.substring(0, 60))}${msg.message.length > 60 ? '...' : ''}
          </div>
          
          <div class="message-date">${dateStr}</div>
          
          <span class="status-badge ${statusClass}">${msg.status}</span>
          
          <div class="message-actions">
            <button class="view-btn" onclick="viewMessage(${msg.id})" title="View Details">
              <i class="fas fa-eye"></i>
            </button>
            ${msg.status !== 'archived' ? `
              <button class="archive-btn" onclick="archiveMessage(${msg.id})" title="Archive">
                <i class="fas fa-box-archive"></i>
              </button>
            ` : `
              <button class="view-btn" onclick="restoreMessage(${msg.id})" title="Restore">
                <i class="fas fa-rotate-left"></i>
              </button>
            `}
            <button class="delete-btn" onclick="confirmDelete(${msg.id})" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;
        }).join('');

        // Add checkbox event listeners
        document.querySelectorAll('.message-checkbox').forEach(cb => {
            cb.addEventListener('change', function () {
                const id = parseInt(this.closest('.message-item').dataset.id);
                if (this.checked) {
                    selectedIds.add(id);
                } else {
                    selectedIds.delete(id);
                }
                updateBulkActions();
                // Update visual selection
                this.closest('.message-item').classList.toggle('selected', this.checked);
            });
        });

        updatePagination();
        updateBulkActions();
    }

    // ==========================================
    // PAGINATION
    // ==========================================
    function updatePagination() {
        const totalPages = Math.ceil(filteredMessages.length / itemsPerPage);
        pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
        prevPage.disabled = currentPage === 1;
        nextPage.disabled = currentPage === totalPages || totalPages === 0;
    }

    // ==========================================
    // BULK ACTIONS
    // ==========================================
    function updateBulkActions() {
        const count = selectedIds.size;
        bulkDeleteBtn.disabled = count === 0;
        bulkArchiveBtn.disabled = count === 0;
        bulkSelectBtn.classList.toggle('active', count === filteredMessages.length);
    }

    // ==========================================
    // VIEW MESSAGE (Global function for onclick)
    // ==========================================
    window.viewMessage = async function (id) {
        const msg = messages.find(m => m.id === id);
        if (!msg) return;

        currentViewingId = id;

        if (msg.status === 'new') {
            await apiFetch(
                `${API_URL}/messages/${id}/read`,
                {
                    method: "PATCH"
                }
            );

            await loadMessages();
        }

        // Refresh the message after loading
        const updatedMsg = messages.find(m => m._id === id || m.id === id);

        const initials = updatedMsg.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

        modalBody.innerHTML = `
      <div class="modal-sender">
        <div class="sender-avatar">${initials}</div>
        <div class="sender-details">
          <h3>${escapeHtml(msg.name)}</h3>
          <p><i class="fas fa-envelope" style="margin-right: 6px;"></i>${escapeHtml(msg.email)}</p>
        </div>
      </div>

      <div class="modal-field">
        <label>Subject</label>
        <div class="field-value"><strong>${escapeHtml(msg.subject)}</strong></div>
      </div>

      <div class="modal-field">
        <label>Message</label>
        <div class="field-value message-content">${escapeHtml(msg.message)}</div>
      </div>

      <div class="modal-field">
        <label>Status</label>
        <div class="field-value"><span class="status-badge ${msg.status}">${msg.status}</span></div>
      </div>

      <div class="modal-field">
        <label>Received</label>
        <div class="field-value">${formatDate(msg.date)}</div>
      </div>
    `;

        // Show/hide buttons based on status
        markReadBtn.style.display = msg.status === 'new' ? 'flex' : 'none';
        archiveBtn.style.display = msg.status === 'archived' ? 'none' : 'flex';
        restoreBtn.style.display = msg.status === 'archived' ? 'flex' : 'none';
        deleteBtn.style.display = 'flex';

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    // ==========================================
    // ARCHIVE MESSAGE (Global)
    // ==========================================
    window.archiveMessage = async function (id) {

        try {

            const response = await apiFetch(
                `${API_URL}/messages/${id}/archive`,
                {
                    method: "PATCH"
                }
            );

            if (!response.ok)
                throw new Error();

            await loadMessages();
            updateStats();

            showToast("Message archived", "success");

        } catch (err) {

            showToast("Archive failed", "error");

        }

    }

    // ==========================================
    // RESTORE MESSAGE (Global)
    // ==========================================
    window.restoreMessage = async function (id) {

        try {

            const response = await apiFetch(
                `${API_URL}/messages/${id}/restore`,
                {
                    method: "PATCH"
                }
            );

            if (!response.ok)
                throw new Error();

            await loadMessages();
            await updateStats();

            showToast("Message restored", "success");

        } catch (err) {

            showToast("Restore failed", "error");

        }

    }

    // ==========================================
    // DELETE MESSAGE (Global)
    // ==========================================
    window.confirmDelete = function (id) {
        const msg = messages.find(m => m.id === id);
        if (!msg) return;

        Swal.fire({
            title: 'Delete Message?',
            text: `Are you sure you want to delete "${msg.subject}"? This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#D32F2F',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Delete',
            cancelButtonText: 'Cancel',
            background: document.body.classList.contains('dark-theme') ? '#1A1D24' : '#FFFFFF',
            color: document.body.classList.contains('dark-theme') ? '#FFFFFF' : '#222222'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteMessage(id);
            }
        });
    };

    async function deleteMessage(id) {

        try {

            const response = await apiFetch(
                `${API_URL}/messages/${id}`,
                {
                    method: "DELETE"
                }
            );

            if (!response.ok)
                throw new Error();

            await loadMessages();
            await updateStats();

            showToast("Deleted", "success");

        } catch (err) {

            showToast("Delete failed", "error");

        }

    }

    // ==========================================
    // BULK ACTIONS HANDLERS
    // ==========================================
    bulkSelectBtn.addEventListener('click', function () {
        const allIds = filteredMessages.map(m => m.id);
        const allSelected = allIds.every(id => selectedIds.has(id));

        if (allSelected) {
            selectedIds.clear();
        } else {
            allIds.forEach(id => selectedIds.add(id));
        }

        renderMessages();
        updateBulkActions();
    });

    bulkDeleteBtn.addEventListener('click', function () {
        if (selectedIds.size === 0) return;

        Swal.fire({
            title: `Delete ${selectedIds.size} Messages?`,
            text: 'This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#D32F2F',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Delete All',
            cancelButtonText: 'Cancel',
            background: document.body.classList.contains('dark-theme') ? '#1A1D24' : '#FFFFFF',
            color: document.body.classList.contains('dark-theme') ? '#FFFFFF' : '#222222'
        }).then((result) => {
            if (result.isConfirmed) {
                messages = messages.filter(m => !selectedIds.has(m.id));
                selectedIds.clear();
                updateStats();
                applyFilters();
                showToast('Messages deleted successfully', 'success');
            }
        });
    });

    bulkArchiveBtn.addEventListener('click', function () {
        if (selectedIds.size === 0) return;

        messages.forEach(m => {
            if (selectedIds.has(m.id)) {
                m.status = 'archived';
            }
        });

        selectedIds.clear();
        updateStats();
        applyFilters();
        showToast('Messages archived successfully', 'success');
    });

    // ==========================================
    // STAT FILTERS
    // ==========================================
    statItems.forEach(item => {
        item.addEventListener('click', function () {
            const filter = this.dataset.filter;
            currentFilter = filter;
            filterSelect.value = filter;
            applyFilters();
        });
    });

    // ==========================================
    // MODAL CONTROLS
    // ==========================================
    function closeModalFn() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        currentViewingId = null;
    }

    closeModal.addEventListener('click', closeModalFn);
    modal.addEventListener('click', function (e) {
        if (e.target === this) closeModalFn();
    });

    // Mark Read in Modal
    markReadBtn.addEventListener('click', function () {
        if (!currentViewingId) return;
        const msg = messages.find(m => m.id === currentViewingId);
        if (msg && msg.status === 'new') {
            msg.status = 'read';
            updateStats();
            applyFilters();
            closeModalFn();
            showToast('Message marked as read', 'success');
        }
    });

    // Archive in Modal
    archiveBtn.addEventListener('click', function () {
        if (!currentViewingId) return;
        archiveMessage(currentViewingId);
        closeModalFn();
    });

    // Restore in Modal
    restoreBtn.addEventListener('click', function () {
        if (!currentViewingId) return;
        restoreMessage(currentViewingId);
        closeModalFn();
    });

    // Delete in Modal
    deleteBtn.addEventListener('click', function () {
        if (!currentViewingId) return;
        confirmDelete(currentViewingId);
        closeModalFn();
    });

    // ==========================================
    // SEARCH & FILTER EVENTS
    // ==========================================
    searchInput.addEventListener('input', debounce(applyFilters, 300));
    filterSelect.addEventListener('change', applyFilters);

    // ==========================================
    // PAGINATION
    // ==========================================
    prevPage.addEventListener('click', function () {
        if (currentPage > 1) {
            currentPage--;
            renderMessages();
        }
    });

    nextPage.addEventListener('click', function () {
        const totalPages = Math.ceil(filteredMessages.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderMessages();
        }
    });

    // ==========================================
    // REFRESH
    // ==========================================
    refreshBtn.addEventListener("click", async () => {

        const icon = refreshBtn.querySelector("i");

        icon.style.animation = "spin .8s linear infinite";

        await loadMessages();

        await updateStats();

        icon.style.animation = "";

    });

    // ==========================================
    // THEME TOGGLE
    // ==========================================
    themeBtn.addEventListener('click', function () {
        const body = document.body;
        const icon = this.querySelector('i');

        body.classList.toggle('dark-theme');

        if (body.classList.contains('dark-theme')) {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
            localStorage.setItem('dashboardTheme', 'dark');
        } else {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
            localStorage.setItem('dashboardTheme', 'light');
        }
    });

    function applyTheme() {
        const savedTheme = localStorage.getItem('dashboardTheme');
        const body = document.body;
        const icon = themeBtn.querySelector('i');

        if (savedTheme === 'light') {
            body.classList.remove('dark-theme');
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            body.classList.add('dark-theme');
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    }

    // ==========================================
    // LOGOUT
    // ==========================================
    logoutBtn.addEventListener('click', function (e) {
        e.preventDefault();

        Swal.fire({
            title: 'Logout?',
            text: 'Are you sure you want to logout?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#D32F2F',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Logout',
            cancelButtonText: 'Cancel',
            background: document.body.classList.contains('dark-theme') ? '#1A1D24' : '#FFFFFF',
            color: document.body.classList.contains('dark-theme') ? '#FFFFFF' : '#222222'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem("token");
                localStorage.removeItem("admin");

                window.location.replace("/admin/login.html");
            }
        });
    });

    // ==========================================
    // MOBILE MENU
    // ==========================================
    menuToggle.addEventListener('click', function () {
        sidebar.classList.toggle('open');
        sidebarOverlay.classList.toggle('active');
    });

    sidebarOverlay.addEventListener('click', function () {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
    });

    // ==========================================
    // KEYBOARD SHORTCUTS
    // ==========================================
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            if (modal.classList.contains('active')) {
                closeModalFn();
            }
        }
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            searchInput.focus();
        }
    });

    // ==========================================
    // UTILITY FUNCTIONS
    // ==========================================
    function formatDate(date) {

        if (!date) return "N/A";

        const messageDate = new Date(date);

        const now = new Date();

        const diff = now - messageDate;

        const days = Math.floor(diff / (24 * 60 * 60 * 1000));
        const hours = Math.floor(diff / (60 * 60 * 1000));
        const minutes = Math.floor(diff / (60 * 1000));

        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;

        return messageDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    function showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-triangle-exclamation',
            info: 'fa-circle-info'
        };

        toast.innerHTML = `
      <i class="fas ${icons[type] || icons.success}"></i>
      ${message}
    `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    // ==========================================
    // INIT
    // ==========================================
    await init();

    // Make functions globally accessible for onclick
    window.viewMessage = viewMessage;
    window.archiveMessage = archiveMessage;
    window.restoreMessage = restoreMessage;
    window.confirmDelete = confirmDelete;
});

// Add spin animation
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);