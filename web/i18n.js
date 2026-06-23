/* i18n.js ─ Shared bilingual engine (ES / EN)
 * Manages language state via localStorage('site-lang').
 * Injects or finds #langSelect on every page.
 * Applies EN translations to static pages (index, teoria, recursos).
 * Fires CustomEvent('langchange') so app.js files can update dynamic content.
 */
(function () {
  'use strict';

  /* ── State ─────────────────────────────────────────────────────────────── */
  var LANG = (function () {
    try { return localStorage.getItem('site-lang') || 'es'; } catch (e) { return 'es'; }
  }());
  window.SITE_LANG = LANG;

  /* ── Helpers ───────────────────────────────────────────────────────────── */
  function q(sel, ctx)  { return (ctx || document).querySelector(sel); }
  function qa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* Apply innerHTML (EN) or restore original ES.
   * The original is captured from the live DOM on first call
   * (the HTML source is always ES, so even starting in EN we capture ES). */
  function tx(el, enHtml) {
    if (!el) return;
    if (el._i18nOrig === undefined) el._i18nOrig = el.innerHTML;
    el.innerHTML = (LANG === 'en') ? enHtml : el._i18nOrig;
  }
  /* Same for textContent only. */
  function tc(el, enText) {
    if (!el) return;
    if (el._i18nOrig === undefined) el._i18nOrig = el.textContent;
    el.textContent = (LANG === 'en') ? enText : el._i18nOrig;
  }

  /* ── Language application ──────────────────────────────────────────────── */
  function applyLang(lang) {
    LANG = lang;
    window.SITE_LANG = lang;
    try { localStorage.setItem('site-lang', lang); } catch (e) {}
    document.documentElement.lang = lang === 'en' ? 'en' : 'es';

    /* Sync all selects */
    qa('[id="langSelect"]').forEach(function (s) { s.value = lang; });

    /* section-back links */
    qa('.section-back').forEach(function (el) {
      tc(el, lang === 'en' ? '← Home' : null);
    });

    /* Page-specific */
    var page = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
    var fn = PAGES[page];
    if (fn) fn();

    /* data-i18n elements */
    var I18N_MAP = {
      es: { language: 'IDIOMA', variant: 'ALGORITMO', theme: 'TEMA VISUAL' },
      en: { language: 'LANGUAGE', variant: 'ALGORITHM', theme: 'VISUAL THEME' }
    };
    var map = I18N_MAP[lang] || I18N_MAP['es'];
    qa('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (map[key]) tc(el, lang === 'en' ? map[key] : null);
    });

    /* Sync lang pill buttons */
    qa('[data-lang-pill]').forEach(function (btn) {
      btn.setAttribute('aria-selected', String(btn.getAttribute('data-lang-pill') === lang));
    });

    /* Notify app.js listeners */
    window.dispatchEvent(new CustomEvent('langchange', { detail: { lang: lang } }));
  }

  /* ── LangSelect injection ──────────────────────────────────────────────── */
  function initSelect() {
    var existing = document.getElementById('langSelect');
    if (existing) {
      existing.value = LANG;
      existing.addEventListener('change', function (e) { applyLang(e.target.value); });
      return;
    }
    /* Si la página ya tiene pills de idioma (hero-controls), no inyectar el select */
    if (document.querySelector('[data-lang-pill]')) return;
    /* Inject into .hero > div or .hero */
    var target = q('.hero > div') || q('.hero');
    if (!target) return;
    var wrap = document.createElement('div');
    wrap.className = 'hero-tools i18n-injected';
    wrap.innerHTML =
      '<label class="lang-switch" style="display:flex;align-items:center;gap:.5rem">' +
      '<span style="font-size:.75rem;color:var(--muted,#888);letter-spacing:.05em">Idioma / Language</span>' +
      '<select id="langSelect" style="background:var(--card,#1a1a2e);color:var(--text,#e2e8f0);' +
        'border:1px solid var(--line,#2d3748);border-radius:6px;padding:4px 10px;font-size:.8rem;cursor:pointer">' +
      '<option value="es">Español</option>' +
      '<option value="en">English</option>' +
      '</select></label>';
    target.appendChild(wrap);
    var sel = document.getElementById('langSelect');
    sel.value = LANG;
    sel.addEventListener('change', function (e) { applyLang(e.target.value); });
  }

  /* ══════════════════════════════════════════════════════════════════════════
   * PAGE APPLIERS
   * ══════════════════════════════════════════════════════════════════════════ */
  var PAGES = {};

  /* ── INDEX ────────────────────────────────────────────────────────────── */
  PAGES['index'] = function () {
    /* AES section */
    tc(q('.hero h1'),           'AES Visualizer');
    tx(q('.hero > div > p:not(.hero-badge):not(.eyebrow)') || q('.hero .hero-copy') || q('.hero p'),
      'Educational lab to understand AES encryption from the inside — every transformation, every round, every byte.');
    tc(qa('.accesos-label')[0], 'Access · AES');
    tc(q('[href="aes-demo.html"] .card-desc'),    'Visualize and run AES step by step');
    tc(q('[href="aes-teoria.html"] .card-label'), 'AES Theory');
    tc(q('[href="aes-teoria.html"] .card-desc'),  'Slides: SubBytes, ShiftRows, MixColumns and more');
    tc(q('[href="aes-recursos.html"] .card-label'), 'AES Resources');
    tc(q('[href="aes-recursos.html"] .card-desc'),  'FIPS 197, NIST test vectors, readings and tools');
    tc(q('[href="aes-acerca.html"] .card-desc'),    'About the AES Visualizer project');

    /* ASCON section */
    tc(qa('.accesos-label')[1], 'Access · ASCON-128a');
    tc(q('[href="ascon-demo.html"] .card-label'), 'ASCON Demo Lab');
    tc(q('[href="ascon-demo.html"] .card-desc'),  'AEAD authenticated encryption, step by step');
    tc(q('[href="ascon-teoria.html"] .card-label'), 'ASCON Theory');
    tc(q('[href="ascon-teoria.html"] .card-desc'),  'State, permutations, S-box and AEAD phases');
    tc(q('[href="ascon-recursos.html"] .card-label'), 'ASCON Resources');
    tc(q('[href="ascon-recursos.html"] .card-desc'),  'Specification, NIST, CAESAR competition and tools');
    tc(q('[href="ascon-acerca.html"] .card-desc'),    'About the ASCON-128a Visualizer project');

    /* ChaCha20 section */
    tc(qa('.accesos-label')[2], 'Access · ChaCha20-Poly1305');
    tc(q('[href="chacha20-demo.html"] .card-label'), 'ChaCha20 Demo Lab');
    tc(q('[href="chacha20-demo.html"] .card-desc'),  'ARX stream cipher — quarter-rounds and keystream, step by step');
    tc(q('[href="chacha20-teoria.html"] .card-label'), 'ChaCha20 Theory');
    tc(q('[href="chacha20-teoria.html"] .card-desc'),  '4×4 state, QR, column/diagonal rounds, Poly1305 and AEAD');
    tc(q('[href="chacha20-recursos.html"] .card-label'), 'ChaCha20 Resources');
    tc(q('[href="chacha20-recursos.html"] .card-desc'),  'RFC 8439, TLS 1.3, WireGuard, Signal and tools');
    tc(q('[href="chacha20-acerca.html"] .card-desc'),    'About the ChaCha20-Poly1305 Visualizer project');

    /* Modals */
    var mAES = q('#modal-aes .prose, #modal-aes .modal-body');
    if (mAES) tx(mAES,
      '<p>AES (Advanced Encryption Standard) is the most widely deployed symmetric block cipher.' +
      ' Standardized by NIST (FIPS 197, 2001) after a public competition. Adopted in SSL/TLS,' +
      ' WPA2/WPA3, BitLocker, payment systems and virtually every security protocol.</p>' +
      '<p>This visualizer lets you observe each internal transformation: SubBytes, ShiftRows,' +
      ' MixColumns and AddRoundKey, as well as the key schedule that generates round subkeys.</p>');

    var mASCON = q('#modal-ascon .prose, #modal-ascon .modal-body');
    if (mASCON) tx(mASCON,
      '<p>ASCON-128a is an authenticated encryption (AEAD) algorithm. Winner of the CAESAR' +
      ' competition (2019) and selected in the NIST Lightweight Cryptography standardization' +
      ' process. Designed for constrained environments: IoT, sensors, embedded systems.</p>' +
      '<p>This visualizer shows the 4 algorithm phases: initialization, AD absorption,' +
      ' encryption and finalization, with the complete 320-bit internal state at every step.</p>');

    var mCC20 = q('#modal-chacha .prose, #modal-chacha .modal-body');
    if (mCC20) tx(mCC20,
      '<p>ChaCha20-Poly1305 (RFC 8439) is the main alternative to AES-GCM in modern protocols.' +
      ' It uses only ARX operations (Add, Rotate, XOR), has no lookup tables and is resistant' +
      ' to timing attacks. Used in TLS 1.3, WireGuard, Signal and OpenSSH.</p>' +
      '<p>This visualizer animates the 4×4 word state, the quarter-round, 10 double-rounds' +
      ' (column + diagonal), keystream generation and the Poly1305 MAC.</p>');
  };

  /* ── AES TEORIA ───────────────────────────────────────────────────────── */
  function aesSlide(n, title, textHtml, pointsHtml) {
    var s = document.getElementById('slide-' + n);
    if (!s) return;
    tc(s.querySelector('h2'), title);
    var st = s.querySelector('.slide-text');
    var kp = s.querySelector('.key-points');
    if (st && textHtml)   tx(st, textHtml);
    if (kp && pointsHtml) tx(kp, pointsHtml);
  }

  PAGES['aes-teoria'] = function () {
    aesSlide(1, 'What is AES?',
      '<p>AES (Advanced Encryption Standard) is the most widely used symmetric block cipher in the' +
      ' world. Selected by NIST in 2001 after a public 5-year competition, adopting the Rijndael cipher' +
      ' designed by Joan Daemen and Vincent Rijmen.</p>' +
      '<p>It operates on fixed blocks of <strong>128 bits (16 bytes)</strong>. Keys may be' +
      ' 128, 192 or 256 bits, determining the number of rounds: 10, 12 or 14 respectively.</p>',
      '<div class="key-point"><span class="key-point-icon">🔒</span>' +
      '<span><strong>Symmetric cipher:</strong> the same key encrypts and decrypts.' +
      ' Secure key exchange is the protocol’s responsibility (e.g. TLS, Signal).</span></div>' +
      '<div class="key-point"><span class="key-point-icon">📏</span>' +
      '<span><strong>Block size always 128 bits.</strong> For longer data, a mode of operation' +
      ' (CBC, CTR, GCM…) is required. ECB mode (no IV) is insecure for real-world use.</span></div>' +
      '<div class="key-point"><span class="key-point-icon">🌍</span>' +
      '<span><strong>Globally adopted:</strong> SSL/TLS, WiFi (WPA2/WPA3), disk encryption,' +
      ' VPNs, payment systems… AES hardware acceleration is built into every modern CPU.</span></div>'
    );
    aesSlide(2, 'The State Matrix',
      '<p>AES works on a <strong>4×4 byte matrix</strong> called the <em>state</em>.' +
      ' The 16 bytes of the input block are loaded column by column: first byte at (row 0, col 0),' +
      ' second at (row 1, col 0), and so on.</p>' +
      '<p>Each round transforms this matrix by applying four operations in sequence.' +
      ' After all rounds, the matrix is serialised column by column to produce the ciphertext.</p>',
      '<div class="key-point"><span class="key-point-icon">📊</span>' +
      '<span><strong>4 rows × 4 columns = 16 bytes = 128 bits.</strong> It is the fundamental' +
      ' work unit of the entire algorithm. Notation: s[row][col].</span></div>' +
      '<div class="key-point"><span class="key-point-icon">↕️</span>' +
      '<span><strong>Column-major ordering</strong> (not row-major) is crucial: ShiftRows and' +
      ' MixColumns both depend on this orientation and would behave differently otherwise.</span></div>'
    );
    aesSlide(3, 'SubBytes — Nonlinear Substitution',
      '<p>SubBytes replaces each byte of the state using the <strong>S-box</strong>, a precomputed' +
      ' 256-entry lookup table. For a given byte <code>b</code>, the result is <code>SBOX[b]</code>.</p>' +
      '<p>Mathematically, the S-box combines two operations in GF(2<sup>8</sup>): first computes the' +
      ' <strong>multiplicative inverse</strong>, then applies an <strong>affine transformation</strong>.' +
      ' This introduces nonlinearity — making AES resistant to algebraic and differential attacks.</p>',
      '<div class="key-point"><span class="key-point-icon">🔀</span>' +
      '<span><strong>Nonlinearity:</strong> SubBytes cannot be described as a linear function.' +
      ' This breaks the possibility of direct algebraic attacks on the cipher.</span></div>' +
      '<div class="key-point"><span class="key-point-icon">🛡️</span>' +
      '<span><strong>Confusion</strong> (Shannon): each output bit depends on many input bits.' +
      ' The S-box was designed to maximise this property against differential and linear cryptanalysis.</span></div>' +
      '<div class="key-point"><span class="key-point-icon">↔️</span>' +
      '<span><strong>InvSubBytes:</strong> an inverse S-box reverses the transformation during' +
      ' decryption, applied to each byte in exactly the same positions.</span></div>'
    );
    aesSlide(4, 'ShiftRows — Row Rotation',
      '<p>ShiftRows cyclically shifts each row of the state matrix <strong>left</strong> by a fixed' +
      ' amount: row 0 unchanged, row 1 by 1, row 2 by 2, row 3 by 3.</p>' +
      '<p>Its role is <strong>diffusion</strong>: bytes are spread across different columns. Without' +
      ' ShiftRows, each column would be processed independently and AES would be vulnerable to' +
      ' column-wise attacks.</p>',
      '<div class="key-point"><span class="key-point-icon">↔️</span>' +
      '<span>After ShiftRows, each column contains bytes from all 4 original rows.' +
      ' MixColumns then mixes them — achieving full inter-column diffusion.</span></div>' +
      '<div class="key-point"><span class="key-point-icon">🔁</span>' +
      '<span><strong>InvShiftRows</strong> shifts the same amounts to the <em>right</em> during' +
      ' decryption, restoring the original row order.</span></div>'
    );
    aesSlide(5, 'MixColumns — Diffusion in GF(2⁸)',
      '<p>MixColumns multiplies each column of the state by a fixed 4×4 matrix in the Galois field' +
      ' <strong>GF(2<sup>8</sup>)</strong>, making each output byte depend on all 4 input bytes.</p>' +
      '<p>In GF(2<sup>8</sup>), addition is XOR and multiplication is performed modulo the irreducible' +
      ' polynomial <code>x⁸ + x⁴ + x³ + x + 1</code> (0x11b). Multiplying by 2 is a' +
      ' left shift plus a conditional XOR with 0x1b.</p>',
      '<div class="key-point"><span class="key-point-icon">🌊</span>' +
      '<span><strong>Maximum diffusion:</strong> any input byte affects all output bytes in its column.' +
      ' Combined with ShiftRows, a 1-bit change propagates across the entire state in just 2 rounds.</span></div>' +
      '<div class="key-point"><span class="key-point-icon">⚠️</span>' +
      '<span><strong>Skipped in the final round:</strong> removing MixColumns from round N makes' +
      ' InvMixColumns symmetrically applicable during decryption without changing the key schedule.</span></div>'
    );
    aesSlide(6, 'AddRoundKey — XOR with Subkey',
      '<p>AddRoundKey combines the state matrix with the round subkey using byte-wise XOR.' +
      ' It is the <strong>only AES operation that directly injects key material</strong>.</p>' +
      '<p>Without AddRoundKey, AES would be a public permutation. Without the other three operations,' +
      ' it would be trivially attackable. Security emerges from their combination.</p>',
      '<div class="key-point"><span class="key-point-icon">🔑</span>' +
      '<span><strong>Applied N+1 times:</strong> before round 1 (initial whitening) and after each' +
      ' round. For AES-128, 11 applications total (one per round key, indices 0–10).</span></div>' +
      '<div class="key-point"><span class="key-point-icon">⚡</span>' +
      '<span><strong>XOR is extremely fast</strong> in both hardware and software — a single' +
      ' instruction on any CPU or a few gates in FPGA/ASIC. This keeps AES efficient everywhere.</span></div>'
    );
    aesSlide(7, 'Key Schedule',
      '<p>From the original key, AES generates N+1 round subkeys (one per round plus the initial' +
      ' whitening key), each 128 bits. For AES-128: 11 subkeys from 4 32-bit words (16 bytes).</p>' +
      '<p>The process is iterative: each new word is derived by XOR-ing the previous word with the' +
      ' one N<sub>k</sub> positions back. At every N<sub>k</sub>-th index, RotWord + SubWord + Rcon' +
      ' is applied first.</p>',
      '<div class="key-point"><span class="key-point-icon">🔄</span>' +
      '<span><strong>RotWord:</strong> rotates the 4 bytes of a word one position left:' +
      ' [a,b,c,d] → [b,c,d,a].</span></div>' +
      '<div class="key-point"><span class="key-point-icon">🔀</span>' +
      '<span><strong>SubWord:</strong> applies the S-box to each of the 4 bytes — the same' +
      ' nonlinear operation as SubBytes but acting on a single 4-byte word.</span></div>' +
      '<div class="key-point"><span class="key-point-icon">📌</span>' +
      '<span><strong>Rcon:</strong> round constants derived from powers of 2 in GF(2<sup>8</sup>).' +
      ' They ensure each round subkey is unique even from similar-looking keys.</span></div>'
    );
    aesSlide(8, 'Complete AES Structure',
      '<p>With all pieces in place, AES-128 runs as follows: an initial AddRoundKey, followed by' +
      ' 9 full rounds (SubBytes → ShiftRows → MixColumns → AddRoundKey) and a final' +
      ' round without MixColumns.</p>',
      '<div class="key-point"><span class="key-point-icon">🌊</span>' +
      '<span><strong>Avalanche effect:</strong> after ~2 rounds, a 1-bit change in plaintext or key' +
      ' affects ~50 % of ciphertext bits. After all 10 rounds the change is statistically' +
      ' indistinguishable from random noise.</span></div>' +
      '<div class="key-point"><span class="key-point-icon">🖥️</span>' +
      '<span>Observe the avalanche live in the <strong>Demo Lab</strong>: run two encryptions with' +
      ' keys that differ by a single bit and compare the results in the Compare tab.</span></div>' +
      '<div class="key-point"><span class="key-point-icon">📚</span>' +
      '<span>For deep reading, see the <strong>Resources</strong> section: FIPS 197 includes test' +
      ' vectors to verify every intermediate step of a correct implementation.</span></div>'
    );
  };

  /* ── ASCON TEORIA ─────────────────────────────────────────────────────── */
  function asconSlide(n, title, pointsHtml) {
    var s = document.getElementById('slide-' + n);
    if (!s) return;
    tc(s.querySelector('h2'), title);
    var kp = s.querySelector('.key-points');
    if (kp && pointsHtml) tx(kp, pointsHtml);
  }

  PAGES['ascon-teoria'] = function () {
    asconSlide(1, 'What is ASCON-128a?',
      '<div class="key-point"><span class="key-point-icon">🔒</span>' +
      '<span><strong>AEAD:</strong> Encrypts the plaintext AND authenticates both the ciphertext and' +
      ' associated data (visible but immutable metadata). One algorithm, two guarantees.</span></div>' +
      '<div class="key-point"><span class="key-point-icon">🏆</span>' +
      '<span><strong>CAESAR 2019 winner:</strong> selected from 57 candidates as the recommended' +
      ' authenticated encryption algorithm for constrained environments (IoT, sensors, embedded systems).</span></div>' +
      '<div class="key-point"><span class="key-point-icon">🏛️</span>' +
      '<span><strong>NIST Lightweight Crypto:</strong> standardization finalist. Designed at IAIK,' +
      ' TU Graz, Austria. Achieves 128-bit security with a 320-bit state.</span></div>' +
      '<div class="key-point"><span class="key-point-icon">⚡</span>' +
      '<span><strong>Efficient sponge permutation:</strong> low latency, low energy. Ideal for' +
      ' microcontrollers and hardware where AES may be too costly.</span></div>'
    );
    asconSlide(2, 'Internal State: 5 × 64 bits',
      '<div class="key-point"><span class="key-point-icon">💻</span>' +
      '<span><strong>Five 64-bit registers x0–x4 = 320 bits total.</strong> Rate = x0||x1' +
      ' (128 bits, absorbs/squeezes data). Capacity = x2||x3||x4 (192 bits, never exposed).</span></div>' +
      '<div class="key-point"><span class="key-point-icon">🔑</span>' +
      '<span><strong>Initialization:</strong> x0 = IV (encodes algorithm parameters), x1||x2 = Key' +
      ' (128 b), x3||x4 = Nonce (128 b). IV = 0x80400c0600000000 for ASCON-128a.</span></div>' +
      '<div class="key-point"><span class="key-point-icon">🛡️</span>' +
      '<span><strong>Capacity is the security margin:</strong> the 192 capacity bits are never' +
      ' directly exposed; this is what makes inverting the sponge computationally infeasible.</span></div>'
    );
    asconSlide(3, '5-bit S-box',
      '<div class="key-point"><span class="key-point-icon">⚡</span>' +
      '<span><strong>No lookup tables:</strong> uses only AND, NOT and XOR — implementable in' +
      ' hardware with few transistors and in software without memory accesses (timing-attack resistant).</span></div>' +
      '<div class="key-point"><span class="key-point-icon">🔢</span>' +
      '<span><strong>Nonlinearity:</strong> AND operations introduce nonlinearity, making it' +
      ' impossible to describe the S-box with linear equations over GF(2).</span></div>' +
      '<div class="key-point"><span class="key-point-icon">🔠</span>' +
      '<span><strong>64 in parallel:</strong> operates bitwise across all 5 registers, applied' +
      ' simultaneously to all 64 bit-positions — massive inherent parallelism.</span></div>'
    );
    asconSlide(4, 'Linear Layer — Diffusion',
      '<div class="key-point"><span class="key-point-icon">💡</span>' +
      '<span><strong>Intra-register diffusion:</strong> each bit of a register influences many' +
      ' other bits of the same register after rotation and XOR.</span></div>' +
      '<div class="key-point"><span class="key-point-icon">🌐</span>' +
      '<span><strong>Inter-register diffusion:</strong> the S-box already creates dependencies' +
      ' between registers; the linear layer amplifies those within each individual register.</span></div>' +
      '<div class="key-point"><span class="key-point-icon">🌊</span>' +
      '<span><strong>Fast full diffusion:</strong> S-box + linear layer together reach full' +
      ' diffusion in just a few rounds — any 1-bit change affects the entire state.</span></div>'
    );
    asconSlide(5, 'Permutations pₐ and pᵇ',
      '<div class="key-point"><span class="key-point-icon">🔁</span>' +
      '<span><strong>ASCON-128 vs. ASCON-128a:</strong> ASCON-128 uses pᵇ (6 rounds) in' +
      ' encryption with 64-bit rate blocks. ASCON-128a uses pₐ (12 rounds) with 128-bit' +
      ' rate blocks — twice the throughput for longer messages.</span></div>' +
      '<div class="key-point"><span class="key-point-icon">📌</span>' +
      '<span><strong>Round constants prevent symmetry:</strong> distinct RC values make each round' +
      ' unique — no fixed points or exploitable symmetry in the permutation.</span></div>'
    );
    asconSlide(6, 'AEAD — Associated Data',
      '<div class="key-point"><span class="key-point-icon">❓</span>' +
      '<span><strong>Why AD?</strong> The receiver can verify that metadata was not altered,' +
      ' without encrypting it (efficient). Examples: network headers, timestamps, device IDs.</span></div>' +
      '<div class="key-point"><span class="key-point-icon">🔀</span>' +
      '<span><strong>Domain separation:</strong> the final XOR (x4 ⊕ 1) ensures the AD phase' +
      ' and encryption phase produce distinct internal states even if the data is identical.</span></div>' +
      '<div class="key-point"><span class="key-point-icon">◻️</span>' +
      '<span><strong>Empty AD:</strong> if there is no AD, domain separation still applies.' +
      ' The state advances directly to the encryption phase.</span></div>'
    );
    asconSlide(7, 'The 4 Algorithm Phases',
      '<div class="key-point"><span class="key-point-icon">📊</span>' +
      '<span><strong>Sequential:</strong> each phase depends on the state produced by the previous' +
      ' one. The four phases cannot be parallelised.</span></div>' +
      '<div class="key-point"><span class="key-point-icon">🔑</span>' +
      '<span><strong>Key at start and end:</strong> the key appears in initialisation and in' +
      ' finalisation — this binds the tag to the key, making forgery impossible without it.</span></div>'
    );
    asconSlide(8, 'Authentication Tag and Security',
      '<div class="key-point"><span class="key-point-icon">⚠️</span>' +
      '<span><strong>Nonce reuse (nonce misuse):</strong> if the same nonce is used twice with the' +
      ' same key, an attacker can XOR the two ciphertexts and recover the plaintext. The nonce' +
      ' MUST be unique per (key, message) pair.</span></div>' +
      '<div class="key-point"><span class="key-point-icon">⏱️</span>' +
      '<span><strong>Constant-time comparison:</strong> always compare tags in constant time (no' +
      ' early exit) to prevent timing attacks that reveal information byte by byte.</span></div>' +
      '<div class="key-point"><span class="key-point-icon">🏭</span>' +
      '<span><strong>Production use:</strong> for real applications, use an audited library' +
      ' (libsodium, Bouncy Castle, etc.). This implementation is for educational purposes.</span></div>'
    );
  };

  /* ── CHACHA20 TEORIA ──────────────────────────────────────────────────── */
  PAGES['chacha20-teoria'] = function () {
    var cards = qa('.slide-card');
    function cc20Slide(idx, title, bodyHtml) {
      var c = cards[idx - 1];
      if (!c) return;
      tc(c.querySelector('h2'), title);
      var b = c.querySelector('.slide-body');
      if (b && bodyHtml) tx(b, bodyHtml);
    }
    cc20Slide(1, 'ChaCha20-Poly1305 — ARX Stream Cipher',
      '<p>ChaCha20-Poly1305 (RFC 8439) is a modern authenticated encryption (AEAD) scheme.' +
      ' ChaCha20 is a <strong>stream cipher</strong>: it generates a pseudorandom keystream that is' +
      ' XOR-ed with the plaintext. Poly1305 is the <strong>MAC</strong> that authenticates the ciphertext.</p>' +
      '<p>Used in <strong>TLS 1.3, WireGuard, Signal, QUIC and OpenSSH</strong> as the primary' +
      ' alternative to AES-GCM. Designed by Daniel J. Bernstein.</p>'
    );
    cc20Slide(2, 'ARX Design — No Lookup Tables',
      '<p>ChaCha20 uses only three operation types: <strong>Add</strong> (32-bit modular),' +
      ' <strong>Rotate</strong> (constant-distance bit rotation) and <strong>XOR</strong>.' +
      ' No S-boxes, no lookup tables.</p>' +
      '<p>This makes ChaCha20 <strong>resistant to cache-timing attacks</strong>: all operations' +
      ' run in constant time regardless of key or message values. Critical in environments without' +
      ' AES hardware acceleration.</p>'
    );
    cc20Slide(3, '4×4 Internal State',
      '<p>The ChaCha20 state is a <strong>4×4 matrix of 32-bit words (512 bits total)</strong>.' +
      ' Layout: row 0 = constants, row 1 = key[0–3], row 2 = key[4–7], row 3 = counter + nonce.</p>' +
      '<ul><li><strong>Constants:</strong> "expa", "nd 3", "2-by", "te k" (little-endian ASCII)' +
      ' = 0x61707865, 0x3320646e, 0x79622d32, 0x6b206574. Known as "nothing up my sleeve" numbers.</li>' +
      '<li><strong>Key:</strong> 256 bits split into 8 32-bit words loaded in little-endian order.</li>' +
      '<li><strong>Counter:</strong> 32-bit block counter. Starts at 1 for encryption (block 0 is' +
      ' reserved for the Poly1305 key).</li>' +
      '<li><strong>Nonce:</strong> 96 bits (3 words). Must be unique per (key, message) pair.</li></ul>'
    );
    cc20Slide(4, 'Quarter Round (QR)',
      '<p>The Quarter Round is ChaCha20’s fundamental operation. It takes 4 words (a, b, c, d)' +
      ' and applies 8 ARX steps:</p>' +
      '<ul><li>a += b; d ^= a; d = rotl32(d,16)</li>' +
      '<li>c += d; b ^= c; b = rotl32(b,12)</li>' +
      '<li>a += b; d ^= a; d = rotl32(d, 8)</li>' +
      '<li>c += d; b ^= c; b = rotl32(b, 7)</li></ul>' +
      '<p>Rotation amounts (16, 12, 8, 7) were chosen to maximise diffusion per clock cycle.</p>'
    );
    cc20Slide(5, 'Column and Diagonal Rounds',
      '<p>One <strong>double round</strong> = column round + diagonal round. ChaCha20 performs' +
      ' <strong>10 double rounds (20 rounds total)</strong>.</p>' +
      '<ul><li><strong>Column QR:</strong> applied to columns (0,4,8,12), (1,5,9,13), (2,6,10,14), (3,7,11,15).</li>' +
      '<li><strong>Diagonal QR:</strong> applied to diagonals (0,5,10,15), (1,6,11,12), (2,7,8,13), (3,4,9,14).</li></ul>' +
      '<p>Alternating columns and diagonals ensures every word in the 4×4 matrix influences' +
      ' every other word in at most 2 double rounds — full diffusion.</p>'
    );
    cc20Slide(6, 'Keystream and Encryption',
      '<p>After 20 rounds, the <strong>initial state is added word by word</strong> to the round' +
      ' state (mod 2<sup>32</sup>). This addition is the final mixing step and produces 64 bytes of keystream.</p>' +
      '<p>Ciphertext = Plaintext ⊕ Keystream. For messages longer than 64 bytes, successive' +
      ' blocks are generated by incrementing the counter (block 1, 2, 3…). Blocks are independent' +
      ' and can be generated in parallel.</p>'
    );
    cc20Slide(7, 'Poly1305 MAC',
      '<p>Poly1305 is a one-time MAC operating in the field GF(2<sup>130</sup>−5). It processes' +
      ' the ciphertext in 16-byte blocks using a 32-byte one-time key derived from block 0 (counter=0).</p>' +
      '<p>Algorithm: <code>acc = ((acc + block) × r) mod (2¹³⁰ − 5)</code>' +
      ' for each block, then <code>tag = (acc + s) mod 2¹²⁸</code>.' +
      ' The r and s values come from the first 32 bytes of the keystream (block 0).</p>'
    );
    cc20Slide(8, 'Complete AEAD Scheme',
      '<p>The full ChaCha20-Poly1305 AEAD construction (RFC 8439):</p>' +
      '<ul><li>Derive Poly1305 key from ChaCha20 block 0 (counter=0).</li>' +
      '<li>Encrypt plaintext with ChaCha20 blocks 1, 2, 3… (counter starts at 1).</li>' +
      '<li>Authenticate: <code>Poly1305(key=block0, msg=AD_padded || CT_padded || len(AD) || len(CT))</code>.</li>' +
      '<li>Output: ciphertext + 16-byte authentication tag.</li></ul>' +
      '<p>To decrypt: re-derive key → verify tag first → only then decrypt.' +
      ' Reject immediately if the tag does not match — never reveal partial plaintext.</p>'
    );
  };

  /* ── AES RECURSOS ─────────────────────────────────────────────────────── */
  PAGES['aes-recursos'] = function () {
    var secs = qa('.recursos-section');
    function rsec(i, labelText) {
      if (secs[i]) tc(secs[i].querySelector('.accesos-label'), labelText);
    }
    rsec(0, 'Standards and Specifications');
    rsec(1, 'Interactive Tools');
    rsec(2, 'Recommended Readings');
    rsec(3, 'Cheatsheets and References');

    /* Card descriptions: target by href or visible text content */
    var cards = qa('.card');
    cards.forEach(function (c) {
      var lbl = c.querySelector('.card-label');
      var desc = c.querySelector('.card-desc');
      if (!lbl || !desc) return;
      var key = lbl.textContent.trim();
      var map = {
        'FIPS 197':      ['FIPS 197', 'Official AES standard (2001). Complete specification with test vectors for each intermediate step.'],
        'NIST SP 800-38A': ['NIST SP 800-38A', 'Block cipher modes of operation: ECB, CBC, CFB, OFB, CTR. Usage recommendations.'],
        'NIST Test Vectors': ['NIST Test Vectors', 'Official test vectors for AES-128/192/256. Essential for verifying implementations.'],
        'NIST CAVP': ['NIST CAVP', 'Cryptographic algorithm validation programme. Validated algorithm test suites.'],
        'CyberChef': ['CyberChef', 'Online tool to encrypt/decrypt AES in multiple modes, with key schedule exploration.'],
        'AES Crypt': ['AES Crypt', 'Minimal standalone AES implementation. Ideal for studying the algorithm in clean code.'],
        'Cryptii': ['Cryptii', 'Web interface for encoding, cipher and format conversion. Supports AES and legacy ciphers.'],
        'The Rijndael Page': ['The Rijndael Page', 'Daemen and Rijmen’s original design document and implementation notes.'],
        'Understanding Cryptography': ['Understanding Cryptography', 'Paar & Pelzl textbook. Chapter 4 covers AES in depth, with worked examples.'],
        'Applied Cryptography': ['Applied Cryptography', 'Schneier’s classic. Broad context for understanding where AES fits in real-world systems.'],
        'The Block Cipher Companion': ['The Block Cipher Companion', 'Knudsen & Robshaw. Deep dive into block cipher design and cryptanalysis techniques.'],
        'AES Cheatsheet': ['AES Cheatsheet', 'Quick reference: S-box, inverse S-box, Rcon, MixColumns matrix and all transformations.'],
        'GF(2⁸) Calculator': ['GF(2⁸) Calculator', 'Online Galois field calculator to verify MixColumns multiplications by hand.'],
        'AES Animation': ['AES Animation', 'Animated step-by-step AES from Adam Berent. Helpful complement to this lab.'],
        'Cryptopals': ['Cryptopals', 'Programming challenges based on real-world cryptographic attacks, many involving AES (ECB, CBC, CTR).']
      };
      if (map[key]) {
        tc(lbl, map[key][0]);
        tc(desc, map[key][1]);
      }
    });
  };

  /* ── ASCON RECURSOS ───────────────────────────────────────────────────── */
  /* Structure: .recursos-section × 4 with .accesos-label + .card-grid (.card-label/.card-desc) */
  PAGES['ascon-recursos'] = function () {
    var secs = qa('.recursos-section');
    var secLabels = ['Standards and Specifications', 'Reference Implementations',
                     'Recommended Readings', 'Project Materials'];
    secs.forEach(function (sec, i) {
      if (secLabels[i]) tc(sec.querySelector('.accesos-label'), secLabels[i]);
    });
    var cmap = {
      'ASCON — Sitio oficial':    ['ASCON — Official Site',  'Complete specification, test vectors and resources from the authors (IAIK, TU Graz).'],
      'NIST Lightweight Crypto':  ['NIST Lightweight Crypto', 'Official NIST standardization page for lightweight cryptography — ASCON was a finalist.'],
      'CAESAR Competition':       ['CAESAR Competition',     'Competition where ASCON-128a was selected as winner in 2019.'],
      'ASCON v1.2 — ePrint':      ['ASCON v1.2 — ePrint',   'Full technical specification v1.2 on IACR ePrint (2021/1574).'],
      'ascon/ascon-c':            ['ascon/ascon-c',          'Official C implementation by the authors — includes test vectors and benchmarks.'],
      'pyascon':                  ['pyascon',                'Python reference implementation by Maria Eichlseder (ASCON author).'],
      'Demo Lab (este proyecto)': ['Demo Lab (this project)', 'Educational ASCON-128a visualizer in JavaScript — no external dependencies.'],
      'CrypTool':                 ['CrypTool',               'Educational cryptography suite — includes ASCON visualizations.'],
      'Wikipedia — ASCON':        ['Wikipedia — ASCON',      'Technical description with pseudocode and algorithmic context.'],
      'AEAD — Wikipedia':         ['AEAD — Wikipedia',       'What is AEAD: concepts, properties and use cases.'],
      'Construcción Sponge':      ['Sponge Construction',    'The sponge/duplex structure underlying the ASCON design.'],
      'Crypto StackExchange':     ['Crypto StackExchange',   'Frequently asked questions about ASCON answered by cryptography experts.'],
      'Slides ASCON':             ['ASCON Slides',           '8 slides: state, S-box, linear layer, permutations and AEAD — this project.'],
      'Cheatsheet ASCON':         ['ASCON Cheatsheet',       'RC constants, IV, rotation constants, phase table — coming soon.'],
      'AES vs ASCON':             ['AES vs ASCON',           'Technical comparison: block vs sponge, modes, use cases — coming soon.']
    };
    qa('.card').forEach(function (c) {
      var lbl  = c.querySelector('.card-label');
      var desc = c.querySelector('.card-desc');
      if (!lbl || !desc) return;
      var key = (lbl._i18nOrig !== undefined ? lbl._i18nOrig : lbl.textContent).trim();
      if (cmap[key]) { tc(lbl, cmap[key][0]); tc(desc, cmap[key][1]); }
    });
  };

  /* ── CHACHA20 RECURSOS ────────────────────────────────────────────────── */
  /* Structure: <section class="card"> × 4 with <h2> + .resource-item > .resource-header h3 + <p> */
  PAGES['chacha20-recursos'] = function () {
    /* Section h2 headings */
    var h2Map = {
      'Estandares oficiales':                         'Official Standards',
      'Implementaciones de referencia':               'Reference Implementations',
      'Donde se usa en la practica':                  'Real-World Usage',
      'Herramientas de analisis y aprendizaje':       'Analysis and Learning Tools'
    };
    qa('.card h2').forEach(function (h) {
      var key = (h._i18nOrig || h.textContent).trim();
      if (h2Map[key]) tc(h, h2Map[key]);
    });

    /* Paragraph descriptions by first ~20 chars of original text */
    var pMap = {
      'El estandar definitivo':           'The definitive standard. Includes formal descriptions, complete test vectors and security considerations. Supersedes RFC 7539.',
      'El paper original de Bernstein':   'Bernstein’s original paper presenting ChaCha as an improvement over Salsa20, with diffusion analysis and justification of rotation constants.',
      'Diseno original de Poly1305':      'Original Poly1305 design (AES version). RFC 8439 uses pure Poly1305 (without AES), with the key derived from the ChaCha20 keystream.',
      'La libreria criptografica mas':    'The most widely used Python cryptographic library. Implements ChaCha20-Poly1305 over libsodium / OpenSSL. Recommended for production use.',
      'La implementacion C de ref':       'The C reference implementation. Optimized with NEON and AVX2 intrinsics. The backbone of many modern protocols (WireGuard, Signal, minisign).',
      'Implementacion pura en Rust':      'Pure Rust implementation, no unsafe code, with support for ChaCha20Poly1305 (IETF) and XChaCha20Poly1305. Constant-time throughout.',
      'La implementacion oficial de Go':  'The official Go implementation. Includes XChaCha20-Poly1305 (extended nonce) and is used in production Go services.',
      'WireGuard usa ChaCha20':           'WireGuard uses ChaCha20-Poly1305 exclusively (no negotiation). The decision eliminates cipher-suite downgrade attacks.',
      'TLS 1.3 incluye':                  'TLS 1.3 includes TLS_CHACHA20_POLY1305_SHA256 as a mandatory cipher suite. All major browsers and servers support it.',
      'Signal usa ChaCha20':              'Signal uses ChaCha20-Poly1305 to encrypt individual messages within the Double Ratchet protocol.',
      'OpenSSH implementa':               'OpenSSH has implemented ChaCha20-Poly1305 since version 6.5 (2014). It is the preferred cipher for SSH connections.',
      'Herramienta online de GCHQ':       'GCHQ online tool. Allows applying ChaCha20 and Poly1305 step by step with visualization — great complement to this lab.',
      'OpenSSL soporta ChaCha20':         'OpenSSL supports ChaCha20-Poly1305 since version 1.1.0. Allows encrypting files and testing from the command line.',
      'El curso mas completo':            'The most comprehensive applied cryptography course. Covers stream ciphers, MACs and authenticated encryption schemes formally.'
    };
    qa('.resource-item p').forEach(function (p) {
      var orig = p._i18nOrig !== undefined ? p._i18nOrig : p.textContent;
      var first20 = orig.trim().substring(0, 20);
      for (var key in pMap) {
        if (first20.indexOf(key.substring(0, 15)) === 0) {
          if (p._i18nOrig === undefined) p._i18nOrig = p.textContent;
          p.textContent = (LANG === 'en') ? pMap[key] : p._i18nOrig;
          break;
        }
      }
    });
  };


  /* ── index.html: agregar seccion Hashing ─────────────────────────────── */
  var _indexOrig = PAGES['index'];
  PAGES['index'] = function () {
    _indexOrig();
    qa('.accesos-label--hash').forEach(function (el) {
      tc(el, 'Access · Hashing & Integrity');
    });
    var hashCardMap = {
      'Demo Lab Hash':    'Hash Demo Lab',
      'Teoria Hashing':   'Hashing Theory',
      'Recursos Hashing': 'Hashing Resources'
    };
    var hashDescMap = {
      'MD5, SHA-256': 'MD5, SHA-256, SHA-3, HMAC — compute and visualize step by step',
      'Merkle-Damgar': 'Merkle-Damgård, Keccak, HMAC and SOC/DFIR applications',
      'FIPS 180-4':    'FIPS 180-4, FIPS 202, SHAttered, VirusTotal, DFIR tools'
    };
    qa('.card--hash .card-label').forEach(function (el) {
      var key = (el._i18nOrig || el.textContent).trim();
      if (hashCardMap[key]) tc(el, hashCardMap[key]);
    });
    qa('.card--hash .card-desc').forEach(function (el) {
      var orig = (el._i18nOrig || el.textContent).trim().substring(0, 14);
      for (var k in hashDescMap) {
        if (orig.indexOf(k.substring(0, 10)) >= 0) { tc(el, hashDescMap[k]); break; }
      }
    });
    var mHash = document.getElementById('modal-hash');
    if (mHash) {
      var mh2 = mHash.querySelector('h2');
      if (mh2) tc(mh2, 'Hashing & Integrity');
      var ps = mHash.querySelectorAll('.prose p');
      if (ps[0]) tx(ps[0], 'Educational lab covering MD5, SHA-256, SHA3-256 and HMAC-SHA256 internals.');
      if (ps[1]) tx(ps[1], 'Includes step-by-step visualization, <strong>avalanche effect</strong> demo, and a guide on hashing in SOC/DFIR operations.');
      if (ps[2]) tx(ps[2], 'Implementations are pedagogical — for production use <code>hashlib</code>, OpenSSL or the Web Crypto API.');
    }
  };

  /* ── hash-teoria ──────────────────────────────────────────────────────── */
  PAGES['hash-teoria'] = function () {
    tx(q('.hero .eyebrow'),  'Theory and internals');
    tx(q('.hero h1'),        'Hash Functions &amp; Integrity');
    tx(q('.hero-copy'),      '8 slides: from Merkle-Damgård to the role of hashing in SOC and DFIR.');
    var slides = [
      { h2: 'What is a cryptographic hash function?',
        body: 'A <strong>cryptographic hash function</strong> takes arbitrary-length input and produces a fixed-length <em>digest</em>. Preimage resistance, collision resistance, and the avalanche effect are its three core security properties.' },
      { h2: 'Merkle-Damgård construction',
        body: 'MD5, SHA-1 and SHA-2 all use the iterative <strong>Merkle-Damgård construction</strong>: split message into fixed-size blocks, apply a compression function with the previous state, and produce the final hash. Susceptible to <em>length extension attacks</em>.' },
      { h2: 'MD5 — broken but ubiquitous',
        body: 'MD5 (1991) produces a <strong>128-bit</strong> digest. Collisions are findable in seconds on commodity hardware. Cryptographically broken since 2004. Still used as a non-security checksum and as an IOC identifier in threat intelligence.' },
      { h2: 'SHA-1 — obsolete but present in infrastructure',
        body: 'SHA-1 (1995) produces a <strong>160-bit</strong> digest. Real collision demonstrated in 2017 (SHAttered). Prohibited for digital signatures since NIST SP 800-131A (2013). Detecting SHA-1 cipher suites in TLS signals weak configuration.' },
      { h2: 'SHA-256 — current operational standard',
        body: 'SHA-256 (SHA-2, FIPS 180-4) produces a <strong>256-bit</strong> digest. Merkle-Damgård with 512-bit blocks, 64 rounds, 8 × 32-bit state words. Used in TLS 1.3, X.509 signatures, Bitcoin, HMAC, and malware IOCs in threat intel.' },
      { h2: 'SHA-3 / Keccak — sponge construction',
        body: 'SHA-3 (FIPS 202, 2015) uses a <strong>sponge construction</strong> over a 1600-bit Keccak state instead of Merkle-Damgård. Absorb message blocks, apply 24-round Keccak-f permutation (θ ρ π χ ι), squeeze 256 bits. Inherently resistant to length extension attacks.' },
      { h2: 'HMAC — hash-based authentication',
        body: 'HMAC (RFC 2104): <code>H( (K⊕opad) ‖ H( (K⊕ipad) ‖ M ) )</code>. Combines a secret key with a hash to produce a MAC. Used in JWT (HS256), TLS 1.2 PRF, HKDF (TLS 1.3 key derivation), AWS SigV4, GitHub webhooks.' },
      { h2: 'Hashing in operational cybersecurity',
        body: 'Threat Intel: IOCs are MD5/SHA-1/SHA-256 malware hashes. DFIR: SHA-256 for evidence chain of custody. SOC: Sysmon Event ID 1 includes SHA-256 of every launched process. TLS: cipher suite suffix indicates the HMAC hash algorithm. Password storage: bcrypt/Argon2/PBKDF2 are KDFs with a cost factor.' }
    ];
    var cards = qa('.slide-card');
    slides.forEach(function (s, i) {
      var card = cards[i]; if (!card) return;
      var h2 = card.querySelector('h2'); if (h2) tc(h2, s.h2);
      var body = card.querySelector('.slide-body'); if (body) tx(body, s.body);
    });
  };

  /* ── hash-recursos ────────────────────────────────────────────────────── */
  PAGES['hash-recursos'] = function () {
    tx(q('.hero .eyebrow'),  'References and resources');
    tx(q('.hero h1'),        'Resources — Hashing &amp; Integrity');
    tx(q('.hero-copy'),      'Standards, implementations, tools and applied reading for SOC and DFIR.');
    var h2Map = {
      'Estandares y especificaciones':  'Standards and specifications',
      'Implementaciones de referencia': 'Reference implementations',
      'Herramientas SOC y DFIR':        'SOC and DFIR tools',
      'Lectura aplicada':               'Applied reading'
    };
    qa('.card h2').forEach(function (h) {
      var key = (h._i18nOrig || h.textContent).trim();
      if (h2Map[key]) tc(h, h2Map[key]);
    });
  };

  /* ── hash-demo ────────────────────────────────────────────────────────── */
  PAGES['hash-demo'] = function () {
    tx(q('.hero .eyebrow'), 'Hash Functions — Integrity Lab');
    tx(q('.hero h1'),       'Hash Visualizer');
  };

  /* ══════════════════════════════════════════════════════════════════════════
   * INIT
   * ══════════════════════════════════════════════════════════════════════════ */
  /* Exponer applyLang globalmente para que las pills de idioma puedan llamarla
     sin depender de un #langSelect inyectado */
  window.setLang = applyLang;

  document.addEventListener('DOMContentLoaded', function () {
    initSelect();

    /* Apply EN if stored */
    if (LANG !== 'es') applyLang(LANG);

    /* Listen for langchange fired by aes-app.js (it already has its own handler) */
    window.addEventListener('langchange', function (e) {
      if (!e.detail || !e.detail.lang) return;
      var newLang = e.detail.lang;
      if (newLang === LANG) return;        /* avoid infinite loop */
      LANG = newLang;
      window.SITE_LANG = newLang;
      try { localStorage.setItem('site-lang', newLang); } catch (x) {}
      document.documentElement.lang = newLang === 'en' ? 'en' : 'es';
      /* Re-sync all langSelect elements */
      qa('[id="langSelect"]').forEach(function (s) { s.value = newLang; });
    });
  });

}());
