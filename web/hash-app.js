/* ==========================================================
   Hash Visualizer — Core logic
   MD5 · SHA-256 · SHA3-256 · HMAC-SHA256
   Implementaciones pedagógicas — NO para producción
   ========================================================== */
'use strict';

// ── i18n helpers ─────────────────────────────────────────
function getLang() {
  if (window.SITE_LANG) return window.SITE_LANG;
  try { return localStorage.getItem('site-lang') || 'es'; } catch(e) { return 'es'; }
}
function pickLang(v) {
  var L = getLang();
  return (v && typeof v === 'object') ? (v[L] || v.es || '') : (v || '');
}
function hashTc(el, enText) {
  if (!el) return;
  if (el._i18nOrig === undefined) el._i18nOrig = el.textContent;
  el.textContent = getLang() === 'en' ? enText : el._i18nOrig;
}

// ── Utilidades ────────────────────────────────────────────
function uint32(x)           { return x >>> 0; }
function rotateRight32(x, n) { return ((x >>> n) | (x << (32 - n))) >>> 0; }
function h32(n)  { return ('00000000' + uint32(n).toString(16)).slice(-8); }
function h8le(w) {
  var b = [w&0xff, (w>>8)&0xff, (w>>16)&0xff, (w>>24)&0xff];
  return b.map(function(x){ return ('00'+x.toString(16)).slice(-2); }).join('');
}
function laneToHex(lo, hi) {
  // Output lane bytes in little-endian order (Keccak convention)
  return [lo&0xff,(lo>>8)&0xff,(lo>>16)&0xff,(lo>>24)&0xff,
          hi&0xff,(hi>>8)&0xff,(hi>>16)&0xff,(hi>>24)&0xff]
    .map(function(b){ return ('00'+b.toString(16)).slice(-2); }).join('');
}
function strToBytes(s) {
  var out = [];
  for (var i = 0; i < s.length; i++) {
    var c = s.charCodeAt(i);
    if      (c < 0x80)  { out.push(c); }
    else if (c < 0x800) { out.push(0xC0|(c>>6), 0x80|(c&0x3f)); }
    else                { out.push(0xE0|(c>>12), 0x80|((c>>6)&0x3f), 0x80|(c&0x3f)); }
  }
  return out;
}
function hexToBytes(hex) {
  var out = [];
  for (var i = 0; i < hex.length; i+=2) out.push(parseInt(hex.substr(i,2),16));
  return out;
}
function toHex(bytes) {
  return bytes.map(function(b){ return ('00'+b.toString(16)).slice(-2); }).join('');
}
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Padding Merkle-Damgård ────────────────────────────────
function mdPad(msgBytes, bigEndian) {
  var len    = msgBytes.length;
  var bitLen = len * 8;
  var padded = msgBytes.slice();
  padded.push(0x80);
  while (padded.length % 64 !== 56) padded.push(0x00);
  var lo = bitLen >>> 0;
  var hi = Math.floor(bitLen / 0x100000000) >>> 0;
  if (bigEndian) {
    padded.push((hi>>>24)&0xff,(hi>>>16)&0xff,(hi>>>8)&0xff,hi&0xff);
    padded.push((lo>>>24)&0xff,(lo>>>16)&0xff,(lo>>>8)&0xff,lo&0xff);
  } else {
    padded.push(lo&0xff,(lo>>8)&0xff,(lo>>16)&0xff,(lo>>24)&0xff);
    padded.push(hi&0xff,(hi>>8)&0xff,(hi>>16)&0xff,(hi>>24)&0xff);
  }
  return padded;
}

// ── SHA-256 constants ─────────────────────────────────────
var SHA256_K = [
  0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
  0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
  0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
  0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
  0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
  0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
  0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
  0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
];
var SHA256_H0 = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
var SHA256_PRIMES = [2,3,5,7,11,13,17,19];

// ── MD5 constants ─────────────────────────────────────────
var MD5_S = [7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,
             5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,
             4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,
             6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
var MD5_K = (function(){
  var T=[];
  for(var i=0;i<64;i++) T.push(uint32(Math.floor(Math.abs(Math.sin(i+1))*0x100000000)));
  return T;
}());

// ── Keccak round constants ────────────────────────────────
var KECCAK_RC = [
  [0x00000001,0x00000000],[0x00008082,0x00000000],[0x0000808A,0x80000000],[0x80008000,0x80000000],
  [0x0000808B,0x00000000],[0x80000001,0x00000000],[0x80008081,0x80000000],[0x00008009,0x80000000],
  [0x0000008A,0x00000000],[0x00000088,0x00000000],[0x80008009,0x00000000],[0x8000000A,0x00000000],
  [0x8000808B,0x00000000],[0x0000008B,0x80000000],[0x00008089,0x80000000],[0x00008003,0x80000000],
  [0x00008002,0x80000000],[0x00000080,0x80000000],[0x0000800A,0x00000000],[0x8000000A,0x80000000],
  [0x80008081,0x80000000],[0x00008080,0x80000000],[0x80000001,0x00000000],[0x80008008,0x80000000]
];

// ═══════════════════════════════════════════════════════════
//  HASH ALGORITHMS — each returns { digest, steps }
//  where steps = [{label, preview, detail}]
// ═══════════════════════════════════════════════════════════

// ── SHA-256 ──────────────────────────────────────────────
function sha256Compute(msgBytes) {
  var L = getLang();
  var steps = [];

  /* 1 — Padding */
  var padded    = mdPad(msgBytes, true);
  var nBlocks   = padded.length / 64;
  steps.push({
    label:   L==='en' ? 'Padding (Merkle-Damgård, big-endian)' : 'Padding (Merkle-Damgård, big-endian)',
    preview: msgBytes.length + ' → ' + padded.length + ' bytes, ' + nBlocks + ' bloque' + (nBlocks>1?'s':''),
    detail:  [
      (L==='en'?'Original:    ':'Original:    ') + (msgBytes.length ? toHex(msgBytes) : '(vacío)'),
      (L==='en'?'Length:      ':'Longitud:    ') + msgBytes.length + ' bytes = ' + (msgBytes.length*8) + ' bits',
      (L==='en'?'0x80 appended at byte ':'0x80 en byte ') + msgBytes.length,
      (L==='en'?'Zero-fill to len ≡ 56 mod 64':'Ceros hasta len ≡ 56 mod 64'),
      (L==='en'?'Length field (64-bit BE): ':'Campo longitud (64-bit BE): ') + toHex(padded.slice(-8)),
      (L==='en'?'Result:      ':'Resultado:   ') + padded.length + ' bytes → ' + nBlocks + (L==='en'?' block(s) of 512 bits':' bloque(s) de 512 bits')
    ].join('\n')
  });

  /* 2 — Init state */
  var H = SHA256_H0.slice();
  steps.push({
    label:   L==='en' ? 'Initial state H0–H7 (√ of first 8 primes)' : 'Estado inicial H0–H7 (raíces de los 8 primeros primos)',
    preview: 'H0=' + h32(H[0]) + '  H7=' + h32(H[7]),
    detail:  H.map(function(v,i){ return 'H' + i + ' = ' + h32(v) + '  (frac(√' + SHA256_PRIMES[i] + '))'; }).join('\n')
  });

  /* Process blocks — capture intermediate data */
  var W0 = [];       // schedule block 0
  var rndLog = [];   // round samples
  var t, s0, s1;

  for (var bi = 0; bi < padded.length; bi += 64) {
    var W = new Array(64);
    for (t = 0; t < 16; t++)
      W[t] = ((padded[bi+t*4]<<24)|(padded[bi+t*4+1]<<16)|(padded[bi+t*4+2]<<8)|padded[bi+t*4+3])>>>0;
    for (t = 16; t < 64; t++) {
      s0 = (rotateRight32(W[t-15],7) ^ rotateRight32(W[t-15],18) ^ (W[t-15]>>>3)) >>> 0;
      s1 = (rotateRight32(W[t-2],17) ^ rotateRight32(W[t-2],19)  ^ (W[t-2]>>>10)) >>> 0;
      W[t] = uint32(W[t-16] + s0 + W[t-7] + s1);
    }
    if (bi === 0) W0 = W.slice(0, 16);

    var a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
    rndLog = [];
    for (t = 0; t < 64; t++) {
      var S1  = (rotateRight32(e,6) ^ rotateRight32(e,11) ^ rotateRight32(e,25)) >>> 0;
      var ch  = ((e&f) ^ (~e&g)) >>> 0;
      var T1  = uint32(h + S1 + ch + SHA256_K[t] + W[t]);
      var S0  = (rotateRight32(a,2) ^ rotateRight32(a,13) ^ rotateRight32(a,22)) >>> 0;
      var maj = ((a&b) ^ (a&c) ^ (b&c)) >>> 0;
      var T2  = uint32(S0 + maj);
      h=g; g=f; f=e; e=uint32(d+T1); d=c; c=b; b=a; a=uint32(T1+T2);
      if (t===0 || t===7 || t===15 || t===31 || t===47 || t===63) {
        rndLog.push('R' + String(t+1).padStart(2,' ') + ':  a=' + h32(a) + '  e=' + h32(e));
      }
    }
    H[0]=uint32(H[0]+a); H[1]=uint32(H[1]+b); H[2]=uint32(H[2]+c); H[3]=uint32(H[3]+d);
    H[4]=uint32(H[4]+e); H[5]=uint32(H[5]+f); H[6]=uint32(H[6]+g); H[7]=uint32(H[7]+h);
  }

  /* 3 — Message schedule */
  steps.push({
    label:   L==='en' ? 'Message schedule W[0..15] — block 0' : 'Message schedule W[0..15] — bloque 0',
    preview: 'W[0]=' + h32(W0[0]) + '  W[1]=' + h32(W0[1]),
    detail:  W0.map(function(v,i){ return 'W[' + String(i).padStart(2,' ') + '] = ' + h32(v); }).join('\n')
             + (nBlocks > 1 ? '\n(bloque 0 de ' + nBlocks + ')' : '')
  });

  /* 4 — Compression */
  steps.push({
    label:   L==='en' ? '64 compression rounds (Ch, Maj, Σ0, Σ1)' : '64 rondas de compresión (Ch, Maj, Σ0, Σ1)',
    preview: rndLog[0] || '',
    detail:  rndLog.join('\n')
             + '\n\n' + (L==='en'
               ? 'T1 = h + Σ1(e) + Ch(e,f,g) + K[t] + W[t]\nT2 = Σ0(a) + Maj(a,b,c)'
               : 'T1 = h + Σ1(e) + Ch(e,f,g) + K[t] + W[t]\nT2 = Σ0(a) + Maj(a,b,c)')
  });

  /* 5 — Final state */
  steps.push({
    label:   L==='en' ? 'Final state H0–H7 (after compression)' : 'Estado final H0–H7 (tras compresión)',
    preview: 'H0=' + h32(H[0]) + '  H4=' + h32(H[4]),
    detail:  H.map(function(v,i){ return 'H' + i + ' = ' + h32(v); }).join('\n')
  });

  var digest = H.map(h32).join('');

  /* 6 — Output */
  steps.push({
    label:   L==='en' ? 'Output: H0 ‖ H1 ‖ … ‖ H7 (256 bits)' : 'Salida: H0 ‖ H1 ‖ … ‖ H7 (256 bits)',
    preview: digest.slice(0,16) + '…',
    detail:  digest
  });

  return { digest: digest, steps: steps };
}

// ── MD5 ───────────────────────────────────────────────────
function md5Compute(msgBytes) {
  var L = getLang();
  var steps = [];

  /* 1 — Padding */
  var padded  = mdPad(msgBytes, false);
  var nBlocks = padded.length / 64;
  steps.push({
    label:   L==='en' ? 'Padding (Merkle-Damgård, little-endian)' : 'Padding (Merkle-Damgård, little-endian)',
    preview: msgBytes.length + ' → ' + padded.length + ' bytes, ' + nBlocks + ' bloque' + (nBlocks>1?'s':''),
    detail:  [
      (L==='en'?'Original: ':'Original: ') + (msgBytes.length ? toHex(msgBytes) : '(vacío)'),
      (L==='en'?'Length:   ':'Longitud: ') + msgBytes.length + ' bytes = ' + (msgBytes.length*8) + ' bits',
      '0x80 appended, zeros, then 64-bit LE length field',
      (L==='en'?'Result:   ':'Resultado:') + ' ' + padded.length + ' bytes (' + nBlocks + ' block' + (nBlocks>1?'s':'') + ')',
      '',
      (L==='en'?'Note: length is little-endian (MD5/SHA-1) vs. big-endian (SHA-2)':
               'Nota: longitud en little-endian (MD5/SHA-1) vs. big-endian (SHA-2)')
    ].join('\n')
  });

  /* 2 — Init state */
  var a0=0x67452301, b0=0xefcdab89, c0=0x98badcfe, d0=0x10325476;
  steps.push({
    label:   L==='en' ? 'Initial state (A, B, C, D)' : 'Estado inicial (A, B, C, D)',
    preview: 'A=67452301  D=10325476',
    detail:  'A = 67452301\nB = efcdab89\nC = 98badcfe\nD = 10325476\n\n' +
             (L==='en'?'(Fixed constants — not from primes like SHA-2)':
                       '(Constantes fijas — no derivadas de primos como SHA-2)')
  });

  var r1log = [], r4log = [];
  for (var bi = 0; bi < padded.length; bi += 64) {
    var M = [];
    for (var j = 0; j < 16; j++)
      M.push(uint32(padded[bi+j*4]|(padded[bi+j*4+1]<<8)|(padded[bi+j*4+2]<<16)|(padded[bi+j*4+3]<<24)));
    var A=a0, B=b0, C=c0, D=d0;
    for (j = 0; j < 64; j++) {
      var F2, g2;
      if      (j<16){ F2=uint32((B&C)|(~B&D));   g2=j; }
      else if (j<32){ F2=uint32((D&B)|(~D&C));   g2=(5*j+1)%16; }
      else if (j<48){ F2=uint32(B^C^D);           g2=(3*j+5)%16; }
      else          { F2=uint32(C^(B|(~D)));      g2=(7*j)%16; }
      F2 = uint32(F2 + A + MD5_K[j] + M[g2]);
      A=D; D=C; C=B;
      var sh = MD5_S[j];
      B = uint32(B + uint32((F2<<sh)|(F2>>>(32-sh))));
      if (j < 4  && bi === 0) r1log.push('Op' + (j+1) + ' F:  A=' + h32(A) + ' B=' + h32(B));
      if (j >= 60 && bi === 0) r4log.push('Op' + (j-59) + ' I:  B=' + h32(B));
    }
    a0=uint32(a0+A); b0=uint32(b0+B); c0=uint32(c0+C); d0=uint32(d0+D);
  }

  /* 3 — Round 1 */
  steps.push({
    label:   L==='en' ? 'Round 1 — 16 ops (F function: (B∧C)∨(¬B∧D))' : 'Ronda 1 — 16 ops (función F: (B∧C)∨(¬B∧D))',
    preview: r1log[0] || '',
    detail:  r1log.join('\n') + '\n...(16 operations total in round 1)'
  });

  /* 4 — Rounds 2-4 */
  steps.push({
    label:   L==='en' ? 'Rounds 2-4 (G, H, I functions)' : 'Rondas 2-4 (funciones G, H, I)',
    preview: 'G=(D∧B)∨(¬D∧C)  H=B⊕C⊕D  I=C⊕(B∨¬D)',
    detail:  [
      'R2 (G): (D∧B)∨(¬D∧C)  — índice M[(5j+1)%16]',
      'R3 (H): B⊕C⊕D          — índice M[(3j+5)%16]',
      'R4 (I): C⊕(B∨¬D)       — índice M[(7j)%16]',
      '',
      L==='en'?'4 rounds × 16 ops = 64 operations per block':'4 rondas × 16 ops = 64 operaciones por bloque',
      r4log.length ? '\nRonda 4 muestra:\n' + r4log.join('\n') : ''
    ].join('\n')
  });

  /* 5 — Final accumulator */
  steps.push({
    label:   L==='en' ? 'Accumulator result' : 'Resultado del acumulador',
    preview: 'A=' + h32(a0),
    detail:  'A = ' + h32(a0) + '\nB = ' + h32(b0) + '\nC = ' + h32(c0) + '\nD = ' + h32(d0)
  });

  /* 6 — Output LE */
  var digest = h8le(a0) + h8le(b0) + h8le(c0) + h8le(d0);
  steps.push({
    label:   L==='en' ? 'Output: little-endian byte reversal (128 bits)' : 'Salida: inversión de bytes LE (128 bits)',
    preview: digest.slice(0,16) + '…',
    detail:  'A(LE) = ' + h8le(a0) + '\nB(LE) = ' + h8le(b0) + '\nC(LE) = ' + h8le(c0) + '\nD(LE) = ' + h8le(d0) + '\n\nMD5 = ' + digest
  });

  return { digest: digest, steps: steps };
}

// ── SHA3-256 (Keccak sponge) ───────────────────────────────
function sha3Compute(msgBytes) {
  var L = getLang();
  var steps = [];
  var rate  = 136; // (1600 - 256*2) / 8

  /* 1 — Padding */
  var padded = msgBytes.slice();
  padded.push(0x06);
  while (padded.length % rate !== 0) padded.push(0x00);
  padded[padded.length - 1] |= 0x80;
  var nBlocks = padded.length / rate;

  steps.push({
    label:   L==='en' ? 'SHA-3 multirate padding (0x06 … 0x80)' : 'Padding multirate SHA-3 (0x06 … 0x80)',
    preview: msgBytes.length + ' → ' + padded.length + ' bytes, rate=136',
    detail:  [
      (L==='en'?'Original:  ':'Original:  ') + (msgBytes.length ? toHex(msgBytes) : '(vacío)'),
      '0x06 appended at byte ' + msgBytes.length + '  (SHA-3 domain separator)',
      (L==='en'?'Rate:      136 bytes = (1600 - 512) / 8':'Rate:      136 bytes = (1600 - 512) / 8'),
      (L==='en'?'Capacity:   64 bytes (512 bits — security parameter)':'Capacidad:  64 bytes (512 bits — parámetro de seguridad)'),
      '0x80 OR at last byte (position ' + (padded.length-1) + ')',
      (L==='en'?'Padded:    ':'Padding:   ') + padded.length + ' bytes (' + nBlocks + ' block' + (nBlocks>1?'s':'') + ')',
      '',
      (L==='en'?'Difference vs MD: no length field — sponge is immune to length-extension':
               'Diferencia vs MD: sin campo longitud — la esponja es inmune a length-extension')
    ].join('\n')
  });

  /* 2 — Init state */
  var state = [];
  var si;
  for (si = 0; si < 25; si++) state.push([0, 0]);

  steps.push({
    label:   L==='en' ? 'Initialize 5×5 Keccak state (1600 bits = 25 lanes × 64 bits)' : 'Inicializar estado Keccak 5×5 (1600 bits = 25 lanes × 64 bits)',
    preview: '25 × 64 bits = 1600 bits, todo cero',
    detail:  [
      'state[x + 5y]  (x=column, y=row)',
      'Lane size: 64 bits = 2 × uint32',
      '',
      L==='en'?'Absorb phase: XOR message bits into state[0..16]':'Fase absorb: XOR de bits del mensaje en state[0..16]',
      L==='en'?'Permute: apply keccak-f[1600] (24 rounds)':'Permutar: aplicar keccak-f[1600] (24 rondas)',
      L==='en'?'Squeeze: extract 256 bits from state[0..3]':'Squeeze: extraer 256 bits de state[0..3]'
    ].join('\n')
  });

  /* keccakF — pure function on state array */
  function rotLane64(lo, hi, n) {
    if (n === 0) return [lo, hi];
    if (n < 32)  return [((lo<<n)|(hi>>>(32-n)))>>>0, ((hi<<n)|(lo>>>(32-n)))>>>0];
    n -= 32;
    return [((hi<<n)|(lo>>>(32-n)))>>>0, ((lo<<n)|(hi>>>(32-n)))>>>0];
  }
  var PI_POS = [10,7,11,17,18,3,5,16,8,21,24,4,15,23,19,13,12,2,20,14,22,9,6,1];
  var PI_ROT = [1,3,6,10,15,21,28,36,45,55,2,14,27,41,56,8,25,43,62,18,39,61,20,44];

  function keccakF(s) {
    var r, xi, yi, i2, tt, dlo, dhi, last, nxt, rot, C;
    var BC = new Array(5);
    for (r = 0; r < 24; r++) {
      // θ
      for (xi = 0; xi < 5; xi++)
        BC[xi] = [s[xi][0]^s[xi+5][0]^s[xi+10][0]^s[xi+15][0]^s[xi+20][0],
                  s[xi][1]^s[xi+5][1]^s[xi+10][1]^s[xi+15][1]^s[xi+20][1]];
      for (xi = 0; xi < 5; xi++) {
        tt  = rotLane64(BC[(xi+1)%5][0], BC[(xi+1)%5][1], 1);
        dlo = BC[(xi+4)%5][0] ^ tt[0];
        dhi = BC[(xi+4)%5][1] ^ tt[1];
        for (yi = 0; yi < 25; yi += 5) { s[yi+xi][0]^=dlo; s[yi+xi][1]^=dhi; }
      }
      // ρ + π
      last = [s[1][0], s[1][1]];
      for (i2 = 0; i2 < 24; i2++) {
        nxt = [s[PI_POS[i2]][0], s[PI_POS[i2]][1]];
        rot = rotLane64(last[0], last[1], PI_ROT[i2]);
        s[PI_POS[i2]][0] = rot[0]; s[PI_POS[i2]][1] = rot[1];
        last = nxt;
      }
      // χ
      for (yi = 0; yi < 25; yi += 5) {
        C = [];
        for (xi = 0; xi < 5; xi++) C.push([s[yi+xi][0], s[yi+xi][1]]);
        for (xi = 0; xi < 5; xi++) {
          s[yi+xi][0] = (C[xi][0] ^ ((~C[(xi+1)%5][0]) & C[(xi+2)%5][0])) >>> 0;
          s[yi+xi][1] = (C[xi][1] ^ ((~C[(xi+1)%5][1]) & C[(xi+2)%5][1])) >>> 0;
        }
      }
      // ι
      s[0][0] ^= KECCAK_RC[r][0]; s[0][1] ^= KECCAK_RC[r][1];
    }
  }

  /* 3 — Absorb */
  var absorbLog = [];
  for (var bi = 0; bi < padded.length; bi += rate) {
    for (var lane = 0; lane < rate/8; lane++) {
      var off = bi + lane*8;
      var lo2 = (padded[off]|(padded[off+1]<<8)|(padded[off+2]<<16)|(padded[off+3]<<24))>>>0;
      var hi2 = (padded[off+4]|(padded[off+5]<<8)|(padded[off+6]<<16)|(padded[off+7]<<24))>>>0;
      state[lane][0] ^= lo2; state[lane][1] ^= hi2;
      if (bi === 0 && lane < 3 && (lo2 || hi2))
        absorbLog.push('lane[' + lane + '] ⊕= ' + laneToHex(lo2, hi2));
    }
    keccakF(state);
  }

  steps.push({
    label:   L==='en' ? 'Absorb: XOR message into state, then keccak-f' : 'Absorber: XOR del mensaje en estado, luego keccak-f',
    preview: absorbLog[0] || 'lane[0] ⊕= …',
    detail:  (absorbLog.length ? absorbLog.join('\n') + '\n...' : '') +
             '\n(17 lanes × 64 bits = 136 bytes XOR\'d per block)\nkeccak-f[1600] applied after each block'
  });

  /* 4 — Keccak-f detail */
  steps.push({
    label:   L==='en' ? 'Keccak-f[1600]: 24 rounds (θ ρ π χ ι)' : 'Keccak-f[1600]: 24 rondas (θ ρ π χ ι)',
    preview: 'θ=col-parity  ρ=rotate  π=permute  χ=nonlin  ι=round-const',
    detail:  [
      'θ (theta):  columna XOR + rotación de difusión',
      'ρ (rho):    rotación de cada lane por offset fijo (tabla PI_ROT)',
      'π (pi):     permutación de posiciones (x,y) → (y, 2x+3y mod 5)',
      'χ (chi):    mezcla no lineal 5-bit S-box aplicada a cada fila',
      'ι (iota):   XOR de constante de ronda RC[r] en lane[0]',
      '',
      '24 rondas total — RC[0]=' + h32(KECCAK_RC[0][0]) + ' … RC[23]=' + h32(KECCAK_RC[23][0]),
      '',
      L==='en'?'Keccak-f is a bijective permutation — no key, no IV':'Keccak-f es una permutación biyectiva — sin clave, sin IV'
    ].join('\n')
  });

  /* 5 — Squeeze */
  var out = '';
  var sqLog = [];
  for (var ln = 0; ln < 4; ln++) {
    var lh = laneToHex(state[ln][0], state[ln][1]);
    sqLog.push('lane[' + ln + '] → ' + lh);
    out += lh;
  }

  steps.push({
    label:   L==='en' ? 'Squeeze: extract 4 lanes → 256 bits' : 'Squeeze: extraer 4 lanes → 256 bits',
    preview: sqLog[0],
    detail:  sqLog.join('\n') + '\n\nSHA3-256 = ' + out
  });

  return { digest: out, steps: steps };
}

// ── HMAC-SHA256 ───────────────────────────────────────────
function hmacCompute(keyBytes, msgBytes) {
  var L = getLang();
  var steps = [];

  /* 1 — Key normalization */
  var k;
  var keyNote = '';
  if (keyBytes.length > 64) {
    var kr = sha256Compute(keyBytes);
    k = hexToBytes(kr.digest);
    keyNote = L==='en' ? '(key > 64 bytes → hashed to 32 bytes first)' : '(clave > 64 bytes → hasheada primero a 32 bytes)';
  } else {
    k = keyBytes.slice();
    keyNote = L==='en' ? '(key ≤ 64 bytes → zero-padded to 64 bytes)' : '(clave ≤ 64 bytes → zero-pad a 64 bytes)';
  }
  while (k.length < 64) k.push(0);

  steps.push({
    label:   L==='en' ? 'Key normalization to 64 bytes' : 'Normalización de clave a 64 bytes',
    preview: 'key[0..7] = ' + toHex(k.slice(0,8)),
    detail:  [
      (L==='en'?'Key input:  ':'Clave input:') + ' ' + toHex(keyBytes),
      (L==='en'?'After norm: ':'Tras norm:  ') + toHex(k.slice(0,16)) + '…',
      keyNote
    ].join('\n')
  });

  /* 2 — ipad */
  var ipad = k.map(function(b){ return b ^ 0x36; });
  steps.push({
    label:   'ipad = key ⊕ 0x36  (64 bytes)',
    preview: 'ipad[0..7] = ' + toHex(ipad.slice(0,8)),
    detail:  'key[0..7]  = ' + toHex(k.slice(0,8)) + '\n' +
             '       ⊕ 36 36 36 36 36 36 36 36\n' +
             'ipad[0..7] = ' + toHex(ipad.slice(0,8)) + '\n' +
             '...(64 bytes total)'
  });

  /* 3 — opad */
  var opad = k.map(function(b){ return b ^ 0x5c; });
  steps.push({
    label:   'opad = key ⊕ 0x5c  (64 bytes)',
    preview: 'opad[0..7] = ' + toHex(opad.slice(0,8)),
    detail:  'key[0..7]  = ' + toHex(k.slice(0,8)) + '\n' +
             '       ⊕ 5c 5c 5c 5c 5c 5c 5c 5c\n' +
             'opad[0..7] = ' + toHex(opad.slice(0,8)) + '\n' +
             '...(64 bytes total)'
  });

  /* 4 — Inner hash */
  var innerResult = sha256Compute(ipad.concat(msgBytes));
  steps.push({
    label:   L==='en' ? 'Inner hash = SHA-256(ipad ‖ message)' : 'Hash interno = SHA-256(ipad ‖ mensaje)',
    preview: 'inner = ' + innerResult.digest.slice(0,16) + '…',
    detail:  'inner = SHA-256(\n  ipad (64 bytes)\n  ‖ message (' + msgBytes.length + ' bytes)\n)\n\ninner = ' + innerResult.digest
  });

  /* 5 — Outer hash */
  var outerResult = sha256Compute(opad.concat(hexToBytes(innerResult.digest)));
  var digest = outerResult.digest;
  steps.push({
    label:   L==='en' ? 'HMAC = SHA-256(opad ‖ inner)' : 'HMAC = SHA-256(opad ‖ inner)',
    preview: 'HMAC = ' + digest.slice(0,16) + '…',
    detail:  'HMAC = SHA-256(\n  opad (64 bytes)\n  ‖ inner (32 bytes)\n)\n\nHMAC-SHA256 = ' + digest
  });

  return { digest: digest, steps: steps };
}

// ═══════════════════════════════════════════════════════════
//  GUÍA — 8 temas bilingüe
// ═══════════════════════════════════════════════════════════
var HASH_GUIDE = [
  {
    title: { es: '¿Qué es una función hash?', en: 'What is a hash function?' },
    content: {
      es: 'Una función hash toma una entrada de longitud arbitraria y produce una salida de longitud fija llamada <strong>digest</strong>. Es <em>determinista</em>: la misma entrada siempre produce el mismo hash. Es <em>unidireccional</em>: no es posible obtener la entrada a partir del digest.',
      en: 'A hash function takes an input of arbitrary length and produces a fixed-length output called a <strong>digest</strong>. It is <em>deterministic</em>: the same input always produces the same hash. It is <em>one-way</em>: it is not feasible to recover the input from the digest.'
    }
  },
  {
    title: { es: 'Propiedades de seguridad', en: 'Security properties' },
    content: {
      es: '<strong>Resistencia a preimagen:</strong> dado H no es posible encontrar M tal que hash(M)=H.<br><strong>Resistencia a segunda preimagen:</strong> dado M₁ no es posible encontrar M₂≠M₁ con el mismo hash.<br><strong>Resistencia a colisiones:</strong> no es posible encontrar ningún par M₁≠M₂ con el mismo hash.<br><strong>Efecto avalancha:</strong> 1 bit de diferencia en la entrada cambia ~50% del digest.',
      en: '<strong>Preimage resistance:</strong> given H it is not feasible to find M such that hash(M)=H.<br><strong>Second preimage resistance:</strong> given M₁ it is not feasible to find M₂≠M₁ with the same hash.<br><strong>Collision resistance:</strong> it is not feasible to find any pair M₁≠M₂ with the same hash.<br><strong>Avalanche effect:</strong> a 1-bit input change flips ~50% of the digest bits.'
    }
  },
  {
    title: { es: 'MD5 — Merkle-Damgård (roto)', en: 'MD5 — Merkle-Damgård (broken)' },
    content: {
      es: 'MD5 produce un digest de <strong>128 bits</strong> (32 hex). Divide el mensaje en bloques de 512 bits y aplica 4 rondas de 16 operaciones sobre un estado de cuatro palabras de 32 bits (A, B, C, D). <strong>Criptográficamente roto</strong>: colisiones encontrables en segundos en hardware convencional. No usar para seguridad. Aún aparece en logs de malware y como identificador en bases de TI.',
      en: 'MD5 produces a <strong>128-bit</strong> digest (32 hex chars). Splits the message into 512-bit blocks and applies 4 rounds of 16 operations on a state of four 32-bit words (A, B, C, D). <strong>Cryptographically broken</strong>: collisions findable in seconds on commodity hardware. Do not use for security. Still appears in malware logs and IT asset databases.'
    }
  },
  {
    title: { es: 'SHA-1 — obsoleto', en: 'SHA-1 — obsolete' },
    content: {
      es: 'SHA-1 produce un digest de <strong>160 bits</strong> (40 hex). Merkle-Damgård con bloques de 512 bits, 80 rondas, estado de 5 palabras de 32 bits. <strong>Colisiones demostradas</strong> (SHAttered, 2017). Prohibido para firmas digitales (NIST SP 800-131A). Todavía aparece en Git (migración a SHA-256 en curso), certificados legacy y algunos protocolos IoT. Su presencia en TLS es indicador de configuración débil.',
      en: 'SHA-1 produces a <strong>160-bit</strong> digest (40 hex chars). Merkle-Damgård with 512-bit blocks, 80 rounds, five 32-bit state words. <strong>Collisions demonstrated</strong> (SHAttered, 2017). Prohibited for digital signatures (NIST SP 800-131A). Still appears in Git (SHA-256 migration in progress), legacy certificates, and some IoT protocols. Its presence in TLS is an indicator of weak configuration.'
    }
  },
  {
    title: { es: 'SHA-256 — estándar actual', en: 'SHA-256 — current standard' },
    content: {
      es: 'SHA-256 produce un digest de <strong>256 bits</strong> (64 hex). Familia SHA-2, Merkle-Damgård con bloques de 512 bits, 64 rondas, ocho palabras de 32 bits. Constantes derivadas de raíces cuadradas y cúbicas de primos. <strong>Actualmente seguro</strong>. Usado en TLS 1.3, firmas X.509, Bitcoin, HMAC, cadena de custodia DFIR e IOCs de malware.',
      en: 'SHA-256 produces a <strong>256-bit</strong> digest (64 hex chars). SHA-2 family, Merkle-Damgård with 512-bit blocks, 64 rounds, eight 32-bit state words. Constants from square and cube roots of primes. <strong>Currently secure</strong>. Used in TLS 1.3, X.509 signatures, Bitcoin, HMAC, DFIR chain of custody, and malware IOCs.'
    }
  },
  {
    title: { es: 'SHA-3 / Keccak — esponja', en: 'SHA-3 / Keccak — sponge' },
    content: {
      es: 'SHA-3 usa una <strong>construcción esponja</strong>. Opera sobre un estado de 1600 bits (5×5 de lanes 64-bit). Fase <em>absorb</em>: XOR del mensaje en los primeros 136 bytes del estado + permutación Keccak-f. Fase <em>squeeze</em>: extrae 256 bits de los primeros 4 lanes. Ventaja clave: <strong>resistente a length-extension attacks</strong> (SHA-2 no lo es sin HMAC).',
      en: 'SHA-3 uses a <strong>sponge construction</strong>. Operates on a 1600-bit state (5×5 matrix of 64-bit lanes). <em>Absorb</em> phase: XOR message into the first 136 bytes of state + Keccak-f permutation. <em>Squeeze</em> phase: extract 256 bits from the first 4 lanes. Key advantage: <strong>resistant to length-extension attacks</strong> (SHA-2 is not without HMAC).'
    }
  },
  {
    title: { es: 'HMAC — autenticación con hash', en: 'HMAC — hash-based authentication' },
    content: {
      es: '<strong>HMAC(K,M) = H((K⊕opad) ‖ H((K⊕ipad) ‖ M))</strong>. Combina una clave secreta con la función hash para producir un <strong>MAC</strong>. Autentica origen e integridad. Usado en JWT (HS256), TLS 1.2 PRF, IPsec, TOTP/HOTP, SSH. En TLS 1.3 fue reemplazado por HKDF para derivación de claves.',
      en: '<strong>HMAC(K,M) = H((K⊕opad) ‖ H((K⊕ipad) ‖ M))</strong>. Combines a secret key with a hash function to produce a <strong>MAC</strong>. Authenticates both origin and integrity. Used in JWT (HS256), TLS 1.2 PRF, IPsec, TOTP/HOTP, SSH. In TLS 1.3 it was replaced by HKDF for key derivation.'
    }
  },
  {
    title: { es: 'Hashing en ciberseguridad operativa', en: 'Hashing in operational cybersecurity' },
    content: {
      es: '<strong>Threat Intel:</strong> IOCs de malware son hashes MD5/SHA-1/SHA-256 de archivos maliciosos.<br><strong>DFIR:</strong> integridad de evidencia con SHA-256 (cadena de custodia digital).<br><strong>SOC/SIEM:</strong> detección de archivos por hash en reglas Sigma/Suricata y EDR.<br><strong>TLS:</strong> la cipher suite incluye el algoritmo hash (ej. TLS_AES_256_GCM_<strong>SHA384</strong>).<br><strong>Passwords:</strong> bcrypt/Argon2 son KDFs basados en hash con cost factor — nunca MD5/SHA-256 sin salt+KDF.',
      en: '<strong>Threat Intel:</strong> malware IOCs are MD5/SHA-1/SHA-256 hashes of malicious files.<br><strong>DFIR:</strong> evidence integrity via SHA-256 (digital chain of custody).<br><strong>SOC/SIEM:</strong> file detection by hash in Sigma/Suricata rules and EDR.<br><strong>TLS:</strong> cipher suite includes the hash algorithm (e.g. TLS_AES_256_GCM_<strong>SHA384</strong>).<br><strong>Passwords:</strong> bcrypt/Argon2 are hash-based KDFs with cost factor — never MD5/SHA-256 without salt+KDF.'
    }
  }
];

// ═══════════════════════════════════════════════════════════
//  UI STATE
// ═══════════════════════════════════════════════════════════
var uiState = { algo: 'sha256', guideIdx: 0 };

// ═══════════════════════════════════════════════════════════
//  RENDERING
// ═══════════════════════════════════════════════════════════

/* Renders {label, preview, detail}[] as <details>/<summary> accordion */
function renderSteps(steps) {
  var el = document.getElementById('hash-steps');
  if (!el) return;
  if (!steps || !steps.length) {
    el.innerHTML = '<p style="color:var(--muted);font-size:.85rem;font-style:italic">Sin pasos disponibles.</p>';
    return;
  }
  el.innerHTML = '';
  steps.forEach(function(s, i) {
    var det = document.createElement('details');
    det.className = 'step-detail';

    var sum = document.createElement('summary');
    var badge = document.createElement('span');
    badge.className = 'step-badge';
    badge.textContent = String(i + 1);

    var lbl = document.createElement('span');
    lbl.className = 'step-lbl';
    lbl.textContent = s.label;

    var prev = document.createElement('span');
    prev.className = 'step-prev';
    prev.textContent = s.preview || '';

    sum.appendChild(badge);
    sum.appendChild(lbl);
    sum.appendChild(prev);
    det.appendChild(sum);

    var body = document.createElement('div');
    body.className = 'step-body';
    var pre = document.createElement('pre');
    pre.textContent = s.detail || '';
    body.appendChild(pre);
    det.appendChild(body);

    el.appendChild(det);
  });
}

function renderGuide() {
  var list = document.getElementById('hash-guide-list');
  if (!list) return;
  list.innerHTML = '';
  HASH_GUIDE.forEach(function(s, i) {
    var li = document.createElement('li');
    li.className = 'guide-item' + (i === uiState.guideIdx ? ' active' : '');
    li.innerHTML = '<span class="guide-num">' + (i+1) + '</span>' +
                   '<span>' + escHtml(pickLang(s.title)) + '</span>';
    li.addEventListener('click', function() {
      uiState.guideIdx = i;
      renderGuide();
      renderGuideContent();
    });
    list.appendChild(li);
  });
}

function renderGuideContent() {
  var s     = HASH_GUIDE[uiState.guideIdx];
  var title = document.getElementById('hash-guide-title');
  var body  = document.getElementById('hash-guide-body');
  var prog  = document.getElementById('hash-guide-prog');
  if (title) title.textContent = pickLang(s.title);
  if (body)  body.innerHTML    = pickLang(s.content);
  if (prog)  prog.textContent  = (uiState.guideIdx + 1) + ' / ' + HASH_GUIDE.length;
}

function computeHash() {
  var inputEl  = document.getElementById('hash-input');
  var keyEl    = document.getElementById('hmac-key');
  var outputEl = document.getElementById('hash-output');
  var lengthEl = document.getElementById('hash-length');
  if (!inputEl || !outputEl) return;

  var msg  = strToBytes(inputEl.value || '');
  var algo = uiState.algo;
  var result;

  try {
    if (algo === 'md5') {
      result = md5Compute(msg);
    } else if (algo === 'sha3') {
      result = sha3Compute(msg);
    } else if (algo === 'hmac') {
      var key = strToBytes((keyEl ? keyEl.value : '') || 'secret');
      result = hmacCompute(key, msg);
    } else {
      result = sha256Compute(msg);
    }
  } catch(err) {
    outputEl.textContent = 'Error: ' + err.message;
    return;
  }

  outputEl.textContent = result.digest;
  if (lengthEl) {
    var bits = result.digest.length * 4;
    lengthEl.textContent = bits + ' bits / ' + (bits/8) + ' bytes';
  }
  renderSteps(result.steps);
}

// Avalanche — SHA-256 nibble comparison
function computeAvalanche() {
  var t1 = document.getElementById('av-text1');
  var t2 = document.getElementById('av-text2');
  var h1 = document.getElementById('av-hash1');
  var h2 = document.getElementById('av-hash2');
  var diffEl = document.getElementById('av-diff');
  if (!t1 || !t2) return;

  var d1 = sha256Compute(strToBytes(t1.value || '')).digest;
  var d2 = sha256Compute(strToBytes(t2.value || '')).digest;

  var diffBits = 0;
  var html1 = '', html2 = '';

  for (var i = 0; i < 64; i++) {
    var n1 = parseInt(d1[i], 16);
    var n2 = parseInt(d2[i], 16);
    var xr = n1 ^ n2;
    // count bits in nibble xor
    diffBits += [0,1,1,2,1,2,2,3,1,2,2,3,2,3,3,4][xr & 0xf];
    var changed = xr !== 0;
    var cls1 = changed ? 'av-diff' : 'av-same';
    var cls2 = changed ? 'av-diff' : 'av-same';
    html1 += '<span class="av-nibble ' + cls1 + '">' + d1[i] + '</span>';
    html2 += '<span class="av-nibble ' + cls2 + '">' + d2[i] + '</span>';
  }

  if (h1) h1.innerHTML = html1;
  if (h2) h2.innerHTML = html2;

  if (diffEl) {
    var L = getLang();
    var pct = ((diffBits / 256) * 100).toFixed(1);
    diffEl.textContent = diffBits + ' / 256 ' + (L==='en' ? 'bits changed (' : 'bits cambiados (') + pct + '%)';
  }
}

// ── Language ─────────────────────────────────────────────
function applyLanguage() {
  var L = getLang();
  hashTc(document.getElementById('hero-eyebrow'),    'Hash Functions — Integrity Lab');
  hashTc(document.getElementById('hero-title'),      'Hash Visualizer');
  hashTc(document.getElementById('hero-copy'),
    'MD5 · SHA-256 · SHA-3 · HMAC — compute, visualize every step, understand their role in SOC and DFIR.');
  hashTc(document.getElementById('tab-btn-guia'),    'Guide');
  hashTc(document.getElementById('tab-btn-comparar'),'Avalanche');
  hashTc(document.getElementById('lbl-calc'),        'Compute hash');
  hashTc(document.getElementById('lbl-algo'),        'Algorithm');
  hashTc(document.getElementById('lbl-key'),         'HMAC key');
  hashTc(document.getElementById('lbl-input'),       'Message');
  hashTc(document.getElementById('btn-hash'),        'Compute hash');
  hashTc(document.getElementById('lbl-output'),      'Result');
  hashTc(document.getElementById('lbl-length'),      'Length:');
  hashTc(document.getElementById('lbl-steps'),       'Internal steps');
  hashTc(document.getElementById('lbl-temas'),       'Topics');
  hashTc(document.getElementById('lbl-av-title'),    'Avalanche Effect — SHA-256');
  hashTc(document.getElementById('lbl-av-desc'),
    'Change 1 character between A and B and see how many bits of the digest change. A secure hash changes ~50% of bits on any minimal difference.');
  hashTc(document.getElementById('lbl-av1'),         'Text A');
  hashTc(document.getElementById('lbl-av2'),         'Text B (+1 bit)');
  hashTc(document.getElementById('lbl-hash-a'),      'SHA-256(A):');
  hashTc(document.getElementById('lbl-hash-b'),      'SHA-256(B):');
  hashTc(document.getElementById('lbl-av-diff'),     'Different bits:');
  hashTc(document.getElementById('btn-av'),          'Compare');
  hashTc(document.getElementById('lbl-av-legend'),   'Red nibbles = changed · grey = identical');
  renderGuide();
  renderGuideContent();
  computeHash();
  computeAvalanche();
}

// ═══════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {

  /* algo selector */
  var algoSel  = document.getElementById('algo-select');
  var keyGroup = document.getElementById('hmac-key-group');
  if (algoSel) {
    algoSel.addEventListener('change', function() {
      uiState.algo = algoSel.value;
      if (keyGroup) keyGroup.style.display = uiState.algo === 'hmac' ? 'flex' : 'none';
      computeHash();
    });
  }

  /* button + live */
  var btnHash  = document.getElementById('btn-hash');
  var hashInp  = document.getElementById('hash-input');
  var keyInp   = document.getElementById('hmac-key');
  if (btnHash)  btnHash.addEventListener('click',  computeHash);
  if (hashInp)  hashInp.addEventListener('input',  computeHash);
  if (keyInp)   keyInp.addEventListener('input',   computeHash);

  /* avalanche */
  var btnAv = document.getElementById('btn-av');
  if (btnAv) btnAv.addEventListener('click', computeAvalanche);
  ['av-text1','av-text2'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', computeAvalanche);
  });

  /* guide nav */
  var prev = document.getElementById('hash-guide-prev');
  var next = document.getElementById('hash-guide-next');
  if (prev) prev.addEventListener('click', function() {
    if (uiState.guideIdx > 0) { uiState.guideIdx--; renderGuide(); renderGuideContent(); }
  });
  if (next) next.addEventListener('click', function() {
    if (uiState.guideIdx < HASH_GUIDE.length - 1) { uiState.guideIdx++; renderGuide(); renderGuideContent(); }
  });

  /* initial render */
  renderGuide();
  renderGuideContent();
  computeHash();
  computeAvalanche();

  if (getLang() !== 'es') applyLanguage();
  window.addEventListener('langchange', applyLanguage);
});
