#!/usr/bin/env node
/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║         GESTOR DE AUTOS — ARNÉS DE SEGURIDAD v2.0       ║
 * ║  Verifica integridad del sitio ANTES de hacer push.     ║
 * ║  Si algo falla, el push es bloqueado automáticamente.   ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * CHECKS:
 *   1. HTML Structure — tags malformados, código suelto después de </section>
 *   2. Strings prohibidos — textos eliminados que no deben volver
 *   3. Imágenes referenciadas — que existan en /assets/images/
 *   4. Secciones críticas — que el hero, nav, y footer estén presentes
 *   5. Doble style= en un tag — atributo duplicado que rompe el CSS
 *   6. CSS crítico — que .split-promo-section y .hero existan en styles.css
 *   7. HTML balanceado — tags estructurales <section>, <main>, etc.
 *   8. [NUEVO v2.0] Barra móvil `#mobileCallBar` obligatoria en páginas clave
 *   9. [NUEVO v2.0] Encabezado H1 único (exactamente 1 por página)
 *  10. [NUEVO v2.0] Anti-Spam: Cero bloques display:none con H1/H2 o keywords
 *  11. [NUEVO v2.0] Enlaces internos 404: Todo href="*.html" debe existir
 *  12. [NUEVO v2.0] Metadatos SEO: Presencia de <title> y rel="canonical"
 */

const fs   = require('fs');
const path = require('path');

// ─── Colores para consola ──────────────────────────────────────────────────
const C = {
  red:    (s) => `\x1b[31m${s}\x1b[0m`,
  green:  (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan:   (s) => `\x1b[36m${s}\x1b[0m`,
  bold:   (s) => `\x1b[1m${s}\x1b[0m`,
};

const ROOT   = path.resolve(__dirname, '..');
const ERRORS = [];
const WARNS  = [];

function fail(msg)  { ERRORS.push(msg); }
function warn(msg)  { WARNS.push(msg); }
function readFile(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) { fail(`Archivo no encontrado: ${rel}`); return ''; }
  return fs.readFileSync(p, 'utf8');
}

// ══════════════════════════════════════════════════════════════════════════
// CHECK 1 — HTML: código suelto después de </section> y atributos duplicados
// ══════════════════════════════════════════════════════════════════════════
function checkHtmlCorruption(file, html) {
  const lines = html.split('\n');
  lines.forEach((line, i) => {
    // Detecta el patrón de corrupción: </section>= o </div>= seguido de atributos
    if (/\<\/(?:section|div|article|main)\>[^<\s]/.test(line)) {
      fail(`[${file}:${i+1}] Código suelto después de tag de cierre: ${line.trim().slice(0, 80)}`);
    }
    // Detecta atributo style duplicado en un solo tag de apertura
    if (/<[a-zA-Z0-9]+\b[^>]*\bstyle=["'][^"']*["'][^>]*\bstyle=/i.test(line)) {
      fail(`[${file}:${i+1}] Atributo 'style' duplicado en el mismo tag: ${line.trim().slice(0, 80)}`);
    }
  });
}

// ══════════════════════════════════════════════════════════════════════════
// CHECK 2 — Strings prohibidos (textos eliminados que no deben reaparecer)
// ══════════════════════════════════════════════════════════════════════════
const FORBIDDEN = [
  { pattern: /Licencia Tipo C Motociclista Estado de México/i,  reason: 'Servicio eliminado del catálogo' },
  { pattern: /55\s*2291\s*7267/,                                reason: 'Número de teléfono antiguo eliminado' },
  { pattern: /Reparamos tu Mac/i,                               reason: 'Texto de negocio Mac — no aplica a Gestor de Autos' },
  { pattern: /Apple Consulting/i,                               reason: 'Texto Apple — no aplica a Gestor de Autos' },
  { pattern: /Lic\.\s*Erika/i,                                  reason: 'Nombre de tercero no debe aparecer públicamente' },
  { pattern: /Boleto\s*Dorado/i,                                reason: 'Boleto Dorado eliminado definitivamente del sitio' },
  { pattern: /goldenTicketModal/i,                              reason: 'Modal de Boleto Dorado eliminado definitivamente' },
  { pattern: /openNavTicket/i,                                  reason: 'Botón de Boleto Dorado eliminado definitivamente' },
];

function checkForbiddenStrings(file, content) {
  const lines = content.split('\n');
  FORBIDDEN.forEach(({ pattern, reason }) => {
    lines.forEach((line, i) => {
      if (pattern.test(line)) {
        fail(`[${file}:${i+1}] String prohibido (${reason}): "${line.trim().slice(0, 80)}"`);
      }
    });
  });
}

// ══════════════════════════════════════════════════════════════════════════
// CHECK 3 — Imágenes referenciadas en HTML que existen en disco
// ══════════════════════════════════════════════════════════════════════════
function checkImages(file, html) {
  const imgRegex = /src=["']([^"']*assets\/images\/[^"']+)["']/g;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const imgPath = match[1].replace(/^\.\.\//, '').split('?')[0];
    const fullPath = path.join(ROOT, imgPath);
    if (!fs.existsSync(fullPath)) {
      fail(`[${file}] Imagen referenciada no existe en disco: ${imgPath}`);
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════
// CHECK 4 — Secciones críticas presentes en index.html
// ══════════════════════════════════════════════════════════════════════════
function checkCriticalSections(html) {
  const required = [
    { selector: 'class="hero"',                label: 'Sección Hero' },
    { selector: 'id="inicio"',                 label: 'ID de inicio (ancla de navegación)' },
    { selector: 'id="servicios"',              label: 'Sección Servicios' },
    { selector: 'class="split-promo-section"', label: 'Sección Split Promo' },
    { selector: 'id="contacto"',               label: 'Sección Contacto' },
    { selector: '</footer>',                   label: 'Footer' },
    { selector: 'class="header"',              label: 'Barra de navegación (header)' },
  ];
  required.forEach(({ selector, label }) => {
    if (!html.includes(selector)) {
      fail(`[index.html] Sección crítica FALTANTE: ${label} (busca: ${selector})`);
    }
  });
}

// ══════════════════════════════════════════════════════════════════════════
// CHECK 5 — CSS crítico presente en styles.css
// ══════════════════════════════════════════════════════════════════════════
function checkCriticalCSS(css) {
  const required = [
    '.split-promo-section',
    '.hero',
    '.mini-slider',
    '.split-promo-left',
    '.split-promo-right',
  ];
  required.forEach((sel) => {
    if (!css.includes(sel)) {
      warn(`[styles.css] Selector CSS no encontrado: ${sel} — ¿fue eliminado accidentalmente?`);
    }
  });
}

// ══════════════════════════════════════════════════════════════════════════
// CHECK 6 — HTML balanceado (conteo básico de tags abiertos vs cerrados)
// ══════════════════════════════════════════════════════════════════════════
function checkTagBalance(file, html) {
  const voidTags = new Set(['area','base','br','col','embed','hr','img','input',
                             'link','meta','param','source','track','wbr']);
  const openRe  = /<([a-zA-Z][a-zA-Z0-9]*)\b[^>]*(?<!\/)>/g;
  const closeRe = /<\/([a-zA-Z][a-zA-Z0-9]*)>/g;

  const opens  = {};
  const closes = {};

  let m;
  while ((m = openRe.exec(html))  !== null) {
    const tag = m[1].toLowerCase();
    if (!voidTags.has(tag)) opens[tag]  = (opens[tag]  || 0) + 1;
  }
  while ((m = closeRe.exec(html)) !== null) {
    const tag = m[1].toLowerCase();
    closes[tag] = (closes[tag] || 0) + 1;
  }

  const structuralTags = ['section', 'article', 'main', 'header', 'footer',
                           'table', 'thead', 'tbody', 'tr', 'td', 'th',
                           'form', 'fieldset', 'select', 'option',
                           'ul', 'ol', 'details', 'summary'];

  structuralTags.forEach((tag) => {
    const o = opens[tag]  || 0;
    const c = closes[tag] || 0;
    if (o !== c) {
      const diff = Math.abs(o - c);
      const msg  = o > c
        ? `<${tag}> abierto ${o}x pero cerrado ${c}x (faltan ${diff} cierres)`
        : `<${tag}> cerrado ${c}x pero abierto ${o}x (hay ${diff} cierres de más)`;
      if (diff >= 2) {
        fail(`[${file}] Tags estructurales desbalanceados: ${msg}`);
      } else {
        warn(`[${file}] Posible desbalance estructural: ${msg}`);
      }
    }
  });
}

// ══════════════════════════════════════════════════════════════════════════
// CHECK 7 [v2.0] — Barra móvil (#mobileCallBar)
// ══════════════════════════════════════════════════════════════════════════
function checkMobileCallBar(file, html) {
  if (!html.includes('id="mobileCallBar"')) {
    fail(`[${file}] Falta la barra fija móvil (#mobileCallBar) — crucial para conversiones.`);
  }
}

// ══════════════════════════════════════════════════════════════════════════
// CHECK 8 [v2.0] — Encabezado H1 Único
// ══════════════════════════════════════════════════════════════════════════
function checkH1Count(file, html) {
  const h1Matches = html.match(/<h1\b/gi) || [];
  if (h1Matches.length === 0) {
    fail(`[${file}] No se encontró ninguna etiqueta <h1>.`);
  } else if (h1Matches.length > 1) {
    fail(`[${file}] Se encontraron ${h1Matches.length} etiquetas <h1> (debe haber exactamente 1).`);
  }
}

// ══════════════════════════════════════════════════════════════════════════
// CHECK 9 [v2.0] — Anti-Spam: Cero bloques ocultos con keywords/h1
// ══════════════════════════════════════════════════════════════════════════
function checkAntiSpam(file, html) {
  if (/<h[1-6]\b[^>]*style=["'][^"']*(?:display:\s*none|visibility:\s*hidden)[^"']*["']/i.test(html)) {
    fail(`[${file}] Infracción Anti-Spam: Encabezado <h1>-<h6> con display:none o visibility:hidden directo.`);
  }
  const hiddenBlockRegex = /<(?:div|span|p|section|article)\b[^>]*style=["'][^"']*(?:display:\s*none|visibility:\s*hidden)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|span|p|section|article)>/gi;
  let match;
  while ((match = hiddenBlockRegex.exec(html)) !== null) {
    if (/<h[1-6]\b/i.test(match[1])) {
      fail(`[${file}] Infracción Anti-Spam: Bloque oculto (display:none) con encabezados <h1>-<h6>.`);
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════
// CHECK 10 [v2.0] — Enlaces internos 404
// ══════════════════════════════════════════════════════════════════════════
function checkInternalLinks(file, html) {
  const linkRegex = /href=["']([a-zA-Z0-9_-]+\.html)(?:#[^"']*)?["']/g;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const targetFile = match[1];
    const fullPath = path.join(ROOT, targetFile);
    if (!fs.existsSync(fullPath)) {
      fail(`[${file}] Enlace interno roto (404): href="${targetFile}" no existe.`);
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════
// CHECK 11 [v2.0] — Metadatos SEO (<title> y canonical)
// ══════════════════════════════════════════════════════════════════════════
function checkMetaTags(file, html) {
  if (!/<title>[^<]+<\/title>/i.test(html)) {
    fail(`[${file}] Falta la etiqueta <title> o está vacía.`);
  }
  if (!/<link\s+[^>]*rel=["']canonical["'][^>]*>/i.test(html)) {
    fail(`[${file}] Falta la etiqueta <link rel="canonical">.`);
  }
}

// ══════════════════════════════════════════════════════════════════════════
// CHECK 12 [v2.0] — Integridad de Navegación de Escritorio
// ══════════════════════════════════════════════════════════════════════════
function checkDesktopNavigation(file, html) {
  if (!html.includes('class="header-contacts"')) {
    fail(`[${file}] Falta el contenedor de contactos de cabecera (.header-contacts).`);
  }
}

// ══════════════════════════════════════════════════════════════════════════
// RUNNER
// ══════════════════════════════════════════════════════════════════════════
console.log(C.bold('\n🔍 GESTOR DE AUTOS — Arnés de Seguridad v2.0\n'));
console.log(C.cyan('   📖 Manual: harness/README.md  |  Ejecución manual: node harness/check.js\n'));

const CORE_HTML_FILES = [
  'index.html',
  'alta-de-placas.html',
  'licencia-permanente-cdmx.html',
  'tramites-edomex.html',
  'cambio-de-propietario.html',
];

CORE_HTML_FILES.forEach((file) => {
  const content = readFile(file);
  if (!content) return;
  console.log(C.cyan(`  ▶ Verificando ${file}...`));
  checkHtmlCorruption(file, content);
  checkForbiddenStrings(file, content);
  checkImages(file, content);
  checkMobileCallBar(file, content);
  checkDesktopNavigation(file, content);
  checkH1Count(file, content);
  checkAntiSpam(file, content);
  checkInternalLinks(file, content);
  checkMetaTags(file, content);
  checkTagBalance(file, content);

  if (file === 'index.html') {
    checkCriticalSections(content);
  }
});

const css = readFile('styles.css');
if (css) {
  console.log(C.cyan('  ▶ Verificando styles.css...'));
  checkForbiddenStrings('styles.css', css);
  checkCriticalCSS(css);
}

const js = readFile('script.js');
if (js) {
  console.log(C.cyan('  ▶ Verificando script.js...'));
  checkForbiddenStrings('script.js', js);
}

// ─── Report ────────────────────────────────────────────────────────────────
console.log('');

if (WARNS.length > 0) {
  console.log(C.yellow(`⚠️  ${WARNS.length} advertencia(s):`));
  WARNS.forEach((w) => console.log(C.yellow(`   • ${w}`)));
  console.log('');
}

if (ERRORS.length > 0) {
  console.log(C.red(C.bold(`❌ ${ERRORS.length} error(es) encontrado(s) — PUSH BLOQUEADO:\n`)));
  ERRORS.forEach((e) => console.log(C.red(`   ✗ ${e}`)));
  console.log('\n' + C.red('Corrige los errores antes de hacer push.\n'));
  process.exit(1);
} else {
  console.log(C.green(C.bold('✅ Todos los checks pasaron — push permitido.\n')));
  process.exit(0);
}
