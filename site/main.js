const toggle = document.querySelector('.theme-toggle');

// The browser's own toolbar (phone address bar, Safari tab bar) takes this colour.
// It follows the reader's chosen theme, matching the page background in styles.css.
const themeColor = document.querySelector('meta[name="theme-color"]');
const PAGE_COLOR = { light: '#FAF8F2', dark: '#1C1B1A' };

function setTheme(theme) {
  const dark = theme === 'dark';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  toggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  if (themeColor) themeColor.content = PAGE_COLOR[dark ? 'dark' : 'light'];
}

setTheme(document.documentElement.dataset.theme);

toggle.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  setTheme(next);
  try { localStorage.setItem('luke-theme', next); } catch (_) {}
});
