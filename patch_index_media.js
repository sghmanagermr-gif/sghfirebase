const fs = require('fs');

try {
    const indexPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';
    let idxHtml = fs.readFileSync(indexPath, 'utf8');

    // Refactor bloque-mediageneral
    const mgRegex = /<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;">[\s\S]*?<div style="background: #f1f5f9; padding: 12px 20px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">\s*<span style="font-size: 0.9rem; color: var\(--primary-color\); font-weight: 600;">Total Media Gen<\/span>\s*<span id="tot-media" style="font-size: 1.1rem; color: #0f172a; font-weight: bold;">0<\/span>\s*<\/div>/;
    
    const newMg = `<div id="cont-mat-media-general" style="display: flex; flex-direction: column; gap: 15px; margin-bottom: 20px;"></div>
                  <div style="background: #f1f5f9; padding: 12px 20px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                    <div><span style="font-size: 0.9rem; color: var(--primary-color); font-weight: 600;">Total Alumnos Media Gen: </span>
                    <span id="tot-media-gen" style="font-size: 1.1rem; color: #0f172a; font-weight: bold;">0</span></div>
                    <div><span style="font-size: 0.9rem; color: var(--primary-color); font-weight: 600;">Total Secciones Media Gen: </span>
                    <span id="tot-sec-media-gen" style="font-size: 1.1rem; color: #0f172a; font-weight: bold;">0</span></div>
                  </div>`;
    
    if (mgRegex.test(idxHtml)) {
        idxHtml = idxHtml.replace(mgRegex, newMg);
        console.log("SUCCESS: Patched Media General UI");
    } else {
        console.log("ERROR: Could not find Media General UI block");
    }

    // Refactor bloque-mediatecnica
    const mtRegex = /<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;">[\s\S]*?<div style="background: #f1f5f9; padding: 12px 20px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">\s*<span style="font-size: 0.9rem; color: var\(--primary-color\); font-weight: 600;">Total Media T\u00E9cnica<\/span>\s*<span id="tot-tecnica" style="font-size: 1.1rem; color: #0f172a; font-weight: bold;">0<\/span>\s*<\/div>/;
    // Note: the original HTML had "Técnica" encoded, but JS reads `.toString()`. I will use a broader regex for MT.
    const mtRegexBroad = /<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;">[\s\S]*?<span id="tot-tecnica" style="font-size: 1.1rem; color: #0f172a; font-weight: bold;">0<\/span>\s*<\/div>/;

    const newMt = `<div id="cont-mat-media-tecnica" style="display: flex; flex-direction: column; gap: 15px; margin-bottom: 20px;"></div>
                  <div style="background: #f1f5f9; padding: 12px 20px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                    <div><span style="font-size: 0.9rem; color: var(--primary-color); font-weight: 600;">Total Alumnos Media Téc: </span>
                    <span id="tot-media-tec" style="font-size: 1.1rem; color: #0f172a; font-weight: bold;">0</span></div>
                    <div><span style="font-size: 0.9rem; color: var(--primary-color); font-weight: 600;">Total Secciones Media Téc: </span>
                    <span id="tot-sec-media-tec" style="font-size: 1.1rem; color: #0f172a; font-weight: bold;">0</span></div>
                  </div>`;

    if (mtRegexBroad.test(idxHtml)) {
        idxHtml = idxHtml.replace(mtRegexBroad, newMt);
        console.log("SUCCESS: Patched Media Tecnica UI");
    } else {
        console.log("ERROR: Could not find Media Tecnica UI block");
    }

    fs.writeFileSync(indexPath, idxHtml);
} catch (e) {
    console.error(e);
}
