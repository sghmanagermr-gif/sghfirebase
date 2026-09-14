const fs = require('fs');

try {
    const mainPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';
    let mainJs = fs.readFileSync(mainPath, 'utf8');

    // 1. Insert the forceSave logic in onsubmit
    // We look for:
    /*
            document.querySelectorAll('.sec-anio-input').forEach(inp => {
                const b1 = inp.closest('div[id^="bloque-"]'); const b2 = inp.closest('#cont-secciones-detalle'); if 
((b1 && b1.style.display !== 'none') || (b2 && b2.style.display !== 'none')) {
                    secTotal += parseInt(inp.value) || 0;
                }
            });
    */
    // We'll search for `secTotal += parseInt(inp.value) || 0;` and the closing `});`
    const secTotalRegex = /secTotal \+= parseInt\(inp\.value\) \|\| 0;\s*\}\s*\}\);\s*/g;
    
    if (secTotalRegex.test(mainJs)) {
        mainJs = mainJs.replace(secTotalRegex, (match) => {
            return match + `
            // Check if incomplete
            if (matTotal === 0 && secTotal === 0 && !window._forceSaveIncompleta) {
                const modalInc = document.getElementById('modal-confirm-incompleta');
                if (modalInc) modalInc.style.display = 'flex';
                btn.textContent = "Guardar Datos y Continuar";
                btn.disabled = false;
                return; // abort this save
            }
            window._forceSaveIncompleta = false;
`;
        });
        console.log("Injected incompleta logic into onsubmit.");
    } else {
        console.log("Could not find secTotal loop to inject incompleta logic.");
    }

    // 2. Append the modal event listeners at the end of the file
    if (!mainJs.includes('btn-cancelar-incompleta')) {
        mainJs += `\n
// --- Modal Declaración Incompleta ---
document.getElementById('btn-cancelar-incompleta')?.addEventListener('click', () => {
    document.getElementById('modal-confirm-incompleta').style.display = 'none';
});
document.getElementById('btn-aceptar-incompleta')?.addEventListener('click', () => {
    document.getElementById('modal-confirm-incompleta').style.display = 'none';
    window._forceSaveIncompleta = true;
    
    const form = document.getElementById('plantel-form');
    if (form) {
        // Create and dispatch a submit event
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
});
`;
        console.log("Appended modal event listeners.");
    }

    // 3. Remove the code that disables the button
    // Let's just find and replace the auto-enable logic that disables it
    mainJs = mainJs.replace(/btn\.disabled = true;\s*btn\.style\.opacity = '0\.5';\s*btn\.style\.cursor = 'not-allowed';\s*btn\.style\.background = '#94a3b8';/g, "/* button always enabled */");
    
    // Replace the initial disable logic
    mainJs = mainJs.replace(/if \(!tieneBasica && document\.getElementById\('btn-guardar-matricula'\)\) \{\s*document\.getElementById\('btn-guardar-matricula'\)\.style\.opacity = '0\.5';\s*document\.getElementById\('btn-guardar-matricula'\)\.disabled = true;\s*\}/g, "/* button always enabled initially */");
    
    // In vacantes logic, it also disables it somewhere? No, vacantes only enabled it when 'NO'. 
    
    fs.writeFileSync(mainPath, mainJs);


    // 4. Update index.html
    const idxPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';
    let idxHtml = fs.readFileSync(idxPath, 'utf8');

    // Remove disabled state from the button
    // Original: <button type="submit" id="btn-guardar-matricula" disabled style="width: 100%; text-transform: uppercase; padding: 14px; cursor: not-allowed; opacity: 0.5;">Guardar Datos y Continuar</button>
    // Or similar
    idxHtml = idxHtml.replace(/<button type="submit" id="btn-guardar-matricula"[^>]*>Guardar Datos y Continuar<\/button>/i, '<button type="submit" id="btn-guardar-matricula" style="width: 100%; background: #003399; color: white; text-transform: uppercase; padding: 14px; border: none; border-radius: 6px; cursor: pointer; transition: all 0.2s; font-weight: bold;">Guardar Datos y Continuar</button>');

    // Inject the modal before </body> or at the end of the lock-screens
    if (!idxHtml.includes('modal-confirm-incompleta')) {
        const modalHtml = `
    <!-- MODAL CONFIRMACIÓN INCOMPLETA -->
    <div id="modal-confirm-incompleta" class="lock-screen" aria-hidden="true" style="display: none;">
      <div class="lock-card glass-panel" style="max-width: 500px; text-align: center;">
        <h2 style="margin: 0 0 15px; color: #0f172a; font-size: 1.3rem;">⚠️ Declaración Incompleta</h2>
        <p style="color: #475569; margin-bottom: 25px; font-size: 1rem;">¿Está seguro de declarar secciones y matrículas incompleta?</p>
        <div style="display: flex; justify-content: center; gap: 15px;">
          <button type="button" id="btn-cancelar-incompleta" class="btn-secondary" style="width: 140px; padding: 10px; border-radius: 6px; cursor: pointer;">Cancelar</button>
          <button type="button" id="btn-aceptar-incompleta" style="background: #0ea5e9; color: white; width: 140px; padding: 10px; border-radius: 6px; border: none; cursor: pointer; font-weight: bold;">Aceptar</button>
        </div>
      </div>
    </div>
        `;
        
        // Find <!-- VISTA DEL COORDINADOR MUNICIPAL -->
        const coordIndex = idxHtml.indexOf('<!-- VISTA DEL COORDINADOR MUNICIPAL -->');
        if (coordIndex !== -1) {
            idxHtml = idxHtml.substring(0, coordIndex) + modalHtml + idxHtml.substring(coordIndex);
        } else {
            // Just put it before </body>
            idxHtml = idxHtml.replace('</body>', modalHtml + '</body>');
        }
        
        fs.writeFileSync(idxPath, idxHtml);
        console.log("Injected modal into index.html and updated button.");
    } else {
        console.log("Modal already exists in index.html.");
    }

} catch (e) {
    console.error(e);
}
