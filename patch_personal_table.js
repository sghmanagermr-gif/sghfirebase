const fs = require('fs');
const path = require('path');

const projectRoot = 'C:\\Proyectos\\sgh-2.0\\frontend';
const pWizardPath = path.join(projectRoot, 'src', 'personalWizard.js');

let content = fs.readFileSync(pWizardPath, 'utf8');

// Add arrayUnion to imports
if (!content.includes('arrayUnion')) {
    content = content.replace("import { collection, doc, setDoc } from 'firebase/firestore';", "import { collection, doc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';");
}

// Add planteles update logic
const targetStr = `        await setDoc(ref, payload, { merge: true });`;
const replacementStr = `        await setDoc(ref, payload, { merge: true });
        
        // Zero-Cost: Update plantel with summary array
        if (dea) {
            const plantelRef = doc(db, "planteles", dea);
            const resumen = {
                cedula: payload.cedula || '',
                nombre: payload.nombres || '',
                cargo: payload.cargo || ''
            };
            try {
                await updateDoc(plantelRef, {
                    personal_resumen: arrayUnion(resumen)
                });
            } catch(e) {
                console.error("Error updating plantel arrayUnion", e);
            }
        }`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    fs.writeFileSync(pWizardPath, content, 'utf8');
    console.log('personalWizard.js patched.');
} else {
    console.log('Target string not found in personalWizard.js.');
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
## [19-08-2026] Hito: Tabla de Personal Zero-Cost
- **Tarea Lograda**: Se agregó una tabla visual para mostrar el personal registrado en el plantel sin consumir lecturas adicionales de Firebase.
- **Detalles Arquitectónicos (Desnormalización)**:
  - \`index.html\`: Se inyectó la tabla con ID \`seccion-lista-personal\`.
  - \`frontend/src/personalWizard.js\`: Al guardar un empleado, se usa \`arrayUnion\` para inyectar un mini-resumen (Cédula, Nombre, Cargo) directamente en el documento del plantel.
  - \`frontend/src/main.js\`: \`onSnapshot\` ahora lee \`personal_resumen\` y renderiza la tabla. Todo esto cuesta exactamente 0 lecturas adicionales, aprovechando el canal de datos ya abierto.
`;

if (fs.existsSync(bitacoraPath)) {
    fs.appendFileSync(bitacoraPath, bitacoraEntry, 'utf8');
    console.log('bitacora.md updated.');
}
