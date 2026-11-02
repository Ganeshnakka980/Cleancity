/**
 * CleanCity Dashboard Sidebar Component
 */
function renderSidebar(activeItem = 'dashboard') {
  const container = document.getElementById('sidebar-container');
  if (!container) return;

  const user = API.getUser();
  const role = user ? user.role : 'citizen';

  let links = [];

  if (role === 'citizen') {
    links = [
      { id: 'dashboard', label: 'Overview', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', href: '/citizen/dashboard.html' },
      { id: 'report', label: 'Report Waste', icon: 'M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z', href: '/citizen/report.html' },
      { id: 'complaints', label: 'My Complaints', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', href: '/citizen/complaints.html' },
      { id: 'map', label: 'Live Map & Nearby', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7', href: '/citizen/map.html' },
      { id: 'profile', label: 'Rewards & Profile', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', href: '/citizen/profile.html' }
    ];
  } else if (role === 'staff') {
    links = [
      { id: 'dashboard', label: 'Workload Overview', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z', href: '/staff/dashboard.html' },
      { id: 'complaints', label: 'Assigned Complaints', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2', href: '/staff/complaints.html' }
    ];
  } else if (role === 'admin') {
    links = [
      { id: 'dashboard', label: 'Control Center', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', href: '/admin/dashboard.html' },
      { id: 'complaints', label: 'Complaint Registry', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', href: '/admin/complaints.html' },
      { id: 'users', label: 'Citizens Directory', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', href: '/admin/users.html' },
      { id: 'staff', label: 'Municipal Staff', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', href: '/admin/staff.html' },
      { id: 'analytics', label: 'Analytics & Hotspots', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', href: '/admin/analytics.html' },
      { id: 'settings', label: 'System Audit Logs', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', href: '/admin/settings.html' }
    ];
  }

  const itemsHtml = links
    .map(
      (link) => `
    <a href="${link.href}" class="flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition ${
      activeItem === link.id ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }">
      <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${link.icon}"/></svg>
      <span>${link.label}</span>
    </a>
  `
    )
    .join('');

  container.innerHTML = `
    <aside class="w-64 bg-white border-r border-slate-200 min-h-screen p-4 hidden lg:block shrink-0 pt-20">
      <div class="space-y-1">
        ${itemsHtml}
      </div>

      <div class="mt-8 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
        <div class="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">CleanCity Platform</div>
        <p class="text-xs text-emerald-700 leading-relaxed mb-3">Report waste, track resolution, and build cleaner communities together.</p>
        <a href="/citizen/report.html" class="block text-center py-2 px-3 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-emerald-700 transition">
          + Quick Report
        </a>
      </div>
    </aside>
  `;
}
