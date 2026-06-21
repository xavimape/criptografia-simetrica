# Security Policy

## Objetivo del proyecto

Este repositorio tiene fines exclusivamente educativos y está orientado a:

* Criptografía simétrica aplicada (AES-256-GCM, ASCON-128, ChaCha20-Poly1305)
* Comprensión de algoritmos AEAD
* SOC (Security Operations Center) y análisis de telemetría
* DFIR / Forensia Digital
* Detection Engineering

El contenido busca enseñar el funcionamiento interno de los algoritmos, su uso en protocolos reales (TLS 1.3, IoT, firmware) y cómo reconocerlos en escenarios defensivos.

---

## Uso responsable

Este proyecto NO promueve:

* actividades ilegales o no autorizadas
* uso ofensivo de técnicas criptográficas
* implementaciones inseguras para producción

Las implementaciones de los algoritmos en JavaScript son pedagógicas y:

* no han sido auditadas para uso en producción
* no deben usarse para proteger datos reales
* están diseñadas para comprensión, no para despliegue

Todos los labs, vectores de prueba y ejemplos deben utilizarse únicamente en:

* entornos educativos y controlados
* análisis autorizado
* máquinas de prueba o laboratorio

---

## Implementaciones pedagógicas

Las implementaciones de AES-256-GCM, ASCON-128 y ChaCha20-Poly1305 en este proyecto:

* están escritas en JavaScript para visualización en el navegador
* priorizan legibilidad sobre optimización
* no incluyen protecciones contra ataques de canal lateral (timing attacks, etc.)
* utilizan vectores de prueba extraídos de RFCs y documentos NIST oficiales

Para uso en producción, utilizar librerías auditadas: **Web Crypto API**, **libsodium**, **OpenSSL**, **Bouncy Castle**, u otras certificadas.

---

## Reporte de problemas

Si encontrás:

* errores técnicos en la implementación de algoritmos
* vectores de prueba incorrectos
* exposición accidental de información sensible
* problemas de seguridad en el código JavaScript

por favor abrir un Issue describiendo:

* archivo afectado
* comportamiento observado vs. esperado
* referencia técnica (RFC, NIST SP, test vector)
* pasos para reproducir

---

## Contenido simulado

Los vectores de prueba, ejemplos y casos incluidos provienen de:

* **RFC 8439** — ChaCha20-Poly1305
* **NIST SP 800-38D** — AES-GCM
* **NIST LWC** — ASCON test vectors
* documentos académicos y estándares públicos

No deben considerarse material de producción sin validación adicional.

---

## Alcance

Este proyecto es una plataforma educativa open-source y no reemplaza:

* librerías criptográficas auditadas
* auditorías de seguridad profesionales
* implementaciones certificadas para producción
* asesoramiento de seguridad formal
