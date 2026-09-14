const fs = require('fs');
const bitacoraPath = 'C:\\Proyectos\\sgh-mr - firebase\\bitacora.md';
const pkgPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\package.json';
const indexPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';

const bitacoraEntry = `
### Hotfix (v2.6.1)
- **Corrección Lógica de Extracción DEA:** Se identificó que la variable global \`window.currentPlantelDEA\` no estaba siendo seteada en la vista principal por el archivo \`main.js\`. Por lo tanto, la función \`mostrarFormularioPersonal()\` fue refactorizada para extraer de forma autónoma el \`codigoDEA\` del colegio directamente desde \`localStorage\` (ya sea de \`plantelSeleccionado\` o \`sgh_user\`), asegurando la carga exitosa de los registros en la tabla.
---
`;

if (fs.existsSync(bitacoraPath)) {
    fs.appendFileSync(bitacoraPath, bitacoraEntry);
}

const newVersion = "2.6.1";
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

console.log("Hotfix aplicado. Versión " + newVersion);
