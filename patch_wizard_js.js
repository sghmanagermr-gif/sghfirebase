const fs = require('fs');
const path = require('path');

const jsPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\personalWizard.js';

const jsContent = `
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase.js';

let currentStep = 1;
const totalSteps = 4;
let empleadoActual = {};

export function abrirWizardPersonal() {
    currentStep = 1;
    empleadoActual = {};
    limpiarFormularioWizard();
    actualizarVistaWizard();
    document.getElementById('wizard-personal-modal').style.display = 'flex';
}

export function cerrarWizardPersonal() {
    document.getElementById('wizard-personal-modal').style.display = 'none';
}

export function navegarWizardPersonal(direccion) {
    // Validaciones básicas antes de avanzar
    if (direccion === 1) {
        if (currentStep === 1) {
            const cedula = document.getElementById('wp-cedula').value.trim();
            const nombres = document.getElementById('wp-nombre-apellido').value.trim();
            if (!cedula || !nombres) {
                alert("Por favor, complete al menos la Cédula y los Nombres.");
                return;
            }
        }
    }

    currentStep += direccion;
    
    // Bounds check
    if (currentStep < 1) currentStep = 1;
    if (currentStep > totalSteps) currentStep = totalSteps;

    actualizarVistaWizard();
}

function actualizarVistaWizard() {
    // Actualizar progreso
    const progress = (currentStep / totalSteps) * 100;
    document.getElementById('wizard-progress-bar').style.width = \`\${progress}%\`;

    // Títulos de los pasos
    const titulos = [
        "Paso 1: Datos Personales",
        "Paso 2: Datos Institucionales",
        "Paso 3: Datos Laborales y Académicos",
        "Paso 4: Salud, Socioeconómico y Político"
    ];
    document.getElementById('wizard-step-title').innerText = titulos[currentStep - 1];

    // Mostrar ocultar steps
    for (let i = 1; i <= totalSteps; i++) {
        const stepDiv = document.getElementById(\`wizard-step-\${i}\`);
        if (stepDiv) {
            stepDiv.style.display = (i === currentStep) ? 'block' : 'none';
        }
    }

    // Botones
    document.getElementById('wp-btn-prev').style.display = (currentStep === 1) ? 'none' : 'block';
    
    if (currentStep === totalSteps) {
        document.getElementById('wp-btn-next').style.display = 'none';
        document.getElementById('wp-btn-save').style.display = 'block';
    } else {
        document.getElementById('wp-btn-next').style.display = 'block';
        document.getElementById('wp-btn-save').style.display = 'none';
    }
}

export async function guardarWizardPersonal() {
    try {
        const btnSave = document.getElementById('wp-btn-save');
        btnSave.disabled = true;
        btnSave.innerText = 'Guardando...';

        // Recolectar datos
        const datos = {
            "cedula": document.getElementById('wp-cedula').value.trim(),
            "nacionalidad": document.getElementById('wp-nacionalidad').value,
            "nombre-apellido": document.getElementById('wp-nombre-apellido').value.trim().toUpperCase(),
            "fecha-nacimiento": document.getElementById('wp-fecha-nacimiento').value,
            "edad": document.getElementById('wp-edad').value,
            "genero": document.getElementById('wp-genero').value,
            "estado-civil": document.getElementById('wp-estado-civil').value,
            "lugar-nacimiento": document.getElementById('wp-lugar-nacimiento').value.toUpperCase(),
            "correo": document.getElementById('wp-correo').value.toLowerCase(),
            "tel-celular": document.getElementById('wp-tel-celular').value,
            "tel-habitacion": document.getElementById('wp-tel-habitacion').value,
            "direccion": document.getElementById('wp-direccion').value.toUpperCase(),
            "estado": document.getElementById('wp-estado').value.toUpperCase(),
            "municipio": document.getElementById('wp-municipio').value.toUpperCase(),
            "parroquia": document.getElementById('wp-parroquia').value.toUpperCase(),
            "instruccion": document.getElementById('wp-instruccion').value.toUpperCase(),
            "profesion": document.getElementById('wp-profesion').value.toUpperCase(),

            "ubicacion-fisica": document.getElementById('wp-ubicacion-fisica').value.toUpperCase(),
            "codigo-plantel": document.getElementById('wp-codigo-plantel').value.toUpperCase(),
            "codigo-estadistico": document.getElementById('wp-codigo-estadistico').value,
            "dependencia": document.getElementById('wp-dependencia').value,
            "ubicacion-geografica": document.getElementById('wp-ubicacion-geografica').value.toUpperCase(),
            "codigo-dependencia-1": document.getElementById('wp-codigo-dependencia-1').value,
            "ubicacion-administrativa": document.getElementById('wp-ubicacion-administrativa').value,
            "nivel": document.getElementById('wp-nivel').value.toUpperCase(),
            "modalidad": document.getElementById('wp-modalidad').value.toUpperCase(),
            "turnos-plantel": document.getElementById('wp-turnos-plantel').value.toUpperCase(),

            "tipo-personal": document.getElementById('wp-tipo-personal').value,
            "situacion-laboral": document.getElementById('wp-situacion-laboral').value,
            "cargo": document.getElementById('wp-cargo').value.toUpperCase(),
            "subcategoria": document.getElementById('wp-subcategoria').value.toUpperCase(),
            "codigo-rac": document.getElementById('wp-codigo-rac').value.toUpperCase(),
            "titular": document.getElementById('wp-titular').value,
            "horas-academicas": document.getElementById('wp-horas-academicas').value,
            "horas-administrativas": document.getElementById('wp-horas-administrativas').value,
            "fecha-ingreso": document.getElementById('wp-fecha-ingreso').value,
            "antiguedad": document.getElementById('wp-antiguedad').value,
            "turnos-atiende": document.getElementById('wp-turnos-atiende').value.toUpperCase(),
            "atiende-matricula": document.getElementById('wp-atiende-matricula').value,
            "nivel-modalidad": document.getElementById('wp-nivel-modalidad').value.toUpperCase(),
            "especialidad-imparte": document.getElementById('wp-especialidad-imparte').value.toUpperCase(),
            "observaciones": document.getElementById('wp-observaciones').value.toUpperCase(),

            "talla-camisa": document.getElementById('wp-talla-camisa').value.toUpperCase(),
            "talla-pantalon": document.getElementById('wp-talla-pantalon').value.toUpperCase(),
            "talla-zapato": document.getElementById('wp-talla-zapato').value.toUpperCase(),
            "tipo-enfermedad": document.getElementById('wp-tipo-enfermedad').value.toUpperCase(),
            "medicamento": document.getElementById('wp-medicamento').value.toUpperCase(),
            "discapacidad": document.getElementById('wp-discapacidad').value,
            "tipo-vivienda": document.getElementById('wp-tipo-vivienda').value.toUpperCase(),
            "condicion-vivienda": document.getElementById('wp-condicion-vivienda').value.toUpperCase(),
            "tipo-material": document.getElementById('wp-tipo-material').value.toUpperCase(),
            "actividad-deportiva": document.getElementById('wp-actividad-deportiva').value.toUpperCase(),
            "actividad-cultural": document.getElementById('wp-actividad-cultural').value.toUpperCase(),
            "ubch": document.getElementById('wp-ubch').value.toUpperCase(),
            "circuito-comunal": document.getElementById('wp-circuito-comunal').value.toUpperCase(),
            "centro-votacion": document.getElementById('wp-centro-votacion').value.toUpperCase()
        };

        if (!datos.cedula) throw new Error("Cédula obligatoria");

        // Guardar en Firestore usando la cédula como ID del documento
        await setDoc(doc(db, "cargos_personal", datos.cedula), datos, { merge: true });

        alert("Empleado guardado exitosamente.");
        cerrarWizardPersonal();
        
        // Disparar evento para actualizar el contador de personal si existe
        document.dispatchEvent(new Event('personalActualizado'));

    } catch (error) {
        console.error("Error guardando empleado:", error);
        alert("Ocurrió un error al guardar: " + error.message);
    } finally {
        const btnSave = document.getElementById('wp-btn-save');
        btnSave.disabled = false;
        btnSave.innerText = 'Guardar Empleado';
    }
}

function limpiarFormularioWizard() {
    const inputs = document.querySelectorAll('#wizard-personal-modal input');
    inputs.forEach(input => {
        if (input.type !== 'number' && input.type !== 'date') {
            if (input.id !== 'wp-estado') input.value = ''; // Mantener "MERIDA" por defecto
        } else if (input.type === 'number') {
            if (input.id.includes('horas')) input.value = '0';
            else input.value = '';
        }
    });

    const selects = document.querySelectorAll('#wizard-personal-modal select');
    selects.forEach(select => select.selectedIndex = 0);

    // Valores por defecto específicos
    document.getElementById('wp-tipo-enfermedad').value = "NO APLICA";
    document.getElementById('wp-medicamento').value = "NO APLICA";
}

// Lógica para auto-calcular Edad y Antigüedad
function setupAutoCalculos() {
    const fechaNac = document.getElementById('wp-fecha-nacimiento');
    if (fechaNac) {
        fechaNac.addEventListener('change', (e) => {
            if (!e.target.value) return;
            const nac = new Date(e.target.value);
            const hoy = new Date();
            let edad = hoy.getFullYear() - nac.getFullYear();
            const m = hoy.getMonth() - nac.getMonth();
            if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) {
                edad--;
            }
            document.getElementById('wp-edad').value = edad;
        });
    }

    const fechaIng = document.getElementById('wp-fecha-ingreso');
    if (fechaIng) {
        fechaIng.addEventListener('change', (e) => {
            if (!e.target.value) return;
            const ing = new Date(e.target.value);
            const hoy = new Date();
            let antiguedad = hoy.getFullYear() - ing.getFullYear();
            const m = hoy.getMonth() - ing.getMonth();
            if (m < 0 || (m === 0 && hoy.getDate() < ing.getDate())) {
                antiguedad--;
            }
            document.getElementById('wp-antiguedad').value = antiguedad;
        });
    }
}

// Auto-init
setTimeout(setupAutoCalculos, 1000);

// Exportar globalmente para que HTML onclick funcione
window.abrirWizardPersonal = abrirWizardPersonal;
window.cerrarWizardPersonal = cerrarWizardPersonal;
window.navegarWizardPersonal = navegarWizardPersonal;
window.guardarWizardPersonal = guardarWizardPersonal;
`;

fs.writeFileSync(jsPath, jsContent, 'utf8');
console.log('personalWizard.js creado correctamente.');

// Add import to main.js
const mainJsPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';
let mainContent = fs.readFileSync(mainJsPath, 'utf8');
if (!mainContent.includes('import \'./personalWizard.js\';')) {
    mainContent = "import './personalWizard.js';\n" + mainContent;
    fs.writeFileSync(mainJsPath, mainContent, 'utf8');
    console.log('Import agregado a main.js');
}
