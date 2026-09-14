const fs = require('fs');

try {
    const mainPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';
    let mainJs = fs.readFileSync(mainPath, 'utf8');

    // Fix 1: Align the finally button text with the HTML button text
    const oldFinallyText = `btn.textContent = "Guardar y Desbloquear Sistema";`;
    const newFinallyText = `btn.textContent = "Guardar Datos y Continuar";`;

    if (mainJs.includes(oldFinallyText)) {
        mainJs = mainJs.replace(oldFinallyText, newFinallyText);
        console.log("Fixed: finally block button text aligned to HTML.");
    } else {
        console.log("NOTE: 'Guardar y Desbloquear Sistema' not found - maybe already correct.");
    }

    // Fix 2: Also fix the modal abort restore text
    const oldModalText = `btn.textContent = "Guardar Datos y Continuar";
                btn.disabled = false;
                return; // abort this save`;
    // Already correct - this is fine

    fs.writeFileSync(mainPath, mainJs);
    console.log("Done. File saved.");

} catch(e) {
    console.error(e);
}
