const fs = require('fs');
const path = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';

let content = fs.readFileSync(path, 'utf8');

const target = '<!-- Global Loading Modal -->';

const modalHTML = `
    <!-- Modal Confirmación Incompleta -->
    <div id="modal-confirm-incompleta" class="lock-screen" aria-hidden="true" style="display: none; z-index: 10003; align-items: center; justify-content: center;">
      <div class="lock-card glass-panel" style="max-width: 400px; width: 100%; text-align: center;">
        <h2 style="color: var(--primary-color); font-size: 1.3rem; margin-bottom: 15px;">Confirmación</h2>
        <p style="color: var(--text-main); margin-bottom: 25px;">¿Está seguro de declarar secciones y matrículas incompletas?</p>
        <div style="display: flex; gap: 10px; justify-content: center;">
          <button type="button" id="btn-cancelar-incompleta" class="btn-secondary" style="padding: 10px 20px; border-radius: 6px;">Cancelar</button>
          <button type="button" id="btn-aceptar-incompleta" style="background: #003399; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer;">Aceptar</button>
        </div>
      </div>
    </div>

    <!-- Global Loading Modal -->`;

if (!content.includes('id="modal-confirm-incompleta"')) {
    content = content.replace(target, modalHTML);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Success! Modal HTML injected.");
} else {
    console.log("Modal already exists.");
}
