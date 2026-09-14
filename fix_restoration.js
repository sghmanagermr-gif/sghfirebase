const fs = require('fs');
const path = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';
let content = fs.readFileSync(path, 'utf8');

// Replace maternal
const targetMaternal = `        // --- 1. MATERNAL ---
        if (b20.materna) {
            const numMat = Object.keys(b20.materna).length;`;
const replMaternal = `        // --- 1. MATERNAL ---
        if (b20.materna) {
            const numMat = Object.keys(b20.materna).filter(k => k.length === 1).length;`;

if (content.includes(targetMaternal)) {
    content = content.replace(targetMaternal, replMaternal);
}

// Replace preescolar
const targetPreescolar = `        // --- 2. PREESCOLAR ---
        if (b20.preescolar) {
            const numPre = Object.keys(b20.preescolar).length;`;
const replPreescolar = `        // --- 2. PREESCOLAR ---
        if (b20.preescolar) {
            const numPre = Object.keys(b20.preescolar).filter(k => k.length === 1).length;`;

if (content.includes(targetPreescolar)) {
    content = content.replace(targetPreescolar, replPreescolar);
}

// Replace primaria
const targetPrimaria = `        // --- 3. PRIMARIA ---
        if (Object.keys(b21).length > 0) {
            let totalPri = 0;
            for (let g = 1; g <= 6; g++) {
                if (b21[String(g)]) totalPri += Object.keys(b21[String(g)]).length;
            }`;
const replPrimaria = `        // --- 3. PRIMARIA ---
        if (Object.keys(b21).length > 0) {
            let totalPri = 0;
            for (let g = 1; g <= 6; g++) {
                if (b21[String(g)]) totalPri += Object.keys(b21[String(g)]).filter(k => k.length === 1).length;
            }`;

if (content.includes(targetPrimaria)) {
    content = content.replace(targetPrimaria, replPrimaria);
}

// Ensure the condition for fallback allows legacy fallback if mat.basica is missing
const targetFallback = `    } else if (dataParcial && dataParcial.matricula_detalle) {`;
const targetIf = `    if (dataParcial && dataParcial.matricula) {`;
const replIf = `    if (dataParcial && dataParcial.matricula && typeof dataParcial.matricula === 'object' && Object.keys(dataParcial.matricula).length > 0) {`;

if (content.includes(targetIf)) {
    content = content.replace(targetIf, replIf);
}

fs.writeFileSync(path, content, 'utf8');
console.log("Restoration logic fixed!");
