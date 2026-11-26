// The Commonplace page lists every quotation in commonplace/quotes.md, newest (last in the file) first.
// Reading the file and building a quotation are in ../quote-core.js, shared with the
// homepage, so a quotation looks the same in both places.
//
// The page shows the quotations a batch at a time as you scroll, so a long collection
// doesn't put hundreds of drop-cap images on the page at once. Searching looks through
// every quotation, not only the ones already on screen.
(() => {
  const page = document.querySelector('.commonplace-page');
  if (!page) return;

  const form = page.querySelector('.quote-search');
  const input = form.querySelector('input');
  const clear = form.querySelector('.quote-search__clear');
  const status = page.querySelector('.quote-status');
  const list = page.querySelector('.quote-list');
  const sentinel = page.querySelector('.quote-sentinel');
  const {parseQuotes, choiceFor, renderQuote, load} = window.SiteQuotes;

  const ROOT = '..';
  const BATCH = 12;  // quotations added each time you near the bottom
  const EAGER = 3;   // the first few load their drop caps at once; the rest wait until nearby

  let art;           // the drop-cap wrap contours and sizes
  let quotes = [];   // every quotation: {quote, cap, haystack}, newest first
  let matches = [];  // the ones that fit the current search
  let terms = [];
  let shown = 0;     // how many of `matches` are on the page

  // Case, accents, curly versus straight quotes, and dashes don't matter when searching.
  // The words you search for are not highlighted in the results: the page is meant to be
  // screenshotted as clean quote images, so the quotations show exactly as published.
  const fold = value => value
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-')
    .toLowerCase();

  // ---- Showing quotations a batch at a time ----

  function more() {
    const fragment = document.createDocumentFragment();
    const end = Math.min(shown + BATCH, matches.length);
    for (; shown < end; shown++) {
      const {quote, cap} = matches[shown];
      try {
        const item = renderQuote(quote, cap, art, {root: ROOT, lazy: shown >= EAGER});
        item.id = quote.id;  // so a quotation can be linked to: commonplace/#its-id
        fragment.append(item);
      } catch (error) {
        console.error('Commonplace:', error);
      }
    }
    list.append(fragment);
  }

  // Watching the empty line below the list: when it comes within reach of the screen,
  // add the next batch. Re-observing makes the browser report where it is right now, so a
  // tall screen keeps filling until the page is longer than the window.
  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          more();
          watch();
        }
      }, {rootMargin: '0px 0px 900px 0px'})
    : null;

  function watch() {
    observer.unobserve(sentinel);
    if (shown < matches.length) observer.observe(sentinel);
  }

  function showFirstBatch() {
    list.replaceChildren();
    shown = 0;
    more();
    if (observer) watch();
    else while (shown < matches.length) more();  // an old browser gets the whole list
  }

  // ---- Searching ----

  const count = n => `${n} ${n === 1 ? 'quote' : 'quotes'}`;

  function updateStatus() {
    if (!terms.length) status.textContent = count(quotes.length);
    else if (!matches.length) status.textContent = `No quotes match “${input.value.trim()}”.`;
    else status.textContent = `${matches.length} of ${count(quotes.length)}`;
  }

  function syncUrl() {
    try {
      const url = new URL(location.href);
      const value = input.value.trim();
      if (value) url.searchParams.set('q', value);
      else url.searchParams.delete('q');
      url.hash = '';
      history.replaceState(null, '', url);
    } catch (_) {}
  }

  function search({updateUrl = true} = {}) {
    terms = fold(input.value).split(/\s+/).filter(Boolean);
    // Every word typed has to appear somewhere in the quotation, its author, or its source.
    matches = terms.length ? quotes.filter(entry => terms.every(term => entry.haystack.includes(term))) : quotes;
    clear.hidden = !input.value;
    showFirstBatch();
    updateStatus();
    if (updateUrl) syncUrl();
  }

  function clearSearch() {
    input.value = '';
    search();
    input.focus();
  }

  input.addEventListener('input', () => search());
  clear.addEventListener('click', clearSearch);
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape' && input.value) {
      event.preventDefault();
      clearSearch();
    }
  });
  // Return does nothing new (the list already follows what you type), but on a phone it
  // puts the keyboard away.
  form.addEventListener('submit', event => {
    event.preventDefault();
    input.blur();
  });

  // ---- Start ----

  load(ROOT).then(data => {
    art = data.art;
    // commonplace/quotes.md has the newest quotation last; this page shows it first.
    quotes = parseQuotes(data.markdown).reverse().flatMap(quote => {
      try {
        return [{quote, cap: choiceFor(quote, data.approved), haystack: fold(`${quote.text}\n${quote.author}\n${quote.source || ''}`)}];
      } catch (error) {
        console.error('Commonplace:', error);  // one bad entry shouldn't hide the rest
        return [];
      }
    });

    // A shared link can carry a search (?q=word) or point at one quotation (#its-id).
    input.value = new URLSearchParams(location.search).get('q') || '';
    search({updateUrl: false});

    const target = decodeURIComponent(location.hash.slice(1));
    const index = target ? matches.findIndex(entry => entry.quote.id === target) : -1;
    if (index >= 0) {
      while (shown <= index) more();
      if (observer) watch();
      document.getElementById(target)?.scrollIntoView({behavior: 'instant'});
    }
  }).catch(error => {
    console.error('Commonplace:', error);
    status.textContent = 'The quotes couldn’t be loaded.';
  });
})();
