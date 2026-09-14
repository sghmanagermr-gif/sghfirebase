const fs = require('fs');
const path = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';
let content = fs.readFileSync(path, 'utf8');

// The original string is: /primaria-(d)([A-Z])/
// We want to replace it with: /primaria-(\d)([A-Z])/
const originalString = "/primaria-(d)([A-Z])/";
const newString = "/primaria-(\\d)([A-Z])/";

content = content.split(originalString).join(newString);

fs.writeFileSync(path, content, 'utf8');
console.log("Replaced successfully!");
