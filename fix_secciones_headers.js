const fs = require('fs');

try {
    // 1. Update index.html
    const indexPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';
    let idxHtml = fs.readFileSync(indexPath, 'utf8');
    const headerRegex = /<div style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 12px 20px; display: flex; align-items: center; gap: 10px;">[\s\S]*?<h3 style="margin: 0; font-size: 1rem; color: #1e293b;">Cantidad de Secciones por A\u00F1o<\/h3>\s*<\/div>\s*<div id="cont-secciones-dinamicas"/;
    // Let's use a simpler one because of encoding issues
    const headerRegex2 = /<div style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 12px 20px; display: flex; align-items: center; gap: 10px;">[\s\S]*?<div id="cont-secciones-dinamicas"/;
    if (headerRegex2.test(idxHtml)) {
        idxHtml = idxHtml.replace(headerRegex2, '<div id="cont-secciones-dinamicas"');
        console.log("SUCCESS: Removed static header from index.html");
    } else {
        console.log("ERROR: Could not find static header in index.html");
    }
    fs.writeFileSync(indexPath, idxHtml);

    // 2. Update main.js
    const mainPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';
    let mainJs = fs.readFileSync(mainPath, 'utf8');

    // This regex will capture the entire forEach loop and the assignment to contDinamico
    const oldLoopRegex = /mediaPlanes\.forEach\(plan => \{[\s\S]*?contDinamico\.innerHTML = html;\r?\n\}/;
    
    const newLoop = `
      const planesMG = mediaPlanes.filter(p => p.startsWith('3'));
      const planesMT = mediaPlanes.filter(p => p.startsWith('4'));

      const renderPlan = (plan) => {
          const isMt = plan.startsWith('4');
          const anios = isMt ? 6 : 5;
          const info = planes[plan];
          let titulo = 'Plan ' + plan;
          if (info && info.mencion) titulo += ' (' + info.mencion + ')';
          
          html += '<div style="margin-bottom: 1.5rem; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem; background: #f9fafb;">';
          html += '<h4 style="margin: 0 0 1rem; color: #1e40af; font-size: 0.95rem;">' + titulo + '</h4>';
          html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 1rem;">';
          
          for (let i = 1; i <= anios; i++) {
              const planSec = seccionesGuardadas[plan] || {};
              const val = parseInt(planSec[i] !== undefined ? planSec[i] : (planSec[String(i)] !== undefined ? planSec[String(i)] : 0)) || 0;
              html += '<div style="display: flex; flex-direction: column; gap: 0.3rem;">';
              html += '<label style="font-size: 0.8rem; font-weight: 600; color: #374151;">' + i + '\u00BA A\u00F1o</label>';
              html += '<input type="number" class="sec-anio-input" data-plan="' + plan + '" data-anio="' + i + '" min="0" value="' + (val || '') + '" style="padding: 0.4rem; text-align: center; border: 1px solid #cbd5e1; border-radius: 4px;">';
              html += '</div>';
          }
          
          html += '</div>';
          html += '<div style="background: #f1f5f9; padding: 12px 20px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">';
          html += '<span style="font-size: 0.9rem; color: var(--primary-color); font-weight: 600;">Total Secciones (Plan ' + plan + ')</span>';
          html += '<span id="tot-sec-plan-' + plan + '" class="tot-sec-plan-label" data-plan="' + plan + '" style="font-size: 1.1rem; color: #0f172a; font-weight: bold;">0</span>';
          html += '</div>';
          html += '</div>';
      };

      if (planesMG.length > 0) {
          html += '<div style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 12px 20px; display: flex; align-items: center; gap: 10px; margin: -20px -20px 20px -20px;"><span style="font-size: 1.2rem;">\uD83D\uDC68\u200D\uD83C\uDFEB</span><h3 style="margin: 0; font-size: 1rem; color: #1e293b;">Cantidad de Secciones por A\u00F1o - Media General</h3></div>';
          planesMG.forEach(renderPlan);
      }
      if (planesMT.length > 0) {
          html += '<div style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; border-top: 1px solid #e2e8f0; padding: 12px 20px; display: flex; align-items: center; gap: 10px; margin: 0 -20px 20px -20px;"><span style="font-size: 1.2rem;">\u2699\uFE0F</span><h3 style="margin: 0; font-size: 1rem; color: #1e293b;">Cantidad de Secciones por A\u00F1o - Media T\u00E9cnica</h3></div>';
          planesMT.forEach(renderPlan);
      }
      
      contDinamico.innerHTML = html;
}
`;
    if (oldLoopRegex.test(mainJs)) {
        mainJs = mainJs.replace(oldLoopRegex, newLoop);
        console.log("SUCCESS: Replaced loop logic in main.js");
    } else {
        console.log("ERROR: Could not find loop logic in main.js");
    }
    fs.writeFileSync(mainPath, mainJs);

} catch (e) {
    console.error(e);
}
