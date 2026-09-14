const fs = require('fs');

// PATCH INDEX.HTML
const pathHtml = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';
let contentHtml = fs.readFileSync(pathHtml, 'utf8');

const lines = contentHtml.split('\n');
let filteredLines = lines.filter(l => 
    !l.includes('id="priFem"') && 
    !l.includes('id="priMas"')
);

let newHtml = filteredLines.join('\n');
newHtml = newHtml.replace(
    /grid-template-columns:\s*1fr\s+1fr\s+1fr;\s*gap:\s*15px;\s*margin-bottom:\s*20px;"\>\s*<div\><label style="font-size:\s*0\.75rem;\s*color:\s*#64748b;"\>Secciones Totales/g,
    'grid-template-columns: 1fr; gap: 15px; margin-bottom: 20px;">\n                  <div><label style="font-size: 0.75rem; color: #64748b;">Secciones Totales'
);

fs.writeFileSync(pathHtml, newHtml, 'utf8');
console.log('index.html patched');

// PATCH MAIN.JS
const pathJs = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';
let contentJs = fs.readFileSync(pathJs, 'utf8');
contentJs = contentJs.replace(
    /\'priFem\',\s*\'priMas\',\s*/g,
    ''
);

fs.writeFileSync(pathJs, contentJs, 'utf8');
console.log('main.js patched');
