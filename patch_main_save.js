const fs = require('fs');
const path = require('path');

try {
    const mainPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';
    let mainJs = fs.readFileSync(mainPath, 'utf8');

    // Find the try block for safeSetDoc
    const targetStr = `          try {\r
              const docRef = doc(db, "planteles", codigoDEA);`;
              
    const targetStr2 = `          try {\n              const docRef = doc(db, "planteles", codigoDEA);`;

    const replaceWith = `          try {
              console.log("-> PREPARING TO SAVE PAYLOAD:");
              console.log(JSON.parse(JSON.stringify(payload)));
              const docRef = doc(db, "planteles", codigoDEA);`;

    if (mainJs.includes(targetStr)) {
        mainJs = mainJs.replace(targetStr, replaceWith);
        fs.writeFileSync(mainPath, mainJs);
        console.log("Patched successfully with \\r\\n");
    } else if (mainJs.includes(targetStr2)) {
        mainJs = mainJs.replace(targetStr2, replaceWith);
        fs.writeFileSync(mainPath, mainJs);
        console.log("Patched successfully with \\n");
    } else {
        console.log("Target string not found! Injecting catch-all debug...");
        // Just inject at the end of total-gen-med calculation
        const altTarget = `matricula.media["total-gen-med"].total = matricula.media["total-gen-med"].fem + matricula.media["total-gen-med"].mas;`;
        if (mainJs.includes(altTarget)) {
             mainJs = mainJs.replace(altTarget, altTarget + `\n          console.log("-> REACHED END OF MEDIA CALC");`);
             fs.writeFileSync(mainPath, mainJs);
             console.log("Alternative patch successful");
        } else {
             console.log("COULD NOT PATCH!");
        }
    }
} catch(e) {
    console.error(e);
}
