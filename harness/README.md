# 🔒 ARNÉS DE SEGURIDAD — Gestor de Autos
### Manual Completo de Uso v1.0

---

## 📍 ¿Dónde está?

```
gestordeautos/
└── harness/
    ├── check.js          ← El arnés (script principal de verificación)
    ├── pre-push.sh       ← El hook que Git llama antes de cada push
    ├── install-hook.sh   ← Script de instalación (corre 1 sola vez)
    └── README.md         ← Este manual
```

El hook instalado vive en:
```
gestordeautos/.git/hooks/pre-push
```

---

## 🤔 ¿Para qué sirve?

El arnés es una **barrera de seguridad automática** que revisa el código del sitio **antes de que llegue a producción** (GitHub Pages / dominio público).

**Sin arnés:** código roto → `git push` → producción rota → clientes ven errores.  
**Con arnés:** código roto → `git push` → **BLOQUEADO** → nadie ve nada → tú corriges.

---

## ✅ ¿Qué verifica?

| # | Check | ¿Qué detecta? | Nivel |
|---|-------|--------------|-------|
| 1 | **HTML Corruption** | Código suelto después de `</section>`, `</div>` | ❌ ERROR |
| 2 | **Doble style=** | Atributo `style` duplicado en un mismo tag | ❌ ERROR |
| 3 | **Strings prohibidos** | Servicios eliminados, teléfonos viejos, textos de otro negocio | ❌ ERROR |
| 4 | **Imágenes faltantes** | Imágenes referenciadas en HTML que no existen en disco | ❌ ERROR |
| 5 | **Secciones críticas** | Hero, Servicios, Split Promo, Contacto, Footer, Header | ❌ ERROR |
| 6 | **CSS crítico** | Selectores CSS clave que no deben borrarse accidentalmente | ⚠️ WARN |
| 7 | **HTML balanceado** | Tags estructurales `<section>`, `<header>` sin cerrar | ❌ ERROR |

### Strings prohibidos configurados actualmente:
- `Licencia Tipo C Motociclista Estado de México` → servicio eliminado
- `55 2291 7267` → número de teléfono antiguo
- `Reparamos tu Mac` → texto de negocio anterior
- `Apple Consulting` → texto Apple que no aplica
- `Lic. Erika` → nombre de tercero no debe aparecer

---

## 🚀 ¿Cómo ejecutarlo?

### Automático (cada git push)
Una vez instalado el hook, **no tienes que hacer nada**. Cada vez que ejecutes:
```sh
git push origin main
```
El arnés corre automáticamente antes de enviar el código.

### Manual (cuando quieras)
```sh
node harness/check.js
```

---

## ⚙️ Instalación (solo la primera vez)

Si clonas el repo en una máquina nueva o el hook deja de funcionar:
```sh
sh harness/install-hook.sh
```

**Requisito:** Node.js instalado. Verificar con:
```sh
node --version
```
Si no está instalado: https://nodejs.org

---

## 📊 ¿Cómo leer los resultados?

### ✅ Todo OK — Push permitido
```
✅ Todos los checks pasaron — push permitido.
```
El código sube a producción sin problema.

### ⚠️ Advertencias — Push permitido pero revisa
```
⚠️  2 advertencia(s):
   • [index.html] Posible desbalance estructural: <section> ...
```
El push sigue adelante pero algo merece atención. No es urgente pero conviene revisar.

### ❌ Errores — Push BLOQUEADO
```
❌ 2 error(es) encontrado(s) — PUSH BLOQUEADO:

   ✗ [index.html:1386] Código suelto después de tag de cierre: </section>="width...
   ✗ [index.html] Imagen referenciada no existe en disco: assets/images/foto.png
```
El push **no se realiza**. Debes corregir cada error listado antes de intentar de nuevo.

---

## 🔧 ¿Cómo agregar nuevas reglas?

Edita `harness/check.js`:

### Agregar un string prohibido
```js
// En el array FORBIDDEN (línea ~32):
{ pattern: /texto que no debe aparecer/i, reason: 'Razón por la que está prohibido' },
```

### Agregar una sección crítica requerida
```js
// En checkCriticalSections() (línea ~88):
{ selector: 'id="mi-nueva-seccion"', label: 'Mi Nueva Sección' },
```

### Agregar un selector CSS requerido
```js
// En checkCriticalCSS() (línea ~112):
'.mi-nuevo-selector',
```

Después de editar, corre `node harness/check.js` para verificar que el propio arnés funciona.

---

## 🚨 ¿Qué hacer si el push está bloqueado?

1. Lee el error con calma — te dice el archivo y la línea exacta
2. Abre el archivo indicado y busca la línea del error
3. Corrige el problema
4. Vuelve a correr `node harness/check.js` para confirmar que pasó
5. Vuelve a hacer `git push`

**Si necesitas hacer push de emergencia sin el arnés** (no recomendado):
```sh
git push origin main --no-verify
```
> ⚠️ Solo úsalo si sabes exactamente qué estás haciendo y por qué.

---

## 📋 Archivos que verifica

| Archivo | Checks que aplica |
|---------|------------------|
| `index.html` | Todos (corruption, forbidden, images, sections, balance) |
| `alta-de-placas.html` | Corruption, forbidden, images |
| `licencia-permanente-cdmx.html` | Corruption, forbidden, images |
| `tramites-edomex.html` | Corruption, forbidden, images |
| `cambio-de-propietario.html` | Corruption, forbidden, images |
| `styles.css` | Forbidden strings, CSS crítico |
| `script.js` | Forbidden strings |

---

## 🗂️ Flujo completo visualizado

```
Tu cambio de código
       ↓
   git add .
       ↓
 git commit -m "..."
       ↓
  git push origin main
       ↓
  .git/hooks/pre-push  ← Git llama esto automáticamente
       ↓
  node harness/check.js
       ↓
  ┌────────────────────────────────────┐
  │ ¿Encontró errores?                 │
  │                                    │
  │  NO → ✅ Push permitido            │
  │         Código llega a GitHub      │
  │         GitHub Pages despliega     │
  │         Producción actualizada     │
  │                                    │
  │  SÍ → ❌ Push BLOQUEADO            │
  │         Muestra errores            │
  │         Código NO sale             │
  │         Producción intacta         │
  └────────────────────────────────────┘
```

---

*Arnés de Seguridad v1.0 — Gestor de Autos*  
*Creado: Julio 2026*
