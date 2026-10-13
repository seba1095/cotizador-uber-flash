# Automatización de boletas SII: traspaso a sesión local

Fecha: 2026-10-13. Este documento resume lo investigado en la sesión en la nube para continuar en local (Claude Code CLI o app de escritorio con la extensión Claude in Chrome).

No poner en este repo: archivos `.pfx`/`.p12`, claves tributarias, contraseñas ni `.env`.

## Objetivo
Emitir boletas electrónicas del SII (solo boletas, no facturas) automáticamente desde un Google Sheet, al menor costo posible.

## Situación actual del usuario
- El sistema de emisión gratuito del SII (`https://eboleta.sii.cl/emitir/`) ya está habilitado para su RUT.
- Tiene una anotación código 45 en el SII: "fueron a mi dirección y no me encontraron" (tipo "no ubicado"). No se pudo confirmar el significado oficial del código 45 ni si bloquea la emisión.
- Mensaje informativo del SII: corregir declaraciones juradas de renta con inconsistencias. No hay fuente oficial que diga que bloquee boletas.
- Usa Mercado Pago. Pendiente saber si usa terminal Point Smart.

## Decisiones y hallazgos
- Cualquier ruta propia (API REST del SII, motor open source) requiere certificado digital `.pfx`, certificación del SII (set de pruebas, 10 a 15 días hábiles según un instructivo antiguo) y folios (CAF).
- El motor `dte-chile` fue renombrado a `faro-dte`: beta, 1 estrella, MIT. La ruta REST de boletas existe solo en Go y solo se probó en modo de prueba. Integración con Sheets no probada. No recomendado hoy para producción.
- Un tercero no evita un bloqueo de folios del SII (los folios se autorizan por RUT).
- Terceros con API o add-on de Sheets (precios netos, orden de magnitud, sin verificar con las páginas oficiales): OpenFactura $360.000/año (add-on oficial de Sheets), SimpleFactura Independiente $15.000/mes (API), LibreDTE hosted $40.000/mes, Mercado Pago boletas $105.600/año (requiere Point Smart).
- Certificado digital más barato verificado como proveedor acreditado y con `.pfx` descargable: Firma.cl (precio sin confirmar). Otros más baratos sin confirmar entrega de `.pfx`.
- Resolver primero la anotación: actualizar domicilio y pedir nueva verificación de actividades en sii.cl; si persiste, Formulario 2117 en la unidad del SII del domicilio.

## Plan provisional: automatizar el portal gratuito con Playwright
Riesgos: frágil ante cambios del portal, posible incumplimiento de términos de uso, login posiblemente con captcha o segundo factor (sin verificar), una boleta duplicada o errónea es difícil de revertir.

Diseño seguro:
1. Playwright (no Selenium). Primero local con navegador visible.
2. Modo dry-run: llena el formulario y se detiene antes de emitir, con captura.
3. Idempotencia por fila del Sheet: `pendiente` → `emitiendo` → `emitida` | `error` | `revisar`. Marcar `emitiendo` antes de hacer clic en emitir. Nunca reintentar solo una fila interrumpida.
4. Emitir una boleta a la vez y verificar folio y monto leídos de la pantalla contra la fila.
5. Detenerse ante cualquier pantalla inesperada; captura de pantalla y aviso.
6. Validación previa de datos (monto numérico, concepto, tope diario).
7. Reporte diario por correo.
8. Credenciales en Secret Manager, nunca en el repo.
9. Más adelante: Cloud Run Job + Cloud Scheduler, solo si el login automático es viable.

## Pendiente (necesario para empezar)
1. Volumen de boletas por día o semana.
2. Método de login al portal (clave tributaria, Clave Única o certificado).
3. Capturas o HTML de cada pantalla del flujo, desde el login hasta la boleta emitida (o sesión local con Claude in Chrome).
4. Columnas del Google Sheet y datos por boleta (monto, concepto, RUT del cliente).
5. Estado de la anotación 45 en Mi SII > Situación Tributaria > Anotaciones vigentes (texto exacto).

## Cómo retomar en local
```
git clone https://github.com/seba1095/cotizador-uber-flash
cd cotizador-uber-flash
git checkout claude/sii-boletas-automation-n9wbbi
```
Abrir Claude Code en esa carpeta, con la extensión Claude in Chrome conectada y tu sesión del SII iniciada por ti. Pedirle que lea `docs/sii-boletas/HANDOFF.md`.
