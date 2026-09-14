const fs = require('fs');
const path = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';
let content = fs.readFileSync(path, 'utf8');

// The original string is: const match = inp.dataset.grupo.match(/primaria-(\d)([A-Z])/);
// We want to safely read dataset.grupo to avoid Cannot read properties of undefined
const originalString = "const match = inp.dataset.grupo.match(/primaria-(\\d)([A-Z])/);";
const newString = "if (!inp.dataset.grupo) return;\n                  const match = inp.dataset.grupo.match(/primaria-(\\d)([A-Z])/);";

content = content.split(originalString).join(newString);

fs.writeFileSync(path, content, 'utf8');
console.log("Safeguard added successfully!");
