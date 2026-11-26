const viewButtons = [...document.querySelectorAll('.lists-toolbar [data-view]')];
const cardView = document.querySelector('#list-cards');
const listView = document.querySelector('#list-index');

function showView(view) {
  const showCards = view !== 'list';
  cardView.hidden = !showCards;
  listView.hidden = showCards;
  viewButtons.forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.view === (showCards ? 'cards' : 'list')));
  });
}

function restoreView() {
  const params = new URLSearchParams(window.location.search);
  showView(params.get('view') === 'list' ? 'list' : 'cards');
}

viewButtons.forEach(button => button.addEventListener('click', () => {
  const view = button.dataset.view;
  showView(view);
  const url = new URL(window.location.href);
  view === 'list' ? url.searchParams.set('view', 'list') : url.searchParams.delete('view');
  try { window.history.replaceState(window.history.state, '', url); } catch (_) {}
}));

window.addEventListener('popstate', restoreView);
restoreView();
document.querySelector('.lists-toolbar').hidden = false;

// Card layout. The grid uses 1px rows, so a card's height in pixels (plus the 16px
// gap between cards) is the number of rows it spans. Each card is watched, so the
// layout follows web fonts arriving, theme changes, and the window resizing.
// Matches the 16px gap in lists.css.
const CARD_GAP = 16;
cardView.classList.add('is-masonry');

if ('ResizeObserver' in window) {
  const observer = new ResizeObserver(entries => {
    entries.forEach(({ target }) => {
      const height = Math.ceil(target.getBoundingClientRect().height);
      if (height) target.parentElement.style.gridRowEnd = `span ${height + CARD_GAP}`;
    });
  });
  cardView.querySelectorAll('.list-card').forEach(card => observer.observe(card));
} else {
  // Without ResizeObserver, fall back to the plain two-column grid.
  cardView.classList.remove('is-masonry');
}
