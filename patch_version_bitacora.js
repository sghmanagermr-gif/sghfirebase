const fs = require('fs');
const path = require('path');

const bitacoraPath = 'C:\\Proyectos\\sgh-mr - firebase\\bitacora.md';
const pkgPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\package.json';
const indexPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';

// 1. Escribir/Actualizar Bitácora
const bitacoraEntry = `
## [v2.6.0] - 2026-08-19 (Nueva Función: Tabla de Personal Existente)

### Resumen Técnico
Se implementó el requerimiento de inyectar una tabla resumen con el personal previamente cargado, situada justo antes del asistente de registro de personal en la plataforma SGH. El objetivo fue mejorar la experiencia del usuario (plaadmin) permitiéndole visualizar a los empleados ya registrados sin sacrificar los lineamientos de optimización de costos.

### Lógicas Inyectadas y Decisiones Arquitectónicas (Zero-Cost Optimization)
- **Consulta con Índice Específico:** Para mantener el principio "Zero-Cost", la tabla se alimenta mediante una consulta estructurada a la colección \`cargos_personal\`: \`query(collection(db, 'cargos_personal'), where('codigo-plantel', '==', codigoDEA))\`. Esto asegura que Firestore solo escanee los documentos correspondientes al colegio (lectura O(N) relativa al plantel, no a la DB global), eludiendo de forma absoluta el uso ineficiente de \`get()\` en toda la colección.
- **Inyección DOM Dinámica:** Se creó el contenedor \`#seccion-personal-existente\` como un \`lock-card glass-panel\` con \`max-height: 300px\` y \`overflow-y: auto\` para brindar scroll vertical sin recargar visualmente el DOM. Los \`thead\` se mantuvieron con \`position: sticky\`.
- **Estructura Desacoplada (Frontend):** Las lógicas de ocultar/mostrar este componente se acoplaron a las funciones existentes \`mostrarFormularioPersonal\` y \`cerrarFormularioPersonal\` del motor \`personalWizard.js\`.

### Archivos Modificados
- \`C:\\Proyectos\\sgh-2.0\\frontend\\index.html\`: Inyección de la estructura HTML de la tabla (\`<div id="seccion-personal-existente">\`).
- \`C:\\Proyectos\\sgh-2.0\\frontend\\src\\personalWizard.js\`: Inyección del método \`cargarPersonalExistente\` e importación de la librería de Firestore.

---
`;

if (fs.existsSync(bitacoraPath)) {
    fs.appendFileSync(bitacoraPath, bitacoraEntry);
} else {
    fs.writeFileSync(bitacoraPath, '# Bitácora de Desarrollo - SGH 2.0\n' + bitacoraEntry);
}

// 2. Actualizar Versión en package.json a 2.6.0
const newVersion = "2.6.0";
if (fs.existsSync(pkgPath)) {
    let pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.version = newVersion;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
}

// 3. Actualizar Versión en index.html
if (fs.existsSync(indexPath)) {
    let htmlContent = fs.readFileSync(indexPath, 'utf8');
    htmlContent = htmlContent.replace(/<title>SGH - v[\d\.]+<\/title>/g, '<title>SGH - v' + newVersion + '</title>');
    htmlContent = htmlContent.replace(/(<span style="color: var\(--primary-color\);">SGH<\/span>)\s*v[\d\.]+/g, '$1 v' + newVersion);
    fs.writeFileSync(indexPath, htmlContent);
}

console.log("Bitácora actualizada y versiones incrementadas a " + newVersion);
