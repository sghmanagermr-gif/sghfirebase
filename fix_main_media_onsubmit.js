const fs = require('fs');

try {
    const mainPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';
    let mainJs = fs.readFileSync(mainPath, 'utf8');

    // Define the exact regex that encompasses the whole block
    const submitRegex = /if \(document\.getElementById\('bloque-mediageneral'\)\.style\.display !== 'none'\) \{[\s\S]*?matricula\.media\["media-tecnica"\]\["total-med-tec"\] \+= \(mtFem \+ mtMas\);\r?\n\s*\}\s*\}\s*\}/;

    const newSubmitLogic = `if (document.getElementById('bloque-mediageneral').style.display !== 'none') {
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
                    if (matricula.media["media-general"][\`total-med-\${plan}-fem\`] !== undefined) {
                        matricula.media["media-general"][\`total-med-\${plan}-fem\`] += fVal;
                        matricula.media["media-general"][\`total-med-\${plan}-mas\`] += mVal;
                        matricula.media["media-general"][\`total-med-\${plan}\`] += (fVal + mVal);
                    } else {
                        matricula.media["media-general"][\`total-med-\${plan}-fem\`] = fVal;
                        matricula.media["media-general"][\`total-med-\${plan}-mas\`] = mVal;
                        matricula.media["media-general"][\`total-med-\${plan}\`] = (fVal + mVal);
                    }

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
                    if (matricula.media["media-tecnica"][\`total-med-\${plan}-fem\`] !== undefined) {
                        matricula.media["media-tecnica"][\`total-med-\${plan}-fem\`] += fVal;
                        matricula.media["media-tecnica"][\`total-med-\${plan}-mas\`] += mVal;
                        matricula.media["media-tecnica"][\`total-med-\${plan}\`] += (fVal + mVal);
                    } else {
                        matricula.media["media-tecnica"][\`total-med-\${plan}-fem\`] = fVal;
                        matricula.media["media-tecnica"][\`total-med-\${plan}-mas\`] = mVal;
                        matricula.media["media-tecnica"][\`total-med-\${plan}\`] = (fVal + mVal);
                    }

                    matricula.media["media-tecnica"]["total-med-fem"] += fVal;
                    matricula.media["media-tecnica"]["total-med-mas"] += mVal;
                    matricula.media["media-tecnica"]["total-med-tec"] += (fVal + mVal);
                });
            }`;

    if (submitRegex.test(mainJs)) {
        mainJs = mainJs.replace(submitRegex, newSubmitLogic);
        console.log("SUCCESS: Replaced onsubmit block");
    } else {
        console.log("ERROR: Could not find onsubmit block. Attempting alternative replacement...");
        // Alternative: just find `if (document.getElementById('bloque-mediageneral').style.display !== 'none') {` and cut up to `matricula.media["total-gen-med"].fem =`
        const idxStart = mainJs.indexOf("if (document.getElementById('bloque-mediageneral').style.display !== 'none') {");
        const idxEnd = mainJs.indexOf('matricula.media["total-gen-med"].fem = ');
        if (idxStart !== -1 && idxEnd !== -1) {
            mainJs = mainJs.substring(0, idxStart) + newSubmitLogic + '\n\n            ' + mainJs.substring(idxEnd);
            console.log("SUCCESS: Replaced onsubmit block (alternative method).");
        } else {
            console.log("ERROR: Absolute failure to locate block.");
        }
    }

    fs.writeFileSync(mainPath, mainJs);

} catch (e) {
    console.error(e);
}
