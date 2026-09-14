const fs = require('fs');

// PATCH INDEX.HTML
const pathHtml = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';
let contentHtml = fs.readFileSync(pathHtml, 'utf8');

const lines = contentHtml.split('\n');
let filteredLines = lines.filter(l => 
    !l.includes('id="matFem"') && 
    !l.includes('id="matMas"') && 
    !l.includes('id="preFem"') && 
    !l.includes('id="preMas"')
);

let newHtml = filteredLines.join('\n');
newHtml = newHtml.replace(
    /grid-template-columns:\s*1fr\s+1fr\s+1fr;\s*gap:\s*15px;\s*margin-bottom:\s*20px;"\>\s*<div\><label style="font-size:\s*0\.75rem;\s*color:\s*#64748b;"\>Maternal Sec/g,
    'grid-template-columns: 1fr; gap: 15px; margin-bottom: 20px;">\n                  <div><label style="font-size: 0.75rem; color: #64748b;">Maternal Sec'
);

newHtml = newHtml.replace(
    /grid-template-columns:\s*1fr\s+1fr\s+1fr;\s*gap:\s*15px;\s*margin-bottom:\s*20px;"\>\s*<div\><label style="font-size:\s*0\.75rem;\s*color:\s*#64748b;"\>Preescolar Sec/g,
    'grid-template-columns: 1fr; gap: 15px; margin-bottom: 20px;">\n                  <div><label style="font-size: 0.75rem; color: #64748b;">Preescolar Sec'
);

fs.writeFileSync(pathHtml, newHtml, 'utf8');
console.log('index.html patched');

// PATCH MAIN.JS
const pathJs = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';
let contentJs = fs.readFileSync(pathJs, 'utf8');
contentJs = contentJs.replace(
    /\[\'matFem\',\s*\'matMas\',\s*\'secMat\',\s*\'preFem\',\s*\'preMas\',\s*\'secPre\',/g,
    "['secMat', 'secPre',"
);

fs.writeFileSync(pathJs, contentJs, 'utf8');
console.log('main.js patched');
