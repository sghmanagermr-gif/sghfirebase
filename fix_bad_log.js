const fs = require('fs');

try {
    const mainPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';
    let mainJs = fs.readFileSync(mainPath, 'utf8');

    // Remove the bad debug log that references 'payload' before it's declared
    // These lines were injected in the previous patch and cause a ReferenceError TDZ
    const badLog1 = `          try {
              console.log("-> PREPARING TO SAVE PAYLOAD:");
              console.log(JSON.parse(JSON.stringify(payload)));
              const docRef = doc(db, "planteles", codigoDEA);`;
              
    const cleanTry = `          try {
              const docRef = doc(db, "planteles", codigoDEA);`;

    if (mainJs.includes(badLog1)) {
        mainJs = mainJs.replace(badLog1, cleanTry);
        console.log("SUCCESS: Removed bad debug logs that caused TDZ error.");
    } else {
        console.log("NOTE: Bad debug log not found (may already be clean).");
    }

    fs.writeFileSync(mainPath, mainJs);
    console.log("File saved.");

    // Also verify the payload is declared BEFORE it's used
    const tryIdx = mainJs.indexOf("try {\n              const docRef = doc(db,");
    const payloadIdx = mainJs.indexOf("const payload = {");
    const safeSetDocIdx = mainJs.indexOf("await safeSetDoc(docRef, payload");
    
    if (tryIdx !== -1 && payloadIdx !== -1 && safeSetDocIdx !== -1) {
        if (payloadIdx < safeSetDocIdx) {
            console.log("OK: payload declared before safeSetDoc call.");
        } else {
            console.log("ERROR: payload declared AFTER safeSetDoc call! Bug present.");
        }
    }

} catch(e) {
    console.error(e);
}
