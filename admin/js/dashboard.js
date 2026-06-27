// Admin Dashboard Logic
const API_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://portfolio-wu0n.onrender.com/api";

async function verifyAdmin() {

  const token = localStorage.getItem("token");

  if (token && token.trim() !== "") {
    window.location.replace("/dashboard.html");
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

    window.location.replace("/login.html");
  }
}

async function apiFetch(url, options = {}) {
  const token = localStorage.getItem("token");

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");

    window.location.replace("/login.html");

    return null;
  }

  return response;
}

document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication
  await verifyAdmin();

  // DOM Elements
  const messagesBody = document.getElementById('messagesBody');
  const totalMessages = document.getElementById('totalMessages');
  const newMessages = document.getElementById('newMessages');
  const readMessages = document.getElementById('readMessages');
  const archivedMessages = document.getElementById('archivedMessages');
  const searchInput = document.getElementById('searchInput');
  const filterStatus = document.getElementById('filterStatus');
  const messageCount = document.getElementById('messageCount');
  const pageInfo = document.getElementById('pageInfo');
  const prevPage = document.getElementById('prevPage');
  const nextPage = document.getElementById('nextPage');
  const viewModal = document.getElementById('viewModal');
  const closeModal = document.getElementById('closeModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modalBody = document.getElementById('modalBody');
  const markReadBtn = document.getElementById('markReadBtn');
  const deleteBtn = document.getElementById('deleteBtn');
  const archiveBtn = document.getElementById("archiveBtn");
  const loadingOverlay = document.getElementById('loadingOverlay');
  const newMessagesBadge = document.getElementById('newMessagesBadge');
  const themeToggle = document.getElementById('dashboardThemeToggle');
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.querySelector('.sidebar');
  const logoutBtn = document.getElementById('logoutBtn');

  // State
  let messages = [];
  let filteredMessages = [];
  let currentPage = 1;
  const itemsPerPage = 5;
  let currentViewingId = null;

  // Load messages from API
  async function loadMessages() {
    showLoading(true);

    try {
      const response = await apiFetch(
        `${API_URL}/messages`
      );

      if (!response) return;

      const data = await response.json();

      console.log(data);
      console.log(data.messages);

      messages = data.messages;
      console.log("Messages:", messages);

      if (!data.success) {
        throw new Error(data.message || "Failed to load messages.");
      }

      // Convert backend data to the format your frontend already expects
      messages = data.messages.map(message => ({
        id: message._id,
        name: message.name,
        email: message.email,
        subject: message.subject,
        message: message.message,
        date: new Date(message.createdAt),

        // Convert backend booleans into frontend status
        status: message.isArchived
          ? "archived"
          : message.isRead
            ? "read"
            : "new"
      }));

      applyFilters();

    } catch (error) {

      console.error(error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Unable to load messages."
      });

    } finally {

      showLoading(false);

    }
  }

  // Update statistics
  async function loadStats() {
    try {
      const response = await apiFetch(
        `${API_URL}/messages/stats`
      );

      if (!response) return;

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to load statistics.");
      }

      totalMessages.textContent = data.stats.total;
      newMessages.textContent = data.stats.unread;
      readMessages.textContent = data.stats.read;
      archivedMessages.textContent = data.stats.archived;

      // Badge in sidebar/header
      newMessagesBadge.textContent = data.stats.unread;

    } catch (error) {
      console.error("Stats Error:", error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Unable to load dashboard statistics."
      });
    }
  }

  // Apply filters and search
  function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const statusFilter = filterStatus.value;

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
    renderTable();
  }

  // Render table
  function renderTable() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = filteredMessages.slice(start, end);

    if (pageItems.length === 0) {
      messagesBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 40px 20px; opacity: 0.6;">
            <i class="fas fa-inbox" style="font-size: 32px; display: block; margin-bottom: 12px;"></i>
            No messages found
          </td>
        </tr>
      `;
    } else {
      messagesBody.innerHTML = pageItems.map(msg => `
        <tr data-id="${msg.id}">
          <td><strong>${escapeHtml(msg.name)}</strong></td>
          <td>${escapeHtml(msg.subject)}</td>
          <td>${formatDate(msg.date)}</td>
          <td><span class="status status-${msg.status}">${msg.status.charAt(0).toUpperCase() + msg.status.slice(1)}</span></td>
          <td>
            <div class="action-btns">
              <button class="action-btn view" onclick="viewMessage('${msg.id}')" title="View">
                <i class="fas fa-eye"></i>
              </button>
              <button class="action-btn delete" onclick="confirmDelete('${msg.id}')" title="Delete">
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
          </td>
        </tr>
      `).join('');
    }

    // Update pagination
    const totalPages = Math.ceil(filteredMessages.length / itemsPerPage);
    messageCount.textContent = `Showing ${filteredMessages.length > 0 ? start + 1 : 0}-${Math.min(end, filteredMessages.length)} of ${filteredMessages.length} messages`;
    pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
    prevPage.disabled = currentPage === 1;
    nextPage.disabled = currentPage === totalPages || totalPages === 0;
  }

  // View message
  window.viewMessage = async function (id) {

    try {

      const response = await apiFetch(
        `${API_URL}/messages/${id}`
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      const msg = data.message;

      currentViewingId = msg._id;

      modalBody.innerHTML = `
      <div class="message-sender">
        <div class="sender-avatar">${msg.name.charAt(0)}</div>

        <div class="sender-info">
          <h4>${escapeHtml(msg.name)}</h4>
          <p>${escapeHtml(msg.email)}</p>
        </div>
      </div>

      <div class="message-field">
        <label>Subject</label>
        <div class="field-value">
          ${escapeHtml(msg.subject)}
        </div>
      </div>

      <div class="message-field">
        <label>Message</label>

        <div class="field-value message-text">
          ${escapeHtml(msg.message)}
        </div>
      </div>

      <div class="message-field">
        <label>Received</label>

        <div class="field-value">
          ${formatDate(new Date(msg.createdAt))}
        </div>
      </div>
    `;

      viewModal.classList.add("show");

      document.body.style.overflow = "hidden";

    } catch (error) {

      showToast("Unable to load message", "error");

    }

  };

  // Close modal
  function closeModalFn() {
    viewModal.classList.remove('show');
    document.body.style.overflow = '';
    currentViewingId = null;
  }

  closeModal.addEventListener('click', closeModalFn);
  closeModalBtn.addEventListener('click', closeModalFn);
  viewModal.addEventListener('click', function (e) {
    if (e.target === this) closeModalFn();
  });

  // Mark as read
  markReadBtn.addEventListener("click", async () => {

    if (!currentViewingId) return;

    try {

      const response = await apiFetch(
        `${API_URL}/messages/${currentViewingId}/read`,
        {
          method: "PUT"
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      showToast("Message marked as read");

      closeModalFn();

      await loadStats();

      await loadMessages();

    } catch (error) {

      showToast("Unable to mark as read", "error");

    }

  });

  // Delete message
  window.confirmDelete = function (id) {
    Swal.fire({
      title: 'Are you sure?',
      text: "This action cannot be undone!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#D32F2F',
      cancelButtonColor: '#666',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      background: document.body.classList.contains('dark-theme') ? '#1a1a1a' : '#ffffff',
      color: document.body.classList.contains('dark-theme') ? '#f5f5f5' : '#222'
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

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      if (currentViewingId === id) {
        closeModalFn();
      }

      showToast("Message deleted");

      await loadStats();

      await loadMessages();

    } catch (error) {

      showToast("Unable to delete message", "error");

    }

  }

  // Delete button in modal
  deleteBtn.addEventListener('click', function () {
    if (currentViewingId) {
      confirmDelete(currentViewingId);
    }
  });

  // Archive message in modal
  archiveBtn.addEventListener("click", async () => {

    if (!currentViewingId) return;

    try {

      const response = await apiFetch(
        `${API_URL}/messages/${currentViewingId}/archive`,
        {
          method: "PUT"
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      showToast("Message archived");

      closeModalFn();

      await loadStats();

      await loadMessages();

    } catch (error) {

      showToast("Unable to archive message", "error");

    }

  });

  // Search input
  searchInput.addEventListener('input', debounce(applyFilters, 300));
  filterStatus.addEventListener('change', applyFilters);

  // Pagination
  prevPage.addEventListener('click', function () {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
    }
  });

  nextPage.addEventListener('click', function () {
    const totalPages = Math.ceil(filteredMessages.length / itemsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      renderTable();
    }
  });

  // Theme toggle
  themeToggle.addEventListener('click', function () {
    const body = document.body;
    const icon = this.querySelector('i');

    if (body.classList.contains('dark-theme')) {
      body.classList.remove('dark-theme');
      body.classList.add('light-theme');
      icon.classList.remove('fa-moon');
      icon.classList.add('fa-sun');
    } else {
      body.classList.remove('light-theme');
      body.classList.add('dark-theme');
      icon.classList.remove('fa-sun');
      icon.classList.add('fa-moon');
    }
  });

  // Menu toggle (mobile)
  menuToggle.addEventListener('click', function () {
    sidebar.classList.toggle('open');
  });

  // Logout
  logoutBtn.addEventListener("click", function (e) {
    e.preventDefault();

    Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to logout?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#D32F2F",
      cancelButtonColor: "#666",
      confirmButtonText: "Logout",
      cancelButtonText: "Cancel"
    }).then((result) => {

      if (!result.isConfirmed) return;

      localStorage.removeItem("token");
      localStorage.removeItem("admin");
      // localStorage.removeItem("adminEmail");

      window.location.replace("/login.html");
    });
  });

  // Utility functions
  function formatDate(date) {
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const minutes = Math.floor(diff / (60 * 1000));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

  function showLoading(show) {
    if (show) {
      loadingOverlay.classList.add('active');
    } else {
      loadingOverlay.classList.remove('active');
    }
  }

  function showToast(message, type = 'success') {
    // Use the toast from the main page if available, or create a simple alert
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        text: message,
        icon: type,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        background: document.body.classList.contains('dark-theme') ? '#1a1a1a' : '#ffffff',
        color: document.body.classList.contains('dark-theme') ? '#f5f5f5' : '#222'
      });
    } else {
      alert(message);
    }
  }

  // Initialize
  await loadStats();
  loadMessages();

  // Make functions globally accessible
  window.viewMessage = viewMessage;
  window.confirmDelete = confirmDelete;
});

// Load SweetAlert2 for better modals
document.addEventListener('DOMContentLoaded', function () {
  if (typeof Swal === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11';
    document.head.appendChild(script);
  }
});