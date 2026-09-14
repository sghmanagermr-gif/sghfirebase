const fs = require('fs');

try {
    const mainPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';
    let mainJs = fs.readFileSync(mainPath, 'utf8');

    // Fix the event listener scope
    const listenerRegex = /document\.getElementById\('contenedor-matricula'\)\?\.addEventListener\('input',/g;
    
    if (listenerRegex.test(mainJs)) {
        mainJs = mainJs.replace(listenerRegex, `document.getElementById('plantel-form')?.addEventListener('input',`);
        console.log("SUCCESS: Replaced listener scope.");
    } else {
        console.log("ERROR: Could not find listener.");
    }

    fs.writeFileSync(mainPath, mainJs);

} catch (e) {
    console.error(e);
}
