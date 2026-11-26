// Shared by writing, reading, project, and list detail pages.
const essayBody = document.querySelector('.essay-body');
const sidenotes = [...document.querySelectorAll('.sidenote')];
// Must match the sidenote breakpoint in article.css.
const wideMargin = window.matchMedia('(min-width: 1200px)');

function layoutSidenotes() {
  essayBody.style.minHeight = '';
  sidenotes.forEach(note => { note.style.top = ''; });
  if (!wideMargin.matches) {
    document.documentElement.classList.remove('sidenotes-ready');
    return;
  }

  document.documentElement.classList.add('sidenotes-ready');
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
