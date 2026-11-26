// What the homepage quotation and the Commonplace page share: reading commonplace/quotes.md and the
// drop-cap data, choosing each quotation's decorative initial, and building its markup.
// The approved cap IDs and their labels live in letters/approved.json; the matching PNGs
// live beside that manifest.
//
// `root` is the path from the current page to the site's top folder: '.' on the homepage,
// '..' on a page one folder down.
window.SiteQuotes = (() => {
  function parseQuotes(markdown) {
    const sections = markdown.replace(/\r\n?/g, '\n').split(/^##[ \t]+([a-z0-9][a-z0-9-]*)[ \t]*$/gm);
    const quotes = [];
    const ids = new Set();
    for (let i = 1; i < sections.length; i += 2) {
      const id = sections[i];
      if (ids.has(id)) throw new Error(`Duplicate quotation ID: ${id}`);
      ids.add(id);
      const fields = {};
      const text = [];
      for (const line of sections[i + 1].split('\n')) {
        const field = line.match(/^(author|source|url|drop_cap):[ \t]*(.*)$/);
        if (field) fields[field[1]] = field[2].trim();
        const quoted = line.match(/^>[ \t]?(.*)$/);
        if (quoted) text.push(quoted[1].trim());
      }
      const quote = {id, ...fields, text: text.join(' ').trim()};
      if (!quote.author || !quote.text) throw new Error(`Incomplete quotation: ${id}`);
      if (!/^[A-Za-z]/.test(quote.text)) throw new Error(`Quotation ${id} must start with A–Z`);
      quotes.push(quote);
    }
    if (!quotes.length) throw new Error('No quotations found in commonplace/quotes.md');
    return quotes;
  }

  function hash(value) {
    let result = 2166136261;
    for (const char of value) {
      result ^= char.codePointAt(0);
      result = Math.imul(result, 16777619);
    }
    return result >>> 0;
  }

  // The same quotation always gets the same initial, so it looks alike wherever it appears.
  function choiceFor(quote, approved) {
    const letter = quote.text[0].toUpperCase();
    const choices = approved.letters[letter];
    if (!choices?.length) throw new Error(`No approved drop caps for ${letter}`);
    if (quote.drop_cap) {
      const chosen = choices.find(choice => choice.id === quote.drop_cap);
      if (!chosen) throw new Error(`Quotation ${quote.id}: ${quote.drop_cap} is not approved for ${letter}`);
      return chosen;
    }
    return choices[hash(quote.id) % choices.length];
  }

  function capImage(id, theme, art, root, lazy) {
    const image = document.createElement('img');
    image.className = `quote-cap quote-cap--${theme}`;
    image.src = `${root}/letters/${id}-${theme}.png?v=3`;
    image.alt = '';
    image.setAttribute('aria-hidden', 'true');
    if (lazy) image.loading = 'lazy';
    image.style.shapeOutside = art.shapes[id];
    // Knowing the picture's proportions lets the page save its space before it loads, so
    // the text doesn't jump when it arrives.
    const size = art.sizes?.[id];
    if (size) image.style.aspectRatio = `${size[0]} / ${size[1]}`;
    return image;
  }

  // A relative url in commonplace/quotes.md is relative to the site's top folder, wherever the page is.
  function sourceLink(raw, root) {
    if (!raw) return null;
    const url = new URL(raw, new URL(`${root}/`, document.baseURI));
    const relative = !/^[a-z][a-z0-9+.-]*:/i.test(raw) && !raw.startsWith('//');
    if (!relative && !['http:', 'https:'].includes(url.protocol)) throw new Error(`Unsupported source URL: ${raw}`);
    return url.href;
  }

  // `art` is the drop-cap data from load(): each design's wrap contour and pixel size.
  // Options: root (see the top of this file), and lazy (let the browser hold back the
  // drop-cap images until the quotation is near the screen).
  function renderQuote(quote, cap, art, {root = '.', lazy = false} = {}) {
    if (!art.shapes[cap.id]) throw new Error(`Missing wrap contour for ${cap.id}`);
    const item = document.createElement('li');
    item.className = 'quote-item';
    if (quote.text.length < 80) item.classList.add('quote-item--short');
    item.dataset.quoteId = quote.id;
    item.dataset.capId = cap.id;

    const figure = document.createElement('figure');
    figure.className = 'quote-figure';
    const blockquote = document.createElement('blockquote');
    const paragraph = document.createElement('p');
    paragraph.append(capImage(cap.id, 'light', art, root, lazy), capImage(cap.id, 'dark', art, root, lazy));
    const accessibleText = document.createElement('span');
    accessibleText.className = 'visually-hidden';
    accessibleText.textContent = quote.text;
    paragraph.append(accessibleText);
    const words = [...quote.text.matchAll(/\S+/g)];
    const openingEnd = words[1] ? words[1].index + words[1][0].length : quote.text.length;
    const opening = document.createElement('span');
    opening.className = 'quote-opening';
    opening.setAttribute('aria-hidden', 'true');
    opening.textContent = quote.text.slice(1, openingEnd);
    const tail = document.createElement('span');
    tail.className = 'quote-tail';
    tail.setAttribute('aria-hidden', 'true');
    tail.textContent = quote.text.slice(openingEnd);
    paragraph.append(opening, tail);
    blockquote.append(paragraph);

    const caption = document.createElement('figcaption');
    const author = document.createElement('span');
    author.className = 'quote-author';
    author.textContent = quote.author;
    caption.append(author);
    if (quote.source) {
      const source = document.createElement('cite');
      const href = sourceLink(quote.url, root);
      if (href) {
        const link = document.createElement('a');
        link.href = href;
        if (new URL(href).origin !== location.origin) {
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
        }
        link.textContent = quote.source;
        source.append(link);
      } else {
        source.textContent = quote.source;
      }
      caption.append(source);
    }
    figure.append(blockquote, caption);
    item.append(figure);
    return item;
  }

  // The quotation file, the approved drop caps, and their wrap contours. Over HTTP these
  // are fetched fresh; from a file:// page the generated home-quote-data.js stands in.
  async function load(root = '.') {
    if (location.protocol === 'file:') {
      if (!window.HOME_QUOTE_DATA) throw new Error('Missing generated home-quote-data.js');
      const {markdown, approved, shapes, sizes} = window.HOME_QUOTE_DATA;
      return {markdown, approved, art: {shapes, sizes}};
    }
    const [markdownResponse, approvedResponse, shapesResponse] = await Promise.all([
      fetch(`${root}/commonplace/quotes.md`, {cache: 'no-store'}),
      fetch(`${root}/letters/approved.json`, {cache: 'no-store'}),
      fetch(`${root}/letters/shapes.json`, {cache: 'no-store'}),
    ]);
    if (!markdownResponse.ok || !approvedResponse.ok || !shapesResponse.ok) throw new Error('Could not fetch quotation or drop-cap data');
    const {shapes, sizes} = await shapesResponse.json();
    return {
      markdown: await markdownResponse.text(),
      approved: await approvedResponse.json(),
      art: {shapes, sizes},
    };
  }

  return {parseQuotes, choiceFor, renderQuote, load};
})();
