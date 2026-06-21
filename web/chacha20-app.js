/**
 * ChaCha20-Poly1305 Educational Visualizer
 * RFC 8439 compliant implementation in JavaScript
 * Sin dependencias externas. Compatible con GitHub Pages.
 */

"use strict";
// ── Bilingual helpers ─────────────────────────────────────────────────────────
function getLang() {
  if (window.SITE_LANG) return window.SITE_LANG;
  try { return localStorage.getItem('site-lang') || 'es'; } catch(e) { return 'es'; }
}
function pickLang(v) {
  var L = getLang();
  if (v && typeof v === 'object') return v[L] || v.es || '';
  return v || '';
}
function cc20Tc(el, enText) {
  if (!el) return;
  if (el._i18nOrig === undefined) el._i18nOrig = el.textContent;
  el.textContent = (getLang() === 'en') ? enText : el._i18nOrig;
}


// ==================== CONSTANTES ====================

// "expand 32-byte k" en little-endian de 32 bits
const CC20_C0 = 0x61707865; // "expa"
const CC20_C1 = 0x3320646e; // "nd 3"
const CC20_C2 = 0x79622d32; // "2-by"
const CC20_C3 = 0x6b206574; // "te k"

// Indices activos por ronda (para visualizacion)
// Column round: 4 QRs sobre columnas
const COLUMN_QR = [[0,4,8,12],[1,5,9,13],[2,6,10,14],[3,7,11,15]];
// Diagonal round: 4 QRs sobre diagonales
const DIAGONAL_QR = [[0,5,10,15],[1,6,11,12],[2,7,8,13],[3,4,9,14]];

// Roles de cada celda (para colorear estado inicial)
// 0=const, 1=key, 2=counter/nonce
const CELL_ROLES = [0,0,0,0, 1,1,1,1, 1,1,1,1, 2,2,2,2];

// ==================== UTILIDADES ====================

function rotl32(v, n) {
  return ((v << n) | (v >>> (32 - n))) >>> 0;
}

function toHex32(v) {
  return (v >>> 0).toString(16).toUpperCase().padStart(8, '0');
}

function toHex8(v) {
  return (v >>> 0).toString(16).toUpperCase().padStart(2, '0');
}

// Little-endian: hex string -> array de words de 32 bits
function hexToLEWords(hex, count) {
  const words = [];
  for (let i = 0; i < count * 8; i += 8) {
    const b = hex.slice(i, i + 8).padEnd(8, '0');
    const le = b[6]+b[7]+b[4]+b[5]+b[2]+b[3]+b[0]+b[1];
    words.push(parseInt(le, 16) >>> 0);
  }
  return words;
}

// Little-endian: word de 32 bits -> 4 bytes
function wordToLEBytes(w) {
  return [w & 0xff, (w >> 8) & 0xff, (w >> 16) & 0xff, (w >> 24) & 0xff];
}

// Array de words -> array de bytes (LE)
function wordsToBytes(words) {
  const out = [];
  for (const w of words) out.push(...wordToLEBytes(w));
  return out;
}

// Array de bytes (LE) -> BigInt
function bytesToBigIntLE(bytes) {
  let v = 0n;
  for (let i = bytes.length - 1; i >= 0; i--) {
    v = (v << 8n) | BigInt(bytes[i]);
  }
  return v;
}

// Array de bytes -> hex string
function bytesToHex(bytes) {
  return bytes.map(b => b.toString(16).padStart(2,'0').toUpperCase()).join('');
}

// Hex string -> array de bytes
function hexToBytes(hex) {
  if (!hex) return [];
  const clean = hex.replace(/\s+/g,'');
  const out = [];
  for (let i = 0; i < clean.length; i += 2) {
    out.push(parseInt(clean.slice(i, i + 2), 16));
  }
  return out;
}

function countDiff32(a, b) {
  let x = (a ^ b) >>> 0, n = 0;
  while (x) { n += x & 1; x >>>= 1; }
  return n;
}

// ==================== QUARTER ROUND ====================

function quarterRound(s, ai, bi, ci, di) {
  let a = s[ai], b = s[bi], c = s[ci], d = s[di];
  a = (a + b) >>> 0; d ^= a; d = rotl32(d, 16);
  c = (c + d) >>> 0; b ^= c; b = rotl32(b, 12);
  a = (a + b) >>> 0; d ^= a; d = rotl32(d,  8);
  c = (c + d) >>> 0; b ^= c; b = rotl32(b,  7);
  const out = [...s];
  out[ai] = a; out[bi] = b; out[ci] = c; out[di] = d;
  return out;
}

// ==================== CHACHA20 BLOCK ====================

function chacha20Block(keyWords, nonceWords, counter) {
  const init = [
    CC20_C0, CC20_C1, CC20_C2, CC20_C3,
    keyWords[0], keyWords[1], keyWords[2], keyWords[3],
    keyWords[4], keyWords[5], keyWords[6], keyWords[7],
    counter >>> 0, nonceWords[0], nonceWords[1], nonceWords[2]
  ];

  let state = [...init];
  const roundDetails = [];

  for (let dr = 0; dr < 10; dr++) {
    // -- Column round --
    const beforeCol = [...state];
    for (const [a,b,c,d] of COLUMN_QR) state = quarterRound(state, a, b, c, d);
    const afterCol = [...state];

    // -- Diagonal round --
    const beforeDiag = [...state];
    for (const [a,b,c,d] of DIAGONAL_QR) state = quarterRound(state, a, b, c, d);
    const afterDiag = [...state];

    roundDetails.push({ dr: dr + 1, beforeCol, afterCol, beforeDiag, afterDiag });
  }

  // Add initial state
  const beforeAdd = [...state];
  for (let i = 0; i < 16; i++) state[i] = (state[i] + init[i]) >>> 0;
  const afterAdd = [...state];

  return { init, roundDetails, beforeAdd, afterAdd, keystream: [...state] };
}

// ==================== POLY1305 ====================

const P1305 = (1n << 130n) - 5n;

function poly1305Tag(poly1305Key, ad, ciphertext) {
  // r = first 16 bytes clamped, s = last 16 bytes
  const rBytes = [...poly1305Key.slice(0, 16)];
  rBytes[3]  &= 15; rBytes[7]  &= 15;
  rBytes[11] &= 15; rBytes[15] &= 15;
  rBytes[4]  &= 252; rBytes[8]  &= 252;
  rBytes[12] &= 252;

  const r = bytesToBigIntLE(rBytes);
  const s = bytesToBigIntLE(poly1305Key.slice(16, 32));

  // Mensaje para Poly1305: AD con padding || CT con padding || len(AD) || len(CT)
  function pad16(bytes) {
    const rem = bytes.length % 16;
    return rem === 0 ? [...bytes] : [...bytes, ...new Array(16 - rem).fill(0)];
  }

  const adLen = BigInt(ad.length);
  const ctLen = BigInt(ciphertext.length);

  const msg = [
    ...pad16(ad),
    ...pad16(ciphertext),
    ...wordToLEBytes(Number(adLen & 0xffffffffn)),
    ...wordToLEBytes(Number((adLen >> 32n) & 0xffffffffn)),
    ...wordToLEBytes(Number(ctLen & 0xffffffffn)),
    ...wordToLEBytes(Number((ctLen >> 32n) & 0xffffffffn))
  ];

  let acc = 0n;
  for (let i = 0; i < msg.length; i += 16) {
    const block = msg.slice(i, i + 16);
    const n = bytesToBigIntLE([...block, 0x01]);
    acc = ((acc + n) * r) % P1305;
  }
  acc = (acc + s) % (1n << 128n);

  // Convertir a 16 bytes LE
  const tagBytes = [];
  let tmp = acc;
  for (let i = 0; i < 16; i++) { tagBytes.push(Number(tmp & 0xffn)); tmp >>= 8n; }
  return tagBytes;
}

// ==================== MOTOR PRINCIPAL ====================

class ChaCha20Poly1305 {
  constructor() { this.allData = null; }
  reset()        { this.allData = null; }

  run(keyHex, nonceHex, adHex, ptHex) {
    const keyWords   = hexToLEWords(keyHex,   8);
    const nonceWords = hexToLEWords(nonceHex, 3);
    const adBytes    = hexToBytes(adHex);
    const ptBytes    = hexToBytes(ptHex);

    // Bloque 0: clave Poly1305
    const block0 = chacha20Block(keyWords, nonceWords, 0);
    const poly1305KeyBytes = wordsToBytes(block0.keystream).slice(0, 32);

    // Cifrado: bloques 1, 2, ...
    const ctBytes = [];
    const encBlocks = [];
    for (let i = 0; i * 64 < ptBytes.length || (ptBytes.length === 0 && i === 0); i++) {
      if (ptBytes.length === 0) break;
      const blkData   = chacha20Block(keyWords, nonceWords, i + 1);
      const ks        = wordsToBytes(blkData.keystream);
      const ptSlice   = ptBytes.slice(i * 64, (i + 1) * 64);
      const ctSlice   = ptSlice.map((b, j) => b ^ ks[j]);
      ctBytes.push(...ctSlice);
      encBlocks.push({ blockNum: i + 1, blkData, ptSlice, ctSlice, ks: ks.slice(0, ptSlice.length) });
    }

    // Tag
    const tagBytes = poly1305Tag(poly1305KeyBytes, adBytes, ctBytes);

    this.allData = {
      keyWords, nonceWords, adBytes, ptBytes,
      block0, poly1305KeyBytes,
      encBlocks, ctBytes, tagBytes
    };

    return {
      ciphertext: bytesToHex(ctBytes),
      tag: bytesToHex(tagBytes),
      data: this.allData
    };
  }
}

// ==================== PASOS DE EJECUCION PLANOS ====================

function buildExecutionSteps(data) {
  const steps = [];
  const PC = {
    setup:   'var(--accent)',
    block0:  '#60a5fa',
    poly:    '#34d399',
    encrypt: 'var(--accent-chacha)',
    tag:     'var(--accent-chacha)'
  };

  // 1. Ensamblado del estado inicial
  const blank = new Array(16).fill(0);
  steps.push({
    type:       'matrix',
    phase:      'Setup', phaseColor: PC.setup,
    title:      'Ensamblado del estado inicial (Bloque de clave Poly1305, counter=0)',
    operation:  'IV || Key || Counter=0 || Nonce',
    description: {
      es: '<strong>Constantes</strong> (azul): "expand 32-byte k" — 4 words fijas, mismas para todos.<br><strong>Clave</strong> (verde): 8 words × 32 bits = 256 bits en little-endian.<br><strong>Counter=0</strong> + <strong>Nonce</strong> (naranja): 1 + 3 words = 128 bits.<br>Este bloque genera la clave de 32 bytes para Poly1305.',
      en: '<strong>Constants</strong> (blue): "expand 32-byte k" — 4 fixed words, same for everyone.<br><strong>Key</strong> (green): 8 words × 32 bits = 256 bits in little-endian.<br><strong>Counter=0</strong> + <strong>Nonce</strong> (orange): 1 + 3 words = 128 bits.<br>This block generates the 32-byte one-time key for Poly1305.'
    },
    before: blank,
    after:  data.block0.init,
    activeIndices: []
  });

  // 2. 10 double-rounds del bloque 0
  for (const rd of data.block0.roundDetails) {
    steps.push({
      type:       'matrix',
      phase:      'Bloque 0 — Ronda columnas', phaseColor: PC.block0,
      title:      'Ronda de columnas ' + rd.dr + ' / 10',
      operation:  'QR(0,4,8,12) · QR(1,5,9,13) · QR(2,6,10,14) · QR(3,7,11,15)',
      description: {
        es: '4 Quarter-Rounds en paralelo sobre las <strong>columnas</strong> de la matriz.<br><strong>Quarter-Round</strong>: a+=b; d^=a; d&lt;&lt;&lt;=16; c+=d; b^=c; b&lt;&lt;&lt;=12; a+=b; d^=a; d&lt;&lt;&lt;=8; c+=d; b^=c; b&lt;&lt;&lt;=7.<br>Solo ADD, ROTATE y XOR — sin tablas, resistente a timing attacks.',
        en: '4 Quarter-Rounds in parallel on the matrix <strong>columns</strong>.<br><strong>Quarter-Round</strong>: a+=b; d^=a; d&lt;&lt;&lt;=16; c+=d; b^=c; b&lt;&lt;&lt;=12; a+=b; d^=a; d&lt;&lt;&lt;=8; c+=d; b^=c; b&lt;&lt;&lt;=7.<br>Only ADD, ROTATE and XOR — no tables, resistant to timing attacks.'
      },
      before: rd.beforeCol,
      after:  rd.afterCol,
      activeIndices: COLUMN_QR.flat()
    });
    steps.push({
      type:       'matrix',
      phase:      'Bloque 0 — Ronda diagonales', phaseColor: PC.block0,
      title:      'Ronda de diagonales ' + rd.dr + ' / 10',
      operation:  'QR(0,5,10,15) · QR(1,6,11,12) · QR(2,7,8,13) · QR(3,4,9,14)',
      description: {
        es: '4 Quarter-Rounds en paralelo sobre las <strong>diagonales</strong>.<br>Combinando columnas y diagonales se garantiza que cada word influye sobre todas las demás en pocas rondas. Cada par columna+diagonal forma un <strong>double-round</strong>.',
        en: '4 Quarter-Rounds in parallel on the matrix <strong>diagonals</strong>.<br>Alternating columns and diagonals ensures every word influences all others within a few rounds. Each column+diagonal pair forms one <strong>double-round</strong>.'
      },
      before: rd.beforeDiag,
      after:  rd.afterDiag,
      activeIndices: DIAGONAL_QR.flat()
    });
  }

  // 3. Sumar estado inicial
  steps.push({
    type:       'matrix',
    phase:      'Bloque 0 — Suma', phaseColor: PC.block0,
    title:      'Suma del estado inicial',
    operation:  'state[i] += init[i] (mod 2^32)',
    description: {
      es: 'Cada word del estado mezclado se suma (mod 2³²) con el estado original. Esto hace que la función sea <strong>no invertible</strong> sin la clave: aunque alguien observe el keystream, no puede recuperar el estado intermedio.',
      en: 'Each word of the mixed state is added (mod 2³²) to the original state. This makes the function <strong>non-invertible</strong> without the key: even if someone observes the keystream, they cannot recover the intermediate state.'
    },
    before: data.block0.beforeAdd,
    after:  data.block0.afterAdd,
    activeIndices: Array.from({length:16},(_,i)=>i)
  });

  // 4. Derivacion clave Poly1305
  const poly1305KeyWords = hexToLEWords(bytesToHex(data.poly1305KeyBytes), 8);
  steps.push({
    type:       'matrix',
    phase:      'Poly1305 — Clave', phaseColor: PC.poly,
    title:      'Derivación de la clave Poly1305 (primeros 32 bytes del keystream 0)',
    operation:  'poly1305_key = keystream[0][0..31]',
    description: {
      es: 'Los primeros 32 bytes del bloque 0 forman la clave one-time de Poly1305.<br><strong>r</strong> (16 bytes, clamped): coeficiente polinomial.<br><strong>s</strong> (16 bytes): desplazamiento final. Ambos son únicos por mensaje.',
      en: 'The first 32 bytes of block 0 form the Poly1305 one-time key.<br><strong>r</strong> (16 bytes, clamped): polynomial coefficient.<br><strong>s</strong> (16 bytes): final offset. Both are unique per message.'
    },
    before: data.block0.afterAdd,
    after:  [...poly1305KeyWords, ...new Array(8).fill(0)],
    activeIndices: [0,1,2,3,4,5,6,7]
  });

  // 5. Bloques de cifrado
  for (const enc of data.encBlocks) {
    const bd = enc.blkData;

    // Rondas del bloque de cifrado (resumidas para no duplicar 20 pasos por bloque)
    steps.push({
      type:       'matrix',
      phase:      'Cifrado — Bloque ' + enc.blockNum, phaseColor: PC.encrypt,
      title:      'Generar keystream — Bloque ' + enc.blockNum + ' (counter=' + enc.blockNum + ')',
      operation:  '20 rondas ChaCha20 → keystream[' + (enc.blockNum) + ']',
      description: {
        es: 'Mismo proceso que bloque 0 pero con <strong>counter=' + enc.blockNum + '</strong>. El counter garantiza que cada bloque de 64 bytes tenga un keystream diferente, evitando que bloques distintos puedan ser XOR-eados entre sí.',
        en: 'Same process as block 0 but with <strong>counter=' + enc.blockNum + '</strong>. The counter ensures each 64-byte block has a different keystream, preventing distinct blocks from being XOR-ed against each other.'
      },
      before: bd.init,
      after:  bd.afterAdd,
      activeIndices: Array.from({length:16},(_,i)=>i)
    });

    // XOR
    const ptWords  = bytesToHex(enc.ptSlice).padEnd(128,'0').match(/.{8}/g).slice(0,16).map(h=>parseInt(h,16)>>>0);
    const ctWords  = bytesToHex(enc.ctSlice).padEnd(128,'0').match(/.{8}/g).slice(0,16).map(h=>parseInt(h,16)>>>0);
    const ksWords  = bytesToHex(enc.ks).padEnd(128,'0').match(/.{8}/g).slice(0,16).map(h=>parseInt(h,16)>>>0);
    steps.push({
      type:       'xor',
      phase:      'Cifrado — XOR Bloque ' + enc.blockNum, phaseColor: PC.encrypt,
      title:      'Cifrado — XOR Plaintext ⊕ Keystream (Bloque ' + enc.blockNum + ')',
      operation:  'CT = PT XOR KS',
      description: {
        es: '<strong>PT:</strong>  <code style="color:var(--text)">' + bytesToHex(enc.ptSlice) + '</code><br><strong>KS:</strong>  <code style="color:var(--accent-chacha)">' + bytesToHex(enc.ks) + '</code><br><strong>CT:</strong>  <code style="color:var(--accent-2)">' + bytesToHex(enc.ctSlice) + '</code><br>El CT es simplemente PT XOR keystream — la seguridad viene de que el keystream es impredecible sin la clave.',
        en: '<strong>PT:</strong>  <code style="color:var(--text)">' + bytesToHex(enc.ptSlice) + '</code><br><strong>KS:</strong>  <code style="color:var(--accent-chacha)">' + bytesToHex(enc.ks) + '</code><br><strong>CT:</strong>  <code style="color:var(--accent-2)">' + bytesToHex(enc.ctSlice) + '</code><br>CT is simply PT XOR keystream — security comes from the keystream being unpredictable without the key.'
      },
      ptWords, ksWords, ctWords,
      before: ksWords,
      after:  ctWords,
      activeIndices: [],
      extra: { label: {es:'CT bloque '+enc.blockNum,en:'CT block '+enc.blockNum}, value: bytesToHex(enc.ctSlice), color: 'var(--accent-2)' }
    });
  }

  // 6. Tag Poly1305
  const tagWords = bytesToHex(data.tagBytes).match(/.{8}/g).map(h=>parseInt(h,16)>>>0);
  steps.push({
    type:       'tag',
    phase:      'Poly1305 — Tag', phaseColor: PC.tag,
    title:      'Generación del Tag de autenticación (Poly1305)',
    operation:  'tag = Poly1305(r, s, AD || CT)',
    description: {
      es: 'Poly1305 evalúa un polinomio sobre GF(2¹³⁰ − 5):<br>acc = 0 → para cada bloque de 16B: acc = (acc + bloque) × r mod p → tag = (acc + s) mod 2¹²⁸<br><strong>AD:</strong>  ' + (data.adBytes.length ? bytesToHex(data.adBytes) : '(vacío)') + '<br><strong>CT:</strong>  ' + (data.ctBytes.length ? bytesToHex(data.ctBytes) : '(vacío)') + '<br><strong>Tag:</strong> <code style="color:var(--accent-chacha)">' + bytesToHex(data.tagBytes) + '</code>',
      en: 'Poly1305 evaluates a polynomial over GF(2¹³⁰ − 5):<br>acc = 0 → for each 16B block: acc = (acc + block) × r mod p → tag = (acc + s) mod 2¹²⁸<br><strong>AD:</strong>  ' + (data.adBytes.length ? bytesToHex(data.adBytes) : '(empty)') + '<br><strong>CT:</strong>  ' + (data.ctBytes.length ? bytesToHex(data.ctBytes) : '(empty)') + '<br><strong>Tag:</strong> <code style="color:var(--accent-chacha)">' + bytesToHex(data.tagBytes) + '</code>'
    },
    before: new Array(16).fill(0),
    after:  [...tagWords, ...new Array(12).fill(0)],
    activeIndices: [0,1,2,3],
    extra: { label: {es:'Tag',en:'Tag'}, value: bytesToHex(data.tagBytes), color: 'var(--accent-chacha)' }
  });

  return steps;
}

// ==================== RENDERIZADO ====================

function renderMatrixPanel(state, prevState, containerId, activeIndices) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const activeSet = new Set(activeIndices || []);
  el.innerHTML = '<div class="chacha-matrix">' +
    state.map((v, i) => {
      const role = ['chacha-cell--const','chacha-cell--key','chacha-cell--nonce'][CELL_ROLES[i]] || '';
      const changed = prevState && countDiff32(prevState[i], v) > 0;
      const active  = activeSet.has(i);
      let cls = 'chacha-cell';
      if (active)        cls += ' chacha-cell--active';
      else if (changed)  cls += ' chacha-cell--changed';
      else if (!prevState && role) cls += ' ' + role;
      return '<div class="' + cls + '">' + toHex32(v) + '</div>';
    }).join('') +
    '</div>';
}

function renderCurrentStep() {
  if (!executionSteps.length) return;
  const step  = executionSteps[currentStep];
  const total = executionSteps.length;

  const counter = document.getElementById('cc20StepCounter');
  if (counter) counter.textContent = (getLang()==='en'?'Step':'Paso') + ' ' + (currentStep + 1) + ' / ' + total;

  const phaseEl = document.getElementById('cc20PhaseInfo');
  if (phaseEl) { phaseEl.textContent = step.phase; phaseEl.style.color = step.phaseColor; }

  const opEl = document.getElementById('cc20PhaseTag');
  if (opEl) opEl.textContent = step.operation;

  renderMatrixPanel(step.before, null,        'cc20BeforeState', step.activeIndices);
  renderMatrixPanel(step.after,  step.before, 'cc20AfterState',  step.activeIndices);

  const explEl = document.getElementById('cc20Explanation');
  if (explEl) explEl.innerHTML = pickLang(step.description);

  const extraEl = document.getElementById('cc20Extra');
  if (extraEl) {
    if (step.extra) {
      extraEl.hidden = false;
      extraEl.innerHTML =
        '<span class="result-label">' + pickLang(step.extra.label) + '</span>' +
        '<span class="result-val" style="color:' + (step.extra.color || 'var(--accent-chacha)') + '">' +
        step.extra.value + '</span>';
    } else {
      extraEl.hidden = true;
    }
  }

  const changesEl = document.getElementById('cc20Changes');
  if (changesEl) {
    const diffs = step.before.map((v, i) => {
      const n = countDiff32(v, step.after[i]);
      return n > 0
        ? '<div class="change-item"><span class="change-reg">w' + i.toString().padStart(2,'0') + '</span>' +
          '<span class="change-bits">' + n + ' bits</span></div>'
        : '';
    }).filter(Boolean).join('');
    changesEl.innerHTML = diffs ||
      '<span style="color:var(--muted);font-size:.8rem">' + (getLang()==="en"?"No changes in this step":"Sin cambios en este paso") + '</span>';
  }

  updateNavButtons();
}

function updateNavButtons() {
  const prev = document.getElementById('cc20PrevBtn');
  const next = document.getElementById('cc20NextBtn');
  if (prev) prev.disabled = currentStep === 0;
  if (next) next.disabled = currentStep >= executionSteps.length - 1;
}

// ==================== ESTADO DE LA APP ====================

let cc20Engine    = new ChaCha20Poly1305();
let executionSteps = [];
let currentStep    = 0;

function getInputs() {
  return {
    key:   document.getElementById('cc20KeyInput')?.value.trim().replace(/\s+/g,'') || '',
    nonce: document.getElementById('cc20NonceInput')?.value.trim().replace(/\s+/g,'') || '',
    ad:    document.getElementById('cc20AdInput')?.value.trim().replace(/\s+/g,'') || '',
    pt:    document.getElementById('cc20PtInput')?.value.trim().replace(/\s+/g,'') || ''
  };
}

function showError(msg) {
  const el = document.getElementById('cc20Error');
  if (!el) return;
  el.textContent = msg;
  el.hidden = !msg;
}

function randHex(bytes) {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)))
    .map(b => b.toString(16).padStart(2,'0')).join('').toUpperCase();
}

function runCC20() {
  showError('');
  const { key, nonce, ad, pt } = getInputs();
  if (!key   || key.length   !== 64) { showError('Key: 64 caracteres hex (256 bits)');    return; }
  if (!nonce || nonce.length !== 24) { showError('Nonce: 24 caracteres hex (96 bits)');    return; }
  if (!/^[0-9A-Fa-f]*$/.test(key+nonce+ad+pt)) { showError('Solo caracteres hex (0-9, A-F)'); return; }

  try {
    cc20Engine.reset();
    const result = cc20Engine.run(key, nonce, ad, pt);

    executionSteps = buildExecutionSteps(result.data);
    currentStep    = 0;

    const ctEl = document.getElementById('cc20Ciphertext');
    if (ctEl) ctEl.textContent = result.ciphertext || '(vacio)';
    const tagEl = document.getElementById('cc20Tag');
    if (tagEl) tagEl.textContent = result.tag;

    const resEl = document.getElementById('cc20Result');
    if (resEl) resEl.hidden = false;
    const vizEl = document.getElementById('cc20VizSection');
    if (vizEl) vizEl.hidden = false;
    const phEl = document.getElementById('cc20Placeholder');
    if (phEl) phEl.hidden = true;

    renderCurrentStep();
    updateNavButtons();
  } catch(e) {
    showError('Error: ' + e.message);
    console.error(e);
  }
}

function compareRuns() {
  const k1  = document.getElementById('cc20CmpKey1')?.value.trim().replace(/\s+/g,'') || '';
  const n1  = document.getElementById('cc20CmpNonce1')?.value.trim().replace(/\s+/g,'') || '';
  const pt1 = document.getElementById('cc20CmpPt1')?.value.trim().replace(/\s+/g,'') || '';
  const k2  = document.getElementById('cc20CmpKey2')?.value.trim().replace(/\s+/g,'') || '';
  const n2  = document.getElementById('cc20CmpNonce2')?.value.trim().replace(/\s+/g,'') || '';
  const pt2 = document.getElementById('cc20CmpPt2')?.value.trim().replace(/\s+/g,'') || '';
  const out = document.getElementById('cc20CmpOutput');
  if (!out) return;

  if (k1.length !== 64 || n1.length !== 24 || k2.length !== 64 || n2.length !== 24) {
    out.textContent = 'Key: 64 hex · Nonce: 24 hex (ambas ejecuciones)'; return;
  }

  try {
    const eng1 = new ChaCha20Poly1305(); const r1 = eng1.run(k1, n1, '', pt1);
    const eng2 = new ChaCha20Poly1305(); const r2 = eng2.run(k2, n2, '', pt2);

    const tagDiff = [...r1.tag].filter((c,i) => c !== r2.tag[i]).length;
    const ctDiff  = (r1.ciphertext && r2.ciphertext && r1.ciphertext.length === r2.ciphertext.length)
      ? [...r1.ciphertext].filter((c,i) => c !== r2.ciphertext[i]).length : 'n/a';
    const pct = Math.round(tagDiff / r1.tag.length * 100);

    out.textContent =
'Ejecucion 1\n  Key: ' + k1 + '\n  Nonce: ' + n1 + '\n  CT : ' + (r1.ciphertext||'(vacio)') + '\n  Tag: ' + r1.tag +
'\n\nEjecucion 2\n  Key: ' + k2 + '\n  Nonce: ' + n2 + '\n  CT : ' + (r2.ciphertext||'(vacio)') + '\n  Tag: ' + r2.tag +
'\n\n-----------------------------------------' +
'\nDiferencia CT  : ' + ctDiff + ' chars hex distintos' +
'\nDiferencia Tag : ' + tagDiff + ' / ' + r1.tag.length + ' chars hex distintos' +
'\nEfecto avalancha (tag): ~' + pct + '%';
  } catch(e) { out.textContent = 'Error: ' + e.message; }
}

function exportJSON() {
  if (!executionSteps.length) return;
  const { key, nonce, ad, pt } = getInputs();
  const data = {
    algorithm: 'ChaCha20-Poly1305 (RFC 8439)', timestamp: new Date().toISOString(),
    inputs: { key, nonce, associatedData: ad, plaintext: pt },
    ciphertext: document.getElementById('cc20Ciphertext')?.textContent || '',
    tag:        document.getElementById('cc20Tag')?.textContent || '',
    totalSteps: executionSteps.length,
    steps: executionSteps.map((s, i) => ({
      index: i+1, phase: s.phase, title: s.title, operation: s.operation,
      stateBefore: s.before.map(toHex32),
      stateAfter:  s.after.map(toHex32)
    }))
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'chacha20poly1305_execution.json'; a.click();
  URL.revokeObjectURL(a.href);
}

// ==================== GUIA EDUCATIVA ====================

const CC20_GUIDE = [
  {
    title: { es: 'Que es ChaCha20-Poly1305?', en: 'What is ChaCha20-Poly1305?' },
    content: {
      es: 'ChaCha20-Poly1305 es un cifrado <strong>AEAD</strong> (Authenticated Encryption with Associated Data) definido en el RFC 8439. Es el estándar de facto en TLS 1.3, WireGuard y Signal.<br><br>Combina <strong>ChaCha20</strong> (stream cipher) para confidencialidad y <strong>Poly1305</strong> (MAC) para autenticación, garantizando que ninguna alteración pase desapercibida.',
      en: 'ChaCha20-Poly1305 is an <strong>AEAD</strong> (Authenticated Encryption with Associated Data) cipher defined in RFC 8439. It is the de facto standard in TLS 1.3, WireGuard and Signal.<br><br>Combines <strong>ChaCha20</strong> (stream cipher) for confidentiality and <strong>Poly1305</strong> (MAC) for authentication, ensuring no modification goes undetected.'
    }
  },
  {
    title: { es: 'ARX: Add-Rotate-XOR', en: 'ARX: Add-Rotate-XOR' },
    content: {
      es: 'ChaCha20 solo usa tres operaciones sobre enteros de 32 bits:<br><br><strong>ADD</strong>: suma modular 2³²<br><strong>ROTATE</strong>: rotación a izquierda (<<<)<br><strong>XOR</strong>: or exclusivo<br><br>Sin tablas de lookup ni operaciones en campo de Galois. Velocidad uniforme: resistente a timing y cache-timing attacks.',
      en: 'ChaCha20 uses only three operations on 32-bit integers:<br><br><strong>ADD</strong>: modular addition mod 2³²<br><strong>ROTATE</strong>: left rotation (<<<)<br><strong>XOR</strong>: exclusive or<br><br>No lookup tables, no Galois field operations. Uniform speed: resistant to timing and cache-timing attacks.'
    }
  },
  {
    title: { es: 'Estado 4x4: 16 words de 32 bits', en: '4×4 State: 16 32-bit Words' },
    content: {
      es: 'El estado inicial es una matriz 4×4 de words de 32 bits (512 bits totales):<br><br><code>[ expa ][ nd 3 ][ 2-by ][ te k ]  ← constantes</code><br><code>[ k[0] ][ k[1] ][ k[2] ][ k[3] ]  ← clave (low)</code><br><code>[ k[4] ][ k[5] ][ k[6] ][ k[7] ]  ← clave (high)</code><br><code>[ cnt  ][ n[0] ][ n[1] ][ n[2] ]  ← counter + nonce</code>',
      en: 'The initial state is a 4×4 matrix of 32-bit words (512 bits total):<br><br><code>[ expa ][ nd 3 ][ 2-by ][ te k ]  ← constants</code><br><code>[ k[0] ][ k[1] ][ k[2] ][ k[3] ]  ← key (low)</code><br><code>[ k[4] ][ k[5] ][ k[6] ][ k[7] ]  ← key (high)</code><br><code>[ cnt  ][ n[0] ][ n[1] ][ n[2] ]  ← counter + nonce</code>'
    }
  },
  {
    title: { es: 'Quarter Round (QR)', en: 'Quarter Round (QR)' },
    content: {
      es: 'El QR opera sobre 4 words (a, b, c, d) con 8 operaciones ARX:<br><br><code>a+=b; d^=a; d&lt;&lt;&lt;=16;</code><br><code>c+=d; b^=c; b&lt;&lt;&lt;=12;</code><br><code>a+=b; d^=a; d&lt;&lt;&lt;=8;</code><br><code>c+=d; b^=c; b&lt;&lt;&lt;=7;</code><br><br>Difunde bits de las 4 words entre sí con cada llamada.',
      en: 'The QR operates on 4 words (a, b, c, d) with 8 ARX steps:<br><br><code>a+=b; d^=a; d&lt;&lt;&lt;=16;</code><br><code>c+=d; b^=c; b&lt;&lt;&lt;=12;</code><br><code>a+=b; d^=a; d&lt;&lt;&lt;=8;</code><br><code>c+=d; b^=c; b&lt;&lt;&lt;=7;</code><br><br>Diffuses bits of all 4 words into each other with every call.'
    }
  },
  {
    title: { es: 'Rondas de columnas y diagonales', en: 'Column and Diagonal Rounds' },
    content: {
      es: 'Un <strong>double-round</strong> = ronda de columnas + ronda de diagonales.<br><br><strong>Columnas:</strong> QR(0,4,8,12) · QR(1,5,9,13) · QR(2,6,10,14) · QR(3,7,11,15)<br><strong>Diagonales:</strong> QR(0,5,10,15) · QR(1,6,11,12) · QR(2,7,8,13) · QR(3,4,9,14)<br><br>ChaCha20 aplica 10 double-rounds = 20 rondas totales.',
      en: 'One <strong>double-round</strong> = column round + diagonal round.<br><br><strong>Columns:</strong> QR(0,4,8,12) · QR(1,5,9,13) · QR(2,6,10,14) · QR(3,7,11,15)<br><strong>Diagonals:</strong> QR(0,5,10,15) · QR(1,6,11,12) · QR(2,7,8,13) · QR(3,4,9,14)<br><br>ChaCha20 applies 10 double-rounds = 20 rounds total.'
    }
  },
  {
    title: { es: 'Keystream y cifrado', en: 'Keystream and Encryption' },
    content: {
      es: 'Cada llamada a ChaCha20Block produce 64 bytes de keystream:<br><br>1. Inicializar estado<br>2. 20 rondas ARX<br>3. Sumar estado inicial (mod 2³²)<br>4. Serializar en little-endian<br><br>El cifrado es: <strong>CT = PT XOR KS</strong>. El counter se incrementa en 1 por cada bloque de 64 bytes.',
      en: 'Each ChaCha20Block call produces 64 bytes of keystream:<br><br>1. Initialize state<br>2. 20 ARX rounds<br>3. Add initial state (mod 2³²)<br>4. Serialize in little-endian<br><br>Encryption: <strong>CT = PT XOR KS</strong>. The counter increments by 1 per 64-byte block.'
    }
  },
  {
    title: { es: 'Poly1305 MAC', en: 'Poly1305 MAC' },
    content: {
      es: 'Poly1305 evalúa un polinomio en GF(2¹³⁰ − 5):<br><br>Clave one-time: <strong>r</strong> (16 bytes clamped) y <strong>s</strong> (16 bytes)<br>Por cada bloque de 16 bytes del mensaje: acc = (acc + bloque) × r mod p<br>Tag final: (acc + s) mod 2¹²⁸<br><br>La clave one-time se deriva del bloque 0 del keystream (counter=0).',
      en: 'Poly1305 evaluates a polynomial over GF(2¹³⁰ − 5):<br><br>One-time key: <strong>r</strong> (16 bytes, clamped) and <strong>s</strong> (16 bytes)<br>For each 16-byte message block: acc = (acc + block) × r mod p<br>Final tag: (acc + s) mod 2¹²⁸<br><br>The one-time key is derived from keystream block 0 (counter=0).'
    }
  },
  {
    title: { es: 'Nonce y seguridad', en: 'Nonce and Security' },
    content: {
      es: 'El nonce de 96 bits (12 bytes) <strong>nunca debe reutilizarse</strong> con la misma clave.<br><br>A diferencia de AES-GCM, ChaCha20-Poly1305 es immune a los ataques de nonce-reuse parcial en Poly1305 si se sigue el RFC correctamente.<br><br>Ventaja sobre AES-GCM: no requiere hardware AES-NI para ser rápido y seguro, lo que lo hace preferido en dispositivos móviles y embedded.',
      en: 'The 96-bit (12-byte) nonce <strong>must never be reused</strong> with the same key.<br><br>Unlike AES-GCM, ChaCha20-Poly1305 is resistant to partial nonce-reuse attacks on Poly1305 when following the RFC correctly.<br><br>Advantage over AES-GCM: does not require AES-NI hardware to be fast and secure — preferred on mobile and embedded devices.'
    }
  }
];

function renderGuide() {
  const el = document.getElementById('cc20GuideContent');
  if (!el) return;
  el.innerHTML = CC20_GUIDE.map((s,i) =>
    '<div class="guide-card">' +
    '<h3>' + (i+1) + '. ' + pickLang(s.title) + '</h3>' +
    '<div class="prose">' + pickLang(s.content) + '</div>' +
    '</div>'
  ).join('');
}

// ==================== INICIALIZACION ====================


// ==================== IDIOMA ====================

function applyLanguage() {
  var L = getLang();
  function tc(el, en) {
    if (!el) return;
    if (el._i18nOrig === undefined) el._i18nOrig = el.textContent;
    el.textContent = (L === 'en') ? en : el._i18nOrig;
  }
  var q = function(s) { return document.querySelector(s); };
  var qa = function(s) { return document.querySelectorAll(s); };

  /* Hero */
  tc(q('.hero .eyebrow'),   'ARX Stream Cipher — AEAD');
  tc(q('.hero h1'),          'ChaCha20-Poly1305 Demo');
  tc(q('.hero .hero-copy'),  'Run ChaCha20-Poly1305 step by step: observe the 4×4 32-bit word state, quarter-rounds, column/diagonal rounds, keystream generation and Poly1305 MAC.');

  /* Tabs */
  tc(q('.cc20-tab-btn[data-tab="studio"]'),  'Practice');
  tc(q('.cc20-tab-btn[data-tab="compare"]'), 'Compare');
  tc(q('.cc20-tab-btn[data-tab="learn"]'),   'Learn');

  /* Inputs panel h2 */
  var sh2 = q('[data-cc20-panel="studio"] .card.controls h2, [data-cc20-panel="studio"] h2');
  tc(sh2, 'Inputs');

  /* Input labels */
  var labelMap = {
    'Clave (256 bits, 64 hex)':   'Key (256 bits, 64 hex)',
    'Nonce (96 bits, 24 hex)':    'Nonce (96 bits, 24 hex)',
    'Associated Data (hex)':      'Associated Data (hex)',
    'Datos Asociados (hex)':      'Associated Data (hex)',
    'Plaintext (hex)':            'Plaintext (hex)'
  };
  qa('label span').forEach(function(el) {
    var key = el._i18nOrig || el.textContent.trim();
    if (labelMap[key]) tc(el, labelMap[key]);
  });

  /* Buttons */
  tc(document.getElementById('cc20ExampleBtn'), 'Load example');
  tc(document.getElementById('cc20StartBtn'),   'Encrypt');
  tc(document.getElementById('cc20ResetBtn'),   'Reset');
  tc(document.getElementById('cc20CopyBtn'),    'Copy CT');
  tc(document.getElementById('cc20ExportBtn'),  'Export JSON');
  tc(document.getElementById('cc20CompareBtn'), 'Compare');

  /* Step counter (if visible) */
  var sc = document.getElementById('cc20StepCounter');
  if (sc && sc.textContent.match(/[0-9]/)) {
    var m = sc.textContent.match(/(\d+)\s*\/\s*(\d+)/);
    if (m) sc.textContent = (L==='en'?'Step':'Paso') + ' ' + m[1] + ' / ' + m[2];
  }

  /* Re-render guide and current step */
  renderGuide();
  if (executionSteps.length) renderCurrentStep();
}

document.addEventListener('DOMContentLoaded', function() {

  document.getElementById('cc20StartBtn')?.addEventListener('click', runCC20);

  document.getElementById('cc20ResetBtn')?.addEventListener('click', function() {
    cc20Engine.reset(); executionSteps = []; currentStep = 0;
    var r = document.getElementById('cc20Result');    if (r) r.hidden = true;
    var v = document.getElementById('cc20VizSection'); if (v) v.hidden = true;
    var ph = document.getElementById('cc20Placeholder'); if (ph) ph.hidden = false;
    showError('');
  });

  document.getElementById('cc20RandKeyBtn')?.addEventListener('click', function() {
    var el = document.getElementById('cc20KeyInput'); if (el) el.value = randHex(32);
  });
  document.getElementById('cc20RandNonceBtn')?.addEventListener('click', function() {
    var el = document.getElementById('cc20NonceInput'); if (el) el.value = randHex(12);
  });

  document.getElementById('cc20PrevBtn')?.addEventListener('click', function() {
    if (currentStep > 0) { currentStep--; renderCurrentStep(); }
  });
  document.getElementById('cc20NextBtn')?.addEventListener('click', function() {
    if (currentStep < executionSteps.length - 1) { currentStep++; renderCurrentStep(); }
  });

  document.getElementById('cc20CopyBtn')?.addEventListener('click', function() {
    var ct = document.getElementById('cc20Ciphertext')?.textContent;
    if (ct && ct !== '(vacio)') navigator.clipboard.writeText(ct).catch(function(){});
  });

  document.getElementById('cc20ExportBtn')?.addEventListener('click', exportJSON);
  document.getElementById('cc20CompareBtn')?.addEventListener('click', compareRuns);

  document.getElementById('cc20ExampleBtn')?.addEventListener('click', function() {
    // RFC 8439 Section 2.8.2 test vector
    var set = function(id,v){var el=document.getElementById(id);if(el)el.value=v;};
    set('cc20KeyInput',   '808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9f');
    set('cc20NonceInput', '070000004041424344454647');
    set('cc20AdInput',    '50515253c0c1c2c3c4c5c6c7');
    set('cc20PtInput',    '4c616469657320616e642047656e746c656d656e206f662074686520636c617373206f6620273939');
  });

  // Pre-llenar comparar
  var s2 = function(id,v){var el=document.getElementById(id);if(el)el.value=v;};
  s2('cc20CmpKey1',   '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f');
  s2('cc20CmpNonce1', '000000000000000000000000');
  s2('cc20CmpKey2',   '010102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f');
  s2('cc20CmpNonce2', '000000000000000000000000');
  s2('cc20CmpPt1',    '48656c6c6f2c20776f726c6421');
  s2('cc20CmpPt2',    '48656c6c6f2c20776f726c6421');

  renderGuide();

  // Bilingual: apply on load + listen for changes
  applyLanguage();
  window.addEventListener('langchange', function() { applyLanguage(); });
});
