const fs = require('fs');

const htmlPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';
let content = fs.readFileSync(htmlPath, 'utf8');

// 1. Remove the old wizard modal block.
const startIdx = content.indexOf('<div id="wizard-personal-modal"');
if (startIdx !== -1) {
    let opened = 0;
    let endIdx = -1;
    for(let i=startIdx; i<content.length; i++) {
        if (content.substr(i, 4) === '<div') opened++;
        if (content.substr(i, 5) === '</div') {
            opened--;
            if (opened === 0) {
                endIdx = i + 6;
                break;
            }
        }
    }
    if (endIdx !== -1) {
        content = content.substring(0, startIdx) + content.substring(endIdx);
    }
}

// 2. Build the new Inline Section
const newSection = `
      <!-- SECCIÓN REGISTRO DE PERSONAL (EN LÍNEA) -->
      <div id="seccion-registro-personal" class="glass-panel" style="display: none; margin-top: 30px; padding: 24px;">
        <h2 style="margin-top: 0; margin-bottom: 20px; font-size: 1.5rem; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Registro de Personal</h2>
        <p style="margin-bottom: 25px; color: #64748b; font-size: 0.95rem;">Complete los datos del empleado para agregarlo a la plantilla de este plantel.</p>
        
        <form id="form-personal-inline" onsubmit="event.preventDefault(); window.guardarPersonalInline();">
            <!-- DATOS PERSONALES -->
            <h3 style="color: #334155; margin-bottom: 15px; font-size: 1.1rem;">1. Datos Personales</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                <div><label class="form-label">Cédula</label><input type="text" id="wp-cedula" class="form-input" placeholder="Ej: 10012819"></div>
                <div><label class="form-label">Nombres y Apellidos</label><input type="text" id="wp-nombres" class="form-input" placeholder="Nombre completo"></div>
                <div><label class="form-label">Fecha de Nacimiento</label><input type="date" id="wp-nacimiento" class="form-input" onchange="if(window.calcularEdadWizard) window.calcularEdadWizard()"></div>
                <div><label class="form-label">Edad</label><input type="text" id="wp-edad" class="form-input" readonly placeholder="Auto-calculada"></div>
                <div><label class="form-label">Género</label>
                    <select id="wp-genero" class="form-input">
                        <option value="">Seleccione...</option><option value="Masculino">Masculino</option><option value="Femenino">Femenino</option>
                    </select>
                </div>
                <div><label class="form-label">Nacionalidad</label>
                    <select id="wp-nacionalidad" class="form-input">
                        <option value="V">Venezolano (V)</option><option value="E">Extranjero (E)</option>
                    </select>
                </div>
            </div>

            <!-- DATOS INSTITUCIONALES -->
            <h3 style="color: #334155; margin-bottom: 15px; font-size: 1.1rem;">2. Datos Institucionales</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                <div><label class="form-label">Tipo de Personal</label>
                    <select id="wp-tipo-personal" class="form-input">
                        <option value="Docente">Docente</option><option value="Administrativo">Administrativo</option><option value="Obrero">Obrero</option>
                    </select>
                </div>
                <div><label class="form-label">Cargo</label><input type="text" id="wp-cargo" class="form-input" placeholder="Ej: Docente de Aula"></div>
                <div><label class="form-label">Condición / Situación Laboral</label>
                    <select id="wp-situacion" class="form-input">
                        <option value="Titular">Titular</option><option value="Interino">Interino</option><option value="Contratado">Contratado</option><option value="Incapacitado">Incapacitado</option>
                    </select>
                </div>
                <div><label class="form-label">Especialidad</label><input type="text" id="wp-especialidad" class="form-input" placeholder="Ej: Matemática"></div>
            </div>

            <!-- DATOS LABORALES / ACADÉMICOS -->
            <h3 style="color: #334155; margin-bottom: 15px; font-size: 1.1rem;">3. Datos Laborales y Académicos</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                <div><label class="form-label">Fecha de Ingreso (MPPE/Gobernación)</label><input type="date" id="wp-fecha-ingreso" class="form-input" onchange="if(window.calcularAntiguedadWizard) window.calcularAntiguedadWizard()"></div>
                <div><label class="form-label">Años de Servicio (Antigüedad)</label><input type="text" id="wp-antiguedad" class="form-input" readonly placeholder="Auto-calculada"></div>
                <div><label class="form-label">Nivel de Instrucción</label>
                    <select id="wp-instruccion" class="form-input">
                        <option value="Bachiller">Bachiller</option><option value="TSU">TSU</option><option value="Licenciado/Profesor">Licenciado/Profesor</option><option value="Especialización">Especialización</option><option value="Maestría">Maestría</option><option value="Doctorado">Doctorado</option>
                    </select>
                </div>
                <div><label class="form-label">Título Obtenido</label><input type="text" id="wp-titulo" class="form-input" placeholder="Ej: Lic. en Educación Integral"></div>
            </div>

            <!-- DATOS EXTRA -->
            <h3 style="color: #334155; margin-bottom: 15px; font-size: 1.1rem;">4. Datos Salud y Extras</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                <div><label class="form-label">Talla Pantalón / Camisa</label><input type="text" id="wp-talla" class="form-input" placeholder="Ej: P:32 C:M"></div>
                <div><label class="form-label">Calzado</label><input type="text" id="wp-calzado" class="form-input" placeholder="Ej: 40"></div>
                <div><label class="form-label">Carnet de la Patria (Opcional)</label><input type="text" id="wp-carnet" class="form-input" placeholder="Código"></div>
                <div><label class="form-label">¿Atiende Matrícula?</label>
                    <select id="wp-atiende-matricula" class="form-input">
                        <option value="SI">Sí (Docente de Aula)</option><option value="NO">No (Admins/Obreros)</option>
                    </select>
                </div>
            </div>
            
            <div style="display: flex; justify-content: flex-end;">
                <button type="submit" id="btn-guardar-empleado-inline" style="background: #10b981; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; text-transform: uppercase;">Guardar Empleado</button>
            </div>
        </form>
      </div>
`;

// Find index of <input type="hidden" id="inp-vacantes" value="0" /> and insert after the next </div>
const inpIdx = content.indexOf('<input type="hidden" id="inp-vacantes" value="0" />');
if (inpIdx !== -1 && !content.includes('seccion-registro-personal')) {
    const endFormIdx = content.indexOf('</form>', inpIdx);
    const endDivIdx = content.indexOf('</div>', endFormIdx);
    if (endDivIdx !== -1) {
        content = content.substring(0, endDivIdx + 6) + '\\n' + newSection + content.substring(endDivIdx + 6);
        fs.writeFileSync(htmlPath, content, 'utf8');
        console.log('HTML modificado exitosamente (Usando indexOf).');
    } else {
        console.log('No se encontró el </div> de cierre.');
    }
} else {
    console.log('No se encontró inp-vacantes o ya estaba insertado.');
}
