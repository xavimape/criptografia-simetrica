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
});
