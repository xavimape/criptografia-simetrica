# Contributing Guide

Este repositorio es un proyecto educativo personal sobre criptografía aplicada a ciberseguridad.

## Estado actual del proyecto

El proyecto cubre actualmente:

* **Módulo 1:** AES-256-GCM — cifrado de bloque, Key Schedule, GCM/GHASH
* **Módulo 2:** ASCON-128 — cifrado liviano, permutación ASCON-p, esponja dúplex
* **Módulo 3:** ChaCha20-Poly1305 — ARX stream cipher, Quarter Round, Poly1305
* **Módulo 4:** Hashing e Integridad — MD5, SHA-256, SHA3-256, HMAC-SHA256
* Laboratorios interactivos paso a paso para cada algoritmo
* Teoría en diapositivas (8 slides por módulo)
* Recursos y referencias técnicas por módulo
* Sistema bilingüe ES/EN integrado

## Módulos en desarrollo

* TLS 1.3 — handshake interactivo, cipher suite negotiation, JA3/JA3S
* Detección SOC — cómo aparecen estos algoritmos en logs, reglas Sigma/Suricata
* DFIR aplicado — análisis forense, identificación de algoritmos en artefactos

---

## Objetivo del proyecto

Conectar fundamentos criptográficos con aplicación operativa en:

* SOC (Security Operations Center)
* Threat Intelligence
* DFIR / Forensia Digital
* Detection Engineering
* Análisis de protocolos (TLS, AEAD)

---

## Tipos de contribuciones aceptadas

* mejoras de visualización en los labs interactivos
* correcciones técnicas en implementaciones (validar contra vectores RFC/NIST)
* mejoras de documentación o traducciones ES/EN
* nuevos recursos o referencias técnicas
* mejoras UI/UX o responsive
* corrección de errores en vectores de prueba
* nuevos slides de teoría con respaldo técnico

---

## Antes de contribuir

1. Revisar la estructura existente del proyecto en `web/`
2. Mantener coherencia visual con el tema dark cyber y `styles.css`
3. Reutilizar los patrones establecidos (tabs, cards, modales)
4. Todo texto nuevo debe tener su traducción EN en `i18n.js`
5. No romper la navegación entre páginas
6. Mantener compatibilidad con GitHub Pages (sin backend)

---

## Reglas técnicas

El proyecto usa exclusivamente:

* HTML5
* CSS3
* JavaScript (ES6) — sin frameworks ni librerías propias

**Dependencia CDN permitida:**

| Librería | Versión | Uso | CDN URL |
|----------|---------|-----|---------|
| [KaTeX](https://katex.org/) | 0.16.9 | Renderizado de fórmulas matemáticas | `cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/` |

KaTeX se carga en los 5 archivos de teoría/demo que contienen fórmulas:
`aes-teoria.html`, `ascon-teoria.html`, `chacha20-teoria.html`, `hash-teoria.html`, `hash-demo.html`.

Para añadir fórmulas en nuevas páginas, incluir en `<head>`:
```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css" crossorigin="anonymous" />
```
Y antes de `</body>`:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js" crossorigin="anonymous" defer></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/contrib/auto-render.min.js" crossorigin="anonymous" defer></script>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    if (typeof renderMathInElement === 'function') {
      renderMathInElement(document.body, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '\\(', right: '\\)', display: false}
        ],
        throwOnError: false
      });
    }
  });
</script>
```

Usar `\(...\)` para fórmulas inline y `$$...$$` para bloques display (centrados). Las fórmulas display van en `<p style="text-align:center;padding:.5rem 0">` para separarse del contenido circundante.

---

## Sistema bilingüe

Toda cadena de texto nueva debe:

1. Estar en español en el HTML fuente
2. Tener su traducción EN registrada en `i18n.js` dentro de `PAGES['nombre-pagina']`
3. Usar el patrón `tx()` / `tc()` / `pickLang()` según corresponda

---

## Estilo visual

Mantener el sistema de colores accent por módulo:

| Módulo | Color | Variable CSS |
|--------|-------|-------------|
| AES | `#00d4ff` (cyan) | `--accent` |
| ASCON | `#a855f7` (purple) | `--accent-ascon` |
| ChaCha20 | `#f59e0b` (amber) | `--accent-chacha` |
| Hashing | `#10b981` (emerald) | `--accent-hash` |

Evitar cambios globales en `styles.css` sin justificación.

---

## Contenido técnico

El contenido debe:

* ser verificable contra RFCs, NIST SPs o papers académicos
* incluir contexto operativo (SOC, DFIR, TLS) cuando sea posible
* citar fuentes en la sección de recursos
* priorizar claridad pedagógica

---

## Commits

```bash
feat(hash): add SHA-3 Keccak sponge visualization

fix(chacha20): correct Poly1305 accumulator endianness

docs(aes): add GCM GHASH explanation slide

i18n(hash): add EN translations for hash-teoria

style(css): improve mobile layout for demo labs
```

---

## Seguridad

No subir credenciales, tokens, API keys ni claves criptográficas reales.
Usar siempre vectores de prueba de RFCs y NIST, marcados explícitamente como ejemplos pedagógicos.

---

## Filosofía

```
Algoritmo → Visualización interna → Protocolo → Detección SOC / DFIR
```
