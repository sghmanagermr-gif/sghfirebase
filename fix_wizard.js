const fs = require('fs');

const wizardJsPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\personalWizard.js';
let content = fs.readFileSync(wizardJsPath, 'utf8');

// The file currently has a broken `mostrarFormularioPersonal` that ends with `if (window.currentPlantelDEA) {`
// and then immediately `window.mostrarFormularioPersonal = mostrarFormularioPersonal;`
// And `cerrarFormularioPersonal` might be completely missing! 
// Let's check if it exists:

if (!content.includes('export function cerrarFormularioPersonal')) {
  // We need to inject both functions correctly before `window.mostrarFormularioPersonal`
  const brokenPart = `export function mostrarFormularioPersonal() {
        limpiarFormularioPersonal();
        const contenedor = document.getElementById('seccion-registro-personal');
        const contenedorTabla = document.getElementById('seccion-personal-existente');
        
        if (contenedorTabla) contenedorTabla.style.display = 'block';
        if (contenedor) {
            contenedor.style.display = 'block';
            if(contenedorTabla) {
                contenedorTabla.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                contenedor.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
        
        if (window.currentPlantelDEA) {`;
  
  const correctFunctions = `export function mostrarFormularioPersonal() {
    limpiarFormularioPersonal();
    const contenedor = document.getElementById('seccion-registro-personal');
    const contenedorTabla = document.getElementById('seccion-personal-existente');
    
    if (contenedorTabla) contenedorTabla.style.display = 'block';
    if (contenedor) {
        contenedor.style.display = 'block';
        if(contenedorTabla) {
            contenedorTabla.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            contenedor.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    
    if (window.currentPlantelDEA) {
        cargarPersonalExistente(window.currentPlantelDEA);
    }
}

export function cerrarFormularioPersonal() {
    const contenedor = document.getElementById('seccion-registro-personal');
    const contenedorTabla = document.getElementById('seccion-personal-existente');
    if (contenedor) {
        contenedor.style.display = 'none';
    }
    if (contenedorTabla) {
        contenedorTabla.style.display = 'none';
    }
}

`;

  // We will replace everything from `export function mostrarFormularioPersonal()` down to `window.mostrarFormularioPersonal`
  const regex = /export function mostrarFormularioPersonal\(\) \{[\s\S]*?(?=window\.mostrarFormularioPersonal = mostrarFormularioPersonal;)/;
  content = content.replace(regex, correctFunctions);

}

fs.writeFileSync(wizardJsPath, content);
console.log("Fixed personalWizard.js");
