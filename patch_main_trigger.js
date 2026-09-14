const fs = require('fs');

const mainJsPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';
let content = fs.readFileSync(mainJsPath, 'utf8');

content = content.replace(
    'if (typeof window.abrirWizardPersonal === "function") {\n                  window.abrirWizardPersonal();\n              }',
    'if (typeof window.mostrarFormularioPersonal === "function") {\n                  window.mostrarFormularioPersonal();\n              }'
);

fs.writeFileSync(mainJsPath, content, 'utf8');
console.log('Trigger en main.js actualizado a mostrarFormularioPersonal');
