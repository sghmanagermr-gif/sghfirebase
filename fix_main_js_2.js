const fs = require('fs');
const path = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';

let content = fs.readFileSync(path, 'utf8');

const target = `window._forceSaveIncompleta = false;
const seccionesPlanes = {};
          const matricula = {`;

const replacement = `window._forceSaveIncompleta = false;
const _dynMG = { "total-med-fem": 0, "total-med-mas": 0, "total-med-gen": 0 };
const _dynMT = { "total-med-fem": 0, "total-med-mas": 0, "total-med-tec": 0 };
const seccionesPlanes = {};
          const matricula = {`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Success!");
} else {
    console.log("Target not found!");
}
