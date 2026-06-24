# Changelog

All notable changes to this project are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

- TLS 1.3 interactive handshake module
- SOC detection module — Sigma/Suricata rules from algorithm telemetry
- DFIR module — forensic identification of symmetric algorithms in artefacts

---

## [1.0.0] — 2026-06

### Added
- Animated navigation button (`boton-dubstep.css`) — CSS-only pulse effect, theme-aware via CSS variables, color-adapted per module
- Screenshots in `docs/screenshots/`

### Changed
- README and README.en.md: full rewrite — project structure, technical architecture table, bilingual system description, operational context table
- CONTRIBUTING.md: KaTeX dependency documented with exact CDN URLs and usage pattern
- SECURITY.md: responsible use policy clarified, production alternatives listed (Web Crypto API, libsodium, OpenSSL)

---

## [0.6.0] — 2026-05

### Added
- KaTeX 0.16.9 (CDN) for mathematical formula rendering in theory slides
- LaTeX formulas replacing ASCII representations in all 4 theory modules: AES, ASCON, ChaCha20, Hashing

---

## [0.5.0] — 2026-04

### Added
- **Module 4 — Hashing & Integrity**: MD5, SHA-256 (Merkle-Damgård), SHA3-256 (Keccak sponge), HMAC-SHA256
  - `hash-demo.html` — interactive lab with step-by-step visualization
  - `hash-teoria.html` — 9 theory slides
  - `hash-recursos.html` — technical references (FIPS 180-4, FIPS 202, RFC 2104)
  - `hash-app.js`, `hash-tabs.js`
- SOC/DFIR operational callouts across all 4 demo labs
- Navigation bridge in `index.html` linking to companion project [clase-criptografia](https://xavimape.github.io/clase-criptografia/)

---

## [0.4.0] — 2026-03

### Added
- **Bilingual system ES/EN** — `i18n.js`: shared engine with `tx()`, `tc()`, `pickLang()` helpers; persistent language selector across pages
- Full EN translations for all modules: theory slides, demo lab labels, resources, key-points
- `theme-switcher.js` — light / dark / high-contrast themes, persisted in `localStorage`

---

## [0.3.0] — 2026-02

### Added
- **Module 3 — ChaCha20-Poly1305** (RFC 8439)
  - `chacha20-demo.html` — ARX step-by-step lab: Quarter Round, keystream, Poly1305
  - `chacha20-teoria.html` — 9 theory slides
  - `chacha20-recursos.html` — references (RFC 8439, WireGuard, Signal Protocol)
  - `chacha20-app.js`, `chacha20-tabs.js`
- RFC 8439 test vector validation in lab

---

## [0.2.0] — 2026-01

### Added
- **Module 2 — ASCON-128 / ASCON-128a** (NIST LWC 2023)
  - `ascon-demo.html` — AEAD step-by-step lab: 320-bit state, duplex sponge phases, bits changed per step
  - `ascon-teoria.html` — 8 theory slides
  - `ascon-recursos.html` — references (NIST LWC, ASCON spec, IoT/firmware context)
  - `ascon-app.js`, `ascon-tabs.js`
- ASCON-128a variant support alongside ASCON-128
- Per-module accent color system in `styles.css` (CSS custom properties)

---

## [0.1.0] — 2025-12

### Added
- **Module 1 — AES-256-GCM** (NIST FIPS 197 / SP 800-38D)
  - `aes-demo.html` — interactive lab: SubBytes (GF(2⁸) S-box), ShiftRows, MixColumns, AddRoundKey, Key Schedule, GCM/GHASH
  - `aes-teoria.html` — 8 theory slides with state matrix visualization
  - `aes-recursos.html` — references (FIPS 197, NIST SP 800-38D, RFC 5116)
  - `aes-app.js`, `aes-tabs.js`, `aes-enhancements.js`, `aes-translations.json`
- `index.html` — navigation hub with module cards
- `styles.css` — unified dark cyber visual theme
- `favicon.svg`
- `i18n.js` (initial static strings)
- GitHub Pages deploy via GitHub Actions (`deploy.yml`)
- `CONTRIBUTING.md`, `SECURITY.md`, `LICENSE` (MIT), `.gitignore`
