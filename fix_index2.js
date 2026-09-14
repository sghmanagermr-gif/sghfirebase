const fs = require('fs');
const path = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';
let content = fs.readFileSync(path, 'utf8');

const toggleIndex = content.indexOf('id="toggle-vacantes"');
if (toggleIndex !== -1) {
    // Find the enclosing div before it
    // Wait, the structure is:
    // <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">
    //   <div>...</div>
    //   <div style="display: flex; gap: 10px;" id="toggle-vacantes">...</div>
    // </div>
    
    // So the parent div has `border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;`
    // Let's just find `padding-bottom: 15px;">` before toggleIndex.
    const searchString = 'padding-bottom: 15px;">';
    const beforeToggle = content.substring(0, toggleIndex);
    const parentIndex = beforeToggle.lastIndexOf('<div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid');
    
    if (parentIndex !== -1) {
        // Only add if it doesn't already have it
        const parentTag = beforeToggle.substring(parentIndex, beforeToggle.indexOf('>', parentIndex) + 1);
        if (!parentTag.includes('contenedor-pregunta-vacantes')) {
            content = content.substring(0, parentIndex) + '<div id="contenedor-pregunta-vacantes"' + content.substring(parentIndex + 4);
            fs.writeFileSync(path, content);
            console.log("SUCCESS: Added ID to index.html");
        } else {
            console.log("ID already present");
        }
    } else {
        console.log("Could not find parent div");
    }
} else {
    console.log("Could not find toggle-vacantes");
}
