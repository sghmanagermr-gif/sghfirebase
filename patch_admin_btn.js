const fs = require('fs');
const htmlPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';
let content = fs.readFileSync(htmlPath, 'utf8');

// Add button to Admin Estadisticas panel near the Personal Registrado stat
content = content.replace(
    '<span id="stat-personal" style="font-size: 3.5rem; font-weight: 800; color: var(--primary-color); line-height: 1;">0</span>',
    '<span id="stat-personal" style="font-size: 3.5rem; font-weight: 800; color: var(--primary-color); line-height: 1;">0</span>\n                <button onclick="abrirWizardPersonal()" style="margin-top: 15px; font-size: 0.8rem; padding: 6px 12px;">+ Registrar Empleado</button>'
);

fs.writeFileSync(htmlPath, content, 'utf8');
console.log('Botón inyectado en el panel de administrador.');
