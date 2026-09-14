const fs = require('fs');
const path = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';

let content = fs.readFileSync(path, 'utf8');

const regex = /\/\*\*\s*Escoba Digital:\s*elimina claves con valor 0 u objetos vacíos\s*\*\/\s*const sweepZeros = \(obj\) => \{[\s\S]*?\}\s*\n\s*\};/;

const replacementStr = `/** Escoba Digital: elimina claves con valor 0 u objetos vacíos */
          const sweepZeros = (obj) => {
              Object.keys(obj).forEach(key => {
                  // Lista blanca de propiedades globales vaciada (Zero-Cost Optimization)
                  const whitelist = [];
                  if (whitelist.includes(key)) return;

                  if (obj[key] === 0) {
                      delete obj[key];
                  } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                      sweepZeros(obj[key]);
                      // Llaves principales obligatorias vaciadas
                      const reqKeys = [];
                      if (Object.keys(obj[key]).length === 0 && !reqKeys.includes(key)) {
                          delete obj[key];
                      }
                  }
              });
          };`;

if (regex.test(content)) {
    content = content.replace(regex, replacementStr);
    fs.writeFileSync(path, content, 'utf8');
    console.log('sweepZeros patched successfully using regex.');
} else {
    console.error('Regex not found in main.js. Please check the file content.');
}
