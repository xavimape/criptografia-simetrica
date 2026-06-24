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

// ══════════════════════════════════════════════════════════
//  AES GUIDE — contenido educativo para la pestaña Guía
// ══════════════════════════════════════════════════════════

const AES_GUIDE = [
  {
    title: { es: "¿Qué es AES?", en: "What is AES?" },
    content: {
      es: `<p>AES (<em>Advanced Encryption Standard</em>) es un cifrado de bloque simétrico adoptado por NIST en 2001 (FIPS 197). Opera sobre bloques fijos de <strong>128 bits</strong> con claves de <strong>128, 192 o 256 bits</strong>.</p>
<div class="guide-fact-row">
  <div class="guide-fact"><span class="guide-fact-label">Bloque</span><code>128 bits (16 bytes)</code></div>
  <div class="guide-fact"><span class="guide-fact-label">Clave</span><code>128 / 192 / 256 bits</code></div>
  <div class="guide-fact"><span class="guide-fact-label">Rondas</span><code>10 / 12 / 14</code></div>
</div>
<p>Cada ronda aplica 4 transformaciones al estado interno (una matriz 4×4 de bytes). La ronda final omite MixColumns.</p>`,
      en: `<p>AES (<em>Advanced Encryption Standard</em>) is a symmetric block cipher adopted by NIST in 2001 (FIPS 197). It operates on fixed <strong>128-bit</strong> blocks with <strong>128, 192, or 256-bit</strong> keys.</p>
<div class="guide-fact-row">
  <div class="guide-fact"><span class="guide-fact-label">Block</span><code>128 bits (16 bytes)</code></div>
  <div class="guide-fact"><span class="guide-fact-label">Key</span><code>128 / 192 / 256 bits</code></div>
  <div class="guide-fact"><span class="guide-fact-label">Rounds</span><code>10 / 12 / 14</code></div>
</div>
<p>Each round applies 4 transformations to the internal state (a 4×4 byte matrix). The final round omits MixColumns.</p>`
    }
  },
  {
    title: { es: "SubBytes — Confusión no lineal", en: "SubBytes — Non-linear confusion" },
    content: {
      es: `<p>SubBytes sustituye cada byte del estado por otro usando la <strong>S-box</strong> — una tabla de 256 entradas construida a partir del inverso multiplicativo en GF(2⁸) seguido de una transformación afín.</p>
<div class="guide-mono-box"><span style="color:var(--accent)">b'</span> = SBOX[b]<br>SBOX[0x00] = 0x63 &nbsp;|&nbsp; SBOX[0x01] = 0x7c &nbsp;|&nbsp; SBOX[0x53] = 0xed</div>
<ul class="guide-ul">
  <li>Provee <strong>no linealidad</strong> — impide ataques lineales.</li>
  <li>La S-box es invertible: existe InvSBox para descifrar.</li>
  <li>El inverso de 0x00 se define como 0x00.</li>
</ul>`,
      en: `<p>SubBytes replaces each byte in the state using the <strong>S-box</strong> — a 256-entry table built from the multiplicative inverse in GF(2⁸) followed by an affine transformation.</p>
<div class="guide-mono-box"><span style="color:var(--accent)">b'</span> = SBOX[b]<br>SBOX[0x00] = 0x63 &nbsp;|&nbsp; SBOX[0x01] = 0x7c &nbsp;|&nbsp; SBOX[0x53] = 0xed</div>
<ul class="guide-ul">
  <li>Provides <strong>nonlinearity</strong> — prevents linear attacks.</li>
  <li>The S-box is invertible: InvSBox exists for decryption.</li>
  <li>The inverse of 0x00 is defined as 0x00.</li>
</ul>`
    }
  },
  {
    title: { es: "ShiftRows — Difusión por filas", en: "ShiftRows — Row diffusion" },
    content: {
      es: `<p>ShiftRows desplaza cíclicamente a la izquierda cada fila del estado un número diferente de posiciones:</p>
<div class="guide-mono-box">Fila 0: sin desplazamiento&nbsp;&nbsp;&nbsp;→ a₀₀ a₀₁ a₀₂ a₀₃
Fila 1: desplaza 1 posición  → a₁₁ a₁₂ a₁₃ a₁₀
Fila 2: desplaza 2 posiciones → a₂₂ a₂₃ a₂₀ a₂₁
Fila 3: desplaza 3 posiciones → a₃₃ a₃₀ a₃₁ a₃₂</div>
<p>Garantiza que los bytes de cada columna provengan de <strong>cuatro filas diferentes</strong>, dispersando la influencia de cada byte a través del estado en rondas sucesivas.</p>`,
      en: `<p>ShiftRows cyclically left-shifts each row of the state by a different number of positions:</p>
<div class="guide-mono-box">Row 0: no shift&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ a₀₀ a₀₁ a₀₂ a₀₃
Row 1: shift by 1 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ a₁₁ a₁₂ a₁₃ a₁₀
Row 2: shift by 2 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ a₂₂ a₂₃ a₂₀ a₂₁
Row 3: shift by 3 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ a₃₃ a₃₀ a₃₁ a₃₂</div>
<p>Ensures each column's bytes come from <strong>four different rows</strong>, spreading byte influence across the state in successive rounds.</p>`
    }
  },
  {
    title: { es: "MixColumns — Difusión por columnas", en: "MixColumns — Column diffusion" },
    content: {
      es: `<p>MixColumns trata cada columna como un polinomio sobre GF(2⁸) y la multiplica por una matriz fija. Un solo byte de entrada afecta a <strong>todos los bytes de la columna de salida</strong>.</p>
<div class="guide-mono-box">M = [02 03 01 01]   c' = M × c  (en GF(2⁸))
    [01 02 03 01]
    [01 01 02 03]
    [03 01 01 02]</div>
<ul class="guide-ul">
  <li>Junto con ShiftRows logra <strong>difusión completa</strong> en 2 rondas.</li>
  <li>La multiplicación por 02 en GF(2⁸) es un shift izquierdo + XOR condicional.</li>
  <li>La ronda final omite MixColumns para permitir inversión eficiente.</li>
</ul>`,
      en: `<p>MixColumns treats each column as a polynomial over GF(2⁸) and multiplies it by a fixed matrix. A single input byte affects <strong>all output column bytes</strong>.</p>
<div class="guide-mono-box">M = [02 03 01 01]   c' = M × c  (in GF(2⁸))
    [01 02 03 01]
    [01 01 02 03]
    [03 01 01 02]</div>
<ul class="guide-ul">
  <li>Combined with ShiftRows achieves <strong>full diffusion</strong> in 2 rounds.</li>
  <li>Multiplication by 02 in GF(2⁸) is a left shift + conditional XOR.</li>
  <li>The final round omits MixColumns for efficient inversion.</li>
</ul>`
    }
  },
  {
    title: { es: "AddRoundKey + Key Schedule", en: "AddRoundKey + Key Schedule" },
    content: {
      es: `<p><strong>AddRoundKey</strong> hace XOR del estado con la subclave de ronda actual — la única etapa que introduce el secreto.</p>
<div class="guide-mono-box">estado' = estado ⊕ subclave_ronda_i</div>
<p><strong>Key Schedule</strong> expande la clave original en <em>Nr+1</em> subclaves de 128 bits usando RotWord → SubWord → XOR con Rcon:</p>
<div class="guide-fact-row">
  <div class="guide-fact"><span class="guide-fact-label">AES-128</span><code>11 subclaves (176 bytes)</code></div>
  <div class="guide-fact"><span class="guide-fact-label">AES-192</span><code>13 subclaves (208 bytes)</code></div>
  <div class="guide-fact"><span class="guide-fact-label">AES-256</span><code>15 subclaves (240 bytes)</code></div>
</div>
<p>En memoria forense, el Key Schedule expandido tiene una firma de 176/208/240 bytes reconocible con Volatility.</p>`,
      en: `<p><strong>AddRoundKey</strong> XORs the state with the current round subkey — the only step that introduces the secret.</p>
<div class="guide-mono-box">state' = state ⊕ round_key_i</div>
<p><strong>Key Schedule</strong> expands the original key into <em>Nr+1</em> 128-bit subkeys using RotWord → SubWord → XOR with Rcon:</p>
<div class="guide-fact-row">
  <div class="guide-fact"><span class="guide-fact-label">AES-128</span><code>11 subkeys (176 bytes)</code></div>
  <div class="guide-fact"><span class="guide-fact-label">AES-192</span><code>13 subkeys (208 bytes)</code></div>
  <div class="guide-fact"><span class="guide-fact-label">AES-256</span><code>15 subkeys (240 bytes)</code></div>
</div>
<p>In memory forensics, the expanded Key Schedule has a recognizable 176/208/240-byte signature detectable with Volatility.</p>`
    }
  },
  {
    title: { es: "Modos de operación: ECB, CBC, GCM", en: "Modes of operation: ECB, CBC, GCM" },
    content: {
      es: `<p>AES es un cifrado de <em>bloque</em>: para mensajes largos se necesita un modo de operación.</p>
<ul class="guide-ul">
  <li><strong>ECB</strong> — bloques independientes. Idénticos bloques PT producen idénticos bloques CT. <span style="color:#f87171">Inseguro para datos con patrones.</span></li>
  <li><strong>CBC</strong> — cada bloque PT se XOR con el CT anterior. Requiere IV aleatorio. No autentica (necesita MAC separado).</li>
  <li><strong>GCM</strong> — modo AEAD: cifra y autentica en una pasada. Produce tag GHASH de 128 bits. Usado en TLS 1.3 (<code>TLS_AES_256_GCM_SHA384</code>). <span style="color:#34d399">Preferido hoy.</span></li>
</ul>
<div class="guide-mono-box">Ransomware moderno: AES-128-CBC o AES-256-GCM (clave cifrada con RSA/ECDH)</div>`,
      en: `<p>AES is a <em>block</em> cipher: a mode of operation is needed for longer messages.</p>
<ul class="guide-ul">
  <li><strong>ECB</strong> — independent blocks. Identical PT blocks produce identical CT blocks. <span style="color:#f87171">Insecure for patterned data.</span></li>
  <li><strong>CBC</strong> — each PT block is XORed with the previous CT. Requires random IV. Does not authenticate (requires a separate MAC).</li>
  <li><strong>GCM</strong> — AEAD mode: encrypts and authenticates in one pass. Produces 128-bit GHASH tag. Used in TLS 1.3 (<code>TLS_AES_256_GCM_SHA384</code>). <span style="color:#34d399">Preferred today.</span></li>
</ul>
<div class="guide-mono-box">Modern ransomware: AES-128-CBC or AES-256-GCM (key encrypted with RSA/ECDH)</div>`
    }
  },
  {
    title: { es: "AES en ciberseguridad operativa", en: "AES in operational cybersecurity" },
    content: {
      es: `<ul class="guide-ul">
  <li><strong>TLS 1.3:</strong> <code>TLS_AES_256_GCM_SHA384</code> — AES-GCM con nonce de 96 bits y tag GHASH. El cipher suite negociado aparece en el handshake de Wireshark y en el hash JA3.</li>
  <li><strong>Ransomware:</strong> LockBit 3.0, BlackCat/ALPHV usan AES híbrido — la clave AES se cifra con RSA/ECDH. Sin la clave privada del atacante no hay descifrado posible.</li>
  <li><strong>DFIR / memoria:</strong> el Key Schedule expandido tiene una firma de 176/208/240 bytes en el heap. Recuperable con <code>vol malfind</code> si el malware no lo limpia.</li>
  <li><strong>Cifrado de disco:</strong> BitLocker (AES-128/256-XTS), LUKS (AES-256-XTS), FileVault. El header del volumen identifica algoritmo y modo en triage forense.</li>
  <li><strong>YARA:</strong> la constante de inicialización del Key Schedule (<code>{ 01 00 00 00 01 00 00 00 }</code> de Rcon) permite escribir reglas de detección en binarios.</li>
</ul>`,
      en: `<ul class="guide-ul">
  <li><strong>TLS 1.3:</strong> <code>TLS_AES_256_GCM_SHA384</code> — AES-GCM with 96-bit nonce and GHASH tag. Cipher suite visible in Wireshark handshake and JA3 hash.</li>
  <li><strong>Ransomware:</strong> LockBit 3.0, BlackCat/ALPHV use hybrid AES — AES key encrypted with RSA/ECDH. Without the attacker's private key, decryption is impossible.</li>
  <li><strong>DFIR / memory:</strong> expanded Key Schedule has a 176/208/240-byte signature on the heap. Recoverable with <code>vol malfind</code> if the malware doesn't zero it out.</li>
  <li><strong>Disk encryption:</strong> BitLocker (AES-128/256-XTS), LUKS (AES-256-XTS), FileVault. Volume header identifies algorithm and mode during forensic triage.</li>
  <li><strong>YARA:</strong> Key Schedule Rcon constant (<code>{ 01 00 00 00 01 00 00 00 }</code>) allows writing detection rules for binaries.</li>
</ul>`
    }
  }
];

// ── State + Helpers ───────────────────────────────────────
const aesGuideState = { idx: 0 };

function aesGuideGetLang() {
  return (state && state.lang === "en") ? "en" : "es";
}

function aesGuidePick(v) {
  const L = aesGuideGetLang();
  return (v && typeof v === "object") ? (v[L] || v.es || "") : (v || "");
}

// ── Layout injection ──────────────────────────────────────
function initAesGuideLayout() {
  const container = document.getElementById("guideContent");
  if (!container || container.dataset.aesGuideInit) return;
  container.dataset.aesGuideInit = "1";

  container.innerHTML = `
    <div style="display:grid;grid-template-columns:220px 1fr;gap:20px;align-items:start">
      <div>
        <p style="font-size:.74rem;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin-bottom:10px">
          Temas
        </p>
        <ul id="aes-guide-list" style="list-style:none;display:flex;flex-direction:column;gap:4px;padding:0;margin:0"></ul>
      </div>
      <div style="border-left:1px solid var(--line);padding-left:20px;min-height:220px">
        <h3 id="aes-guide-title" style="color:var(--accent);margin-bottom:12px">—</h3>
        <div id="aes-guide-body" style="line-height:1.75;color:var(--text);font-size:.88rem"></div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:22px;padding-top:16px;border-top:1px solid var(--line)">
          <button id="aes-guide-prev" type="button"
            style="background:none;border:1px solid var(--line);color:var(--text);padding:7px 16px;border-radius:6px;cursor:pointer;font:inherit">&larr;</button>
          <span id="aes-guide-prog" style="color:var(--muted);font-size:.8rem">1 / ${AES_GUIDE.length}</span>
          <button id="aes-guide-next" type="button"
            style="background:none;border:1px solid var(--line);color:var(--text);padding:7px 16px;border-radius:6px;cursor:pointer;font:inherit">&rarr;</button>
        </div>
      </div>
    </div>`;

  // CSS local para la guía AES
  if (!document.getElementById("aes-guide-style")) {
    const s = document.createElement("style");
    s.id = "aes-guide-style";
    s.textContent = `
      .guide-fact-row { display:flex;gap:10px;flex-wrap:wrap;margin:10px 0; }
      .guide-fact { background:var(--bg2);border:1px solid var(--line);border-radius:6px;padding:8px 12px;font-size:.82rem; }
      .guide-fact-label { display:block;font-size:.7rem;color:var(--muted);margin-bottom:3px;text-transform:uppercase;letter-spacing:.05em; }
      .guide-fact code { font-family:var(--mono);color:var(--accent); }
      .guide-mono-box { background:rgba(0,0,0,.22);border:1px solid var(--line);border-left:3px solid var(--accent);border-radius:6px;padding:10px 14px;font-family:var(--mono);font-size:.78rem;white-space:pre-wrap;color:var(--accent);margin:10px 0;line-height:1.7; }
      .guide-ul { margin:10px 0;padding-left:1.2rem;display:flex;flex-direction:column;gap:6px; }
      .guide-ul li { font-size:.87rem;line-height:1.6; }
      #aes-guide-body p { margin-bottom:10px; }
    `;
    document.head.appendChild(s);
  }

  document.getElementById("aes-guide-prev")?.addEventListener("click", () => {
    if (aesGuideState.idx > 0) { aesGuideState.idx--; renderAesGuide(); }
  });
  document.getElementById("aes-guide-next")?.addEventListener("click", () => {
    if (aesGuideState.idx < AES_GUIDE.length - 1) { aesGuideState.idx++; renderAesGuide(); }
  });

  renderAesGuide();
}

function renderAesGuide() {
  const list  = document.getElementById("aes-guide-list");
  const title = document.getElementById("aes-guide-title");
  const body  = document.getElementById("aes-guide-body");
  const prog  = document.getElementById("aes-guide-prog");
  if (!list || !title || !body) return;

  // Lista lateral
  list.innerHTML = AES_GUIDE.map((s, i) => {
    const active = i === aesGuideState.idx;
    return `<li class="guide-item${active ? " active" : ""}"
      style="display:flex;align-items:flex-start;gap:8px;padding:8px 10px;border-radius:6px;cursor:pointer;
             font-size:.83rem;border:1px solid ${active ? "rgba(99,102,241,.3)" : "transparent"};
             background:${active ? "rgba(99,102,241,.08)" : "transparent"};
             color:${active ? "var(--accent)" : "var(--text)"};transition:background .12s"
      data-aes-guide-idx="${i}">
        <span style="color:var(--muted);font-size:.72rem;padding-top:1px;min-width:16px">${i + 1}</span>
        <span>${aesGuidePick(s.title)}</span>
    </li>`;
  }).join("");

  list.querySelectorAll("[data-aes-guide-idx]").forEach(el => {
    el.addEventListener("click", () => {
      aesGuideState.idx = parseInt(el.dataset.aesGuideIdx);
      renderAesGuide();
    });
  });

  // Contenido
  const s = AES_GUIDE[aesGuideState.idx];
  title.textContent = aesGuidePick(s.title);
  body.innerHTML    = aesGuidePick(s.content);
  if (prog) prog.textContent = (aesGuideState.idx + 1) + " / " + AES_GUIDE.length;
}

// ── Hook into language changes ────────────────────────────
const _origApplyLanguageAes = applyLanguage;
applyLanguage = function() {
  _origApplyLanguageAes();
  renderAesGuide();
};

// ── Init on DOMContentLoaded ──────────────────────────────
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAesGuideLayout);
} else {
  initAesGuideLayout();
}

// También inicializar cuando se hace click en la tab Guía (por si el layout no estaba visible)
document.addEventListener("click", function(e) {
  if (e.target && e.target.dataset && e.target.dataset.learnTab === "guide") {
    initAesGuideLayout();
  }
});
