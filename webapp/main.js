import './style.css';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { initAuth } from './auth.js';
import { initSeed } from './seed.js';

// TODO: Remplazar con la configuración de Firebase de SGH
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

// Iniciar script temporal de creación de usuarios
initSeed(db);

// Variables de estado
let dictionaryData = {};
let currentPlantel = null;

// Cargar el diccionario estático de Firebase Hosting o local
fetch('/bd_sgh.json')
  .then(res => res.json())
  .then(data => {
    dictionaryData = data;
    console.log("Diccionario SGH Cargado con éxito", Object.keys(data).length, "planteles");
  })
  .catch(err => console.error("Error cargando bd_sgh.json:", err));

// Referencias al DOM
const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const lockScreen = document.getElementById('lock-screen');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const userDisplayName = document.getElementById('user-display-name');
const btnLogout = document.getElementById('btn-logout');
const plantelForm = document.getElementById('plantel-form');

// --- Carga Inicial del Diccionario ---
async function loadDictionary() {
  try {
    const response = await fetch('/bd_sgh.json');
    dictionaryData = await response.json();
    console.log('Diccionario bd_sgh cargado exitosamente.');
  } catch (error) {
    console.error('Error cargando el diccionario bd_sgh.json', error);
  }
}

loadDictionary();

// --- Navegación ---
function showView(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(viewId).classList.add('active');
}

// Función para buscar un plantel en la estructura anidada de bd_sgh.json
function findPlantel(codigoDEA) {
    if (!dictionaryData || !dictionaryData.municipios) return null;
    for (const [municipio, munData] of Object.entries(dictionaryData.municipios)) {
        if (!munData.parroquias) continue;
        for (const [parroquia, parrData] of Object.entries(munData.parroquias)) {
            if (!parrData.planteles) continue;
            if (parrData.planteles[codigoDEA]) {
                const p = parrData.planteles[codigoDEA];
                p.municipio_nombre = municipio;
                p.parroquia_nombre = parroquia;
                return p;
            }
        }
    }
    return null;
}

// --- Lógica Central de Autenticación (Guardián) ---
initAuth(auth, db, {
  onLogout: () => {
    showView('login-view');
  },
  onWait: (mensaje) => {
    showView('espera-view');
    // Actualizar mensaje de espera
    const msjEl = document.querySelector('#espera-view p');
    if (msjEl) msjEl.textContent = mensaje;
  },
  onLogin: async (userData) => {
    const dp = findPlantel(userData.codigo);
    const nombrePlantel = dp ? dp.nombre_plantel : "Plantel Desconocido";
    userDisplayName.textContent = `${userData.codigo} - ${nombrePlantel}`;
    
    // Llamar al flujo de validación del plantel (Candado)
    await checkPlantelData(userData.codigo);
  },
  onMunic: (userData) => {
    // Configura la UI para el Municipal
    document.getElementById('munic-user-name').textContent = `MUNICIPAL: ${userData.municipio}`;
    showView('munic-view');
    import('./munic.js').then(m => m.initMunicDashboard(db, userData));
  },
  onAdmin: (userData) => {
    // Configura la UI para Admin
    showView('admin-view');
    import('./admin.js').then(m => m.initAdminDashboard(db, userData));
  }
});

// --- Generación de Tarjeta Digital (Canvas) ---
function generarTarjetaCanvas(datos) {
    const canvas = document.getElementById('tarjeta-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Fondo
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Encabezado (Color Institucional)
    ctx.fillStyle = '#2563eb'; // primary-color
    ctx.fillRect(0, 0, canvas.width, 60);
    
    // Texto Encabezado
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SGH - Tarjeta de Identidad Digital', canvas.width / 2, 38);
    
    // Contenido
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Nombre:', 30, 100);
    ctx.fillText('Cédula:', 30, 135);
    ctx.fillText('Rol/Código:', 30, 170);
    ctx.fillText('Teléfono:', 30, 205);
    
    ctx.font = 'normal 16px sans-serif';
    ctx.fillStyle = '#4b5563';
    ctx.fillText(datos.nombre.toUpperCase(), 120, 100);
    ctx.fillText('V-' + datos.cedula, 120, 135);
    ctx.fillText(datos.rol + ' - ' + datos.codigo, 120, 170);
    ctx.fillText(datos.telefono, 120, 205);
    
    // Borde
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
}

// Botón de Descarga de Tarjeta
document.getElementById('btn-descargar-tarjeta')?.addEventListener('click', () => {
    const canvas = document.getElementById('tarjeta-canvas');
    const enlace = document.createElement('a');
    enlace.download = 'Tarjeta_SGH.png';
    enlace.href = canvas.toDataURL('image/png');
    enlace.click();
});

// Botón de Cerrar Sesión (Sala Espera)
document.getElementById('btn-logout-espera')?.addEventListener('click', () => {
    showView('login-view');
});

// --- Lógica del Login ---
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const codigoDEA = document.getElementById('codigo-dea').value.trim().toUpperCase();
  const password = document.getElementById('password').value;
  const email = `${codigoDEA}@sgh.com`; // Dummy email para Firebase Auth

  try {
    loginError.style.display = 'none';
    const btn = loginForm.querySelector('button');
    btn.textContent = "Verificando...";
    btn.disabled = true;

    // Login real con Firebase Auth:
    await signInWithEmailAndPassword(auth, email, password);
    
    // Nota: El enrutamiento ahora lo maneja automáticamente auth.js 
    // al dispararse onAuthStateChanged.


  } catch (error) {
    loginError.textContent = "Credenciales inválidas.";
    loginError.style.display = 'block';
  } finally {
    const btn = loginForm.querySelector('button');
    btn.textContent = "Iniciar Sesión";
    btn.disabled = false;
  }
});

// --- Lógica del "Candado de Navegación" ---
// --- Lógica del "Candado de Navegación" ---
// Cálculo automático de totales
document.getElementById('contenedor-matricula')?.addEventListener('input', (e) => {
    if (e.target.tagName.toLowerCase() === 'input') {
        let matTotal = 0;
        let secTotal = 0;
        
        const sumInputs = (selector) => {
            let sum = 0;
            document.querySelectorAll(selector).forEach(inp => {
                if (inp.closest('div[id^="bloque-"]').style.display !== 'none') {
                    sum += parseInt(inp.value || 0);
                }
            });
            return sum;
        };

        // Subtotales
        const totIni = sumInputs('.mat-inicial');
        const totPri = sumInputs('.mat-primaria');
        
        if(document.getElementById('tot-inicial')) document.getElementById('tot-inicial').textContent = totIni;
        if(document.getElementById('tot-primaria')) document.getElementById('tot-primaria').textContent = totPri;

        // Sumar todos los inputs de matrícula
        document.querySelectorAll('.mat-input').forEach(input => {
            const b1 = input.closest('div[id^="bloque-"]');
            const b2 = input.closest('#cont-secciones-detalle');
            if ((b1 && b1.style.display !== 'none') || (b2 && b2.style.display !== 'none')) {
                matTotal += parseInt(input.value || 0);
            }
        });
        
        // Sumar todos los inputs de secciones
        document.querySelectorAll('.sec-input').forEach(input => {
            const b1 = input.closest('div[id^="bloque-"]');
            const b2 = input.closest('#cont-secciones-detalle');
            if ((b1 && b1.style.display !== 'none') || (b2 && b2.style.display !== 'none')) {
                secTotal += parseInt(input.value || 0);
            }
        });
        
        document.getElementById('lbl-matricula-total').textContent = matTotal;
        document.getElementById('lbl-secciones-total').textContent = secTotal;

        // Auto-habilitar botón Guardar para instituciones exclusivas de Media
        const vacantesToggle = document.getElementById('contenedor-pregunta-vacantes');
        if (vacantesToggle && vacantesToggle.style.display === 'none') {
            const btnGuardar = document.getElementById('btn-guardar-matricula');
            if (matTotal > 0 && secTotal > 0 && btnGuardar) {
                btnGuardar.disabled = false;
                btnGuardar.style.cursor = 'pointer';
                btnGuardar.style.background = '#003399';
            } else if (btnGuardar) {
                btnGuardar.disabled = true;
                btnGuardar.style.cursor = 'not-allowed';
                btnGuardar.style.background = '#94a3b8';
            }
        }
    }
});

// --- Lógicas Algorítmicas Migradas de sgh_gas ---
window._VACANTES_TEMP = {};

function _letraSec(s, nTotal) {
    return nTotal === 1 ? 'U' : String.fromCharCode(65 + s);
}

function _distribuirSecciones(numSec, numGrados) {
    const base = Math.floor(numSec / numGrados);
    const resto = numSec % numGrados;
    const dist = [];
    for (let g = 0; g < numGrados; g++) {
        dist.push(base + (g < resto ? 1 : 0));
    }
    return dist;
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

function _renderizarDetalleSecciones(planes, dataParcial) {
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
    
    const seccionesGuardadas = (dataParcial && dataParcial.secciones_por_anio) ? dataParcial.secciones_por_anio : {};
    const matriculaGuardada = (dataParcial && dataParcial.matricula_detalle) ? dataParcial.matricula_detalle : {};
    
    mediaPlanes.forEach(plan => {
        const isMt = plan.startsWith('4');
        const anios = isMt ? 6 : 5;
        const info = planes[plan];
        let titulo = 'Plan ' + plan;
        if (info && info.mencion) titulo += ' (' + info.mencion + ')';
        
        const matFemVal = parseInt(matriculaGuardada['matFem_' + plan]) || 0;
        const matMasVal = parseInt(matriculaGuardada['matMas_' + plan]) || 0;
        
        html += '<div style="margin-bottom: 1.5rem; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem; background: #f9fafb;">';
        html += '<h4 style="margin: 0 0 1rem; color: #1e40af; font-size: 0.95rem;">' + titulo + '</h4>';
        
        html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">';
        html += '<div><label style="font-size: 0.8rem; font-weight: 600; color: #374151;">Matrícula Fem</label>';
        html += '<input type="number" class="mat-input mat-media-dinamico" id="matFem_' + plan + '" min="0" value="' + (matFemVal || '') + '" style="padding: 0.4rem; text-align: center; border: 1px solid #cbd5e1; border-radius: 4px; width: 100%; box-sizing: border-box;"></div>';
        html += '<div><label style="font-size: 0.8rem; font-weight: 600; color: #374151;">Matrícula Mas</label>';
        html += '<input type="number" class="mat-input mat-media-dinamico" id="matMas_' + plan + '" min="0" value="' + (matMasVal || '') + '" style="padding: 0.4rem; text-align: center; border: 1px solid #cbd5e1; border-radius: 4px; width: 100%; box-sizing: border-box;"></div>';
        html += '</div>';
        
        html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 1rem;">';
        
        for (let i = 1; i <= anios; i++) {
            const planSec = seccionesGuardadas[plan] || {};
            const val = parseInt(planSec[i] !== undefined ? planSec[i] : (planSec[String(i)] !== undefined ? planSec[String(i)] : 0)) || 0;
            html += '<div style="display: flex; flex-direction: column; gap: 0.3rem;">';
            html += '<label style="font-size: 0.8rem; font-weight: 600; color: #374151;">' + i + 'º Año Secciones</label>';
            html += '<input type="number" class="sec-input sec-anio-input" data-plan="' + plan + '" data-anio="' + i + '" min="0" value="' + (val || '') + '" style="padding: 0.4rem; text-align: center; border: 1px solid #cbd5e1; border-radius: 4px;">';
            html += '</div>';
        }
        
        html += '</div></div>';
    });
    
    contDinamico.innerHTML = html;
}

function _abrirModalVacantes() {
    let mat = parseInt(document.getElementById('secMat')?.value) || 0;
    let pre = parseInt(document.getElementById('secPre')?.value) || 0;
    let pri = parseInt(document.getElementById('secPri')?.value) || 0;

    const VAC = window._VACANTES_TEMP || {};

    // Auto-corrección
    if (mat === 0 && VAC['maternal'] && Object.keys(VAC['maternal']).length > 0) mat = Object.keys(VAC['maternal']).length;
    if (pre === 0 && VAC['preescolar'] && Object.keys(VAC['preescolar']).length > 0) pre = Object.keys(VAC['preescolar']).length;
    if (pri === 0 && VAC['primaria'] && Object.keys(VAC['primaria']).length > 0) pri = 6;

    if (mat === 0 && pre === 0 && pri === 0) {
        alert('Primero declare las secciones en el formulario de matrícula para Educación Inicial o Primaria.');
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
            wrap.style.cssText = 'display:flex; flex-direction:column; gap:0.2rem;';
            const lbl = document.createElement('label');
            lbl.textContent = 'SECCIÓN ' + letra;
            lbl.style.cssText = 'font-size:0.8rem; color:#78350f; font-weight:600;';
            const inp = document.createElement('input');
            inp.type = 'number'; inp.min = '0'; inp.value = String(guardado);
            inp.dataset.plan = keyPlan; inp.dataset.sec = letra;
            inp.className = 'vac-input';
            inp.style.cssText = 'padding:0.4rem; font-size:0.9rem; text-align:center; border: 1px solid #f59e0b; border-radius: 4px;';
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
                wrapG.style.cssText = 'display:flex; flex-direction:column; gap:0.2rem;';
                const lblG = document.createElement('label');
                lblG.textContent = ORDINALES[g] + ' GRADO ' + letra;
                lblG.style.cssText = 'font-size:0.78rem; color:#78350f; font-weight:600;';
                const inpG = document.createElement('input');
                inpG.type = 'number'; inpG.min = '0'; inpG.value = String(guardado);
                inpG.dataset.plan = 'primaria'; inpG.dataset.grado = String(g + 1); inpG.dataset.sec = letra;
                inpG.className = 'vac-input';
                inpG.style.cssText = 'padding:0.35rem; font-size:0.88rem; text-align:center; border: 1px solid #f59e0b; border-radius: 4px;';
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
        const val = parseInt(inp.value, 10) || 0;
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
    
    // Habilitar botón de guardar
    const btnGuardar = document.getElementById('btn-guardar-matricula');
    if (btnGuardar) {
        btnGuardar.disabled = false;
        btnGuardar.style.cursor = 'pointer';
        btnGuardar.style.background = '#003399';
    }
});

// Selector de Vacantes SI/NO
document.getElementById('toggle-vacantes')?.addEventListener('click', (e) => {
    if (e.target.tagName.toLowerCase() === 'button') {
        const val = e.target.getAttribute('data-val');
        
        // Estilos del toggle
        document.querySelectorAll('#toggle-vacantes button').forEach(b => {
            b.style.background = '#f1f5f9';
            b.style.color = '#64748b';
            b.style.borderColor = '#cbd5e1';
            b.style.fontWeight = 'normal';
        });
        e.target.style.background = val === 'SI' ? '#fef3c7' : '#dcfce7';
        e.target.style.color = val === 'SI' ? '#b45309' : '#166534';
        e.target.style.borderColor = val === 'SI' ? '#f59e0b' : '#22c55e';
        e.target.style.fontWeight = 'bold';

        const btnGuardar = document.getElementById('btn-guardar-matricula');
        if (val === 'NO') {
            window._VACANTES_TEMP = {};
            if (btnGuardar) {
                btnGuardar.disabled = false;
                btnGuardar.style.cursor = 'pointer';
                btnGuardar.style.background = '#003399';
            }
        } else if (val === 'SI') {
            if (btnGuardar) {
                btnGuardar.disabled = true;
                btnGuardar.style.cursor = 'not-allowed';
                btnGuardar.style.background = '#94a3b8';
            }
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
      if (data.matricula !== undefined && data.secciones !== undefined && data.datos_completados === true) {
        // Todo en orden, ocultar candado
        currentPlantel = data;
        showView('dashboard-view');
      } else {
        // Faltan datos, mostrar candado
        mostrarCandado(codigoDEA, data);
      }
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

function mostrarCandado(codigoDEA, dataParcial) {
    showView('lock-screen');
    
    // Poblar Datos de Solo Lectura desde el Diccionario
    const dp = findPlantel(codigoDEA);
    if (dp) {
        document.getElementById('inp-codigo-plantel').value = codigoDEA;
        document.getElementById('inp-nombre-plantel').value = dp.nombre_plantel || '';
        document.getElementById('inp-estado').value = "MERIDA";
        document.getElementById('inp-municipio').value = dp.municipio_nombre || '';
        document.getElementById('inp-dependencia-plantel').value = dp.dependencia || '';
        document.getElementById('inp-turnos-plantel').value = dp.turno || '';
    } else {
        document.getElementById('inp-codigo-plantel').value = codigoDEA;
        document.getElementById('inp-nombre-plantel').value = "Plantel no encontrado";
    }

    // Lógica dinámica de visibilidad basada en planes_estudio
    const planes = dp ? (dp.planes_estudio || {}) : {};
    let mostrarInicial = "20000" in planes;
    let mostrarPrimaria = "21000" in planes;
    let mostrarMediaGen = false;
    let mostrarMediaTec = false;

    Object.keys(planes).forEach(cod => {
        if (cod.startsWith("3")) mostrarMediaGen = true;
        if (cod.startsWith("4")) mostrarMediaTec = true;
    });

    // Fallback: Si el DEA no existe en el diccionario (planes vacíos), mostrar todos los bloques para no dejar la pantalla vacía
    if (Object.keys(planes).length === 0) {
        mostrarInicial = true;
        mostrarPrimaria = true;
        mostrarMediaGen = true;
        mostrarMediaTec = true;
        document.getElementById('inp-nombre-plantel').value = "Plantel no encontrado en diccionario local";
    }

    // Ocultar todos primero
    ['bloque-inicial', 'bloque-primaria'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    if (mostrarInicial) {
        const el = document.getElementById('bloque-inicial');
        if (el) el.style.display = 'block';
    }
    if (mostrarPrimaria) {
        const el = document.getElementById('bloque-primaria');
        if (el) el.style.display = 'block';
    }

    // Condición de Vacantes: Solo si hay planes 20000 o 21000
    const tieneBasica = mostrarInicial || mostrarPrimaria;
    const contVacantes = document.getElementById('contenedor-pregunta-vacantes');
    if (contVacantes) {
        contVacantes.style.display = tieneBasica ? 'flex' : 'none';
    }

    // Renderizar secciones dinámicas si hay media
    _renderizarDetalleSecciones(planes, dataParcial);

    if (dataParcial && dataParcial.matricula_detalle) {
        // Restaurar matrícula si ya existe
        const md = dataParcial.matricula_detalle;
        ['matFem', 'matMas', 'secMat', 'preFem', 'preMas', 'secPre',
         'priFem', 'priMas', 'secPri'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = md[id] || 0;
        });
    }
    
    // Restaurar vacantes
    if (dataParcial && dataParcial.vacantes !== undefined) {
        document.getElementById('inp-vacantes').value = dataParcial.vacantes;
    }
    
    // Forzar recálculo
    document.getElementById('matFem')?.dispatchEvent(new Event('input', { bubbles: true }));

    // Guardar los datos cuando el director llene el form
    plantelForm.onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-guardar-matricula');
        if (btn) {
            btn.textContent = "Guardando...";
            btn.disabled = true;
        }

        const matTotal = parseInt(document.getElementById('lbl-matricula-total').textContent);
        const secTotal = parseInt(document.getElementById('lbl-secciones-total').textContent);
        
        // Recopilar detalle básico
        const detalle = {};
        document.querySelectorAll('.mat-input, .sec-input').forEach(input => {
            detalle[input.id] = parseInt(input.value || 0);
        });

        // Recopilar secciones por año dinámicas (Media)
        const seccionesPorAnio = {};
        document.querySelectorAll('.sec-anio-input').forEach(inp => {
            const plan = inp.dataset.plan;
            const anio = inp.dataset.anio;
            const val = parseInt(inp.value) || 0;
            if (!seccionesPorAnio[plan]) seccionesPorAnio[plan] = {};
            seccionesPorAnio[plan][anio] = val;
        });

        try {
            const docRef = doc(db, "planteles", codigoDEA);
            
            const payload = {
                matricula: matTotal,
                secciones: secTotal,
                vacantes: window._VACANTES_TEMP || {},
                matricula_detalle: detalle,
                secciones_por_anio: seccionesPorAnio,
                datos_completados: true,
                ultima_actualizacion: new Date().toISOString()
            };
            
            await setDoc(docRef, payload, { merge: true });
            
            // Desbloqueamos
            showView('dashboard-view');
            alert("¡Datos del plantel actualizados con éxito!");
            
        } catch (error) {
            console.error("Error guardando el plantel:", error);
            alert("Ocurrió un error al guardar los datos.");
        } finally {
            if (btn) {
                btn.textContent = "Guardar y Desbloquear Sistema";
                btn.disabled = false;
            }
        }
    };
}

// --- Cerrar Sesión ---
btnLogout?.addEventListener('click', async () => {
    // await signOut(auth);
    showView('login-view');
});

document.getElementById('btn-logout-lock')?.addEventListener('click', async () => {
    showView('login-view');
});
