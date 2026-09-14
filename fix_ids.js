const fs = require('fs');
const path = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';
let content = fs.readFileSync(path, 'utf8');

let changes = 0;

if (content.includes('inp-sec-maternal')) {
    content = content.replace(/inp-sec-maternal/g, 'secMat');
    changes++;
}
if (content.includes('inp-sec-preescolar')) {
    content = content.replace(/inp-sec-preescolar/g, 'secPre');
    changes++;
}
if (content.includes('inp-sec-primaria')) {
    content = content.replace(/inp-sec-primaria/g, 'secPri');
    changes++;
}

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed wrong IDs in main.js. Changes:', changes);
