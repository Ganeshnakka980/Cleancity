/**
 * CleanCity Complaints Listing & Filter Script
 */
let currentPage = 1;
let currentStatus = '';
let currentCategory = '';
let currentSearch = '';

document.addEventListener('DOMContentLoaded', () => {
  const user = Auth.requireAuth(['citizen', 'staff', 'admin']);
  if (!user) return;

  renderNavbar('complaints');
  renderSidebar('complaints');

  setupFilterListeners();
  loadComplaints();
});

function setupFilterListeners() {
  const searchInput = document.getElementById('search-input');
  const statusSelect = document.getElementById('status-filter');
  const categorySelect = document.getElementById('category-filter');

  if (searchInput) {
    let timeout = null;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        currentSearch = e.target.value.trim();
        currentPage = 1;
        loadComplaints();
      }, 400);
    });
  }

  if (statusSelect) {
    statusSelect.addEventListener('change', (e) => {
      currentStatus = e.target.value;
      currentPage = 1;
      loadComplaints();
    });
  }

  if (categorySelect) {
    categorySelect.addEventListener('change', (e) => {
      currentCategory = e.target.value;
      currentPage = 1;
      loadComplaints();
    });
  }
}

async function loadComplaints() {
  const container = document.getElementById('complaints-container');
  if (!container) return;

  container.innerHTML = getSpinnerHtml('Loading complaints...');

  const user = API.getUser();
  let query = `?page=${currentPage}&limit=12`;
  if (currentStatus) query += `&status=${currentStatus}`;
  if (currentCategory) query += `&category=${currentCategory}`;
  if (currentSearch) query += `&search=${encodeURIComponent(currentSearch)}`;

  try {
    const res = user.role === 'citizen' ? await API.getMyComplaints(query) : await API.getComplaints(query);

    const complaints = res.data || [];
    const pagination = res.pagination;

    if (complaints.length === 0) {
      container.innerHTML = getEmptyStateHtml(
        'No Complaints Found',
        'No waste complaints match your current search or filter criteria.',
        user.role === 'citizen' ? '<a href="/citizen/report.html" class="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md">+ Report Waste</a>' : ''
      );
      renderPaginationControls(null);
      return;
    }

    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${complaints.map((c) => renderComplaintCard(c, user.role)).join('')}
      </div>
    `;

    renderPaginationControls(pagination);
  } catch (err) {
    container.innerHTML = `<div class="p-8 text-center text-xs text-red-500 font-medium">Failed to load complaints list.</div>`;
  }
}

function renderComplaintCard(c, role) {
  const detailUrl = role === 'staff' ? `/staff/complaint-details.html?id=${c._id}` : role === 'admin' ? `/citizen/complaint-details.html?id=${c._id}` : `/citizen/complaint-details.html?id=${c._id}`;

  return `
    <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition">
      <div class="relative h-44 bg-slate-100">
        <img src="${c.image || '/uploads/seed-waste-1.svg'}" class="w-full h-full object-cover" alt="Waste photo"/>
        <div class="absolute top-3 left-3 px-2.5 py-1 text-[11px] font-extrabold rounded-full badge-${c.status}">
          ${c.status.replace('_', ' ').toUpperCase()}
        </div>
        <div class="absolute top-3 right-3 px-2.5 py-1 text-[11px] font-bold rounded-full priority-${c.priority} capitalize">
          ${c.priority} Priority
        </div>
      </div>

      <div class="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-1">
            <span class="font-extrabold text-slate-900 text-sm">${c.complaintId}</span>
            <span class="text-[10px] font-semibold text-slate-400">${new Date(c.createdAt).toLocaleDateString()}</span>
          </div>
          <h4 class="font-bold text-slate-800 text-sm mb-1 line-clamp-1">${c.category}</h4>
          <p class="text-xs text-slate-500 mb-3 line-clamp-2">${c.description}</p>
        </div>

        <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div class="text-[11px] text-slate-500 truncate max-w-[160px]">
            📍 ${c.address || 'Location specified'}
          </div>
          <a href="${detailUrl}" class="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl transition">
            View &rarr;
          </a>
        </div>
      </div>
    </div>
  `;
}

function renderPaginationControls(pagination) {
  const container = document.getElementById('pagination-container');
  if (!container || !pagination) {
    if (container) container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div class="flex items-center justify-between bg-white px-6 py-3 rounded-2xl border border-slate-100 mt-8">
      <div class="text-xs font-semibold text-slate-500">
        Page ${pagination.page} of ${pagination.totalPages} (${pagination.total} total items)
      </div>
      <div class="flex gap-2">
        <button onclick="changePage(${pagination.page - 1})" ${!pagination.hasPreviousPage ? 'disabled' : ''} class="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 ${!pagination.hasPreviousPage ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-50'}">
          &larr; Previous
        </button>
        <button onclick="changePage(${pagination.page + 1})" ${!pagination.hasNextPage ? 'disabled' : ''} class="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 ${!pagination.hasNextPage ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-50'}">
          Next &rarr;
        </button>
      </div>
    </div>
  `;
}

function changePage(newPage) {
  currentPage = newPage;
  loadComplaints();
}
