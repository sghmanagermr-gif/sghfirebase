const fs = require('fs');

const indexPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';

if (fs.existsSync(indexPath)) {
    let htmlContent = fs.readFileSync(indexPath, 'utf8');
    
    const tableHTML = `
    <!-- TABLA DE PERSONAL EXISTENTE -->
    <div id="seccion-personal-existente" class="lock-card glass-panel" style="display: none; margin: 30px auto 0; padding: 24px; max-width: 1200px; width: 95%;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
          <h2 style="margin: 0; font-size: 1.5rem; color: #0f172a;">
            Personal Registrado en el Plantel
          </h2>
          <div style="position: relative;">
            <span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #94a3b8; display: flex; align-items: center;">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </span>
            <input type="text" id="buscador-personal" placeholder="Buscar cédula o nombre..." style="padding: 8px 12px 8px 32px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px; width: 260px; outline: none; transition: all 0.2s; background: white; color: #1e293b; box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);" onfocus="this.style.borderColor='#3b82f6'; this.style.boxShadow='0 0 0 3px rgba(59,130,246,0.1)';" onblur="this.style.borderColor='#cbd5e1'; this.style.boxShadow='inset 0 1px 2px rgba(0,0,0,0.05)';">
          </div>
        </div>
        <div style="max-height: 300px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
          <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead style="background-color: #f8fafc; position: sticky; top: 0; z-index: 1;">
              <tr>
                <th style="padding: 12px; border-bottom: 2px solid #cbd5e1; color: #475569;">Cédula</th>
                <th style="padding: 12px; border-bottom: 2px solid #cbd5e1; color: #475569;">Nombre y Apellido</th>
                <th style="padding: 12px; border-bottom: 2px solid #cbd5e1; color: #475569;">Tipo de Personal</th>
                <th style="padding: 12px; border-bottom: 2px solid #cbd5e1; color: #475569;">Situación Laboral</th>
                <th style="padding: 12px; border-bottom: 2px solid #cbd5e1; color: #475569; text-align: center;">Acciones</th>
              </tr>
            </thead>
            <tbody id="tbody-personal-existente">
              <!-- Renderizado dinámicamente -->
            </tbody>
          </table>
        </div>
      </div>
`;
    // The safest anchor is <div id="seccion-registro-personal" class="lock-card glass-panel"
    // We insert tableHTML just before that line.
    if (!htmlContent.includes('seccion-personal-existente')) {
        htmlContent = htmlContent.replace(/(<div id="seccion-registro-personal")/i, tableHTML + '\n    $1');
        fs.writeFileSync(indexPath, htmlContent);
        console.log("Tabla de personal insertada correctamente.");
    } else {
        console.log("La tabla ya existe en index.html.");
    }
}
