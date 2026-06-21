/**
 * tabs.js — Control de pestañas para AES Visualizer
 *
 * Un único mecanismo: element.hidden = true/false
 * Sin body.learn-active, sin fallbacks inline, sin .main-nav.
 */

const TAB_LABELS = {
  es: { studio: "Práctica", compare: "Comparar", learn: "Aprender", guide: "Guía", glossary: "Glosario" },
  en: { studio: "Practice", compare: "Compare",  learn: "Learn",    guide: "Guide", glossary: "Glossary" }
};

function getLang() {
  return document.getElementById("langSelect")?.value === "en" ? "en" : "es";
}

/**
 * Muestra solo los elementos del panel activo.
 * Cada elemento con [data-panel] se oculta si su valor no coincide con activeTab.
 */
function setVisibleTabs(activeTab) {
  // Ocultar/mostrar todos los paneles por data-panel
  document.querySelectorAll("[data-panel]").forEach((el) => {
    el.hidden = el.dataset.panel !== activeTab;
  });

  // Si el tab activo es "learn", mostrar el sub-tab activo
  if (activeTab === "learn") {
    const activeLearnTab = document.body.dataset.learnTab || "guide";
    setVisibleLearnTab(activeLearnTab);
  }

  // Actualizar estado activo de los botones de tab
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    const active = btn.dataset.tab === activeTab;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-selected", active ? "true" : "false");
  });
}

/**
 * Dentro de "Aprender", muestra guide o glossary según activeLearnTab.
 */
function setVisibleLearnTab(activeLearnTab) {
  document.body.dataset.learnTab = activeLearnTab;

  const guide    = document.querySelector(".guide");
  const glossary = document.querySelector(".glossary");
  const learnTabs = document.querySelector(".learn-tabs");

  // learn-tabs siempre visible cuando el panel learn está activo
  if (learnTabs) learnTabs.hidden = false;
  if (guide)    guide.hidden    = activeLearnTab !== "guide";
  if (glossary) glossary.hidden = activeLearnTab !== "glossary";

  // Actualizar botones learn
  document.querySelectorAll(".learn-btn").forEach((btn) => {
    const active = btn.dataset.learnTab === activeLearnTab;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-selected", active ? "true" : "false");
  });
}

function syncTabLabels() {
  const labels = TAB_LABELS[getLang()];
  const map = {
    tabStudio:       labels.studio,
    tabCompare:      labels.compare,
    tabLearn:        labels.learn,
    learnGuideBtn:   labels.guide,
    learnGlossaryBtn: labels.glossary,
  };
  for (const [id, text] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }
}

function initTabs() {
  const tabs = document.querySelectorAll(".tab-btn");
  if (!tabs.length) return;

  let activeTab      = "studio";
  let activeLearnTab = "guide";
  document.body.dataset.learnTab = activeLearnTab;

  syncTabLabels();
  setVisibleTabs(activeTab);

  // Clicks en tabs principales
  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      activeTab = btn.dataset.tab;
      setVisibleTabs(activeTab);
    });
  });

  // Clicks en sub-tabs de Aprender
  document.querySelectorAll(".learn-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeLearnTab = btn.dataset.learnTab;
      setVisibleLearnTab(activeLearnTab);
    });
  });

  // Sincronizar etiquetas al cambiar idioma
  document.getElementById("langSelect")?.addEventListener("change", () => {
    syncTabLabels();
  });
}

window.addEventListener("DOMContentLoaded", initTabs);
