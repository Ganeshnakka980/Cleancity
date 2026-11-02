/**
 * CleanCity Admin Control Center & Analytics Module
 */
let adminLiveMap = null;
let statusChartInstance = null;
let categoryChartInstance = null;
let trendsChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  const user = Auth.requireAuth('admin');
  if (!user) return;

  const page = getAdminPageType();
  renderNavbar(page);
  renderSidebar(page);

  if (page === 'dashboard') {
    loadAdminDashboard();
  } else if (page === 'complaints') {
    loadAdminComplaints();
  } else if (page === 'users') {
    loadAdminUsers();
  } else if (page === 'staff') {
    loadAdminStaff();
  } else if (page === 'analytics') {
    loadAdminAnalytics();
  } else if (page === 'settings') {
    loadAdminSettings();
  }
});

function getAdminPageType() {
  const path = window.location.pathname;
  if (path.includes('complaints.html')) return 'complaints';
  if (path.includes('users.html')) return 'users';
  if (path.includes('staff.html')) return 'staff';
  if (path.includes('analytics.html')) return 'analytics';
  if (path.includes('settings.html')) return 'settings';
  return 'dashboard';
}

// -------------------------------------------------------------
// 1. Admin Dashboard Overview
// -------------------------------------------------------------
async function loadAdminDashboard() {
  try {
    const statsRes = await API.getAdminStats();
    const s = statsRes.data;

    document.getElementById('admin-stat-total').textContent = s.totalComplaints;
    document.getElementById('admin-stat-pending').textContent = s.pending;
    document.getElementById('admin-stat-assigned').textContent = s.assigned;
    document.getElementById('admin-stat-in-progress').textContent = s.inProgress;
    document.getElementById('admin-stat-resolved').textContent = s.resolved + s.verified;
    document.getElementById('admin-stat-high').textContent = s.highPriority;

    // Load Live Admin Map with Hotspots
    adminLiveMap = CleanCityMap.init('admin-live-map', { lat: 19.076, lng: 72.8777, zoom: 11 });

    const [complaintsRes, hotspotsRes] = await Promise.all([
      API.getComplaints('?limit=50'),
      API.getWasteHotspots()
    ]);

    if (complaintsRes.data) {
      CleanCityMap.addComplaintMarkers(complaintsRes.data);
    }

    if (hotspotsRes.data) {
      CleanCityMap.addHotspotOverlays(hotspotsRes.data);
    }
  } catch (err) {
    showToast('Admin Error', 'Failed to load control center statistics', 'danger');
  }
}

// -------------------------------------------------------------
// 2. Admin Complaints Registry & Staff Assignment
// -------------------------------------------------------------
async function loadAdminComplaints() {
  // Handled by complaints.js with admin controls extended
}

function openAssignStaffModal(complaintId, label) {
  document.getElementById('assign-complaint-id').value = complaintId;
  document.getElementById('assign-complaint-label').textContent = label;

  const select = document.getElementById('assign-staff-select');
  select.innerHTML = '<option value="">Loading staff members...</option>';

  API.getStaffList()
    .then((res) => {
      const staffList = res.data || [];
      if (staffList.length === 0) {
        select.innerHTML = '<option value="">No active staff members found</option>';
        return;
      }
      select.innerHTML = staffList
        .map((s) => `<option value="${s._id}">${s.name} (${s.email})</option>`)
        .join('');
    })
    .catch(() => {
      select.innerHTML = '<option value="">Error loading staff list</option>';
    });

  Modal.open('assign-modal');
}

async function submitAssignStaff(e) {
  e.preventDefault();
  const complaintId = document.getElementById('assign-complaint-id').value;
  const staffId = document.getElementById('assign-staff-select').value;

  if (!staffId) {
    showToast('Selection Required', 'Please select a staff member', 'warning');
    return;
  }

  try {
    await API.assignComplaint(complaintId, staffId);
    showToast('Assigned', 'Complaint assigned to staff member successfully', 'success');
    Modal.close('assign-modal');
    if (typeof loadComplaints === 'function') loadComplaints();
  } catch (err) {
    showToast('Assignment Error', err.message || 'Failed to assign complaint', 'danger');
  }
}

function openPriorityModal(complaintId, currentPriority) {
  document.getElementById('priority-complaint-id').value = complaintId;
  document.getElementById('priority-select').value = currentPriority || 'medium';
  Modal.open('priority-modal');
}

async function submitUpdatePriority(e) {
  e.preventDefault();
  const complaintId = document.getElementById('priority-complaint-id').value;
  const priority = document.getElementById('priority-select').value;

  try {
    await API.updatePriority(complaintId, priority);
    showToast('Priority Updated', `Complaint priority updated to ${priority.toUpperCase()}`, 'success');
    Modal.close('priority-modal');
    if (typeof loadComplaints === 'function') loadComplaints();
  } catch (err) {
    showToast('Error', err.message || 'Priority update failed', 'danger');
  }
}

// -------------------------------------------------------------
// 3. User & Staff Management
// -------------------------------------------------------------
async function loadAdminUsers() {
  const container = document.getElementById('users-table-body');
  if (!container) return;

  container.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-xs text-slate-400">Loading citizens directory...</td></tr>`;

  try {
    const res = await API.getAdminUsers('?role=citizen&limit=50');
    const users = res.data || [];

    if (users.length === 0) {
      container.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-xs text-slate-400">No citizens registered yet.</td></tr>`;
      return;
    }

    container.innerHTML = users
      .map(
        (u) => `
      <tr class="hover:bg-slate-50 transition border-b border-slate-100 text-xs">
        <td class="p-4 font-bold text-slate-800">${u.name}</td>
        <td class="p-4 text-slate-600">${u.email}</td>
        <td class="p-4 text-slate-600">${u.phone || 'N/A'}</td>
        <td class="p-4 font-bold text-emerald-600">${u.points || 0} pts</td>
        <td class="p-4">
          <button onclick="toggleUserActiveStatus('${u._id}')" class="px-3 py-1 text-[11px] font-bold rounded-lg transition ${
          u.isActive ? 'bg-emerald-100 text-emerald-800 hover:bg-red-100 hover:text-red-800' : 'bg-red-100 text-red-800 hover:bg-emerald-100 hover:text-emerald-800'
        }">
            ${u.isActive ? 'Active (Click to Disable)' : 'Disabled (Click to Enable)'}
          </button>
        </td>
      </tr>
    `
      )
      .join('');
  } catch (err) {
    container.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-xs text-red-500">Failed to load citizens.</td></tr>`;
  }
}

async function loadAdminStaff() {
  const container = document.getElementById('staff-table-body');
  if (!container) return;

  container.innerHTML = `<tr><td colspan="4" class="p-6 text-center text-xs text-slate-400">Loading staff team...</td></tr>`;

  try {
    const res = await API.getAdminUsers('?role=staff&limit=50');
    const staffMembers = res.data || [];

    if (staffMembers.length === 0) {
      container.innerHTML = `<tr><td colspan="4" class="p-6 text-center text-xs text-slate-400">No staff members created yet.</td></tr>`;
      return;
    }

    container.innerHTML = staffMembers
      .map(
        (s) => `
      <tr class="hover:bg-slate-50 transition border-b border-slate-100 text-xs">
        <td class="p-4 font-bold text-slate-800">${s.name}</td>
        <td class="p-4 text-slate-600">${s.email}</td>
        <td class="p-4 text-slate-600">${s.phone || 'N/A'}</td>
        <td class="p-4">
          <button onclick="toggleUserActiveStatus('${s._id}')" class="px-3 py-1 text-[11px] font-bold rounded-lg ${
          s.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
        }">
            ${s.isActive ? 'Active Staff' : 'Disabled'}
          </button>
        </td>
      </tr>
    `
      )
      .join('');
  } catch (err) {
    container.innerHTML = `<tr><td colspan="4" class="p-6 text-center text-xs text-red-500">Failed to load staff list.</td></tr>`;
  }
}

async function toggleUserActiveStatus(id) {
  try {
    const res = await API.toggleUserStatus(id);
    showToast('User Updated', res.message, 'info');
    if (getAdminPageType() === 'users') loadAdminUsers();
    else if (getAdminPageType() === 'staff') loadAdminStaff();
  } catch (err) {
    showToast('Error', err.message || 'Status toggle failed', 'danger');
  }
}

async function submitCreateStaff(e) {
  e.preventDefault();
  const name = document.getElementById('staff-name').value.trim();
  const email = document.getElementById('staff-email').value.trim();
  const phone = document.getElementById('staff-phone').value.trim();
  const password = document.getElementById('staff-password').value;

  try {
    await API.createStaff({ name, email, phone, password });
    showToast('Staff Created', 'New municipal staff account registered!', 'success');
    Modal.close('create-staff-modal');
    loadAdminStaff();
  } catch (err) {
    showToast('Creation Error', err.message || 'Staff creation failed', 'danger');
  }
}

// -------------------------------------------------------------
// 4. Analytics & Hotspots (Chart.js Integration)
// -------------------------------------------------------------
async function loadAdminAnalytics() {
  try {
    const [analyticsRes, hotspotsRes] = await Promise.all([
      API.getAdminAnalytics(),
      API.getWasteHotspots()
    ]);

    const data = analyticsRes.data;

    document.getElementById('analytics-avg-time').textContent = `${data.avgResolutionHours} hrs`;

    renderStatusPieChart(data.statusDistribution || []);
    renderCategoryBarChart(data.categoryBreakdown || []);
    renderMonthlyTrendsChart(data.monthlyTrends || []);
    renderStaffLeaderboard(data.staffPerformance || []);

    // Hotspots Map
    const hotspotMap = CleanCityMap.init('hotspots-map', { lat: 19.076, lng: 72.8777, zoom: 11 });
    if (hotspotsRes.data) {
      CleanCityMap.addHotspotOverlays(hotspotsRes.data);
    }
  } catch (err) {
    showToast('Analytics Error', 'Failed to load aggregation charts', 'danger');
  }
}

function renderStatusPieChart(dist) {
  const ctx = document.getElementById('statusChart')?.getContext('2d');
  if (!ctx) return;

  const labels = dist.map((d) => d._id.replace('_', ' ').toUpperCase());
  const counts = dist.map((d) => d.count);

  if (statusChartInstance) statusChartInstance.destroy();

  statusChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data: counts,
          backgroundColor: ['#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#14B8A6', '#EF4444']
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

function renderCategoryBarChart(catData) {
  const ctx = document.getElementById('categoryChart')?.getContext('2d');
  if (!ctx) return;

  const labels = catData.map((c) => c._id);
  const counts = catData.map((c) => c.count);

  if (categoryChartInstance) categoryChartInstance.destroy();

  categoryChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Complaints Count',
          data: counts,
          backgroundColor: '#10B981',
          borderRadius: 8
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } }
    }
  });
}

function renderMonthlyTrendsChart(trends) {
  const ctx = document.getElementById('trendsChart')?.getContext('2d');
  if (!ctx) return;

  const labels = trends.map((t) => `${t._id.month}/${t._id.year}`);
  const totalCounts = trends.map((t) => t.count);
  const resolvedCounts = trends.map((t) => t.resolvedCount);

  if (trendsChartInstance) trendsChartInstance.destroy();

  trendsChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Total Reports',
          data: totalCounts,
          borderColor: '#3B82F6',
          tension: 0.3
        },
        {
          label: 'Resolved Reports',
          data: resolvedCounts,
          borderColor: '#10B981',
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

function renderStaffLeaderboard(staffList) {
  const container = document.getElementById('staff-leaderboard-body');
  if (!container) return;

  if (staffList.length === 0) {
    container.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-xs text-slate-400">No performance records</td></tr>`;
    return;
  }

  container.innerHTML = staffList
    .map(
      (s) => `
    <tr class="border-b border-slate-100 text-xs">
      <td class="p-3 font-bold text-slate-800">${s.name}</td>
      <td class="p-3 text-slate-600">${s.totalAssigned}</td>
      <td class="p-3 font-bold text-emerald-600">${s.resolvedCount}</td>
      <td class="p-3 text-purple-600 font-bold">${s.inProgressCount}</td>
    </tr>
  `
    )
    .join('');
}

// -------------------------------------------------------------
// 5. System Settings & Audit Logs
// -------------------------------------------------------------
async function loadAdminSettings() {
  const container = document.getElementById('audit-logs-body');
  if (!container) return;

  container.innerHTML = `<tr><td colspan="4" class="p-6 text-center text-xs text-slate-400">Loading system audit logs...</td></tr>`;

  try {
    const res = await API.getAuditLogs();
    const logs = res.data || [];

    if (logs.length === 0) {
      container.innerHTML = `<tr><td colspan="4" class="p-6 text-center text-xs text-slate-400">No audit log entries recorded.</td></tr>`;
      return;
    }

    container.innerHTML = logs
      .map(
        (log) => `
      <tr class="hover:bg-slate-50 border-b border-slate-100 text-xs">
        <td class="p-3 font-semibold text-slate-400">${new Date(log.createdAt).toLocaleString()}</td>
        <td class="p-3 font-bold text-slate-800">${log.userId ? log.userId.name : 'System'}</td>
        <td class="p-3"><span class="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded">${log.action}</span></td>
        <td class="p-3 text-slate-600 font-mono text-[11px]">${JSON.stringify(log.details || {})}</td>
      </tr>
    `
      )
      .join('');
  } catch (err) {
    container.innerHTML = `<tr><td colspan="4" class="p-6 text-center text-xs text-red-500">Failed to load audit logs.</td></tr>`;
  }
}
