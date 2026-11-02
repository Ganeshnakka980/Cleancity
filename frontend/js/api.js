/**
 * CleanCity Centralized API Client
 */
const API = {
  baseURL: '/api',

  getToken() {
    return localStorage.getItem('cleancity_token');
  },

  getUser() {
    const userStr = localStorage.getItem('cleancity_user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      return null;
    }
  },

  setAuth(token, user) {
    localStorage.setItem('cleancity_token', token);
    localStorage.setItem('cleancity_user', JSON.stringify(user));
  },

  clearAuth() {
    localStorage.removeItem('cleancity_token');
    localStorage.removeItem('cleancity_user');
  },

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const headers = options.headers || {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Do not set Content-Type if FormData is used
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          this.clearAuth();
          if (!window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('register.html') && window.location.pathname !== '/') {
            window.location.href = '/login.html';
          }
        }
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error(`[API Error] Endpoint ${endpoint}:`, error.message);
      throw error;
    }
  },

  // Auth Methods
  register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },

  getMe() {
    return this.request('/auth/me');
  },

  logout() {
    return this.request('/auth/logout', { method: 'POST' }).finally(() => {
      this.clearAuth();
      window.location.href = '/login.html';
    });
  },

  // Complaints
  checkDuplicate(data) {
    return this.request('/complaints/check-duplicate', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  createComplaint(formData) {
    return this.request('/complaints', {
      method: 'POST',
      body: formData // FormData containing file & text fields
    });
  },

  getComplaints(queryParams = '') {
    return this.request(`/complaints${queryParams}`);
  },

  getMyComplaints(queryParams = '') {
    return this.request(`/complaints/my${queryParams}`);
  },

  getComplaint(id) {
    return this.request(`/complaints/${id}`);
  },

  getNearbyComplaints(lat, lng, radius = 5) {
    return this.request(`/complaints/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
  },

  updateComplaintStatus(id, status, note = '') {
    return this.request(`/complaints/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, note })
    });
  },

  // Staff
  getStaffComplaints(queryParams = '') {
    return this.request(`/staff/complaints${queryParams}`);
  },

  getStaffStats() {
    return this.request('/staff/stats');
  },

  acceptStaffComplaint(id) {
    return this.request(`/staff/complaints/${id}/accept`, { method: 'PUT' });
  },

  submitResolutionProof(id, formData) {
    return this.request(`/staff/complaints/${id}/proof`, {
      method: 'POST',
      body: formData
    });
  },

  // Admin
  getAdminStats() {
    return this.request('/admin/stats');
  },

  getAdminAnalytics() {
    return this.request('/admin/analytics');
  },

  getWasteHotspots() {
    return this.request('/admin/hotspots');
  },

  getAdminUsers(queryParams = '') {
    return this.request(`/admin/users${queryParams}`);
  },

  toggleUserStatus(id) {
    return this.request(`/admin/users/${id}/status`, { method: 'PUT' });
  },

  createStaff(staffData) {
    return this.request('/admin/staff', {
      method: 'POST',
      body: JSON.stringify(staffData)
    });
  },

  getStaffList() {
    return this.request('/admin/staff');
  },

  assignComplaint(id, staffId) {
    return this.request(`/admin/complaints/${id}/assign`, {
      method: 'PUT',
      body: JSON.stringify({ staffId })
    });
  },

  updatePriority(id, priority) {
    return this.request(`/admin/complaints/${id}/priority`, {
      method: 'PUT',
      body: JSON.stringify({ priority })
    });
  },

  getFeedbackList() {
    return this.request('/admin/feedback');
  },

  getAuditLogs() {
    return this.request('/admin/audit-logs');
  },

  // Notifications & Feedback
  getNotifications() {
    return this.request('/notifications');
  },

  markNotificationRead(id) {
    return this.request(`/notifications/${id}/read`, { method: 'PATCH' });
  },

  markAllNotificationsRead() {
    return this.request('/notifications/read-all', { method: 'PATCH' });
  },

  submitFeedback(data) {
    return this.request('/feedback', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};
