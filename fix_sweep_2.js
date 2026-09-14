const fs = require('fs');
const path = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';

let content = fs.readFileSync(path, 'utf8');

const targetRegex = /if \(obj\[key\] === 0\) \{\s*\/\/ Preservar llaves requeridas por el modelo de datos de Media\s*if \(!key\.startsWith\("total-med-"\)[^}]+\}\s*\}/;

if (targetRegex.test(content)) {
    content = content.replace(targetRegex, `if (obj[key] === 0) {\n                          delete obj[key];\n                      }`);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Success! Cleaned up sweepZeros.");
} else {
    console.log("Regex not found.");
}
