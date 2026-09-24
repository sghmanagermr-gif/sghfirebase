import './personalWizard.js';

window.showLoading = (msg) => {
    const modal = document.getElementById('global-loading-modal');
    if(modal) {
        document.getElementById('global-loading-text').textContent = (msg || 'CARGANDO...').toUpperCase();
        modal.style.display = 'flex';
        modal.style.opacity = '1';
    }
};
window.hideLoading = () => {
    const modal = document.getElementById('global-loading-modal');
    if(modal) {
        modal.style.opacity = '0';
        setTimeout(() => modal.style.display = 'none', 400);
    }
};

import { showToast, showAlert } from './uiUtils.js';

// --- CAPA VISUAL: FORZAR MAYÚSCULAS GLOBALES ---
document.addEventListener('input', (e) => {
    if (e.target.tagName === 'INPUT' && (e.target.type === 'text' || e.target.type === 'search' || !e.target.type)) {
        // Ignorar campos de contraseña (incluso si están en texto visible)
        if (e.target.id.includes('password') || e.target.id.includes('pwd')) return;
        
        const start = e.target.selectionStart;
        const end = e.target.selectionEnd;
        e.target.value = e.target.value.toUpperCase();
        if(e.target.setSelectionRange) e.target.setSelectionRange(start, end);
    } else if (e.target.tagName === 'TEXTAREA') {
        const start = e.target.selectionStart;
        const end = e.target.selectionEnd;
        e.target.value = e.target.value.toUpperCase();
        if(e.target.setSelectionRange) e.target.setSelectionRange(start, end);
    } else if (e.target.tagName === 'INPUT' && e.target.type === 'email') {
        e.target.value = e.target.value.toLowerCase();
    }
});

import { safeSetDoc, safeUpdateDoc, safeAddDoc } from './dbUtils.js';
import './style.css';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, deleteField, onSnapshot } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signOut, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { initAuth } from './auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyDSdDRB10kbtor5ROR50AsCxVmk0fOpqFo",
    authDomain: "sgh-merida.firebaseapp.com",
    projectId: "sgh-merida",
    storageBucket: "sgh-merida.firebasestorage.app",
    messagingSenderId: "873672016601",
    appId: "1:873672016601:web:3024d5b94ee3926c8e34c8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);


// Variables de estado
let dictionaryData = {};
let currentPlantel = null;

// Referencias al DOM
const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const lockScreen = document.getElementById('lock-screen');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const userDisplayName = document.getElementById('user-display-name');
const btnLogout = document.getElementById('btn-logout');
const plantelForm = document.getElementById('plantel-form');

// --- Navegación ---
function showView(viewId) {
    if (window.hideLoading) window.hideLoading();
    const loader = document.getElementById('app-loader');
    if (loader && loader.style.display !== 'none') {
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.display = 'none';
            document.body.style.overflow = '';
        }, 400);
    }
    
    // Al usar !important en .view, necesitamos sobreescribir el estilo inline temporalmente
    document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active');
        v.style.setProperty('display', 'none', 'important');
    });
    
    const target = document.getElementById(viewId);
    if(target) {
        target.classList.add('active');
        target.style.setProperty('display', 'flex', 'important');
    }
}

// Función para buscar un plantel directamente en Firestore
async function findPlantel(codigoDEA) {
    if (!codigoDEA) return null;
    try {
        const docRef = doc(db, 'planteles', codigoDEA.toUpperCase());
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const p = docSnap.data();
            p.municipio_nombre = p.municipio;
            p.parroquia_nombre = p.parroquia;
            return p;
        }
    } catch(e) {
        console.error("Error consultando plantel:", e);
    }
    return null;
}

// Load Municipios from Cache or Firestore
async function loadMunicipios() {
    const selectMun = document.getElementById('reg-municipio');
    let muns = JSON.parse(localStorage.getItem('sgh_catalogos_muns'));
    
    if(!muns) {
        try {
            const docSnap = await getDoc(doc(db, 'sistema', 'catalogos_maestros'));
            if(docSnap.exists() && docSnap.data().listas_desplegables) {
                muns = docSnap.data().listas_desplegables.municipios;
                localStorage.setItem('sgh_catalogos_muns', JSON.stringify(muns));
            }
        } catch(e) {
            console.error("Error cargando municipios:", e);
        }
    }

    if(muns && selectMun) {
        selectMun.innerHTML = '<option value="" disabled selected>Seleccione el Municipio</option>';
        muns.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m; opt.textContent = m;
            selectMun.appendChild(opt);
        });
    }
}

// --- Lógica Central de Autenticación (Guardián) ---
initAuth(auth, db, {
  onLogout: () => {
    localStorage.removeItem('sgh_catalogos');
    sessionStorage.removeItem('sgh_despliegue_config');
    document.getElementById('login-form')?.reset();
    
    // Resetear UI del Dashboard para no dejar la "última pantalla" abierta
    if (typeof window.closeSidebar === 'function') {
        window.closeSidebar();
    }
    document.querySelectorAll('.sidebar-btn').forEach(b => {
        if(!b.classList.contains('accordion-btn')) b.classList.remove('active');
    });
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    
    // Forzar Estadísticas como pestaña por defecto
    const btnDash = document.querySelector('[data-target="admin-tab-estadisticas"]');
    if(btnDash) btnDash.classList.add('active');
    const tabDash = document.getElementById('admin-tab-estadisticas');
    if(tabDash) tabDash.classList.add('active');
    
    // Cerrar acordeones
    document.querySelectorAll('.accordion-btn').forEach(b => {
        b.classList.remove('open');
        const arrow = b.querySelector('.arrow');
        if (arrow) arrow.style.transform = 'rotate(0deg)';
    });
    document.querySelectorAll('.accordion-content').forEach(c => {
        c.style.display = 'none';
    });

    showView('login-view');
  },
  onWait: (mensaje) => {
    showView('espera-view');
    const msjEl = document.querySelector('#espera-view p');
    if (msjEl) msjEl.textContent = mensaje;
  },
  onLogin: async (userData) => {
      window.sgh_user_data = userData;
      if (userData.rol === 'plaadmin' || userData.rol === 'plant') {
        const codPlantel = userData.jerarquia?.plantel_codigo;
        const dp = await findPlantel(codPlantel);
        const nombrePlantel = dp ? (dp['nombre-plantel']?.nominal || dp.nombre_plantel || "Plantel") : "Plantel";
        if (userDisplayName) userDisplayName.textContent = `${codPlantel || ''} - ${nombrePlantel}`;
        if (codPlantel) {
          await checkPlantelData(codPlantel);
        } else {
          showView('lock-screen');
        }
      } else {
        if (userDisplayName) userDisplayName.textContent = `${userData.nombre || ''}`;
        showView('lock-screen');
      }
  },

  onAdmin: async (userData) => {
    showView('admin-view');
    import('./admin.js').then(m => m.initAdminDashboard(db, userData));
  }
});

// Toggle Password Visibility
const togglePwd = (toggleBtnId, inputId) => {
    const btn = document.getElementById(toggleBtnId);
    const inp = document.getElementById(inputId);
    if(btn && inp) {
        btn.addEventListener('click', () => {
            if(inp.type === 'password') {
                inp.type = 'text';
                btn.textContent = '🙈';
            } else {
                inp.type = 'password';
                btn.textContent = '👁️';
            }
        });
    }
}
togglePwd('toggle-login-pwd', 'login-password');
togglePwd('toggle-reg-pwd', 'reg-password');

// Switch Login/Register
document.getElementById('link-go-register')?.addEventListener('click', () => {
    showView('register-view');
    loadMunicipios();
});
document.getElementById('link-go-login')?.addEventListener('click', () => {
    showView('login-view');
});

// Dynamic form fields for Registration
document.getElementById('reg-rol')?.addEventListener('change', (e) => {
    const rol = e.target.value;
    document.getElementById('dynamic-munadmin').classList.add('hidden');
    document.getElementById('dynamic-plaadmin').classList.add('hidden');
    document.getElementById('reg-municipio').required = false;
    document.getElementById('reg-codigo-dea').required = false;

    if(rol === 'munadmin') {
        document.getElementById('dynamic-munadmin').classList.remove('hidden');
        document.getElementById('reg-municipio').required = true;
    } else if(rol === 'plaadmin') {
        document.getElementById('dynamic-plaadmin').classList.remove('hidden');
        document.getElementById('reg-codigo-dea').required = true;
    }
});

// Botón de Cerrar Sesión (Sala Espera)
document.getElementById('btn-logout-espera')?.addEventListener('click', async () => {
    await signOut(auth);
});


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
        divRecuperarMsg.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 6px; font-size: 1rem;">✅ ¡Enlace enviado con éxito!</div>
            <div style="margin-bottom: 12px; line-height: 1.4; color: var(--text-main, #1e293b);">
                Hemos enviado un correo a <b>${email}</b>. Revisa tu bandeja de entrada (y tu carpeta de Spam o Correo no deseado) para definir tu nueva contraseña.
            </div>
            <div id="recuperar-countdown" style="font-size: 0.88rem; color: #047857; margin-bottom: 12px;">
                Volviendo al inicio de sesión en <b id="countdown-secs">5</b> segundos...
            </div>
            <div>
                <a id="link-volver-login" style="display: inline-block; font-weight: 600; text-decoration: underline; cursor: pointer; color: var(--primary-color, #1e3a8a); font-size: 0.92rem;">
                    ← Volver al Inicio de Sesión ahora
                </a>
            </div>
        `;

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

        divRecuperarMsg.innerHTML = `<div style="font-weight: bold;">⚠️ ${msg}</div>`;
        btnEnviarRecuperar.disabled = false;
        btnEnviarRecuperar.textContent = 'Intentar de Nuevo';
    }
});

// --- Lógica del Login ---
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const loginError = document.getElementById('login-error');

  try {
    loginError.style.display = 'none';
    const btn = document.querySelector('#login-form button[type="submit"]');
    btn.innerHTML = 'Verificando...'; btn.disabled = true; window.showLoading("Autenticando y verificando permisos...");
    const loginFormElements = document.getElementById('login-form').querySelectorAll('input, button.toggle-password');
    loginFormElements.forEach(el => el.disabled = true);
    const linkRegister = document.getElementById('link-go-register');
    const linkForgot = document.getElementById('link-forgot-pwd');
    if (linkRegister) { linkRegister.style.pointerEvents = 'none'; linkRegister.style.opacity = '0.5'; }
    if (linkForgot) { linkForgot.style.pointerEvents = 'none'; linkForgot.style.opacity = '0.5'; }

    await setPersistence(auth, browserSessionPersistence);
    
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    loginError.textContent = "Credenciales inválidas.";
    loginError.style.display = 'block';
  } finally {
        const btn = document.querySelector('#login-form button[type="submit"]');
        if(btn) {
            btn.innerHTML = 'Iniciar Sesión';
            btn.disabled = false;
            const loginFormElements = document.getElementById('login-form').querySelectorAll('input, button.toggle-password');
            loginFormElements.forEach(el => el.disabled = false);
            const linkRegister = document.getElementById('link-go-register');
            const linkForgot = document.getElementById('link-forgot-pwd');
            if (linkRegister) { linkRegister.style.pointerEvents = 'auto'; linkRegister.style.opacity = '1'; }
            if (linkForgot) { linkForgot.style.pointerEvents = 'auto'; linkForgot.style.opacity = '1'; }
        }
        // Solo quitamos el modal aquí si hubo un error visible. Si no hay error, el modal se quita al cambiar de pantalla.
        if (loginError.style.display === 'block') {
            window.hideLoading();
        }
    }
});

// --- Lógica del Registro ---
document.getElementById('register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-register');
    const err = document.getElementById('register-error');
    err.style.display = 'none';
    btn.disabled = true;
    btn.innerHTML = 'Registrando...'; window.showLoading("Creando cuenta y asignando rol...");
    // Inhabilitar campos
    const regForm = document.getElementById('register-form');
    const formElements = regForm.querySelectorAll('input, select');
    formElements.forEach(el => el.disabled = true);
    const linkLogin = document.getElementById('link-go-login');
    if (linkLogin) { linkLogin.style.pointerEvents = 'none'; linkLogin.style.opacity = '0.5'; }

    const nombre = document.getElementById('reg-nombre').value.trim();
    const cedula = document.getElementById('reg-cedula').value.trim();
    const telefono = document.getElementById('reg-telefono').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const pwd = document.getElementById('reg-password').value;
    const rol = document.getElementById('reg-rol').value;
    let municipio = document.getElementById('reg-municipio').value || "";
    const dea = document.getElementById('reg-codigo-dea').value.trim().toUpperCase();
    const deaErr = document.getElementById('reg-dea-error');
    deaErr.style.display = 'none';

    try {
        if(rol === 'plaadmin') {
            const dp = await findPlantel(dea);
            if(!dp) {
                deaErr.textContent = "El código DEA no existe en la base de datos.";
                deaErr.style.display = 'block';
                throw new Error("Invalid DEA");
            }
            municipio = dp.municipio || dp.municipio_nombre;
        }

        const cred = await createUserWithEmailAndPassword(auth, email, pwd);
        await sendEmailVerification(cred.user);

        let jerarquia = { estado: "MERIDA" };
        if(rol === 'munadmin') {
            jerarquia.municipio = municipio;
        } else if(rol === 'plaadmin') {
            jerarquia.municipio = municipio;
            jerarquia.plantel_codigo = dea;
        }

        await safeSetDoc(doc(db, 'usuarios', cred.user.uid), {
            nombre,
            cedula,
            telefono,
            email,
            rol,
            jerarquia,
            estado_aprobacion: "PENDIENTE",
            creado_el: new Date().toISOString()
        });

        await showAlert("¡Registro Exitoso!", "Revise su correo en la carpeta spam para verificar su cuenta y comuníquese con el responsable de Sistema de gestión humana municipal para la aprobación.", "success");
        await signOut(auth);

    } catch (error) {
        if(error.message !== "Invalid DEA") {
            console.error(error);
            err.textContent = "Error al registrarse. Revise sus datos e intente de nuevo.";
            if(error.code === 'auth/email-already-in-use') err.textContent = "El correo ya está en uso.";
            err.style.display = 'block';
        }
    } finally {
        window.hideLoading();
        btn.disabled = false;
        btn.innerHTML = 'Registrarse';
        const formElements = document.getElementById('register-form').querySelectorAll('input, select');
    formElements.forEach(el => el.disabled = false);
    const linkLogin = document.getElementById('link-go-login');
    if (linkLogin) { linkLogin.style.pointerEvents = 'auto'; linkLogin.style.opacity = '1'; }
    }
});


// --- Lógica Dinámica de Matrícula (Fase 2) ---


function _distribuirSecciones(numSec, numGrados) {
    const base = Math.floor(numSec / numGrados);
    const resto = numSec % numGrados;
    const dist = [];
    for (let g = 0; g < numGrados; g++) {
        dist.push(base + (g < resto ? 1 : 0));
    }
    return dist;
}

function _letraGrupo(s) {
    return String.fromCharCode(65 + s);
}

function _renderCajasInicial(tipo, numSec) {
    const cont = document.getElementById('cont-dinamico-' + tipo);
    if (!cont) return;
    
    if (numSec === 0) {
        cont.innerHTML = '';
        return;
    }

    let html = '<div style="margin-top: 15px;">';
    html += '<h4 style="font-size: 0.9rem; color: #475569; margin-bottom: 10px; text-transform: capitalize;">' + tipo + '</h4>';
    html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 15px;">';

    for (let i = 0; i < numSec; i++) {
        const letra = numSec === 1 ? 'U' : _letraGrupo(i);
        const ident = tipo + '-' + letra;
        
        html += '<div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; background: #f8fafc;">';
        html += '  <h5 style="margin: 0 0 8px; font-size: 0.85rem; color: #1e293b; text-align: center;">Grupo ' + letra + '</h5>';
        html += '  <div style="display: flex; gap: 10px;">';
        html += '    <div style="flex: 1;">';
        html += '      <label style="font-size: 0.65rem; color: #64748b; display: block; text-align: center;">FEM</label>';
        html += '      <input type="number" class="mat-input mat-' + tipo + '" data-grupo="' + ident + '" data-sexo="F" min="0" value="" style="width: 100%; padding: 0.3rem; text-align: center; border: 1px solid #cbd5e1; border-radius: 4px;">';
        html += '    </div>';
        html += '    <div style="flex: 1;">';
        html += '      <label style="font-size: 0.65rem; color: #64748b; display: block; text-align: center;">MAS</label>';
        html += '      <input type="number" class="mat-input mat-' + tipo + '" data-grupo="' + ident + '" data-sexo="M" min="0" value="" style="width: 100%; padding: 0.3rem; text-align: center; border: 1px solid #cbd5e1; border-radius: 4px;">';
        html += '    </div>';
        html += '  </div>';
        html += '</div>';
    }
    
    html += '</div></div>';
    cont.innerHTML = html;
}

function _renderCajasPrimaria(numSec) {
    const cont = document.getElementById('cont-dinamico-primaria');
    if (!cont) return;

    if (numSec === 0) {
        cont.innerHTML = '';
        return;
    }

    const dist = _distribuirSecciones(numSec, 6);
    const ORDINALES = ['1er', '2do', '3er', '4to', '5to', '6to'];
    
    let html = '<div style="margin-top: 15px;">';
    html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">';

    for (let g = 0; g < 6; g++) {
        if (dist[g] === 0) continue;
        
        const secsEnGrado = dist[g];
        for (let s = 0; s < secsEnGrado; s++) {
            const letra = secsEnGrado === 1 ? 'U' : _letraGrupo(s);
            const titulo = ORDINALES[g] + ' Grado ' + letra;
            const ident = 'primaria-' + (g+1) + letra;
            
            html += '<div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; background: #f8fafc;">';
            html += '  <h5 style="margin: 0 0 8px; font-size: 0.85rem; color: #1e293b; text-align: center;">' + titulo + '</h5>';
            html += '  <div style="display: flex; gap: 10px;">';
            html += '    <div style="flex: 1;">';
            html += '      <label style="font-size: 0.65rem; color: #64748b; display: block; text-align: center;">FEM</label>';
            html += '      <input type="number" class="mat-input mat-primaria" data-grupo="' + ident + '" data-sexo="F" min="0" value="" style="width: 100%; padding: 0.3rem; text-align: center; border: 1px solid #cbd5e1; border-radius: 4px;">';
            html += '    </div>';
            html += '    <div style="flex: 1;">';
            html += '      <label style="font-size: 0.65rem; color: #64748b; display: block; text-align: center;">MAS</label>';
            html += '      <input type="number" class="mat-input mat-primaria" data-grupo="' + ident + '" data-sexo="M" min="0" value="" style="width: 100%; padding: 0.3rem; text-align: center; border: 1px solid #cbd5e1; border-radius: 4px;">';
            html += '    </div>';
            html += '  </div>';
            html += '</div>';
        }
    }

    html += '</div></div>';
    cont.innerHTML = html;
}

function _renderCajasEspecial(numGrupos) {
    const cont = document.getElementById('cont-dinamico-especial');
    if (!cont) return;
    if (numGrupos === 0) {
        cont.innerHTML = '';
        return;
    }
    let html = '<div style="margin-top: 15px;">';
    html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 15px;">';
    for (let i = 0; i < numGrupos; i++) {
        const letra = numGrupos === 1 ? 'U' : _letraGrupo(i);
        const ident = 'especial-' + letra;
        html += '<div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; background: #f8fafc;">';
        html += '  <h5 style="margin: 0 0 8px; font-size: 0.85rem; color: #1e293b; text-align: center;">Grupo ' + letra + '</h5>';
        html += '  <div style="display: flex; gap: 10px;">';
        html += '    <div style="flex: 1;">';
        html += '      <label style="font-size: 0.65rem; color: #64748b; display: block; text-align: center;">FEM</label>';
        html += '      <input type="number" class="mat-input mat-especial" data-grupo="' + ident + '" data-sexo="F" min="0" value="" style="width: 100%; padding: 0.3rem; text-align: center; border: 1px solid #cbd5e1; border-radius: 4px;">';
        html += '    </div>';
        html += '    <div style="flex: 1;">';
        html += '      <label style="font-size: 0.65rem; color: #64748b; display: block; text-align: center;">MAS</label>';
        html += '      <input type="number" class="mat-input mat-especial" data-grupo="' + ident + '" data-sexo="M" min="0" value="" style="width: 100%; padding: 0.3rem; text-align: center; border: 1px solid #cbd5e1; border-radius: 4px;">';
        html += '    </div>';
        html += '  </div>';
        html += '</div>';
    }
    html += '</div></div>';
    cont.innerHTML = html;
}
function _renderCajasAdulto(numGrupos) {
    const cont = document.getElementById('cont-dinamico-adulto');
    if (!cont) return;
    if (numGrupos === 0) {
        cont.innerHTML = '';
        return;
    }
    let html = '<div style="margin-top: 15px;">';
    html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 15px;">';
    for (let i = 0; i < numGrupos; i++) {
        const letra = numGrupos === 1 ? 'U' : _letraGrupo(i);
        const ident = 'adulto-' + letra;
        html += '<div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; background: #f8fafc;">';
        html += '  <h5 style="margin: 0 0 8px; font-size: 0.85rem; color: #1e293b; text-align: center;">Grupo ' + letra + '</h5>';
        html += '  <div style="display: flex; gap: 10px;">';
        html += '    <div style="flex: 1;">';
        html += '      <label style="font-size: 0.65rem; color: #64748b; display: block; text-align: center;">FEM</label>';
        html += '      <input type="number" class="mat-input mat-adulto" data-grupo="' + ident + '" data-sexo="F" min="0" value="" style="width: 100%; padding: 0.3rem; text-align: center; border: 1px solid #cbd5e1; border-radius: 4px;">';
        html += '    </div>';
        html += '    <div style="flex: 1;">';
        html += '      <label style="font-size: 0.65rem; color: #64748b; display: block; text-align: center;">MAS</label>';
        html += '      <input type="number" class="mat-input mat-adulto" data-grupo="' + ident + '" data-sexo="M" min="0" value="" style="width: 100%; padding: 0.3rem; text-align: center; border: 1px solid #cbd5e1; border-radius: 4px;">';
        html += '    </div>';
        html += '  </div>';
        html += '</div>';
    }
    html += '</div></div>';
    cont.innerHTML = html;
}

document.addEventListener('input', (e) => {
    if (e.target.classList.contains('sec-master-input')) {
        const val = parseInt(e.target.value) || 0;
        const plan = e.target.getAttribute('data-plan');
        
        if (plan === '20000') {
            const tipo = e.target.getAttribute('data-tipo');
            _renderCajasInicial(tipo, val);
        } else if (plan === '21000') {
            _renderCajasPrimaria(val);
        } else if (e.target.id === 'secEsp' || e.target.getAttribute('data-tipo') === 'especial') {
            _renderCajasEspecial(val);
        } else if (e.target.id === 'secAdu' || e.target.getAttribute('data-tipo') === 'adulto') {
            _renderCajasAdulto(val);
        }
        
        // Recalcular matrícula al redibujar
        document.getElementById('contenedor-matricula').dispatchEvent(new Event('input', { bubbles: true }));
    }
});

// Reemplazar la lógica anterior de sumatoria de matrícula

// --- Lógica del "Candado de Navegación" ---
// Cálculo automático de totales
document.getElementById('plantel-form')?.addEventListener('input', (e) => {
    if (e.target.tagName.toLowerCase() === 'input') {
        let matTotal = 0;
        
        const sumInputs = (selector) => {
            let sum = 0;
            document.querySelectorAll(selector).forEach(inp => {
                const b1 = inp.closest('div[id^="bloque-"]'); const b2 = inp.closest('#cont-secciones-detalle'); if ((b1 && b1.style.display !== 'none') || (b2 && b2.style.display !== 'none')) {
                    sum += parseInt(inp.value || 0);
                }
            });
            return sum;
        };

        // Subtotales
        const totMat = sumInputs('.mat-maternal');
        const totPre = sumInputs('.mat-preescolar');
        const totIni = totMat + totPre;
        
        const totPri = sumInputs('.mat-primaria');
        const totMed = sumInputs('.mat-media');
        const totTec = sumInputs('.mat-tecnica');
        const totEsp = sumInputs('.mat-especial');
        const totAdu = sumInputs('.mat-adulto');
        
        if(document.getElementById('tot-inicial')) document.getElementById('tot-inicial').textContent = totIni;
        if(document.getElementById('tot-primaria')) document.getElementById('tot-primaria').textContent = totPri;
        if(document.getElementById('tot-especial')) document.getElementById('tot-especial').textContent = totEsp;
        if(document.getElementById('tot-adulto')) document.getElementById('tot-adulto').textContent = totAdu;
        
          // Calculate dynamic media gen
          let sumMg = 0, sumMt = 0;
          document.querySelectorAll('.dyn-mg-fem, .dyn-mg-mas').forEach(i => sumMg += parseInt(i.value||0));
          document.querySelectorAll('.dyn-mt-fem, .dyn-mt-mas').forEach(i => sumMt += parseInt(i.value||0));
          
          if(document.getElementById('tot-media-gen')) document.getElementById('tot-media-gen').textContent = sumMg;
          if(document.getElementById('tot-media-tec')) document.getElementById('tot-media-tec').textContent = sumMt;

          // Calculate section sums per plan and totals
          let totalSecMg = 0, totalSecMt = 0;
          const planesSums = {};
          document.querySelectorAll('.sec-anio-input').forEach(inp => {
              if (inp.closest('div[id^="bloque-"]')?.style.display !== 'none' && inp.closest('#cont-secciones-detalle')?.style.display !== 'none') {
                  const plan = inp.dataset.plan;
                  const v = parseInt(inp.value || 0);
                  if (!planesSums[plan]) planesSums[plan] = 0;
                  planesSums[plan] += v;
                  
                  if (plan.startsWith('3')) totalSecMg += v;
                  if (plan.startsWith('4')) totalSecMt += v;
              }
          });
          
          // Update the plan section counters
          Object.keys(planesSums).forEach(p => {
              const el = document.getElementById('tot-sec-plan-' + p);
              if (el) el.textContent = planesSums[p];
          });
          
          // Update global section counters
          if(document.getElementById('tot-sec-media-gen')) document.getElementById('tot-sec-media-gen').textContent = totalSecMg;
          if(document.getElementById('tot-sec-media-tec')) document.getElementById('tot-sec-media-tec').textContent = totalSecMt;
        

                // Sumar todos los inputs de matrícula (.mat-input)
        document.querySelectorAll('.mat-input').forEach(input => {
            const b = input.closest('div[id^="bloque-"]');
            if (b && b.style.display !== 'none') {
                matTotal += parseInt(input.value || 0);
            }
        });
        
        matTotal += sumMg + sumMt;
        
        if (document.getElementById('lbl-matricula-total')) document.getElementById('lbl-matricula-total').textContent = matTotal;
        if (document.getElementById('inp-matricula-total')) document.getElementById('inp-matricula-total').value = matTotal;
    }
});

// --- Lógicas Algorítmicas Migradas de sgh_gas ---
window._VACANTES_TEMP = {};

function _letraSec(s, nTotal) {
    return nTotal === 1 ? 'U' : String.fromCharCode(65 + s);
}



function _getGuardado(data, clavePrincipal) {
    if (!data) return 0;
    if (data[clavePrincipal]) {
        const valExacto = parseInt(data[clavePrincipal], 10) || 0;
        delete data[clavePrincipal];
        return valExacto;
    }
    return 0;
}

function _renderizarDetalleSecciones(planes, guardadas = null) {
    const cont = document.getElementById('cont-secciones-detalle');
    const contDinamico = document.getElementById('cont-secciones-dinamicas');
    if (!cont || !contDinamico) return;
    contDinamico.innerHTML = '';
    
    const planesArr = Object.keys(planes).sort();
    const mediaPlanes = planesArr.filter(p => p !== '20000' && p !== '21000');
    
    if (mediaPlanes.length === 0) {
        cont.style.display = 'none';
        return;
    }
    
    cont.style.display = 'block';
    let html = '';
    
    // Usamos las guardadas o un objeto vacío
    const seccionesGuardadas = guardadas || {}; 
    
    
      const planesMG = mediaPlanes.filter(p => p.startsWith('3'));
      const planesMT = mediaPlanes.filter(p => p.startsWith('4'));

      const renderPlan = (plan) => {
          const isMt = plan.startsWith('4');
          const anios = isMt ? 6 : 5;
          const info = planes[plan];
          let titulo = 'Plan ' + plan;
          if (info && info.mencion) titulo += ' (' + info.mencion + ')';
          
          html += '<div style="margin-bottom: 1.5rem; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem; background: #f9fafb;">';
          html += '<h4 style="margin: 0 0 1rem; color: #1e40af; font-size: 0.95rem;">' + titulo + '</h4>';
          html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 1rem;">';
          
          for (let i = 1; i <= anios; i++) {
              const planSec = seccionesGuardadas[plan] || {};
              const val = parseInt(planSec[i] !== undefined ? planSec[i] : (planSec[String(i)] !== undefined ? planSec[String(i)] : 0)) || 0;
              html += '<div style="display: flex; flex-direction: column; gap: 0.3rem;">';
              html += '<label style="font-size: 0.8rem; font-weight: 600; color: #374151;">' + i + 'º Año</label>';
              html += '<input type="number" class="sec-anio-input" data-plan="' + plan + '" data-anio="' + i + '" min="0" value="' + (val || '') + '" style="padding: 0.4rem; text-align: center; border: 1px solid #cbd5e1; border-radius: 4px;">';
              html += '</div>';
          }
          
          html += '</div>';
          html += '<div style="background: #f1f5f9; padding: 12px 20px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">';
          html += '<span style="font-size: 0.9rem; color: var(--primary-color); font-weight: 600;">Total Secciones (Plan ' + plan + ')</span>';
          html += '<span id="tot-sec-plan-' + plan + '" class="tot-sec-plan-label" data-plan="' + plan + '" style="font-size: 1.1rem; color: #0f172a; font-weight: bold;">0</span>';
          html += '</div>';
          html += '</div>';
      };

      if (planesMG.length > 0) {
          html += '<div style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; margin: -20px -20px 20px -20px;"><div style="display: flex; align-items: center; gap: 10px;"><span style="font-size: 1.2rem;">👨‍🏫</span><h3 style="margin: 0; font-size: 1rem; color: #1e293b;">Cantidad de Secciones por Año - Media General</h3></div><div><span style="font-size: 0.9rem; color: var(--primary-color); font-weight: 600;">Total Secciones Media Gen: </span><span id="tot-sec-media-gen" style="font-size: 1.1rem; color: #0f172a; font-weight: bold;">0</span></div></div>';
          planesMG.forEach(renderPlan);
      }
      if (planesMT.length > 0) {
          html += '<div style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; border-top: 1px solid #e2e8f0; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; margin: 0 -20px 20px -20px;"><div style="display: flex; align-items: center; gap: 10px;"><span style="font-size: 1.2rem;">⚙️</span><h3 style="margin: 0; font-size: 1rem; color: #1e293b;">Cantidad de Secciones por Año - Media Técnica</h3></div><div><span style="font-size: 0.9rem; color: var(--primary-color); font-weight: 600;">Total Secciones Media Téc: </span><span id="tot-sec-media-tec" style="font-size: 1.1rem; color: #0f172a; font-weight: bold;">0</span></div></div>';
          planesMT.forEach(renderPlan);
      }
      
      contDinamico.innerHTML = html;
}


function _renderizarMatriculaMedia(planes, guardadas = null) {
    const contMg = document.getElementById('cont-mat-media-general');
    const contMt = document.getElementById('cont-mat-media-tecnica');
    if (contMg) contMg.innerHTML = '';
    if (contMt) contMt.innerHTML = '';
    
    const matMedia = guardadas ? guardadas.media : null;
    const mgSaved = matMedia ? (matMedia["media-general"] || {}) : {};
    const mtSaved = matMedia ? (matMedia["media-tecnica"] || {}) : {};

    Object.keys(planes).sort().forEach(plan => {
        const info = planes[plan];
        let titulo = 'Plan ' + plan;
        if (info && info.mencion) titulo += ' (' + info.mencion + ')';

        if (plan.startsWith('3') && contMg) {
            const saved = mgSaved[plan] || {};
            let html = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; background: #f8fafc;">';
            html += '<div style="grid-column: span 2;"><h4 style="margin: 0; color: #1e40af; font-size: 0.95rem;">' + titulo + '</h4></div>';
            html += '<div><label style="font-size: 0.75rem; color: #64748b;">Femenino</label><input type="number" class="mat-input mat-media dyn-mg-fem" data-plan="' + plan + '" min="0" value="' + (saved.fem || '') + '" style="background: white; color: #0f172a; border-color: #cbd5e1; width: 100%;" /></div>';
            html += '<div><label style="font-size: 0.75rem; color: #64748b;">Masculino</label><input type="number" class="mat-input mat-media dyn-mg-mas" data-plan="' + plan + '" min="0" value="' + (saved.mas || '') + '" style="background: white; color: #0f172a; border-color: #cbd5e1; width: 100%;" /></div>';
            html += '</div>';
            contMg.innerHTML += html;
        } else if (plan.startsWith('4') && contMt) {
            const saved = mtSaved[plan] || {};
            let html = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; background: #f8fafc;">';
            html += '<div style="grid-column: span 2;"><h4 style="margin: 0; color: #1e40af; font-size: 0.95rem;">' + titulo + '</h4></div>';
            html += '<div><label style="font-size: 0.75rem; color: #64748b;">Femenino</label><input type="number" class="mat-input mat-media dyn-mt-fem" data-plan="' + plan + '" min="0" value="' + (saved.fem || '') + '" style="background: white; color: #0f172a; border-color: #cbd5e1; width: 100%;" /></div>';
            html += '<div><label style="font-size: 0.75rem; color: #64748b;">Masculino</label><input type="number" class="mat-input mat-media dyn-mt-mas" data-plan="' + plan + '" min="0" value="' + (saved.mas || '') + '" style="background: white; color: #0f172a; border-color: #cbd5e1; width: 100%;" /></div>';
            html += '</div>';
            contMt.innerHTML += html;
        }
    });
}

async function _abrirModalVacantes() {
    let mat = parseInt(document.getElementById('secMat')?.value) || 0;
    let pre = parseInt(document.getElementById('secPre')?.value) || 0;
    let pri = parseInt(document.getElementById('secPri')?.value) || 0;

    const VAC = window._VACANTES_TEMP || {};

    // Auto-corrección
    if (mat === 0 && VAC['maternal'] && Object.keys(VAC['maternal']).length > 0) mat = Object.keys(VAC['maternal']).length;
    if (pre === 0 && VAC['preescolar'] && Object.keys(VAC['preescolar']).length > 0) pre = Object.keys(VAC['preescolar']).length;
    if (pri === 0 && VAC['primaria'] && Object.keys(VAC['primaria']).length > 0) pri = 6;

    if (mat === 0 && pre === 0 && pri === 0) {
        await showAlert('Secciones Requeridas', 'Primero declare las secciones en el formulario de matrícula para Educación Inicial o Primaria.', 'warning');
        return;
    }

    const contenido = document.getElementById('vacantes-contenido');
    if (!contenido) return;
    contenido.innerHTML = '';

    function _crearBloque(titulo, keyPlan, numSec, dataObj) {
        const tempData = dataObj ? JSON.parse(JSON.stringify(dataObj)) : {};
        const div = document.createElement('div');
        div.style.cssText = 'margin-bottom:1.2rem; border:1px solid #fde68a; border-radius:8px; padding:1rem; background:#fffbeb;';
        const h4 = document.createElement('h4');
        h4.textContent = titulo;
        h4.style.cssText = 'margin:0 0 0.75rem; font-size:0.95rem; color:#92400e; font-weight:700;';
        div.appendChild(h4);
        const grid = document.createElement('div');
        grid.style.cssText = 'display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:0.5rem;';
        
        for (let s = 0; s < numSec; s++) {
            const letra = _letraSec(s, numSec);
            const guardado = _getGuardado(tempData, letra);
            const wrap = document.createElement('div');
            wrap.style.cssText = 'display:flex; align-items:center; justify-content:space-between; gap:0.5rem; background:#fff; padding:0.5rem 0.8rem; border-radius:4px; border:1px solid #e2e8f0;';
            
            const ident = keyPlan + '-' + letra;
            const inputsFemMas = document.querySelectorAll('.mat-input.mat-' + keyPlan + '[data-grupo="' + ident + '"]');
            let totalSec = 0;
            inputsFemMas.forEach(i => totalSec += (parseInt(i.value) || 0));
            
            const inp = document.createElement('input');
            inp.type = 'checkbox'; 
            inp.checked = (guardado !== 0 && guardado !== undefined && guardado !== "");
            inp.dataset.plan = keyPlan; inp.dataset.sec = letra;
            inp.className = 'vac-input';
            inp.style.cssText = 'width:18px; height:18px; cursor:pointer; accent-color:#f59e0b; margin:0 !important; padding:0 !important; flex-shrink:0;';
            inp.id = 'chk-vac-' + keyPlan + '-' + letra;
            
            const lbl = document.createElement('label');
            lbl.innerHTML = '<span style="color:#64748b; font-weight:normal; margin-right:4px;">(' + totalSec + ')</span> SECCIÓN ' + letra;
            lbl.style.cssText = 'font-size:0.85rem; color:#475569; font-weight:600; cursor:pointer; user-select:none; margin:0;';
            lbl.htmlFor = inp.id;
            
            wrap.appendChild(lbl); wrap.appendChild(inp);
            grid.appendChild(wrap);
        }
        div.appendChild(grid);
        return div;
    }

    if (mat > 0) contenido.appendChild(_crearBloque('MATERNAL', 'maternal', mat, VAC['maternal']));
    if (pre > 0) contenido.appendChild(_crearBloque('PREESCOLAR', 'preescolar', pre, VAC['preescolar']));

    if (pri > 0) {
        const dist = _distribuirSecciones(pri, 6);
        const ORDINALES = ['1ER','2DO','3ER','4TO','5TO','6TO'];
        const dataPri = VAC['primaria'] ? JSON.parse(JSON.stringify(VAC['primaria'])) : {};
        for (let g = 0; g < 6; g++) {
            if (dist[g] === 0) continue;
            const divG = document.createElement('div');
            divG.style.cssText = 'margin-bottom:1rem; border:1px solid #fde68a; border-radius:8px; padding:0.85rem; background:#fffbeb;';
            const hG = document.createElement('h4');
            hG.textContent = ORDINALES[g] + ' GRADO';
            hG.style.cssText = 'margin:0 0 0.6rem; font-size:0.9rem; color:#92400e; font-weight:700;';
            divG.appendChild(hG);
            const gridG = document.createElement('div');
            gridG.style.cssText = 'display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:0.4rem;';
            
            for (let s = 0; s < dist[g]; s++) {
                const letra = _letraSec(s, dist[g]);
                const clave = String(g + 1) + letra;
                const guardado = _getGuardado(dataPri, clave);
                const wrapG = document.createElement('div');
                wrapG.style.cssText = 'display:flex; align-items:center; justify-content:space-between; gap:0.5rem; background:#fff; padding:0.5rem 0.8rem; border-radius:4px; border:1px solid #e2e8f0;';
                
                const ident = 'primaria-' + (g + 1) + letra;
                const inputsFemMas = document.querySelectorAll('.mat-input.mat-primaria[data-grupo="' + ident + '"]');
                let totalSec = 0;
                inputsFemMas.forEach(i => totalSec += (parseInt(i.value) || 0));
                
                const inpG = document.createElement('input');
                inpG.type = 'checkbox'; 
                inpG.checked = (guardado !== 0 && guardado !== undefined && guardado !== "");
                inpG.dataset.plan = 'primaria'; inpG.dataset.grado = String(g + 1); inpG.dataset.sec = letra;
                inpG.className = 'vac-input';
                inpG.style.cssText = 'width:18px; height:18px; cursor:pointer; accent-color:#f59e0b; margin:0 !important; padding:0 !important; flex-shrink:0;';
                inpG.id = 'chk-vac-pri-' + (g+1) + '-' + letra;
                
                const lblG = document.createElement('label');
                lblG.innerHTML = '<span style="color:#64748b; font-weight:normal; margin-right:4px;">(' + totalSec + ')</span> ' + ORDINALES[g] + ' ' + letra;
                lblG.style.cssText = 'font-size:0.85rem; color:#475569; font-weight:600; cursor:pointer; user-select:none; margin:0;';
                lblG.htmlFor = inpG.id;
                
                wrapG.appendChild(lblG); wrapG.appendChild(inpG);
                gridG.appendChild(wrapG);
            }
            divG.appendChild(gridG);
            contenido.appendChild(divG);
        }
    }

    const modal = document.getElementById('modal-vacantes');
    modal.style.display = 'flex';
}

// Control del Modal de Vacantes
document.getElementById('btn-cancelar-vacantes')?.addEventListener('click', () => {
    document.getElementById('modal-vacantes').style.display = 'none';
});

document.getElementById('btn-confirmar-vacantes')?.addEventListener('click', () => {
    const inputs = document.querySelectorAll('#vacantes-contenido .vac-input');
    const vacFinal = { maternal: {}, preescolar: {}, primaria: {} };

    inputs.forEach(inp => {
        const val = inp.type === 'checkbox' ? (inp.checked ? 1 : 0) : (parseInt(inp.value, 10) || 0);
        if (val <= 0) return;
        const plan = inp.dataset.plan || '';
        const sec = inp.dataset.sec || '';
        const grado = inp.dataset.grado || '';

        if (plan === 'maternal' || plan === 'preescolar') {
            vacFinal[plan][sec] = val;
        } else if (plan === 'primaria') {
            vacFinal.primaria[grado + sec] = val;
        }
    });

    ['maternal', 'preescolar', 'primaria'].forEach(k => {
        if (Object.keys(vacFinal[k]).length === 0) delete vacFinal[k];
    });

    window._VACANTES_TEMP = vacFinal;
    document.getElementById('modal-vacantes').style.display = 'none';
    
    
});

// Selector de Vacantes SI/NO
document.getElementById('toggle-vacantes')?.addEventListener('click', (e) => {
    if (e.target.tagName.toLowerCase() === 'button') {
        const val = e.target.getAttribute('data-val');
        
        // Estilos del toggle
        document.querySelectorAll('#toggle-vacantes button').forEach(b => {
            b.style.background = 'transparent';
            b.style.color = 'var(--primary-color)';
            b.style.fontWeight = 'normal';
        });
        e.target.style.background = val === 'SI' ? '#fef3c7' : '#dcfce7';
        e.target.style.color = val === 'SI' ? '#b45309' : '#166534';
        e.target.style.fontWeight = 'bold';

        if (val === 'NO') {
            window._VACANTES_TEMP = {};
        } else if (val === 'SI') {
            _abrirModalVacantes();
        }
    }
});

async function checkPlantelData(codigoDEA) {
  try {
    const docRef = doc(db, "planteles", codigoDEA);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      // Verificamos si los datos requeridos existen
      // Siempre mostrar la pantalla de datos del plantel (formulario de matrícula/secciones)
      // ya no enviamos al dashboard-view antiguo.
      currentPlantel = data;
        window.currentPlantelDEA = codigoDEA;
        mostrarCandado(codigoDEA, data);
      
      // Suscripción reactiva a cambios en Firestore para mantener el UI actualizado con los datos reales
      if (window._unsubPlantel) {
          window._unsubPlantel(); // Desuscribir el anterior si cambió de escuela
      }
      window._unsubPlantel = onSnapshot(docRef, (snap) => {
          if (snap.exists()) {
              const liveData = snap.data();
              console.log("🔥 [onSnapshot] Datos recibidos de Firestore:", liveData.matricula);
              const inpMatTotal = document.getElementById('inp-matricula-total');
              if (liveData.personal_resumen && liveData.personal_resumen.length > 0) {
                  const tbody = document.getElementById('tbody-lista-personal');
                  const seccionLista = document.getElementById('seccion-lista-personal');
                  if (tbody && seccionLista) {
                      seccionLista.style.display = 'block';
                      tbody.innerHTML = liveData.personal_resumen.map(p => 
                          '<tr style="border-bottom: 1px solid #f1f5f9;">' +
                          '<td style="padding: 12px; color: #334155;">' + (p.cedula || '') + '</td>' +
                          '<td style="padding: 12px; color: #334155; font-weight: 500;">' + (p.nombre || '') + '</td>' +
                          '<td style="padding: 12px; color: #64748b;">' + (p.cargo || '') + '</td>' +
                          '</tr>'
                      ).join('');
                  }
              } else {
                  const seccionLista = document.getElementById('seccion-lista-personal');
                  if (seccionLista) seccionLista.style.display = 'none';
              }
              
              if (inpMatTotal && liveData.matricula && liveData.matricula["total-gen"] !== undefined) {
                  inpMatTotal.value = liveData.matricula["total-gen"];
                  console.log("✅ [onSnapshot] Input de Matrícula Total actualizado a:", liveData.matricula["total-gen"]);
              }
          }
      });
    } else {
      // El plantel no existe en la base de datos! (Caso de planteles faltantes en CSV)
      mostrarCandado(codigoDEA, null);
    }
  } catch (error) {
    console.error("Error validando plantel en Firestore:", error);
    console.warn("Mostrando candado por defecto debido a error (posible falta de permisos o sin conexión)");
    mostrarCandado(codigoDEA, null);
  }
}

async function mostrarCandado(codigoDEA, dataParcial) {
    showView('lock-screen');
    
    // ==========================================
    // SISTEMA DE COACCIÓN Y MODO SUPERVISIÓN
    // ==========================================
    let styleTag = document.getElementById('style-coaccion');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'style-coaccion';
        document.head.appendChild(styleTag);
    }

    if (window._modoSupervision) {
        styleTag.innerHTML = `
            #btn-guardar-matricula { display: none !important; }
            #plantel-form input:not([readonly]), #plantel-form select { pointer-events: none !important; opacity: 0.7 !important; }
            #seccion-registro-personal { display: none !important; }
            #seccion-personal-existente { display: block !important; }
        `;
        const secMatriculaForm = document.getElementById('plantel-form');
        if (secMatriculaForm) {
            const inputs = secMatriculaForm.querySelectorAll('input:not([readonly]), select');
            inputs.forEach(i => i.disabled = true);
        }
    } else {
        const sessionConfig = sessionStorage.getItem('sgh_despliegue_config');
        if (sessionConfig) {
            try {
                const config = JSON.parse(sessionConfig);
                const modo = config.modo_operacion || 'TOTAL';
                let cssRules = '';
                
                // CSS rules with !important override any inline .style.display = 'block' from other scripts
                if (modo === 'SOLO_MATRICULA') {
                    cssRules = `
                        #seccion-personal-existente { display: none !important; }
                        #seccion-registro-personal { display: none !important; }
                    `;
                } 
                else if (modo === 'SOLO_AGREGAR_PERSONAL') {
                    cssRules = `
                        #btn-guardar-matricula { display: none !important; }
                        #plantel-form input:not([readonly]), #plantel-form select { pointer-events: none !important; opacity: 0.6 !important; }
                        #seccion-personal-existente .btn-editar, #seccion-personal-existente .btn-eliminar { display: none !important; }
                    `;
                } 
                else if (modo === 'SOLO_EDITAR_PERSONAL') {
                    cssRules = `
                        #btn-guardar-matricula { display: none !important; }
                        #plantel-form input:not([readonly]), #plantel-form select { pointer-events: none !important; opacity: 0.6 !important; }
                        #seccion-registro-personal:not(:has(#banner-modo-edicion[style*="flex"])) { display: none !important; }
                    `;
                } 
                else if (modo === 'PERSONAL_COMPLETO') {
                    cssRules = `
                        #btn-guardar-matricula { display: none !important; }
                        #plantel-form input:not([readonly]), #plantel-form select { pointer-events: none !important; opacity: 0.6 !important; }
                    `;
                }
                
                styleTag.innerHTML = cssRules;

                // Also forcefully disable the inputs in the DOM to prevent 'Tab' key focusing
                const secMatriculaForm = document.getElementById('plantel-form');
                if (secMatriculaForm) {
                    const inputs = secMatriculaForm.querySelectorAll('input:not([readonly]), select');
                    const disableMatricula = (modo !== 'TOTAL' && modo !== 'SOLO_MATRICULA');
                    inputs.forEach(i => i.disabled = disableMatricula);
                }
                
                // To be extra safe with the existing logic, apply inline disabling once
                const btnMatricula = document.getElementById('btn-guardar-matricula');
                if (btnMatricula && modo !== 'TOTAL' && modo !== 'SOLO_MATRICULA') {
                    btnMatricula.disabled = true;
                }

            } catch(e) { console.error("Error aplicando coacción CSS:", e); }
        }
    }
    
    // Poblar Datos de Solo Lectura desde el Diccionario
    const dp = await findPlantel(codigoDEA);
    if (dp) {
        window.currentPlantelInfo = dp;
        document.getElementById('inp-estado').value = "MÉRIDA";
        document.getElementById('inp-municipio').value = dp.municipio || '';
        document.getElementById('inp-parroquia').value = dp.parroquia || '';
        document.getElementById('inp-dependencia-plantel').value = dp.dependencia || '';
        document.getElementById('inp-codigo-plantel').value = dp.codigos?.plantel || codigoDEA;
        document.getElementById('inp-cod-estadistico').value = dp.codigos?.estadistico || '';
        
        let codDep = dp.codigos?.dependencia;
        if (Array.isArray(codDep)) codDep = codDep.join(', ');
        document.getElementById('inp-cod-dependencia').value = codDep || '';

        document.getElementById('inp-denominacion').value = dp.denominacion || '';
        document.getElementById('inp-nombre-nominal').value = dp['nombre-plantel']?.nominal || '';
        document.getElementById('inp-nuevo-eponimo').value = dp['nombre-plantel']?.['nuevo-eponimo'] || '';

        document.getElementById('inp-niveles-modalidades').value = dp.nivel || '';
        
        document.getElementById('inp-ubicacion').value = dp['ubicacion-geografica'] || '';
        document.getElementById('inp-turnos-plantel').value = dp['turno-plantel'] || '';
        const totalGenDp = dp.matricula?.['total-gen'] 
            || dp['matricula-total'] 
            || dp.matricula?.modalidades?.especial?.['total-especial'] 
            || dp.matricula?.modalidades?.adulto?.['total-adulto'] 
            || '';
        document.getElementById('inp-matricula-total').value = totalGenDp;
        
        // Mantener el oculto para no romper compatibilidad en otras funciones
        const hiddenInp = document.getElementById('inp-nombre-plantel');
        if (hiddenInp) hiddenInp.value = dp['nombre-plantel']?.nominal || '';
    } else {
        document.getElementById('inp-codigo-plantel').value = codigoDEA;
        const hiddenInp = document.getElementById('inp-nombre-plantel');
        if (hiddenInp) hiddenInp.value = "Plantel no encontrado";
        document.getElementById('inp-nombre-nominal').value = "Plantel no encontrado";
    }

    // Lógica dinámica de visibilidad basada en planes_estudio y modalidad Especial
    const planes = dp ? (dp["planes-estudio"] || {}) : {};
    const tienePlanes = Object.keys(planes).length > 0;
    const modPlantel = (dp ? (dp.modalidad || '') : '').toUpperCase();
    const esEspecial = modPlantel.includes('ESPECIAL');
    const esAdulto = modPlantel.includes('ADULTO');
    
    const contMatricula = document.getElementById('contenedor-matricula');
    const msgSinPlanes = document.getElementById('mensaje-sin-planes');
    const contAcciones = document.getElementById('contenedor-acciones-matricula');
    const contSecDetalle = document.getElementById('cont-secciones-detalle');

    // Ocultar todos los bloques educativos inicialmente
    ['bloque-inicial', 'bloque-primaria', 'bloque-mediageneral', 'bloque-mediatecnica', 'bloque-especial', 'bloque-adulto'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    if (esEspecial || esAdulto) {
        // REGLA: Plantel con Modalidad Especial o Adulto (opera por grupos sin plan formal)
        if (contMatricula) contMatricula.style.display = 'block';
        if (contAcciones) contAcciones.style.display = 'flex';
        if (msgSinPlanes) msgSinPlanes.style.display = 'none';
        if (contSecDetalle) contSecDetalle.style.display = 'none';

        if (esEspecial) {
            const bloqueEsp = document.getElementById('bloque-especial');
            if (bloqueEsp) bloqueEsp.style.display = 'block';
        }
        if (esAdulto) {
            const bloqueAdu = document.getElementById('bloque-adulto');
            if (bloqueAdu) bloqueAdu.style.display = 'block';
        }

        const contVacantes = document.getElementById('contenedor-pregunta-vacantes');
        if (contVacantes) contVacantes.style.display = 'none';
    } else if (!tienePlanes) {
        // REGLA: Si el plantel NO es Especial/Adulto y NO tiene plan de estudio asociado:
        if (contMatricula) contMatricula.style.display = 'none';
        if (contSecDetalle) contSecDetalle.style.display = 'none';
        if (contAcciones) contAcciones.style.display = 'none';
        
        // Mostrar exclusivamente el mensaje de orientación
        if (msgSinPlanes) msgSinPlanes.style.display = 'block';
    } else {
        // REGLA: Si el plantel SÍ tiene planes de estudio:
        if (contMatricula) contMatricula.style.display = 'block';
        if (contAcciones) contAcciones.style.display = 'flex';
        if (msgSinPlanes) msgSinPlanes.style.display = 'none';

        let mostrarInicial = "20000" in planes;
        let mostrarPrimaria = "21000" in planes;
        let mostrarMediaGen = false;
        let mostrarMediaTec = false;

        Object.keys(planes).forEach(cod => {
            if (cod.startsWith("3")) mostrarMediaGen = true;
            if (cod.startsWith("4")) mostrarMediaTec = true;
        });

        if (mostrarInicial) document.getElementById('bloque-inicial').style.display = 'block';
        if (mostrarPrimaria) document.getElementById('bloque-primaria').style.display = 'block';
        if (mostrarMediaGen) document.getElementById('bloque-mediageneral').style.display = 'block';
        if (mostrarMediaTec) document.getElementById('bloque-mediatecnica').style.display = 'block';

        // Carga de Secciones Dinámicas para Media (Pasando los guardados)
        const savedSeccionesPlanes = dataParcial ? (dataParcial["secciones-planes"] || {}) : {};
        _renderizarDetalleSecciones(planes, savedSeccionesPlanes);
        const savedMatricula = dataParcial ? dataParcial.matricula : null;
        _renderizarMatriculaMedia(planes, savedMatricula);
            
        const tieneBasica = ("20000" in planes) || ("21000" in planes);
        const contVacantes = document.getElementById('contenedor-pregunta-vacantes');
        if (contVacantes) {
            contVacantes.style.display = tieneBasica ? 'flex' : 'none';
        }
    }
        
        /* button always enabled initially */
        

    // Cargar datos previos de Modalidad Especial si existen
    const espExistente = dataParcial?.matricula?.modalidades?.especial || dp?.matricula?.modalidades?.especial;
    if (esEspecial && espExistente) {
        const gruposObj = espExistente.grupos || {};
        const letras = Object.keys(gruposObj).filter(k => k.length === 1).sort();
        const numGrupos = letras.length || parseInt(dataParcial?.["secciones-planes"]?.especial || dp?.["secciones-planes"]?.especial || 0);
        if (numGrupos > 0) {
            if (document.getElementById('secEsp')) document.getElementById('secEsp').value = numGrupos;
            _renderCajasEspecial(numGrupos);
            letras.forEach(letra => {
                const f = document.querySelector('.mat-input.mat-especial[data-grupo="especial-' + letra + '"][data-sexo="F"]');
                const m = document.querySelector('.mat-input.mat-especial[data-grupo="especial-' + letra + '"][data-sexo="M"]');
                if (f) f.value = gruposObj[letra].fem || 0;
                if (m) m.value = gruposObj[letra].mas || 0;
            });
        }
    }

    // Cargar datos previos de Modalidad Adulto si existen
    const aduExistente = dataParcial?.matricula?.modalidades?.adulto || dp?.matricula?.modalidades?.adulto;
    if (esAdulto && aduExistente) {
        const gruposObj = aduExistente.grupos || {};
        const letras = Object.keys(gruposObj).filter(k => k.length === 1).sort();
        const numGrupos = letras.length || parseInt(dataParcial?.["secciones-planes"]?.adulto || dp?.["secciones-planes"]?.adulto || 0);
        if (numGrupos > 0) {
            if (document.getElementById('secAdu')) document.getElementById('secAdu').value = numGrupos;
            _renderCajasAdulto(numGrupos);
            letras.forEach(letra => {
                const f = document.querySelector('.mat-input.mat-adulto[data-grupo="adulto-' + letra + '"][data-sexo="F"]');
                const m = document.querySelector('.mat-input.mat-adulto[data-grupo="adulto-' + letra + '"][data-sexo="M"]');
                if (f) f.value = gruposObj[letra].fem || 0;
                if (m) m.value = gruposObj[letra].mas || 0;
            });
        }
    }

    if (dataParcial && dataParcial.matricula && typeof dataParcial.matricula === 'object' && Object.keys(dataParcial.matricula).length > 0) {
        const mat = dataParcial.matricula;
        const b20 = mat.basica ? (mat.basica["20000"] || {}) : {};
        const b21 = mat.basica ? (mat.basica["21000"] || {}) : {};
        
        // --- 1. MATERNAL ---
        if (b20.materna) {
            const numMat = Object.keys(b20.materna).filter(k => k.length === 1).length;
            if (document.getElementById('secMat')) document.getElementById('secMat').value = numMat;
            _renderCajasInicial('maternal', numMat);
            Object.keys(b20.materna).forEach(letra => {
                const f = document.querySelector('.mat-input.mat-maternal[data-grupo="maternal-' + letra + '"][data-sexo="F"]');
                const m = document.querySelector('.mat-input.mat-maternal[data-grupo="maternal-' + letra + '"][data-sexo="M"]');
                if (f) f.value = b20.materna[letra].fem || 0;
                if (m) m.value = b20.materna[letra].mas || 0;
            });
        }
        
        // --- 2. PREESCOLAR ---
        if (b20.preescolar) {
            const numPre = Object.keys(b20.preescolar).filter(k => k.length === 1).length;
            if (document.getElementById('secPre')) document.getElementById('secPre').value = numPre;
            _renderCajasInicial('preescolar', numPre);
            Object.keys(b20.preescolar).forEach(letra => {
                const f = document.querySelector('.mat-input.mat-preescolar[data-grupo="preescolar-' + letra + '"][data-sexo="F"]');
                const m = document.querySelector('.mat-input.mat-preescolar[data-grupo="preescolar-' + letra + '"][data-sexo="M"]');
                if (f) f.value = b20.preescolar[letra].fem || 0;
                if (m) m.value = b20.preescolar[letra].mas || 0;
            });
        }

        // --- 3. PRIMARIA ---
        if (Object.keys(b21).length > 0) {
            let totalPri = 0;
            for (let g = 1; g <= 6; g++) {
                if (b21[String(g)]) totalPri += Object.keys(b21[String(g)]).filter(k => k.length === 1).length;
            }
            if (document.getElementById('secPri')) document.getElementById('secPri').value = totalPri;
            _renderCajasPrimaria(totalPri);
            for (let g = 1; g <= 6; g++) {
                if (!b21[String(g)]) continue;
                Object.keys(b21[String(g)]).forEach(letra => {
                    const ident = 'primaria-' + g + letra;
                    const f = document.querySelector('.mat-input.mat-primaria[data-grupo="' + ident + '"][data-sexo="F"]');
                    const m = document.querySelector('.mat-input.mat-primaria[data-grupo="' + ident + '"][data-sexo="M"]');
                    if (f) f.value = b21[String(g)][letra].fem || 0;
                    if (m) m.value = b21[String(g)][letra].mas || 0;
                });
            }
        }
        
        // --- 4. MEDIA GENERAL Y TECNICA ---
          // Now handled by _renderizarMatriculaMedia
    } else if (dataParcial && dataParcial.matricula_detalle) {
        // Fallback legado si el plantel aún no tiene el JSON dinámico v2
        const md = dataParcial.matricula_detalle;
        ['secMat', 'secPre',
         'secPri', 'mgFem', 'mgMas', 'secMg', 'mtFem', 'mtMas', 'secMt'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = md[id] || 0;
        });
    }
    
    // Restaurar vacantes
    if (dataParcial && dataParcial.vacantes !== undefined && Object.keys(dataParcial.vacantes).length > 0) {
        window._VACANTES_TEMP = dataParcial.vacantes;
        const keys = Object.keys(window._VACANTES_TEMP);
        // Si hay vacantes con datos, marcamos el toggle visualmente
        if (keys.length > 0 && keys.some(k => Object.keys(window._VACANTES_TEMP[k]).length > 0)) {
            const btnSi = document.querySelector('#toggle-vacantes button[data-val="SI"]');
            if (btnSi) btnSi.click();
        } else {
            const btnNo = document.querySelector('#toggle-vacantes button[data-val="NO"]');
            if (btnNo) btnNo.click();
        }
    }
    
    // Forzar recálculo
    document.getElementById('contenedor-matricula')?.dispatchEvent(new Event('input', { bubbles: true }));

    // Mostrar Formulario Personal si el plantel YA tiene matrícula o secciones cargadas (Carga inicial)
    let hasData = false;
    const checkObjHasNumbers = (obj) => {
        if (!obj || typeof obj !== 'object') return false;
        for (let key in obj) {
            if (typeof obj[key] === 'number' && obj[key] > 0) return true;
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                if (checkObjHasNumbers(obj[key])) return true;
            }
        }
        return false;
    };

    if (dataParcial) {
        if (dataParcial.datos_completados) hasData = true;
        if (dataParcial.matricula?.modalidades?.especial && checkObjHasNumbers(dataParcial.matricula.modalidades.especial)) hasData = true;
        if (dataParcial.matricula && (checkObjHasNumbers(dataParcial.matricula) || (dataParcial.matricula['total-gen'] > 0))) hasData = true;
        if (dataParcial['matricula-total'] && parseInt(dataParcial['matricula-total']) > 0) hasData = true;
        if (dataParcial['secciones-planes'] && checkObjHasNumbers(dataParcial['secciones-planes'])) hasData = true;
        if (dataParcial.secciones && parseInt(dataParcial.secciones) > 0) hasData = true;
        if (dataParcial.matricula_detalle) hasData = true;
    }

    if (!hasData && dp) {
        if (dp.matricula && (checkObjHasNumbers(dp.matricula) || (dp.matricula['total-gen'] > 0))) hasData = true;
        if (dp['matricula-total'] && parseInt(dp['matricula-total']) > 0) hasData = true;
        if (dp['secciones-planes'] && checkObjHasNumbers(dp['secciones-planes'])) hasData = true;
    }

    const currentInpTotal = parseInt(document.getElementById('inp-matricula-total')?.value || 0);
    if (currentInpTotal > 0) hasData = true;

    console.log("🏫 [SGH] ¿Plantel posee matrícula/secciones previas?:", hasData);
    if (window._modoSupervision) {
        const secPersonal = document.getElementById('seccion-personal-existente');
        if (secPersonal) secPersonal.style.display = 'block';
        if (typeof window.cargarPersonalExistente === "function") {
            window.cargarPersonalExistente(codigoDEA);
        }
    } else if (tienePlanes && hasData && typeof window.mostrarFormularioPersonal === "function") {
        window.mostrarFormularioPersonal(false);
    } else if (!tienePlanes) {
        const secReg = document.getElementById('seccion-registro-personal');
        if (secReg) secReg.style.display = 'none';
        const secPersonal = document.getElementById('seccion-personal-existente');
        if (secPersonal) secPersonal.style.display = 'none';
    }

    // Guardar los datos cuando el director llene el form
    const form = document.getElementById('plantel-form');
    if (form) {
      form.onsubmit = async (e) => {
          e.preventDefault();
          if (window._modoSupervision) {
              if (window.showAlert) window.showAlert("Modo Supervisión", "Está en modo de supervisión (solo lectura). No se pueden guardar cambios.", "info");
              return;
          }
          const btn = form.querySelector('button[type="submit"]');
          if (!btn) return;
          btn.textContent = "Guardando...";
          btn.disabled = true;

          // ── HELPERS ───────────────────────────────────────────────────────
          /** Verifica si el input está dentro de un bloque visible del DOM */
          const isVisible = (el) => {
              const b1 = el.closest('div[id^="bloque-"]');
              const b2 = el.closest('#cont-secciones-detalle');
              return (b1 && b1.style.display !== 'none') || (b2 && b2.style.display !== 'none');
          };

          // ── GUARD: Datos Incompletos ──────────────────────────────────────
          let matTotal = 0;
          document.querySelectorAll('.mat-input, .dyn-mg-fem, .dyn-mg-mas, .dyn-mt-fem, .dyn-mt-mas').forEach(inp => {
              if (isVisible(inp)) {
                  matTotal += parseInt(inp.value || 0);
              }
          });
          if (document.getElementById('lbl-matricula-total')) document.getElementById('lbl-matricula-total').textContent = matTotal;
          if (document.getElementById('inp-matricula-total')) document.getElementById('inp-matricula-total').value = matTotal;

          let secTotal = 0;
          secTotal += parseInt(document.getElementById('secMat')?.value) || 0;
          secTotal += parseInt(document.getElementById('secPre')?.value) || 0;
          secTotal += parseInt(document.getElementById('secPri')?.value) || 0;
           secTotal += parseInt(document.getElementById('secEsp')?.value) || 0;
          document.querySelectorAll('.sec-anio-input').forEach(inp => {
              if (isVisible(inp)) {
                  secTotal += parseInt(inp.value || 0);
              }
          });

          if (matTotal === 0 && secTotal === 0 && !window._forceSaveIncompleta) {
              const modalInc = document.getElementById('modal-confirm-incompleta');
              if (modalInc) modalInc.style.display = 'flex';
              btn.textContent = "Guardar Datos y Continuar";
              btn.disabled = false;
              return;
          }
          window._forceSaveIncompleta = false;

          /** Escoba Digital: elimina claves con valor 0 u objetos vacíos */
          const sweepZeros = (obj) => {
              Object.keys(obj).forEach(key => {
                  // Lista blanca de propiedades globales que NO deben ser eliminadas aunque estén en 0 o vacías
                  const whitelist = []; // Zero-Cost Optimization
                  if (whitelist.includes(key)) return;

                  if (obj[key] === 0) {
                      delete obj[key];
                  } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                      sweepZeros(obj[key]);
                      // No eliminar el objeto si es una de las llaves principales obligatorias
                      const reqKeys = []; // Zero-Cost Optimization
                      if (Object.keys(obj[key]).length === 0 && !reqKeys.includes(key)) {
                          delete obj[key];
                      }
                  }
              });
          };

          // ── SECCIONES-PLANES ──────────────────────────────────────────────
          const seccionesPlanes = {};

          // 20000/maternal: se cuenta 1 box-F por sección
          if (document.getElementById('bloque-inicial')?.style.display !== 'none') {
              document.querySelectorAll('.mat-input.mat-maternal[data-sexo="F"]').forEach(inp => {
                  if (!isVisible(inp)) return;
                  const secLetra = inp.dataset.grupo.split('-')[1];
                  if (!seccionesPlanes['20000']) seccionesPlanes['20000'] = {};
                  if (!seccionesPlanes['20000'].maternal) seccionesPlanes['20000'].maternal = {};
                  seccionesPlanes['20000'].maternal[secLetra] = 1;
              });

              // 20000/preescolar
              document.querySelectorAll('.mat-input.mat-preescolar[data-sexo="F"]').forEach(inp => {
                  if (!isVisible(inp)) return;
                  const secLetra = inp.dataset.grupo.split('-')[1];
                  if (!seccionesPlanes['20000']) seccionesPlanes['20000'] = {};
                  if (!seccionesPlanes['20000'].preescolar) seccionesPlanes['20000'].preescolar = {};
                  seccionesPlanes['20000'].preescolar[secLetra] = 1;
              });
          }

          // 21000/primaria: valor = cantidad de grados que tienen esa letra
          if (document.getElementById('bloque-primaria')?.style.display !== 'none') {
              document.querySelectorAll('.mat-input.mat-primaria[data-sexo="F"]').forEach(inp => {
                  if (!isVisible(inp)) return;
                  if (!inp.dataset.grupo) return;
                  const match = inp.dataset.grupo.match(/primaria-(\d)([A-Z])/);
                  if (!match) return;
                  const secLetra = match[2];
                  if (!seccionesPlanes['21000']) seccionesPlanes['21000'] = {};
                  seccionesPlanes['21000'][secLetra] = (seccionesPlanes['21000'][secLetra] || 0) + 1;
              });
          }

          // Media: secciones por año de cada plan
          document.querySelectorAll('.sec-anio-input').forEach(inp => {
              if (!isVisible(inp)) return;
              const plan = inp.dataset.plan;
              const anio = inp.dataset.anio;
              const val = parseInt(inp.value) || 0;
              if (val > 0) {
                  if (!seccionesPlanes[plan]) seccionesPlanes[plan] = {};
                  seccionesPlanes[plan][anio] = val;
              }
          });

          // ── MATRÍCULA ─────────────────────────────────────────────────────
          const matricula = {
              basica: {},
              media: {},
              modalidades: {
                  adulto: {},
                  especial: {}
              },
              'total-gen-fem': 0,
              'total-gen-mas': 0,
              'total-gen': 0,
              'total-vac-gen-fem': 0,
              'total-vac-gen-mas': 0,
              'total-vac-gen': 0
          };

          // ── 1. MATERNAL ───────────────────────────────────────────────────
          if (seccionesPlanes['20000']?.maternal) {
              const materna = {};
              let tMatMas = 0, tMatFem = 0;

              document.querySelectorAll('.mat-input.mat-maternal').forEach(inp => {
                  if (!isVisible(inp)) return;
                  const secLetra = inp.dataset.grupo.split('-')[1];
                  const val = parseInt(inp.value) || 0;
                  if (!materna[secLetra]) materna[secLetra] = { mas: 0, fem: 0 };
                  if (inp.dataset.sexo === 'F') {
                      materna[secLetra].fem += val;
                      tMatFem += val;
                  } else {
                      materna[secLetra].mas += val;
                      tMatMas += val;
                  }
              });

              // Totales dentro de materna
              materna['total-mat-mas'] = tMatMas;
              materna['total-mat-fem'] = tMatFem;
              materna['total-mat']     = tMatMas + tMatFem;

              // Vacantes maternal
              const vacMat = window._VACANTES_TEMP?.maternal || {};
              const vMatObj = {};
              let vMatMas = 0, vMatFem = 0;
              Object.keys(materna).forEach(secLetra => {
                  if (secLetra.length !== 1) return;
                  if (vacMat[secLetra] === 1) {
                      vMatObj[secLetra] = { mas: materna[secLetra].mas, fem: materna[secLetra].fem };
                      vMatMas += materna[secLetra].mas;
                      vMatFem += materna[secLetra].fem;
                  }
              });
              if (Object.keys(vMatObj).length > 0) {
                  materna.vacantes              = vMatObj;
                  materna['total-vac-mat-mas']  = vMatMas;
                  materna['total-vac-mat-fem']  = vMatFem;
                  materna['total-vac-mat']      = vMatMas + vMatFem;
              }

              if (!matricula.basica['20000']) matricula.basica['20000'] = { 'total-20000': 0 };
              matricula.basica['20000'].materna = materna;
              matricula.basica['20000']['total-20000'] += (tMatMas + tMatFem);
          }

          // ── 2. PREESCOLAR ─────────────────────────────────────────────────
          if (seccionesPlanes['20000']?.preescolar) {
              const preescolar = {};
              let tPreMas = 0, tPreFem = 0;

              document.querySelectorAll('.mat-input.mat-preescolar').forEach(inp => {
                  if (!isVisible(inp)) return;
                  const secLetra = inp.dataset.grupo.split('-')[1];
                  const val = parseInt(inp.value) || 0;
                  if (!preescolar[secLetra]) preescolar[secLetra] = { mas: 0, fem: 0 };
                  if (inp.dataset.sexo === 'F') {
                      preescolar[secLetra].fem += val;
                      tPreFem += val;
                  } else {
                      preescolar[secLetra].mas += val;
                      tPreMas += val;
                  }
              });

              preescolar['total-pre-mas'] = tPreMas;
              preescolar['total-pre-fem'] = tPreFem;
              preescolar['total-pre']     = tPreMas + tPreFem;

              // Vacantes preescolar
              const vacPre = window._VACANTES_TEMP?.preescolar || {};
              const vPreObj = {};
              let vPreMas = 0, vPreFem = 0;
              Object.keys(preescolar).forEach(secLetra => {
                  if (secLetra.length !== 1) return;
                  if (vacPre[secLetra] === 1) {
                      vPreObj[secLetra] = { mas: preescolar[secLetra].mas, fem: preescolar[secLetra].fem };
                      vPreMas += preescolar[secLetra].mas;
                      vPreFem += preescolar[secLetra].fem;
                  }
              });
              if (Object.keys(vPreObj).length > 0) {
                  preescolar.vacantes              = vPreObj;
                  preescolar['total-vac-pre-mas']  = vPreMas;
                  preescolar['total-vac-pre-fem']  = vPreFem;
                  preescolar['total-vac-pre']      = vPreMas + vPreFem;
              }

              if (!matricula.basica['20000']) matricula.basica['20000'] = { 'total-20000': 0 };
              matricula.basica['20000'].preescolar = preescolar;
              matricula.basica['20000']['total-20000'] += (tPreMas + tPreFem);
          }

          // ── 3. PRIMARIA ───────────────────────────────────────────────────
          if (seccionesPlanes['21000']) {
              matricula.basica['21000'] = {
                  'total-21000-mas':     0,
                  'total-21000-fem':     0,
                  'total-21000':         0,
                  'total-vac-21000-mas': 0,
                  'total-vac-21000-fem': 0,
                  'total-vac-21000':     0
              };
              // Inicializar los 6 grados
              for (let g = 1; g <= 6; g++) matricula.basica['21000'][String(g)] = {};

              // Leer inputs
              document.querySelectorAll('.mat-input.mat-primaria').forEach(inp => {
                  if (!isVisible(inp)) return;
                  if (!inp.dataset.grupo) return;
                  const match = inp.dataset.grupo.match(/primaria-(\d)([A-Z])/);
                  if (!match) return;
                  const grado = match[1];
                  const secLetra = match[2];
                  const val = parseInt(inp.value) || 0;
                  if (!val) return;

                  const g = matricula.basica['21000'][grado];
                  if (!g[secLetra]) g[secLetra] = { mas: 0, fem: 0 };
                  if (inp.dataset.sexo === 'F') {
                      g[secLetra].fem += val;
                      matricula.basica['21000']['total-21000-fem'] += val;
                  } else {
                      g[secLetra].mas += val;
                      matricula.basica['21000']['total-21000-mas'] += val;
                  }
                  matricula.basica['21000']['total-21000'] += val;
              });

              // Vacantes primaria (key: gradoStr+secLetra, ej: "1A")
              const vacPri = window._VACANTES_TEMP?.primaria || {};
              for (let g = 1; g <= 6; g++) {
                  const gradoStr = String(g);
                  const gObj = matricula.basica['21000'][gradoStr];
                  if (!gObj || Object.keys(gObj).length === 0) continue;

                  const vGrado = {};
                  let vGMas = 0, vGFem = 0;
                  Object.keys(gObj).forEach(secLetra => {
                      if (secLetra.length !== 1) return;
                      if (vacPri[gradoStr + secLetra] === 1) {
                          vGrado[secLetra] = { mas: gObj[secLetra].mas, fem: gObj[secLetra].fem };
                          vGMas += gObj[secLetra].mas;
                          vGFem += gObj[secLetra].fem;
                      }
                  });
                  if (Object.keys(vGrado).length > 0) {
                      gObj.vacantes = vGrado;
                      matricula.basica['21000']['total-vac-21000-mas'] += vGMas;
                      matricula.basica['21000']['total-vac-21000-fem'] += vGFem;
                      matricula.basica['21000']['total-vac-21000']     += (vGMas + vGFem);
                  }
              }
          }

          // ── 4. MEDIA GENERAL ──────────────────────────────────────────────
          if (document.getElementById('bloque-mediageneral')?.style.display !== 'none') {
              const mediaGen = { 'total-med-fem': 0, 'total-med-mas': 0, 'total-med-gen': 0 };

              document.querySelectorAll('.dyn-mg-fem').forEach(inp => {
                  if (!isVisible(inp)) return;
                  const plan = inp.dataset.plan;
                  const fVal = parseInt(inp.value) || 0;
                  const mInp = document.querySelector(`.dyn-mg-mas[data-plan="${plan}"]`);
                  const mVal = mInp ? (parseInt(mInp.value) || 0) : 0;
                  if (!fVal && !mVal) return;

                  if (!mediaGen[plan]) mediaGen[plan] = { fem: 0, mas: 0, total: 0 };
                  mediaGen[plan].fem   += fVal;
                  mediaGen[plan].mas   += mVal;
                  mediaGen[plan].total += (fVal + mVal);

                  mediaGen[`total-med-${plan}-fem`] = (mediaGen[`total-med-${plan}-fem`] || 0) + fVal;
                  mediaGen[`total-med-${plan}-mas`] = (mediaGen[`total-med-${plan}-mas`] || 0) + mVal;
                  mediaGen[`total-med-${plan}`]     = (mediaGen[`total-med-${plan}`]     || 0) + (fVal + mVal);

                  mediaGen['total-med-fem'] += fVal;
                  mediaGen['total-med-mas'] += mVal;
                  mediaGen['total-med-gen'] += (fVal + mVal);
              });

              matricula.media['media-general'] = mediaGen;
          }

          // ── 5. MEDIA TÉCNICA ──────────────────────────────────────────────
          if (document.getElementById('bloque-mediatecnica')?.style.display !== 'none') {
              const mediaTec = { 'total-med-fem': 0, 'total-med-mas': 0, 'total-med-tec': 0 };

              document.querySelectorAll('.dyn-mt-fem').forEach(inp => {
                  if (!isVisible(inp)) return;
                  const plan = inp.dataset.plan;
                  const fVal = parseInt(inp.value) || 0;
                  const mInp = document.querySelector(`.dyn-mt-mas[data-plan="${plan}"]`);
                  const mVal = mInp ? (parseInt(mInp.value) || 0) : 0;
                  if (!fVal && !mVal) return;

                  if (!mediaTec[plan]) mediaTec[plan] = { fem: 0, mas: 0, total: 0 };
                  mediaTec[plan].fem   += fVal;
                  mediaTec[plan].mas   += mVal;
                  mediaTec[plan].total += (fVal + mVal);

                  mediaTec[`total-med-${plan}-fem`] = (mediaTec[`total-med-${plan}-fem`] || 0) + fVal;
                  mediaTec[`total-med-${plan}-mas`] = (mediaTec[`total-med-${plan}-mas`] || 0) + mVal;
                  mediaTec[`total-med-${plan}`]     = (mediaTec[`total-med-${plan}`]     || 0) + (fVal + mVal);

                  mediaTec['total-med-fem'] += fVal;
                  mediaTec['total-med-mas'] += mVal;
                  mediaTec['total-med-tec'] += (fVal + mVal);
              });

              matricula.media['media-tecnica'] = mediaTec;
          }

          // ── 6. MODALIDAD ESPECIAL (GRUPOS) ────────────────────────────────
          if (document.getElementById('bloque-especial')?.style.display !== 'none') {
              const espGrupos = {};
              let tEspMas = 0, tEspFem = 0;

              document.querySelectorAll('.mat-input.mat-especial').forEach(inp => {
                  if (!isVisible(inp)) return;
                  const secLetra = inp.dataset.grupo.split('-')[1];
                  const val = parseInt(inp.value) || 0;
                  if (!espGrupos[secLetra]) espGrupos[secLetra] = { mas: 0, fem: 0 };
                  if (inp.dataset.sexo === 'F') {
                      espGrupos[secLetra].fem += val;
                      tEspFem += val;
                  } else {
                      espGrupos[secLetra].mas += val;
                      tEspMas += val;
                  }
              });

              const numGrupos = parseInt(document.getElementById('secEsp')?.value) || 0;
              if (numGrupos > 0) {
                  seccionesPlanes['especial'] = numGrupos;
              }

              if (Object.keys(espGrupos).length > 0 || numGrupos > 0) {
                  matricula.modalidades.especial = {
                      grupos: espGrupos,
                      'total-especial-mas': tEspMas,
                      'total-especial-fem': tEspFem,
                      'total-especial': tEspMas + tEspFem
                  };
                  matricula['total-gen-fem'] += tEspFem;
                  matricula['total-gen-mas'] += tEspMas;
                  matricula['total-gen']     += (tEspMas + tEspFem);
              }
          }

          // ── 7. MODALIDAD ADULTO (GRUPOS) ──────────────────────────────────
          if (document.getElementById('bloque-adulto')?.style.display !== 'none') {
              const aduGrupos = {};
              let tAduMas = 0, tAduFem = 0;

              document.querySelectorAll('.mat-input.mat-adulto').forEach(inp => {
                  if (!isVisible(inp)) return;
                  const secLetra = inp.dataset.grupo.split('-')[1];
                  const val = parseInt(inp.value) || 0;
                  if (!aduGrupos[secLetra]) aduGrupos[secLetra] = { mas: 0, fem: 0 };
                  if (inp.dataset.sexo === 'F') {
                      aduGrupos[secLetra].fem += val;
                      tAduFem += val;
                  } else {
                      aduGrupos[secLetra].mas += val;
                      tAduMas += val;
                  }
              });

              const numGrupos = parseInt(document.getElementById('secAdu')?.value) || 0;
              if (numGrupos > 0) {
                  seccionesPlanes['adulto'] = numGrupos;
              }

              if (Object.keys(aduGrupos).length > 0 || numGrupos > 0) {
                  matricula.modalidades.adulto = {
                      grupos: aduGrupos,
                      'total-adulto-mas': tAduMas,
                      'total-adulto-fem': tAduFem,
                      'total-adulto': tAduMas + tAduFem
                  };
                  matricula['total-gen-fem'] += tAduFem;
                  matricula['total-gen-mas'] += tAduMas;
                  matricula['total-gen']     += (tAduMas + tAduFem);
              }
          }

          // ── 6. TOTAL GENERAL MEDIA ────────────────────────────────────────
          if (matricula.media['media-general'] || matricula.media['media-tecnica']) {
              const mgF = matricula.media['media-general']?.['total-med-fem'] || 0;
              const mgM = matricula.media['media-general']?.['total-med-mas'] || 0;
              const mtF = matricula.media['media-tecnica']?.['total-med-fem'] || 0;
              const mtM = matricula.media['media-tecnica']?.['total-med-mas'] || 0;
              matricula.media['total-gen-med'] = {
                  fem:   mgF + mtF,
                  mas:   mgM + mtM,
                  total: mgF + mtF + mgM + mtM
              };
          }

          // ── SUMA GLOBAL DE MATRÍCULA (Básica + Media) ─────────────────────
          let sumFem = 0, sumMas = 0, sumVacFem = 0, sumVacMas = 0;
          if (matricula.basica['20000']) {
              sumFem += (matricula.basica['20000'].maternal?.['total-mat-fem'] || 0) + (matricula.basica['20000'].preescolar?.['total-pre-fem'] || 0);
              sumMas += (matricula.basica['20000'].maternal?.['total-mat-mas'] || 0) + (matricula.basica['20000'].preescolar?.['total-pre-mas'] || 0);
              sumVacFem += (matricula.basica['20000'].maternal?.['total-vac-mat-fem'] || 0) + (matricula.basica['20000'].preescolar?.['total-vac-pre-fem'] || 0);
              sumVacMas += (matricula.basica['20000'].maternal?.['total-vac-mat-mas'] || 0) + (matricula.basica['20000'].preescolar?.['total-vac-pre-mas'] || 0);
          }
          if (matricula.basica['21000']) {
              sumFem += matricula.basica['21000']['total-21000-fem'] || 0;
              sumMas += matricula.basica['21000']['total-21000-mas'] || 0;
              sumVacFem += matricula.basica['21000']['total-vac-21000-fem'] || 0;
              sumVacMas += matricula.basica['21000']['total-vac-21000-mas'] || 0;
          }
          if (matricula.media['total-gen-med']) {
              sumFem += matricula.media['total-gen-med'].fem || 0;
              sumMas += matricula.media['total-gen-med'].mas || 0;
          }
          if (matricula.modalidades?.especial?.['total-especial']) {
              sumFem += (matricula.modalidades.especial['total-especial-fem'] || 0);
              sumMas += (matricula.modalidades.especial['total-especial-mas'] || 0);
          }
          if (matricula.modalidades?.adulto?.['total-adulto']) {
              sumFem += (matricula.modalidades.adulto['total-adulto-fem'] || 0);
              sumMas += (matricula.modalidades.adulto['total-adulto-mas'] || 0);
          }
          
          matricula['total-gen-fem'] = sumFem;
          matricula['total-gen-mas'] = sumMas;
          matricula['total-gen'] = sumFem + sumMas;
          matricula['total-vac-gen-fem'] = sumVacFem;
          matricula['total-vac-gen-mas'] = sumVacMas;
          matricula['total-vac-gen'] = sumVacFem + sumVacMas;

          // ── 7. ESCOBA DIGITAL + GUARDAR ───────────────────────────────────
          try {
              sweepZeros(matricula);
              sweepZeros(seccionesPlanes);

              const docRef = doc(db, "planteles", codigoDEA);
              const payload = {
                  secciones:  deleteField(),
                  "secciones-planes": seccionesPlanes,
                  matricula:  matricula,
                  "matricula-total": sumFem + sumMas,
                  vacantes:   deleteField(),
                  datos_completados: true,
                  ultima_actualizacion: new Date().toISOString()
              };

              await safeSetDoc(docRef, payload, {
                  mergeFields: ['secciones', 'secciones-planes', 'matricula', 'matricula-total', 'vacantes', 'datos_completados', 'ultima_actualizacion']
              });



              showToast("¡Datos del plantel actualizados con éxito!", "success");

              // Desplegar Formulario de Personal y Tabla de Personal automáticamente al guardar
              if (typeof window.mostrarFormularioPersonal === "function") {
                   window.mostrarFormularioPersonal(true);
              }

          } catch (error) {
              console.error("Error guardando el plantel:", error);
              showToast("Ocurrió un error al guardar los datos.", "error");
          } finally {
              if (btn) {
                  btn.textContent = "Guardar Datos y Continuar";
                  btn.disabled = false;
              }
          }
      };
    }
}

// --- Cerrar Sesión ---
document.getElementById('btn-logout')?.addEventListener('click', async () => {
    await signOut(auth);
});
document.getElementById('btn-logout-lock')?.addEventListener('click', async () => {
    await signOut(auth);
});
document.getElementById('btn-logout-munic')?.addEventListener('click', async () => {
    await signOut(auth);
});
document.getElementById('btn-logout-admin')?.addEventListener('click', async () => {
    await signOut(auth);
});

// --- HAMBURGER MENU LOGIC (GLOBAL) ---
const btnHamburger = document.getElementById('btn-hamburger');
const sidebar = document.getElementById('admin-sidebar');
const overlay = document.getElementById('admin-sidebar-overlay');
const mainContent = document.getElementById('admin-main');

window.closeSidebar = function() {
   if(!sidebar) return;
   sidebar.style.transform = 'translateX(-100%)';
   if(overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.style.display = 'none', 300);
   }
   if(mainContent) {
      mainContent.style.opacity = '1';
      mainContent.style.pointerEvents = 'auto';
   }
};

if (btnHamburger) {
   btnHamburger.addEventListener('click', () => {
      if(!sidebar) return;
      const isClosed = sidebar.style.transform === 'translateX(-100%)' || sidebar.style.transform === '';
      if (isClosed) {
         sidebar.style.transform = 'translateX(0)';
         if(overlay) {
            overlay.style.display = 'block';
            setTimeout(() => overlay.style.opacity = '1', 10);
         }
         if(mainContent) {
            mainContent.style.opacity = '0.5';
            mainContent.style.pointerEvents = 'none';
         }
      } else {
         window.closeSidebar();
      }
   });
}

if (overlay) overlay.addEventListener('click', window.closeSidebar);


// --- Modal Declaración Incompleta ---
document.getElementById('btn-cancelar-incompleta')?.addEventListener('click', () => {
    document.getElementById('modal-confirm-incompleta').style.display = 'none';
});
document.getElementById('btn-aceptar-incompleta')?.addEventListener('click', () => {
    document.getElementById('modal-confirm-incompleta').style.display = 'none';
    window._forceSaveIncompleta = true;
    
    const form = document.getElementById('plantel-form');
    if (form) {
        // Create and dispatch a submit event
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
});

// =========================================================================
// MÓDULO DE SUPERVISIÓN INSTITUCIONAL (OPCIÓN 1 - PANTALLA COMPLETA)
// =========================================================================
window.iniciarSupervisionPlantel = async function(codigoDEA, nombrePlantel) {
    if (!codigoDEA) return;
    try {
        if (window.showLoading) window.showLoading("Accediendo a supervisión del plantel...");
        window._modoSupervision = true;
        
        // Actualizar datos del banner de supervisión
        const titulo = document.getElementById('supervision-plantel-titulo');
        if (titulo) {
            titulo.textContent = `${nombrePlantel || codigoDEA} (${codigoDEA})`;
        }
        
        const banner = document.getElementById('banner-modo-supervision');
        if (banner) {
            banner.style.display = 'flex';
        }
        
        // Guardar DEA en el contexto global
        window.currentPlantelDEA = codigoDEA;
        
        // Cargar datos del plantel en la vista lock-screen
        await checkPlantelData(codigoDEA);
        
        // Asegurar que la tabla de personal esté visible y cargue el personal
        const secPersonal = document.getElementById('seccion-personal-existente');
        if (secPersonal) secPersonal.style.display = 'block';
        if (typeof window.cargarPersonalExistente === 'function') {
            await window.cargarPersonalExistente(codigoDEA);
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
        console.error("Error iniciando supervisión:", e);
        if (window.showAlert) window.showAlert("Error", "No se pudo cargar la vista del plantel: " + e.message, "error");
    } finally {
        if (window.hideLoading) window.hideLoading();
    }
};

window.salirSupervisionPlantel = function() {
    window._modoSupervision = false;
    
    // Ocultar banner
    const banner = document.getElementById('banner-modo-supervision');
    if (banner) banner.style.display = 'none';
    
    // Desuscribir listener de cambios en tiempo real si existía
    if (window._unsubPlantel) {
        window._unsubPlantel();
        window._unsubPlantel = null;
    }
    
    // Limpiar estilos de coacción / supervisión
    const styleTag = document.getElementById('style-coaccion');
    if (styleTag) styleTag.innerHTML = '';
    
    // Volver inmediatamente a la vista de administración
    showView('admin-view');
};

// Conectar botón de salida del banner
document.getElementById('btn-salir-supervision')?.addEventListener('click', () => {
    window.salirSupervisionPlantel();
});

// Conectar botón para volver a la ficha desde el banner
document.getElementById('btn-volver-a-ficha')?.addEventListener('click', () => {
    const dea = window.currentPlantelDEA;
    window.salirSupervisionPlantel();
    if (dea && typeof window.abrirFichaAuditoria === 'function') {
        window.abrirFichaAuditoria(dea);
    }
});



