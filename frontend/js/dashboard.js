/**
 * CleanCity Citizen Dashboard Logic
 */
document.addEventListener('DOMContentLoaded', () => {
  const user = Auth.requireAuth('citizen');
  if (!user) return;

  renderNavbar('dashboard');
  renderSidebar('dashboard');

  loadCitizenDashboardData();
});

async function loadCitizenDashboardData() {
  const user = API.getUser();
  if (user) {
    document.getElementById('user-welcome-name').textContent = user.name;
    document.getElementById('user-eco-points').textContent = user.points || 0;
  }

  // Load user rewards and level
  API.getMe()
    .then((res) => {
      if (res.data && res.data.reward) {
        document.getElementById('user-eco-points').textContent = res.data.reward.points;
        document.getElementById('user-eco-level').textContent = res.data.reward.level;
      }
    })
    .catch(() => {});

  // Load citizen complaints summary
  const container = document.getElementById('recent-complaints-list');
  container.innerHTML = getSpinnerHtml('Loading your recent complaints...');

  try {
    const res = await API.getMyComplaints('?limit=5');
    const complaints = res.data || [];

    // Calculate status counts
    let pending = 0,
      inProgress = 0,
      resolved = 0;
    complaints.forEach((c) => {
      if (c.status === 'pending' || c.status === 'assigned') pending++;
      else if (c.status === 'in_progress') inProgress++;
      else if (c.status === 'resolved' || c.status === 'verified') resolved++;
    });

    document.getElementById('stat-total-reports').textContent = res.pagination ? res.pagination.total : complaints.length;
    document.getElementById('stat-pending').textContent = pending;
    document.getElementById('stat-in-progress').textContent = inProgress;
    document.getElementById('stat-resolved').textContent = resolved;

    if (complaints.length === 0) {
      container.innerHTML = getEmptyStateHtml(
        'No Waste Reports Yet',
        'You have not filed any waste complaints yet. Spot garbage in your area and report it to earn EcoPoints!',
        '<a href="/citizen/report.html" class="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md">+ Report Waste Now</a>'
      );
      return;
    }

    container.innerHTML = complaints
      .map(
        (c) => `
      <div class="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-emerald-200 transition">
        <div class="flex items-center gap-4">
          <img src="${c.image || '/uploads/seed-waste-1.svg'}" class="w-14 h-14 rounded-xl object-cover border border-slate-100 shrink-0" alt="Waste photo"/>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-slate-900 text-sm">${c.complaintId}</span>
              <span class="px-2 py-0.5 text-[10px] font-bold rounded-full badge-${c.status}">
                ${c.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div class="text-xs text-slate-600 mt-0.5 line-clamp-1">${c.category} &bull; ${c.address || 'Reported location'}</div>
            <div class="text-[10px] text-slate-400 mt-1">${new Date(c.createdAt).toLocaleDateString()}</div>
          </div>
        </div>

        <a href="/citizen/complaint-details.html?id=${c._id}" class="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 font-bold text-xs rounded-xl text-slate-700 transition shrink-0">
          Track Status &rarr;
        </a>
      </div>
    `
      )
      .join('');

    // Load mini map preview
    const miniMap = CleanCityMap.init('dashboard-mini-map', { lat: 19.076, lng: 72.8777, zoom: 11 });
    CleanCityMap.addComplaintMarkers(complaints);
  } catch (err) {
    container.innerHTML = `<div class="p-6 text-center text-xs text-red-500 font-medium">Failed to load complaints data.</div>`;
  }
}
