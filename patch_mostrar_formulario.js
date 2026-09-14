const fs = require('fs');
const path = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';
let content = fs.readFileSync(path, 'utf8');

const targetRegex = /\/\/ Guardar los datos cuando el director llene el form\s*const form = document\.getElementById\('plantel-form'\);/g;

const replaceStr = `// Mostrar Formulario Personal si ya hay matrícula registrada (Carga inicial)
    if (dataParcial && dataParcial.matricula && Object.keys(dataParcial.matricula).length > 0) {
        if (typeof window.mostrarFormularioPersonal === "function") {
            window.mostrarFormularioPersonal();
        }
    }

    // Guardar los datos cuando el director llene el form
    const form = document.getElementById('plantel-form');`;

if (targetRegex.test(content)) {
    content = content.replace(targetRegex, replaceStr);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Archivo main.js actualizado exitosamente.');
} else {
    console.log('No se encontro la cadena objetivo en main.js.');
}
