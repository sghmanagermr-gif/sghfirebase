const fs = require('fs');

const htmlPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';
let content = fs.readFileSync(htmlPath, 'utf8');

// Update the button
content = content.replace(
    '<button style="margin-top: 20px;">Gestionar Personal</button>',
    '<button style="margin-top: 20px;" onclick="abrirWizardPersonal()">Gestionar Personal</button>'
);

const wizardHTML = `
  <!-- WIZARD DE PERSONAL MODAL -->
  <div id="wizard-personal-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.7); z-index: 9999; backdrop-filter: blur(4px); align-items: center; justify-content: center;">
    <div style="background: white; border-radius: 12px; width: 90%; max-width: 800px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); position: relative; display: flex; flex-direction: column;">
      
      <!-- Cabecera -->
      <div style="padding: 20px 30px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; position: sticky; top: 0; z-index: 10;">
        <div>
          <h2 style="margin: 0; font-size: 1.5rem; color: #0f172a;">Registro de Personal</h2>
          <p style="margin: 5px 0 0; font-size: 0.9rem; color: #64748b;" id="wizard-step-title">Paso 1: Datos Personales</p>
        </div>
        <button onclick="cerrarWizardPersonal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b;">&times;</button>
      </div>

      <!-- Barra de Progreso -->
      <div style="display: flex; height: 4px; background: #e2e8f0;">
        <div id="wizard-progress-bar" style="width: 25%; background: var(--primary-color); transition: width 0.3s ease;"></div>
      </div>

      <!-- Cuerpo del Formulario -->
      <div style="padding: 30px; flex: 1;">
        
        <!-- PASO 1: DATOS PERSONALES -->
        <div id="wizard-step-1" class="wizard-step">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div><label class="form-label">Cédula</label><input type="text" id="wp-cedula" class="form-input" placeholder="Ej: 10012819"></div>
            <div><label class="form-label">Nacionalidad</label>
              <select id="wp-nacionalidad" class="form-input">
                <option value="V">V - Venezolano</option>
                <option value="E">E - Extranjero</option>
              </select>
            </div>
            <div style="grid-column: span 2;"><label class="form-label">Nombres y Apellidos</label><input type="text" id="wp-nombre-apellido" class="form-input" placeholder="Apellidos y Nombres"></div>
            <div><label class="form-label">Fecha de Nacimiento</label><input type="date" id="wp-fecha-nacimiento" class="form-input"></div>
            <div><label class="form-label">Edad (Auto)</label><input type="number" id="wp-edad" class="form-input" readonly style="background: #f1f5f9;"></div>
            <div><label class="form-label">Género</label>
              <select id="wp-genero" class="form-input">
                <option value="FEMENINO">Femenino</option>
                <option value="MASCULINO">Masculino</option>
              </select>
            </div>
            <div><label class="form-label">Estado Civil</label>
              <select id="wp-estado-civil" class="form-input">
                <option value="SOLTERO(A)">Soltero(a)</option>
                <option value="CASADO(A)">Casado(a)</option>
                <option value="DIVORCIADO(A)">Divorciado(a)</option>
                <option value="VIUDO(A)">Viudo(a)</option>
              </select>
            </div>
            <div><label class="form-label">Lugar de Nacimiento</label><input type="text" id="wp-lugar-nacimiento" class="form-input"></div>
            <div><label class="form-label">Correo Electrónico</label><input type="email" id="wp-correo" class="form-input"></div>
            <div><label class="form-label">Teléfono Celular</label><input type="text" id="wp-tel-celular" class="form-input"></div>
            <div><label class="form-label">Teléfono Habitación / Otro</label><input type="text" id="wp-tel-habitacion" class="form-input"></div>
            
            <div style="grid-column: span 2;"><label class="form-label">Dirección de Habitación</label><input type="text" id="wp-direccion" class="form-input"></div>
            <div><label class="form-label">Estado</label><input type="text" id="wp-estado" class="form-input" value="MERIDA"></div>
            <div><label class="form-label">Municipio</label><input type="text" id="wp-municipio" class="form-input"></div>
            <div><label class="form-label">Parroquia</label><input type="text" id="wp-parroquia" class="form-input"></div>
            <div><label class="form-label">Instrucción</label><input type="text" id="wp-instruccion" class="form-input" placeholder="Ej: SUPERIOR"></div>
            <div style="grid-column: span 2;"><label class="form-label">Profesión</label><input type="text" id="wp-profesion" class="form-input"></div>
          </div>
        </div>

        <!-- PASO 2: DATOS INSTITUCIONALES -->
        <div id="wizard-step-2" class="wizard-step" style="display: none;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div style="grid-column: span 2;"><label class="form-label">Ubicación Física (Plantel)</label><input type="text" id="wp-ubicacion-fisica" class="form-input"></div>
            <div><label class="form-label">Código Plantel</label><input type="text" id="wp-codigo-plantel" class="form-input"></div>
            <div><label class="form-label">Código Estadístico</label><input type="text" id="wp-codigo-estadistico" class="form-input"></div>
            <div><label class="form-label">Dependencia</label>
              <select id="wp-dependencia" class="form-input">
                <option value="NACIONAL">Nacional</option>
                <option value="ESTADAL">Estadal</option>
                <option value="MUNICIPAL">Municipal</option>
                <option value="PRIVADA">Privada</option>
              </select>
            </div>
            <div><label class="form-label">Ubicación Geográfica</label><input type="text" id="wp-ubicacion-geografica" class="form-input"></div>
            <div><label class="form-label">Código Dependencia 1</label><input type="text" id="wp-codigo-dependencia-1" class="form-input"></div>
            <div><label class="form-label">Ubicación Administrativa</label><input type="text" id="wp-ubicacion-administrativa" class="form-input"></div>
            <div><label class="form-label">Nivel</label><input type="text" id="wp-nivel" class="form-input"></div>
            <div><label class="form-label">Modalidad</label><input type="text" id="wp-modalidad" class="form-input"></div>
            <div style="grid-column: span 2;"><label class="form-label">Turnos del Plantel</label><input type="text" id="wp-turnos-plantel" class="form-input"></div>
          </div>
        </div>

        <!-- PASO 3: DATOS LABORALES Y ACADÉMICOS -->
        <div id="wizard-step-3" class="wizard-step" style="display: none;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div><label class="form-label">Tipo de Personal</label>
              <select id="wp-tipo-personal" class="form-input">
                <option value="DOCENTE">Docente</option>
                <option value="ADMINISTRATIVO">Administrativo</option>
                <option value="OBRERO">Obrero</option>
                <option value="DIRECTIVO">Directivo</option>
              </select>
            </div>
            <div><label class="form-label">Situación Laboral (Estatus)</label>
              <select id="wp-situacion-laboral" class="form-input">
                <option value="ACTIVO">Activo</option>
                <option value="REPOSO">Reposo</option>
                <option value="PERMISO">Permiso</option>
                <option value="JUBILADO">Jubilado</option>
                <option value="SUSPENDIDO">Suspendido</option>
              </select>
            </div>
            <div><label class="form-label">Cargo</label><input type="text" id="wp-cargo" class="form-input"></div>
            <div><label class="form-label">Subcategoría</label><input type="text" id="wp-subcategoria" class="form-input"></div>
            <div><label class="form-label">Código RAC</label><input type="text" id="wp-codigo-rac" class="form-input"></div>
            <div><label class="form-label">Titular</label>
              <select id="wp-titular" class="form-input">
                <option value="SI">SI</option>
                <option value="NO">NO</option>
              </select>
            </div>
            <div><label class="form-label">Horas Académicas</label><input type="number" id="wp-horas-academicas" class="form-input" value="0"></div>
            <div><label class="form-label">Horas Administrativas</label><input type="number" id="wp-horas-administrativas" class="form-input" value="0"></div>
            <div><label class="form-label">Fecha de Ingreso (MPPE)</label><input type="date" id="wp-fecha-ingreso" class="form-input"></div>
            <div><label class="form-label">Años de Antigüedad</label><input type="number" id="wp-antiguedad" class="form-input" readonly style="background: #f1f5f9;"></div>
            <div><label class="form-label">Turno que Atiende</label><input type="text" id="wp-turnos-atiende" class="form-input"></div>
            <div><label class="form-label">¿Atiende Matrícula?</label>
              <select id="wp-atiende-matricula" class="form-input">
                <option value="NO">NO</option>
                <option value="SI">SI</option>
              </select>
            </div>
            <div><label class="form-label">Nivel/Modalidad (Específico)</label><input type="text" id="wp-nivel-modalidad" class="form-input"></div>
            <div><label class="form-label">Especialidad que Imparte</label><input type="text" id="wp-especialidad-imparte" class="form-input"></div>
            <div style="grid-column: span 2;"><label class="form-label">Observaciones</label><input type="text" id="wp-observaciones" class="form-input"></div>
          </div>
        </div>

        <!-- PASO 4: SALUD, SOCIOECONÓMICO Y POLÍTICO -->
        <div id="wizard-step-4" class="wizard-step" style="display: none;">
          <h4 style="margin: 0 0 15px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Dotación</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div><label class="form-label">Talla Camisa</label><input type="text" id="wp-talla-camisa" class="form-input"></div>
            <div><label class="form-label">Talla Pantalón</label><input type="text" id="wp-talla-pantalon" class="form-input"></div>
            <div><label class="form-label">Talla Zapato</label><input type="text" id="wp-talla-zapato" class="form-input"></div>
          </div>

          <h4 style="margin: 0 0 15px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Salud Integral</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div><label class="form-label">Tipo de Enfermedad</label><input type="text" id="wp-tipo-enfermedad" class="form-input" value="NO APLICA"></div>
            <div><label class="form-label">Medicamento que requiere</label><input type="text" id="wp-medicamento" class="form-input" value="NO APLICA"></div>
            <div><label class="form-label">Discapacidad</label>
              <select id="wp-discapacidad" class="form-input">
                <option value="NO">NO</option>
                <option value="SI">SI</option>
              </select>
            </div>
          </div>

          <h4 style="margin: 0 0 15px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Socioeconómico y Comunitario</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div><label class="form-label">Tipo de Vivienda</label><input type="text" id="wp-tipo-vivienda" class="form-input"></div>
            <div><label class="form-label">Condición de Vivienda</label><input type="text" id="wp-condicion-vivienda" class="form-input" placeholder="PROPIA / ALQUILADA"></div>
            <div><label class="form-label">Tipo de Material</label><input type="text" id="wp-tipo-material" class="form-input"></div>
            <div><label class="form-label">Actividad Deportiva</label><input type="text" id="wp-actividad-deportiva" class="form-input"></div>
            <div style="grid-column: span 2;"><label class="form-label">Actividad Cultural</label><input type="text" id="wp-actividad-cultural" class="form-input"></div>
            <div><label class="form-label">UBCH</label><input type="text" id="wp-ubch" class="form-input"></div>
            <div><label class="form-label">Circuito Comunal</label><input type="text" id="wp-circuito-comunal" class="form-input"></div>
            <div style="grid-column: span 2;"><label class="form-label">Centro de Votación</label><input type="text" id="wp-centro-votacion" class="form-input"></div>
          </div>
        </div>

      </div>

      <!-- Footer / Botones -->
      <div style="padding: 20px 30px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; background: #f8fafc; position: sticky; bottom: 0;">
        <button id="wp-btn-prev" class="btn-secondary" style="display: none;" onclick="navegarWizardPersonal(-1)">Atrás</button>
        <div style="flex: 1;"></div>
        <button id="wp-btn-next" onclick="navegarWizardPersonal(1)">Siguiente</button>
        <button id="wp-btn-save" style="display: none; background: #10b981;" onclick="guardarWizardPersonal()">Guardar Empleado</button>
      </div>

    </div>
  </div>
`;

if (!content.includes('wizard-personal-modal')) {
    content = content.replace('</body>', wizardHTML + '\n</body>');
    fs.writeFileSync(htmlPath, content, 'utf8');
    console.log('Wizard HTML inyectado correctamente.');
} else {
    console.log('Wizard HTML ya existía.');
}
