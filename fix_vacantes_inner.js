const fs = require('fs');

try {
    const indexPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';
    let idxHtml = fs.readFileSync(indexPath, 'utf8');

    // Restore the outer div and move the ID to the inner div
    const buggyOuterDiv = '<div id="contenedor-pregunta-vacantes" style="display: none; margin-top: 20px; padding: 20px; background: white; border-radius: 12px; border: 1px solid #e2e8f0; flex-direction: column; gap: 15px;">';
    const originalOuterDiv = '<div style="margin-top: 20px; padding: 20px; background: white; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 15px;">';
    
    // Find where the buggy div is
    const outerIdx = idxHtml.indexOf(buggyOuterDiv);
    
    if (outerIdx !== -1) {
        // Fix outer div
        idxHtml = idxHtml.replace(buggyOuterDiv, originalOuterDiv);
        
        // Find the inner div that comes right after it
        const innerDivRegex = /<div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid\s*#f1f5f9; padding-bottom: 15px;">/;
        
        // Let's use substring replacement to ensure we only target the inner div below the restored outer div
        const searchScope = idxHtml.substring(outerIdx, outerIdx + 500);
        
        const innerMatch = searchScope.match(innerDivRegex);
        if (innerMatch) {
            const innerStr = innerMatch[0];
            const newInnerStr = innerStr.replace('<div style="', '<div id="contenedor-pregunta-vacantes" style="');
            
            // replace in the whole document
            idxHtml = idxHtml.replace(innerStr, newInnerStr);
            fs.writeFileSync(indexPath, idxHtml);
            console.log("SUCCESS: Moved ID to inner div and restored outer div.");
        } else {
            console.log("ERROR: Could not find inner div.");
            // Print the search scope to debug
            console.log("Scope was: ", searchScope);
        }
    } else {
        console.log("ERROR: Could not find buggy outer div.");
    }

} catch (e) {
    console.error(e);
}
