const GLOSSARY_ITEMS = {
  es: [
    {
      term: "S-box",
      tag: "No linealidad",
      category: "fundamentos",
      description: "Tabla de sustitución que introduce confusión. Es una de las piezas más importantes de AES.",
      formula: "b' = SBOX[b]"
    },
    {
      term: "GF(2^8)",
      tag: "Álgebra",
      category: "matematica",
      description: "Campo finito de 256 elementos usado por AES para operar sobre bytes como polinomios mod 0x11b.",
      formula: "x^8 + x^4 + x^3 + x + 1"
    },
    {
      term: "MixColumns",
      tag: "Difusión",
      category: "transformaciones",
      description: "Multiplica cada columna por una matriz fija para que un byte afecte a varios bytes de salida.",
      formula: "M · column"
    },
    {
      term: "Key schedule",
      tag: "Expansión",
      category: "clave",
      description: "Proceso que convierte la clave secreta en subclaves de ronda mediante RotWord, SubWord y Rcon.",
      formula: "W_i = W_{i-nk} XOR temp"
    },
    {
      term: "Rcon",
      tag: "Constantes",
      category: "clave",
      description: "Constantes de ronda que rompen simetrías durante la expansión de la clave.",
      formula: "{01, 02, 04, 08, ...}"
    }
  ],
  en: [
    {
      term: "S-box",
      tag: "Nonlinearity",
      category: "fundamentals",
      description: "Substitution table that adds confusion. It is one of the most important parts of AES.",
      formula: "b' = SBOX[b]"
    },
    {
      term: "GF(2^8)",
      tag: "Algebra",
      category: "math",
      description: "Finite field with 256 elements used by AES to operate on bytes as polynomials mod 0x11b.",
      formula: "x^8 + x^4 + x^3 + x + 1"
    },
    {
      term: "MixColumns",
      tag: "Diffusion",
      category: "transformations",
      description: "Multiplies each column by a fixed matrix so one byte affects multiple output bytes.",
      formula: "M · column"
    },
    {
      term: "Key schedule",
      tag: "Expansion",
      category: "key",
      description: "Process that turns the secret key into round subkeys using RotWord, SubWord and Rcon.",
      formula: "W_i = W_{i-nk} XOR temp"
    },
    {
      term: "Rcon",
      tag: "Constants",
      category: "key",
      description: "Round constants used during key expansion to break symmetry.",
      formula: "{01, 02, 04, 08, ...}"
    }
  ]
};

const GLOSSARY_CATEGORY_LABELS = {
  es: {
    all: "Todos",
    fundamentos: "Fundamentos",
    matematica: "Matemática",
    transformaciones: "Transformaciones",
    clave: "Clave"
  },
  en: {
    all: "All",
    fundamentals: "Fundamentals",
    math: "Math",
    transformations: "Transformations",
    key: "Key"
  }
};

function getActiveGlossaryCategory() {
  return state.glossaryCategory || "all";
}

function setActiveGlossaryCategory(category) {
  state.glossaryCategory = category;
  renderGlossary();
}

function renderGlossaryCategories() {
  const container = document.getElementById("glossaryCategories");
  if (!container) return;
  const lang = state.lang === "en" ? "en" : "es";
  const labels = GLOSSARY_CATEGORY_LABELS[lang];
  const categories = ["all", ...new Set(GLOSSARY_ITEMS[lang].map((item) => item.category))];
  const active = getActiveGlossaryCategory();

  container.innerHTML = categories
    .map((category) => {
      const isActive = category === active;
      return `<button type="button" class="category-btn${isActive ? " active" : ""}" data-category="${category}">${labels[category] || category}</button>`;
    })
    .join("");

  container.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => setActiveGlossaryCategory(button.dataset.category));
  });
}

function renderGlossary() {
  const container = document.getElementById("glossaryContent");
  if (!container) return;

  const lang = state.lang === "en" ? "en" : "es";
  const filter = (document.getElementById("glossaryFilter")?.value || "").toLowerCase().trim();
  const activeCategory = getActiveGlossaryCategory();
  const items = GLOSSARY_ITEMS[lang].filter((item) => {
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    if (!matchesCategory) return false;
    if (!filter) return true;
    return [item.term, item.tag, item.description, item.formula].some((value) =>
      value.toLowerCase().includes(filter)
    );
  });

  container.innerHTML = items
    .map(
      (item) => `
        <article class="glossary-card">
          <h3><span>${item.term}</span> <span class="tag">${item.tag}</span></h3>
          <p>${item.description}</p>
          <div class="formula">${item.formula}</div>
        </article>
      `
    )
    .join("");
}

const originalApplyLanguage = applyLanguage;
applyLanguage = function applyLanguageWrapped() {
  originalApplyLanguage();
  const glossaryTitle = document.getElementById("glossaryTitle");
  const glossaryFilterLabel = document.getElementById("glossaryFilterLabel");
  const glossaryFilter = document.getElementById("glossaryFilter");
  if (glossaryTitle) {
    glossaryTitle.textContent = state.lang === "en" ? "Glossary and formulas" : "Glosario y fórmulas";
  }
  if (glossaryFilterLabel) {
    glossaryFilterLabel.textContent = state.lang === "en" ? "Filter terms" : "Filtrar términos";
  }
  if (glossaryFilter) {
    glossaryFilter.placeholder = state.lang === "en"
      ? "S-box, GF(2^8), avalanche..."
      : "S-box, GF(2^8), avalancha...";
  }
  renderGlossaryCategories();
  renderGlossary();
};

document.getElementById("glossaryFilter")?.addEventListener("input", renderGlossary);

renderGlossaryCategories();
renderGlossary();
