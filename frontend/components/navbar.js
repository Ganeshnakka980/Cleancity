/**
 * CleanCity Dynamic Navbar Component
 */
function renderNavbar(activeTab = '') {
  const container = document.getElementById('navbar-container');
  if (!container) return;

  const user = API.getUser();
  const role = user ? user.role : null;

  let navLinksHtml = '';
  if (role === 'citizen') {
    navLinksHtml = `
      <a href="/citizen/dashboard.html" class="px-3 py-2 text-sm font-semibold rounded-lg ${activeTab === 'dashboard' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:text-emerald-600'}">Dashboard</a>
      <a href="/citizen/report.html" class="px-3 py-2 text-sm font-semibold rounded-lg ${activeTab === 'report' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:text-emerald-600'}">+ Report Waste</a>
      <a href="/citizen/complaints.html" class="px-3 py-2 text-sm font-semibold rounded-lg ${activeTab === 'complaints' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:text-emerald-600'}">My Complaints</a>
      <a href="/citizen/map.html" class="px-3 py-2 text-sm font-semibold rounded-lg ${activeTab === 'map' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:text-emerald-600'}">Live Map</a>
      <a href="/citizen/profile.html" class="px-3 py-2 text-sm font-semibold rounded-lg ${activeTab === 'profile' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:text-emerald-600'}">Profile & Rewards</a>
    `;
  } else if (role === 'staff') {
    navLinksHtml = `
      <a href="/staff/dashboard.html" class="px-3 py-2 text-sm font-semibold rounded-lg ${activeTab === 'dashboard' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:text-emerald-600'}">Staff Dashboard</a>
      <a href="/staff/complaints.html" class="px-3 py-2 text-sm font-semibold rounded-lg ${activeTab === 'complaints' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:text-emerald-600'}">Assigned Complaints</a>
    `;
  } else if (role === 'admin') {
    navLinksHtml = `
      <a href="/admin/dashboard.html" class="px-3 py-2 text-sm font-semibold rounded-lg ${activeTab === 'dashboard' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:text-emerald-600'}">Overview</a>
      <a href="/admin/complaints.html" class="px-3 py-2 text-sm font-semibold rounded-lg ${activeTab === 'complaints' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:text-emerald-600'}">Manage Complaints</a>
      <a href="/admin/users.html" class="px-3 py-2 text-sm font-semibold rounded-lg ${activeTab === 'users' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:text-emerald-600'}">Citizens</a>
      <a href="/admin/staff.html" class="px-3 py-2 text-sm font-semibold rounded-lg ${activeTab === 'staff' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:text-emerald-600'}">Municipal Staff</a>
      <a href="/admin/analytics.html" class="px-3 py-2 text-sm font-semibold rounded-lg ${activeTab === 'analytics' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:text-emerald-600'}">Analytics & Hotspots</a>
      <a href="/admin/settings.html" class="px-3 py-2 text-sm font-semibold rounded-lg ${activeTab === 'settings' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:text-emerald-600'}">System Audit Logs</a>
    `;
  } else {
    navLinksHtml = `
      <a href="/#how-it-works" class="px-3 py-2 text-sm font-medium text-slate-600 hover:text-emerald-600">How It Works</a>
      <a href="/#features" class="px-3 py-2 text-sm font-medium text-slate-600 hover:text-emerald-600">Features</a>
      <a href="/citizen/map.html" class="px-3 py-2 text-sm font-medium text-slate-600 hover:text-emerald-600">Explore Map</a>
    `;
  }

  const userControlsHtml = user
    ? `
    <div class="relative flex items-center gap-3">
      <!-- Notification Dropdown Toggle -->
      <div class="relative">
        <button id="nav-notification-btn" class="p-2 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-full relative">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
          <span id="nav-unread-badge" class="hidden absolute top-1 right-1 w-4 h-4 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">0</span>
        </button>

        <!-- Notification Panel -->
        <div id="nav-notification-panel" class="hidden absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 p-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
            <h4 class="font-bold text-slate-800 text-sm">Notifications</h4>
            <button onclick="markAllNotificationsRead()" class="text-xs font-semibold text-emerald-600 hover:underline">Mark all read</button>
          </div>
          <div id="nav-notifications-list" class="max-h-64 overflow-y-auto divide-y divide-slate-50">
            <p class="text-xs text-slate-400 text-center py-4">Loading notifications...</p>
          </div>
        </div>
      </div>

      <!-- User Profile Badge -->
      <div class="flex items-center gap-2 pl-2 border-l border-slate-200">
        <div class="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center uppercase">
          ${user.name ? user.name.charAt(0) : 'U'}
        </div>
        <div class="hidden md:block text-left">
          <div class="text-xs font-bold text-slate-800 leading-tight">${user.name}</div>
          <div class="text-[10px] font-semibold text-emerald-600 capitalize">${user.role}</div>
        </div>
        <button onclick="Auth.logout()" title="Logout" class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
        </button>
      </div>
    </div>
  `
    : `
    <div class="flex items-center gap-3">
      <a href="/login.html" class="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-emerald-600">Sign In</a>
      <a href="/register.html" class="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition">Report Waste</a>
    </div>
  `;

  container.innerHTML = `
    <nav class="glass-nav fixed top-0 left-0 right-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-8">
            <a href="/" class="flex items-center gap-2">
              <div class="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-200">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
              </div>
              <div>
                <span class="font-extrabold text-lg text-slate-900 tracking-tight">Clean<span class="text-emerald-600">City</span></span>
                <span class="hidden sm:inline-block text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded ml-1">CIVIC TECH</span>
              </div>
            </a>

            <div class="hidden lg:flex items-center gap-1">
              ${navLinksHtml}
            </div>
          </div>

          <div>
            ${userControlsHtml}
          </div>
        </div>
      </div>
    </nav>
  `;

  // Attach Notification Toggle Event Listener
  const notifBtn = document.getElementById('nav-notification-btn');
  const notifPanel = document.getElementById('nav-notification-panel');
  if (notifBtn && notifPanel) {
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifPanel.classList.toggle('hidden');
      if (!notifPanel.classList.contains('hidden')) {
        loadNavNotifications();
      }
    });

    document.addEventListener('click', (e) => {
      if (!notifPanel.contains(e.target) && e.target !== notifBtn) {
        notifPanel.classList.add('hidden');
      }
    });
  }

  // Load badge
  if (user) {
    Auth.updateNotificationBadge();
  }
}

function loadNavNotifications() {
  const list = document.getElementById('nav-notifications-list');
  if (!list) return;

  API.getNotifications()
    .then((res) => {
      if (!res.data || res.data.length === 0) {
        list.innerHTML = `<p class="text-xs text-slate-400 text-center py-4">No notifications yet</p>`;
        return;
      }

      list.innerHTML = res.data
        .map(
          (n) => `
        <div class="py-2.5 px-1 hover:bg-slate-50 rounded-lg cursor-pointer ${n.isRead ? 'opacity-70' : 'font-semibold'}" onclick="markNotifRead('${n._id}')">
          <div class="text-xs text-slate-800">${n.title}</div>
          <div class="text-[11px] text-slate-500 truncate">${n.message}</div>
          <div class="text-[9px] text-slate-400 mt-1">${new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      `
        )
        .join('');
    })
    .catch(() => {
      list.innerHTML = `<p class="text-xs text-red-500 text-center py-2">Unable to load notifications</p>`;
    });
}

function markNotifRead(id) {
  API.markNotificationRead(id).then(() => {
    loadNavNotifications();
    Auth.updateNotificationBadge();
  });
}

function markAllNotificationsRead() {
  API.markAllNotificationsRead().then(() => {
    loadNavNotifications();
    Auth.updateNotificationBadge();
  });
}
