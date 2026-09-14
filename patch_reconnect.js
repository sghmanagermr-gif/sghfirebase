const fs = require('fs');
const path = require('path');

const projectRoot = 'C:\\Proyectos\\sgh-2.0\\frontend';
const mainJsPath = path.join(projectRoot, 'src', 'main.js');
const packageJsonPath = path.join(projectRoot, 'package.json');
const bitacoraPath = 'C:\\Proyectos\\sgh-2.0\\bitacora.md';

// 1. Patch main.js
let content = fs.readFileSync(mainJsPath, 'utf8');
const targetLine = '//                   window.mostrarFormularioPersonal();';
const replacementLine = '                   window.mostrarFormularioPersonal();';

if (content.includes(targetLine)) {
    content = content.replace(targetLine, replacementLine);
    fs.writeFileSync(mainJsPath, content, 'utf8');
    console.log('main.js patched: Form connected');
} else {
    console.log('Target line not found in main.js');
}

// 2. Bump SemVer
if (fs.existsSync(packageJsonPath)) {
    let pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const versionParts = pkg.version.split('.');
    versionParts[2] = parseInt(versionParts[2]) + 1; // Bump patch
    pkg.version = versionParts.join('.');
    fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2), 'utf8');
    console.log('package.json version bumped to: ' + pkg.version);
}

// 3. Append to bitacora.md
const bitacoraEntry = `
## [19-08-2026] Hito: Reconexión del Formulario de Personal
- **Tarea Lograda**: Conexión del bloque de Registro de Personal al flujo principal de guardado.
- **Archivos Modificados**: 
  - \`frontend/src/main.js\`: Se habilitó la llamada a \`window.mostrarFormularioPersonal()\` dentro del ciclo de éxito al presionar "Guardar Datos y Continuar". Ahora el sistema muestra el bloque de personal (\`#seccion-registro-personal\`) y hace scroll automático sin recargar la página.
`;

if (fs.existsSync(bitacoraPath)) {
    fs.appendFileSync(bitacoraPath, bitacoraEntry, 'utf8');
    console.log('bitacora.md updated.');
}
