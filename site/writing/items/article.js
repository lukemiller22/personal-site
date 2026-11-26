// Shared by writing, reading, project, and list detail pages.
const essayBody = document.querySelector('.essay-body');
const sidenotes = [...document.querySelectorAll('.sidenote')];
const noteRefs = [...document.querySelectorAll('.note-ref')];
const root = document.documentElement;
// Must match the sidenote breakpoint in article.css.
const wideMargin = window.matchMedia('(min-width: 1200px)');
// On narrow screens the stylesheet hides each note until its marker is tapped; this script
// only flips .is-open. A browser without the scripting media feature keeps every note visible
// (as the stylesheet does), so tapping a marker there still jumps to its note.
const scriptingOn = window.matchMedia('(scripting: enabled)').matches;

const togglesActive = () => scriptingOn && !wideMargin.matches;
const noteFor = ref => document.getElementById(ref.getAttribute('href').slice(1));

function setOpen(ref, open) {
  const note = noteFor(ref);
  if (!note) return;
  note.classList.toggle('is-open', open);
  ref.setAttribute('aria-expanded', String(open));
}

// Narrow screens: markers are buttons that show and hide their notes. Wide screens: plain links.
function syncMarkers() {
  const on = togglesActive();
  noteRefs.forEach(ref => {
    const note = noteFor(ref);
    if (!note) return;
    if (on) {
      ref.setAttribute('role', 'button');
      ref.setAttribute('aria-controls', note.id);
      ref.setAttribute('aria-expanded', String(note.classList.contains('is-open')));
    } else {
      ref.removeAttribute('role');
      ref.removeAttribute('aria-controls');
      ref.removeAttribute('aria-expanded');
    }
  });
}

// A link to a note (#sn-2) opens it, since a hidden note cannot be scrolled to.
function openFromHash() {
  if (!togglesActive() || !location.hash) return;
  const ref = noteRefs.find(marker => marker.getAttribute('href') === location.hash);
  if (!ref) return;
  setOpen(ref, true);
  noteFor(ref).scrollIntoView();
}

document.addEventListener('click', event => {
  const ref = event.target.closest('.note-ref');
  if (!ref || !togglesActive()) return;
  event.preventDefault();
  const open = ref.getAttribute('aria-expanded') !== 'true';
  setOpen(ref, open);
  // The note opens under its paragraph, which may be below the screen; scroll only as far as needed.
  if (open) noteFor(ref)?.scrollIntoView({block: 'nearest'});
});

// A link already activates on Enter; a button also activates on Space.
document.addEventListener('keydown', event => {
  if (event.key !== ' ') return;
  const ref = event.target.closest('.note-ref');
  if (!ref || !togglesActive()) return;
  event.preventDefault();
  ref.click();
});

window.addEventListener('hashchange', openFromHash);

function layoutSidenotes() {
  syncMarkers();
  essayBody.style.minHeight = '';
  sidenotes.forEach(note => { note.style.top = ''; });
  if (!wideMargin.matches) {
    root.classList.remove('sidenotes-ready');
    return;
  }

  root.classList.add('sidenotes-ready');
  const bodyTop = essayBody.getBoundingClientRect().top;
  const bodyHeight = essayBody.offsetHeight;
  let lastBottom = 0;
  sidenotes.forEach(note => {
    const reference = document.getElementById(note.dataset.ref);
    // +1 puts the note's first baseline on the baseline of the line holding its marker.
    const desiredTop = reference.getBoundingClientRect().top - bodyTop + 1;
    const top = Math.max(desiredTop, lastBottom + 16);
    note.style.top = `${Math.round(top)}px`;
    lastBottom = top + note.offsetHeight;
  });
  essayBody.style.minHeight = `${Math.ceil(Math.max(bodyHeight, lastBottom))}px`;
}

window.addEventListener('resize', layoutSidenotes);
window.addEventListener('load', layoutSidenotes);
if (document.fonts) document.fonts.ready.then(layoutSidenotes);
layoutSidenotes();
openFromHash();
