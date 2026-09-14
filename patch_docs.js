const fs = require('fs');

// BITACORA
const bitacoraPath = 'C:\\Proyectos\\sgh-2.0\\bitacora.md';
const newBitacoraEntry = `
## Versión 2.5.0 (2026-08-17)

**Resumen del Logro:**
Se transformó por completo el flujo de captura de datos del Personal. Se eliminó el esquema de ventanas emergentes (Wizard Modal) que resultaba intrusivo y se implementó un formulario limpio y en línea (Inline), visible estratégicamente solo después de guardar la matrícula. Además, se estandarizaron los anchos de pantalla para brindar una sensación armónica y moderna a los Directores.

**Archivos Modificados:**
- \`frontend/index.html\`: Eliminación del modal, inyección de la sección en línea, ajuste de cuadrículas (\`max-width: 1200px\`) y actualización de número de versión.
- \`frontend/src/personalWizard.js\`: Refactorización total de la lógica para manejar el guardado lineal sin paginación y migración definitiva de *Alerts* a *Toasts* elegantes nativos (\`uiUtils.js\`).
- \`frontend/src/main.js\`: Actualización del disparador principal para revelar el formulario fluido en lugar de un modal bloqueante.
- \`frontend/package.json\`: Actualización SemVer a 2.5.0.

**Beneficio Administrativo:**
- **Zero Cost & Performance:** Al evitar modales complejos, el DOM es más ligero. Las reglas de validación en bloque evitan recargas y consultas basura a Firebase.
- **Experiencia de Usuario:** El Director ahora tiene una visión panorámica de la información en pantallas anchas y no sufre bloqueos por notificaciones nativas, reduciendo la fricción al cargar el personal y facilitando el proceso administrativo.

`;

if (fs.existsSync(bitacoraPath)) {
    let content = fs.readFileSync(bitacoraPath, 'utf8');
    // Insert after the title # Bitácora ...
    content = content.replace(/# Bitácora.*\n/, match => match + newBitacoraEntry);
    fs.writeFileSync(bitacoraPath, content, 'utf8');
} else {
    fs.writeFileSync(bitacoraPath, '# Bitácora Ejecutiva del Proyecto SGH\n' + newBitacoraEntry, 'utf8');
}

// DESEMPENO
const desempenoPath = 'C:\\Proyectos\\sgh-2.0\\desempeno.md';
const newDesempenoEntry = `
## Versión 2.5.0 (2026-08-17)

**Procedimiento Técnico (Paso a Paso):**
1. **Análisis Estructural HTML:** Se diagnosticó la posición de la Matrícula para encontrar el punto de anclaje perfecto (\`hook\`).
2. **Desacoplamiento Modal:** Mediante un parche asíncrono (\`patch_html_inline.js\`) se extrajo el HTML del antiguo modal \`wizard-personal-modal\`, se despojó de su barra de progreso y botones de flujo, y se reconstruyó como \`seccion-registro-personal\` con la clase CSS \`glass-panel\` inmediatamente debajo de la etiqueta de cierre del formulario de matrícula.
3. **Reescritura de Lógica JavaScript:** Se reescribió \`personalWizard.js\` desde cero. Se erradicó el estado de paginación (\`currentStep\`). La función \`abrirWizardPersonal()\` mutó hacia \`mostrarFormularioPersonal()\`, cuyo único propósito es cambiar el estilo \`display: none\` a \`block\` y ejecutar \`scrollIntoView()\` para llevar al Director al inicio del formulario con un desplazamiento suave.
4. **Armonización de Estilos CSS:** A petición del usuario y tras análisis del CSS Grid base, se aumentó el límite de la caja maestra del formulario del Plantel y de Personal de \`900px\` a \`1200px\` para aprovechar la capacidad responsiva de pantallas modernas de alta resolución.
5. **Erradicación de Alertas Nativas:** Durante la reescritura, se aseguraron de reemplazar todas las llamadas bloqueantes (\`alert())\` por la API global del proyecto (\`showToast\` y \`showAlert\`), garantizando la preservación de la Jerarquía Z-Index y fluidez de la interfaz.

`;

if (fs.existsSync(desempenoPath)) {
    let content = fs.readFileSync(desempenoPath, 'utf8');
    content = content.replace(/# Desempeño.*\n/, match => match + newDesempenoEntry);
    if (!content.includes('Versión 2.5.0')) {
        // Fallback si no encontró el título
        fs.writeFileSync(desempenoPath, newDesempenoEntry + content, 'utf8');
    } else {
        fs.writeFileSync(desempenoPath, content, 'utf8');
    }
} else {
    fs.writeFileSync(desempenoPath, '# Desempeño Técnico y Procedimental\n' + newDesempenoEntry, 'utf8');
}

console.log('Bitácora y Desempeño actualizados exitosamente.');
