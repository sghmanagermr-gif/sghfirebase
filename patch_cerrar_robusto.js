const fs = require('fs');
const pathMain = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';

let content = fs.readFileSync(pathMain, 'utf8');

const targetStr = `                                          // Desplegar Formulario Personal SOLO si se ingresó alguna matrícula
              if (typeof window.mostrarFormularioPersonal === "function" && (matTotal > 0 || secTotal > 0)) {
                   window.mostrarFormularioPersonal();
              }`;

const replaceStr = `                                          // Desplegar Formulario Personal SOLO si se ingresó alguna matrícula
              if (typeof window.mostrarFormularioPersonal === "function" && (matTotal > 0 || secTotal > 0)) {
                   window.mostrarFormularioPersonal();
              } else if (typeof window.cerrarFormularioPersonal === "function") {
                   window.cerrarFormularioPersonal();
              }`;

// Manejar posibles problemas de encoding / \r\n con regex
const targetRegex = /\/\/ Desplegar Formulario Personal SOLO si se ingresó alguna matrícula\s*if \(typeof window\.mostrarFormularioPersonal === "function" && \(matTotal > 0 \|\| secTotal > 0\)\) \{\s*window\.mostrarFormularioPersonal\(\);\s*\}/g;

if (targetRegex.test(content)) {
    content = content.replace(targetRegex, replaceStr);
    fs.writeFileSync(pathMain, content, 'utf8');
    console.log('Archivo main.js actualizado exitosamente (cerrarFormularioPersonal agregado).');
} else {
    console.log('No se encontro la cadena objetivo en main.js (cerrarFormularioPersonal).');
}
