const fs = require('fs');
const wizardPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\personalWizard.js';
const bitacoraPath = 'C:\\Proyectos\\sgh-mr - firebase\\bitacora.md';

if (fs.existsSync(wizardPath)) {
    let content = fs.readFileSync(wizardPath, 'utf8');

    const regexAcc = /const tdAcc = document\.createElement\('td'\);[\s\S]*?<\/button>\s*`;/m;
    
    if (regexAcc.test(content)) {
        const newTdAcc = `              const tdAcc = document.createElement('td');
              tdAcc.style.padding = '12px';
              tdAcc.style.textAlign = 'center';
              tdAcc.style.verticalAlign = 'middle';
              
              const btnEditStyle = "padding: 6px 14px; font-size: 13px; border-radius: 6px; border: 1px solid #bfdbfe; background: #eff6ff; color: #2563eb; cursor: pointer; display: inline-block; font-weight: 600; transition: all 0.2s ease; margin: 0 4px;";
              const btnDelStyle = "padding: 6px 14px; font-size: 13px; border-radius: 6px; border: 1px solid #fecaca; background: #fef2f2; color: #dc2626; cursor: pointer; display: inline-block; font-weight: 600; transition: all 0.2s ease; margin: 0 4px;";
              
              tdAcc.innerHTML = \`
                  <button class="btn-editar" style="\${btnEditStyle}" onmouseover="this.style.background='#dbeafe';" onmouseout="this.style.background='#eff6ff';" title="Editar registro">
                      Editar
                  </button>
                  <button class="btn-eliminar" style="\${btnDelStyle}" onmouseover="this.style.background='#fee2e2';" onmouseout="this.style.background='#fef2f2';" title="Eliminar registro">
                      Eliminar
                  </button>
              \`;`;
              
        content = content.replace(regexAcc, newTdAcc);
        fs.writeFileSync(wizardPath, content);
        console.log("UI patch applied successfully.");
    } else {
        console.log("Error: Could not find tdAcc logic to replace.");
    }
}

const bitacoraEntry = `
### Hotfix Estético y Usabilidad (v2.6.5)
- **Claridad de Acciones (Botones con Texto):** En respuesta a la pérdida de legibilidad reportada por el usuario ("no se sabe cuál es cuál"), se reemplazaron los íconos SVG de los botones de acción por etiquetas de texto explícitas ("Editar" y "Eliminar"). Se aplicó un estilo corporativo tipo 'Badge' o 'Pill' con colores semánticos (azul para edición, rojo para eliminación), asegurando máxima claridad funcional sin sacrificar la estética moderna.
---
`;

if (fs.existsSync(bitacoraPath)) {
    fs.appendFileSync(bitacoraPath, bitacoraEntry);
}

const pkgPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\package.json';
const indexPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';
const newVersion = "2.6.5";

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

console.log("Version 2.6.5 aplicada.");
