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
  // Scroll suave cuando se muestra el panel Aprender
  if (clickedTab === "learn" && guideOverlayOn) {
    requestAnimationFrame(() => {
      const el = document.querySelector("[data-ascon-panel='learn']");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
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

  // ── Pills idioma ──────────────────────────────────────────────────────────
  document.querySelectorAll('[data-lang-pill]').forEach(btn => {
    btn.addEventListener('click', function() {
      const lang = this.dataset.langPill;
      document.querySelectorAll('[data-lang-pill]').forEach(b =>
        b.setAttribute('aria-selected', String(b.dataset.langPill === lang)));
      if (typeof window.setLang === 'function') window.setLang(lang);
      // i18n.js: dispara a través del select existente si lo hay
      const sel = document.getElementById('langSelect');
      if (sel) { sel.value = lang; sel.dispatchEvent(new Event('change')); }
    });
  });

  // ── Pills algoritmo ───────────────────────────────────────────────────────
  function updateVariantHero(v) {
    const badge = document.getElementById('asconHeroBadge');
    const copy  = document.getElementById('asconHeroCopy');
    if (badge) badge.textContent = v === '128' ? 'ASCON-128 · AEAD' : 'ASCON-128a · AEAD';
    if (copy) copy.textContent = v === '128'
      ? 'Ejecutá ASCON-128 paso a paso: rate=64 bits, pb=6 rondas. Observá cómo el estado de 320 bits evoluciona en cada fase.'
      : 'Ejecutá ASCON-128a paso a paso: observá cómo el estado interno de 320 bits (x0–x4) evoluciona en cada ronda de inicialización, absorción AD, cifrado y finalización.';
  }

  document.querySelectorAll('[data-variant-pill]').forEach(btn => {
    btn.addEventListener('click', function() {
      const v = this.dataset.variantPill;
      document.querySelectorAll('[data-variant-pill]').forEach(b =>
        b.setAttribute('aria-selected', String(b.dataset.variantPill === v)));
      const r = document.getElementById('asconVariant' + v);
      if (r) { r.checked = true; r.dispatchEvent(new Event('change')); }
      if (window.asconEngine) window.asconEngine.setVariant(v);
      updateVariantHero(v);
    });
  });

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
    { label:'Count 1 · sin AD, sin PT', key:'000102030405060708090A0B0C0D0E0F', nonce:'000102030405060708090A0B0C0D0E0F', ad:'', pt:'', expectedCt:'', expectedTag:'7A834E6F09210957067B10FD831F0078' },
    { label:'Count 17 · AD 16B, sin PT', key:'000102030405060708090A0B0C0D0E0F', nonce:'000102030405060708090A0B0C0D0E0F', ad:'000102030405060708090A0B0C0D0E0F', pt:'', expectedCt:'', expectedTag:'56C15EB024DE91CA0165362A49B31EBD' },
    { label:'Count 34 · PT=00, sin AD', key:'000102030405060708090A0B0C0D0E0F', nonce:'000102030405060708090A0B0C0D0E0F', ad:'', pt:'00', expectedCt:'6E', expectedTag:'652B55BFDC8CAD2EC43815B1666B1A3A' },
    { label:'Count 50 · AD 16B + PT=00', key:'000102030405060708090A0B0C0D0E0F', nonce:'000102030405060708090A0B0C0D0E0F', ad:'000102030405060708090A0B0C0D0E0F', pt:'00', expectedCt:'52', expectedTag:'CDCC8F91E862ACACC86437163F8D31D6' },
    { label:'Count 100 · PT 3B', key:'000102030405060708090A0B0C0D0E0F', nonce:'000102030405060708090A0B0C0D0E0F', ad:'', pt:'000102', expectedCt:'6E490C', expectedTag:'898CD14E8316E149A6EDFC3B16C23A4E' },
    { label:'Count 133 · PT 4B', key:'000102030405060708090A0B0C0D0E0F', nonce:'000102030405060708090A0B0C0D0E0F', ad:'', pt:'00010203', expectedCt:'6E490CFE', expectedTag:'C328490A65C362CDCE54A9D9B12D5074' },
    { label:'Count 199 · PT 6B', key:'000102030405060708090A0B0C0D0E0F', nonce:'000102030405060708090A0B0C0D0E0F', ad:'', pt:'000102030405', expectedCt:'6E490CFED5B3', expectedTag:'0DB2813B8707D404BFE96887CBB64D1B' },
  ];
  const KAT_128 = [
    { label:'Count 1 · sin AD, sin PT', key:'000102030405060708090A0B0C0D0E0F', nonce:'000102030405060708090A0B0C0D0E0F', ad:'', pt:'', expectedCt:'', expectedTag:'E355159F292911F794CB1432A0103A8A' },
    { label:'Count 17 · AD 16B, sin PT', key:'000102030405060708090A0B0C0D0E0F', nonce:'000102030405060708090A0B0C0D0E0F', ad:'000102030405060708090A0B0C0D0E0F', pt:'', expectedCt:'', expectedTag:'EF5763E75FE32F96D7863410FF0B4786' },
    { label:'Count 34 · PT=00, sin AD', key:'000102030405060708090A0B0C0D0E0F', nonce:'000102030405060708090A0B0C0D0E0F', ad:'', pt:'00', expectedCt:'BC', expectedTag:'18C3F4E39ECA7222490D967C79BFFC92' },
    { label:'Count 50 · AD 16B + PT=00', key:'000102030405060708090A0B0C0D0E0F', nonce:'000102030405060708090A0B0C0D0E0F', ad:'000102030405060708090A0B0C0D0E0F', pt:'00', expectedCt:'1E', expectedTag:'E4C30EAE829E2C5569A1D688C2616AEE' },
    { label:'Count 100 · PT 3B', key:'000102030405060708090A0B0C0D0E0F', nonce:'000102030405060708090A0B0C0D0E0F', ad:'', pt:'000102', expectedCt:'BC820D', expectedTag:'5BCA14147915031C69F6B27848A7EE29' },
    { label:'Count 133 · PT 4B', key:'000102030405060708090A0B0C0D0E0F', nonce:'000102030405060708090A0B0C0D0E0F', ad:'', pt:'00010203', expectedCt:'BC820DBD', expectedTag:'218C5C93E3850E974A3704D1223BDEFB' },
    { label:'Count 199 · PT 6B', key:'000102030405060708090A0B0C0D0E0F', nonce:'000102030405060708090A0B0C0D0E0F', ad:'', pt:'000102030405', expectedCt:'BC820DBDF7A4', expectedTag:'0AE9AF4985E97254DAF329422C950FAD' },
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
    const res = window.asconEngine.run(vec.key, vec.nonce, vec.ad, vec.pt);
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

  // ── Ejemplos KAT en sección Aprender ─────────────────────────────────────
  window.loadKatInPractica = function(variant, vec) {
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
    set('asconKeyInput',   vec.key);
    set('asconNonceInput', vec.nonce);
    set('asconAdInput',    vec.ad);
    set('asconPtInput',    vec.pt);
    // Sincronizar pill de variante
    document.querySelectorAll('[data-variant-pill]').forEach(b =>
      b.setAttribute('aria-selected', String(b.dataset.variantPill === variant)));
    const r = document.getElementById('asconVariant' + variant);
    if (r) { r.checked = true; r.dispatchEvent(new Event('change')); }
    if (window.asconEngine) window.asconEngine.setVariant(variant);
    // Cambiar a tab Práctica
    currentMainTab = 'studio';
    guideOverlayOn = false;
    renderTabState();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  function renderKatExamples() {
    const el = document.getElementById('asconExamplesContent');
    if (!el) return;
    const isEN = (window.SITE_LANG === 'en');

    const KEY_NONCE = '000102030405060708090A0B0C0D0E0F';
    const buildTable = (variant, list) => {
      const label    = variant === '128a' ? 'ASCON-128a' : 'ASCON-128';
      const btnLabel = isEN ? '▶ Lab'          : '▶ Práctica';
      const thDesc   = isEN ? 'Description'    : 'Descripción';
      const thCtExp  = isEN ? 'Expected CT'    : 'CT esperado';
      const thTagExp = isEN ? 'Expected Tag'   : 'Tag esperado';
      const keyLbl   = isEN ? 'Key and Nonce:' : 'Clave y Nonce:';
      const rows = list.map((v) =>
        `<tr>
          <td style="padding:6px 10px;font-family:var(--mono);font-size:0.78rem">${v.label}</td>
          <td style="padding:6px 10px;font-family:var(--mono);font-size:0.76rem;color:var(--muted)">${v.ad || '—'}</td>
          <td style="padding:6px 10px;font-family:var(--mono);font-size:0.76rem;color:var(--muted)">${v.pt || '—'}</td>
          <td style="padding:6px 10px;font-family:var(--mono);font-size:0.76rem;color:var(--accent-ascon)">${v.expectedCt || '—'}</td>
          <td style="padding:6px 10px;font-family:var(--mono);font-size:0.72rem;word-break:break-all">${v.expectedTag}</td>
          <td style="padding:6px 10px">
            <button class="btn-ascon-primary" style="font-size:0.75rem;padding:4px 10px;white-space:nowrap"
              onclick="window.loadKatInPractica('${variant}', ${JSON.stringify(v).replace(/"/g, '&quot;')})">
              ${btnLabel}
            </button>
          </td>
        </tr>`
      ).join('');
      return `
        <h3 style="margin:1.2rem 0 0.5rem;color:var(--accent-ascon)">${label}</h3>
        <p style="font-size:0.82rem;color:var(--muted);margin-bottom:0.5rem">
          ${keyLbl} <code style="font-family:var(--mono)">${KEY_NONCE}</code>
        </p>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:0.82rem">
            <thead><tr style="border-bottom:1px solid var(--line)">
              <th style="text-align:left;padding:6px 10px">${thDesc}</th>
              <th style="text-align:left;padding:6px 10px">AD (hex)</th>
              <th style="text-align:left;padding:6px 10px">PT (hex)</th>
              <th style="text-align:left;padding:6px 10px">${thCtExp}</th>
              <th style="text-align:left;padding:6px 10px">${thTagExp}</th>
              <th style="padding:6px 10px"></th>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    };

    const introText = isEN
      ? 'Known-Answer Test vectors from the official repository '
      : 'Vectores Known-Answer Test del repositorio oficial ';
    const clickText = isEN
      ? 'Click <strong>▶ Lab</strong> to load the vector in the cipher and verify it step by step.'
      : 'Hacé clic en <strong>▶ Práctica</strong> para cargar el vector en el cifrador y verificarlo paso a paso.';

    el.innerHTML =
      '<p class="prose" style="margin-bottom:0.8rem">' + introText +
      '<a href="https://github.com/ascon/ascon-c/tree/v1.2.8" target="_blank" rel="noopener">ascon/ascon-c@v1.2.8</a>. ' +
      clickText + '</p>' +
      buildTable('128a', KAT_128A) +
      buildTable('128', KAT_128);
  }

  renderKatExamples();
  /* Re-render on language change */
  window.addEventListener('langchange', function() { renderKatExamples(); });
});
