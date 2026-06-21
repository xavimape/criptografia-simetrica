/* =============================================
   Hash Visualizer — Tab logic
   Tabs: studio | guia | comparar
   ============================================= */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var tabs    = document.querySelectorAll('.hash-tab-btn');
    var panels  = document.querySelectorAll('.hash-tab-panel');

    function activate(id) {
      tabs.forEach(function (btn) {
        btn.classList.toggle('active', btn.dataset.tab === id);
      });
      panels.forEach(function (panel) {
        panel.hidden = panel.id !== ('tab-' + id);
      });
    }

    tabs.forEach(function (btn) {
      btn.addEventListener('click', function () { activate(btn.dataset.tab); });
    });

    // Tab inicial
    activate('studio');
  });
}());
