const fs = require('fs');

const htmlPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';
let content = fs.readFileSync(htmlPath, 'utf8');

content = content.replace(
    '<div id="seccion-registro-personal" class="glass-panel" style="display: none; margin-top: 30px; padding: 24px;">',
    '<div id="seccion-registro-personal" class="lock-card glass-panel" style="display: none; margin: 30px auto 0; padding: 24px; max-width: 900px; width: 95%;">'
);

fs.writeFileSync(htmlPath, content, 'utf8');
console.log('Ancho del contenedor actualizado para igualar al plantel-form.');
