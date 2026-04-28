// Relay the checkbox's change event as a namespaced custom event on <body>,
// then toggle the light-mode class based on the event detail.

const label = document.querySelector('.theme-toggle-label');

label.onchange = function (event) {
  event.stopPropagation();
  document.body.dispatchEvent(
    new CustomEvent('lightmode:toggle', {
      detail: { checked: event.target.checked },
    })
  );
};

document.body.addEventListener('lightmode:toggle', function (event) {
  document.body.classList.toggle('light-mode', event.detail.checked);
});
