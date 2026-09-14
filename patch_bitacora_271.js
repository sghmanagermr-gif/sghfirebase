const fs = require('fs');
const pathBitacora = 'C:\\Proyectos\\sgh-2.0\\bitacora.md';
const pathDesempeno = 'C:\\Proyectos\\sgh-2.0\\desempeno.md';

const newEntry = `
### Hito: Activación Automática del Formulario de Personal (v2.7.1)
**Fecha:** 2026-08-19
**Módulo:** Pantalla de Planteles / Motor de Inicialización (mostrarCandado)

**1. Diagnóstico del Problema:**
- El sistema exigía que el director presionara el botón "Guardar Datos y Continuar" para poder visualizar el formulario de registro de personal, incluso cuando el plantel ya contaba con datos de matrícula y secciones guardados de sesiones anteriores.
- Al cargar el plantel (\`mostrarCandado\`), la interfaz restauraba los datos correctamente, pero omitía disparar la lógica de visibilidad del formulario de personal.

**2. Método Técnico Aplicado:**
- Se inyectó una validación de estado en el flujo de inicialización (\`mostrarCandado\`) de \`main.js\`.
- El algoritmo ahora evalúa el objeto \`dataParcial.matricula\`. Si detecta que ya existen registros almacenados en Firebase al momento de cargar el plantel, ejecuta directamente la función \`window.mostrarFormularioPersonal()\`.
- Se incrementó la versión semántica a v2.7.1 en la interfaz visual.

**3. Decisiones Operativas y Beneficio:**
- Se mejoró drásticamente la experiencia de usuario (UX) al evitar clics redundantes (Zero Friction).
- El sistema ahora respeta el paradigma de retención de estado: si los requisitos (matrícula) ya están en la base de datos, los módulos dependientes (registro de personal) se desbloquean inmediatamente en la carga inicial.
`;

try {
    if (fs.existsSync(pathBitacora)) {
        fs.appendFileSync(pathBitacora, newEntry, 'utf8');
        console.log('bitacora.md actualizada exitosamente.');
    }
    
    if (fs.existsSync(pathDesempeno)) {
        fs.appendFileSync(pathDesempeno, newEntry, 'utf8');
        console.log('desempeno.md actualizado exitosamente.');
    }
} catch (e) {
    console.error('Error al actualizar los archivos:', e);
}
