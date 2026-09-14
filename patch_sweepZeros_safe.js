const fs = require('fs');
const path = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';

let content = fs.readFileSync(path, 'utf8');

// Replace whitelist definition
const wlTarget = "const whitelist = ['modalidades', 'adulto', 'especial', 'total-gen-fem', 'total-gen-mas', 'total-gen', 'total-vac-gen-fem', 'total-vac-gen-mas', 'total-vac-gen'];";
const wlReplacement = "const whitelist = []; // Zero-Cost Optimization";

const rkTarget = "const reqKeys = ['basica', 'media'];";
const rkReplacement = "const reqKeys = []; // Zero-Cost Optimization";

if (content.includes(wlTarget)) {
    content = content.replace(wlTarget, wlReplacement);
    console.log('Whitelist replaced');
} else {
    console.log('Whitelist target NOT found');
}

if (content.includes(rkTarget)) {
    content = content.replace(rkTarget, rkReplacement);
    console.log('reqKeys replaced');
} else {
    console.log('reqKeys target NOT found');
}

fs.writeFileSync(path, content, 'utf8');
console.log('Patch script finished.');
