const fs = require('fs');
const path = require('path');

function updateFiles(baseDir) {
    console.log('--- Updating files in', baseDir, '---');
    const indexPath = path.join(baseDir, 'index.html');
    const wizardPath = path.join(baseDir, 'src/personalWizard.js');

    // 1. Update index.html
    let indexHtml = fs.readFileSync(indexPath, 'utf8');
    const targetHeader = `<div class="search-wrapper">
            <span class="search-icon">
               <i class="bi bi-search"></i>
            </span>
            <input type="text" id="buscador-personal" class="search-input" placeholder="Buscar cédula o nombre...">
          </div>`;
    
    const replacementHeader = `<div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <button type="button" id="btn-descargar-nomina-excel" title="Exportar nómina completa en formato Excel (.xlsx)" style="display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #107c41 0%, #0d5c31 100%); color: #ffffff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 0.9rem; cursor: pointer; box-shadow: 0 2px 4px rgba(16, 124, 65, 0.2); transition: all 0.2s ease;" onmouseover="this.style.background='linear-gradient(135deg, #0d5c31 0%, #094022 100%)'; this.style.boxShadow='0 4px 8px rgba(16, 124, 65, 0.3)';" onmouseout="this.style.background='linear-gradient(135deg, #107c41 0%, #0d5c31 100%)'; this.style.boxShadow='0 2px 4px rgba(16, 124, 65, 0.2)';">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="8" y1="13" x2="16" y2="13"></line>
                <line x1="8" y1="17" x2="16" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              Descargar Nómina Excel
            </button>
            <div class="search-wrapper">
              <span class="search-icon">
                 <i class="bi bi-search"></i>
              </span>
              <input type="text" id="buscador-personal" class="search-input" placeholder="Buscar cédula o nombre...">
            </div>
          </div>`;

    if (!indexHtml.includes('id="btn-descargar-nomina-excel"')) {
        indexHtml = indexHtml.replace(targetHeader, replacementHeader);
        fs.writeFileSync(indexPath, indexHtml, 'utf8');
        console.log('index.html updated successfully.');
    } else {
        console.log('index.html already contains btn-descargar-nomina-excel.');
    }

    // 2. Update personalWizard.js
    let wizardJs = fs.readFileSync(wizardPath, 'utf8');

    // Add import * as XLSX from 'xlsx'; if missing
    if (!wizardJs.includes("import * as XLSX from 'xlsx'")) {
        wizardJs = "import * as XLSX from 'xlsx';\n" + wizardJs;
        console.log('Import XLSX added.');
    }

    // Ensure window._personalPlantelData is populated in cargarPersonalExistente
    const oldCargarEmpty = `        if (querySnapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #64748b;">No hay personal registrado en este plantel.</td></tr>';
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();`;

    const newCargarEmpty = `        if (querySnapshot.empty) {
            window._personalPlantelData = [];
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #64748b;">No hay personal registrado en este plantel.</td></tr>';
            return;
        }

        window._personalPlantelData = [];
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const docId = docSnap.id;
            window._personalPlantelData.push({ ...data, _docId: docId });`;

    if (wizardJs.includes(oldCargarEmpty)) {
        wizardJs = wizardJs.replace(oldCargarEmpty, newCargarEmpty);
        console.log('cargarPersonalExistente updated with window._personalPlantelData caching.');
    }

    // Add exportarNominaExcel function and button listener if missing
    if (!wizardJs.includes('export async function exportarNominaExcel()')) {
        const exportarFnCode = `
/**
 * Exportación exhaustiva de la nómina completa del plantel a Excel (.xlsx)
 * Abarca todos los campos desde Cédula hasta Centro de Votación (Costo Cero / Memoria Local)
 */
export async function exportarNominaExcel() {
    if (!window._personalPlantelData || window._personalPlantelData.length === 0) {
        showAlert("Aviso", "No hay registros de personal disponibles para exportar en este plantel.", "warning");
        return;
    }

    let dea = window.currentPlantelDEA || '';
    if (!dea && window.sgh_user_data && window.sgh_user_data.jerarquia) {
        dea = window.sgh_user_data.jerarquia.plantel_codigo;
    }
    if (!dea) {
        const stPlantel = localStorage.getItem('plantelSeleccionado');
        if (stPlantel) {
            try { dea = JSON.parse(stPlantel).codigoDEA; } catch(e) {}
        }
    }

    // Mapeo exhaustivo de la totalidad de campos institucionales
    const filasExcel = window._personalPlantelData.map((emp, index) => {
        const cedulaNum = emp['cedula-identidad'] || emp.cedula || '';
        const nacionalidad = emp['nacionalidad'] || (String(cedulaNum).startsWith('E') ? 'E' : 'V');
        const cedulaCompleta = emp['cedula_completa'] || (cedulaNum ? \`\${nacionalidad}-\${cedulaNum}\` : '');

        const priNombre = emp['primer-nombre'] || emp.primer_nombre || '';
        const segNombre = emp['segundo-nombre'] || emp.segundo_nombre || '';
        const priApellido = emp['primer-apellido'] || emp.primer_apellido || '';
        const segApellido = emp['segundo-apellido'] || emp.segundo_apellido || '';
        
        let nombreCompleto = emp['nombre-apellido'] || emp['apellidos-nombres'] || emp.nombre || '';
        if (!nombreCompleto) {
            nombreCompleto = \`\${priApellido} \${segApellido} \${priNombre} \${segNombre}\`.trim().replace(/\\s+/g, ' ');
        }

        const horasAcad = Number(emp['horas-academicas']) || 0;
        const horasAdmin = Number(emp['horas-administrativas']) || 0;
        const totalHoras = horasAcad + horasAdmin;

        return {
            'N°': index + 1,
            // 1. Identificación y Datos Personales
            'Nacionalidad': nacionalidad,
            'Cédula': cedulaNum,
            'Cédula Completa': cedulaCompleta,
            'Primer Apellido': priApellido,
            'Segundo Apellido': segApellido,
            'Primer Nombre': priNombre,
            'Segundo Nombre': segNombre,
            'Apellidos y Nombres': nombreCompleto.toUpperCase(),
            'Género': emp['genero'] || '',
            'Fecha de Nacimiento': emp['fecha-nacimiento'] || '',
            'Edad': emp['edad'] || '',
            'Estado Civil': emp['estado-civil'] || '',
            'Lugar de Nacimiento': emp['lugar-nacimiento'] || '',

            // 2. Ubicación y Contacto
            'Teléfono Habitación': emp['tel-habitacion'] || '',
            'Teléfono Celular': emp['tel-celular'] || '',
            'Teléfono Oficina': emp['tel-oficina'] || '',
            'Correo Electrónico': emp['correo'] || '',
            'Dirección de Habitación': emp['direccion'] || '',

            // 3. Formación Académica
            'Nivel de Instrucción': emp['nivel-instruccion'] || emp['instruccion'] || '',
            'Profesión / Título': emp['profesion'] || '',

            // 4. Ubicación Administrativa y Cargo
            'Código Plantel (DEA)': emp['codigo-plantel'] || emp.codigoDEA || dea,
            'Ubicación Administrativa': emp['ubicacion-administrativa'] || '',
            'Dependencia': emp['dependencia'] || '',
            'Tipo de Personal': emp['tipo-personal'] || '',
            'Subcategoría': emp['subcategoria'] || '',
            'Cargo': emp['cargo'] || '',
            'Código RAC': emp['codigo-rac'] || emp['codigo-cargo'] || '',
            'Condición': emp['titular'] || '',
            'Fecha de Ingreso': emp['fecha-ingreso'] || '',
            'Años de Antigüedad': emp['antiguedad'] || '',
            'Turnos que Atiende': emp['turnos-atiende'] || '',

            // 5. Carga Horaria y Pedagógica
            'Horas Académicas': horasAcad,
            'Horas Administrativas': horasAdmin,
            'Total Horas': totalHoras,
            'Atiende Matrícula': emp['atiende-matricula'] || '',
            'Nivel / Modalidad': emp['nivel-modalidad'] || '',
            'Especialidad que Imparte': emp['especialidad-imparte'] || '',

            // 6. Situación Laboral
            'Situación Laboral': emp['situacion-laboral'] || '',
            'Descripción Situación': emp['descripcion-situacion'] || '',
            'Observaciones': emp['observaciones'] || '',

            // 7. Dotación y Bienestar Social
            'Talla Camisa': emp['talla-camisa'] || '',
            'Talla Pantalón': emp['talla-pantalon'] || '',
            'Talla Zapato': emp['talla-zapato'] || '',
            'Actividad Deportiva': emp['actividad-deportiva'] || '',
            'Actividad Cultural': emp['actividad-cultural'] || '',
            'Tipo de Vivienda': emp['tipo-vivienda'] || '',
            'Condición Vivienda': emp['condicion-vivienda'] || '',
            'Tipo Material Vivienda': emp['tipo-material'] || '',
            'Tipo de Enfermedad': emp['tipo-enfermedad'] || '',
            'Medicamento': emp['medicamento'] || '',
            'Discapacidad': emp['discapacidad'] || '',

            // 8. Organización Comunitaria y Electoral
            'UBCH': emp['ubch'] || '',
            'Circuito Comunal': emp['circuito-comunal'] || '',
            'Centro de Votación': emp['centro-votacion'] || ''
        };
    });

    try {
        const ws = XLSX.utils.json_to_sheet(filasExcel);
        
        // Ajuste automático de anchos de columna
        const colWidths = Object.keys(filasExcel[0] || {}).map(key => {
            const maxLen = Math.max(
                key.length,
                ...filasExcel.map(r => String(r[key] || '').length)
            );
            return { wch: Math.min(Math.max(maxLen + 2, 10), 45) };
        });
        ws['!cols'] = colWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Nómina Personal");

        const fechaHoy = new Date().toISOString().slice(0, 10);
        const codigoLimpio = (dea || 'PLANTEL').replace(/[^a-zA-Z0-9_-]/g, '_');
        const nombreArchivo = \`Nomina_Personal_\${codigoLimpio}_\${fechaHoy}.xlsx\`;

        XLSX.writeFile(wb, nombreArchivo);
        showToast("Nómina descargada con éxito en Excel", "success");
    } catch (err) {
        console.error("Error al exportar a Excel:", err);
        showAlert("Error", "No se pudo generar el archivo Excel: " + err.message, "error");
    }
}
window.exportarNominaExcel = exportarNominaExcel;
`;
        wizardJs += '\n' + exportarFnCode;
        console.log('exportarNominaExcel function added.');
    }

    // Attach click event in DOMContentLoaded
    const domLoadedTarget = `poblarCatalogosGenerales();
    initCascadaPersonal();`;
    
    const domLoadedReplacement = `const btnDescargarNomina = document.getElementById('btn-descargar-nomina-excel');
    if (btnDescargarNomina) {
        btnDescargarNomina.addEventListener('click', (e) => {
            e.preventDefault();
            exportarNominaExcel();
        });
    }

    poblarCatalogosGenerales();
    initCascadaPersonal();`;

    if (!wizardJs.includes("document.getElementById('btn-descargar-nomina-excel')") && wizardJs.includes(domLoadedTarget)) {
        wizardJs = wizardJs.replace(domLoadedTarget, domLoadedReplacement);
        console.log('Event listener for btn-descargar-nomina-excel wired.');
    }

    fs.writeFileSync(wizardPath, wizardJs, 'utf8');
    console.log('personalWizard.js saved successfully.');
}

updateFiles('c:/Proyectos/sgh-2.0/frontend');
updateFiles('c:/Proyectos/sgh-mr - firebase/webapp');
