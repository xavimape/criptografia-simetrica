const SBOX = [
  0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
  0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
  0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
  0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
  0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
  0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
  0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
  0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
  0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
  0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
  0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
  0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
  0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
  0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
  0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
  0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16
];

const RCON = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];

const CONTENT = {
  es: {
    eyebrow: "Criptografía aplicada",
    title: "AES Visualizer Web",
    heroCopy:
      "Un laboratorio educativo para entender AES paso a paso, con visualización, comparación y notas conceptuales.",
    langLabel: "Idioma",
    controlsTitle: "Entradas y control",
    keySizeLabel: "Tamaño de clave",
    inputModeLabel: "Modo de entrada",
    keyLabel: "Clave (hex)",
    plaintextLabel: "Texto plano",
    randomKeyBtn: "Clave aleatoria",
    randomPlainBtn: "Texto aleatorio",
    startBtn: "Iniciar",
    resetBtn: "Reiniciar",
    modeStep: "Paso",
    modeAuto: "Auto",
    modeFast: "Rápido",
    speedLabel: "Velocidad",
    vizTitle: "Visualización",
    beforeTitle: "ESTADO ANTES",
    afterTitle: "ESTADO DESPUÉS",
    roundKeyTitle: "CLAVE DE RONDA",
    explanationTitle: "EXPLICACIÓN",
    changesTitle: "Posiciones cambiadas",
    compareTitle: "Modo Comparación",
    compareKey1Label: "Ejecución 1 - Clave",
    compareKey2Label: "Ejecución 2 - Clave",
    comparePlain1Label: "Texto plano",
    comparePlain2Label: "Texto plano",
    compareBtn: "Comparar",
    guideTitle: "Guía educativa",
    ciphertextLabel: "Ciphertext",
    stepPrefix: "Paso",
    roundPrefix: "Ronda",
    phasePrefix: "Fase",
    finalRound: "Ronda final",
    initialState: "Estado inicial",
    initialRound: "Ronda inicial",
    comparisonHeader: "RESULTADOS DE LA COMPARACIÓN",
    differencesSummary: "Resumen de diferencias",
    avalanche: "EFECTO AVALANCHA",
    inputBits: "Bits de entrada cambiados",
    outputBits: "Bits de salida cambiados",
    avalancheNote: "AES debe amplificar un cambio pequeño en la entrada para producir un gran cambio en la salida.",
    badKey: "La clave debe tener {expected} caracteres hex para AES-{size}.",
    badPlain: "El texto plano debe tener exactamente 32 caracteres hex (16 bytes).",
    badEncrypt: "Error al cifrar: {err}",
    noExport: "No hay ejecución para exportar.",
    copied: "Ciphertext copiado al portapapeles.",
    jsonCopied: "JSON copiado al portapapeles.",
    explanationMap: {
      "Initial State": "El bloque de 16 bytes se carga en la matriz estado por columnas. La posición (fila, columna) importa: el algoritmo siempre trabaja sobre esta representación.",
      SubBytes: "SubBytes aplica una sustitución no lineal byte a byte. Matemáticamente, es una tabla de sustitución basada en una inversa en GF(2^8) seguida de una transformación afín.",
      ShiftRows: "ShiftRows desplaza cada fila una cantidad fija. Su función es redistribuir bytes entre columnas para aumentar la difusión.",
      MixColumns: "MixColumns multiplica cada columna por una matriz fija sobre GF(2^8). Esto hace que cada byte influya en varios bytes de salida.",
      AddRoundKey: "AddRoundKey mezcla el estado con la subclave actual usando XOR. Es la única fase que incorpora directamente material de clave."
    },
    guide: [
      {
        title: "1. Estado de AES",
        body: "AES opera sobre una matriz 4x4 de bytes. El bloque de entrada se coloca por columnas:",
        formula: "[ s00 s01 s02 s03 ]\n[ s10 s11 s12 s13 ]\n[ s20 s21 s22 s23 ]\n[ s30 s31 s32 s33 ]"
      },
      {
        title: "2. Matemática de difusión",
        body: "MixColumns trabaja en GF(2^8), con polinomio irreducible x^8 + x^4 + x^3 + x + 1 (0x11b).",
        formula: "M = [02 03 01 01]\n    [01 02 03 01]\n    [01 01 02 03]\n    [03 01 01 02]"
      },
      {
        title: "3. Idea de la avalancha",
        body: "Un cambio de un bit en la entrada debería alterar muchos bits del ciphertext. En la práctica, esto se observa paso a paso.",
        formula: "avalanche = changed_output_bits / changed_input_bits"
      },
    ]
  },
  en: {
    eyebrow: "Applied cryptography",
    title: "AES Visualizer Web",
    heroCopy:
      "An educational laboratory to understand AES step by step, with visualization, comparison, and conceptual notes.",
    langLabel: "Language",
    controlsTitle: "Inputs and controls",
    keySizeLabel: "Key size",
    inputModeLabel: "Input mode",
    keyLabel: "Key (hex)",
    plaintextLabel: "Plaintext",
    randomKeyBtn: "Random key",
    randomPlainBtn: "Random text",
    startBtn: "Start",
    resetBtn: "Reset",
    modeStep: "Step",
    modeAuto: "Auto",
    modeFast: "Fast",
    speedLabel: "Speed",
    vizTitle: "Visualization",
    beforeTitle: "STATE BEFORE",
    afterTitle: "STATE AFTER",
    roundKeyTitle: "ROUND KEY",
    explanationTitle: "EXPLANATION",
    changesTitle: "Changed positions",
    compareTitle: "Comparison Mode",
    compareKey1Label: "Execution 1 - Key",
    compareKey2Label: "Execution 2 - Key",
    comparePlain1Label: "Plaintext",
    comparePlain2Label: "Plaintext",
    compareBtn: "Compare",
    guideTitle: "Educational guide",
    ciphertextLabel: "Ciphertext",
    stepPrefix: "Step",
    roundPrefix: "Round",
    phasePrefix: "Phase",
    finalRound: "Final round",
    initialState: "Initial state",
    initialRound: "Initial round",
    comparisonHeader: "COMPARISON RESULTS",
    differencesSummary: "Differences summary",
    avalanche: "AVALANCHE EFFECT",
    inputBits: "Changed input bits",
    outputBits: "Changed output bits",
    avalancheNote: "AES should amplify a tiny input change into a large ciphertext change.",
    badKey: "The key must have {expected} hex chars for AES-{size}.",
    badPlain: "Plaintext must be exactly 32 hex characters (16 bytes).",
    badEncrypt: "Encryption error: {err}",
    noExport: "No execution to export.",
    copied: "Ciphertext copied to clipboard.",
    jsonCopied: "JSON copied to clipboard.",
    explanationMap: {
      "Initial State": "The 16-byte block is loaded into the state matrix by columns. AES always works on this representation.",
      SubBytes: "SubBytes performs a nonlinear byte substitution. Mathematically, it uses an inverse in GF(2^8) followed by an affine transform.",
      ShiftRows: "ShiftRows cyclically shifts each row by a fixed amount. Its role is to spread bytes across columns.",
      MixColumns: "MixColumns multiplies each column by a fixed matrix over GF(2^8). This makes each byte influence several output bytes.",
      AddRoundKey: "AddRoundKey combines the state with the current subkey using XOR. It is the only phase that injects key material directly."
    },
    guide: [
      {
        title: "1. AES State",
        body: "AES operates on a 4x4 byte matrix. The input block is placed column-wise:",
        formula: "[ s00 s01 s02 s03 ]\n[ s10 s11 s12 s13 ]\n[ s20 s21 s22 s23 ]\n[ s30 s31 s32 s33 ]"
      },
      {
        title: "2. Diffusion math",
        body: "MixColumns works in GF(2^8), with irreducible polynomial x^8 + x^4 + x^3 + x + 1 (0x11b).",
        formula: "M = [02 03 01 01]\n    [01 02 03 01]\n    [01 01 02 03]\n    [03 01 01 02]"
      },
      {
        title: "3. Avalanche idea",
        body: "A one-bit change in the input should alter many ciphertext bits. The step view makes this visible.",
        formula: "avalanche = changed_output_bits / changed_input_bits"
      },
    ]
  }
};

const state = {
  lang: (function(){ try { return localStorage.getItem('site-lang') || 'es'; } catch(e){ return 'es'; } }()),
  currentStep: 0,
  autoTimer: null,
  aes: null,
  steps: [],
  lastCiphertext: "",
  currentRun: null
};

const $ = (id) => document.getElementById(id);

function hexToBytes(hexStr) {
  const cleaned = hexStr.replace(/\s+/g, "").replace(/^0x/gi, "");
  if (cleaned.length % 2 !== 0) {
    throw new Error("Hex string must have an even length.");
  }
  const bytes = [];
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes.push(parseInt(cleaned.slice(i, i + 2), 16));
  }
  if (bytes.some((b) => Number.isNaN(b) || b < 0 || b > 255)) {
    throw new Error("Invalid hex string.");
  }
  return bytes;
}

function bytesToHex(bytes) {
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function textToBlockHex(text, blockSize = 16) {
  const encoded = new TextEncoder().encode(text);
  const block = new Uint8Array(blockSize);
  block.fill(0x20);
  block.set(encoded.slice(0, blockSize));
  return bytesToHex(Array.from(block));
}

function randomHex(bytes) {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return bytesToHex(Array.from(buf));
}

function copyMatrix(matrix) {
  return matrix.map((row) => row.slice());
}

function gmul(a, b) {
  let p = 0;
  for (let i = 0; i < 8; i++) {
    if (b & 1) {
      p ^= a;
    }
    const hi = a & 0x80;
    a = (a << 1) & 0xff;
    if (hi) {
      a ^= 0x1b;
    }
    b >>= 1;
  }
  return p & 0xff;
}

class AES {
  constructor() {
    this.state = Array.from({ length: 4 }, () => Array(4).fill(0));
    this.key = [];
    this.keySchedule = [];
    this.allSteps = [];
    this.nr = 0;
    this.nk = 0;
  }

  initialize(keyHex) {
    this.key = hexToBytes(keyHex);
    const keyBits = this.key.length * 8;
    if (keyBits === 128) {
      this.nk = 4; this.nr = 10;
    } else if (keyBits === 192) {
      this.nk = 6; this.nr = 12;
    } else if (keyBits === 256) {
      this.nk = 8; this.nr = 14;
    } else {
      throw new Error(`Invalid key size: ${keyBits} bits.`);
    }
    this.allSteps = [];
    this.keyExpansion();
  }

  keyExpansion() {
    this.keySchedule = [];
    const w = [];
    for (let i = 0; i < this.nk; i++) {
      w.push(this.key.slice(i * 4, i * 4 + 4));
    }
    for (let i = this.nk; i < 4 * (this.nr + 1); i++) {
      let temp = w[i - 1].slice();
      if (i % this.nk === 0) {
        temp = temp.slice(1).concat(temp.slice(0, 1));
        temp = temp.map((b) => SBOX[b]);
        temp[0] ^= RCON[(i / this.nk) - 1];
      } else if (this.nk > 6 && i % this.nk === 4) {
        temp = temp.map((b) => SBOX[b]);
      }
      const newWord = temp.map((b, j) => w[i - this.nk][j] ^ b);
      w.push(newWord);
    }
    for (let roundNum = 0; roundNum <= this.nr; roundNum++) {
      const roundKey = Array.from({ length: 4 }, () => Array(4).fill(0));
      for (let col = 0; col < 4; col++) {
        const word = w[roundNum * 4 + col];
        for (let row = 0; row < 4; row++) {
          roundKey[row][col] = word[row];
        }
      }
      this.keySchedule.push(roundKey);
    }
  }

  encrypt(plaintextHex) {
    const plaintext = hexToBytes(plaintextHex);
    if (plaintext.length !== 16) {
      throw new Error("Plaintext must be exactly 16 bytes.");
    }
    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 4; row++) {
        this.state[row][col] = plaintext[col * 4 + row];
      }
    }
    this.allSteps = [];
    this.recordStep("Initial State", -1, copyMatrix(this.state), copyMatrix(this.state), [], this.keySchedule[0]);

    let before = copyMatrix(this.state);
    this.addRoundKey(0);
    this.recordStep("AddRoundKey", 0, before, copyMatrix(this.state), this.findChanges(before, this.state), this.keySchedule[0]);

    for (let roundNum = 1; roundNum < this.nr; roundNum++) {
      before = copyMatrix(this.state);
      this.subBytes();
      this.recordStep("SubBytes", roundNum, before, copyMatrix(this.state), this.findChanges(before, this.state), this.keySchedule[roundNum]);

      before = copyMatrix(this.state);
      this.shiftRows();
      this.recordStep("ShiftRows", roundNum, before, copyMatrix(this.state), this.findChanges(before, this.state), this.keySchedule[roundNum]);

      before = copyMatrix(this.state);
      this.mixColumns();
      this.recordStep("MixColumns", roundNum, before, copyMatrix(this.state), this.findChanges(before, this.state), this.keySchedule[roundNum]);

      before = copyMatrix(this.state);
      this.addRoundKey(roundNum);
      this.recordStep("AddRoundKey", roundNum, before, copyMatrix(this.state), this.findChanges(before, this.state), this.keySchedule[roundNum]);
    }

    before = copyMatrix(this.state);
    this.subBytes();
    this.recordStep("SubBytes", this.nr, before, copyMatrix(this.state), this.findChanges(before, this.state), this.keySchedule[this.nr]);

    before = copyMatrix(this.state);
    this.shiftRows();
    this.recordStep("ShiftRows", this.nr, before, copyMatrix(this.state), this.findChanges(before, this.state), this.keySchedule[this.nr]);

    before = copyMatrix(this.state);
    this.addRoundKey(this.nr);
    this.recordStep("AddRoundKey", this.nr, before, copyMatrix(this.state), this.findChanges(before, this.state), this.keySchedule[this.nr]);

    const out = [];
    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 4; row++) {
        out.push(this.state[row][col]);
      }
    }
    return bytesToHex(out);
  }

  subBytes() {
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        this.state[row][col] = SBOX[this.state[row][col]];
      }
    }
  }

  shiftRows() {
    this.state[1] = this.state[1].slice(1).concat(this.state[1].slice(0, 1));
    this.state[2] = this.state[2].slice(2).concat(this.state[2].slice(0, 2));
    this.state[3] = this.state[3].slice(3).concat(this.state[3].slice(0, 3));
  }

  mixColumns() {
    for (let col = 0; col < 4; col++) {
      const c = this.state.map((row) => row[col]);
      this.state[0][col] = gmul(c[0], 2) ^ gmul(c[1], 3) ^ c[2] ^ c[3];
      this.state[1][col] = c[0] ^ gmul(c[1], 2) ^ gmul(c[2], 3) ^ c[3];
      this.state[2][col] = c[0] ^ c[1] ^ gmul(c[2], 2) ^ gmul(c[3], 3);
      this.state[3][col] = gmul(c[0], 3) ^ c[1] ^ c[2] ^ gmul(c[3], 2);
    }
  }

  addRoundKey(roundNum) {
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        this.state[row][col] ^= this.keySchedule[roundNum][row][col];
      }
    }
  }

  findChanges(before, after) {
    const changes = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (before[row][col] !== after[row][col]) {
          changes.push([row, col]);
        }
      }
    }
    return changes;
  }

  recordStep(phase, roundNum, stateBefore, stateAfter, changes, roundKey) {
    this.allSteps.push({
      phase,
      round_num: roundNum,
      state_before: copyMatrix(stateBefore),
      state_after: copyMatrix(stateAfter),
      changes: changes.map((c) => c.slice()),
      round_key: copyMatrix(roundKey)
    });
  }
}

function t(key, fallback = "") {
  return (CONTENT[state.lang] && CONTENT[state.lang][key]) || fallback;
}

function fmt(template, vars = {}) {
  return template.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));
}

async function loadExternalTranslations() {
  try {
    const res = await fetch('aes-translations.json');
    if (!res.ok) return;
    const external = await res.json();
    // Merge simple keys: for each language present in external, copy keys
    for (const lang of Object.keys(external)) {
      if (!CONTENT[lang]) CONTENT[lang] = {};
      const obj = external[lang];
      for (const k of Object.keys(obj)) {
        // Only copy keys that are strings or simple values
        if (typeof obj[k] === 'string' && !(k in CONTENT[lang])) {
          CONTENT[lang][k] = obj[k];
        }
      }
    }
    console.log('Loaded external translations (merged).');
  } catch (err) {
    // silent fallback
    console.debug('No external translations loaded:', err);
  }
}

function getMode() {
  return document.querySelector('input[name="mode"]:checked').value;
}

function formatMatrix(matrix, highlight = [], binary = false) {
  const map = new Set(highlight.map(([r, c]) => `${r},${c}`));
  const rows = matrix.map((row, r) => {
    const cells = row.map((b, c) => {
      const val = binary ? b.toString(2).padStart(8, "0") : b.toString(16).padStart(2, "0");
      return map.has(`${r},${c}`) ? `*${val}*` : val;
    });
    return cells.join("  ");
  });
  return rows.join("\n");
}

function renderGuide() {
  const root = $("guideContent");
  root.innerHTML = "";
  const guide = CONTENT[state.lang].guide;
  guide.forEach((section) => {
    const card = document.createElement("article");
    card.className = "guide-card";
    card.innerHTML = `
      <h3>${section.title}</h3>
      <p>${section.body}</p>
      <div class="formula">${section.formula.replace(/\n/g, "<br>")}</div>
    `;
    root.appendChild(card);
  });
}

function applyLanguage() {
  const lang = CONTENT[state.lang];
  document.documentElement.lang = state.lang;
  $("eyebrow").textContent = lang.eyebrow;
  $("title").textContent = lang.title;
  $("heroCopy").textContent = lang.heroCopy;
  $("langLabel").textContent = lang.langLabel;
  $("controlsTitle").textContent = lang.controlsTitle;
  $("keySizeLabel").textContent = lang.keySizeLabel;
  $("inputModeLabel").textContent = lang.inputModeLabel;
  $("keyLabel").textContent = lang.keyLabel;
  $("plaintextLabel").textContent = lang.plaintextLabel;
  $("randomKeyBtn").textContent = lang.randomKeyBtn;
  $("randomPlainBtn").textContent = lang.randomPlainBtn;
  $("startBtn").textContent = lang.startBtn;
  $("resetBtn").textContent = lang.resetBtn;
  $("modeStep").textContent = lang.modeStep;
  $("modeAuto").textContent = lang.modeAuto;
  $("modeFast").textContent = lang.modeFast;
  $("speedLabel").textContent = lang.speedLabel;
  $("vizTitle").textContent = lang.vizTitle;
  $("beforeTitle").textContent = lang.beforeTitle;
  $("afterTitle").textContent = lang.afterTitle;
  $("roundKeyTitle").textContent = lang.roundKeyTitle;
  $("explanationTitle").textContent = lang.explanationTitle;
  $("changesTitle").textContent = lang.changesTitle;
  $("compareTitle").textContent = lang.compareTitle;
  $("compareKey1Label").textContent = lang.compareKey1Label;
  $("compareKey2Label").textContent = lang.compareKey2Label;
  $("comparePlain1Label").textContent = lang.comparePlain1Label;
  $("comparePlain2Label").textContent = lang.comparePlain2Label;
  $("compareBtn").textContent = lang.compareBtn;
  $("guideTitle").textContent = lang.guideTitle;
  renderGuide();
  renderCurrentStep();
}

function updateSpeedLabel() {
  const value = Number($("speed").value);
  $("speedValue").textContent = `${value.toFixed(1)}x`;
}

function validateInputs(keyHex, plainHex, keySize) {
  const expectedKeyLen = keySize / 4;
  if (keyHex.length !== expectedKeyLen) {
    throw new Error(fmt(t("badKey"), { expected: expectedKeyLen, size: keySize }));
  }
  if (plainHex.length !== 32) {
    throw new Error(t("badPlain"));
  }
}

function prepareRun() {
  const keySize = Number($("keySize").value);
  const keyHex = $("keyInput").value.replace(/\s+/g, "");
  const plainRaw = $("plaintextInput").value.replace(/\s+/g, "");
  const plainHex = $("inputMode").value === "text"
    ? textToBlockHex(plainRaw)
    : plainRaw;
  validateInputs(keyHex, plainHex, keySize);
  const aes = new AES();
  aes.initialize(keyHex);
  const ciphertext = aes.encrypt(plainHex);
  state.aes = aes;
  state.steps = aes.allSteps;
  state.currentStep = 0;
  state.lastCiphertext = ciphertext;
  state.currentRun = {
    keyHex,
    plainHex,
    ciphertext,
    keySize
  };
  $("compareKey1").value = keyHex;
  $("comparePlain1").value = plainHex;
  if (!$("compareKey2").value) {
    $("compareKey2").value = keyHex.slice(0, -2) + "10";
  }
  if (!$("comparePlain2").value) {
    $("comparePlain2").value = plainHex;
  }
}

function renderCurrentStep() {
  if (!state.steps.length) {
    $("stepCounter").textContent = `${t("stepPrefix")} 0/0`;
    $("roundInfo").textContent = "-";
    $("phaseInfo").textContent = "-";
    $("phaseTag").textContent = "-";
    $("beforeMatrix").textContent = "-";
    $("afterMatrix").textContent = "-";
    $("roundKeyMatrix").textContent = "-";
    $("explanationBox").innerHTML = "";
    $("changesBox").innerHTML = "";
    return;
  }

  const step = state.steps[state.currentStep];
  const total = state.steps.length;
  $("stepCounter").textContent = `${t("stepPrefix")} ${state.currentStep + 1}/${total}`;
  $("roundInfo").textContent = step.round_num === -1
    ? t("initialState")
    : `${t("roundPrefix")} ${step.round_num}`;
  $("phaseInfo").textContent = step.round_num === -1
    ? t("initialState")
    : step.phase;
  $("phaseTag").textContent = step.round_num === -1
    ? t("initialState")
    : step.phase;
  $("beforeMatrix").textContent = formatMatrix(step.state_before);
  $("afterMatrix").textContent = formatMatrix(step.state_after, step.changes);
  $("roundKeyMatrix").textContent = formatMatrix(step.round_key);
  const explanation = (CONTENT[state.lang].explanationMap[step.phase] || "");
  $("explanationBox").innerHTML = `<p>${explanation}</p>`;
  $("changesBox").innerHTML = step.changes.length
    ? step.changes.map(([r, c]) => {
        const before = step.state_before[r][c].toString(16).padStart(2, "0");
        const after = step.state_after[r][c].toString(16).padStart(2, "0");
        return `<div class="change-item">(${r},${c}) ${before} -> ${after}</div>`;
      }).join("")
    : `<div class="change-item">No changes</div>`;
}

function runAuto() {
  if (state.autoTimer) {
    clearInterval(state.autoTimer);
    state.autoTimer = null;
  }
  const delay = Math.max(120, Math.floor(900 / Number($("speed").value)));
  state.autoTimer = setInterval(() => {
    if (!state.steps.length || state.currentStep >= state.steps.length - 1) {
      clearInterval(state.autoTimer);
      state.autoTimer = null;
      return;
    }
    state.currentStep += 1;
    renderCurrentStep();
  }, delay);
}

function showFastResults() {
  const run = state.currentRun;
  $("phaseTag").textContent = t("finalRound");
  $("beforeMatrix").textContent = "-";
  $("afterMatrix").textContent = "-";
  $("roundKeyMatrix").textContent = "-";
  $("explanationBox").innerHTML = `
    <p><strong>${run.ciphertext}</strong></p>
    <p>${t("guideTitle")}: ${t("finalRound")}.</p>
  `;
  $("changesBox").innerHTML = `<div class="change-item">${t("stepPrefix")} ${state.steps.length} / ${state.steps.length}</div>`;
  const last = state.steps[state.steps.length - 1];
  const roundLabel = last.round_num === state.aes.nr ? `${t("finalRound")} ${last.round_num}` : `${t("roundPrefix")} ${last.round_num}`;
  $("roundInfo").textContent = roundLabel;
  $("phaseInfo").textContent = last.phase;
  $("stepCounter").textContent = `${t("stepPrefix")} ${state.steps.length}/${state.steps.length}`;
}

function compareExecutions() {
  try {
    const keySize = Number($("keySize").value);
    const key1 = $("compareKey1").value.replace(/\s+/g, "");
    const plain1 = $("comparePlain1").value.replace(/\s+/g, "");
    const key2 = $("compareKey2").value.replace(/\s+/g, "");
    const plain2 = $("comparePlain2").value.replace(/\s+/g, "");

    const p1 = plain1.length === 32 ? plain1 : textToBlockHex(plain1);
    const p2 = plain2.length === 32 ? plain2 : textToBlockHex(plain2);
    validateInputs(key1, p1, keySize);
    validateInputs(key2, p2, keySize);

    const aes1 = new AES();
    aes1.initialize(key1);
    const c1 = aes1.encrypt(p1);
    const aes2 = new AES();
    aes2.initialize(key2);
    const c2 = aes2.encrypt(p2);

    const keyDiff = [...key1].filter((ch, i) => ch !== key2[i]).length;
    const plainDiff = [...p1].filter((ch, i) => ch !== p2[i]).length;
    const cipherDiff = [...c1].filter((ch, i) => ch !== c2[i]).length;
    const inputBits = (keyDiff + plainDiff) * 4;
    const outputBits = cipherDiff * 4;
    const ratio = inputBits > 0 ? (outputBits / inputBits) : 0;

    const lines = [
      t("comparisonHeader"),
      "",
      `${t("compareKey1Label")}: ${key1}`,
      `${t("comparePlain1Label")}: ${p1}`,
      `${t("ciphertextLabel")}: ${c1}`,
      "",
      `${t("compareKey2Label")}: ${key2}`,
      `${t("comparePlain2Label")}: ${p2}`,
      `${t("ciphertextLabel")}: ${c2}`,
      "",
      `${t("differencesSummary")}:`,
      `Key: ${keyDiff} hex digits`,
      `Plaintext: ${plainDiff} hex digits`,
      `Ciphertext: ${cipherDiff} hex digits`
    ];

    if (inputBits > 0) {
      lines.push("");
      lines.push(t("avalanche"));
      lines.push(`${t("inputBits")}: ${inputBits}`);
      lines.push(`${t("outputBits")}: ${outputBits}`);
      lines.push(`Avalanche ratio: ${ratio.toFixed(3)}`);
      lines.push(t("avalancheNote"));
    }

    $("compareOutput").textContent = lines.join("\n");
  } catch (err) {
    $("compareOutput").textContent = fmt(t("badEncrypt"), { err: err.message });
  }
}

function exportJSON() {
  if (!state.currentRun || !state.aes) {
    alert(t("noExport"));
    return;
  }
  const payload = {
    algorithm: `AES-${state.currentRun.keySize}`,
    rounds: state.aes.nr,
    key: state.currentRun.keyHex,
    plaintext: state.currentRun.plainHex,
    ciphertext: state.currentRun.ciphertext,
    steps: state.steps
  };
  const json = JSON.stringify(payload, null, 2);
  navigator.clipboard?.writeText(json);
  alert(t("jsonCopied"));
}

function copyCiphertext() {
  if (!state.currentRun) {
    alert(t("noExport"));
    return;
  }
  navigator.clipboard?.writeText(state.currentRun.ciphertext);
  alert(t("copied"));
}

function resetApp() {
  if (state.autoTimer) {
    clearInterval(state.autoTimer);
    state.autoTimer = null;
  }
  state.aes = null;
  state.steps = [];
  state.currentStep = 0;
  state.lastCiphertext = "";
  state.currentRun = null;
  renderCurrentStep();
  $("compareOutput").textContent = "-";
}

function initDefaults() {
  $("keySize").value = "128";
  $("inputMode").value = "hex";
  $("keyInput").value = "000102030405060708090a0b0c0d0e0f";
  $("plaintextInput").value = "00112233445566778899aabbccddeeff";
  $("compareKey1").value = "000102030405060708090a0b0c0d0e0f";
  $("comparePlain1").value = "00112233445566778899aabbccddeeff";
  $("compareKey2").value = "000102030405060708090a0b0c0d0e10";
  $("comparePlain2").value = "00112233445566778899aabbccddeeff";
}

function wireEvents() {
  $("langSelect").addEventListener("change", (e) => {
    state.lang = e.target.value;
    try { localStorage.setItem('site-lang', state.lang); } catch(x) {}
    applyLanguage();
    window.dispatchEvent(new CustomEvent('langchange', { detail: { lang: state.lang } }));
  });

  $("speed").addEventListener("input", updateSpeedLabel);
  $("randomKeyBtn").addEventListener("click", () => {
    const size = Number($("keySize").value) / 8;
    $("keyInput").value = randomHex(size);
  });
  $("randomPlainBtn").addEventListener("click", () => {
    $("plaintextInput").value = randomHex(16);
    $("inputMode").value = "hex";
  });
  $("startBtn").addEventListener("click", () => {
    try {
      prepareRun();
      renderCurrentStep();
      const mode = getMode();
      if (mode === "auto") {
        runAuto();
      } else if (mode === "fast") {
        showFastResults();
      }
    } catch (err) {
      alert(err.message);
    }
  });
  $("resetBtn").addEventListener("click", resetApp);
  $("prevBtn").addEventListener("click", () => {
    if (state.currentStep > 0) {
      state.currentStep -= 1;
      renderCurrentStep();
    }
  });
  $("nextBtn").addEventListener("click", () => {
    if (state.currentStep < state.steps.length - 1) {
      state.currentStep += 1;
      renderCurrentStep();
    }
  });
  $("compareBtn").addEventListener("click", compareExecutions);
  $("copyBtn").addEventListener("click", copyCiphertext);
  $("exportBtn").addEventListener("click", exportJSON);
}

/* Sync language when i18n.js pills are clicked.
   applyLanguage() is not called here because some elements it tries to set
   don't exist on this page — PAGES['aes-demo'] in i18n.js handles the static
   labels, and t() in dynamic renders reads state.lang directly. */
window.addEventListener('langchange', function (e) {
  var newLang = (e.detail && e.detail.lang) || 'es';
  if (newLang !== state.lang) {
    state.lang = newLang;
  }
});

async function init() {
  await loadExternalTranslations();
  initDefaults();
  wireEvents();
  updateSpeedLabel();
  applyLanguage();
}

init();


