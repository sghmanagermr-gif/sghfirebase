const fs = require('fs');

const indexHtmlPath = 'c:/Proyectos/sgh-2.0/frontend/index.html';
let html = fs.readFileSync(indexHtmlPath, 'utf8');

const modalRecuperarHtml = `
    <!-- MODAL RECUPERAR CONTRASEÑA -->
    <div id="modal-recuperar-pwd" class="lock-screen" style="display: none; z-index: 10005;">
      <div class="auth-card glass-panel" style="max-width: 440px; position: relative; text-align: center; padding: 32px 26px;">
        <button type="button" id="btn-cerrar-recuperar-pwd" style="position: absolute; top: 14px; right: 16px; background: none; border: none; font-size: 1.3rem; cursor: pointer; color: var(--text-muted); line-height: 1;">✖</button>
        <div style="font-size: 2.2rem; margin-bottom: 8px;">🔐</div>
        <h2 style="color: var(--primary-color); margin-bottom: 8px; font-size: 1.35rem;">Recuperar Contraseña</h2>
        <p style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 20px; line-height: 1.4;">
          Ingresa el correo electrónico institucional o personal con el que estás registrado. Te enviaremos un enlace oficial seguro para restablecer tu clave.
        </p>
        <form id="form-recuperar-pwd" style="display: flex; flex-direction: column; gap: 14px;">
          <input type="email" id="recuperar-email" placeholder="ejemplo@correo.com" required autocomplete="email" style="width: 100%; box-sizing: border-box;" />
          <button type="submit" id="btn-enviar-recuperar" style="width: 100%; padding: 12px; font-weight: bold; cursor: pointer;">Enviar Enlace de Recuperación</button>
        </form>
        <div id="recuperar-msg" style="margin-top: 15px; display: none; font-size: 0.88rem; border-radius: 8px; padding: 12px; text-align: left; line-height: 1.4;"></div>
      </div>
    </div>
`;

if (!html.includes('id="modal-recuperar-pwd"')) {
  const marker = '<!-- VISTA DE REGISTRO -->';
  const idx = html.indexOf(marker);
  if (idx !== -1) {
    html = html.slice(0, idx) + modalRecuperarHtml + '\n    ' + html.slice(idx);
    fs.writeFileSync(indexHtmlPath, html, 'utf8');
    console.log('Modal insertado correctamente con marker independiente de CRLF');
  } else {
    console.error('Marker no encontrado');
    process.exit(1);
  }
} else {
  console.log('Modal ya existía');
}
