# Interactive Cryptography — AES · ASCON · ChaCha20-Poly1305 · Hashing

[![Deploy to GitHub Pages](https://github.com/xavimape/criptografia-simetrica/actions/workflows/deploy.yml/badge.svg)](https://github.com/xavimape/criptografia-simetrica/actions/workflows/deploy.yml)
&nbsp;
🌐 **Live:** https://xavimape.github.io/criptografia-simetrica/ &nbsp;|&nbsp; Spanish version: [README.md](README.md)

## What is this project?

A **cryptographic internals** lab focused on technical rigor and step-by-step algorithm visualization. The goal is to understand how AES, ASCON, ChaCha20-Poly1305, SHA-256 and related algorithms work from the inside: the mathematics, internal states, and transformations — step by step.

> **Note on audience:** this project covers the *algorithmic internals* layer — the math underneath. If you're looking to apply cryptography in real SOC scenarios (TLS analysis, IOCs, DFIR, detection rules), the companion project [**Cryptography for SOC Analysts**](https://xavimape.github.io/clase-criptografia/index.html) covers that operational layer with cases, labs, and analyst-focused exercises.

The two projects are complementary: understanding the internals here gives you the technical foundation to interpret what you see there.

---

## Modules

- **AES-256-GCM** — NIST block cipher: SubBytes over GF(2⁸), ShiftRows, MixColumns, AddRoundKey, Key Schedule, GCM mode + GHASH
- **ASCON-128** — NIST LWC 2023 lightweight cipher: 320-bit state permutation, 5-bit S-box, linear diffusion, duplex AEAD construction
- **ChaCha20-Poly1305** — ARX cipher: Quarter Round, keystream generation, Poly1305 authentication over GF(2¹³⁰-5), RFC 8439
- **Hashing & Integrity** — Merkle-Damgård (MD5, SHA-256), Keccak sponge (SHA3-256), HMAC-SHA256

---

## What's in each module?

**Demo Lab** — interactive lab where every transformation is visible in real time: internal state, intermediate values, algorithm steps with detailed calculations.

**Theory** — navigable slides (8-9 per module) explaining the mathematical construction: why GF(2⁸) in AES, why ARX in ChaCha20, why the Keccak sponge is resistant to length-extension attacks.

**Resources** — primary technical references: FIPS, RFCs, original papers, NIST test vectors, verification tools.

---

## Connection to operational context

Each lab includes technical callouts connecting the algorithm to its real-world use:

| Algorithm | Appears in |
|-----------|------------|
| AES-256-GCM | TLS 1.3 (`TLS_AES_256_GCM_SHA384`), modern ransomware (LockBit, ALPHV), disk encryption |
| ASCON-128 | IoT firmware (ARM Cortex-M, RISC-V), Matter protocol, energy-constrained devices |
| ChaCha20-Poly1305 | TLS 1.3 (`TLS_CHACHA20_POLY1305_SHA256`), WireGuard VPN, Signal/WhatsApp Protocol |
| SHA-256 / HMAC | Threat Intel IOCs, DFIR chain of custody (`sha256sum`), JWT (HS256), Sigma rules |

For complete SOC scenarios with TLS traffic analysis, ransomware cases, JA3/Zeek labs and detection exercises → [**clase-criptografia**](https://xavimape.github.io/clase-criptografia/index.html).

---

## Project Structure

```
web/
├── index.html              ← Main hub with navigation
├── styles.css              ← Unified visual theme (dark cyber)
├── theme-switcher.js       ← Theme selector and persistence (localStorage)
├── i18n.js                 ← Shared ES/EN bilingual engine
├── boton-dubstep.css       ← CSS component: animated navigation button
├── favicon.svg             ← Site icon
│
├── aes-demo.html           ← AES-256-GCM interactive lab
├── aes-teoria.html         ← 8 AES theory slides
├── aes-recursos.html       ← AES references and resources
├── aes-app.js              ← AES implementation + visualization
├── aes-tabs.js             ← AES tab logic
├── aes-enhancements.js     ← AES visual enhancements
├── aes-translations.json   ← AES-specific translation strings
│
├── ascon-demo.html         ← ASCON-128 / ASCON-128a interactive lab
├── ascon-teoria.html       ← 8 ASCON theory slides
├── ascon-recursos.html     ← ASCON references and resources
├── ascon-app.js            ← ASCON implementation + visualization
├── ascon-tabs.js           ← ASCON tab logic and KAT examples
│
├── chacha20-demo.html      ← ChaCha20-Poly1305 interactive lab
├── chacha20-teoria.html    ← 9 ChaCha20 theory slides
├── chacha20-recursos.html  ← ChaCha20 references and resources
├── chacha20-app.js         ← ChaCha20 implementation + visualization
├── chacha20-tabs.js        ← ChaCha20 tab logic
│
├── hash-demo.html          ← Hashing interactive lab (MD5/SHA-2/SHA-3/HMAC)
├── hash-teoria.html        ← 9 Hashing theory slides
├── hash-recursos.html      ← Hashing references and resources
├── hash-app.js             ← Hash implementation + visualization
└── hash-tabs.js            ← Hashing tab logic
```

---

## Technical Architecture

| Component      | Technology                          |
|----------------|-------------------------------------|
| Frontend       | HTML5, CSS3 and JavaScript (ES6)    |
| Backend        | None (100% client-side)             |
| Dependencies   | KaTeX 0.16.9 (CDN, math rendering)  |
| Hosting        | GitHub Pages / static servers       |
| Compatibility  | Modern browsers (ES6+)              |
| i18n           | Custom engine in `i18n.js`          |
| Themes         | `theme-switcher.js` — light / dark / high-contrast, persisted in `localStorage` |
| Formulas       | [KaTeX](https://katex.org/) via cdnjs — `\(...\)` inline, `$$...$$` display |
| Navigation     | `boton-dubstep.css` — animated pulse button, color-adapted per module |

---

## Usage & Deployment

```bash
# Option 1: open directly in browser
open web/index.html

# Option 2: simple local server
cd web
python -m http.server 8080
# → http://localhost:8080

# Option 3: GitHub Pages
# Configure Pages pointing to /web or /root
```

No backend, database, or dependency installation required. Compatible with Chrome, Firefox, Edge and modern browsers with ES6 support.

---

## Bilingual System

Full ES/EN support via `i18n.js`: persistent language selector across pages, technical translations in mathematics and cybersecurity, dynamic lab content also translated.

---

## Philosophy

```
Algorithm
    ↓
Internal visualization (this project)
    ↓
Protocol / mode of operation (this project)
    ↓
Real-world use case → clase-criptografia
    ↓
Telemetry and detection → clase-criptografia
    ↓
SOC / DFIR Analysis → clase-criptografia
```

---

## Responsible Use

JavaScript implementations are for pedagogical purposes only — not audited for production. Test vectors are extracted from official RFCs and NIST documents.

---

## Project Status

4 complete modules. In development: TLS 1.3 interactive handshake.

---

**Author**: @xavimape · Companion project: [clase-criptografia](https://xavimape.github.io/clase-criptografia/index.html)

## License

MIT License
