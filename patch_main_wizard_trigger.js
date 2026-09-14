const fs = require('fs');

const mainJsPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';
let content = fs.readFileSync(mainJsPath, 'utf8');

if (!content.includes('window.abrirWizardPersonal()')) {
    content = content.replace(
        'showToast("¡Datos del plantel actualizados con éxito!", "success");',
        'showToast("¡Datos del plantel actualizados con éxito!", "success");\n\n              // Desplegar Wizard Personal automáticamente si la matrícula se guardó\n              if (typeof window.abrirWizardPersonal === "function") {\n                  window.abrirWizardPersonal();\n              }'
    );
    fs.writeFileSync(mainJsPath, content, 'utf8');
    console.log('Trigger del Wizard inyectado exitosamente en main.js');
} else {
    console.log('Trigger del Wizard ya estaba inyectado.');
}

const htmlPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';
let htmlContent = fs.readFileSync(htmlPath, 'utf8');
if (htmlContent.includes('<h2>Personal</h2>')) {
    // Remove the fake Personal card from the dashboard
    htmlContent = htmlContent.replace(
        /<div class="glass-panel" style="padding: 24px;">\s*<h2>Personal<\/h2>\s*<p>Gestiona los docentes, administrativos y obreros de tu plantel\.<\/p>\s*<button style="margin-top: 20px;" onclick="abrirWizardPersonal\(\)">Gestionar Personal<\/button>\s*<\/div>/g,
        ''
    );
    fs.writeFileSync(htmlPath, htmlContent, 'utf8');
    console.log('Tarjeta Personal falsa removida del HTML.');
}
