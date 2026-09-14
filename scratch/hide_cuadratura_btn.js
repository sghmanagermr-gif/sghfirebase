const fs = require('fs');

const wizardPath = 'c:/Proyectos/sgh-2.0/frontend/src/personalWizard.js';
const indexHtmlPath = 'c:/Proyectos/sgh-2.0/frontend/index.html';
const packageJsonPath = 'c:/Proyectos/sgh-2.0/frontend/package.json';

// 1. Modificar personalWizard.js
let wizardJs = fs.readFileSync(wizardPath, 'utf8');

const targetCode = `    if (atiende === 'SI') {
        if (cnivel) cnivel.style.display = 'block';
        if (cesp) cesp.style.display = 'block';
        if (ccuad) ccuad.style.display = 'block';
    } else {`;

const replacementCode = `    if (atiende === 'SI') {
        if (cnivel) cnivel.style.display = 'block';
        if (cesp) cesp.style.display = 'block';
        // Botón de cuadratura invisibilizado temporalmente por indicación institucional
        if (ccuad) ccuad.style.display = 'none';
    } else {`;

if (wizardJs.includes(targetCode)) {
    wizardJs = wizardJs.replace(targetCode, replacementCode);
    fs.writeFileSync(wizardPath, wizardJs, 'utf8');
    console.log('personalWizard.js actualizado: ccuad.style.display = none');
} else {
    console.warn('Target code not found in personalWizard.js, checking alternative...');
    // In case whitespace differs
    const altRegex = /if\s*\(atiende\s*===\s*'SI'\)\s*\{\s*if\s*\(cnivel\)\s*cnivel\.style\.display\s*=\s*'block';\s*if\s*\(cesp\)\s*cesp\.style\.display\s*=\s*'block';\s*if\s*\(ccuad\)\s*ccuad\.style\.display\s*=\s*'block';/g;
    if (altRegex.test(wizardJs)) {
        wizardJs = wizardJs.replace(altRegex, `if (atiende === 'SI') {\n        if (cnivel) cnivel.style.display = 'block';\n        if (cesp) cesp.style.display = 'block';\n        // Botón de cuadratura invisibilizado temporalmente\n        if (ccuad) ccuad.style.display = 'none';`);
        fs.writeFileSync(wizardPath, wizardJs, 'utf8');
        console.log('personalWizard.js actualizado mediante regex.');
    } else {
        console.error('No se pudo encontrar el bloque en personalWizard.js');
        process.exit(1);
    }
}

// 2. Modificar index.html para asegurar style="display: none !important;" en container-btn-cuadratura
let html = fs.readFileSync(indexHtmlPath, 'utf8');
html = html.replace(/<div id="container-btn-cuadratura"[^>]*>/g, '<div id="container-btn-cuadratura" style="display: none !important;">');

// También ocultar la tarjeta del dashboard si existe
html = html.replace(/<div class="glass-panel" style="padding: 24px;">\s*<h2>Cuadratura<\/h2>/g, '<div class="glass-panel" style="padding: 24px; display: none !important;">\n            <h2>Cuadratura</h2>');

// Actualizar versión a v2.11.2
html = html.replace(/<title>SGH - v2\.11\.1<\/title>/g, '<title>SGH - v2.11.2</title>');
html = html.replace(/lor: var\(--primary-color\);"\>SGH<\/span> v2\.11\.1/g, 'lor: var(--primary-color);">SGH</span> v2.11.2');
fs.writeFileSync(indexHtmlPath, html, 'utf8');
console.log('index.html actualizado a v2.11.2 con container oculto.');

// 3. Modificar package.json
let pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
pkg.version = '2.11.2';
fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2), 'utf8');
console.log('package.json actualizado a v2.11.2.');
