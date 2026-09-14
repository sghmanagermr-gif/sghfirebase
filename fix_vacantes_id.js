const fs = require('fs');

try {
    const indexPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';
    let idxHtml = fs.readFileSync(indexPath, 'utf8');

    // Find the vacantes block
    const vacantesDivStr = '<div style="margin-top: 20px; padding: 20px; background: white; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 15px;">';
    const vacantesInnerStr = '<h4 style="margin: 0; color: #0f172a; font-size: 1rem;">¿El plantel tiene Vacantes Físicas?</h4>';
    const vacantesInnerStrAscii = '<h4 style="margin: 0; color: #0f172a; font-size: 1rem;">El plantel tiene Vacantes';
    const vacantesInnerStrGeneral = 'El plantel tiene Vacantes';

    // We can just replace the start div if we verify it contains the vacantes text
    const idx1 = idxHtml.indexOf(vacantesDivStr);
    
    if (idx1 !== -1) {
        // check if it's the right div
        const snippet = idxHtml.substring(idx1, idx1 + 500);
        if (snippet.includes(vacantesInnerStrGeneral)) {
            const newDivStr = '<div id="contenedor-pregunta-vacantes" style="display: none; margin-top: 20px; padding: 20px; background: white; border-radius: 12px; border: 1px solid #e2e8f0; flex-direction: column; gap: 15px;">';
            idxHtml = idxHtml.substring(0, idx1) + newDivStr + idxHtml.substring(idx1 + vacantesDivStr.length);
            fs.writeFileSync(indexPath, idxHtml);
            console.log("SUCCESS: Added ID to vacantes container.");
        } else {
            console.log("ERROR: Div does not contain vacantes text.");
        }
    } else {
        console.log("ERROR: Could not find vacantes div string.");
    }
} catch (e) {
    console.error(e);
}
