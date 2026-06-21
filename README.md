# Criptografía Interactiva — AES · ASCON · ChaCha20-Poly1305 · Hashing

[![Deploy to GitHub Pages](https://github.com/xavimape/criptografia-simetrica/actions/workflows/deploy.yml/badge.svg)](https://github.com/xavimape/criptografia-simetrica/actions/workflows/deploy.yml)
&nbsp;
🌐 **Live:** https://xavimape.github.io/criptografia-simetrica/ &nbsp;|&nbsp; English version: [README.en.md](README.en.md)

## ¿Qué es este proyecto?

Laboratorio de **fundamentos criptográficos** con énfasis en rigor técnico y visualización interna de los algoritmos. El objetivo es entender cómo funcionan AES, ASCON, ChaCha20-Poly1305, SHA-256 y compañía desde adentro: la matemática, los estados internos, las transformaciones, paso a paso.

> **Nota sobre el público:** este proyecto cubre la capa de *internos algorítmicos* — la matemática que está debajo. Si lo que buscás es aplicar criptografía en escenarios SOC reales (análisis TLS, IOCs, DFIR, reglas de detección), el proyecto complementario [**Cryptography for SOC Analysts**](https://xavimape.github.io/clase-criptografia/index.html) cubre esa capa operativa con casos, laboratorios y ejercicios orientados a analistas.

Los dos proyectos son complementarios: entender los internos aquí te da el criterio técnico para interpretar lo que ves allá.

---

## Módulos

- **AES-256-GCM** — cifrado de bloque NIST: SubBytes sobre GF(2⁸), ShiftRows, MixColumns, AddRoundKey, Key Schedule, modo GCM + GHASH
- **ASCON-128** — cifrado liviano NIST LWC 2023: permutación de 320 bits, S-box de 5 bits, difusión lineal, construcción AEAD dúplex
- **ChaCha20-Poly1305** — cifrado ARX: Quarter Round, generación de keystream, autenticación Poly1305 en GF(2¹³⁰-5), RFC 8439
- **Hashing e Integridad** — Merkle-Damgård (MD5, SHA-256), esponja Keccak (SHA3-256), HMAC-SHA256

---

## ¿Qué hay en cada módulo?

Cada módulo incluye tres componentes:

**Demo Lab** — laboratorio interactivo donde cada transformación es visible en tiempo real: estado interno, valores intermedios, pasos del algoritmo con cálculos detallados.

**Teoría** — 8 diapositivas navegables que explican la construcción matemática: por qué GF(2⁸) en AES, por qué ARX en ChaCha20, por qué la esponja Keccak es resistente a length-extension.

**Recursos** — referencias técnicas primarias: FIPS, RFCs, papers originales, vectores NIST, herramientas de verificación.

---

## Conexión con el contexto operativo

Cada lab incluye callouts técnicos que conectan el algoritmo con su uso real:

| Algoritmo | Aparece en |
|-----------|------------|
| AES-256-GCM | TLS 1.3 (`TLS_AES_256_GCM_SHA384`), ransomware moderno (LockBit, ALPHV), cifrado de disco |
| ASCON-128 | Firmware IoT (ARM Cortex-M, RISC-V), Matter protocol, dispositivos con restricciones de energía |
| ChaCha20-Poly1305 | TLS 1.3 (`TLS_CHACHA20_POLY1305_SHA256`), WireGuard VPN, Signal/WhatsApp Protocol |
| SHA-256 / HMAC | IOCs en Threat Intel, cadena de custodia DFIR (`sha256sum`), JWT (HS256), reglas Sigma |

Para escenarios SOC completos con análisis de tráfico TLS, casos de ransomware, labs JA3/Zeek y ejercicios de detección → [**clase-criptografia**](https://xavimape.github.io/clase-criptografia/index.html).

---

## Estructura del Proyecto

```
web/
├── index.html              ← Hub principal con navegación
├── styles.css              ← Tema visual unificado (dark cyber)
├── i18n.js                 ← Motor bilingüe ES/EN compartido
│
├── aes-demo.html           ← Lab interactivo AES-256-GCM
├── aes-teoria.html         ← 8 diapositivas teóricas AES
├── aes-recursos.html       ← Referencias y recursos AES
├── aes-app.js              ← Implementación AES + visualización
├── aes-tabs.js             ← Lógica de tabs AES
├── aes-enhancements.js     ← Mejoras visuales AES
│
├── ascon-demo.html         ← Lab interactivo ASCON-128
├── ascon-teoria.html       ← 8 diapositivas teóricas ASCON
├── ascon-recursos.html     ← Referencias y recursos ASCON
├── ascon-app.js            ← Implementación ASCON + visualización
├── ascon-tabs.js           ← Lógica de tabs ASCON
│
├── chacha20-demo.html      ← Lab interactivo ChaCha20-Poly1305
├── chacha20-teoria.html    ← 8 diapositivas teóricas ChaCha20
├── chacha20-recursos.html  ← Referencias y recursos ChaCha20
├── chacha20-app.js         ← Implementación ChaCha20 + visualización
├── chacha20-tabs.js        ← Lógica de tabs ChaCha20
│
├── hash-demo.html          ← Lab interactivo Hashing (MD5/SHA/HMAC)
├── hash-teoria.html        ← 8 diapositivas teóricas Hashing
├── hash-recursos.html      ← Referencias y recursos Hashing
├── hash-app.js             ← Implementación hash + visualización
└── hash-tabs.js            ← Lógica de tabs Hashing
```

---

## Arquitectura Técnica

| Componente     | Tecnología                          |
|----------------|-------------------------------------|
| Frontend       | HTML5, CSS3 y JavaScript (ES6)      |
| Backend        | Ninguno (100% client-side)          |
| Dependencias   | KaTeX 0.16.9 (CDN, fórmulas matemáticas) |
| Hosting        | GitHub Pages / servidores estáticos |
| Compatibilidad | Navegadores modernos (ES6+)         |
| i18n           | Motor propio en `i18n.js`           |
| Fórmulas       | [KaTeX](https://katex.org/) via cdnjs — `\(...\)` inline, `$$...$$` display |

---

## Uso y Despliegue

```bash
# Opción 1: abrir directamente en el navegador
open web/index.html

# Opción 2: servidor local simple
cd web
python -m http.server 8080
# → http://localhost:8080

# Opción 3: GitHub Pages
# Configurar Pages apuntando a /web o /root
```

No requiere backend, base de datos ni instalación de dependencias. Compatible con Chrome, Firefox, Edge y navegadores modernos con soporte ES6.

---

## Sistema Bilingüe

Soporte completo ES/EN mediante `i18n.js`: selector persistente entre páginas, traducciones técnicas en matemática y ciberseguridad, contenido dinámico de los labs también traducido.

---

## Filosofía

```
Algoritmo
    ↓
Visualización interna (este proyecto)
    ↓
Protocolo / modo de operación (este proyecto)
    ↓
Caso de uso real → clase-criptografia
    ↓
Telemetría y detección → clase-criptografia
    ↓
Análisis SOC / DFIR → clase-criptografia
```

---

## Uso Responsable

Las implementaciones en JavaScript tienen fines pedagógicos exclusivamente — no están auditadas para producción. Los vectores de prueba son extraídos de RFCs y documentos NIST oficiales.

---

## Estado del Proyecto

4 módulos completos. Módulos en desarrollo: TLS 1.3 handshake interactivo.

---

**Autor**: @xavimape · Proyecto complementario: [clase-criptografia](https://xavimape.github.io/clase-criptografia/index.html)

## Licencia

MIT License
