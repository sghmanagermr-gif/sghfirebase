const fs = require('fs');
const path = require('path');

const projectRoot = 'C:\\Proyectos\\sgh-2.0\\frontend';
const mainJsPath = path.join(projectRoot, 'src', 'main.js');

let content = fs.readFileSync(mainJsPath, 'utf8');
const targetLine = `              // Desplegar Wizard Personal autom\\S*ticamente si la matr\\S*cula se guard\\S*\r?\n\\s*if \\(typeof window.mostrarFormularioPersonal === "function"\\) \\{\r?\n\\s*window.mostrarFormularioPersonal\\(\\);\r?\n\\s*\\}`;

// We will use regex to find the block because of the special characters (á, í, ó).
const regex = /\/\/\s*Desplegar Wizard Personal autom\S*ticamente si la matr\S*cula se guard\S*\r?\n\s*if \(typeof window\.mostrarFormularioPersonal === "function"\) \{\r?\n\s*window\.mostrarFormularioPersonal\(\);\r?\n\s*\}/g;

const replacement = `              // Desplegar Formulario Personal SOLO si se ingresó alguna matrícula
              if (typeof window.mostrarFormularioPersonal === "function" && Object.keys(matricula).length > 0) {
                   window.mostrarFormularioPersonal();
              }`;

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(mainJsPath, content, 'utf8');
    console.log('main.js patched: Condition added');
} else {
    console.log('Target block not found in main.js. Regex failed.');
}

// 2. Bump SemVer
const packageJsonPath = path.join(projectRoot, 'package.json');
if (fs.existsSync(packageJsonPath)) {
    let pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const versionParts = pkg.version.split('.');
    versionParts[2] = parseInt(versionParts[2]) + 1; // Bump patch
    pkg.version = versionParts.join('.');
    fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2), 'utf8');
    console.log('package.json version bumped to: ' + pkg.version);
}

// 3. Append to bitacora.md
const bitacoraPath = 'C:\\Proyectos\\sgh-2.0\\bitacora.md';
const bitacoraEntry = `
## [19-08-2026] Hito: Condición de Matrícula para Formulario de Personal
- **Tarea Lograda**: Se implementó una regla de negocio estricta: el formulario de registro de personal solo se muestra si el usuario realmente llenó los datos de matrícula.
- **Detalles Técnicos**:
  - En \`frontend/src/main.js\`, tras ejecutar la Escoba Digital (\`sweepZeros\`), validamos que \`Object.keys(matricula).length > 0\`.
  - Gracias a la Escoba Digital, un objeto vacío significa de forma inequívoca absoluta inactividad del usuario en esas casillas, logrando una comprobación \`Zero-Cost\` pura y sin recorrer DOM adicional.
`;

if (fs.existsSync(bitacoraPath)) {
    fs.appendFileSync(bitacoraPath, bitacoraEntry, 'utf8');
    console.log('bitacora.md updated.');
}
