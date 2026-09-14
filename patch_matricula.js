const fs = require('fs');
const path = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';
let content = fs.readFileSync(path, 'utf8');

const target = `              await safeSetDoc(docRef, payload, {
                  mergeFields: ['secciones', 'secciones-planes', 'matricula', 'vacantes', 'datos_completados', 'ultima_actualizacion']
              });
              showToast("¡Datos del plantel actualizados con éxito!", "success");`;

const replacement = `              await safeSetDoc(docRef, payload, {
                  mergeFields: ['secciones', 'secciones-planes', 'matricula', 'vacantes', 'datos_completados', 'ultima_actualizacion']
              });

              // Actualizar el input de la tarjeta con el nuevo total guardado
              const inpMatTotal = document.getElementById('inp-matricula-total');
              if (inpMatTotal) inpMatTotal.value = matTotal;

              showToast("¡Datos del plantel actualizados con éxito!", "success");`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Reemplazo exitoso.');
} else {
    console.log('No se encontró el texto objetivo.');
}
