const fs = require('fs');

try {
    const mainPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';
    let mainJs = fs.readFileSync(mainPath, 'utf8');

    // Find the sweepZeros function
    const sweepRegex = /if \(obj\[key\] === 0\) \{\s*delete obj\[key\];\s*\}/g;
    
    if (sweepRegex.test(mainJs)) {
        mainJs = mainJs.replace(sweepRegex, `if (obj[key] === 0) {
                            // Preservar llaves requeridas por el modelo de datos de Media
                            if (!key.startsWith("total-med-") && !["31059", "31060", "41052", "45032"].includes(key) && !["fem", "mas", "total"].includes(key)) {
                                delete obj[key];
                            }
                        }`);
        console.log("SUCCESS: Patched sweepZeros to preserve Media keys.");
    } else {
        console.log("ERROR: Could not find sweepZeros condition.");
    }

    fs.writeFileSync(mainPath, mainJs);
} catch (e) {
    console.error(e);
}
