const fs = require('fs');

try {
    const mainPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';
    let mainJs = fs.readFileSync(mainPath, 'utf8');

    // Find the end of the input listener, which is right before `// --- Lógicas Algorítmicas Migradas de sgh_gas ---`
    // Actually, it's:
    //      }
    //  });
    //
    //  // --- Lógicas Algorítmicas Migradas de sgh_gas ---
    
    // So let's search for:
    const targetPos = mainJs.indexOf('// --- L');
    if (targetPos !== -1) {
        // Find the `});` right before it
        const endListenerPos = mainJs.lastIndexOf('});', targetPos);
        
        if (endListenerPos !== -1 && !mainJs.includes('Auto-habilitar botón Guardar para Media')) {
            const injectCode = `
          // Actualizar vista
          if (document.getElementById('lbl-matricula-total')) document.getElementById('lbl-matricula-total').textContent = matTotal;
          if (document.getElementById('inp-matricula-total')) document.getElementById('inp-matricula-total').value = matTotal;
          
          // Auto-habilitar botón Guardar para Media
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
                      btn.disabled = true;
                      btn.style.opacity = '0.5';
                      btn.style.cursor = 'not-allowed';
                      btn.style.background = '#94a3b8';
                  }
              }
          }
`;
            // Insert it right before `});`
            mainJs = mainJs.substring(0, endListenerPos) + injectCode + mainJs.substring(endListenerPos);
            fs.writeFileSync(mainPath, mainJs);
            console.log("SUCCESS: Patched main.js with auto-enable logic");
        } else {
            console.log("Already patched or could not find `});`");
        }
    } else {
        console.log("Could not find the target hook in main.js");
    }

} catch (err) {
    console.error(err);
}
