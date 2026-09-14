const fs = require('fs');

try {
    const indexPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';
    let idxHtml = fs.readFileSync(indexPath, 'utf8');

    // For Media General, find exact grid
    const oldMgGrid = `<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <div><label style="font-size: 0.75rem; color: #64748b;">Media Gen Fem</label><input type="number" class="mat-input mat-media" id="mgFem" min="0" value="" style="background: white; color: #0f172a; border-color: #cbd5e1;" /></div>
                    <div><label style="font-size: 0.75rem; color: #64748b;">Media Gen Mas</label><input type="number" class="mat-input mat-media" id="mgMas" min="0" value="" style="background: white; color: #0f172a; border-color: #cbd5e1;" /></div>
                    <div><label style="font-size: 0.75rem; color: #64748b;">Secciones Totales</label><input type="number" class="sec-input sec-media" id="secMg" min="0" value="" style="background: white; color: #0f172a; border-color: #cbd5e1;" /></div>
                  </div>
                  <div style="background: #f1f5f9; padding: 12px 20px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.9rem; color: var(--primary-color); font-weight: 600;">Total Media Gen</span>
                    <span id="tot-media" style="font-size: 1.1rem; color: #0f172a; font-weight: bold;">0</span>
                  </div>`;
                  
    const newMg = `<div id="cont-mat-media-general" style="display: flex; flex-direction: column; gap: 15px; margin-bottom: 20px;"></div>
                  <div style="background: #f1f5f9; padding: 12px 20px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                    <div><span style="font-size: 0.9rem; color: var(--primary-color); font-weight: 600;">Total Alumnos Media Gen: </span>
                    <span id="tot-media-gen" style="font-size: 1.1rem; color: #0f172a; font-weight: bold;">0</span></div>
                    <div><span style="font-size: 0.9rem; color: var(--primary-color); font-weight: 600;">Total Secciones Media Gen: </span>
                    <span id="tot-sec-media-gen" style="font-size: 1.1rem; color: #0f172a; font-weight: bold;">0</span></div>
                  </div>`;
    
    if (idxHtml.includes(oldMgGrid)) {
        idxHtml = idxHtml.replace(oldMgGrid, newMg);
        console.log("SUCCESS: Patched Media General UI");
    } else {
        console.log("ERROR: Could not find Media General UI block");
    }

    // For Media Técnica, find exact grid
    const oldMtGrid = `<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <div><label style="font-size: 0.75rem; color: #64748b;">Media T\u00E9c Fem</label><input type="number" class="mat-input mat-tecnica" id="mtFem" min="0" value="" style="background: white; color: #0f172a; border-color: #cbd5e1;" /></div>
                    <div><label style="font-size: 0.75rem; color: #64748b;">Media T\u00E9c Mas</label><input type="number" class="mat-input mat-tecnica" id="mtMas" min="0" value="" style="background: white; color: #0f172a; border-color: #cbd5e1;" /></div>
                    <div><label style="font-size: 0.75rem; color: #64748b;">Secciones Totales</label><input type="number" class="sec-input sec-tecnica" id="secMt" min="0" value="" style="background: white; color: #0f172a; border-color: #cbd5e1;" /></div>
                  </div>
                  <div style="background: #f1f5f9; padding: 12px 20px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.9rem; color: var(--primary-color); font-weight: 600;">Total Media T\u00E9cnica</span>
                    <span id="tot-tecnica" style="font-size: 1.1rem; color: #0f172a; font-weight: bold;">0</span>
                  </div>`;
                  
    const newMt = `<div id="cont-mat-media-tecnica" style="display: flex; flex-direction: column; gap: 15px; margin-bottom: 20px;"></div>
                  <div style="background: #f1f5f9; padding: 12px 20px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                    <div><span style="font-size: 0.9rem; color: var(--primary-color); font-weight: 600;">Total Alumnos Media Téc: </span>
                    <span id="tot-media-tec" style="font-size: 1.1rem; color: #0f172a; font-weight: bold;">0</span></div>
                    <div><span style="font-size: 0.9rem; color: var(--primary-color); font-weight: 600;">Total Secciones Media Téc: </span>
                    <span id="tot-sec-media-tec" style="font-size: 1.1rem; color: #0f172a; font-weight: bold;">0</span></div>
                  </div>`;
                  
    if (idxHtml.includes(oldMtGrid)) {
        idxHtml = idxHtml.replace(oldMtGrid, newMt);
        console.log("SUCCESS: Patched Media Tecnica UI");
    } else {
        // Retry with unicode variations
        // Try replacing everything from `<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;">` inside Media Tecnica down to `</div>` after `Total Media`
        const mtStart = '<div id="bloque-mediatecnica"';
        const startIdx = idxHtml.indexOf(mtStart);
        if (startIdx !== -1) {
            const gridStart = idxHtml.indexOf('<div style="display: grid;', startIdx);
            const gridEnd = idxHtml.indexOf('<div id="cont-secciones-detalle"', gridStart);
            if (gridStart !== -1 && gridEnd !== -1) {
                const chunk = idxHtml.substring(gridStart, gridEnd);
                const toReplace = chunk.substring(0, chunk.lastIndexOf('</div>', chunk.lastIndexOf('</div>') - 1)); // strip out the ending </div></div>
                // Safer fallback just replacing specific ids
                idxHtml = idxHtml.replace(/<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;">[\s\S]*?<span id="tot-tecnica" style="font-size: 1.1rem; color: #0f172a; font-weight: bold;">0<\/span>\s*<\/div>/, newMt);
                console.log("SUCCESS: Patched Media Tecnica UI via regex fallback");
            }
        }
    }
    
    // 3. Remove the static title from cont-secciones-detalle
    const searchString = '<div id="cont-secciones-detalle" style="display: none; background: white; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px; overflow: hidden;">';
    const startIdx = idxHtml.indexOf(searchString);

    if (startIdx !== -1) {
        // Find the start of the next div
        const endSearch = '<div id="cont-secciones-dinamicas"';
        const endIdx = idxHtml.indexOf(endSearch, startIdx);
        
        if (endIdx !== -1) {
            // Cut out everything between the start of cont-secciones-detalle and cont-secciones-dinamicas
            const replacement = searchString + '\\n              ' + endSearch;
            idxHtml = idxHtml.substring(0, startIdx) + replacement + idxHtml.substring(endIdx + endSearch.length);
            console.log("SUCCESS: Safely removed static header.");
        }
    }

    fs.writeFileSync(indexPath, idxHtml);
} catch (e) {
    console.error(e);
}
