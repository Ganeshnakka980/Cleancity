/**
 * CleanCity Staff Workflow & Task Handling Script
 */
document.addEventListener('DOMContentLoaded', () => {
  const user = Auth.requireAuth(['staff', 'admin']);
  if (!user) return;

  renderNavbar('dashboard');
  renderSidebar('dashboard');

  loadStaffDashboard();
});

async function loadStaffDashboard() {
  try {
    const statsRes = await API.getStaffStats();
    const stats = statsRes.data;

    document.getElementById('staff-stat-total').textContent = stats.totalAssigned;
    document.getElementById('staff-stat-pending').textContent = stats.pendingAccept;
    document.getElementById('staff-stat-in-progress').textContent = stats.inProgress;
    document.getElementById('staff-stat-resolved').textContent = stats.resolved;
    document.getElementById('staff-stat-rate').textContent = `${stats.resolutionRate}%`;

    loadAssignedTasks();
  } catch (err) {
    showToast('Error', 'Unable to load staff statistics', 'danger');
  }
}

async function loadAssignedTasks() {
  const container = document.getElementById('staff-tasks-container');
  if (!container) return;

  container.innerHTML = getSpinnerHtml('Loading your assigned complaints...');

  try {
    const res = await API.getStaffComplaints('?limit=10');
    const complaints = res.data || [];

    if (complaints.length === 0) {
      container.innerHTML = getEmptyStateHtml(
        'No Assigned Tasks',
        'You currently have no waste complaints assigned for field cleaning.'
      );
      return;
    }

    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        ${complaints.map((c) => renderStaffTaskCard(c)).join('')}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="p-6 text-center text-xs text-red-500 font-medium">Failed to load assigned tasks.</div>`;
  }
}

function renderStaffTaskCard(c) {
  let actionButtonHtml = '';

  if (c.status === 'assigned') {
    actionButtonHtml = `
      <button onclick="acceptTask('${c._id}')" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition">
        Accept & Start Work
      </button>
    `;
  } else if (c.status === 'in_progress') {
    actionButtonHtml = `
      <button onclick="openResolutionModal('${c._id}', '${c.complaintId}')" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition">
        Upload Proof & Resolve
      </button>
    `;
  } else {
    actionButtonHtml = `
      <span class="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl">
        Resolved ✓
      </span>
    `;
  }

  return `
    <div class="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
      <div class="flex items-center justify-between">
        <span class="font-extrabold text-slate-900 text-sm">${c.complaintId}</span>
        <span class="px-2.5 py-1 text-[10px] font-extrabold rounded-full badge-${c.status}">
          ${c.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      <div class="flex gap-4">
        <img src="${c.image || '/uploads/seed-waste-1.svg'}" class="w-20 h-20 rounded-2xl object-cover border border-slate-100 shrink-0" alt="Waste photo"/>
        <div class="space-y-1">
          <h4 class="font-bold text-slate-800 text-xs">${c.category}</h4>
          <p class="text-xs text-slate-500 line-clamp-2">${c.description}</p>
          <div class="text-[11px] font-semibold text-slate-600">📍 ${c.address || 'Location specified'}</div>
        </div>
      </div>

      <div class="pt-4 border-t border-slate-100 flex items-center justify-between">
        <a href="/staff/complaint-details.html?id=${c._id}" class="text-xs font-bold text-slate-500 hover:text-emerald-600">
          View Full Details &rarr;
        </a>
        ${actionButtonHtml}
      </div>
    </div>
  `;
}

async function acceptTask(id) {
  try {
    await API.acceptStaffComplaint(id);
    showToast('Task Accepted', 'Complaint status updated to IN PROGRESS', 'success');
    loadStaffDashboard();
  } catch (err) {
    showToast('Error', err.message || 'Acceptance failed', 'danger');
  }
}

function openResolutionModal(id, complaintId) {
  document.getElementById('modal-complaint-id').value = id;
  document.getElementById('modal-complaint-label').textContent = complaintId;
  Modal.open('resolution-modal');
}

async function submitResolutionForm(event) {
  event.preventDefault();
  const id = document.getElementById('modal-complaint-id').value;
  const form = document.getElementById('resolution-form');
  const formData = new FormData(form);

  const btn = document.getElementById('btn-submit-proof');
  btn.disabled = true;
  btn.textContent = 'Uploading proof & resolving...';

  try {
    await API.submitResolutionProof(id, formData);
    showToast('Task Resolved! 🎉', 'Proof photo uploaded successfully. Citizen notified.', 'success');
    Modal.close('resolution-modal');
    loadStaffDashboard();
  } catch (err) {
    btn.disabled = false;
    btn.textContent = 'Upload Proof & Resolve Complaint';
    showToast('Resolution Failed', err.message || 'Error submitting proof', 'danger');
  }
}
