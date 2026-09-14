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
              
              const btnEditStyle = "width: 32px; height: 32px; padding: 0; border-radius: 6px; border: 1px solid #bfdbfe; background: #eff6ff; color: #2563eb; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; flex-shrink: 0;";
              const btnDelStyle = "width: 32px; height: 32px; padding: 0; border-radius: 6px; border: 1px solid #fecaca; background: #fef2f2; color: #dc2626; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; flex-shrink: 0;";
              
              tdAcc.innerHTML = \`
                  <div style="display: flex; flex-direction: row; flex-wrap: nowrap; gap: 8px; justify-content: center; align-items: center; width: 100%;">
                      <button class="btn-editar" style="\${btnEditStyle}" onmouseover="this.style.background='#dbeafe';" onmouseout="this.style.background='#eff6ff';" title="Editar registro">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button class="btn-eliminar" style="\${btnDelStyle}" onmouseover="this.style.background='#fee2e2';" onmouseout="this.style.background='#fef2f2';" title="Eliminar registro">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                      </button>
                  </div>
              \`;`;
              
        content = content.replace(regexAcc, newTdAcc);
        fs.writeFileSync(wizardPath, content);
        console.log("UI patch applied successfully.");
    } else {
        console.log("Error: Could not find tdAcc logic to replace.");
    }
}

const bitacoraEntry = `
### Corrección de Alineación (v2.6.7)
- **Flexbox Horizontal Forzado:** Para solucionar el apilamiento vertical no deseado de los botones ("uno al lado del otro"), se envolvió el contenido de la celda de acciones en un contenedor \`div\` con la propiedad estricta \`display: flex; flex-direction: row; flex-wrap: nowrap\`. Esto garantiza que los íconos de edición y eliminación se mantengan alineados horizontalmente independientemente del ancho de la tabla.
---
`;

if (fs.existsSync(bitacoraPath)) {
    fs.appendFileSync(bitacoraPath, bitacoraEntry);
}

const pkgPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\package.json';
const indexPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';
const newVersion = "2.6.7";

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

console.log("Version 2.6.7 aplicada.");
