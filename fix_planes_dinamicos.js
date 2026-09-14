const fs = require('fs');

try {
    const mainPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';
    let mainJs = fs.readFileSync(mainPath, 'utf8');

    // 1. Inject the dynamic builder before `const matricula = {`
    const insertPoint = `const seccionesPlanes = {};\r\n            const matricula = {`;
    // If not found with \r\n, try without \r
    let actualInsertPoint = `const seccionesPlanes = {};\n            const matricula = {`;
    if (mainJs.includes(insertPoint)) actualInsertPoint = insertPoint;
    else if (!mainJs.includes(actualInsertPoint)) {
        console.log("Could not find the start of matricula declaration.");
    }

    if (!mainJs.includes('_dynMG')) {
        const dynamicBuilder = `
            const _dynMG = { "total-med-fem": 0, "total-med-mas": 0, "total-med-gen": 0 };
            const _dynMT = { "total-med-fem": 0, "total-med-mas": 0, "total-med-tec": 0 };
            Object.keys(planes).forEach(p => {
                if (p.startsWith('3') && p.length === 5) {
                    _dynMG[p] = { fem: 0, mas: 0, total: 0 };
                    _dynMG[\`total-med-\${p}-fem\`] = 0;
                    _dynMG[\`total-med-\${p}-mas\`] = 0;
                    _dynMG[\`total-med-\${p}\`] = 0;
                } else if (p.startsWith('4') && p.length === 5) {
                    _dynMT[p] = { fem: 0, mas: 0, total: 0 };
                    _dynMT[\`total-med-\${p}-fem\`] = 0;
                    _dynMT[\`total-med-\${p}-mas\`] = 0;
                    _dynMT[\`total-med-\${p}\`] = 0;
                }
            });

            const seccionesPlanes = {};
            const matricula = {`;
        
        mainJs = mainJs.replace(actualInsertPoint, dynamicBuilder);
        console.log("SUCCESS: Injected dynamic builder.");
    }

    // 2. Replace the hardcoded media object
    const mediaRegex = /"media":\s*\{\s*"media-general":\s*\{[\s\S]*?"total-gen-med":\s*\{\s*"fem": 0,\s*"mas": 0,\s*"total": 0\s*\}\s*\}/;
    const newMedia = `"media": {
                    "media-general": _dynMG,
                    "media-tecnica": _dynMT,
                    "total-gen-med": {
                        "fem": 0,
                        "mas": 0,
                        "total": 0
                    }
                }`;
    if (mediaRegex.test(mainJs)) {
        mainJs = mainJs.replace(mediaRegex, newMedia);
        console.log("SUCCESS: Replaced hardcoded media object.");
    } else {
        console.log("ERROR: Could not find hardcoded media object to replace.");
    }

    fs.writeFileSync(mainPath, mainJs);

} catch (e) {
    console.error(e);
}
