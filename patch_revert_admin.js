const fs = require('fs');
const htmlPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';
let content = fs.readFileSync(htmlPath, 'utf8');

content = content.replace(
    '<span id="stat-personal" style="font-size: 3.5rem; font-weight: 800; color: var(--primary-color); line-height: 1;">0</span>\n                <button onclick="abrirWizardPersonal()" style="margin-top: 15px; font-size: 0.8rem; padding: 6px 12px;">+ Registrar Empleado</button>',
    '<span id="stat-personal" style="font-size: 3.5rem; font-weight: 800; color: var(--primary-color); line-height: 1;">0</span>'
);

fs.writeFileSync(htmlPath, content, 'utf8');
console.log('Botón revertido en el panel de administrador.');
