/**
 * chacha20-tabs.js
 * Tab behavior:
 *   - Practica / Comparar: switching normal.
 *   - Aprender (desde Practica o Comparar): toggle overlay.
 *   - Aprender (tab activo): guia siempre visible, no colapsa.
 */
"use strict";

let cc20MainTab    = "studio";
let cc20GuideOn    = false;

function cc20RenderTabs() {
  const showLearn = (cc20MainTab === "learn") || cc20GuideOn;

  document.querySelectorAll("[data-cc20-panel]").forEach(function(el) {
    var panel = el.dataset.cc20Panel;
    if (panel === "learn") {
      el.hidden = !showLearn;
    } else {
      el.hidden = panel !== cc20MainTab;
    }
  });

  document.querySelectorAll(".cc20-tab-btn").forEach(function(btn) {
    var tab    = btn.dataset.tab;
    var isMain = tab === cc20MainTab;
    var isOver = tab === "learn" && cc20GuideOn && cc20MainTab !== "learn";
    btn.classList.toggle("active",        isMain);
    btn.classList.toggle("guide-overlay", isOver);
    btn.setAttribute("aria-selected", isMain ? "true" : "false");
  });

  if (showLearn) {
    var active = document.body.dataset.cc20LearnTab || "guide";
    cc20SetLearnTab(active);
  }
}

function cc20SwitchTab(clickedTab) {
  if (clickedTab === "learn") {
    if (cc20MainTab === "learn") return;   // ya en Aprender, no colapsar
    cc20GuideOn = !cc20GuideOn;            // toggle desde Practica/Comparar
  } else {
    cc20MainTab = clickedTab;
    cc20GuideOn = false;
  }
  cc20RenderTabs();
  // Scroll suave cuando se muestra el panel Aprender
  if (clickedTab === "learn" && cc20GuideOn) {
    requestAnimationFrame(function() {
      var el = document.querySelector("[data-cc20-panel='learn']");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
}

function cc20SetLearnTab(active) {
  document.querySelectorAll("[data-cc20-learn]").forEach(function(el) {
    el.hidden = el.dataset.cc20Learn !== active;
  });
  document.querySelectorAll(".cc20-learn-btn").forEach(function(btn) {
    var on = btn.dataset.learnTab === active;
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-selected", on ? "true" : "false");
  });
  document.body.dataset.cc20LearnTab = active;
}

document.addEventListener("DOMContentLoaded", function() {
  document.querySelectorAll(".cc20-tab-btn").forEach(function(btn) {
    btn.addEventListener("click", function() { cc20SwitchTab(btn.dataset.tab); });
  });
  document.querySelectorAll(".cc20-learn-btn").forEach(function(btn) {
    btn.addEventListener("click", function() { cc20SetLearnTab(btn.dataset.learnTab); });
  });
  cc20RenderTabs();
});
