const fs = require('fs');

try {
    const mainPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';
    let mainJs = fs.readFileSync(mainPath, 'utf8');

    // The end of the input listener loop looks exactly like this:
    /*
          // Sumar todos los inputs de matrícula (.mat-input)
          document.querySelectorAll('.mat-input').forEach(input => {
              if (input.closest('div[id^="bloque-"]').style.display !== 'none') {
                  matTotal += parseInt(input.value || 0);
              }
          });
          
  
      }
    */
    // We will search for:
    // `matTotal += parseInt(input.value || 0);\r\n              }\r\n          });\r\n          `
    
    // Safer way:
    const searchRegex = /document\.querySelectorAll\('\.mat-input'\)\.forEach\(input\s*=>\s*\{([\s\S]*?)matTotal\s*\+=\s*parseInt\(input\.value\s*\|\|\s*0\);\s*\}\s*\);\s*/g;
    
    if (searchRegex.test(mainJs)) {
        mainJs = mainJs.replace(searchRegex, (match) => {
            return match + `
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
                    } else {
                        btn.disabled = true;
                        btn.style.opacity = '0.5';
                        btn.style.cursor = 'not-allowed';
                    }
                }
            }
            `;
        });
        fs.writeFileSync(mainPath, mainJs);
        console.log("SUCCESS: Patched main.js with auto-enable and update logic");
    } else {
        console.log("Could not find the target hook in main.js");
    }

} catch (err) {
    console.error(err);
}
