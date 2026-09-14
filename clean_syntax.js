const fs = require('fs');
const wizardJsPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\personalWizard.js';
let content = fs.readFileSync(wizardJsPath, 'utf8');

content = content.replace(/\\n/g, '');

fs.writeFileSync(wizardJsPath, content);
console.log("Cleaned syntax errors in personalWizard.js");
