const fs = require('fs');

try {
    const indexPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';
    let idxHtml = fs.readFileSync(indexPath, 'utf8');

    // 1. Enable button in index.html
    const badBtn = '<button type="submit" id="btn-guardar-matricula" disabled style="width: 100%; text-transform: uppercase; padding: 14px; cursor: not-allowed; opacity: 0.5;">Guardar Datos y Continuar</button>';
    const goodBtn = '<button type="submit" id="btn-guardar-matricula" style="width: 100%; text-transform: uppercase; padding: 14px; cursor: pointer; opacity: 1; background: #003399; color: white; font-weight: bold; border-radius: 8px; border: none;">Guardar Datos y Continuar</button>';
    
    if (idxHtml.includes(badBtn)) {
        idxHtml = idxHtml.replace(badBtn, goodBtn);
        console.log("SUCCESS: Button enabled in index.html");
    } else {
        // Fallback for button replace
        const reBtn = /<button type="submit" id="btn-guardar-matricula"[^>]*>Guardar Datos y Continuar<\/button>/;
        if (reBtn.test(idxHtml)) {
            idxHtml = idxHtml.replace(reBtn, goodBtn);
            console.log("SUCCESS: Button enabled via fallback regex in index.html");
        } else {
            console.log("ERROR: Could not find Guardar button in index.html");
        }
    }
    
    fs.writeFileSync(indexPath, idxHtml);


    const mainPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';
    let mainJs = fs.readFileSync(mainPath, 'utf8');

    // 2. Remove conditional enable logic in main.js
    const oldLogic = `                const btn = document.getElementById('btn-guardar-matricula');
                if (btn) {
                    if (matTotal > 0 && tieneSec) {
                        btn.disabled = false;
                        btn.style.opacity = '1';
                        btn.style.cursor = 'pointer';
                        btn.style.background = '#003399'; // ensure it looks active
                    } else {
                        /* button always enabled */
                    }
                }`;
    
    const newLogic = `                // Button is always enabled now, validation happens on submit`;
    
    if (mainJs.includes(oldLogic)) {
        mainJs = mainJs.replace(oldLogic, newLogic);
        console.log("SUCCESS: Removed disable logic in main.js");
    } else {
        console.log("ERROR: Could not find old disable logic in main.js");
    }

    // Also remove the bottom enabler just to be clean
    const bottomEnabler = `      // Habilitar botón de guardar
      const btnGuardar = document.getElementById('btn-guardar-matricula');
      if (btnGuardar) {
          btnGuardar.disabled = false;
          btnGuardar.style.cursor = 'pointer';
          btnGuardar.style.opacity = '1';
      }`;
    // due to unicode comments, we use regex
    const bottomRe = /\/\/\s*Habilitar bot.n de guardar\s*const btnGuardar = document\.getElementById\('btn-guardar-matricula'\);\s*if\s*\(btnGuardar\)\s*\{\s*btnGuardar\.disabled = false;\s*btnGuardar\.style\.cursor = 'pointer';\s*btnGuardar\.style\.opacity = '1';\s*\}/;
    if (bottomRe.test(mainJs)) {
        mainJs = mainJs.replace(bottomRe, '');
        console.log("SUCCESS: Removed redundant bottom enabler");
    }
    
    fs.writeFileSync(mainPath, mainJs);

} catch (e) {
    console.error(e);
}
