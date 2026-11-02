/**
 * CleanCity Loading Component Utility
 */
function getSpinnerHtml(text = 'Loading data...') {
  return `
    <div class="flex flex-col items-center justify-center p-8 text-center">
      <div class="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-3"></div>
      <p class="text-sm font-medium text-slate-500">${text}</p>
    </div>
  `;
}

function getEmptyStateHtml(title = 'No Data Found', message = 'There are no records to display at this time.', actionHtml = '') {
  return `
    <div class="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div class="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
      </div>
      <h3 class="text-base font-bold text-slate-800 mb-1">${title}</h3>
      <p class="text-xs text-slate-500 max-w-sm mb-4">${message}</p>
      ${actionHtml}
    </div>
  `;
}
