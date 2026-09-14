const fs = require('fs');

try {
    const mainPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';
    let mainJs = fs.readFileSync(mainPath, 'utf8');

    // 1. Inject _renderizarMatriculaMedia and update _renderizarDetalleSecciones
    if (!mainJs.includes('_renderizarMatriculaMedia')) {
        // Find _renderizarDetalleSecciones end
        const rdsRegex = /html \+= '<\/div><\/div>';\r?\n\s*\}\);\s*contDinamico\.innerHTML = html;\r?\n\}/;
        if (rdsRegex.test(mainJs)) {
            mainJs = mainJs.replace(rdsRegex, (match) => {
                return `
          html += '<div style="background: #f1f5f9; padding: 12px 20px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">';
          html += '<span style="font-size: 0.9rem; color: var(--primary-color); font-weight: 600;">Total Secciones (Plan ' + plan + ')</span>';
          html += '<span id="tot-sec-plan-' + plan + '" class="tot-sec-plan-label" data-plan="' + plan + '" style="font-size: 1.1rem; color: #0f172a; font-weight: bold;">0</span>';
          html += '</div>';
          html += '</div></div>';
      });
      contDinamico.innerHTML = html;
}

function _renderizarMatriculaMedia(planes, guardadas = null) {
    const contMg = document.getElementById('cont-mat-media-general');
    const contMt = document.getElementById('cont-mat-media-tecnica');
    if (contMg) contMg.innerHTML = '';
    if (contMt) contMt.innerHTML = '';
    
    const matMedia = guardadas ? guardadas.media : null;
    const mgSaved = matMedia ? (matMedia["media-general"] || {}) : {};
    const mtSaved = matMedia ? (matMedia["media-tecnica"] || {}) : {};

    Object.keys(planes).sort().forEach(plan => {
        const info = planes[plan];
        let titulo = 'Plan ' + plan;
        if (info && info.mencion) titulo += ' (' + info.mencion + ')';

        if (plan.startsWith('3') && contMg) {
            const saved = mgSaved[plan] || {};
            let html = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; background: #f8fafc;">';
            html += '<div style="grid-column: span 2;"><h4 style="margin: 0; color: #1e40af; font-size: 0.95rem;">' + titulo + '</h4></div>';
            html += '<div><label style="font-size: 0.75rem; color: #64748b;">Femenino</label><input type="number" class="mat-input mat-media dyn-mg-fem" data-plan="' + plan + '" min="0" value="' + (saved.fem || '') + '" style="background: white; color: #0f172a; border-color: #cbd5e1; width: 100%;" /></div>';
            html += '<div><label style="font-size: 0.75rem; color: #64748b;">Masculino</label><input type="number" class="mat-input mat-media dyn-mg-mas" data-plan="' + plan + '" min="0" value="' + (saved.mas || '') + '" style="background: white; color: #0f172a; border-color: #cbd5e1; width: 100%;" /></div>';
            html += '</div>';
            contMg.innerHTML += html;
        } else if (plan.startsWith('4') && contMt) {
            const saved = mtSaved[plan] || {};
            let html = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; background: #f8fafc;">';
            html += '<div style="grid-column: span 2;"><h4 style="margin: 0; color: #1e40af; font-size: 0.95rem;">' + titulo + '</h4></div>';
            html += '<div><label style="font-size: 0.75rem; color: #64748b;">Femenino</label><input type="number" class="mat-input mat-media dyn-mt-fem" data-plan="' + plan + '" min="0" value="' + (saved.fem || '') + '" style="background: white; color: #0f172a; border-color: #cbd5e1; width: 100%;" /></div>';
            html += '<div><label style="font-size: 0.75rem; color: #64748b;">Masculino</label><input type="number" class="mat-input mat-media dyn-mt-mas" data-plan="' + plan + '" min="0" value="' + (saved.mas || '') + '" style="background: white; color: #0f172a; border-color: #cbd5e1; width: 100%;" /></div>';
            html += '</div>';
            contMt.innerHTML += html;
        }
    });
}`;
            });
            console.log("SUCCESS: Injected _renderizarMatriculaMedia");
        }
    }

    // 2. Call _renderizarMatriculaMedia in onLogin
    const callRegex = /_renderizarDetalleSecciones\(planes, savedSeccionesPlanes\);/;
    if (callRegex.test(mainJs) && !mainJs.includes('_renderizarMatriculaMedia(planes, savedMatricula)')) {
        mainJs = mainJs.replace(callRegex, (match) => {
            return match + `\n      const savedMatricula = dataParcial ? dataParcial.matricula : null;\n      _renderizarMatriculaMedia(planes, savedMatricula);`;
        });
        console.log("SUCCESS: Called _renderizarMatriculaMedia");
    }

    // 3. Remove old hardcoded assignment in onLogin
    const oldAssignRegex = /\/\/ --- 4\. MEDIA GENERAL Y T\u00C9CNICA ---[\s\S]*?\}\s*\} else if \(dataParcial/i;
    // Let's use a simpler regex
    const oldAssignRegex2 = /\/\/ --- 4\. MEDIA GENERAL Y[\s\S]*?if \(document.getElementById\('mtMas'\)\) document.getElementById\('mtMas'\).value = mt\["total-med-mas"\] \|\| 0;\r?\n\s*\}/;
    if (oldAssignRegex2.test(mainJs)) {
        mainJs = mainJs.replace(oldAssignRegex2, `// --- 4. MEDIA GENERAL Y TECNICA ---\n          // Now handled by _renderizarMatriculaMedia`);
        console.log("SUCCESS: Removed old media assignment");
    }

    // 4. Update onsubmit to read dynamic inputs
    const submitRegex = /if \(document\.getElementById\('bloque-mediageneral'\)\.style\.display !== 'none'\) \{[\s\S]*?matricula\.media\["media-tecnica"\]\["total-med-tec"\] \+= \(mtFem \+ mtMas\);\r?\n\s*\}\r?\n\s*\}/;
    const newSubmitLogic = `
            if (document.getElementById('bloque-mediageneral').style.display !== 'none') {
                document.querySelectorAll('.dyn-mg-fem').forEach(inp => {
                    const plan = inp.dataset.plan;
                    const fVal = parseInt(inp.value || 0);
                    const mInp = document.querySelector(\`.dyn-mg-mas[data-plan="\${plan}"]\`);
                    const mVal = mInp ? parseInt(mInp.value || 0) : 0;
                    
                    if (matricula.media["media-general"][plan]) {
                        matricula.media["media-general"][plan].fem += fVal;
                        matricula.media["media-general"][plan].mas += mVal;
                        matricula.media["media-general"][plan].total += (fVal + mVal);
                    }
                    matricula.media["media-general"][\`total-med-\${plan}-fem\`] += fVal;
                    matricula.media["media-general"][\`total-med-\${plan}-mas\`] += mVal;
                    matricula.media["media-general"][\`total-med-\${plan}\`] += (fVal + mVal);

                    matricula.media["media-general"]["total-med-fem"] += fVal;
                    matricula.media["media-general"]["total-med-mas"] += mVal;
                    matricula.media["media-general"]["total-med-gen"] += (fVal + mVal);
                });
            }
  
            if (document.getElementById('bloque-mediatecnica').style.display !== 'none') {
                document.querySelectorAll('.dyn-mt-fem').forEach(inp => {
                    const plan = inp.dataset.plan;
                    const fVal = parseInt(inp.value || 0);
                    const mInp = document.querySelector(\`.dyn-mt-mas[data-plan="\${plan}"]\`);
                    const mVal = mInp ? parseInt(mInp.value || 0) : 0;
                    
                    if (matricula.media["media-tecnica"][plan]) {
                        matricula.media["media-tecnica"][plan].fem += fVal;
                        matricula.media["media-tecnica"][plan].mas += mVal;
                        matricula.media["media-tecnica"][plan].total += (fVal + mVal);
                    }
                    matricula.media["media-tecnica"][\`total-med-\${plan}-fem\`] += fVal;
                    matricula.media["media-tecnica"][\`total-med-\${plan}-mas\`] += mVal;
                    matricula.media["media-tecnica"][\`total-med-\${plan}\`] += (fVal + mVal);

                    matricula.media["media-tecnica"]["total-med-fem"] += fVal;
                    matricula.media["media-tecnica"]["total-med-mas"] += mVal;
                    matricula.media["media-tecnica"]["total-med-tec"] += (fVal + mVal);
                });
            }
    `;
    if (submitRegex.test(mainJs)) {
        mainJs = mainJs.replace(submitRegex, newSubmitLogic);
        console.log("SUCCESS: Updated onsubmit logic for dynamic inputs");
    } else {
        console.log("ERROR: Could not find onsubmit logic");
    }

    // 5. Update input listener to sum sections and dynamic mat inputs
    const inputSumRegex = /if\(document\.getElementById\('tot-media'\)\) document\.getElementById\('tot-media'\)\.textContent = totMed;\r?\n\s*if\(document\.getElementById\('tot-tecnica'\)\) document\.getElementById\('tot-tecnica'\)\.textContent = totTec;/;
    
    if (inputSumRegex.test(mainJs)) {
        mainJs = mainJs.replace(inputSumRegex, `
          // Calculate dynamic media gen
          let sumMg = 0, sumMt = 0;
          document.querySelectorAll('.dyn-mg-fem, .dyn-mg-mas').forEach(i => sumMg += parseInt(i.value||0));
          document.querySelectorAll('.dyn-mt-fem, .dyn-mt-mas').forEach(i => sumMt += parseInt(i.value||0));
          
          if(document.getElementById('tot-media-gen')) document.getElementById('tot-media-gen').textContent = sumMg;
          if(document.getElementById('tot-media-tec')) document.getElementById('tot-media-tec').textContent = sumMt;

          // Calculate section sums per plan and totals
          let totalSecMg = 0, totalSecMt = 0;
          const planesSums = {};
          document.querySelectorAll('.sec-anio-input').forEach(inp => {
              if (inp.closest('div[id^="bloque-"]')?.style.display !== 'none' && inp.closest('#cont-secciones-detalle')?.style.display !== 'none') {
                  const plan = inp.dataset.plan;
                  const v = parseInt(inp.value || 0);
                  if (!planesSums[plan]) planesSums[plan] = 0;
                  planesSums[plan] += v;
                  
                  if (plan.startsWith('3')) totalSecMg += v;
                  if (plan.startsWith('4')) totalSecMt += v;
              }
          });
          
          // Update the plan section counters
          Object.keys(planesSums).forEach(p => {
              const el = document.getElementById('tot-sec-plan-' + p);
              if (el) el.textContent = planesSums[p];
          });
          
          // Update global section counters
          if(document.getElementById('tot-sec-media-gen')) document.getElementById('tot-sec-media-gen').textContent = totalSecMg;
          if(document.getElementById('tot-sec-media-tec')) document.getElementById('tot-sec-media-tec').textContent = totalSecMt;
        `);
        console.log("SUCCESS: Updated input listener");
    }

    fs.writeFileSync(mainPath, mainJs);

} catch (e) {
    console.error(e);
}
