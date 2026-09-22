const fs = require('fs');
let html = fs.readFileSync('c:/Proyectos/sgh-mr - firebase/webapp/index.html', 'utf8');

html = html.replace('z-index: 50;', 'z-index: 9000;');
html = html.replace('z-index: 40;', 'z-index: 8999;');

const blockToMoveRegex = /<h3[^>]*>Mantenimiento de Base de Datos \(Aspiradora Inteligente\)<\/h3>[\s\S]*?<\/div>\s*(?=<h3[^>]*>Excepciones)/;
const match = html.match(blockToMoveRegex);

if (match) {
    const block = match[0];
    html = html.replace(blockToMoveRegex, '');
    
    const newTabHtml = '\n    <!-- TAB: MANTENIMIENTO BD -->\n    <div id=\x22admin-tab-aspiradora\x22 class=\x22admin-tab\x22>\n      <div class=\x22glass-panel\x22 style=\x22padding: 30px;\x22>\n' + block + '\n      </div>\n    </div>\n';
    
    html = html.replace('</main>', newTabHtml + '\n    </main>');
} else {
    console.log('Regex did not match Aspiradora block');
}

const newBtn = '\n          <button id=\x22btn-sidebar-aspiradora\x22 class=\x22sidebar-btn\x22 data-target=\x22admin-tab-aspiradora\x22 style=\x22display: flex; gap: 8px; align-items: center;\x22>\n            <svg xmlns=\x22http://www.w3.org/2000/svg\x22 width=\x2216\x22 height=\x2216\x22 fill=\x22currentColor\x22 viewBox=\x220 0 16 16\x22><path d=\x22M15 2H1v12h14V2zM1 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H1z\x22/></svg>\n            Mantenimiento BD\n          </button>\n';
html = html.replace('Despliegue</button>', 'Despliegue</button>' + newBtn);

fs.writeFileSync('c:/Proyectos/sgh-mr - firebase/webapp/index.html', html, 'utf8');
console.log('Fixes applied successfully');

