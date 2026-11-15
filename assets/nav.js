(function () {
  'use strict';

  // Tools dropdown in the header: opens on hover (via CSS) and on click/tap.
  var drops = Array.prototype.slice.call(document.querySelectorAll('.nav-drop'));
  if (!drops.length) return;

  function setOpen(drop, open) {
    drop.classList.toggle('is-open', open);
    var button = drop.querySelector('.nav-drop-btn');
    if (button) button.setAttribute('aria-expanded', String(open));
  }

  drops.forEach(function (drop) {
    var button = drop.querySelector('.nav-drop-btn');
    if (!button) return;

    button.addEventListener('click', function (event) {
      event.stopPropagation();
      setOpen(drop, !drop.classList.contains('is-open'));
    });

    drop.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        setOpen(drop, false);
        button.focus();
      }
    });

    drop.addEventListener('focusout', function (event) {
      if (!drop.contains(event.relatedTarget)) setOpen(drop, false);
    });
  });

  document.addEventListener('click', function (event) {
    drops.forEach(function (drop) {
      if (!drop.contains(event.target)) setOpen(drop, false);
    });
  });
})();
