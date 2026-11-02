/**
 * CleanCity Auth & Session Helper with Socket.IO Listener
 */
let globalSocket = null;

const Auth = {
  init() {
    const user = API.getUser();
    const token = API.getToken();

    if (user && token && typeof io !== 'undefined') {
      this.initSocket(token);
    }
  },

  initSocket(token) {
    if (globalSocket) return;

    try {
      globalSocket = io({
        auth: { token }
      });

      globalSocket.on('connect', () => {
        console.log('[Socket.IO] Connected to CleanCity Real-Time Server');
      });

      globalSocket.on('notificationCreated', (notification) => {
        if (typeof showToast === 'function') {
          showToast(notification.title, notification.message, notification.type || 'info');
        }
        this.updateNotificationBadge();
      });

      globalSocket.on('complaintStatusUpdated', (complaint) => {
        if (typeof showToast === 'function') {
          showToast(
            'Complaint Updated',
            `Status for ${complaint.complaintId} changed to ${complaint.status.replace('_', ' ').toUpperCase()}`,
            'info'
          );
        }
        if (typeof refreshCurrentPageData === 'function') {
          refreshCurrentPageData();
        }
      });
    } catch (e) {
      console.warn('[Socket.IO Init Warning]', e);
    }
  },

  updateNotificationBadge() {
    const badge = document.getElementById('nav-unread-badge');
    if (!badge) return;

    API.getNotifications()
      .then((res) => {
        if (res.unreadCount > 0) {
          badge.textContent = res.unreadCount;
          badge.classList.remove('hidden');
        } else {
          badge.classList.add('hidden');
        }
      })
      .catch(() => {});
  },

  requireAuth(requiredRole = null) {
    const user = API.getUser();
    const token = API.getToken();

    if (!user || !token) {
      window.location.href = '/login.html';
      return null;
    }

    if (requiredRole) {
      if (Array.isArray(requiredRole)) {
        if (!requiredRole.includes(user.role)) {
          this.redirectUserByRole(user.role);
          return null;
        }
      } else if (user.role !== requiredRole) {
        this.redirectUserByRole(user.role);
        return null;
      }
    }

    return user;
  },

  redirectUserByRole(role) {
    switch (role) {
      case 'admin':
        window.location.href = '/admin/dashboard.html';
        break;
      case 'staff':
        window.location.href = '/staff/dashboard.html';
        break;
      case 'citizen':
      default:
        window.location.href = '/citizen/dashboard.html';
        break;
    }
  },

  logout() {
    if (globalSocket) {
      globalSocket.disconnect();
    }
    API.logout();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Auth.init();
});
