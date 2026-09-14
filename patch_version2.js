const fs = require('fs');
const bitacoraPath = 'C:\\Proyectos\\sgh-mr - firebase\\bitacora.md';
const pkgPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\package.json';
const indexPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';

const bitacoraEntry = `
### Hotfix Estético (v2.6.4)
- **Refactorización de UI (Action Buttons):** Se eliminaron los botones basados en emojis nativos de la tabla de personal y se sustituyeron por íconos SVG de trazo limpio (Lucide Style). Se les aplicó \`inline-flex\` con alineación centralizada, bordes sutiles, micro-sombras (\`box-shadow\`) y transiciones de color dinámicas (\`hover\`) para elevar el acabado visual a un nivel corporativo (Premium Design).
---
`;

if (fs.existsSync(bitacoraPath)) {
    fs.appendFileSync(bitacoraPath, bitacoraEntry);
}

const newVersion = "2.6.4";
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

console.log("Hotfix 2.6.4 aplicado.");
