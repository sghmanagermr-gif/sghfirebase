const fs = require('fs');
const path = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';
let content = fs.readFileSync(path, 'utf8');

const targetArrayOld = `['matFem', 'matMas', 'secMat', 'preFem', 'preMas', 'secPre',
         'priFem', 'priMas', 'secPri', 'mgFem', 'mgMas', 'secMg', 'mtFem', 'mtMas', 'secMt']`;

const targetArrayNew = `['secMat', 'secPre',
         'priFem', 'priMas', 'secPri', 'mgFem', 'mgMas', 'secMg', 'mtFem', 'mtMas', 'secMt']`;

if (content.includes("['matFem'")) {
    content = content.split(targetArrayOld).join(targetArrayNew);
    fs.writeFileSync(path, content, 'utf8');
    console.log('main.js patched correctly');
} else {
    console.log('Array not found or already patched.');
}
