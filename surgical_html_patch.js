const fs = require('fs');

try {
    const indexPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';
    let idxHtml = fs.readFileSync(indexPath, 'utf8');

    // 1. Media General
    const mgStartStr = '<div id="bloque-mediageneral"';
    const mgEndStr = '<!-- MEDIA T';
    const mgStartIdx = idxHtml.indexOf(mgStartStr);
    const mgEndIdx = idxHtml.indexOf(mgEndStr, mgStartIdx);

    if (mgStartIdx !== -1 && mgEndIdx !== -1) {
        const replacement = `<div id="bloque-mediageneral" style="background: white; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px; overflow: hidden; display: none;">
                <div style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 12px 20px; display: flex; align-items: center; gap: 10px;">
                  <span style="font-size: 1.2rem;">#</span>
                  <h3 style="margin: 0; font-size: 1rem; color: #1e293b;">Media General</h3>
                </div>
                <div style="padding: 20px;">
                  <div id="cont-mat-media-general" style="display: flex; flex-direction: column; gap: 15px; margin-bottom: 20px;"></div>
                  <div style="background: #f1f5f9; padding: 12px 20px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                    <div><span style="font-size: 0.9rem; color: var(--primary-color); font-weight: 600;">Total Alumnos Media Gen: </span>
                    <span id="tot-media-gen" style="font-size: 1.1rem; color: #0f172a; font-weight: bold;">0</span></div>
                    <div><span style="font-size: 0.9rem; color: var(--primary-color); font-weight: 600;">Total Secciones Media Gen: </span>
                    <span id="tot-sec-media-gen" style="font-size: 1.1rem; color: #0f172a; font-weight: bold;">0</span></div>
                  </div>
                </div>
              </div>

              `;
        idxHtml = idxHtml.substring(0, mgStartIdx) + replacement + idxHtml.substring(mgEndIdx);
        console.log("SUCCESS: Replaced Media General block safely.");
    } else {
        console.log("ERROR: Could not find Media General bounds.");
    }

    // 2. Media Técnica
    const mtStartStr = '<div id="bloque-mediatecnica"';
    const mtEndStr = '<!-- CONTENEDOR DIN';
    const mtStartIdx = idxHtml.indexOf(mtStartStr);
    const mtEndIdx = idxHtml.indexOf(mtEndStr, mtStartIdx);

    if (mtStartIdx !== -1 && mtEndIdx !== -1) {
        const replacement = `<div id="bloque-mediatecnica" style="background: white; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px; overflow: hidden; display: none;">
                <div style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 12px 20px; display: flex; align-items: center; gap: 10px;">
                  <span style="font-size: 1.2rem;">⚙️</span>
                  <h3 style="margin: 0; font-size: 1rem; color: #1e293b;">Media Técnica</h3>
                </div>
                <div style="padding: 20px;">
                  <div id="cont-mat-media-tecnica" style="display: flex; flex-direction: column; gap: 15px; margin-bottom: 20px;"></div>
                  <div style="background: #f1f5f9; padding: 12px 20px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                    <div><span style="font-size: 0.9rem; color: var(--primary-color); font-weight: 600;">Total Alumnos Media Téc: </span>
                    <span id="tot-media-tec" style="font-size: 1.1rem; color: #0f172a; font-weight: bold;">0</span></div>
                    <div><span style="font-size: 0.9rem; color: var(--primary-color); font-weight: 600;">Total Secciones Media Téc: </span>
                    <span id="tot-sec-media-tec" style="font-size: 1.1rem; color: #0f172a; font-weight: bold;">0</span></div>
                  </div>
                </div>
              </div>
            </div>
              
            `;
        idxHtml = idxHtml.substring(0, mtStartIdx) + replacement + idxHtml.substring(mtEndIdx);
        console.log("SUCCESS: Replaced Media Técnica block safely.");
    } else {
        console.log("ERROR: Could not find Media Técnica bounds.");
    }

    // 3. Remove header from cont-secciones-detalle
    const sdStartStr = '<div id="cont-secciones-detalle"';
    const sdEndStr = '<div id="cont-secciones-dinamicas"';
    const sdStartIdx = idxHtml.indexOf(sdStartStr);
    const sdEndIdx = idxHtml.indexOf(sdEndStr, sdStartIdx);

    if (sdStartIdx !== -1 && sdEndIdx !== -1) {
        const replacement = `<div id="cont-secciones-detalle" style="display: none; background: white; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px; overflow: hidden;">
              `;
        idxHtml = idxHtml.substring(0, sdStartIdx) + replacement + idxHtml.substring(sdEndIdx);
        console.log("SUCCESS: Safely removed static header from cont-secciones-detalle.");
    } else {
        console.log("ERROR: Could not find cont-secciones-detalle bounds.");
    }

    fs.writeFileSync(indexPath, idxHtml);
} catch (e) {
    console.error(e);
}
