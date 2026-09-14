const fs = require('fs');
const indexHtmlPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';
let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

// I'll search for "El plantel tiene Vacantes F"
const vacantesRegex = /<div style="[^"]*">\s*<div[^>]*>\s*<h4[^>]*>¿El plantel tiene Vacantes Físicas\?<\/h4>/i;

const match = indexHtml.match(/<div style="([^"]*)">\s*<div[^>]*>\s*<h4[^>]*>¿El plantel tiene Vacantes Físicas\?<\/h4>/i);
if (match) {
    const style = match[1];
    // We will replace that specific <div> with <div id="contenedor-pregunta-vacantes" style="...">
    const replacementStr = '<div id="contenedor-pregunta-vacantes" style="' + style + '">';
    // Let's replace the first '<div style="...">' in the match
    
    // An easier way is just to add id="contenedor-pregunta-vacantes" to the div that has the text
    // Wait, the div that has the text is a parent div.
    
    // Instead of regex replacing the whole thing, let's just do a string replace of the exact string
    const startIndex = indexHtml.indexOf('<h4 style="margin: 0; color: #0f172a; font-size: 1rem;">¿El plantel tiene Vacantes Físicas?</h4>');
    if (startIndex !== -1) {
        // Find the previous <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid 
        // We'll just trace back to the nearest <div
        const beforeText = indexHtml.substring(0, startIndex);
        const lastDivIndex = beforeText.lastIndexOf('<div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid');
        if (lastDivIndex !== -1) {
            indexHtml = indexHtml.substring(0, lastDivIndex) + '<div id="contenedor-pregunta-vacantes"' + indexHtml.substring(lastDivIndex + 4);
            fs.writeFileSync(indexHtmlPath, indexHtml);
            console.log("Fixed index.html vacantes ID!");
        } else {
            console.log("Could not find parent div");
        }
    } else {
        console.log("Could not find the h4 tag");
    }
} else {
    // maybe it has encoding issues
    const regex2 = /<div style="[^"]*">\s*<div[^>]*>\s*<h4[^>]*>.*?El plantel tiene Vacantes F.*?sicas\?<\/h4>/i;
    const match2 = indexHtml.match(regex2);
    if (match2) {
        // same logic
        const targetStr = match2[0];
        indexHtml = indexHtml.replace(targetStr, targetStr.replace('<div style="', '<div id="contenedor-pregunta-vacantes" style="'));
        fs.writeFileSync(indexHtmlPath, indexHtml);
        console.log("Fixed index.html vacantes ID (fallback)!");
    } else {
        console.log("Could not find anything related to vacantes");
    }
}
