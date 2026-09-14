const fs = require('fs');

const entry = `
### Hito: Recuperación de Contraseñas, Ocultamiento Preventivo de Cuadratura y Viabilidad de Descarga de Nómina Completa en Excel (v2.11.0 - v2.11.2)
**Fecha:** 2026-09-14
**Módulo:** Autenticación / Registro de Personal / Exportación de Datos

**1. Diagnóstico y Requerimientos:**
- Módulo de Recuperación de Contraseñas: Incorporar mecanismo seguro para que los directores y usuarios del sistema puedan restablecer sus credenciales vía correo institucional sin depender de intervención manual del administrador.
- UX de Retorno a Login: Posterior al envío exitoso del enlace de restablecimiento, habilitar enlace directo "Volver al inicio de sesión" y redirección automática tras 5 segundos.
- Control de Cuadratura: Atender la directriz institucional de invisibilizar temporalmente el botón de Cuadratura en el formulario de Registro de Personal y en los paneles de control.
- Viabilidad de Descarga de Nómina en Excel (.xlsx): Evaluar la factibilidad de exportar a Excel la nómina completa del plantel incluyendo la totalidad de campos (desde Cédula de Identidad hasta Centro de Votación, UBCH y Circuito Comunal).

**2. Soluciones Implementadas y Conclusiones:**
- Recuperación de Contraseña con Firebase Authentication:
  * Se implementó el modal accesible de recuperación con integración nativa a \`sendPasswordResetEmail\` de Firebase Auth.
  * Se programó la validación estricta de correo electrónico institucional y mensajes claros de estado.
  * Se agregó botón/enlace explícito de retorno inmediato al Login y temporizador automático de 5 segundos con limpieza de memoria.
- Ocultamiento de Cuadratura (v2.11.2):
  * En \`personalWizard.js\` (\`toggleMatriculaUI\`), al seleccionar 'Atiende Matrícula = SÍ' se mantienen visibles los campos de Nivel/Modalidad y Especialidad, pero el contenedor del botón de cuadratura (\`container-btn-cuadratura\`) permanece con \`display: none\`.
  * En \`index.html\`, se reforzó con \`style="display: none !important;"\` tanto en el contenedor como en la tarjeta informativa.
- Estudio de Viabilidad para Descarga Completa en Excel (.xlsx):
  * Factibilidad: 100% Viable y a Costo Cero ($0).
  * Como el expediente completo de cada trabajador ya reside en la memoria del navegador al abrir el plantel (\`cargos_personal\`), no se requieren lecturas adicionales a Firestore.
  * La exportación abarcará la totalidad de las 8 categorías del formulario (más de 40 campos: Identificación, Localización, Formación Académica, Cargo y Horas, Situación Laboral, Bienestar Social y Participación Comunitaria/Centro de Votación).

**3. Archivos Involucrados:**
- frontend/src/main.js
- frontend/src/personalWizard.js
- frontend/index.html
- frontend/package.json
- bitacora.md
`;

const paths = [
    'c:/Proyectos/sgh-2.0/bitacora.md',
    'c:/Proyectos/sgh-mr - firebase/bitacora.md'
];

paths.forEach(p => {
    if (fs.existsSync(p)) {
        fs.appendFileSync(p, entry, 'utf8');
        console.log('Bitácora actualizada en:', p);
    }
});
