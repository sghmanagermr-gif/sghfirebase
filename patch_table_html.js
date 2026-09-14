const fs = require('fs');
const path = require('path');

const projectRoot = 'C:\\Proyectos\\sgh-2.0\\frontend';
const indexHtmlPath = path.join(projectRoot, 'index.html');

let content = fs.readFileSync(indexHtmlPath, 'utf8');

const tableHtml = `
    <!-- SECCIÓN LISTA DE PERSONAL EXISTENTE -->
    <div id="seccion-lista-personal" class="lock-card glass-panel"
      style="display: none; margin: 30px auto 0; padding: 24px; max-width: 1200px; width: 95%;">
      <h2
        style="margin-top: 0; margin-bottom: 20px; font-size: 1.5rem; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
        Personal Registrado en este Plantel</h2>
      
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
          <thead>
            <tr style="background: #f8fafc; color: #475569; border-bottom: 2px solid #cbd5e1;">
              <th style="padding: 12px; font-weight: bold;">Cédula</th>
              <th style="padding: 12px; font-weight: bold;">Nombres y Apellidos</th>
              <th style="padding: 12px; font-weight: bold;">Cargo</th>
            </tr>
          </thead>
          <tbody id="tbody-lista-personal">
            <tr>
              <td colspan="3" style="padding: 20px; text-align: center; color: #94a3b8; font-style: italic;">
                Cargando registros...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <!-- SECCIÓN REGISTRO DE PERSONAL (EN LÍNEA) -->`;

const targetHtml = '<!-- SECCIÓN REGISTRO DE PERSONAL (EN LÍNEA) -->';

if (content.includes(targetHtml)) {
    content = content.replace(targetHtml, tableHtml);
    fs.writeFileSync(indexHtmlPath, content, 'utf8');
    console.log('index.html patched with table HTML.');
} else {
    console.log('Target HTML not found in index.html');
}
