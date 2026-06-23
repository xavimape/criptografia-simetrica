/**
 * ascon-tabs.js — Lógica de tabs para ascon-demo.html
 *
 * Comportamiento:
 *   - Práctica / Comparar: tab switching normal.
 *   - Aprender (desde Práctica o Comparar): actúa como toggle — despliega/repliega
 *     la guía debajo del contenido actual sin cambiar el tab activo.
 *   - Aprender (tab activo): la guía queda siempre visible; clicking Aprender no
 *     la colapsa.
 */

"use strict";

let currentMainTab  = "studio";
let guideOverlayOn  = false;

// ── Renderiza el estado completo de visibilidad ──────────────────────────────
function renderTabState() {
  const showLearn = (currentMainTab === "learn") || guideOverlayOn;

  document.querySelectorAll("[data-ascon-panel]").forEach((el) => {
    const panel = el.dataset.asconPanel;
    if (panel === "learn") {
      el.hidden = !showLearn;
    } else {
      el.hidden = panel !== currentMainTab;
    }
  });

  // Botones de tab principal
  document.querySelectorAll(".ascon-tab-btn").forEach((btn) => {
    const tab    = btn.dataset.tab;
    const isMain = tab === currentMainTab;
    const isOver = tab === "learn" && guideOverlayOn && currentMainTab !== "learn";
    btn.classList.toggle("active",         isMain);
    btn.classList.toggle("guide-overlay",  isOver);
    btn.setAttribute("aria-selected", isMain ? "true" : "false");
  });

  // Inicializar sub-tab de guía si acaba de abrirse
  if (showLearn) {
    const active = document.body.dataset.asconLearnTab || "guide";
    setVisibleAsconLearnTab(active);
  }
}

// ── Cambia tab principal o toggle overlay ────────────────────────────────────
function setVisibleAsconTabs(clickedTab) {
  if (clickedTab === "learn") {
    if (currentMainTab === "learn") {
      // Ya en Aprender → guía siempre visible, nada que hacer
      return;
    }
    // Desde Práctica/Comparar → toggle overlay
    guideOverlayOn = !guideOverlayOn;
  } else {
    // Cambio a Práctica o Comparar → cerrar overlay
    currentMainTab = clickedTab;
    guideOverlayOn = false;
  }
  renderTabState();
}

// ── Sub-tabs de la sección Aprender ─────────────────────────────────────────
function setVisibleAsconLearnTab(activeLearnTab) {
  document.querySelectorAll("[data-ascon-learn]").forEach((el) => {
    el.hidden = el.dataset.asconLearn !== activeLearnTab;
  });

  document.querySelectorAll(".ascon-learn-btn").forEach((btn) => {
    const active = btn.dataset.learnTab === activeLearnTab;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-selected", active ? "true" : "false");
  });

  document.body.dataset.asconLearnTab = activeLearnTab;
}

// ── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {

  document.querySelectorAll(".ascon-tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => setVisibleAsconTabs(btn.dataset.tab));
  });

  document.querySelectorAll(".ascon-learn-btn").forEach((btn) => {
    btn.addEventListener("click", () => setVisibleAsconLearnTab(btn.dataset.learnTab));
  });

  renderTabState();

  // ── Play/Pause con velocidad ──────────────────────────────────────────────
  let asconPlayInterval = null;
  const playBtn  = document.getElementById('asconPlayBtn');
  const speedSel = document.getElementById('asconSpeedSel');

  function asconStopPlay() {
    if (asconPlayInterval) { clearInterval(asconPlayInterval); asconPlayInterval = null; }
    if (playBtn) { playBtn.textContent = '▶ Play'; playBtn.classList.remove('playing'); }
  }

  playBtn?.addEventListener('click', function() {
    if (asconPlayInterval) { asconStopPlay(); return; }
    this.textContent = '⏸ Pausa';
    const speed = parseInt(speedSel?.value || '400');
    asconPlayInterval = setInterval(() => {
      const nextBtn = document.getElementById('asconNextBtn');
      if (!nextBtn || nextBtn.disabled) { asconStopPlay(); return; }
      nextBtn.click();
    }, speed);
  });

  // ── Progreso ──────────────────────────────────────────────────────────────
  window.addEventListener('asconStepUpdate', function(e) {
    const { step, total } = e.detail || {};
    const fill  = document.getElementById('asconProgressFill');
    const label = document.getElementById('asconProgressLabel');
    const wrap  = document.getElementById('asconProgressWrap');
    if (!fill || !label || !wrap) return;
    wrap.hidden = false;
    const pct = total > 0 ? Math.round((step / total) * 100) : 0;
    fill.style.width = pct + '%';
    label.textContent = `Paso ${step} / ${total}`;
    if (step >= total) asconStopPlay();
  });

  // ── KAT Vectores ──────────────────────────────────────────────────────────
  const KAT_128A = [
    { label:'V1 — todo ceros, AD vacío, PT vacío',
      key:'00000000000000000000000000000000',
      nonce:'00000000000000000000000000000000',
      ad:'', pt:'', expectedCt:'', expectedTag:'E355159F292571BC8B0F0B1D0B9ED2B4' },
    { label:'V2 — todo ceros, AD=00, PT vacío',
      key:'00000000000000000000000000000000',
      nonce:'00000000000000000000000000000000',
      ad:'00', pt:'', expectedCt:'', expectedTag:'1B64D2B6B5D9CE8C8D0D86A9F74F6B4A' },
    { label:'V3 — todo ceros, AD vacío, PT=00',
      key:'00000000000000000000000000000000',
      nonce:'00000000000000000000000000000000',
      ad:'', pt:'00', expectedCt:'5E', expectedTag:'D40B2C0B3B7FE4F0BAF4B9D88D7D6898' },
  ];
  const KAT_128 = [
    { label:'V1 — todo ceros, AD vacío, PT vacío',
      key:'00000000000000000000000000000000',
      nonce:'00000000000000000000000000000000',
      ad:'', pt:'', expectedCt:'', expectedTag:'7A834BD8D31A7E67BD2D94BC29E56A3C' },
  ];

  const katVariantSel = document.getElementById('katVariantSel');
  const katVectorSel  = document.getElementById('katVectorSel');
  const katRunBtn     = document.getElementById('katRunBtn');
  const katResult     = document.getElementById('katResult');

  function populateKatVectors() {
    if (!katVectorSel) return;
    katVectorSel.innerHTML = '';
    const list = katVariantSel?.value === '128' ? KAT_128 : KAT_128A;
    list.forEach((v, i) => {
      const o = document.createElement('option');
      o.value = i;
      o.textContent = v.label;
      katVectorSel.appendChild(o);
    });
  }
  katVariantSel?.addEventListener('change', populateKatVectors);
  populateKatVectors();

  katRunBtn?.addEventListener('click', function() {
    const variant = katVariantSel?.value || '128a';
    const list    = variant === '128' ? KAT_128 : KAT_128A;
    const vec     = list[parseInt(katVectorSel?.value || '0')];
    if (!vec || !window.asconEngine) {
      if (katResult) { katResult.className='kat-result mismatch'; katResult.innerHTML='Motor no disponible.'; }
      return;
    }
    window.asconEngine.setVariant(variant);
    const res = window.asconEngine.encrypt(vec.key, vec.nonce, vec.ad, vec.pt);
    const ctMatch  = (res.ct  || '').toUpperCase() === vec.expectedCt.toUpperCase();
    const tagMatch = (res.tag || '').toUpperCase() === vec.expectedTag.toUpperCase();
    const ok = ctMatch && tagMatch;
    katResult.className = 'kat-result ' + (ok ? 'match' : 'mismatch');
    katResult.innerHTML = (ok ? '✅ MATCH — ' : '❌ MISMATCH — ') + vec.label +
      '<div class="kat-detail">' +
      'CT obtenido: '  + (res.ct  || '(vacío)') + '<br>' +
      'CT esperado: '  + (vec.expectedCt  || '(vacío)') + '<br>' +
      'Tag obtenido: ' + (res.tag || '') + '<br>' +
      'Tag esperado: ' + vec.expectedTag +
      '</div>';
  });
});
