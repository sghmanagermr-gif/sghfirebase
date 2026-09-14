const fs = require('fs');

try {
    // 1. Fix main.js: auto-enable button logic
    const mainPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';
    let mainJs = fs.readFileSync(mainPath, 'utf8');

    // We want to insert the check at the end of the 'input' event listener for 'contenedor-matricula'.
    // A reliable way is to search for `document.getElementById('lbl-matricula-total').textContent = matTotal;`
    // or just search for the end of the input listener.
    const hookStr = `document.getElementById('lbl-matricula-total').textContent = matTotal;`;
    if (mainJs.includes(hookStr)) {
        // Find the index and insert after
        const index = mainJs.indexOf(hookStr) + hookStr.length;
        // make sure we don't insert it multiple times
        if (!mainJs.includes('// Auto-habilitar botón Guardar para Media')) {
            const injectCode = `
            
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
            mainJs = mainJs.substring(0, index) + injectCode + mainJs.substring(index);
            fs.writeFileSync(mainPath, mainJs);
            console.log("Added auto-enable logic to main.js");
        } else {
             console.log("auto-enable logic already present");
        }
    } else {
        console.log("Could not find hookStr in main.js");
    }

    // 2. Fix index.html parent ID
    const idxPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';
    let idxHtml = fs.readFileSync(idxPath, 'utf8');
    const searchDiv = 'id="toggle-vacantes"';
    const tIndex = idxHtml.indexOf(searchDiv);
    if (tIndex !== -1) {
        // trace back to the parent `<div ` before `<div>` with h4
        // The HTML looks roughly like:
        // <div style="..."> <!-- parent -->
        //   <div> <h4...>...</h4> <p...>...</div>
        //   <div id="toggle-vacantes"...>
        
        // Find the nearest `<div ` BEFORE the `<div ` that contains h4
        const textToFind = '¿El plantel tiene Vacantes';
        const vacTextIndex = idxHtml.indexOf(textToFind);
        if (vacTextIndex !== -1 && vacTextIndex < tIndex) {
            // Find the `<div>` enclosing the text
            const innerDiv = idxHtml.lastIndexOf('<div', vacTextIndex);
            // Find the `<div` enclosing THAT div (the parent)
            const parentDiv = idxHtml.lastIndexOf('<div', innerDiv - 1);
            if (parentDiv !== -1) {
                const parentTag = idxHtml.substring(parentDiv, idxHtml.indexOf('>', parentDiv));
                if (!parentTag.includes('id="contenedor-pregunta-vacantes"')) {
                    idxHtml = idxHtml.substring(0, parentDiv) + '<div id="contenedor-pregunta-vacantes"' + idxHtml.substring(parentDiv + 4);
                    fs.writeFileSync(idxPath, idxHtml);
                    console.log("Added parent ID in index.html");
                } else {
                    console.log("Parent ID already exists in index.html");
                }
            }
        }
    } else {
         console.log("toggle-vacantes not found in index.html");
    }

} catch (e) {
    console.error(e);
}
