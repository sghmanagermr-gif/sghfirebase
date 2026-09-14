const fs = require('fs');

const jsPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\personalWizard.js';
let content = fs.readFileSync(jsPath, 'utf8');

// Add import
if (!content.includes('import { showToast, showAlert }')) {
    content = content.replace(
        "import { db } from './firebase.js';",
        "import { db } from './firebase.js';\nimport { showToast, showAlert } from './uiUtils.js';"
    );
}

// Replace alerts
content = content.replace(
    'alert("Por favor, complete al menos la Cédula y los Nombres.");',
    'showToast("Por favor, complete al menos la Cédula y los Nombres.", "warning");'
);

content = content.replace(
    'alert("Empleado guardado exitosamente.");',
    'showToast("Empleado guardado exitosamente.", "success");'
);

content = content.replace(
    'alert("Ocurrió un error al guardar: " + error.message);',
    'showAlert("Error", "Ocurrió un error al guardar: " + error.message, "error");'
);

fs.writeFileSync(jsPath, content, 'utf8');
console.log('Alertas reemplazadas por modales nativos en personalWizard.js');
