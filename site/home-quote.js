// Render from the generated snapshot synchronously, before the parser reaches the
// sections below. Waiting for a fetch here would move those sections after first paint.
// Rebuild the snapshot after editing commonplace/quotes.md or the drop-cap data.
(() => {
  const root = document.querySelector('.home-quote');
  if (!root) return;

  const list = root.querySelector('.quote-list');
  const SEEN_KEY = 'luke-quotes-seen';
  const {parseQuotes, choiceFor, renderQuote} = window.SiteQuotes;

  const store = {
    read(key) { try { return sessionStorage.getItem(key); } catch (_) { return null; } },
    write(key, value) { try { sessionStorage.setItem(key, value); } catch (_) {} },
  };

  function selectQuote(quotes) {
    let seen = [];
    let last = null;
    try {
      const saved = JSON.parse(store.read(SEEN_KEY) || 'null');
      const validIds = new Set(quotes.map(quote => quote.id));
      if (saved && Array.isArray(saved.seen)) {
        seen = saved.seen.filter(id => validIds.has(id));
        last = validIds.has(saved.last) ? saved.last : null;
      }
    } catch (_) {}

    let choices = quotes.filter(quote => quote.id !== last && !seen.includes(quote.id));
    if (!choices.length) {
      seen = last ? [last] : [];
      choices = quotes.filter(quote => quote.id !== last);
    }
    // With one quotation, showing it again is the only possible choice.
    const pool = choices.length ? choices : quotes;
    const selected = pool[Math.floor(Math.random() * pool.length)];
    if (!seen.includes(selected.id)) seen.push(selected.id);
    store.write(SEEN_KEY, JSON.stringify({seen, last: selected.id}));
    return selected;
  }

  try {
    if (!window.HOME_QUOTE_DATA) throw new Error('Missing generated home-quote-data.js');
    const {markdown, approved, shapes, sizes} = window.HOME_QUOTE_DATA;
    const art = {shapes, sizes};
    const selected = selectQuote(parseQuotes(markdown));
    list.replaceChildren(renderQuote(selected, choiceFor(selected, approved), art, {root: '.'}));
  } catch (error) {
    console.error('Homepage quotation:', error);
    // Leave this area blank until supporting states are designed.
    list.replaceChildren();
  }
})();
