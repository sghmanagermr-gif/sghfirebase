const fs = require('fs');

try {
    // 1. Fix main.js
    const mainJsPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';
    let mainJs = fs.readFileSync(mainJsPath, 'utf8');

    // Fix closest('div[id^="bloque-"]') null references
    const bugRegex = /if\s*\(\s*inp\.closest\('div\[id\^="bloque-"\]'\)\.style\.display\s*!==\s*'none'\s*\)/g;
    const safeReplacement = `const b1 = inp.closest('div[id^="bloque-"]'); const b2 = inp.closest('#cont-secciones-detalle'); if ((b1 && b1.style.display !== 'none') || (b2 && b2.style.display !== 'none'))`;
    
    mainJs = mainJs.replace(bugRegex, safeReplacement);

    // Add logic to hide Vacantes if only media, and auto-enable btn-guardar-matricula
    // Let's find where to insert it. We'll find `const tieneBasica = ` if it exists, else insert it inside the input listener.
    const inputListenerRegex = /document\.getElementById\('contenedor-matricula'\)\?\.addEventListener\('input',\s*\(e\)\s*=>\s*\{([\s\S]*?)document\.getElementById\('lbl-secciones-total'\)\.textContent\s*=\s*secTotal;/;
    
    if (inputListenerRegex.test(mainJs)) {
        mainJs = mainJs.replace(inputListenerRegex, (match) => {
            return match + `
        
        // Auto-habilitar botón Guardar para Media
        const vacToggle = document.getElementById('contenedor-pregunta-vacantes');
        if (vacToggle && vacToggle.style.display === 'none') {
            const btnGuardar = document.getElementById('btn-guardar-matricula');
            if (matTotal > 0 && secTotal > 0 && btnGuardar) {
                btnGuardar.disabled = false;
                btnGuardar.style.opacity = '1';
                btnGuardar.style.cursor = 'pointer';
                btnGuardar.style.background = '#003399';
            } else if (btnGuardar) {
                btnGuardar.disabled = true;
                btnGuardar.style.opacity = '0.5';
                btnGuardar.style.cursor = 'not-allowed';
                btnGuardar.style.background = '#94a3b8';
            }
        }`;
        });
    }

    // Fix the display of Vacantes in initialization
    // Let's insert it inside `_renderizarDetalleSecciones` call or at the end of initialization
    const initRegex = /_renderizarDetalleSecciones\(planes,\s*savedSeccionesPlanes\);/;
    if (initRegex.test(mainJs)) {
        mainJs = mainJs.replace(initRegex, `_renderizarDetalleSecciones(planes, savedSeccionesPlanes);
        
        const tieneBasica = ("20000" in planes) || ("21000" in planes);
        const contVacantes = document.getElementById('contenedor-pregunta-vacantes');
        if (contVacantes) {
            contVacantes.style.display = tieneBasica ? 'flex' : 'none';
        }
        
        if (!tieneBasica && document.getElementById('btn-guardar-matricula')) {
             document.getElementById('btn-guardar-matricula').style.opacity = '0.5';
             document.getElementById('btn-guardar-matricula').disabled = true;
        }
        `);
    }

    fs.writeFileSync(mainJsPath, mainJs);
    console.log("Fixed main.js!");

    // 2. Fix index.html
    const indexHtmlPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';
    let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

    // Replace the div holding vacantes to add the id
    const targetDiv = '<div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid \r\n#f1f5f9; padding-bottom: 15px;">\r\n                <div>\r\n                  <h4 style="margin: 0; color: #0f172a; font-size: 1rem;">¿El plantel tiene Vacantes Físicas?</h4>';
    const targetDiv2 = '<div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid \n#f1f5f9; padding-bottom: 15px;">\n                <div>\n                  <h4 style="margin: 0; color: #0f172a; font-size: 1rem;">¿El plantel tiene Vacantes Físicas?</h4>';
    
    // We can also use a regex to be safe with line endings
    const replaceHtmlRegex = /<div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid \r?\n?#f1f5f9; padding-bottom: 15px;">(\s*<div>\s*<h4 style="margin: 0; color: #0f172a; font-size: 1rem;">¿El plantel tiene Vacantes Físicas\?<\/h4>)/;
    
    if (replaceHtmlRegex.test(indexHtml)) {
        indexHtml = indexHtml.replace(replaceHtmlRegex, '<div id="contenedor-pregunta-vacantes" style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">$1');
        fs.writeFileSync(indexHtmlPath, indexHtml);
        console.log("Fixed index.html!");
    } else {
        console.log("Could not find Vacantes target in index.html");
    }

} catch (err) {
    console.error(err);
}
