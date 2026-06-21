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
const ASCON_IV = 0x80400c0600000000n;
const MASK64   = (1n << 64n) - 1n;

// ==================== OPERACIONES BÁSICAS ====================

function rol64(value, shift) {
  const s = BigInt(shift);
  return ((value << s) | (value >> (64n - s))) & MASK64;
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
  const t0 = x0 & (~x1 & MASK64), t1 = x1 & (~x2 & MASK64),
        t2 = x2 & (~x3 & MASK64), t3 = x3 & (~x4 & MASK64),
        t4 = x4 & (~x0 & MASK64);
  x0 ^= t1; x1 ^= t2; x2 ^= t3; x3 ^= t4; x4 ^= t0;
  x1 ^= x0; x0 ^= x4; x3 ^= x2; x2 = (~x2) & MASK64;
  return [x0 & MASK64, x1 & MASK64, x2 & MASK64, x3 & MASK64, x4 & MASK64];
}

function linearLayer(x0, x1, x2, x3, x4) {
  return [
    (x0 ^ rol64(x0, 19) ^ rol64(x0, 28)) & MASK64,
    (x1 ^ rol64(x1, 61) ^ rol64(x1, 39)) & MASK64,
    (x2 ^ rol64(x2,  1) ^ rol64(x2,  6)) & MASK64,
    (x3 ^ rol64(x3, 10) ^ rol64(x3, 17)) & MASK64,
    (x4 ^ rol64(x4,  7) ^ rol64(x4, 41)) & MASK64
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

// ==================== MOTOR ASCON-128a ====================

class ASCON128a {
  constructor() { this.state = [0n,0n,0n,0n,0n]; this.allSteps = []; }

  reset() { this.state = [0n,0n,0n,0n,0n]; this.allSteps = []; }

  initialize(keyHex, nonceHex) {
    const key   = hexToInt(keyHex),  nonce = hexToInt(nonceHex);
    const kh    = (key   >> 64n) & MASK64, kl = key   & MASK64;
    const nh    = (nonce >> 64n) & MASK64, nl = nonce & MASK64;
    this.state  = [ASCON_IV, kh, kl, nh, nl];
    const initial = [...this.state];
    let roundDetails;
    [this.state, roundDetails] = permutation(this.state, 12, 0);
    const afterPerm = [...this.state];
    this.state[3] ^= kh; this.state[4] ^= kl;
    const d = { phase:'Inicializacion', stepType:'init',
      initialState: initial, rounds: roundDetails,
      stateAfterPerm: afterPerm, finalState: [...this.state],
      iv: ASCON_IV, keyHigh: kh, keyLow: kl, nonceHigh: nh, nonceLow: nl };
    this.allSteps.push(d); return d;
  }

  processAD(adHex) {
    const d = { phase:'Absorcion AD', stepType:'ad', blocks:[] };
    if (!adHex) {
      const before = [...this.state]; this.state[4] ^= 1n;
      d.noAd = true; d.stateBefore = before; d.finalState = [...this.state];
      this.allSteps.push(d); return d;
    }
    const blocks = adHex.match(/.{1,16}/g) || [];
    for (let i = 0; i < blocks.length; i++) {
      const isLast = i === blocks.length - 1;
      const padded = isLast ? asconPad(blocks[i], 16) : blocks[i].padEnd(16,'0');
      const bInt   = hexToInt(padded);
      const sb     = [...this.state];
      this.state[0] ^= bInt;
      const afterXor = [...this.state];
      let rds; [this.state, rds] = permutation(this.state, 6, 6);
      d.blocks.push({ blockNum:i, blockHex:padded, originalHex:blocks[i],
        stateBefore:sb, afterXor, rounds:rds, stateAfter:[...this.state],
        isLast, paddingApplied: isLast && blocks[i].length < 16 });
    }
    const lastBefore = d.blocks.length ? d.blocks[d.blocks.length-1].stateAfter : [...this.state];
    this.state[4] ^= 1n;
    d.finalState = [...this.state]; d.domSepBefore = lastBefore;
    this.allSteps.push(d); return d;
  }

  encrypt(ptHex) {
    const d = { phase:'Cifrado', stepType:'encrypt', blocks:[] };
    let ct = '';
    if (!ptHex) { d.noPlaintext = true; this.allSteps.push(d); return ['', d]; }
    const blocks = ptHex.match(/.{1,16}/g) || [];
    for (let i = 0; i < blocks.length; i++) {
      const isLast  = i === blocks.length - 1;
      const isShort = isLast && blocks[i].length < 16;
      const padded  = isShort ? asconPad(blocks[i], 16) : blocks[i].padEnd(16,'0');
      const ptFull  = hexToInt(padded);
      const ptReal  = isShort ? hexToInt(blocks[i].padEnd(16,'0')) : ptFull;
      const sb      = [...this.state];
      const ctBlock = this.state[0] ^ ptReal;
      const ctHex   = toHex64(ctBlock);
      ct += isShort ? ctHex.slice(0, blocks[i].length) : ctHex;
      this.state[0] = isShort ? (this.state[0] ^ ptFull) : ctBlock;
      const afterXor = [...this.state];
      let rds; [this.state, rds] = permutation(this.state, 12, 0);
      d.blocks.push({ blockNum:i, plaintextHex:blocks[i], plaintextPaddedHex:padded,
        stateBefore:sb, afterXor, rounds:rds, stateAfter:[...this.state],
        ciphertextHex: isShort ? ctHex.slice(0, blocks[i].length) : ctHex,
        isLast });
    }
    d.ciphertext = ct; this.allSteps.push(d); return [ct, d];
  }

  finalize(keyHex) {
    const keyInt = hexToInt(keyHex);
    const kh = (keyInt >> 64n) & MASK64, kl = keyInt & MASK64;
    const sb = [...this.state];
    this.state[1] ^= kh; this.state[2] ^= kl;
    const afterKeyXor = [...this.state];
    let rds; [this.state, rds] = permutation(this.state, 12, 0);
    const tagHigh = this.state[3] ^ kh, tagLow = this.state[4] ^ kl;
    const tag = toHex64(tagHigh) + toHex64(tagLow);
    const d = { phase:'Finalizacion', stepType:'finalize',
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
            operation: 'x0 XOR= 0x' + blk.blockHex,
            description: {
              es: 'El bloque AD (<code>' + blk.blockHex + '</code>' + (blk.paddingApplied ? ', padding aplicado' : '') + ') se XOR sobre <strong>x0</strong> del estado (los 64 bits del rate). Esto absorbe el AD en el estado sin exponerlo directamente.',
              en: 'AD block (<code>' + blk.blockHex + '</code>' + (blk.paddingApplied ? ', padding applied' : '') + ') is XOR-ed onto <strong>x0</strong> of the state (the 64-bit rate). This absorbs the AD into the state without directly exposing it.'
            },
            before: blk.stateBefore,
            after: blk.afterXor
          });
          let s = blk.afterXor;
          for (const rd of blk.rounds) {
            steps.push({
              phase: 'AD Bloque ' + (blk.blockNum + 1) + ' — pb', phaseColor: pc,
              title: 'Permutacion pb — Ronda ' + (rd.roundNum + 1) + ' / 6',
              operation: 'RC XOR x2 -> S-box -> Difusion',
              description: {
                es: 'pb usa 6 rondas (indices RC 6-11). <strong>RC = 0x' + rd.rc.toString(16).toUpperCase() + '</strong>. La permutacion mezcla el AD absorbido con todo el estado, haciendo que cualquier cambio en el AD afecte al tag final.',
                en: 'pᵦ uses 6 rounds (RC indices 6–11). <strong>RC = 0x' + rd.rc.toString(16).toUpperCase() + '</strong>. The permutation mixes the absorbed AD with the entire state, ensuring any change in AD affects the final tag.'
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
      if (!phase.noPlaintext) {
        for (const blk of phase.blocks) {
          steps.push({
            phase: 'Cifrado Bloque ' + (blk.blockNum + 1), phaseColor: pc,
            title: 'Cifrado — Bloque ' + (blk.blockNum + 1) + ': extraccion CT',
            operation: 'CT = x0 XOR PT',
            description: {
              es: '<strong>Plaintext:</strong> <code>' + blk.plaintextHex + '</code><br><strong>Ciphertext:</strong> <code style="color:var(--accent-2)">' + blk.ciphertextHex + '</code><br>El CT se obtiene haciendo XOR del rate (x0) con el plaintext. El estado se actualiza con el CT (x0 = CT), vinculando el ciphertext al estado interno para la autenticacion.',
              en: '<strong>Plaintext:</strong> <code>' + blk.plaintextHex + '</code><br><strong>Ciphertext:</strong> <code style="color:var(--accent-2)">' + blk.ciphertextHex + '</code><br>CT is computed by XOR-ing the rate (x0) with the plaintext. The state is updated with CT (x0 = CT), binding the ciphertext to the internal state for authentication.'
            },
            before: blk.stateBefore,
            after: blk.afterXor,
            extra: { label: {es:'CT generado',en:'CT generated'}, value: blk.ciphertextHex, color: 'var(--accent-2)' }
          });
          let s = blk.afterXor;
          for (const rd of blk.rounds) {
            steps.push({
              phase: 'Cifrado — pa Bloque ' + (blk.blockNum + 1), phaseColor: pc,
              title: 'Permutacion pa — Ronda ' + (rd.roundNum + 1) + ' / 12 (Cifrado)',
              operation: 'RC XOR x2 -> S-box -> Difusion',
              description: {
                es: 'pa con 12 rondas sobre el estado actualizado con el CT. <strong>RC = 0x' + rd.rc.toString(16).toUpperCase() + '</strong>. Esto asegura que cada bloque cifrado dependa completamente del estado acumulado — efecto avalancha garantizado.',
                en: 'pₐ with 12 rounds on the state updated with CT. <strong>RC = 0x' + rd.rc.toString(16).toUpperCase() + '</strong>. This ensures every encrypted block fully depends on the accumulated state — guaranteed avalanche effect.'
              },
              before: s,
              after: rd.afterLinear
            });
            s = rd.afterLinear;
          }
        }
      }

    } else if (phase.stepType === 'finalize') {
      steps.push({
        phase: 'Finalizacion', phaseColor: pc,
        title: 'Finalizacion — XOR clave',
        operation: 'x1 XOR K_high; x2 XOR K_low',
        description: {es:'La clave se XOR en <strong>x1</strong> y <strong>x2</strong> para marcar el estado con el secreto antes de generar el tag. Sin la clave, es imposible producir o verificar el tag correcto.',en:'The key is XOR-ed into <strong>x1</strong> and <strong>x2</strong> to stamp the state with the secret before generating the tag. Without the key, it is impossible to produce or verify the correct tag.'},
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
    phaseEl.textContent = step.phase;
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
  return {
    key:   document.getElementById('asconKeyInput')?.value.trim().replace(/\s+/g,'') || '',
    nonce: document.getElementById('asconNonceInput')?.value.trim().replace(/\s+/g,'') || '',
    ad:    document.getElementById('asconAdInput')?.value.trim().replace(/\s+/g,'') || '',
    pt:    document.getElementById('asconPtInput')?.value.trim().replace(/\s+/g,'') || ''
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
  const { key, nonce, ad, pt } = getInputs();
  if (!key   || key.length   !== 32) { showError('Key: 32 caracteres hex (128 bits)');   return; }
  if (!nonce || nonce.length !== 32) { showError('Nonce: 32 caracteres hex (128 bits)'); return; }
  if (!/^[0-9A-Fa-f]*$/.test(key+nonce+ad+pt)) { showError('Solo caracteres hex (0-9, A-F)'); return; }

  try {
    asconEngine.reset();
    asconEngine.initialize(key, nonce);
    asconEngine.processAD(ad);
    const [ciphertext] = asconEngine.encrypt(pt);
    const [tag]        = asconEngine.finalize(key);

    executionSteps = buildExecutionSteps(asconEngine.allSteps);
    currentStep    = 0;

    const ctEl = document.getElementById('asconCiphertext');
    if (ctEl) ctEl.textContent = ciphertext || '(vacio)';
    const tagEl = document.getElementById('asconTag');
    if (tagEl) tagEl.textContent = tag;
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
  try {
    const eng1 = new ASCON128a();
    eng1.initialize(k1,n1); eng1.processAD('');
    const [ct1]  = eng1.encrypt(pt1);
    const [tag1] = eng1.finalize(k1);

    const eng2 = new ASCON128a();
    eng2.initialize(k2,n2); eng2.processAD('');
    const [ct2]  = eng2.encrypt(pt2);
    const [tag2] = eng2.finalize(k2);

    const tagDiff = [...tag1].filter((c,i) => c !== tag2[i]).length;
    const ctDiff  = (ct1 && ct2 && ct1.length === ct2.length)
      ? [...ct1].filter((c,i) => c !== ct2[i]).length : 'n/a';
    const pct = Math.round(tagDiff / 32 * 100);

    out.textContent =
'Ejecucion 1\n' +
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
'Efecto avalancha (tag): ~' + pct + '% de diferencia';
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
      es: 'El estado de ASCON son 5 registros de 64 bits: <strong>x0, x1, x2, x3, x4</strong> = 320 bits totales.<br><br>Inicializacion: x0=IV, x1||x2=Key (128b), x3||x4=Nonce (128b).<br>La IV <code>0x80400c0600000000</code> codifica los parametros del algoritmo.',
      en: 'The ASCON state consists of 5 64-bit registers: <strong>x0, x1, x2, x3, x4</strong> = 320 bits total.<br><br>Initialization: x0=IV, x1||x2=Key (128b), x3||x4=Nonce (128b).<br>The IV <code>0x80400c0600000000</code> encodes the algorithm parameters.'
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
      es: 'Despues de la S-box, cada registro se combina con dos rotaciones de si mismo:<br><br><code>x0 = x0 XOR ROL(x0,19) XOR ROL(x0,28)</code><br><code>x1 = x1 XOR ROL(x1,61) XOR ROL(x1,39)</code>, etc.<br><br>Dispersa los bits modificados por la S-box a traves de cada registro completo (<strong>difusion</strong>).',
      en: 'After the S-box, each register is combined with two rotations of itself:<br><br><code>x0 = x0 XOR ROL(x0,19) XOR ROL(x0,28)</code><br><code>x1 = x1 XOR ROL(x1,61) XOR ROL(x1,39)</code>, etc.<br><br>Disperses the bits modified by the S-box throughout each complete register (<strong>diffusion</strong>).'
    }
  },
  {
    title: { es: 'Permutaciones pa y pb', en: 'Permutations pₐ and pᵦ' },
    content: {
      es: 'Una <strong>ronda</strong> = RC XOR x2 -> S-box -> Capa lineal.<br><br><strong>pa</strong> = 12 rondas: inicializacion, cifrado (ASCON-128a), finalizacion.<br><strong>pb</strong> = 6 rondas: absorcion de AD.<br><br>Las constantes RC hacen que cada ronda sea unica y evitan simetria.',
      en: 'One <strong>round</strong> = RC XOR x2 → S-box → Linear layer.<br><br><strong>pₐ</strong> = 12 rounds: initialization, encryption (ASCON-128a), finalization.<br><strong>pᵦ</strong> = 6 rounds: AD absorption.<br><br>Round constants RC make each round unique and prevent symmetry.'
    }
  },
  {
    title: { es: 'Datos Asociados (AD)', en: 'Associated Data (AD)' },
    content: {
      es: 'Datos autenticados pero <strong>no cifrados</strong> (cabeceras, metadatos, IDs).<br><br>Se absorben en el estado (x0 XOR= bloque_AD -> pb), asegurando que el tag tambien los cubre. Al final del AD: domain separation (x4 XOR= 1) para distinguir AD de cifrado.',
      en: 'Authenticated but <strong>not encrypted</strong> data (headers, metadata, IDs).<br><br>Absorbed into the state (x0 XOR= AD_block → pᵦ), ensuring the tag also covers them. After all AD: domain separation (x4 XOR= 1) to distinguish AD processing from encryption.'
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
    asconEngine.reset(); executionSteps = []; currentStep = 0;
    var r = document.getElementById('asconResult');    if (r) r.hidden = true;
    var v = document.getElementById('asconVizSection'); if (v) v.hidden = true;
    var ph = document.getElementById('asconPlaceholder'); if (ph) ph.hidden = false;
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
