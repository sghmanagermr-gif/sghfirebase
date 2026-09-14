const fs = require('fs');

const mainJsPath = 'c:/Proyectos/sgh-2.0/frontend/src/main.js';
const indexHtmlPath = 'c:/Proyectos/sgh-2.0/frontend/index.html';
const packageJsonPath = 'c:/Proyectos/sgh-2.0/frontend/package.json';

// 1. Modificar main.js
let mainJs = fs.readFileSync(mainJsPath, 'utf8');

const oldLogicMarker = `// ==========================================
// LÓGICA DE RECUPERACIÓN DE CONTRASEÑA (ZERO-COST FIREBASE)
// ==========================================`;

const endOfLogicMarker = `// --- Lógica del Login ---`;

const newRecoveryLogic = `// ==========================================
// LÓGICA DE RECUPERACIÓN DE CONTRASEÑA (ZERO-COST FIREBASE)
// ==========================================
const modalRecuperarPwd = document.getElementById('modal-recuperar-pwd');
const linkForgotPwd = document.getElementById('link-forgot-pwd');
const btnCerrarRecuperarPwd = document.getElementById('btn-cerrar-recuperar-pwd');
const formRecuperarPwd = document.getElementById('form-recuperar-pwd');
const inpRecuperarEmail = document.getElementById('recuperar-email');
const divRecuperarMsg = document.getElementById('recuperar-msg');
const btnEnviarRecuperar = document.getElementById('btn-enviar-recuperar');

let recuperarTimer = null;

function limpiarTimerRecuperar() {
    if (recuperarTimer) {
        clearInterval(recuperarTimer);
        recuperarTimer = null;
    }
}

function abrirModalRecuperarPwd() {
    limpiarTimerRecuperar();
    if (!modalRecuperarPwd) return;
    if (formRecuperarPwd) formRecuperarPwd.style.display = 'flex';
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
    limpiarTimerRecuperar();
    if (!modalRecuperarPwd) return;
    modalRecuperarPwd.style.display = 'none';
    if (formRecuperarPwd) formRecuperarPwd.style.display = 'flex';
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
        limpiarTimerRecuperar();
        btnEnviarRecuperar.disabled = true;
        btnEnviarRecuperar.textContent = 'Enviando enlace seguro...';
        divRecuperarMsg.style.display = 'none';

        await sendPasswordResetEmail(auth, email);

        // Ocultar formulario para darle protagonismo a la confirmación
        if (formRecuperarPwd) formRecuperarPwd.style.display = 'none';

        divRecuperarMsg.style.display = 'block';
        divRecuperarMsg.style.background = 'rgba(16, 185, 129, 0.15)';
        divRecuperarMsg.style.border = '1px solid #10b981';
        divRecuperarMsg.style.color = '#065f46';
        divRecuperarMsg.innerHTML = \`
            <div style="font-weight: bold; margin-bottom: 6px; font-size: 1rem;">✅ ¡Enlace enviado con éxito!</div>
            <div style="margin-bottom: 12px; line-height: 1.4; color: var(--text-main, #1e293b);">
                Hemos enviado un correo a <b>\${email}</b>. Revisa tu bandeja de entrada (y tu carpeta de Spam o Correo no deseado) para definir tu nueva contraseña.
            </div>
            <div id="recuperar-countdown" style="font-size: 0.88rem; color: #047857; margin-bottom: 12px;">
                Volviendo al inicio de sesión en <b id="countdown-secs">5</b> segundos...
            </div>
            <div>
                <a id="link-volver-login" style="display: inline-block; font-weight: 600; text-decoration: underline; cursor: pointer; color: var(--primary-color, #1e3a8a); font-size: 0.92rem;">
                    ← Volver al Inicio de Sesión ahora
                </a>
            </div>
        \`;

        document.getElementById('link-volver-login')?.addEventListener('click', (ev) => {
            ev.preventDefault();
            cerrarModalRecuperarPwd();
        });

        let remaining = 5;
        recuperarTimer = setInterval(() => {
            remaining--;
            const countEl = document.getElementById('countdown-secs');
            if (countEl) countEl.textContent = remaining;
            if (remaining <= 0) {
                limpiarTimerRecuperar();
                cerrarModalRecuperarPwd();
            }
        }, 1000);

    } catch (err) {
        console.error('Error enviando enlace de recuperación:', err);
        if (formRecuperarPwd) formRecuperarPwd.style.display = 'flex';
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

const startIdx = mainJs.indexOf(oldLogicMarker);
const endIdx = mainJs.indexOf(endOfLogicMarker);

if (startIdx !== -1 && endIdx !== -1) {
    mainJs = mainJs.slice(0, startIdx) + newRecoveryLogic + '\n' + mainJs.slice(endIdx);
    fs.writeFileSync(mainJsPath, mainJs, 'utf8');
    console.log('main.js actualizado con countdown y botón volver.');
} else {
    console.error('No se encontraron los marcadores en main.js');
    process.exit(1);
}

// 2. Bump version to v2.11.1
let pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
pkg.version = '2.11.1';
fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2), 'utf8');
console.log('package.json actualizado a v2.11.1.');

let html = fs.readFileSync(indexHtmlPath, 'utf8');
html = html.replace(/<title>SGH - v2\.11\.0<\/title>/g, '<title>SGH - v2.11.1</title>');
html = html.replace(/lor: var\(--primary-color\);"\>SGH<\/span> v2\.11\.0/g, 'lor: var(--primary-color);">SGH</span> v2.11.1');
fs.writeFileSync(indexHtmlPath, html, 'utf8');
console.log('index.html actualizado a v2.11.1.');
