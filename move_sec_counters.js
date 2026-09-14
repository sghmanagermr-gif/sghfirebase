const fs = require('fs');

try {
    const indexPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';
    let idxHtml = fs.readFileSync(indexPath, 'utf8');

    // 1. Remove Total Secciones Media Gen from index.html
    const mgSecStr = `
                    <div><span style="font-size: 0.9rem; color: var(--primary-color); font-weight: 600;">Total Secciones Media Gen: </span>
                    <span id="tot-sec-media-gen" style="font-size: 1.1rem; color: #0f172a; font-weight: bold;">0</span></div>`;
    if (idxHtml.includes(mgSecStr)) {
        idxHtml = idxHtml.replace(mgSecStr, '');
        console.log("SUCCESS: Removed Total Secciones Media Gen from index.html");
    } else {
        console.log("ERROR: Could not find Total Secciones Media Gen in index.html");
    }

    // 2. Remove Total Secciones Media Téc from index.html
    const mtSecStr = `
                    <div><span style="font-size: 0.9rem; color: var(--primary-color); font-weight: 600;">Total Secciones Media T\u00E9c: </span>
                    <span id="tot-sec-media-tec" style="font-size: 1.1rem; color: #0f172a; font-weight: bold;">0</span></div>`;
    // also try the version with é directly
    const mtSecStr2 = `
                    <div><span style="font-size: 0.9rem; color: var(--primary-color); font-weight: 600;">Total Secciones Media Téc: </span>
                    <span id="tot-sec-media-tec" style="font-size: 1.1rem; color: #0f172a; font-weight: bold;">0</span></div>`;
                    
    if (idxHtml.includes(mtSecStr)) {
        idxHtml = idxHtml.replace(mtSecStr, '');
        console.log("SUCCESS: Removed Total Secciones Media Téc (Unicode) from index.html");
    } else if (idxHtml.includes(mtSecStr2)) {
        idxHtml = idxHtml.replace(mtSecStr2, '');
        console.log("SUCCESS: Removed Total Secciones Media Téc (Direct) from index.html");
    } else {
        console.log("ERROR: Could not find Total Secciones Media Téc in index.html");
    }

    fs.writeFileSync(indexPath, idxHtml);


    // 3. Update main.js headers
    const mainPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';
    let mainJs = fs.readFileSync(mainPath, 'utf8');

    // old MG header
    const oldMgHeader = `html += '<div style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 12px 20px; display: flex; align-items: center; gap: 10px; margin: -20px -20px 20px -20px;"><span style="font-size: 1.2rem;">\uD83D\uDC68\u200D\uD83C\uDFEB</span><h3 style="margin: 0; font-size: 1rem; color: #1e293b;">Cantidad de Secciones por A\u00F1o - Media General</h3></div>';`;
    const newMgHeader = `html += '<div style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; margin: -20px -20px 20px -20px;"><div style="display: flex; align-items: center; gap: 10px;"><span style="font-size: 1.2rem;">\uD83D\uDC68\u200D\uD83C\uDFEB</span><h3 style="margin: 0; font-size: 1rem; color: #1e293b;">Cantidad de Secciones por A\u00F1o - Media General</h3></div><div><span style="font-size: 0.9rem; color: var(--primary-color); font-weight: 600;">Total Secciones Media Gen: </span><span id="tot-sec-media-gen" style="font-size: 1.1rem; color: #0f172a; font-weight: bold;">0</span></div></div>';`;

    if (mainJs.includes(oldMgHeader)) {
        mainJs = mainJs.replace(oldMgHeader, newMgHeader);
        console.log("SUCCESS: Replaced Media General header in main.js");
    } else {
        console.log("ERROR: Could not find Media General header in main.js");
    }

    // old MT header
    const oldMtHeader = `html += '<div style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; border-top: 1px solid #e2e8f0; padding: 12px 20px; display: flex; align-items: center; gap: 10px; margin: 0 -20px 20px -20px;"><span style="font-size: 1.2rem;">\u2699\uFE0F</span><h3 style="margin: 0; font-size: 1rem; color: #1e293b;">Cantidad de Secciones por A\u00F1o - Media T\u00E9cnica</h3></div>';`;
    const newMtHeader = `html += '<div style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; border-top: 1px solid #e2e8f0; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; margin: 0 -20px 20px -20px;"><div style="display: flex; align-items: center; gap: 10px;"><span style="font-size: 1.2rem;">\u2699\uFE0F</span><h3 style="margin: 0; font-size: 1rem; color: #1e293b;">Cantidad de Secciones por A\u00F1o - Media T\u00E9cnica</h3></div><div><span style="font-size: 0.9rem; color: var(--primary-color); font-weight: 600;">Total Secciones Media T\u00E9c: </span><span id="tot-sec-media-tec" style="font-size: 1.1rem; color: #0f172a; font-weight: bold;">0</span></div></div>';`;

    if (mainJs.includes(oldMtHeader)) {
        mainJs = mainJs.replace(oldMtHeader, newMtHeader);
        console.log("SUCCESS: Replaced Media Técnica header in main.js");
    } else {
        console.log("ERROR: Could not find Media Técnica header in main.js");
    }

    fs.writeFileSync(mainPath, mainJs);

} catch (e) {
    console.error(e);
}
