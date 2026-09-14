const fs = require('fs');
const path = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';
let content = fs.readFileSync(path, 'utf8');

let changes = 0;

if (content.includes('class="sec-input sec-inicial" id="secMat"')) {
    content = content.replace('class="sec-input sec-inicial" id="secMat"', 'class="sec-input sec-inicial sec-master-input" id="secMat"');
    changes++;
}
if (content.includes('class="sec-input sec-inicial" id="secPre"')) {
    content = content.replace('class="sec-input sec-inicial" id="secPre"', 'class="sec-input sec-inicial sec-master-input" id="secPre"');
    changes++;
}
if (content.includes('class="sec-input sec-primaria" id="secPri"')) {
    content = content.replace('class="sec-input sec-primaria" id="secPri"', 'class="sec-input sec-primaria sec-master-input" id="secPri"');
    changes++;
}

fs.writeFileSync(path, content, 'utf8');
console.log('Done! Added sec-master-input class. Changes:', changes);
