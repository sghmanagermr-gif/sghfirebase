const fs = require('fs');
const pathMain = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';

let content = fs.readFileSync(pathMain, 'utf8');

const targetStr = `    // Mostrar Formulario Personal si ya hay matrícula registrada (Carga inicial)
    if (dataParcial && dataParcial.matricula && Object.keys(dataParcial.matricula).length > 0) {
        if (typeof window.mostrarFormularioPersonal === "function") {
            window.mostrarFormularioPersonal();
        }
    }`;

const replaceStr = `    // Mostrar Formulario Personal si ya hay matrícula registrada (Carga inicial)
    let hasData = false;
    if (dataParcial && dataParcial.matricula) {
        const checkValues = (obj) => {
            for (let key in obj) {
                if (typeof obj[key] === 'number' && obj[key] > 0) return true;
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    if (checkValues(obj[key])) return true;
                }
            }
            return false;
        };
        hasData = checkValues(dataParcial.matricula);
    }

    if (hasData && typeof window.mostrarFormularioPersonal === "function") {
        window.mostrarFormularioPersonal();
    }`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replaceStr);
    fs.writeFileSync(pathMain, content, 'utf8');
    console.log('Archivo main.js actualizado exitosamente con lógica robusta.');
} else {
    console.log('No se encontro la cadena objetivo en main.js.');
}
