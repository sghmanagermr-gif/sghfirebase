const fs = require('fs');

const indexPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';
const wizardPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\personalWizard.js';
const bitacoraPath = 'C:\\Proyectos\\sgh-mr - firebase\\bitacora.md';

let success = true;

// 1. Modificar index.html
if (fs.existsSync(indexPath)) {
    let htmlContent = fs.readFileSync(indexPath, 'utf8');
    
    // Buscar el bloque del H2 actual
    const h2Old = `<h2 style="margin-top: 0; margin-bottom: 20px; font-size: 1.5rem; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
          Personal Registrado en el Plantel
        </h2>`;
    
    const h2New = `<div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
          <h2 style="margin: 0; font-size: 1.5rem; color: #0f172a;">
            Personal Registrado en el Plantel
          </h2>
          <div style="position: relative;">
            <span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #94a3b8; display: flex; align-items: center;">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </span>
            <input type="text" id="buscador-personal" placeholder="Buscar cédula o nombre..." style="padding: 8px 12px 8px 32px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px; width: 260px; outline: none; transition: all 0.2s; background: white; color: #1e293b; box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);" onfocus="this.style.borderColor='#3b82f6'; this.style.boxShadow='0 0 0 3px rgba(59,130,246,0.1)';" onblur="this.style.borderColor='#cbd5e1'; this.style.boxShadow='inset 0 1px 2px rgba(0,0,0,0.05)';">
          </div>
        </div>`;

    if (htmlContent.includes('Personal Registrado en el Plantel') && !htmlContent.includes('id="buscador-personal"')) {
        // We might have different indentation, so let's use regex
        const regexH2 = /<h2[^>]*>[\s\S]*?Personal Registrado en el Plantel[\s\S]*?<\/h2>/;
        htmlContent = htmlContent.replace(regexH2, h2New);
        fs.writeFileSync(indexPath, htmlContent);
        console.log("index.html modificado correctamente.");
    } else if (htmlContent.includes('id="buscador-personal"')) {
        console.log("Buscador ya existe en index.html.");
    } else {
        console.log("Error: No se encontró el H2 en index.html para reemplazar.");
        success = false;
    }
}

// 2. Modificar personalWizard.js
if (fs.existsSync(wizardPath)) {
    let jsContent = fs.readFileSync(wizardPath, 'utf8');
    
    const listenerCode = `
// Agregar listener para el buscador en tiempo real (Zero-Cost)
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('buscador-personal');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            const tbody = document.getElementById('tbody-personal-existente');
            if (!tbody) return;
            
            const rows = tbody.querySelectorAll('tr');
            let matchCount = 0;
            
            rows.forEach(row => {
                // Si la fila es un mensaje de estado ("Cargando...", "No hay personal..."), la ignoramos
                if (row.cells.length === 1) return; 
                
                const cedula = row.cells[0]?.textContent.toLowerCase() || '';
                const nombre = row.cells[1]?.textContent.toLowerCase() || '';
                
                if (cedula.includes(searchTerm) || nombre.includes(searchTerm)) {
                    row.style.display = '';
                    matchCount++;
                } else {
                    row.style.display = 'none';
                }
            });
            
            // Manejar caso donde no hay coincidencias
            let noMatchRow = document.getElementById('row-no-matches');
            if (matchCount === 0 && searchTerm !== '' && rows.length > 0 && rows[0].cells.length > 1) {
                if (!noMatchRow) {
                    noMatchRow = document.createElement('tr');
                    noMatchRow.id = 'row-no-matches';
                    noMatchRow.innerHTML = '<td colspan="5" style="text-align: center; padding: 20px; color: #64748b; font-style: italic;">No se encontraron resultados para "' + searchTerm + '"</td>';
                    tbody.appendChild(noMatchRow);
                } else {
                    noMatchRow.innerHTML = '<td colspan="5" style="text-align: center; padding: 20px; color: #64748b; font-style: italic;">No se encontraron resultados para "' + searchTerm + '"</td>';
                    noMatchRow.style.display = '';
                }
            } else if (noMatchRow) {
                noMatchRow.style.display = 'none';
            }
        });
    }
});
`;

    if (!jsContent.includes('id="buscador-personal"')) {
        jsContent += "\\n" + listenerCode;
        fs.writeFileSync(wizardPath, jsContent);
        console.log("personalWizard.js modificado correctamente.");
    } else {
        console.log("El listener ya existe en personalWizard.js");
    }
}

// 3. Bitácora
const bitacoraEntry = `
### Optimizacion Buscador Zero-Cost (v2.6.8)
- **Filtro Client-Side (Cero Lecturas):** A solicitud del usuario para maximizar eficiencia bajo el Spark Plan, se implementó un buscador de personal en tiempo real (por cédula y nombre). El buscador opera 100% en memoria sobre el DOM (array ya descargado), garantizando un coste de 0 lecturas adicionales a Firestore.
- **UI Premium:** Se integró un *input box* moderno en el header de la tabla de personal existente, con icono de lupa SVG integrado, transiciones de sombra y foco azul (\`#3b82f6\`) para mantener coherencia estética.
---
`;

if (success && fs.existsSync(bitacoraPath)) {
    fs.appendFileSync(bitacoraPath, bitacoraEntry);
}

// 4. Update Version
const pkgPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\package.json';
const newVersion = "2.6.8";

if (success && fs.existsSync(pkgPath)) {
    let pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.version = newVersion;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
}

if (success && fs.existsSync(indexPath)) {
    let htmlContent = fs.readFileSync(indexPath, 'utf8');
    htmlContent = htmlContent.replace(/<title>SGH - v[\d\.]+<\/title>/g, '<title>SGH - v' + newVersion + '</title>');
    htmlContent = htmlContent.replace(/(<span style="color: var\(--primary-color\);">SGH<\/span>)\s*v[\d\.]+/g, '$1 v' + newVersion);
    fs.writeFileSync(indexPath, htmlContent);
}

console.log("Version 2.6.8 aplicada.");
