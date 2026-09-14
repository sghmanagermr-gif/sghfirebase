const fs = require('fs');
const path = require('path');

const indexHtmlPath = 'c:/Proyectos/sgh-2.0/frontend/index.html';
const mainJsPath = 'c:/Proyectos/sgh-2.0/frontend/src/main.js';
const packageJsonPath = 'c:/Proyectos/sgh-2.0/frontend/package.json';

// --- 1. MODIFICAR INDEX.HTML ---
console.log('Modificando index.html...');
let html = fs.readFileSync(indexHtmlPath, 'utf8');

// A. Reemplazar versión
html = html.replace(/<title>SGH - v2\.10\.10<\/title>/g, '<title>SGH - v2.11.0</title>');
html = html.replace(/lor: var\(--primary-color\);"\>SGH<\/span> v2\.10\.10/g, 'lor: var(--primary-color);">SGH</span> v2.11.0');

// B. Agregar enlace ¿Olvidaste tu contraseña? y el Modal
const targetLoginCard = `<a class="auth-link" id="link-go-register">¿Nuevo en el sistema? Solicitar Acceso</a>`;
const replacementLoginCard = `<a class="auth-link" id="link-go-register">¿Nuevo en el sistema? Solicitar Acceso</a>
        <a class="auth-link" id="link-forgot-pwd" style="display: block; margin-top: 10px; font-size: 0.85rem; cursor: pointer; color: var(--text-muted);">¿Olvidaste tu contraseña?</a>`;

if (html.includes(targetLoginCard) && !html.includes('link-forgot-pwd')) {
  html = html.replace(targetLoginCard, replacementLoginCard);
  console.log('Enlace link-forgot-pwd agregado a index.html');
} else {
  console.log('Enlace ya existía o target no encontrado');
}

const targetEndOfLoginView = `    </section>

    <!-- VISTA DE REGISTRO -->`;

const modalRecuperarHtml = `    </section>

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

    <!-- VISTA DE REGISTRO -->`;

if (html.includes(targetEndOfLoginView) && !html.includes('modal-recuperar-pwd')) {
  html = html.replace(targetEndOfLoginView, modalRecuperarHtml);
  console.log('Modal modal-recuperar-pwd insertado en index.html');
} else {
  console.log('Modal ya existía o target no encontrado');
}

fs.writeFileSync(indexHtmlPath, html, 'utf8');
console.log('index.html guardado.');


// --- 2. MODIFICAR MAIN.JS ---
console.log('Modificando main.js...');
let mainJs = fs.readFileSync(mainJsPath, 'utf8');

// A. Importar sendPasswordResetEmail
const importTarget = `import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, signOut, setPersistence, inMemoryPersistence } from 'firebase/auth';`;
const importReplacement = `import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signOut, setPersistence, inMemoryPersistence } from 'firebase/auth';`;

if (mainJs.includes(importTarget)) {
  mainJs = mainJs.replace(importTarget, importReplacement);
  console.log('sendPasswordResetEmail importado en main.js');
}

// B. Lógica del modal de recuperación
const codeRecuperarPwd = `
// ==========================================
// LÓGICA DE RECUPERACIÓN DE CONTRASEÑA (ZERO-COST FIREBASE)
// ==========================================
const modalRecuperarPwd = document.getElementById('modal-recuperar-pwd');
const linkForgotPwd = document.getElementById('link-forgot-pwd');
const btnCerrarRecuperarPwd = document.getElementById('btn-cerrar-recuperar-pwd');
const formRecuperarPwd = document.getElementById('form-recuperar-pwd');
const inpRecuperarEmail = document.getElementById('recuperar-email');
const divRecuperarMsg = document.getElementById('recuperar-msg');
const btnEnviarRecuperar = document.getElementById('btn-enviar-recuperar');

function abrirModalRecuperarPwd() {
    if (!modalRecuperarPwd) return;
    // Si el usuario ya escribió algo en el campo de email del login, prellenarlo
    const loginEmailVal = document.getElementById('login-email')?.value?.trim();
    if (loginEmailVal && inpRecuperarEmail) {
        inpRecuperarEmail.value = loginEmailVal;
    }
    if (divRecuperarMsg) {
        divRecuperarMsg.style.display = 'none';
        divRecuperarMsg.innerHTML = '';
    }
    if (btnEnviarRecuperar) {
        btnEnviarRecuperar.disabled = false;
        btnEnviarRecuperar.textContent = 'Enviar Enlace de Recuperación';
    }
    modalRecuperarPwd.style.display = 'flex';
    setTimeout(() => inpRecuperarEmail?.focus(), 80);
}

function cerrarModalRecuperarPwd() {
    if (!modalRecuperarPwd) return;
    modalRecuperarPwd.style.display = 'none';
}

linkForgotPwd?.addEventListener('click', (e) => {
    e.preventDefault();
    abrirModalRecuperarPwd();
});

btnCerrarRecuperarPwd?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    cerrarModalRecuperarPwd();
});

modalRecuperarPwd?.addEventListener('click', (e) => {
    if (e.target === modalRecuperarPwd) {
        cerrarModalRecuperarPwd();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalRecuperarPwd && modalRecuperarPwd.style.display === 'flex') {
        cerrarModalRecuperarPwd();
    }
});

formRecuperarPwd?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = inpRecuperarEmail?.value?.trim();
    if (!email) return;

    try {
        btnEnviarRecuperar.disabled = true;
        btnEnviarRecuperar.textContent = 'Enviando enlace seguro...';
        divRecuperarMsg.style.display = 'none';

        await sendPasswordResetEmail(auth, email);

        divRecuperarMsg.style.display = 'block';
        divRecuperarMsg.style.background = 'rgba(16, 185, 129, 0.15)';
        divRecuperarMsg.style.border = '1px solid #10b981';
        divRecuperarMsg.style.color = '#065f46';
        divRecuperarMsg.innerHTML = \`
            <div style="font-weight: bold; margin-bottom: 5px;">✅ ¡Enlace enviado con éxito!</div>
            <div>Hemos enviado un correo a <b>\${email}</b>. Revisa tu bandeja de entrada (y tu carpeta de Spam o Correo no deseado) para definir tu nueva contraseña.</div>
        \`;
        btnEnviarRecuperar.disabled = false;
        btnEnviarRecuperar.textContent = 'Reenviar Enlace';
    } catch (err) {
        console.error('Error enviando enlace de recuperación:', err);
        divRecuperarMsg.style.display = 'block';
        divRecuperarMsg.style.background = 'rgba(239, 68, 68, 0.15)';
        divRecuperarMsg.style.border = '1px solid #ef4444';
        divRecuperarMsg.style.color = '#991b1b';

        let msg = 'Ocurrió un inconveniente al enviar el enlace. Por favor, intenta de nuevo.';
        if (err.code === 'auth/user-not-found') {
            msg = 'No existe ningún usuario registrado con este correo electrónico.';
        } else if (err.code === 'auth/invalid-email') {
            msg = 'El formato del correo electrónico ingresado no es válido.';
        } else if (err.code === 'auth/too-many-requests') {
            msg = 'Demasiadas solicitudes en poco tiempo. Por seguridad de tu cuenta, espera unos minutos antes de intentar de nuevo.';
        } else if (err.code === 'auth/network-request-failed') {
            msg = 'Error de conexión a internet. Verifica tu red e intenta nuevamente.';
        }

        divRecuperarMsg.innerHTML = \`<div style="font-weight: bold;">⚠️ \${msg}</div>\`;
        btnEnviarRecuperar.disabled = false;
        btnEnviarRecuperar.textContent = 'Intentar de Nuevo';
    }
});
`;

// Insertar antes del listener de login-form
const targetLoginListener = `// --- Lógica del Login ---`;
if (mainJs.includes(targetLoginListener) && !mainJs.includes('modalRecuperarPwd')) {
  mainJs = mainJs.replace(targetLoginListener, codeRecuperarPwd + '\n' + targetLoginListener);
  console.log('Lógica de recuperación inyectada en main.js');
}

// También asegurar que durante el login linkForgotPwd se deshabilite
const targetLinkRegister = `const linkRegister = document.getElementById('link-go-register');
    if (linkRegister) { linkRegister.style.pointerEvents = 'none'; linkRegister.style.opacity = '0.5'; }`;
const replacementLinkRegister = `const linkRegister = document.getElementById('link-go-register');
    const linkForgot = document.getElementById('link-forgot-pwd');
    if (linkRegister) { linkRegister.style.pointerEvents = 'none'; linkRegister.style.opacity = '0.5'; }
    if (linkForgot) { linkForgot.style.pointerEvents = 'none'; linkForgot.style.opacity = '0.5'; }`;

if (mainJs.includes(targetLinkRegister)) {
  mainJs = mainJs.replace(targetLinkRegister, replacementLinkRegister);
}

const targetResetLinks = `const linkRegister = document.getElementById('link-go-register');
            if (linkRegister) { linkRegister.style.pointerEvents = 'auto'; linkRegister.style.opacity = '1'; }`;
const replacementResetLinks = `const linkRegister = document.getElementById('link-go-register');
            const linkForgot = document.getElementById('link-forgot-pwd');
            if (linkRegister) { linkRegister.style.pointerEvents = 'auto'; linkRegister.style.opacity = '1'; }
            if (linkForgot) { linkForgot.style.pointerEvents = 'auto'; linkForgot.style.opacity = '1'; }`;

if (mainJs.includes(targetResetLinks)) {
  mainJs = mainJs.replace(targetResetLinks, replacementResetLinks);
}

fs.writeFileSync(mainJsPath, mainJs, 'utf8');
console.log('main.js guardado.');


// --- 3. ACTUALIZAR PACKAGE.JSON ---
console.log('Actualizando package.json a v2.11.0...');
let pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
pkg.version = '2.11.0';
fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2), 'utf8');
console.log('package.json actualizado con éxito a v2.11.0.');
