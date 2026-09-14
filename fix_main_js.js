const fs = require('fs');
const path = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';

let content = fs.readFileSync(path, 'utf8');

// Replace Chunk 1
const chunk1 = `          // Auto-habilitar botón Guardar para Media
          const vacToggle = document.getElementById('contenedor-pregunta-vacantes');
          if (vacToggle && vacToggle.style.display === 'none') {
              const tieneSec = Array.from(document.querySelectorAll('.sec-anio-input')).some(inp => {
                  const b1 = inp.closest('div[id^="bloque-"]'); const b2 = inp.closest('#cont-secciones-detalle'); 
                  return ((b1 && b1.style.display !== 'none') || (b2 && b2.style.display !== 'none')) && parseInt(inp.value) > 0;
              });
              const btn = document.getElementById('btn-guardar-matricula');
              if (btn) {
                  if (matTotal > 0 && tieneSec) {
                      btn.disabled = false;
                      btn.style.opacity = '1';
                      btn.style.cursor = 'pointer';
                      btn.style.background = '#003399'; // ensure it looks active
                  } else {
                      /* button always enabled */
                  }
              }
          }`;

if (content.includes(chunk1)) {
    content = content.replace(chunk1, `          // El botón siempre permanece activo según requerimiento. No se requiere auto-habilitarlo.`);
    console.log("Chunk 1 replaced.");
} else {
    console.log("Chunk 1 NOT FOUND!");
}

// Replace Chunk 2
const chunk2 = `        const btnGuardar = document.getElementById('btn-guardar-matricula');
        if (val === 'NO') {
            window._VACANTES_TEMP = {};
            if (btnGuardar) {
                btnGuardar.disabled = false;
                btnGuardar.style.cursor = 'pointer';
                btnGuardar.style.opacity = '1';
            }
        } else if (val === 'SI') {
            if (btnGuardar) {
                btnGuardar.disabled = true;
                btnGuardar.style.cursor = 'not-allowed';
                btnGuardar.style.opacity = '0.5';
            }`;

const chunk2Repl = `        if (val === 'NO') {
            window._VACANTES_TEMP = {};
        } else if (val === 'SI') {`;

if (content.includes(chunk2)) {
    content = content.replace(chunk2, chunk2Repl);
    console.log("Chunk 2 replaced.");
} else {
    console.log("Chunk 2 NOT FOUND!");
}

fs.writeFileSync(path, content, 'utf8');
console.log("File saved successfully.");
