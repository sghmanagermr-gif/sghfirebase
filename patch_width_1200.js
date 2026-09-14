const fs = require('fs');

const htmlPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';
let content = fs.readFileSync(htmlPath, 'utf8');

// Update max-width from 900px to 1200px for the plantel container
content = content.replace(
    'style="max-width: 900px; width: 95%; padding: 0; margin-bottom: 40px;"',
    'style="max-width: 1200px; width: 95%; padding: 0; margin-bottom: 40px;"'
);

// Update max-width from 900px to 1200px for the personal container
content = content.replace(
    'style="display: none; margin: 30px auto 0; padding: 24px; max-width: 900px; width: 95%;"',
    'style="display: none; margin: 30px auto 0; padding: 24px; max-width: 1200px; width: 95%;"'
);

fs.writeFileSync(htmlPath, content, 'utf8');
console.log('Ancho ampliado a 1200px.');
