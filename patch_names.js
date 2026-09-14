const fs = require('fs');
const wizardPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\personalWizard.js';
const bitacoraPath = 'C:\\Proyectos\\sgh-mr - firebase\\bitacora.md';
const pkgPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\package.json';
const indexPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';

// 1. Corregir personalWizard.js
if (fs.existsSync(wizardPath)) {
    let content = fs.readFileSync(wizardPath, 'utf8');
    content = content.replace(
        "tdNom.textContent = (data['apellidos-nombres'] || data.nombre || 'N/A').toUpperCase();",
        "tdNom.textContent = (data['nombre-apellido'] || data['apellidos-nombres'] || data.nombre || 'N/A').toUpperCase();"
    );
    fs.writeFileSync(wizardPath, content);
}

// 2. Incrementar versión y Bitácora
const newVersion = "2.6.3";

const bitacoraEntry = `
### Hotfix (v2.6.3)
- **Corrección de Mapeo de Datos:** Se ajustó la llave de lectura de la colección \`cargos_personal\` para los nombres del personal en la tabla, de \`apellidos-nombres\` a \`nombre-apellido\`, evitando que se renderizaran como "N/A".
---
`;

if (fs.existsSync(bitacoraPath)) {
    fs.appendFileSync(bitacoraPath, bitacoraEntry);
}

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

console.log("Hotfix 2.6.3 aplicado exitosamente.");
