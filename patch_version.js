const fs = require('fs');
const bitacoraPath = 'C:\\Proyectos\\sgh-mr - firebase\\bitacora.md';
const pkgPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\package.json';
const indexPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';

const bitacoraEntry = `
### Hotfix (v2.6.2)
- **Extracción de Variables de Sesión (Zero-Cost):** Se identificó que la aplicación no almacena los datos de sesión en \`localStorage\` directamente, lo que causaba el fallo silencioso en la carga de la tabla. Se inyectaron variables globales dinámicas (\`window.sgh_user_data\` y \`window.currentPlantelDEA\`) dentro de los observadores de sesión nativos de Firebase en \`main.js\`. Esto permite a los módulos independientes como \`personalWizard.js\` consultar el código DEA en tiempo de ejecución de manera segura y precisa.
---
`;

if (fs.existsSync(bitacoraPath)) {
    fs.appendFileSync(bitacoraPath, bitacoraEntry);
}

const newVersion = "2.6.2";
if (fs.existsSync(pkgPath)) {
    let pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.version = newVersion;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
}

if (fs.existsSync(indexPath)) {
    let htmlContent = fs.readFileSync(indexPath, 'utf8');
    htmlContent = htmlContent.replace(/<title>SGH - v[\d\.]+<\/title>/g, '<title>SGH - v' + newVersion + '</title>');
    htmlContent = htmlContent.replace(/(<span style="color: var\(--primary-color\);">SGH<\/span>)\s*v[\d\.]+/g, '$1 v' + newVersion);
    fs.writeFileSync(indexPath, htmlContent);
}

console.log("Hotfix 2.6.2 aplicado.");
