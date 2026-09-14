const fs = require('fs');

// 1. Fix index.html
const indexHtmlPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';
let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

// The line we want to replace
const searchRegex = /<div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid\s+#f1f5f9; padding-bottom: 15px;">(\s*<div>\s*<h4[^>]*>¿El plantel tiene Vacantes Físicas\?<\/h4>)/i;

if (searchRegex.test(indexHtml)) {
    indexHtml = indexHtml.replace(searchRegex, '<div id="contenedor-pregunta-vacantes" style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">$1');
    fs.writeFileSync(indexHtmlPath, indexHtml);
    console.log("Fixed index.html");
} else {
    console.log("Could not find the target div in index.html");
}

// 2. Fix main.js
const mainJsPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';
let mainJs = fs.readFileSync(mainJsPath, 'utf8');

// Replace the querySelector('button') bug
const submitBug = `const btn = plantelForm.querySelector('button');
        btn.textContent = "Guardando...";
        btn.disabled = true;`;
const submitFix = `const btn = document.getElementById('btn-guardar-matricula');
        if (btn) {
            btn.textContent = "Guardando...";
            btn.disabled = true;
        }`;

if (mainJs.includes(submitBug)) {
    mainJs = mainJs.replace(submitBug, submitFix);
} else {
    // maybe they used single quotes or spacing is different
    const submitRegex = /const btn = plantelForm\.querySelector\('button'\);\s*btn\.textContent = "Guardando\.\.\.";\s*btn\.disabled = true;/;
    if (submitRegex.test(mainJs)) {
        mainJs = mainJs.replace(submitRegex, submitFix);
    } else {
        console.log("Could not find the submit button bug in main.js");
    }
}

// Replace the finally block
const finallyBug = `        } finally {
            btn.textContent = "Guardar y Desbloquear Sistema";
            btn.disabled = false;
        }`;
const finallyFix = `        } finally {
            if (btn) {
                btn.textContent = "Guardar y Desbloquear Sistema";
                btn.disabled = false;
            }
        }`;

if (mainJs.includes(finallyBug)) {
    mainJs = mainJs.replace(finallyBug, finallyFix);
} else {
    const finallyRegex = /} finally {\s*btn\.textContent = "Guardar y Desbloquear Sistema";\s*btn\.disabled = false;\s*}/;
    if (finallyRegex.test(mainJs)) {
        mainJs = mainJs.replace(finallyRegex, finallyFix);
    } else {
         console.log("Could not find the finally bug in main.js");
    }
}

// Make sure the vacantes logic uses ID
const vacantesLogic = `const contVacantes = document.getElementById('contenedor-pregunta-vacantes');`;
if (!mainJs.includes(vacantesLogic)) {
    console.log("Vacantes logic seems missing in main.js");
}

fs.writeFileSync(mainJsPath, mainJs);
console.log("Fixed main.js");
