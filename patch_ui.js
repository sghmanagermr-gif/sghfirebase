const fs = require('fs');
const wizardPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\personalWizard.js';
const bitacoraPath = 'C:\\Proyectos\\sgh-mr - firebase\\bitacora.md';

if (fs.existsSync(wizardPath)) {
    let content = fs.readFileSync(wizardPath, 'utf8');

    const regexBtn = /const btnEdit = document\.createElement\('button'\);[\s\S]*?tdAcciones\.appendChild\(btnDel\);/;
    if(regexBtn.test(content)) {
        let tdAccionesLogic = "              const actionContainer = document.createElement('div');\n" +
"              actionContainer.style.display = 'flex';\n" +
"              actionContainer.style.gap = '10px';\n" +
"              actionContainer.style.justifyContent = 'center';\n" +
"              \n" +
"              const baseBtnStyle = 'width: 34px; height: 34px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; color: #64748b; box-shadow: 0 1px 2px rgba(0,0,0,0.05);';\n" +
"\n" +
"              const btnEdit = document.createElement('button');\n" +
"              btnEdit.innerHTML = '<svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7\"></path><path d=\"M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z\"></path></svg>';\n" +
"              btnEdit.style.cssText = baseBtnStyle;\n" +
"              btnEdit.onmouseover = () => { btnEdit.style.background = '#f0fdf4'; btnEdit.style.borderColor = '#bbf7d0'; btnEdit.style.color = '#16a34a'; btnEdit.style.transform = 'translateY(-1px)'; };\n" +
"              btnEdit.onmouseout = () => { btnEdit.style.background = 'white'; btnEdit.style.borderColor = '#e2e8f0'; btnEdit.style.color = '#64748b'; btnEdit.style.transform = 'none'; };\n" +
"              \n" +
"              const btnDel = document.createElement('button');\n" +
"              btnDel.innerHTML = '<svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"3 6 5 6 21 6\"></polyline><path d=\"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2\"></path></svg>';\n" +
"              btnDel.style.cssText = baseBtnStyle;\n" +
"              btnDel.onmouseover = () => { btnDel.style.background = '#fef2f2'; btnDel.style.borderColor = '#fecaca'; btnDel.style.color = '#dc2626'; btnDel.style.transform = 'translateY(-1px)'; };\n" +
"              btnDel.onmouseout = () => { btnDel.style.background = 'white'; btnDel.style.borderColor = '#e2e8f0'; btnDel.style.color = '#64748b'; btnDel.style.transform = 'none'; };\n" +
"\n" +
"              actionContainer.appendChild(btnEdit);\n" +
"              actionContainer.appendChild(btnDel);\n" +
"              tdAcciones.style.textAlign = 'center';\n" +
"              tdAcciones.style.verticalAlign = 'middle';\n" +
"              tdAcciones.appendChild(actionContainer);";
              
        content = content.replace(regexBtn, tdAccionesLogic);
        fs.writeFileSync(wizardPath, content);
        console.log("UI patch applied via regex.");
    } else {
         console.log("Error: Could not find old UI logic.");
    }
}

const bitacoraEntry = "\n### Tarea (Diseño y UI)\n" +
"- **Refactorización de Botones de Acción (Personal):** Se eliminaron los botones basados en emojis y padding excesivo en la tabla de `cargos_personal`. Se implementó un diseño moderno basado en SVG (Lucide-style), flexbox gap (10px) y micro-animaciones en `hover` (cambio de color dinámico y traslación) para garantizar una interfaz de usuario premium.\n---\n";

if (fs.existsSync(bitacoraPath)) {
    fs.appendFileSync(bitacoraPath, bitacoraEntry);
}
