const fs = require('fs');

try {
    const mainPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';
    let mainJs = fs.readFileSync(mainPath, 'utf8');

    // 1. Replace the "media" object initialization
    // We search for:
    /*
                "media": {
                    "media-general": {
                        "total-med-fem": 0,
                        "total-med-mas": 0,
                        "total-med-gen": 0
                    },
                    "media-tecnica": {
                        "total-med-fem": 0,
                        "total-med-mas": 0,
                        "total-med-tec": 0
                    },
                    "total-gen-med": {
                        "fem": 0,
                        "mas": 0,
                        "total": 0
                    }
                }
    */
    const mediaInitRegex = /"media":\s*\{\s*"media-general":\s*\{[\s\S]*?"total-med-gen": 0\s*\},\s*"media-tecnica":\s*\{[\s\S]*?"total-med-tec": 0\s*\},\s*"total-gen-med":\s*\{[\s\S]*?"total": 0\s*\}\s*\}/;
    
    const newMediaInit = `"media": {
                    "media-general": {
                        "31059": { "fem": 0, "mas": 0, "total": 0 },
                        "31060": { "fem": 0, "mas": 0, "total": 0 },
                        "total-med-31059-fem": 0,
                        "total-med-31059-mas": 0,
                        "total-med-31059": 0,
                        "total-med-31060-fem": 0,
                        "total-med-31060-mas": 0,
                        "total-med-31060": 0,
                        "total-med-fem": 0,
                        "total-med-mas": 0,
                        "total-med-gen": 0
                    },
                    "media-tecnica": {
                        "41052": { "fem": 0, "mas": 0, "total": 0 },
                        "45032": { "fem": 0, "mas": 0, "total": 0 },
                        "total-med-41052-fem": 0,
                        "total-med-41052-mas": 0,
                        "total-med-41052": 0,
                        "total-med-45032-fem": 0,
                        "total-med-45032-mas": 0,
                        "total-med-45032": 0,
                        "total-med-fem": 0,
                        "total-med-mas": 0,
                        "total-med-tec": 0
                    },
                    "total-gen-med": {
                        "fem": 0,
                        "mas": 0,
                        "total": 0
                    }
                }`;

    if (mediaInitRegex.test(mainJs)) {
        mainJs = mainJs.replace(mediaInitRegex, newMediaInit);
        console.log("SUCCESS: Replaced media initialization.");
    } else {
        console.log("ERROR: Could not find media initialization to replace.");
    }

    // 2. Add the assignment for the specific keys in Media General
    const mgLogicRegex = /matricula\.media\["media-general"\]\["total-med-gen"\] \+= \(mgFem \+ mgMas\);/;
    if (mgLogicRegex.test(mainJs)) {
        if (!mainJs.includes('total-med-${codMg}')) {
            mainJs = mainJs.replace(mgLogicRegex, (match) => {
                return match + `
                if (codMg) {
                    if (matricula.media["media-general"][\`total-med-\${codMg}-fem\`] !== undefined) {
                        matricula.media["media-general"][\`total-med-\${codMg}-fem\`] += mgFem;
                        matricula.media["media-general"][\`total-med-\${codMg}-mas\`] += mgMas;
                        matricula.media["media-general"][\`total-med-\${codMg}\`] += (mgFem + mgMas);
                    } else {
                        // Fallback in case they have a different plan not in the hardcoded list
                        matricula.media["media-general"][\`total-med-\${codMg}-fem\`] = mgFem;
                        matricula.media["media-general"][\`total-med-\${codMg}-mas\`] = mgMas;
                        matricula.media["media-general"][\`total-med-\${codMg}\`] = (mgFem + mgMas);
                    }
                }`;
            });
            console.log("SUCCESS: Added dynamic MG assignment.");
        }
    } else {
        console.log("ERROR: Could not find MG assignment logic.");
    }

    // 3. Add the assignment for the specific keys in Media Tecnica
    const mtLogicRegex = /matricula\.media\["media-tecnica"\]\["total-med-tec"\] \+= \(mtFem \+ mtMas\);/;
    if (mtLogicRegex.test(mainJs)) {
        if (!mainJs.includes('total-med-${codMt}')) {
            mainJs = mainJs.replace(mtLogicRegex, (match) => {
                return match + `
                if (codMt) {
                    if (matricula.media["media-tecnica"][\`total-med-\${codMt}-fem\`] !== undefined) {
                        matricula.media["media-tecnica"][\`total-med-\${codMt}-fem\`] += mtFem;
                        matricula.media["media-tecnica"][\`total-med-\${codMt}-mas\`] += mtMas;
                        matricula.media["media-tecnica"][\`total-med-\${codMt}\`] += (mtFem + mtMas);
                    } else {
                        matricula.media["media-tecnica"][\`total-med-\${codMt}-fem\`] = mtFem;
                        matricula.media["media-tecnica"][\`total-med-\${codMt}-mas\`] = mtMas;
                        matricula.media["media-tecnica"][\`total-med-\${codMt}\`] = (mtFem + mtMas);
                    }
                }`;
            });
            console.log("SUCCESS: Added dynamic MT assignment.");
        }
    } else {
        console.log("ERROR: Could not find MT assignment logic.");
    }

    fs.writeFileSync(mainPath, mainJs);

} catch (e) {
    console.error(e);
}
