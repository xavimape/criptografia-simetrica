/**
 * ASCON-128a Educational Visualizer
 * Implementación JavaScript con BigInt — equivalente a la versión Python/Tkinter
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
function asconTc(el, enText) {
  if (!el) return;
  if (el._i18nOrig === undefined) el._i18nOrig = el.textContent;
  el.textContent = (getLang() === 'en') ? enText : el._i18nOrig;
}


// ==================== CONSTANTES ====================

const ASCON_RC = [
  0xf0n, 0xe1n, 0xd2n, 0xc3n, 0xb4n, 0xa5n,
  0x96n, 0x87n, 0x78n, 0x69n, 0x5an, 0x4bn
];
const ASCON_IV = 0x80800c0800000000n; // ASCON-128a: k=128, rate=128, pa=12, pb=8
const MASK64   = (1n << 64n) - 1n;

// ==================== OPERACIONES BÁSICAS ====================

function ror64(value, shift) {
  const s = BigInt(shift);
  return ((value >> s) | (value << (64n - s))) & MASK64;
}

function toHex64(value) {
  return value.toString(16).toUpperCase().padStart(16, '0');
}

function hexToInt(hex) {
  if (!hex || hex.trim() === '') return 0n;
  return BigInt('0x' + hex.replace(/\s+/g, ''));
}

function compareBits64(oldVal, newVal) {
  const xor = oldVal ^ newVal;
  const changed = [];
  for (let i = 0; i < 64; i++) {
    if ((xor >> BigInt(i)) & 1n) changed.push(63 - i);
  }
  return changed;
}

function countChangedBits64(a, b) { return compareBits64(a, b).length; }

function asconPad(dataHex, blockSizeChars = 16) {
  if (!dataHex) return '80' + '0'.repeat(blockSizeChars - 2);
  const len = dataHex.length;
  if (len >= blockSizeChars) return dataHex.slice(0, blockSizeChars);
  const needed = blockSizeChars - len;
  return needed >= 2 ? dataHex + '80' + '0'.repeat(needed - 2)
                     : dataHex + '8' + '0'.repeat(needed - 1);
}

// ==================== S-BOX Y TRANSFORMACIONES ====================

function asconSbox(x0, x1, x2, x3, x4) {
  x0 ^= x4; x4 ^= x3; x2 ^= x1;
  const t0 = (~x0 & MASK64) & x1, t1 = (~x1 & MASK64) & x2,
        t2 = (~x2 & MASK64) & x3, t3 = (~x3 & MASK64) & x4,
        t4 = (~x4 & MASK64) & x0;
  x0 ^= t1; x1 ^= t2; x2 ^= t3; x3 ^= t4; x4 ^= t0;
  x1 ^= x0; x0 ^= x4; x3 ^= x2; x2 = (~x2) & MASK64;
  return [x0 & MASK64, x1 & MASK64, x2 & MASK64, x3 & MASK64, x4 & MASK64];
}

function linearLayer(x0, x1, x2, x3, x4) {
  return [
    (x0 ^ ror64(x0, 19) ^ ror64(x0, 28)) & MASK64,
    (x1 ^ ror64(x1, 61) ^ ror64(x1, 39)) & MASK64,
    (x2 ^ ror64(x2,  1) ^ ror64(x2,  6)) & MASK64,
    (x3 ^ ror64(x3, 10) ^ ror64(x3, 17)) & MASK64,
    (x4 ^ ror64(x4,  7) ^ ror64(x4, 41)) & MASK64
  ];
}

function asconRound(state, rc) {
  let [x0, x1, x2, x3, x4] = state;
  const afterRc  = [x0, x1, x2 ^ rc, x3, x4];
  x2 ^= rc;
  [x0, x1, x2, x3, x4] = asconSbox(x0, x1, x2, x3, x4);
  const afterSbox = [x0, x1, x2, x3, x4];
  [x0, x1, x2, x3, x4] = linearLayer(x0, x1, x2, x3, x4);
  return {
    input: [...state], rc,
    afterRc, afterSbox,
    afterLinear: [x0, x1, x2, x3, x4]
  };
}

function permutation(state, rounds, startRound = 0) {
  const allDetails = [];
  for (let r = 0; r < rounds; r++) {
    const rd = asconRound(state, ASCON_RC[startRound + r]);
    rd.roundNum = r; rd.rcIndex = startRound + r;
    state = rd.afterLinear;
    allDetails.push(rd);
  }
  return [state, allDetails];
}

// ==================== MOTOR ASCON (128 y 128a) ====================

class ASCON128a {
  constructor(variant) {
    this.state = [0n,0n,0n,0n,0n]; this.allSteps = [];
    this._applyVariant(variant || '128a');
  }

  _applyVariant(variant) {
    this.variant = variant;
    if (variant === '128') {
      this.iv = 0x80400c0600000000n; // k=128, rate=64, pa=12, pb=6
      this.rateChars = 16;           // 8 bytes per block
      this.pb = 6; this.pbRcStart = 6;
      this.fkr = 1;                  // finalization key XOR at x1,x2
    } else {                         // '128a'
      this.iv = ASCON_IV;            // 0x80800c0800000000n
      this.rateChars = 32;           // 16 bytes per block
      this.pb = 8; this.pbRcStart = 4;
      this.fkr = 2;                  // finalization key XOR at x2,x3
    }
  }

  setVariant(v) { this._applyVariant(v); }

  reset() { this.state = [0n,0n,0n,0n,0n]; this.allSteps = []; }

  initialize(keyHex, nonceHex) {
    const key   = hexToInt(keyHex),  nonce = hexToInt(nonceHex);
    const kh    = (key   >> 64n) & MASK64, kl = key   & MASK64;
    const nh    = (nonce >> 64n) & MASK64, nl = nonce & MASK64;
    this.state  = [this.iv, kh, kl, nh, nl];
    const initial = [...this.state];
    let roundDetails;
    [this.state, roundDetails] = permutation(this.state, 12, 0);
    const afterPerm = [...this.state];
    this.state[3] ^= kh; this.state[4] ^= kl;
    const d = { phase:'Inicializacion', stepType:'init', variant:this.variant,
      initialState: initial, rounds: roundDetails,
      stateAfterPerm: afterPerm, finalState: [...this.state],
      iv: this.iv, keyHigh: kh, keyLow: kl, nonceHigh: nh, nonceLow: nl };
    this.allSteps.push(d); return d;
  }

  processAD(adHex) {
    const rc = this.rateChars;
    const d = { phase:'Absorcion AD', stepType:'ad', blocks:[], variant:this.variant, pb:this.pb };
    if (!adHex || !adHex.trim()) {
      const before = [...this.state]; this.state[4] ^= 1n;
      d.noAd = true; d.stateBefore = before; d.finalState = [...this.state];
      this.allSteps.push(d); return d;
    }
    let padded = adHex.toUpperCase() + '80';
    const rem = padded.length % rc; if (rem) padded += '0'.repeat(rc - rem);
    const blocks = padded.match(new RegExp('.{' + rc + '}', 'g')) || [];
    for (let i = 0; i < blocks.length; i++) {
      const origHex = adHex.slice(i * rc, (i + 1) * rc);
      const bHi = BigInt('0x' + blocks[i].slice(0, 16));
      const bLo = rc === 32 ? BigInt('0x' + blocks[i].slice(16, 32)) : 0n;
      const sb = [...this.state];
      this.state[0] ^= bHi;
      if (rc === 32) this.state[1] ^= bLo;
      const afterXor = [...this.state];
      let rds; [this.state, rds] = permutation(this.state, this.pb, this.pbRcStart);
      d.blocks.push({ blockNum:i, blockHex:blocks[i], originalHex:origHex,
        stateBefore:sb, afterXor, rounds:rds, stateAfter:[...this.state],
        isLast: i === blocks.length - 1, paddingApplied: origHex.length < rc });
    }
    const lastBefore = d.blocks[d.blocks.length - 1].stateAfter;
    this.state[4] ^= 1n;
    d.finalState = [...this.state]; d.domSepBefore = lastBefore;
    this.allSteps.push(d); return d;
  }

  encrypt(ptHex) {
    const rc = this.rateChars, rateBytes = rc / 2;
    const d = { phase:'Cifrado', stepType:'encrypt', blocks:[], variant:this.variant, pb:this.pb };
    let ct = '';
    const ptClean = (ptHex || '').toUpperCase().replace(/\s+/g, '');
    const ptBytes = ptClean.length / 2;
    let paddedPT = ptClean + '80';
    const rem = paddedPT.length % rc; if (rem) paddedPT += '0'.repeat(rc - rem);
    const blocks = paddedPT.match(new RegExp('.{' + rc + '}', 'g')) || [];
    const lastPtBytes = ptBytes % rateBytes;
    for (let i = 0; i < blocks.length; i++) {
      const isLast = i === blocks.length - 1;
      const bHi = BigInt('0x' + blocks[i].slice(0, 16));
      const bLo = rc === 32 ? BigInt('0x' + blocks[i].slice(16, 32)) : 0n;
      const sb = [...this.state];
      const xorHi = this.state[0] ^ bHi;
      const xorLo = this.state[1] ^ bLo;
      let ctHex = '';
      if (!isLast) {
        ctHex = rc === 32 ? toHex64(xorHi) + toHex64(xorLo) : toHex64(xorHi);
        ct += ctHex;
        this.state[0] = xorHi;
        if (rc === 32) this.state[1] = xorLo;
      } else {
        const n = lastPtBytes;
        if (n > 0) {
          ctHex = (rc === 16 || n <= 8)
            ? toHex64(xorHi).slice(0, n * 2)
            : toHex64(xorHi) + toHex64(xorLo).slice(0, (n - 8) * 2);
          ct += ctHex;
        }
        this.state[0] ^= bHi;
        if (rc === 32) this.state[1] ^= bLo;
      }
      const afterXor = [...this.state];
      let rds = [];
      if (!isLast) [this.state, rds] = permutation(this.state, this.pb, this.pbRcStart);
      d.blocks.push({ blockNum:i, plaintextHex:ptClean.slice(i*rc,(i+1)*rc),
        plaintextPaddedHex:blocks[i], stateBefore:sb, afterXor, rounds:rds,
        stateAfter:[...this.state], ciphertextHex:ctHex, isLast });
    }
    d.ciphertext = ct; this.allSteps.push(d); return [ct, d];
  }

  finalize(keyHex) {
    const keyInt = hexToInt(keyHex);
    const kh = (keyInt >> 64n) & MASK64, kl = keyInt & MASK64;
    const sb = [...this.state], r = this.fkr;
    this.state[r] ^= kh; this.state[r + 1] ^= kl;
    const afterKeyXor = [...this.state];
    let rds; [this.state, rds] = permutation(this.state, 12, 0);
    const tagHigh = this.state[3] ^ kh, tagLow = this.state[4] ^ kl;
    const tag = toHex64(tagHigh) + toHex64(tagLow);
    const d = { phase:'Finalizacion', stepType:'finalize', variant:this.variant, fkr:r,
      stateBefore:sb, afterKeyXor, rounds:rds,
      stateAfterPerm:[...this.state], tag, tagHigh, tagLow };
    this.allSteps.push(d); return [tag, d];
  }

  run(keyHex, nonceHex, adHex, ptHex) {
    this.reset();
    this.initialize(keyHex, nonceHex);
    this.processAD(adHex);
    const [ciphertext] = this.encrypt(ptHex);
    const [tag] = this.finalize(keyHex);
    return { ciphertext, tag, steps: this.allSteps };
  }
}

// ==================== MOTOR BUNDLE (spec-fiel · KAT v1.2) ====================

/* Motor extraído del bundle de referencia. Verificado contra KAT oficiales ascon-c@v1.2.8. */
const eng = (function () {
  const RC = [0xf0n,0xe1n,0xd2n,0xc3n,0xb4n,0xa5n,0x96n,0x87n,0x78n,0x69n,0x5an,0x4bn];
  const MASK = (1n << 64n) - 1n;
  const FF = 0xFFFFFFFFFFFFFFFFn;
  const rotr = (x, n) => ((x >> BigInt(n)) | (x << BigInt(64 - n))) & MASK;
  const toHex64b = v => v.toString(16).toUpperCase().padStart(16, '0');
  const diffBitsB = (a, b) => { const x = a ^ b; let n = 0; for (let i = 0; i < 64; i++) if ((x >> BigInt(i)) & 1n) n++; return n; };
  const hexBytes = h => { const a = []; h = (h || '').replace(/\s+/g, ''); for (let i = 0; i + 1 < h.length; i += 2) a.push(parseInt(h.substr(i, 2), 16)); return a; };
  const wf = (a, o) => { let v = 0n; for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(a[o + i] || 0); return v & MASK; };
  const bo = v => { const a = []; for (let i = 7; i >= 0; i--) a.push(Number((v >> BigInt(i * 8)) & 0xffn)); return a; };
  const bh = a => a.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join('');
  function roundStep(S, r) {
    S[2] ^= RC[r];
    S[0] ^= S[4]; S[4] ^= S[3]; S[2] ^= S[1];
    const T = []; for (let i = 0; i < 5; i++) T.push(((S[i] ^ FF) & S[(i + 1) % 5]) & MASK);
    for (let i = 0; i < 5; i++) S[i] = (S[i] ^ T[(i + 1) % 5]) & MASK;
    S[1] ^= S[0]; S[0] ^= S[4]; S[3] ^= S[2]; S[2] ^= FF;
    S[0] = (S[0] ^ rotr(S[0], 19) ^ rotr(S[0], 28)) & MASK;
    S[1] = (S[1] ^ rotr(S[1], 61) ^ rotr(S[1], 39)) & MASK;
    S[2] = (S[2] ^ rotr(S[2],  1) ^ rotr(S[2],  6)) & MASK;
    S[3] = (S[3] ^ rotr(S[3], 10) ^ rotr(S[3], 17)) & MASK;
    S[4] = (S[4] ^ rotr(S[4],  7) ^ rotr(S[4], 41)) & MASK;
  }
  function permSteps(S, rounds, steps, color, esPh, enPh) {
    const start = 12 - rounds;
    for (let r = start; r < 12; r++) {
      const before = [...S]; roundStep(S, r); const k = r - start + 1;
      steps.push({ phase: { es: esPh + ' · Ronda ' + k + '/' + rounds, en: enPh + ' · Round ' + k + '/' + rounds },
        phaseColor: color, operation: 'RC ⊕ x2 → S-box → difusión',
        description: { es: '<strong>Constante de ronda RC = 0x' + RC[r].toString(16).toUpperCase() + '</strong> (XOR en x2).<br><strong>S-box</strong> de 5 bits en las 64 columnas (no-linealidad) y <strong>capa lineal</strong> con rotaciones a derecha (difusión intra-registro).',
          en: '<strong>Round constant RC = 0x' + RC[r].toString(16).toUpperCase() + '</strong> (XOR on x2).<br>5-bit <strong>S-box</strong> across 64 columns (nonlinearity) and <strong>linear layer</strong> with right rotations (intra-register diffusion).' },
        before, after: [...S] });
    }
  }
  function run(variant, keyH, nonceH, adH, ptH) {
    const a128 = variant === '128a';
    const rate = a128 ? 16 : 8, b = a128 ? 8 : 6, IV = a128 ? 0x80800c0800000000n : 0x80400c0600000000n;
    const rW = a128 ? 'x0‖x1' : 'x0';
    const Ci = 'var(--accent)', Ca = '#34d399', Ce = 'var(--accent-2)', Cf = 'var(--accent-ascon)';
    const steps = [];
    const key = hexBytes(keyH), nonce = hexBytes(nonceH);
    const K0 = wf(key, 0), K1 = wf(key, 8);
    let S = [IV, K0, K1, wf(nonce, 0), wf(nonce, 8)];
    steps.push({ phase: { es: 'Inicialización', en: 'Initialization' }, phaseColor: Ci, operation: 'IV ‖ Key ‖ Nonce',
      description: { es: 'El estado de 320 bits se arma con <strong>x0 = IV</strong> (0x' + IV.toString(16).toUpperCase() + ', identifica ASCON-' + variant + ': rate ' + (rate * 8) + ' bits, pa=12, pb=' + b + '), <strong>x1‖x2 = Key</strong> y <strong>x3‖x4 = Nonce</strong>.',
        en: 'The 320-bit state is built as <strong>x0 = IV</strong> (0x' + IV.toString(16).toUpperCase() + ', identifies ASCON-' + variant + ': rate ' + (rate * 8) + ' bits, pa=12, pb=' + b + '), <strong>x1‖x2 = Key</strong> and <strong>x3‖x4 = Nonce</strong>.' },
      before: [0n,0n,0n,0n,0n], after: [...S] });
    permSteps(S, 12, steps, Ci, 'Inicialización · pa', 'Initialization · pa');
    let bk = [...S]; S[3] ^= K0; S[4] ^= K1;
    steps.push({ phase: { es: 'Inicialización', en: 'Initialization' }, phaseColor: Ci, operation: 'x3 ⊕ K_high ; x4 ⊕ K_low',
      description: { es: 'La clave se XOR en <strong>x3</strong> y <strong>x4</strong> (capacidad), fijando el estado inicial a Key y Nonce.', en: 'The key is XOR-ed into <strong>x3</strong> and <strong>x4</strong> (capacity), binding the initial state to Key and Nonce.' },
      before: bk, after: [...S] });
    const ad = hexBytes(adH);
    if (ad.length > 0) {
      const padA = ad.concat([0x80]); while (padA.length % rate) padA.push(0);
      const nb = padA.length / rate;
      for (let i = 0; i < nb; i++) {
        const o = i * rate; const b0 = [...S];
        S[0] ^= wf(padA, o); if (a128) S[1] ^= wf(padA, o + 8);
        steps.push({ phase: { es: 'AD · Bloque ' + (i + 1), en: 'AD · Block ' + (i + 1) }, phaseColor: Ca, operation: rW + ' ⊕= AD',
          description: { es: 'El bloque AD se XOR sobre el <strong>rate</strong> (' + rW + ', ' + (rate * 8) + ' bits); luego pb (' + b + ' rondas). El AD queda autenticado por el tag.',
            en: 'AD block XOR-ed onto the <strong>rate</strong> (' + rW + ', ' + (rate * 8) + ' bits); then pb (' + b + ' rounds). The AD is authenticated by the tag.' },
          before: b0, after: [...S] });
        permSteps(S, b, steps, Ca, 'AD · pb', 'AD · pb');
      }
    }
    let bd = [...S]; S[4] ^= 1n;
    steps.push({ phase: { es: 'Separación de dominio', en: 'Domain separation' }, phaseColor: Ca, operation: 'x4 ⊕= 1',
      description: { es: 'El bit 0 de x4 se invierte: distingue el procesamiento de AD del de cifrado.', en: 'Bit 0 of x4 is flipped: separates AD processing from encryption.' },
      before: bd, after: [...S] });
    const pt = hexBytes(ptH); const plast = pt.length % rate;
    const padP = pt.concat([0x80]); while (padP.length % rate) padP.push(0);
    const nb2 = padP.length / rate; let ct = [];
    for (let i = 0; i < nb2; i++) {
      const o = i * rate, isLast = i === nb2 - 1; const b0 = [...S];
      S[0] ^= wf(padP, o); let cb = bo(S[0]); if (a128) { S[1] ^= wf(padP, o + 8); cb = cb.concat(bo(S[1])); }
      const out = isLast ? cb.slice(0, plast) : cb; ct = ct.concat(out);
      steps.push({ phase: { es: 'Cifrado · Bloque ' + (i + 1), en: 'Encrypt · Block ' + (i + 1) }, phaseColor: Ce, operation: 'CT = ' + rW + ' ⊕ PT',
        description: { es: 'CT = rate ⊕ PT; estado actualizado con CT. CT de este bloque: <code>' + (bh(out) || '∅') + '</code>.', en: 'CT = rate ⊕ PT; state updated with CT. This block CT: <code>' + (bh(out) || '∅') + '</code>.' },
        before: b0, after: [...S], extra: { label: { es: 'CT bloque', en: 'block CT' }, value: bh(out) || '∅', color: 'var(--accent-2)' } });
      if (!isLast) permSteps(S, b, steps, Ce, 'Cifrado · pb', 'Encrypt · pb');
    }
    const r8 = rate / 8; let bf = [...S]; S[r8] ^= K0; S[r8 + 1] ^= K1;
    steps.push({ phase: { es: 'Finalización', en: 'Finalization' }, phaseColor: Cf, operation: 'x' + r8 + ' ⊕ K_high ; x' + (r8 + 1) + ' ⊕ K_low',
      description: { es: 'La clave se XOR en x' + r8 + ', x' + (r8 + 1) + ' antes de la última pa de 12 rondas.', en: 'Key XOR-ed into x' + r8 + ', x' + (r8 + 1) + ' before the final 12-round pa.' },
      before: bf, after: [...S] });
    permSteps(S, 12, steps, Cf, 'Finalización · pa', 'Finalization · pa');
    const tag = toHex64b(S[3] ^ K0) + toHex64b(S[4] ^ K1);
    steps.push({ phase: { es: 'Finalización', en: 'Finalization' }, phaseColor: Cf, operation: 'Tag = (x3 ⊕ K) ‖ (x4 ⊕ K)',
      description: { es: '<strong>Tag (128 bits):</strong> <code>' + tag + '</code><br>Tag = (x3 ⊕ Key_high) ‖ (x4 ⊕ Key_low). Autentica AD y ciphertext; cualquier alteración lo cambia por completo.',
        en: '<strong>Tag (128 bits):</strong> <code>' + tag + '</code><br>Tag = (x3 ⊕ Key_high) ‖ (x4 ⊕ Key_low). Authenticates AD and ciphertext; any change alters it completely.' },
      before: [...S], after: [...S], extra: { label: { es: 'Tag', en: 'Tag' }, value: tag, color: 'var(--accent-ascon)' } });
    return { ct: bh(ct), tag, steps };
  }
  function bitsHex(a, b) {
    const n = Math.min(a.length, b.length); const ch = [];
    for (let i = 0; i < n; i++) { const x = parseInt(a[i], 16) ^ parseInt(b[i], 16); for (let k = 0; k < 4; k++) if ((x >> (3 - k)) & 1) ch.push(i * 4 + k); }
    return { changed: ch, total: n * 4, count: ch.length };
  }
  function flipHexBit(hex, bitIndex) {
    const bytes = (hex.match(/.{1,2}/g) || []).map(b => parseInt(b, 16));
    const byteI = Math.floor(bitIndex / 8), bit = 7 - (bitIndex % 8);
    if (byteI >= bytes.length || byteI < 0) return hex;
    bytes[byteI] ^= (1 << bit);
    return bytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join('');
  }
  return { run, toHex64: toHex64b, diffBits: diffBitsB, bitsHex, flipHexBit };
})();

window.asconEngine = {
  _variant: '128a',
  setVariant(v) { this._variant = v; },
  run(key, nonce, ad, pt) { return eng.run(this._variant, key, nonce, ad, pt); },
  toHex64:    eng.toHex64,
  diffBits:   eng.diffBits,
  flipHexBit: eng.flipHexBit,
  bitsHex:    eng.bitsHex
};

// ==================== PASOS DE EJECUCION PLANOS ====================

function buildExecutionSteps(allSteps) {
  const steps = [];
  const PC = {
    init:     'var(--accent)',
    ad:       '#34d399',
    encrypt:  'var(--accent-2)',
    finalize: 'var(--accent-ascon)'
  };

  for (const phase of allSteps) {
    const pc = PC[phase.stepType] || 'var(--accent)';

    if (phase.stepType === 'init') {
      steps.push({
        phase: 'Inicializacion', phaseColor: pc,
        title: 'Ensamblado del estado inicial',
        operation: 'IV || Key || Nonce',
        description: {es:'El estado de 320 bits se construye colocando: <strong>x0 = IV</strong> (parametros del algoritmo), <strong>x1||x2 = Key</strong> (128 bits), <strong>x3||x4 = Nonce</strong> (128 bits). Aun no se ha aplicado ninguna transformacion.',en:'The 320-bit state is assembled by placing: <strong>x0 = IV</strong> (algorithm parameters), <strong>x1||x2 = Key</strong> (128 bits), <strong>x3||x4 = Nonce</strong> (128 bits). No transformation has been applied yet.'},
        before: [0n, 0n, 0n, 0n, 0n],
        after: phase.initialState
      });
      let s = phase.initialState;
      for (const rd of phase.rounds) {
        steps.push({
          phase: 'Inicializacion - pa', phaseColor: pc,
          title: 'Permutacion pa - Ronda ' + (rd.roundNum + 1) + ' / 12',
          operation: 'RC XOR x2 -> S-box -> Difusion',
          description: {
            es: '<strong>Constante de ronda:</strong> RC = 0x' + rd.rc.toString(16).toUpperCase() + ' (XOR en x2).<br><strong>S-box:</strong> 64 columnas de 5 bits en paralelo — no-linealidad.<br><strong>Capa lineal:</strong> rotaciones por registro — difusion intra-registro.',
            en: '<strong>Round constant:</strong> RC = 0x' + rd.rc.toString(16).toUpperCase() + ' (XOR on x2).<br><strong>S-box:</strong> 64 five-bit columns in parallel — nonlinearity.<br><strong>Linear layer:</strong> rotations per register — intra-register diffusion.'
          },
          before: s,
          after: rd.afterLinear
        });
        s = rd.afterLinear;
      }
      steps.push({
        phase: 'Inicializacion', phaseColor: pc,
        title: 'Finalizar inicializacion — XOR clave',
        operation: 'x3 XOR K_high; x4 XOR K_low',
        description: {es:'La clave se XOR en <strong>x3</strong> y <strong>x4</strong> para mezclar el material de clave en la parte de capacidad del estado. Esto asegura que el estado inicial depende completamente de Key y Nonce.',en:'The key is XOR-ed into <strong>x3</strong> and <strong>x4</strong> to mix key material into the capacity portion of the state. This ensures the initial state depends entirely on Key and Nonce.'},
        before: phase.stateAfterPerm,
        after: phase.finalState
      });

    } else if (phase.stepType === 'ad') {
      if (phase.noAd) {
        steps.push({
          phase: 'Absorcion AD', phaseColor: pc,
          title: 'Datos Asociados — vacios',
          operation: 'x4 XOR= 1 (domain separation)',
          description: {es:'Sin AD: se aplica solo la <strong>separacion de dominio</strong>. El bit 0 de x4 se invierte para distinguir el procesamiento de AD del de cifrado, evitando ataques de extension.',en:'No AD: only <strong>domain separation</strong> is applied. Bit 0 of x4 is flipped to distinguish AD processing from encryption, preventing extension attacks.'},
          before: phase.stateBefore,
          after: phase.finalState
        });
      } else {
        for (const blk of phase.blocks) {
          steps.push({
            phase: 'AD Bloque ' + (blk.blockNum + 1), phaseColor: pc,
            title: 'Absorcion AD — Bloque ' + (blk.blockNum + 1) + ': XOR estado',
            operation: (phase.variant==='128' ? 'x0' : 'x0||x1') + ' XOR= 0x' + blk.blockHex,
            description: {
              es: 'El bloque AD (<code>' + blk.blockHex + '</code>' + (blk.paddingApplied ? ', padding aplicado' : '') + ') se XOR sobre <strong>' + (phase.variant==='128'?'x0':'x0 y x1') + '</strong> del estado (' + (phase.variant==='128'?'64':'128') + ' bits del rate en ASCON-' + (phase.variant==='128'?'128':'128a') + '). Esto absorbe el AD en el estado sin exponerlo directamente.',
              en: 'AD block (<code>' + blk.blockHex + '</code>' + (blk.paddingApplied ? ', padding applied' : '') + ') is XOR-ed onto <strong>' + (phase.variant==='128'?'x0':'x0 and x1') + '</strong> of the state (' + (phase.variant==='128'?'64':'128') + '-bit rate in ASCON-' + (phase.variant==='128'?'128':'128a') + '). This absorbs the AD into the state without directly exposing it.'
            },
            before: blk.stateBefore,
            after: blk.afterXor
          });
          let s = blk.afterXor;
          for (const rd of blk.rounds) {
            steps.push({
              phase: 'AD Bloque ' + (blk.blockNum + 1) + ' — pb', phaseColor: pc,
              title: 'Permutacion pb — Ronda ' + (rd.roundNum + 1) + ' / ' + (phase.pb||8),
              operation: 'RC XOR x2 -> S-box -> Difusion',
              description: {
                es: 'pb usa ' + (phase.pb||8) + ' rondas en ASCON-' + (phase.variant==='128'?'128':'128a') + '. <strong>RC = 0x' + rd.rc.toString(16).toUpperCase() + '</strong>. La permutacion mezcla el AD absorbido con todo el estado, haciendo que cualquier cambio en el AD afecte al tag final.',
                en: 'pᵦ uses ' + (phase.pb||8) + ' rounds in ASCON-' + (phase.variant==='128'?'128':'128a') + '. <strong>RC = 0x' + rd.rc.toString(16).toUpperCase() + '</strong>. The permutation mixes the absorbed AD with the entire state, ensuring any change in AD affects the final tag.'
              },
              before: s,
              after: rd.afterLinear
            });
            s = rd.afterLinear;
          }
        }
        steps.push({
          phase: 'Absorcion AD', phaseColor: pc,
          title: 'Separacion de dominio',
          operation: 'x4 XOR= 1',
          description: {es:'Despues de todo el AD, el bit 0 de x4 se invierte. Esto es la <strong>separacion de dominio</strong>: garantiza que aunque el AD y el plaintext sean iguales, produzcan estados internos distintos.',en:'After all AD, bit 0 of x4 is flipped. This is <strong>domain separation</strong>: it guarantees that even if AD and plaintext are identical, they produce distinct internal states.'},
          before: phase.domSepBefore,
          after: phase.finalState
        });
      }

    } else if (phase.stepType === 'encrypt') {
      for (const blk of phase.blocks) {
        const isPadOnly = blk.isLast && !blk.plaintextHex;
        steps.push({
          phase: 'Cifrado Bloque ' + (blk.blockNum + 1), phaseColor: pc,
          title: isPadOnly
            ? 'Cifrado — Padding del mensaje (bloque final)'
            : 'Cifrado — Bloque ' + (blk.blockNum + 1) + ': extraccion CT',
          operation: isPadOnly
            ? 'x0 XOR= PAD (separacion de mensaje)'
            : (phase.variant === '128' ? 'CT = x0 XOR PT' : 'CT = x0||x1 XOR PT'),
          description: isPadOnly ? {
            es: 'El mensaje llena un numero exacto de bloques (o esta vacio). Se XOR el byte de padding sobre x0, marcando el final del plaintext sin agregar CT. Este paso es necesario para separar mensajes de distinta longitud.',
            en: 'The message fills an exact number of blocks (or is empty). Padding byte is XOR-ed onto x0, marking the end of the plaintext without adding CT. This step distinguishes messages of different lengths.'
          } : {
            es: '<strong>Plaintext:</strong> <code>' + blk.plaintextHex + '</code><br><strong>Ciphertext:</strong> <code style="color:var(--accent-2)">' + blk.ciphertextHex + '</code><br>CT se obtiene por XOR del rate (' + (phase.variant==='128'?'x0 = 64 bits':'x0||x1 = 128 bits') + ') con el plaintext. El estado se actualiza con el CT para autenticacion.',
            en: '<strong>Plaintext:</strong> <code>' + blk.plaintextHex + '</code><br><strong>Ciphertext:</strong> <code style="color:var(--accent-2)">' + blk.ciphertextHex + '</code><br>CT is computed by XOR-ing the rate (' + (phase.variant==='128'?'x0 = 64 bits':'x0||x1 = 128 bits') + ') with the plaintext. State is updated with CT for authentication.'
          },
          before: blk.stateBefore,
          after: blk.afterXor,
          extra: blk.ciphertextHex ? { label: {es:'CT generado',en:'CT generated'}, value: blk.ciphertextHex, color: 'var(--accent-2)' } : undefined
        });
        let s = blk.afterXor;
        for (const rd of blk.rounds) {
          steps.push({
            phase: 'Cifrado — pb Bloque ' + (blk.blockNum + 1), phaseColor: pc,
            title: 'Permutacion pb — Ronda ' + (rd.roundNum + 1) + ' / ' + (phase.pb||8) + ' (Cifrado)',
            operation: 'RC XOR x2 -> S-box -> Difusion',
            description: {
              es: 'pb con ' + (phase.pb||8) + ' rondas (ASCON-' + (phase.variant==='128'?'128':'128a') + ') sobre el estado actualizado con el CT. <strong>RC = 0x' + rd.rc.toString(16).toUpperCase() + '</strong>. Efecto avalancha garantizado entre bloques.',
              en: 'pᵦ with ' + (phase.pb||8) + ' rounds (ASCON-' + (phase.variant==='128'?'128':'128a') + ') on the state updated with CT. <strong>RC = 0x' + rd.rc.toString(16).toUpperCase() + '</strong>. Guaranteed avalanche effect between blocks.'
            },
            before: s,
            after: rd.afterLinear
          });
          s = rd.afterLinear;
        }
      }

    } else if (phase.stepType === 'finalize') {
      steps.push({
        phase: 'Finalizacion', phaseColor: pc,
        title: 'Finalizacion — XOR clave',
        operation: 'x' + (phase.fkr||2) + ' XOR K_high; x' + ((phase.fkr||2)+1) + ' XOR K_low',
        description: {
          es:'La clave se XOR en <strong>x' + (phase.fkr||2) + '</strong> y <strong>x' + ((phase.fkr||2)+1) + '</strong> (primer registro de capacidad para el rate de ASCON-' + (phase.variant==='128'?'128':'128a') + ') para marcar el estado con el secreto antes de generar el tag.',
          en:'The key is XOR-ed into <strong>x' + (phase.fkr||2) + '</strong> and <strong>x' + ((phase.fkr||2)+1) + '</strong> (first capacity register for ASCON-' + (phase.variant==='128'?'128':'128a') + ' rate) to stamp the state with the secret before generating the tag.'
        },
        before: phase.stateBefore,
        after: phase.afterKeyXor
      });
      let s = phase.afterKeyXor;
      for (const rd of phase.rounds) {
        steps.push({
          phase: 'Finalizacion — pa', phaseColor: pc,
          title: 'Permutacion pa — Ronda ' + (rd.roundNum + 1) + ' / 12 (Finalizacion)',
          operation: 'RC XOR x2 -> S-box -> Difusion',
          description: {
            es: 'Ultima permutacion pa. <strong>RC = 0x' + rd.rc.toString(16).toUpperCase() + '</strong>. Esta permutacion final mezcla todas las contribuciones (IV, Key, Nonce, AD, CT) para producir un estado del que se extrae el tag.',
            en: 'Final pₐ permutation. <strong>RC = 0x' + rd.rc.toString(16).toUpperCase() + '</strong>. This final permutation mixes all contributions (IV, Key, Nonce, AD, CT) to produce the state from which the tag is extracted.'
          },
          before: s,
          after: rd.afterLinear
        });
        s = rd.afterLinear;
      }
      steps.push({
        phase: 'Finalizacion', phaseColor: pc,
        title: 'Generacion del Tag de autenticacion',
        operation: 'Tag = (x3 XOR K) || (x4 XOR K)',
        description: {
          es: '<strong>Tag (128 bits):</strong> <code style="color:var(--accent-ascon)">' + phase.tag + '</code><br>Tag_high = x3 XOR Key_high<br>Tag_low  = x4 XOR Key_low<br>El tag autentica simultaneamente el AD y el ciphertext. Cualquier alteracion en ellos produce un tag diferente.',
          en: '<strong>Tag (128 bits):</strong> <code style="color:var(--accent-ascon)">' + phase.tag + '</code><br>Tag_high = x3 XOR Key_high<br>Tag_low  = x4 XOR Key_low<br>The tag simultaneously authenticates the AD and the ciphertext. Any modification produces a completely different tag.'
        },
        before: phase.stateAfterPerm,
        after: phase.stateAfterPerm,
        extra: { label: {es:'Tag',en:'Tag'}, value: phase.tag, color: 'var(--accent-ascon)' }
      });
    }
  }
  return steps;
}

// ==================== RENDERIZADO ====================

function renderStatePanel(state, prevState, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = state.map((v, i) => {
    const hex     = toHex64(v);
    const changed = prevState ? countChangedBits64(prevState[i], v) : 0;
    const highlight = changed > 0;
    return '<div class="ascon-reg' + (highlight ? ' ascon-reg--changed' : '') + '">' +
      '<span class="ascon-reg-name">x' + i + '</span>' +
      '<span class="ascon-reg-val">' + hex + '</span>' +
      (highlight ? '<span class="ascon-reg-diff">' + changed + ' bits</span>' : '') +
      '</div>';
  }).join('');
}

function renderCurrentStep() {
  if (!executionSteps.length) return;
  const step  = executionSteps[currentStep];
  const total = executionSteps.length;

  const counter = document.getElementById('asconStepCounter');
  if (counter) counter.textContent = (getLang()==='en'?'Step':'Paso') + ' ' + (currentStep + 1) + ' / ' + total;

  const phaseEl = document.getElementById('asconPhaseInfo');
  if (phaseEl) {
    phaseEl.textContent = pickLang(step.phase);
    phaseEl.style.color = step.phaseColor || 'var(--accent)';
  }

  const opEl = document.getElementById('asconPhaseTag');
  if (opEl) opEl.textContent = step.operation;

  renderStatePanel(step.before, null,       'asconBeforeState');
  renderStatePanel(step.after,  step.before, 'asconAfterState');

  const explEl = document.getElementById('asconExplanation');
  if (explEl) explEl.innerHTML = pickLang(step.description);

  const extraEl = document.getElementById('asconExtra');
  if (extraEl) {
    if (step.extra) {
      extraEl.hidden = false;
      extraEl.innerHTML =
        '<span class="result-label">' + pickLang(step.extra.label) + '</span>' +
        '<span class="result-val" style="color:' + (step.extra.color || 'var(--accent-2)') + '">' +
        step.extra.value + '</span>';
    } else {
      extraEl.hidden = true;
    }
  }

  const changesEl = document.getElementById('asconChanges');
  if (changesEl) {
    const diffs = step.before.map((v, i) => {
      const n = countChangedBits64(v, step.after[i]);
      return n > 0
        ? '<div class="change-item"><span class="change-reg">x' + i + '</span>' +
          '<span class="change-bits">' + n + ' bits cambiados</span></div>'
        : '';
    }).filter(Boolean).join('');
    changesEl.innerHTML = diffs ||
      '<span style="color:var(--muted);font-size:.8rem">Sin cambios en este paso</span>';
  }

  updateNavButtons();
}

function updateNavButtons() {
  const prev = document.getElementById('asconPrevBtn');
  const next = document.getElementById('asconNextBtn');
  if (prev) prev.disabled = currentStep === 0;
  if (next) next.disabled = currentStep >= executionSteps.length - 1;
}

// ==================== ESTADO DE LA APP ====================

let asconEngine    = new ASCON128a();
let executionSteps = [];
let currentStep    = 0;

function getInputs() {
  const variant = document.querySelector('input[name="asconVariant"]:checked')?.value || '128a';
  return {
    key:     document.getElementById('asconKeyInput')?.value.trim().replace(/\s+/g,'') || '',
    nonce:   document.getElementById('asconNonceInput')?.value.trim().replace(/\s+/g,'') || '',
    ad:      document.getElementById('asconAdInput')?.value.trim().replace(/\s+/g,'') || '',
    pt:      document.getElementById('asconPtInput')?.value.trim().replace(/\s+/g,'') || '',
    variant
  };
}

function showError(msg) {
  const el = document.getElementById('asconError');
  if (!el) return;
  el.textContent = msg;
  el.hidden = !msg;
}

function randHex(bytes) {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)))
    .map(b => b.toString(16).padStart(2,'0')).join('').toUpperCase();
}

function runASCON() {
  showError('');
  const { key, nonce, ad, pt, variant } = getInputs();
  if (!key   || key.length   !== 32) { showError('Key: 32 caracteres hex (128 bits)');   return; }
  if (!nonce || nonce.length !== 32) { showError('Nonce: 32 caracteres hex (128 bits)'); return; }
  if (!/^[0-9A-Fa-f]*$/.test(key+nonce+ad+pt)) { showError('Solo caracteres hex (0-9, A-F)'); return; }

  try {
    window.asconEngine.setVariant(variant);
    const result = window.asconEngine.run(key, nonce, ad, pt);
    executionSteps = result.steps;
    currentStep    = 0;

    const ctEl = document.getElementById('asconCiphertext');
    if (ctEl) ctEl.textContent = result.ct || '(vacio)';
    const tagEl = document.getElementById('asconTag');
    if (tagEl) tagEl.textContent = result.tag;
    const resultEl = document.getElementById('asconResult');
    if (resultEl) resultEl.hidden = false;

    renderCurrentStep();
    updateNavButtons();

    const vizEl = document.getElementById('asconVizSection');
    if (vizEl) vizEl.hidden = false;

  } catch (e) {
    showError('Error: ' + e.message);
    console.error(e);
  }
}

function compareRuns() {
  showError('');
  const k1  = document.getElementById('asconCmpKey1')?.value.trim().replace(/\s+/g,'') || '';
  const n1  = document.getElementById('asconCmpNonce1')?.value.trim().replace(/\s+/g,'') || '';
  const pt1 = document.getElementById('asconCmpPt1')?.value.trim().replace(/\s+/g,'') || '';
  const k2  = document.getElementById('asconCmpKey2')?.value.trim().replace(/\s+/g,'') || '';
  const n2  = document.getElementById('asconCmpNonce2')?.value.trim().replace(/\s+/g,'') || '';
  const pt2 = document.getElementById('asconCmpPt2')?.value.trim().replace(/\s+/g,'') || '';
  const out = document.getElementById('asconCmpOutput');
  if (!out) return;

  if (k1.length !== 32 || n1.length !== 32 || k2.length !== 32 || n2.length !== 32) {
    out.textContent = 'Key y Nonce deben tener 32 chars hex en ambas ejecuciones.'; return;
  }
  const variant = document.querySelector('input[name="asconVariant"]:checked')?.value || '128a';
  try {
    const r1 = eng.run(variant, k1, n1, '', p1);
    const r2 = eng.run(variant, k2, n2, '', p2);
    const ct1 = r1.ct, tag1 = r1.tag, ct2 = r2.ct, tag2 = r2.tag;

    const tagDiff = [...tag1].filter((c,i) => c !== tag2[i]).length;
    const ctDiff  = (ct1 && ct2 && ct1.length === ct2.length)
      ? [...ct1].filter((c,i) => c !== ct2[i]).length : 'n/a';
    const pct = Math.round(tagDiff / 32 * 100);

    out.innerHTML =
'<pre>Ejecucion 1\n' +
'  Key        : ' + k1 + '\n' +
'  Nonce      : ' + n1 + '\n' +
'  Ciphertext : ' + (ct1 || '(vacio)') + '\n' +
'  Tag        : ' + tag1 + '\n\n' +
'Ejecucion 2\n' +
'  Key        : ' + k2 + '\n' +
'  Nonce      : ' + n2 + '\n' +
'  Ciphertext : ' + (ct2 || '(vacio)') + '\n' +
'  Tag        : ' + tag2 + '\n\n' +
'-----------------------------------------\n' +
'Diferencia CT  : ' + ctDiff + ' chars hex distintos\n' +
'Diferencia Tag : ' + tagDiff + ' / 32 chars hex distintos\n' +
'Efecto avalancha (tag): ~' + pct + '%</pre>';

    // Mostrar gráfico avalancha si hay CT de igual longitud
    const avWrap = document.getElementById('asconAvalancheWrap');
    const avPct  = document.getElementById('asconAvalanchePct');
    if (avWrap && ct1 && ct2 && ct1.length === ct2.length) {
      const bits = eng.bitsHex(ct1, ct2);
      avPct.textContent = Math.round(bits.count / bits.total * 100) + '%';
      avWrap.hidden = false;
      const canvas = document.getElementById('asconAvalancheCanvas');
      if (canvas) {
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);
        bits.changed.forEach(i => {
          const x = Math.floor(i / bits.total * W);
          ctx.fillStyle = 'var(--accent-ascon)';
          ctx.fillRect(x, 0, Math.max(1, W / bits.total), H);
        });
      }
    } else if (avWrap) { avWrap.hidden = true; }
  } catch (e) { out.textContent = 'Error: ' + e.message; }
}

function exportJSON() {
  if (!executionSteps.length) return;
  const { key, nonce, ad, pt } = getInputs();
  const data = {
    algorithm: 'ASCON-128a', timestamp: new Date().toISOString(),
    inputs: { key, nonce, associatedData: ad, plaintext: pt },
    ciphertext: document.getElementById('asconCiphertext')?.textContent || '',
    tag:        document.getElementById('asconTag')?.textContent || '',
    totalSteps: executionSteps.length,
    steps: executionSteps.map((s, i) => ({
      index: i + 1, phase: s.phase, title: s.title, operation: s.operation,
      stateBefore: s.before.map(v => toHex64(v)),
      stateAfter:  s.after.map(v => toHex64(v)),
      bitsChanged: s.before.map((v, xi) => countChangedBits64(v, s.after[xi]))
    }))
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ascon128a_execution.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

// ==================== GUIA EDUCATIVA ====================

const ASCON_GUIDE = [
  {
    title: { es: 'Que es ASCON-128a?', en: 'What is ASCON-128a?' },
    content: {
      es: 'ASCON-128a es un algoritmo de <strong>cifrado autenticado con datos asociados (AEAD)</strong>. Gano la competencia CAESAR en 2019 y fue seleccionado en el proceso NIST Lightweight Cryptography. Es ideal para dispositivos IoT por su eficiencia.<br><br>Garantiza simultaneamente: <strong>confidencialidad</strong> (mensaje cifrado), <strong>integridad</strong> (nadie lo modifico) y <strong>autenticidad</strong> (viene del poseedor de la clave).',
      en: 'ASCON-128a is an <strong>Authenticated Encryption with Associated Data (AEAD)</strong> algorithm. It won the CAESAR competition in 2019 and was selected in the NIST Lightweight Cryptography standardization process. Ideal for IoT devices due to its efficiency.<br><br>Simultaneously guarantees: <strong>confidentiality</strong> (encrypted message), <strong>integrity</strong> (no tampering occurred) and <strong>authenticity</strong> (comes from the key holder).'
    }
  },
  {
    title: { es: 'Estado interno 5x64 bits', en: 'Internal State 5×64 bits' },
    content: {
      es: 'El estado de ASCON son 5 registros de 64 bits: <strong>x0, x1, x2, x3, x4</strong> = 320 bits totales.<br><br>Inicializacion: x0=IV, x1||x2=Key (128b), x3||x4=Nonce (128b).<br>La IV <code>0x80800c0800000000</code> codifica los parametros: k=128b, rate=128b, pa=12, pb=8.',
      en: 'The ASCON state consists of 5 64-bit registers: <strong>x0, x1, x2, x3, x4</strong> = 320 bits total.<br><br>Initialization: x0=IV, x1||x2=Key (128b), x3||x4=Nonce (128b).<br>The IV <code>0x80800c0800000000</code> encodes the parameters: k=128b, rate=128b, pa=12, pb=8.'
    }
  },
  {
    title: { es: 'S-box de 5 bits', en: '5-bit S-box' },
    content: {
      es: 'Opera sobre columnas verticales de 5 bits (1 bit de cada registro x0-x4) en las 64 posiciones en paralelo. Usa solo AND, NOT y XOR — sin tablas de lookup, resistente a timing attacks.<br><br>Introduce <strong>no-linealidad</strong> haciendo imposible describir la transformacion con ecuaciones lineales.',
      en: 'Operates on 5-bit vertical columns (1 bit from each register x0–x4) at all 64 positions in parallel. Uses only AND, NOT and XOR — no lookup tables, resistant to timing attacks.<br><br>Introduces <strong>nonlinearity</strong>, making it impossible to describe the transformation with linear equations.'
    }
  },
  {
    title: { es: 'Capa lineal', en: 'Linear Layer' },
    content: {
      es: 'Despues de la S-box, cada registro se combina con dos rotaciones a la derecha de si mismo:<br><br><code>x0 = x0 XOR ROR(x0,19) XOR ROR(x0,28)</code><br><code>x1 = x1 XOR ROR(x1,61) XOR ROR(x1,39)</code>, etc.<br><br>Dispersa los bits modificados por la S-box a traves de cada registro completo (<strong>difusion</strong>).',
      en: 'After the S-box, each register is combined with two right-rotations of itself:<br><br><code>x0 = x0 XOR ROR(x0,19) XOR ROR(x0,28)</code><br><code>x1 = x1 XOR ROR(x1,61) XOR ROR(x1,39)</code>, etc.<br><br>Disperses the bits modified by the S-box throughout each complete register (<strong>diffusion</strong>).'
    }
  },
  {
    title: { es: 'Permutaciones pa y pb', en: 'Permutations pₐ and pᵦ' },
    content: {
      es: 'Una <strong>ronda</strong> = RC XOR x2 -> S-box -> Capa lineal.<br><br><strong>pa</strong> = 12 rondas: inicializacion y finalizacion.<br><strong>pb</strong> = 8 rondas (ASCON-128a): absorcion de AD y cifrado entre bloques.<br><br>Las constantes RC hacen que cada ronda sea unica y evitan simetria.',
      en: 'One <strong>round</strong> = RC XOR x2 → S-box → Linear layer.<br><br><strong>pₐ</strong> = 12 rounds: initialization and finalization.<br><strong>pᵦ</strong> = 8 rounds (ASCON-128a): AD absorption and between-block encryption.<br><br>Round constants RC make each round unique and prevent symmetry.'
    }
  },
  {
    title: { es: 'Datos Asociados (AD)', en: 'Associated Data (AD)' },
    content: {
      es: 'Datos autenticados pero <strong>no cifrados</strong> (cabeceras, metadatos, IDs).<br><br>Se absorben en el estado ((x0||x1) XOR= bloque_AD -> pb), asegurando que el tag tambien los cubre. Al final del AD: domain separation (x4 XOR= 1) para distinguir AD de cifrado.',
      en: 'Authenticated but <strong>not encrypted</strong> data (headers, metadata, IDs).<br><br>Absorbed into the state ((x0||x1) XOR= AD_block → pᵦ), ensuring the tag also covers them. After all AD: domain separation (x4 XOR= 1) to distinguish AD processing from encryption.'
    }
  },
  {
    title: { es: 'Nonce: uso unico', en: 'Nonce: single use' },
    content: {
      es: 'El <strong>Nonce</strong> debe ser unico por cada mensaje cifrado con la misma clave.<br><br>Si se reutiliza un nonce: el atacante puede XOR los dos ciphertexts y recuperar el plaintext (igual que en un OTP reutilizado).<br><br>Usar un contador, timestamp o valor aleatorio de 128 bits.',
      en: 'The <strong>Nonce</strong> must be unique for each message encrypted with the same key.<br><br>If a nonce is reused: the attacker can XOR the two ciphertexts and recover the plaintext (same as a reused OTP).<br><br>Use a counter, timestamp, or 128-bit random value.'
    }
  },
  {
    title: { es: 'Tag de autenticacion', en: 'Authentication Tag' },
    content: {
      es: 'Tag = (x3 XOR Key_high) || (x4 XOR Key_low) = 128 bits.<br><br>Para verificar: recalcular con los mismos parametros y comparar tags en <strong>tiempo constante</strong> (sin early-exit para evitar timing attacks).<br><br>Cualquier alteracion en AD o CT produce un tag completamente diferente.',
      en: 'Tag = (x3 XOR Key_high) || (x4 XOR Key_low) = 128 bits.<br><br>To verify: recompute with the same parameters and compare tags in <strong>constant time</strong> (no early-exit to avoid timing attacks).<br><br>Any modification to AD or CT produces a completely different tag.'
    }
  }
];

function renderGuide() {
  const el = document.getElementById('asconGuideContent');
  if (!el) return;
  el.innerHTML = ASCON_GUIDE.map((s, i) =>
    '<div class="guide-card">' +
    '<h3>' + (i + 1) + '. ' + pickLang(s.title) + '</h3>' +
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
  tc(q('.hero .eyebrow'),   'Lightweight Authenticated Encryption');
  tc(q('.hero h1'),          'ASCON Demo Lab');
  tc(q('.hero .hero-copy'),  'Run ASCON-128a step by step: observe how the 320-bit internal state (x0–x4) evolves through initialization, AD absorption, encryption and finalization.');

  /* Tabs */
  tc(q('.ascon-tab-btn[data-tab="studio"]'),  'Practice');
  tc(q('.ascon-tab-btn[data-tab="compare"]'), 'Compare');
  tc(q('.ascon-tab-btn[data-tab="learn"]'),   'Learn');

  /* Inputs panel h2 */
  tc(q('[data-ascon-panel="studio"] h2'), 'Inputs');

  /* Labels */
  var labels = qa('[data-ascon-panel="studio"] label span:first-child, [data-ascon-panel="studio"] label > span');
  var labelMap = {
    'Clave (hex)':            'Key (hex)',
    'Nonce (hex)':            'Nonce (hex)',
    'Datos Asociados (hex)':  'Associated Data (hex)',
    'Plaintext (hex)':        'Plaintext (hex)'
  };
  labels.forEach(function(el) {
    var key = el._i18nOrig || el.textContent.trim();
    if (labelMap[key]) tc(el, labelMap[key]);
  });

  /* Buttons */
  tc(document.getElementById('asconExampleBtn'), 'Load example');
  tc(document.getElementById('asconStartBtn'),   'Encrypt');
  tc(document.getElementById('asconResetBtn'),   'Reset');
  tc(document.getElementById('asconCopyBtn'),    'Copy CT');
  tc(document.getElementById('asconExportBtn'),  'Export JSON');
  tc(document.getElementById('asconCompareBtn'), 'Compare');

  /* Compare panel labels */
  var cmpLabels = qa('[data-ascon-panel="compare"] label span:first-child');
  var cmpMap = {
    'Ejecucion 1 — Clave': 'Run 1 — Key',
    'Nonce':                'Nonce',
    'Ejecucion 2 — Clave': 'Run 2 — Key',
    'Plaintext':            'Plaintext',
    'Ejecución 1 — Clave': 'Run 1 — Key',
    'Ejecución 2 — Clave': 'Run 2 — Key'
  };
  cmpLabels.forEach(function(el) {
    var key = el._i18nOrig || el.textContent.trim();
    if (cmpMap[key]) tc(el, cmpMap[key]);
  });

  /* Step counter (if visible) */
  var sc = document.getElementById('asconStepCounter');
  if (sc && sc.textContent.match(/[0-9]/)) {
    var m = sc.textContent.match(/(\d+)\s*\/\s*(\d+)/);
    if (m) sc.textContent = (L==='en'?'Step':'Paso') + ' ' + m[1] + ' / ' + m[2];
  }

  /* Re-render guide and current step */
  renderGuide();
  if (executionSteps.length) renderCurrentStep();
}

document.addEventListener('DOMContentLoaded', function() {

  document.getElementById('asconStartBtn')?.addEventListener('click', runASCON);

  document.getElementById('asconResetBtn')?.addEventListener('click', function() {
    executionSteps = []; currentStep = 0;
    var r = document.getElementById('asconResult');    if (r) r.hidden = true;
    var v = document.getElementById('asconVizSection'); if (v) v.hidden = true;
    var ph = document.getElementById('asconPlaceholder'); if (ph) ph.hidden = false;
    var pw = document.getElementById('asconProgressWrap'); if (pw) pw.hidden = true;
    showError('');
  });

  document.getElementById('asconRandKeyBtn')?.addEventListener('click', function() {
    var el = document.getElementById('asconKeyInput'); if (el) el.value = randHex(16);
  });
  document.getElementById('asconRandNonceBtn')?.addEventListener('click', function() {
    var el = document.getElementById('asconNonceInput'); if (el) el.value = randHex(16);
  });

  document.getElementById('asconPrevBtn')?.addEventListener('click', function() {
    if (currentStep > 0) { currentStep--; renderCurrentStep(); }
  });
  document.getElementById('asconNextBtn')?.addEventListener('click', function() {
    if (currentStep < executionSteps.length - 1) { currentStep++; renderCurrentStep(); }
  });

  document.getElementById('asconCopyBtn')?.addEventListener('click', function() {
    var ct = document.getElementById('asconCiphertext')?.textContent;
    if (ct && ct !== '(vacio)') navigator.clipboard.writeText(ct).catch(function(){});
  });

  document.getElementById('asconExportBtn')?.addEventListener('click', exportJSON);
  document.getElementById('asconCompareBtn')?.addEventListener('click', compareRuns);

  document.getElementById('asconExampleBtn')?.addEventListener('click', function() {
    var set = function(id, v) { var el = document.getElementById(id); if (el) el.value = v; };
    set('asconKeyInput',   '000102030405060708090A0B0C0D0E0F');
    set('asconNonceInput', '000102030405060708090A0B0C0D0E0F');
    set('asconAdInput',    '606162636465666768696A6B6C6D6E6F');
    set('asconPtInput',    '4142434445464748');
  });

  // Pre-llenar comparar
  var s2 = function(id, v) { var el = document.getElementById(id); if (el) el.value = v; };
  s2('asconCmpKey1',   '000102030405060708090A0B0C0D0E0F');
  s2('asconCmpNonce1', '000102030405060708090A0B0C0D0E0F');
  s2('asconCmpKey2',   '000102030405060708090A0B0C0D0E0F');
  s2('asconCmpNonce2', '000102030405060708090A0B0C0D0E01');

  renderGuide();

  // Bilingual: apply on load + listen for changes
  applyLanguage();
  window.addEventListener('langchange', function() { applyLanguage(); });
});
