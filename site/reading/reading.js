const filterButtons = [...document.querySelectorAll('[data-filter]')];
const readingEntries = [...document.querySelectorAll('.reading-entries > tr')];
const readingStatus = document.querySelector('#reading-status');
let readingFilter = 'all';

function renderReading() {
  let count = 0;
  readingEntries.forEach(entry => {
    entry.hidden = readingFilter !== 'all' && entry.dataset.kind !== readingFilter;
    if (!entry.hidden) count += 1;
  });
  filterButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === readingFilter)));
  const type = readingFilter === 'all' ? 'items' : `${readingFilter}s`;
  readingStatus.textContent = `${count} ${type}, most recently read first.`;
}

function rememberReading() {
  const url = new URL(window.location.href);
  readingFilter === 'all' ? url.searchParams.delete('type') : url.searchParams.set('type', readingFilter);
  url.searchParams.delete('view');
  try { window.history.replaceState(window.history.state, '', url); } catch (_) {}
}

function restoreReading() {
  const params = new URLSearchParams(window.location.search);
  const requestedType = params.get('type');
  readingFilter = ['book', 'essay'].includes(requestedType) ? requestedType : 'all';
  renderReading();
  if (params.has('view') || (requestedType && readingFilter === 'all')) rememberReading();
}

filterButtons.forEach(button => button.addEventListener('click', () => {
  readingFilter = button.dataset.filter;
  renderReading();
  rememberReading();
}));

window.addEventListener('popstate', restoreReading);
restoreReading();
document.querySelector('.reading-toolbar').hidden = false;
