const fs = require('fs');

try {
    const indexPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';
    let idxHtml = fs.readFileSync(indexPath, 'utf8');

    // Find exactly the start of the sections detail block
    const searchString = '<div id="cont-secciones-detalle" style="display: none; background: white; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px; overflow: hidden;">';
    const startIdx = idxHtml.indexOf(searchString);

    if (startIdx !== -1) {
        // Find the start of the next div
        const endSearch = '<div id="cont-secciones-dinamicas"';
        const endIdx = idxHtml.indexOf(endSearch, startIdx);
        
        if (endIdx !== -1) {
            // Cut out everything between the start of cont-secciones-detalle and cont-secciones-dinamicas
            const replacement = searchString + '\n              ' + endSearch;
            idxHtml = idxHtml.substring(0, startIdx) + replacement + idxHtml.substring(endIdx + endSearch.length);
            fs.writeFileSync(indexPath, idxHtml);
            console.log("SUCCESS: Safely removed static header.");
        } else {
            console.log("ERROR: Could not find cont-secciones-dinamicas after cont-secciones-detalle.");
        }
    } else {
        console.log("ERROR: Could not find cont-secciones-detalle block.");
    }
} catch (e) {
    console.error(e);
}
