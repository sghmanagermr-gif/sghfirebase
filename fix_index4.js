const fs = require('fs');
const path = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';
let content = fs.readFileSync(path, 'utf8');

const str = '<div style="display: flex; gap: 10px;" id="toggle-vacantes">';
const toggleIndex = content.indexOf(str);

if (toggleIndex !== -1) {
    const beforeToggle = content.substring(0, toggleIndex);
    // trace back to find the parent <div
    // the nearest <div is the one containing h4. Let's trace back TWO <divs
    // wait, structure:
    // <div ... parent>
    //   <div> <h4 ...>...</div>
    //   <div id="toggle-vacantes">...</div>
    // </div>
    
    // Let's just do an indexOf the exact h4 text and then trace back from there
    const h4Index = content.indexOf('Vacantes');
    // Let's just find `justify-content: space-between; border-bottom: 1px solid`
    const searchString = 'justify-content: space-between; border-bottom: 1px solid';
    const parentMatch = content.indexOf(searchString);
    if (parentMatch !== -1) {
        const lastDivIndex = content.lastIndexOf('<div', parentMatch);
        if (lastDivIndex !== -1) {
            const parentTag = content.substring(lastDivIndex, content.indexOf('>', lastDivIndex) + 1);
            if (!parentTag.includes('contenedor-pregunta-vacantes')) {
                content = content.substring(0, lastDivIndex) + '<div id="contenedor-pregunta-vacantes"' + content.substring(lastDivIndex + 4);
                fs.writeFileSync(path, content);
                console.log("SUCCESS: Added ID to index.html");
            } else {
                console.log("ID already present");
            }
        }
    } else {
        console.log("Could not find searchString");
    }
} else {
    console.log("Could not find toggle-vacantes");
}
