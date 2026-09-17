import { safeSetDoc, safeUpdateDoc, safeAddDoc } from './dbUtils.js';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getCountFromServer, getDocs, onSnapshot, deleteDoc, deleteField } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { showToast, showAlert } from './uiUtils.js';

let isInitialized = false;
let db = null;
let userData = null;

export function initAdminDashboard(dbInstance, user) {
  db = dbInstance;
  userData = user;

  function configurarInterfazPorRol() {
    const isMunAdmin = userData?.rol === 'munadmin';
    const isZonAdmin = userData?.rol === 'zonadmin';
    const isSuperAdmin = userData?.rol === 'superadmin' || userData?.rol === 'admin';
    const mun = (userData.jerarquia?.municipio || userData.municipio || '').trim().toUpperCase();
    const permisos = (isZonAdmin && userData?.permisos) ? userData.permisos : null;

    // Helper de evaluación de permisos modulares (Llavero)
    const tienePermiso = (modulo, defecto = true) => {
      if (isSuperAdmin) return true;
      if (isMunAdmin) {
        if (modulo === 'estadisticas' || modulo === 'validacion' || modulo === 'planteles' || modulo === 'nomina') return true;
        return false;
      }
      if (isZonAdmin) {
        if (permisos) {
          return permisos[modulo] === true;
        }
        // Retrocompatibilidad para zonadmin sin permisos configurados aún (todo excepto despliegue)
        return modulo !== 'despliegue';
      }
      return defecto;
    };

    // 1. Botones de nivel superior: Estadísticas, Validación y Despliegue
    const btnEstadisticas = document.getElementById('btn-sidebar-estadisticas') || document.querySelector('.sidebar-btn[data-target="admin-tab-estadisticas"]');
    const btnValidacion = document.getElementById('btn-sidebar-validacion') || document.querySelector('.sidebar-btn[data-target="admin-tab-validacion"]');
    const btnDespliegue = document.getElementById('btn-sidebar-despliegue');

    if (btnEstadisticas) btnEstadisticas.style.display = tienePermiso('estadisticas') ? 'block' : 'none';
    if (btnValidacion) btnValidacion.style.display = tienePermiso('validacion') ? 'block' : 'none';
    if (btnDespliegue) btnDespliegue.style.display = tienePermiso('despliegue', false) ? 'block' : 'none';

    // 2. Acordeón Gestor de BD y sus opciones
    const btnAcordeonBd = document.getElementById('btn-sidebar-bd');
    const accordionBd = document.querySelector('.accordion-content');
    let algunSubItemVisible = false;

    if (accordionBd) {
      accordionBd.querySelectorAll('.sidebar-btn').forEach(btn => {
        const target = btn.getAttribute('data-target');
        let visible = false;

        if (target === 'admin-tab-planteles') {
          visible = tienePermiso('planteles');
        } else if (btn.id === 'btn-sidebar-descargar-nomina-mun') {
          visible = tienePermiso('nomina');
        } else if (target === 'admin-tab-planes') {
          visible = tienePermiso('planes');
        } else if (target === 'admin-tab-listas') {
          const lista = btn.getAttribute('data-lista');
          let permKey = null;
          if (lista === 'dependencia') permKey = 'cat_dependencia';
          else if (lista === 'modalidades') permKey = 'cat_modalidades';
          else if (lista === 'niveles_educativos') permKey = 'cat_niveles_educativos';
          else if (lista === 'municipios') permKey = 'cat_municipios';
          else if (lista === 'situacion_laboral') permKey = 'cat_situacion_laboral';
          else if (lista === 'instruccion') permKey = 'cat_instruccion';
          else if (lista === 'tipo_vivienda' || lista === 'condicion_vivienda') permKey = 'cat_vivienda';
          else if (lista === 'estado_civil') permKey = 'cat_estado_civil';

          if (isZonAdmin && userData?.permisos && permKey && typeof userData.permisos[permKey] !== 'undefined') {
            visible = userData.permisos[permKey] === true;
          } else {
            visible = tienePermiso('listas');
          }
        }

        btn.style.display = visible ? 'block' : 'none';
        if (visible) algunSubItemVisible = true;
      });
    }

    if (btnAcordeonBd) {
      btnAcordeonBd.style.display = algunSubItemVisible ? 'flex' : 'none';
    }

    // 3. Encabezado y Títulos Contextuales
    const adminNameEl = document.getElementById('admin-user-name');
    const adminAvatarEl = document.getElementById('admin-user-avatar') || adminNameEl?.previousElementSibling;
    const statsTitleEl = document.getElementById('admin-stats-title');
    const statsDescEl = document.getElementById('admin-stats-desc');

    if (adminNameEl) {
      adminNameEl.style.display = 'block';
      if (isMunAdmin) {
        adminNameEl.textContent = userData.nombre ? `${userData.nombre} (${mun})` : `Coordinador (${mun})`;
        if (adminAvatarEl) adminAvatarEl.textContent = 'CM';
        if (statsTitleEl) statsTitleEl.textContent = `Métricas Municipales - ${mun}`;
        if (statsDescEl) statsDescEl.textContent = `Resumen del municipio ${mun} en tiempo real.`;
      } else if (isZonAdmin) {
        adminNameEl.textContent = userData.nombre || 'Coordinador Zonal';
        if (adminAvatarEl) adminAvatarEl.textContent = 'ZA';
        if (statsTitleEl) statsTitleEl.textContent = 'Métricas Estatales';
        if (statsDescEl) statsDescEl.textContent = 'Resumen consolidado del estado Mérida.';
      } else {
        adminNameEl.textContent = userData.nombre || 'Administrador';
        if (adminAvatarEl) adminAvatarEl.textContent = 'SA';
        if (statsTitleEl) statsTitleEl.textContent = 'Métricas Globales';
        if (statsDescEl) statsDescEl.textContent = 'Resumen del sistema en tiempo real.';
      }
    }

    // 4. Determinar la primera pestaña activa permitida
    document.querySelectorAll('.sidebar-btn').forEach(b => {
      if (!b.classList.contains('accordion-btn')) b.classList.remove('active');
    });
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));

    if (tienePermiso('estadisticas') && btnEstadisticas && btnEstadisticas.style.display !== 'none') {
      btnEstadisticas.classList.add('active');
      const tabEst = document.getElementById('admin-tab-estadisticas');
      if (tabEst) tabEst.classList.add('active');
    } else if (tienePermiso('validacion') && btnValidacion && btnValidacion.style.display !== 'none') {
      btnValidacion.classList.add('active');
      const tabVal = document.getElementById('admin-tab-validacion');
      if (tabVal) tabVal.classList.add('active');
    } else if (tienePermiso('planteles')) {
      const btnPlanteles = document.getElementById('btn-sidebar-planteles');
      if (btnPlanteles && btnPlanteles.style.display !== 'none') {
        btnPlanteles.classList.add('active');
        const tabPlanteles = document.getElementById('admin-tab-planteles');
        if (tabPlanteles) tabPlanteles.classList.add('active');
        if (typeof currentPlanteles !== 'undefined' && currentPlanteles.length === 0) loadPlanteles();
      }
    } else if (tienePermiso('planes')) {
      const btnPlanes = document.querySelector('.sidebar-btn[data-target="admin-tab-planes"]');
      if (btnPlanes && btnPlanes.style.display !== 'none') {
        btnPlanes.classList.add('active');
        const tabPlanes = document.getElementById('admin-tab-planes');
        if (tabPlanes) tabPlanes.classList.add('active');
      }
    } else {
      // Buscar el primer botón visible del sidebar que no sea descarga directa
      const primerBotonVisible = Array.from(document.querySelectorAll('#admin-sidebar .sidebar-btn:not(.accordion-btn)'))
        .find(b => b.style.display !== 'none' && b.id !== 'btn-sidebar-descargar-nomina-mun');
      if (primerBotonVisible) {
        primerBotonVisible.classList.add('active');
        const tgt = primerBotonVisible.getAttribute('data-target');
        const tabEl = tgt ? document.getElementById(tgt) : null;
        if (tabEl) tabEl.classList.add('active');
        if (tgt === 'admin-tab-listas') {
          const l = primerBotonVisible.getAttribute('data-lista');
          const t = primerBotonVisible.getAttribute('data-tipo');
          if (typeof window.loadListasMaestras === 'function') window.loadListasMaestras(l, t);
        }
        if (primerBotonVisible.closest('.accordion-content')) {
          const accContent = primerBotonVisible.closest('.accordion-content');
          accContent.style.display = 'flex';
          const accBtn = document.getElementById('btn-sidebar-bd');
          if (accBtn) {
            accBtn.classList.add('open');
            const arrow = accBtn.querySelector('.arrow');
            if (arrow) arrow.style.transform = 'rotate(-180deg)';
          }
        }
      }
    }
  }

  if (isInitialized) {
     // Si ya se inicializó el DOM, solo recargamos los datos para el nuevo usuario
     currentPlanteles = [];
     configurarInterfazPorRol();
     loadEstadisticas();
     const activeTab = document.querySelector('.admin-tab.active');
     if (activeTab && activeTab.id === 'admin-tab-planteles') {
        loadPlanteles();
     }
     return;
  }
  isInitialized = true;
  // Lógica de Pestañas (Sidebar)
  document.querySelectorAll('.sidebar-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const button = e.target.closest('.sidebar-btn');
      if(!button) return;

      // Logica de Acordeon
      if (button.classList.contains('accordion-btn')) {
         button.classList.toggle('open');
         const content = button.nextElementSibling;
         if (content && content.classList.contains('accordion-content')) {
            if (content.style.display === 'flex') {
               content.style.display = 'none';
               button.querySelector('.arrow').style.transform = 'rotate(0deg)';
            } else {
               content.style.display = 'flex';
               button.querySelector('.arrow').style.transform = 'rotate(-180deg)';
            }
         }
         return; // No navegar ni cerrar el sidebar
      }

      // Descarga directa de Nómina Municipal en Excel
      if (button.id === 'btn-sidebar-descargar-nomina-mun') {
         exportarNominaMunicipalExcel();
         if(typeof window.closeSidebar === 'function') window.closeSidebar();
         return;
      }

      // Navegacion normal
      const targetId = button.getAttribute('data-target');
      if (userData?.rol === 'munadmin') {
         if (targetId !== 'admin-tab-estadisticas' && 
             targetId !== 'admin-tab-validacion' && 
             targetId !== 'admin-tab-planteles') {
            return;
         }
      }
      if (userData?.rol === 'zonadmin' && userData?.permisos) {
         const p = userData.permisos;
         if (targetId === 'admin-tab-estadisticas' && !p.estadisticas) {
            showToast("No tiene permisos para acceder a Métricas.", "warning");
            return;
         }
         if (targetId === 'admin-tab-validacion' && !p.validacion) {
            showToast("No tiene permisos para acceder a Validación de Usuarios.", "warning");
            return;
         }
         if (targetId === 'admin-tab-planteles' && !p.planteles) {
            showToast("No tiene permisos para acceder a Planteles.", "warning");
            return;
         }
         if (targetId === 'admin-tab-planes' && !p.planes) {
            showToast("No tiene permisos para acceder a Planes de Estudio.", "warning");
            return;
         }
          if (targetId === 'admin-tab-listas') {
             const lista = button.getAttribute('data-lista');
             let permKey = null;
             if (lista === 'dependencia') permKey = 'cat_dependencia';
             else if (lista === 'modalidades') permKey = 'cat_modalidades';
             else if (lista === 'niveles_educativos') permKey = 'cat_niveles_educativos';
             else if (lista === 'municipios') permKey = 'cat_municipios';
             else if (lista === 'situacion_laboral') permKey = 'cat_situacion_laboral';
             else if (lista === 'instruccion') permKey = 'cat_instruccion';
             else if (lista === 'tipo_vivienda' || lista === 'condicion_vivienda') permKey = 'cat_vivienda';
             else if (lista === 'estado_civil') permKey = 'cat_estado_civil';

             const permitido = (permKey && typeof p[permKey] !== 'undefined') ? p[permKey] : p.listas;
             if (!permitido) {
                showToast(`No tiene permisos para acceder a este catálogo.`, "warning");
                return;
             }
          }
         if (targetId === 'admin-tab-despliegue' && !p.despliegue) {
            showToast("No tiene permisos para acceder a Despliegue.", "warning");
            return;
         }
      }

      document.querySelectorAll('.sidebar-btn').forEach(b => {
         if(!b.classList.contains('accordion-btn')) b.classList.remove('active');
      });
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      
      button.classList.add('active');
      if(targetId) {
         const targetElem = document.getElementById(targetId);
         if (targetElem) targetElem.classList.add('active');
         if (targetId === 'admin-tab-planteles' && typeof currentPlanteles !== 'undefined' && currentPlanteles.length === 0) { loadPlanteles(); }
         if (targetId === 'admin-tab-planes' && typeof catalogosGlobal !== 'undefined' && (!catalogosGlobal['planes-estudio'] || Object.keys(catalogosGlobal['planes-estudio']).length === 0)) { loadCatalogos(); }
         if (targetId === 'admin-tab-listas') { 
            const lista = button.getAttribute('data-lista');
            const tipo = button.getAttribute('data-tipo');
            if(typeof window.loadListasMaestras === 'function') window.loadListasMaestras(lista, tipo); 
         }
      }
      
      if(typeof window.closeSidebar === 'function') window.closeSidebar();
    });
  });

  // Cargar Estadísticas (Tab por Defecto)
  async function loadEstadisticas() {
    try {
      // Plan Cero Costo: getCountFromServer (1 read por 1000 documentos)
      let qPersonal = collection(db, 'cargos_personal');
      let qUsuarios = collection(db, 'usuarios');
      let qPlanteles = query(collection(db, 'usuarios'), where('rol', '==', 'plaadmin'));

      if (userData?.rol === 'munadmin') {
          const mun = (userData.jerarquia?.municipio || userData.municipio || '').trim().toUpperCase();
          if (mun) {
              qPersonal = query(qPersonal, where('municipio', '==', mun));
              // Un munadmin solo gestiona plaadmin, así que su contador de usuarios debe reflejar solo esos.
              qUsuarios = query(collection(db, 'usuarios'), where('rol', '==', 'plaadmin'), where('jerarquia.municipio', '==', mun));
              qPlanteles = query(collection(db, 'usuarios'), where('rol', '==', 'plaadmin'), where('jerarquia.municipio', '==', mun));
          }
      }

      const snapPersonal = await getCountFromServer(qPersonal);
      const totalPersonal = snapPersonal.data().count;
      
      const snapUsuarios = await getCountFromServer(qUsuarios);
      const totalUsuarios = snapUsuarios.data().count;

      const snapPlanteles = await getCountFromServer(qPlanteles);
      const totalPlanteles = snapPlanteles.data().count;

      const elUsuarios = document.getElementById('stat-usuarios');
      const elPersonal = document.getElementById('stat-personal');
      const elPlanteles = document.getElementById('stat-planteles');
      
      if(elUsuarios) elUsuarios.textContent = totalUsuarios;
      
      if(elPersonal) elPersonal.textContent = totalPersonal;
      if(elPlanteles) elPlanteles.textContent = totalPlanteles;
    } catch(err) {
      console.error("Error cargando estadísticas", err);
    }
  }
  
  configurarInterfazPorRol();
  loadEstadisticas();

  // --- LÓGICA DE VALIDACIÓN DE USUARIOS ---
  const tbodyUsuarios = document.getElementById('tbody-usuarios');
  const filterEstado = document.getElementById('filter-estado');
  let usuariosLocales = []; // Cache local para filtrar

  let unsubscribeUsuarios = null;
  function loadUsuariosList() {
    if(tbodyUsuarios) tbodyUsuarios.innerHTML = '<tr><td colspan="4" style="padding: 30px; text-align: center; color: var(--text-muted);">Cargando usuarios...</td></tr>';
    
    if (unsubscribeUsuarios) {
       unsubscribeUsuarios();
    }

    const q = query(collection(db, 'usuarios')); // Traemos todos para filtrar en cliente rápido
    unsubscribeUsuarios = onSnapshot(q, (snap) => {
      usuariosLocales = [];
      snap.forEach(doc => {
        const u = doc.data();
        u.uid = doc.id;
        
        // --- RBAC FILTER ---
        if (userData.rol === 'munadmin') {
            // munadmin solo ve directores (plaadmin) de su municipio
            if (u.rol !== 'plaadmin' || u.jerarquia?.municipio !== userData.jerarquia?.municipio) return;
        }

        // Evitar que un superadmin se borre a sí mismo accidentalmente o a otros admins
        if (u.rol !== 'admin' && u.rol !== 'superadmin') {
          usuariosLocales.push(u);
        }
      });
      
      renderUsuariosList();
    }, (err) => {
      console.error("Error cargando lista de usuarios", err);
      if(tbodyUsuarios) tbodyUsuarios.innerHTML = '<tr><td colspan="4" style="padding: 30px; text-align: center; color: var(--danger);">Error cargando usuarios</td></tr>';
    });
  }

  
  // --- CUSTOM CONFIRM DIALOG ---
  function showConfirm(title, text, type = 'danger') {
    return new Promise((resolve) => {
      const modal = document.getElementById('modal-confirm');
      const titleEl = document.getElementById('confirm-title');
      const textEl = document.getElementById('confirm-text');
      const iconEl = document.getElementById('confirm-icon');
      const btnOk = document.getElementById('btn-confirm-ok');
      const btnCancel = document.getElementById('btn-confirm-cancel');
      
      titleEl.textContent = title;
      textEl.textContent = text;
      
      if (type === 'success') {
        iconEl.textContent = '✅';
        btnOk.style.background = 'var(--success)';
      } else {
        iconEl.textContent = '⚠️';
        btnOk.style.background = 'var(--danger)';
      }
      
      modal.style.display = 'flex';
      
      const cleanup = () => {
        btnOk.onclick = null;
        btnCancel.onclick = null;
        modal.style.display = 'none';
      };
      
      btnOk.onclick = () => { cleanup(); resolve(true); };
      btnCancel.onclick = () => { cleanup(); resolve(false); };
    });
  }
  
  
  function showPromptDual(title, text, defaultKey = '', defaultVal = '') {
    return new Promise((resolve) => {
      const modal = document.getElementById('modal-prompt-dual');
      const titleEl = document.getElementById('prompt-dual-title');
      const textEl = document.getElementById('prompt-dual-text');
      const keyEl = document.getElementById('prompt-dual-key');
      const valEl = document.getElementById('prompt-dual-val');
      const btnOk = document.getElementById('btn-prompt-dual-ok');
      const btnCancel = document.getElementById('btn-prompt-dual-cancel');
      
      titleEl.textContent = title;
      textEl.textContent = text;
      keyEl.value = defaultKey;
      valEl.value = defaultVal;
      
      modal.style.display = 'flex';
      keyEl.focus();
      
      const cleanup = () => {
        btnOk.onclick = null;
        btnCancel.onclick = null;
        modal.style.display = 'none';
      };
      
      btnOk.onclick = () => { cleanup(); resolve({ key: keyEl.value, val: valEl.value }); };
      btnCancel.onclick = () => { cleanup(); resolve(null); };
    });
  }

  function showPrompt(title, text, defaultValue = '') {
    return new Promise((resolve) => {
      const modal = document.getElementById('modal-prompt');
      const titleEl = document.getElementById('prompt-title');
      const textEl = document.getElementById('prompt-text');
      const inputEl = document.getElementById('prompt-input');
      const btnOk = document.getElementById('btn-prompt-ok');
      const btnCancel = document.getElementById('btn-prompt-cancel');
      
      titleEl.textContent = title;
      textEl.textContent = text;
      inputEl.value = defaultValue;
      
      modal.style.display = 'flex';
      inputEl.focus();
      
      const cleanup = () => {
        btnOk.onclick = null;
        btnCancel.onclick = null;
        modal.style.display = 'none';
      };
      
      btnOk.onclick = () => { cleanup(); resolve(inputEl.value); };
      btnCancel.onclick = () => { cleanup(); resolve(null); };
      
      // Also allow Enter key
      inputEl.onkeydown = (e) => {
         if (e.key === 'Enter') {
             cleanup(); resolve(inputEl.value);
         }
      };
    });
  }

  function renderUsuariosList() {
    if (!tbodyUsuarios) return;
    
    const filtro = filterEstado.value; // "TODOS", "PENDIENTE", "APROBADO"
    const filtrados = usuariosLocales.filter(u => filtro === 'TODOS' ? true : u.estado_aprobacion === filtro);

    if (filtrados.length === 0) {
      tbodyUsuarios.innerHTML = '<tr><td colspan="4" style="padding: 30px; text-align: center; color: var(--text-muted);">No se encontraron usuarios</td></tr>';
      return;
    }

    tbodyUsuarios.innerHTML = filtrados.map(u => {
      // Determinar ubicación
      let ubicacion = 'N/A';
      if (u.jerarquia) {
        if (u.rol === 'plaadmin' && u.jerarquia.plantel_codigo) ubicacion = `Plantel: ${u.jerarquia.plantel_codigo}`;
        else if (u.jerarquia.municipio) ubicacion = `Municipio: ${u.jerarquia.municipio}`;
        else ubicacion = `Estado: ${u.jerarquia.estado || 'MERIDA'}`;
      }

      const isAprobado = u.estado_aprobacion === 'APROBADO';
      
      return `
        <tr style="border-bottom: 1px solid var(--glass-border); transition: background 0.2s;">
          <td style="padding: 15px 20px;">
            <div style="font-weight: 600; color: var(--text-main);">${u.nombre || 'Sin nombre'}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">${u.email} <br> C.I: ${u.cedula}</div>
          </td>
          <td style="padding: 15px 20px;">
            <div style="font-weight: 500; color: var(--primary-color);">${u.rol.toUpperCase()}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">${ubicacion}</div>
            ${u.rol === 'zonadmin' ? `<div style="font-size: 0.75rem; color: #16a34a; font-weight: 500; margin-top: 3px;">🔑 ${u.permisos ? Object.entries(u.permisos).filter(([k, v]) => v === true && k !== 'listas' && k !== 'ultima_modificacion').length + ' competencias autorizadas' : 'Acceso Estándar'}</div>` : ''}
          </td>
          <td style="padding: 15px 20px;">
            <span style="padding: 5px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; 
              background: ${isAprobado ? '#dcfce7' : '#fef3c7'}; 
              color: ${isAprobado ? '#166534' : '#b45309'};">
              ${u.estado_aprobacion || 'DESCONOCIDO'}
            </span>
          </td>
          <td style="padding: 15px 20px; text-align: right; display: flex; gap: 8px; justify-content: flex-end; align-items: center;">
            ${(u.rol === 'zonadmin' && (userData.rol === 'superadmin' || userData.rol === 'admin')) ? `<button class="btn-competencias" data-uid="${u.uid}" style="width: auto; padding: 6px 12px; font-size: 0.82rem; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; font-weight: 600;" title="Configurar módulos y permisos del panel">🔑 Competencias</button>` : ''}
            ${!isAprobado ? `<button class="btn-aprobar" data-uid="${u.uid}" style="width: auto; padding: 6px 12px; font-size: 0.85rem; background: var(--success);">Aprobar</button>` : ''}
            <button class="btn-eliminar btn-secondary" data-uid="${u.uid}" style="width: auto; padding: 6px 12px; font-size: 0.85rem; border-color: var(--danger); color: var(--danger);">${isAprobado ? 'Eliminar' : 'Rechazar'}</button>
          </td>
        </tr>
      `;
    }).join('');

    // Eventos de botones
    document.querySelectorAll('.btn-competencias').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        const uid = btn.getAttribute('data-uid');
        const userFound = usuariosLocales.find(x => x.uid === uid);
        if (userFound) {
          openCompetenciasModal(userFound);
        }
      };
    });

    document.querySelectorAll('.btn-aprobar').forEach(btn => {
      btn.onclick = async (e) => {
        const uid = e.target.getAttribute('data-uid');
        const conf = await showConfirm("¿Aprobar Acceso?", "El usuario tendrá permiso para ingresar al sistema.", "success");
        if(conf) {
          e.target.disabled = true;
          e.target.textContent = '...';
          try {
            await safeUpdateDoc(doc(db, 'usuarios', uid), { estado_aprobacion: 'APROBADO' });
            await loadUsuariosList();
            loadEstadisticas(); // Actualiza contadores
          } catch(err) {
            console.error(err);
            showConfirm("Error", "Ocurrió un problema al aprobar el usuario.", "danger");
          }
        }
      };
    });

    document.querySelectorAll('.btn-eliminar').forEach(btn => {
      btn.onclick = async (e) => {
        const uid = e.target.getAttribute('data-uid');
        const conf = await showConfirm("Eliminar Perfil", "Esta acción es irreversible. El usuario perderá acceso al sistema.", "danger");
        if(conf) {
          e.target.disabled = true;
          e.target.textContent = '...';
          try {
            await deleteDoc(doc(db, 'usuarios', uid));
            await loadUsuariosList();
            loadEstadisticas(); // Actualiza contadores
          } catch(err) {
            console.error(err);
            showConfirm("Error", "Ocurrió un problema al eliminar el usuario.", "danger");
          }
        }
      };
    });
  }

  // --- CONTROLADOR DEL MODAL DE COMPETENCIAS ZONALES (LLAVERO) ---
  const modalCompetencias = document.getElementById('modal-competencias-zonal');
  const btnCerrarCompetencias = document.getElementById('btn-cerrar-competencias');
  const btnCancelarCompetencias = document.getElementById('btn-cancelar-competencias');
  const btnGuardarCompetencias = document.getElementById('btn-guardar-competencias');
  const btnSelectAllCompetencias = document.getElementById('btn-seleccionar-todos-permisos');
  const btnClearAllCompetencias = document.getElementById('btn-limpiar-todos-permisos');
  const userInfoCompetencias = document.getElementById('competencias-user-info');
  const uidTargetCompetencias = document.getElementById('competencias-target-uid');

  function cerrarModalCompetencias() {
    if (modalCompetencias) {
      modalCompetencias.style.display = 'none';
      if (uidTargetCompetencias) uidTargetCompetencias.value = '';
    }
  }

  if (btnCerrarCompetencias) btnCerrarCompetencias.addEventListener('click', cerrarModalCompetencias);
  if (btnCancelarCompetencias) btnCancelarCompetencias.addEventListener('click', cerrarModalCompetencias);
  if (modalCompetencias) {
    modalCompetencias.addEventListener('click', (e) => {
      if (e.target === modalCompetencias) cerrarModalCompetencias();
    });
  }

  if (btnSelectAllCompetencias) {
    btnSelectAllCompetencias.addEventListener('click', () => {
      document.querySelectorAll('#lista-permisos-zonales .chk-permiso').forEach(chk => {
        chk.checked = true;
      });
    });
  }

  if (btnClearAllCompetencias) {
    btnClearAllCompetencias.addEventListener('click', () => {
      document.querySelectorAll('#lista-permisos-zonales .chk-permiso').forEach(chk => {
        chk.checked = false;
      });
    });
  }

  function openCompetenciasModal(user) {
    if (!modalCompetencias || !user) return;
    if (uidTargetCompetencias) uidTargetCompetencias.value = user.uid;

    if (userInfoCompetencias) {
      userInfoCompetencias.innerHTML = `Configurando permisos para: <strong style="color: var(--text-main);">${user.nombre || 'Coordinador Zonal'}</strong> (${user.email || user.cedula})`;
    }

    const permisos = user.permisos || null;

    // Si tiene permisos definidos, marcamos exactamente esos.
    // Si no tiene permisos previos, marcamos el estándar (todo true excepto despliegue).
    document.getElementById('chk-perm-estadisticas').checked = permisos ? !!permisos.estadisticas : true;
    document.getElementById('chk-perm-validacion').checked = permisos ? !!permisos.validacion : true;
    document.getElementById('chk-perm-planteles').checked = permisos ? !!permisos.planteles : true;
    document.getElementById('chk-perm-nomina').checked = permisos ? !!permisos.nomina : true;
    document.getElementById('chk-perm-planes').checked = permisos ? !!permisos.planes : true;
    
    // Catálogos discriminados (con soporte de herencia si antes tenía 'listas')
    const defaultListas = permisos ? (typeof permisos.listas !== 'undefined' ? !!permisos.listas : true) : true;
    const setChk = (id, key) => {
      const el = document.getElementById(id);
      if (el) {
        el.checked = permisos && typeof permisos[key] !== 'undefined' ? !!permisos[key] : defaultListas;
      }
    };

    setChk('chk-perm-cat-dependencia', 'cat_dependencia');
    setChk('chk-perm-cat-modalidades', 'cat_modalidades');
    setChk('chk-perm-cat-niveles-educativos', 'cat_niveles_educativos');
    setChk('chk-perm-cat-municipios', 'cat_municipios');
    setChk('chk-perm-cat-situacion-laboral', 'cat_situacion_laboral');
    setChk('chk-perm-cat-instruccion', 'cat_instruccion');
    setChk('chk-perm-cat-vivienda', 'cat_vivienda');
    setChk('chk-perm-cat-estado-civil', 'cat_estado_civil');

    document.getElementById('chk-perm-despliegue').checked = permisos ? !!permisos.despliegue : false;

    modalCompetencias.style.display = 'flex';
  }

  if (btnGuardarCompetencias) {
    btnGuardarCompetencias.addEventListener('click', async () => {
      const uid = uidTargetCompetencias ? uidTargetCompetencias.value : null;
      if (!uid) return;

      const chkDep = document.getElementById('chk-perm-cat-dependencia')?.checked || false;
      const chkMod = document.getElementById('chk-perm-cat-modalidades')?.checked || false;
      const chkNiv = document.getElementById('chk-perm-cat-niveles-educativos')?.checked || false;
      const chkMun = document.getElementById('chk-perm-cat-municipios')?.checked || false;
      const chkSit = document.getElementById('chk-perm-cat-situacion-laboral')?.checked || false;
      const chkIns = document.getElementById('chk-perm-cat-instruccion')?.checked || false;
      const chkViv = document.getElementById('chk-perm-cat-vivienda')?.checked || false;
      const chkCiv = document.getElementById('chk-perm-cat-estado-civil')?.checked || false;

      const algunCatalogo = !!(chkDep || chkMod || chkNiv || chkMun || chkSit || chkIns || chkViv || chkCiv);

      const nuevosPermisos = {
        estadisticas: document.getElementById('chk-perm-estadisticas')?.checked || false,
        validacion: document.getElementById('chk-perm-validacion')?.checked || false,
        planteles: document.getElementById('chk-perm-planteles')?.checked || false,
        nomina: document.getElementById('chk-perm-nomina')?.checked || false,
        planes: document.getElementById('chk-perm-planes')?.checked || false,
        listas: algunCatalogo,
        cat_dependencia: chkDep,
        cat_modalidades: chkMod,
        cat_niveles_educativos: chkNiv,
        cat_municipios: chkMun,
        cat_situacion_laboral: chkSit,
        cat_instruccion: chkIns,
        cat_vivienda: chkViv,
        cat_estado_civil: chkCiv,
        despliegue: document.getElementById('chk-perm-despliegue')?.checked || false,
        ultima_modificacion: new Date().toISOString()
      };

      btnGuardarCompetencias.disabled = true;
      btnGuardarCompetencias.textContent = 'Guardando...';

      try {
        await safeUpdateDoc(doc(db, 'usuarios', uid), { permisos: nuevosPermisos });

        // Si el usuario editado es el mismo de la sesión activa, actualizar en tiempo real
        if (userData && userData.uid === uid) {
          userData.permisos = nuevosPermisos;
          configurarInterfazPorRol();
        }

        // Actualizar en el cache local para que la tabla muestre el cambio de inmediato
        const uLocal = usuariosLocales.find(x => x.uid === uid);
        if (uLocal) {
          uLocal.permisos = nuevosPermisos;
        }

        renderUsuariosList();
        cerrarModalCompetencias();
        showToast("Competencias del funcionario actualizadas exitosamente.", "success");
      } catch (err) {
        console.error("Error guardando competencias:", err);
        showAlert("Error", "No se pudieron guardar las competencias: " + err.message, "danger");
      } finally {
        btnGuardarCompetencias.disabled = false;
        btnGuardarCompetencias.textContent = 'Guardar Competencias';
      }
    });
  }

  if (filterEstado) {
    filterEstado.addEventListener('change', renderUsuariosList);
  }

  // Cargar lista al iniciar
  loadUsuariosList();
  // ----------------------------------------

  // Variables para Despliegue
  const grid = document.getElementById('despliegue-grid');
  const expList = document.getElementById('excepciones-list');
  const btnSave = document.getElementById('btn-save-despliegue');
  const btnAddExp = document.getElementById('btn-add-excepcion');
  const inpNewExp = document.getElementById('inp-new-excepcion');
  const statusSpan = document.getElementById('despliegue-status');
  const btnLogout = document.getElementById('btn-logout-admin');

  if (btnLogout) {
    btnLogout.onclick = () => {
       import('firebase/auth').then(({ getAuth, signOut }) => {
           signOut(getAuth());
       });
    };
  }

  const MUNICIPIOS_MERIDA = [
    "ALBERTO ADRIANI", "ANDRES BELLO", "ANTONIO PINTO SALINAS", // Note: En bd_sgh.json it's SALINAS or SALINA?
    "ARICAGUA", "ARZOBISPO CHACON", "CAMPO ELIAS",
    "CARACCIOLO PARRA", "CARDENAL QUINTERO", "GUARAQUE",
    "JULIO CESAR", "JUSTO BRICEÑO", "LIBERTADOR",
    "MIRANDA", "OBISPO RAMOS DE LORA", "PADRE NOGUERA",
    "PUEBLO LLANO", "RANGEL", "RIVAS DAVILA",
    "SANTOS MARQUINA", "SUCRE", "TOVAR",
    "TULIO FEBRES", "ZEA"
  ];

  let configActual = { municipios_activos: [], excepciones: [] };
  const docRef = doc(db, 'configuracion', 'despliegue');

  async function loadConfig() {
    try {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        configActual = snap.data();
      } else {
        await safeSetDoc(docRef, configActual);
      }
      if (!configActual.municipios_activos) configActual.municipios_activos = [];
      if (!configActual.excepciones) configActual.excepciones = [];
      
      renderGrid();
      renderExcepciones();
    } catch(err) {
      console.error("Error cargando configuración", err);
    }
  }

  function renderGrid() {
    grid.innerHTML = MUNICIPIOS_MERIDA.map(mun => {
      const isActive = configActual.municipios_activos.includes(mun);
      return `
      <div style="background:white; border-radius:8px; padding:16px; display:flex; align-items:center; justify-content:space-between; border:1px solid ${isActive ? '#10B981' : '#e2e8f0'};">
        <span style="font-size:0.9rem; font-weight:600; color:${isActive ? '#10B981' : 'var(--text-muted)'};">${mun}</span>
        <label style="position:relative; display:inline-block; width:46px; height:24px; cursor:pointer;">
          <input type="checkbox" data-mun="${mun}" class="mun-toggle" ${isActive ? 'checked' : ''} style="opacity:0;width:0;height:0;">
          <span style="position:absolute; top:0; left:0; right:0; bottom:0; background:${isActive ? '#10B981' : 'rgba(255,255,255,0.2)'}; border-radius:24px; transition:0.3s;"></span>
          <span style="position:absolute; top:3px; left:${isActive ? '25px' : '3px'}; width:18px; height:18px; background:#fff; border-radius:50%; transition:0.3s;"></span>
        </label>
      </div>`;
    }).join('');

    // Bind events
    document.querySelectorAll('.mun-toggle').forEach(chk => {
      chk.onchange = (e) => {
        const mun = e.target.dataset.mun;
        if (e.target.checked) {
          if (!configActual.municipios_activos.includes(mun)) configActual.municipios_activos.push(mun);
        } else {
          configActual.municipios_activos = configActual.municipios_activos.filter(m => m !== mun);
        }
        renderGrid();
      };
    });
  }

  function renderExcepciones() {
    if (configActual.excepciones.length === 0) {
      expList.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem;">No hay excepciones registradas.</p>';
      return;
    }
    expList.innerHTML = configActual.excepciones.map(cod => `
      <div style="background:white; padding:10px 15px; border-radius:6px; display:flex; justify-content:space-between; align-items:center; border:1px solid #e2e8f0;">
        <span>${cod}</span>
        <button class="btn-remove-exp" data-cod="${cod}" style="background:transparent; border:none; color:#dc3545; cursor:pointer; font-weight:bold;">X</button>
      </div>
    `).join('');

    document.querySelectorAll('.btn-remove-exp').forEach(btn => {
      btn.onclick = (e) => {
        const cod = e.target.dataset.cod;
        configActual.excepciones = configActual.excepciones.filter(c => c !== cod);
        renderExcepciones();
      };
    });
  }

  btnAddExp.onclick = () => {
    const val = inpNewExp.value.trim().toUpperCase();
    if (val && !configActual.excepciones.includes(val)) {
      configActual.excepciones.push(val);
      inpNewExp.value = '';
      renderExcepciones();
    }
  };

  btnSave.onclick = async () => {
    try {
      btnSave.textContent = 'Guardando...';
      btnSave.disabled = true;
      await safeUpdateDoc(docRef, {
        municipios_activos: configActual.municipios_activos,
        excepciones: configActual.excepciones
      });
      // Update cache
      sessionStorage.setItem('sgh_despliegue_config', JSON.stringify(configActual));
      statusSpan.textContent = '¡Guardado con éxito!';
      setTimeout(() => statusSpan.textContent = '', 3000);
    } catch(err) {
      console.error(err);
      statusSpan.textContent = 'Error al guardar';
      statusSpan.style.color = '#dc3545';
    } finally {
      btnSave.textContent = 'Guardar Despliegue';
      btnSave.disabled = false;
    }
  };

  loadConfig();

    // --- GESTOR DE BD: CATALOGOS MAESTROS (PLANES DE ESTUDIO) ---
  let catalogosGlobal = {};
  let editingPlan = null; // Stores a deep copy of the plan being edited
  let currentYearTab = 1;

  const btnNuevoPlan = document.getElementById('btn-nuevo-plan');
  const btnVolverGrid = document.getElementById('btn-volver-grid-planes');
  const btnGuardarPlan = document.getElementById('btn-guardar-plan');
  const vistaGrid = document.getElementById('cat-vista-grid');
  const vistaEditor = document.getElementById('cat-vista-editor');
  const gridPlanes = document.getElementById('grid-planes-estudio');
  const tabsAnios = document.getElementById('ep-tabs-anios');
  const tbodyMaterias = document.getElementById('ep-tbody-materias');
  
  // Bind tabs navigation to load catalogos if not loaded
  document.querySelectorAll('.db-subtab-btn').forEach(btn => {
     btn.addEventListener('click', (e) => {
        if(e.target.getAttribute('data-target') === 'db-catalogos' && Object.keys(catalogosGlobal).length === 0) {
           loadCatalogos();
        }
     });
  });

  async function loadCatalogos() {
    if(!gridPlanes) return;
    try {
      const snap = await getDoc(doc(db, "sistema", "catalogos_maestros"));
      if(snap.exists()) {
        catalogosGlobal = snap.data();
        renderPlanesGrid();
      }
    } catch(err) {
      console.error("Error loading catalogos:", err);
      gridPlanes.innerHTML = '<p style="color:var(--danger);">Error cargando catálogos.</p>';
    }
  }

  function renderPlanesGrid() {
    if(!gridPlanes || !catalogosGlobal.planes_estudio) return;
    gridPlanes.innerHTML = '';
    
    const planes = catalogosGlobal.planes_estudio;
    Object.keys(planes).forEach(cod => {
       const plan = planes[cod];
       const card = document.createElement('div');
       card.style.cssText = 'background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); display: flex; flex-direction: column; justify-content: space-between;';
       
       card.innerHTML = `
         <div>
           <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
             <span style="background: rgba(37,99,235,0.1); color: var(--primary-color); padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold;">${cod}</span>
             <span style="font-size: 0.8rem; color: var(--text-muted);">${plan.numAnios || '?'} Años</span>
           </div>
           <h4 style="margin: 0 0 5px; color: var(--text-main); font-size: 1.1rem;">${plan.especialidad || 'Sin Especialidad'}</h4>
           <p style="margin: 0; color: var(--text-muted); font-size: 0.9rem;">${plan.mencion || 'Sin Mención'}</p>
         </div>
         <button class="btn-config-plan" data-cod="${cod}" style="margin-top: 20px; width: 100%; background: #f8fafc; border: 1px solid #e2e8f0; color: var(--primary-color); padding: 8px; border-radius: 6px; cursor: pointer; font-weight: bold;">⚙️ Configurar</button>
       `;
       gridPlanes.appendChild(card);
    });

    document.querySelectorAll('.btn-config-plan').forEach(b => {
       b.onclick = () => openPlanEditor(b.getAttribute('data-cod'));
    });
  }

  if(btnNuevoPlan) {
    btnNuevoPlan.onclick = () => {
      editingPlan = { isNew: true, codigo: '', especialidad: '', mencion: '', numAnios: 1, grados: [{ anio: 1, label: "1ER AÑO", asignaturas: [] }] };
      currentYearTab = 1;
      showEditor();
    };
  }

  if(btnVolverGrid) {
    btnVolverGrid.onclick = () => {
       vistaEditor.style.display = 'none';
       vistaGrid.style.display = 'block';
    };
  }

  function openPlanEditor(cod) {
     const planOriginal = catalogosGlobal.planes_estudio[cod];
     // Deep copy to not mutate global state until save
     editingPlan = JSON.parse(JSON.stringify(planOriginal));
     editingPlan.isNew = false;
     editingPlan.oldCodigo = cod;
     
     if(!editingPlan.grados) editingPlan.grados = [];
     
     currentYearTab = editingPlan.grados.length > 0 ? editingPlan.grados[0].anio : 1;
     showEditor();
  }

  function showEditor() {
     document.getElementById('titulo-editor-plan').innerText = editingPlan.isNew ? 'Nuevo Plan de Estudio' : `Editando Plan ${editingPlan.codigo}`;
     
     document.getElementById('ep-codigo').value = editingPlan.codigo || '';
     document.getElementById('ep-especialidad').value = editingPlan.especialidad || '';
     document.getElementById('ep-mencion').value = editingPlan.mencion || '';
     document.getElementById('ep-numanios').value = editingPlan.numAnios || 1;
     
     renderYearTabs();
     renderMaterias();
     
     vistaGrid.style.display = 'none';
     vistaEditor.style.display = 'block';
  }

  document.getElementById('ep-numanios')?.addEventListener('change', (e) => {
     const val = parseInt(e.target.value) || 1;
     editingPlan.numAnios = val;
     // Re-adjust grados array
     const currentGrados = editingPlan.grados || [];
     const newGrados = [];
     for(let i = 1; i <= val; i++) {
        const existing = currentGrados.find(g => g.anio === i);
        if(existing) newGrados.push(existing);
        else {
           const labels = ['1ER', '2DO', '3ER', '4TO', '5TO', '6TO'];
           newGrados.push({ anio: i, label: `${labels[i-1] || i} AÑO`, asignaturas: [] });
        }
     }
     editingPlan.grados = newGrados;
     if(currentYearTab > val) currentYearTab = val;
     renderYearTabs();
     renderMaterias();
  });

  function renderYearTabs() {
    tabsAnios.innerHTML = '';
    (editingPlan.grados || []).forEach(g => {
       const b = document.createElement('button');
       b.innerText = g.label;
       b.style.cssText = `padding: 8px 16px; border: none; background: ${currentYearTab === g.anio ? 'white' : 'transparent'}; border-top-left-radius: 6px; border-top-right-radius: 6px; cursor: pointer; font-weight: ${currentYearTab === g.anio ? 'bold' : 'normal'}; color: ${currentYearTab === g.anio ? 'var(--primary-color)' : 'var(--text-muted)'}; border: 1px solid ${currentYearTab === g.anio ? '#e2e8f0' : 'transparent'}; border-bottom: none; margin-bottom: -2px;`;
       if(currentYearTab === g.anio) b.style.boxShadow = '0 -2px 5px rgba(0,0,0,0.02)';
       
       b.onclick = () => {
          currentYearTab = g.anio;
          renderYearTabs();
          renderMaterias();
       };
       tabsAnios.appendChild(b);
    });
  }

  function renderMaterias() {
     tbodyMaterias.innerHTML = '';
     const grado = (editingPlan.grados || []).find(g => g.anio === currentYearTab);
     if(!grado) return;

     grado.asignaturas.forEach((asig, index) => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #e2e8f0';
        tr.innerHTML = `
          <td style="padding: 10px 15px; color: var(--text-main);">${asig.nombre}</td>
          <td style="padding: 10px 15px; color: var(--text-main);">${asig.horas}</td>
          <td style="padding: 10px 15px; text-align: right;">
            <button class="btn-del-mat" data-idx="${index}" style="background: transparent; border: none; color: var(--danger); cursor: pointer; font-size: 1.1rem;">🗑️</button>
          </td>
        `;
        tbodyMaterias.appendChild(tr);
     });

     document.querySelectorAll('.btn-del-mat').forEach(b => {
        b.onclick = () => {
           grado.asignaturas.splice(b.getAttribute('data-idx'), 1);
           renderMaterias();
        };
     });
  }

  if(document.getElementById('btn-add-materia')) {
     document.getElementById('btn-add-materia').onclick = () => {
        const inpN = document.getElementById('ep-nueva-materia');
        const inpH = document.getElementById('ep-nuevas-horas');
        const nombre = inpN.value.toUpperCase().trim();
        const horas = parseInt(inpH.value);
        
        if(!nombre || isNaN(horas) || horas < 1) {
           showConfirm("Atención", "Debes ingresar un nombre y horas válidas.", "danger");
           return;
        }

        const grado = (editingPlan.grados || []).find(g => g.anio === currentYearTab);
        if(grado) {
           grado.asignaturas.push({ nombre, horas });
           inpN.value = '';
           inpH.value = '';
           renderMaterias();
        }
     };
  }

  if(btnGuardarPlan) {
     btnGuardarPlan.onclick = async () => {
        const codigoForm = document.getElementById('ep-codigo').value.trim();
        const esp = document.getElementById('ep-especialidad').value.toUpperCase().trim();
        const men = document.getElementById('ep-mencion').value.toUpperCase().trim();
        const numA = parseInt(document.getElementById('ep-numanios').value) || 1;

        if(!codigoForm || !esp) {
           showConfirm("Atención", "Código y Especialidad son requeridos.", "danger");
           return;
        }

        btnGuardarPlan.disabled = true;
        btnGuardarPlan.innerText = 'Guardando...';

        try {
           // Compute global asignaturas array unique
           const asignaturasSet = new Set();
           (editingPlan.grados || []).forEach(g => {
              g.asignaturas.forEach(a => asignaturasSet.add(a.nombre));
           });

           const planFinal = {
              codigo: parseInt(codigoForm),
              especialidad: esp,
              mencion: men || null,
              numAnios: numA,
              grados: editingPlan.grados,
              asignaturas: Array.from(asignaturasSet)
           };

           const updates = {};
           
           if(editingPlan.isNew) {
              updates[`planes_estudio.${codigoForm}`] = planFinal;
           } else {
              // Edit existing
              if(codigoForm !== editingPlan.oldCodigo) {
                 // Changed code, delete old, create new
                 updates[`planes_estudio.${editingPlan.oldCodigo}`] = deleteField();
                 updates[`planes_estudio.${codigoForm}`] = planFinal;
              } else {
                 updates[`planes_estudio.${codigoForm}`] = planFinal;
              }
           }

           await safeUpdateDoc(doc(db, "sistema", "catalogos_maestros"), updates);
           
           // Reload
           await loadCatalogos();
           vistaEditor.style.display = 'none';
           vistaGrid.style.display = 'block';

        } catch(e) {
           console.error(e);
           showConfirm("Error", "Ocurrió un problema guardando el plan.", "danger");
        } finally {
           btnGuardarPlan.disabled = false;
           btnGuardarPlan.innerText = '💾 Guardar Plan';
        }
     };
  }


  // --- GESTOR DE BD: PLANTELES ---
  const tbodyPlanteles = document.getElementById('tbody-planteles');
  const inpBuscarPlantel = document.getElementById('inp-buscar-plantel');
  const modalPlantel = document.getElementById('modal-plantel');
  const formPlantel = document.getElementById('form-plantel');
  const btnDescargarNominaMun = document.getElementById('btn-descargar-nomina-mun');
  if (btnDescargarNominaMun) {
    btnDescargarNominaMun.addEventListener('click', (e) => {
      e.preventDefault();
      exportarNominaMunicipalExcel();
    });
  }
  let currentPlanteles = []; // Cache of downloaded planteles

  // Subtabs Logic
  document.querySelectorAll('.db-subtab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.db-subtab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.db-subtab').forEach(t => t.style.display = 'none');
      e.target.classList.add('active');
      document.getElementById(e.target.getAttribute('data-target')).style.display = 'block';
      if(e.target.getAttribute('data-target') === 'db-planteles' && currentPlanteles.length === 0) {
        loadPlanteles();
      }
    });
  });

  async function loadPlanteles() {
    if(!tbodyPlanteles) return;
    try {
      tbodyPlanteles.innerHTML = '<tr><td colspan="5" style="padding: 20px; text-align: center; color: var(--text-muted);">Cargando planteles...</td></tr>';

      const userMun = (userData?.rol === 'munadmin') 
        ? (userData?.jerarquia?.municipio || userData?.municipio || '').trim().toUpperCase() 
        : null;

      let q;
      if (userMun) {
        // Zero-Cost Optimization (Spark): munadmin solo consulta los planteles de su municipio
        q = query(collection(db, "planteles"), where("municipio", "==", userMun));
      } else {
        q = collection(db, "planteles");
      }

      const snap = await getDocs(q);
      currentPlanteles = [];
      snap.forEach(doc => {
        const data = doc.data();
        // Doble validación en cliente
        if (userMun) {
          const pMun = (data.municipio || '').trim().toUpperCase();
          if (pMun !== userMun) return;
        }
        currentPlanteles.push({ id: doc.id, ...data });
      });
      renderPlantelesList();
    } catch(err) {
      console.error("Error loading planteles:", err);
      if(tbodyPlanteles) {
        tbodyPlanteles.innerHTML = '<tr><td colspan="5" style="padding: 20px; text-align: center; color: var(--danger);">Error cargando planteles.</td></tr>';
      }
    }
  }

  function renderPlantelesList() {
    if(!tbodyPlanteles) return;
    tbodyPlanteles.innerHTML = '';
    
    const userMun = (userData?.rol === 'munadmin') 
      ? (userData?.jerarquia?.municipio || userData?.municipio || '').trim().toUpperCase() 
      : null;

    if (inpBuscarPlantel && userMun) {
      inpBuscarPlantel.placeholder = `Buscar por DEA o nombre en ${userMun}...`;
    }

    const term = inpBuscarPlantel ? inpBuscarPlantel.value.toLowerCase().trim() : '';
    let filtered = currentPlanteles;

    if (userMun) {
      filtered = filtered.filter(p => (p.municipio || '').trim().toUpperCase() === userMun);
    }

    if(term) {
      filtered = filtered.filter(p => {
         const d = p.codigos?.plantel?.toLowerCase() || '';
         const n = (p['nombre-plantel']?.nominal || '').toLowerCase();
         const m = (p.municipio || '').toLowerCase();
         return d.includes(term) || n.includes(term) || m.includes(term);
      });
    }

    if(filtered.length === 0) {
      const msgVacio = userMun 
        ? `No se encontraron planteles registrados para el municipio ${userMun}.` 
        : 'No se encontraron planteles.';
      tbodyPlanteles.innerHTML = `<tr><td colspan="5" style="padding: 20px; text-align: center; color: var(--text-muted);">${msgVacio}</td></tr>`;
      return;
    }

    filtered.forEach(p => {
       const tr = document.createElement('tr');
       tr.style.borderBottom = '1px solid var(--glass-border)';
       tr.innerHTML = `
         <td style="padding: 15px 20px;">
           <span style="background: rgba(37,99,235,0.1); color: var(--primary-color); padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">${p.codigos?.plantel || 'N/A'}</span>
         </td>
         <td style="padding: 15px 20px; font-weight: 500; color: var(--text-main);">${p['nombre-plantel']?.nominal || 'SIN NOMBRE'}</td>
         <td style="padding: 15px 20px; color: var(--text-muted); font-size: 0.9rem;">${p.municipio || 'N/A'}</td>
         <td style="padding: 15px 20px; color: var(--text-muted); font-size: 0.9rem;">${p.nivel || 'N/A'}</td>
         <td class="plantel-actions-cell">
           <button class="btn-plantel-action btn-edit-plantel" data-id="${p.id}">✏️ Editar</button>
           <button class="btn-plantel-action btn-del-plantel" data-id="${p.id}">🗑️ Eliminar</button>
         </td>
       `;
       tbodyPlanteles.appendChild(tr);
    });

    // Attach events
    document.querySelectorAll('.btn-edit-plantel').forEach(b => {
       b.onclick = () => {
         const id = b.getAttribute('data-id');
         const plantel = currentPlanteles.find(x => x.id === id);
         openPlantelModal(plantel);
       };
    });

    document.querySelectorAll('.btn-del-plantel').forEach(b => {
       b.onclick = async () => {
         const id = b.getAttribute('data-id');
         const plantel = currentPlanteles.find(x => x.id === id);
         const ok = await showConfirm("Eliminar Plantel", `¿Estás seguro de eliminar el plantel ${plantel['nombre-plantel']?.nominal}? Esta acción es irreversible.`, "danger");
         if(ok) {
            try {
              b.disabled = true;
              b.innerText = 'Borrando...';
              await deleteDoc(doc(db, "planteles", id));
              await loadPlanteles();
            } catch(e) {
              console.error(e);
              showConfirm("Error", "Ocurrió un problema eliminando el plantel.", "danger");
            }
         }
       };
    });
  }

  if(inpBuscarPlantel) {
    inpBuscarPlantel.addEventListener('input', renderPlantelesList);
  }

  function asegurarOpcionEnSelect(selectElem, valor) {
    if (!selectElem) return;
    const valUpper = (valor || '').toString().trim().toUpperCase();
    if (!valUpper) {
      selectElem.value = '';
      return;
    }
    const existe = Array.from(selectElem.options).some(opt => opt.value.toUpperCase() === valUpper);
    if (!existe) {
      const opt = document.createElement('option');
      opt.value = valUpper;
      opt.textContent = valUpper;
      selectElem.appendChild(opt);
    }
    selectElem.value = valUpper;
  }

  function poblarSelectoresPlantel() {
    let catData = null;
    try {
      const raw = localStorage.getItem('sgh_catalogos');
      if (raw) catData = JSON.parse(raw);
    } catch(e) {
      console.warn("Aviso leyendo sgh_catalogos de localStorage:", e);
    }

    if (!catData && typeof catalogosGlobal === 'object' && Object.keys(catalogosGlobal).length > 0) {
      catData = catalogosGlobal;
    }

    if (!catData || typeof catData !== 'object') {
      catData = {};
    }

    const ld = catData.listas_desplegables || {};

    // 1. Ubicación Geográfica desde sgh_catalogos
    const ubicaciones = (Array.isArray(catData.ubicacion) && catData.ubicacion.length > 0) 
      ? catData.ubicacion 
      : (Array.isArray(ld.ubicacion) && ld.ubicacion.length > 0 ? ld.ubicacion : ["URBANO", "RURAL"]);
    const selUbicacion = document.getElementById('p-ubicacion');
    if (selUbicacion) {
      selUbicacion.innerHTML = '<option value="">-- SELECCIONE UBICACIÓN --</option>' +
        ubicaciones.map(u => `<option value="${u}">${u}</option>`).join('');
    }

    // 2. Nivel Educativo desde sgh_catalogos
    const niveles = (Array.isArray(ld.niveles_educativos) && ld.niveles_educativos.length > 0)
      ? ld.niveles_educativos
      : (Array.isArray(catData.nivel_modalidad?.niveles) ? catData.nivel_modalidad.niveles : []);
    const selNivel = document.getElementById('p-nivel');
    if (selNivel) {
      selNivel.innerHTML = '<option value="">-- SELECCIONE NIVEL --</option>' +
        niveles.map(n => `<option value="${n}">${n}</option>`).join('');
    }

    // 3. Modalidad desde sgh_catalogos
    const modalidades = (Array.isArray(ld.modalidades) && ld.modalidades.length > 0)
      ? ld.modalidades
      : (Array.isArray(catData.nivel_modalidad?.modalidades) ? catData.nivel_modalidad.modalidades : []);
    const selModalidad = document.getElementById('p-modalidad');
    if (selModalidad) {
      selModalidad.innerHTML = '<option value="">-- NINGUNA / REGULAR --</option>' +
        modalidades.map(m => `<option value="${m}">${m}</option>`).join('');
    }

    // 4. Turnos desde sgh_catalogos
    const turnos = (Array.isArray(catData.turnos) && catData.turnos.length > 0)
      ? catData.turnos
      : (Array.isArray(ld.turnos) && ld.turnos.length > 0 ? ld.turnos : ["MAÑANA", "TARDE", "DOBLE TURNO", "NOCTURNO", "SABATINO"]);
    const selTurno = document.getElementById('p-turno');
    if (selTurno) {
      selTurno.innerHTML = '<option value="">-- SELECCIONE TURNO --</option>' +
        turnos.map(t => `<option value="${t}">${t}</option>`).join('');
    }

    // 5. Dependencia desde sgh_catalogos
    const dependencias = (Array.isArray(ld.dependencia) && ld.dependencia.length > 0)
      ? ld.dependencia
      : (Array.isArray(catData.dependencia) && catData.dependencia.length > 0 ? catData.dependencia : ["NACIONAL", "ESTADAL", "MUNICIPAL", "SUBVENCIONADA", "PRIVADO", "AUTONOMA"]);
    const selDep = document.getElementById('p-dependencia');
    if (selDep) {
      const valActual = selDep.value;
      selDep.innerHTML = '<option value="">-- SELECCIONE DEPENDENCIA --</option>' +
        dependencias.map(d => `<option value="${d}">${d}</option>`).join('');
      if (valActual) selDep.value = valActual;
    }
  }

  // Inicializar selectores desde sgh_catalogos
  poblarSelectoresPlantel();

  // --- GESTOR DE PLANES DE ESTUDIO DEL PLANTEL ---
  const PLANES_ESTUDIO_FALLBACK = {
    "20000": { codigo: 20000, especialidad: null, mencion: null, nombre: "EDUCACIÓN INICIAL" },
    "21000": { codigo: 21000, especialidad: null, mencion: null, nombre: "EDUCACIÓN PRIMARIA" },
    "31059": { codigo: 31059, especialidad: "MEDIA GENERAL", mencion: "CIENCIAS" },
    "31060": { codigo: 31060, especialidad: "MEDIA GENERAL", mencion: "CIENCIAS Y TECNOLOGIA" },
    "41048": { codigo: 41048, especialidad: "AGROPECUARIA", mencion: "ECOTURISMO" },
    "41049": { codigo: 41049, especialidad: "AGROPECUARIA", mencion: "CIENCIAS AGRÍCOLAS Y PECUARIAS" },
    "41052": { codigo: 41052, especialidad: "AGROPECUARIA", mencion: "TECNOLOGÍA DE LOS ALIMENTOS" },
    "41056": { codigo: 41056, especialidad: "AGROPECUARIA", mencion: "CIENCIAS AGRÍCOLAS, OPCIÓN CACAO" },
    "42000": { codigo: 42000, especialidad: "HIDROCARBUROS", mencion: "PETRÓLEO Y GAS NATURAL" },
    "43291": { codigo: 43291, especialidad: "INDUSTRIAL", mencion: "ELECTRÓNICA" },
    "43292": { codigo: 43292, especialidad: "INDUSTRIAL", mencion: "CONSTRUCCIÓN CIVIL" },
    "43293": { codigo: 43293, especialidad: "INDUSTRIAL", mencion: "MECÁNICA TÉRMICA" },
    "43294": { codigo: 43294, especialidad: "INDUSTRIAL", mencion: "MECATRONICA" },
    "43295": { codigo: 43295, especialidad: "INDUSTRIAL", mencion: "METALMECÁNICA" },
    "43298": { codigo: 43298, especialidad: "INDUSTRIAL", mencion: "TELEMATICA" },
    "44001": { codigo: 44001, especialidad: "TRANSPORTE MULTIMODAL", mencion: "TRANSPORTE TERRESTRE" },
    "44004": { codigo: 44004, especialidad: "TRANSPORTE MULTIMODAL", mencion: "AERONÁUTICAS, OPCIÓN SERVICIOS AÉREOS" },
    "45041": { codigo: 45041, especialidad: "SALUD", mencion: "ENFERMERÍA" },
    "45043": { codigo: 45043, especialidad: "SALUD", mencion: "FARMACIA" },
    "45045": { codigo: 45045, especialidad: "SALUD", mencion: "LABORATORIO CLÍNICO" },
    "45049": { codigo: 45049, especialidad: "SALUD", mencion: "REGISTRO Y ESTADÍSTICA DE SALUD" },
    "46067": { codigo: 46067, especialidad: "ECONOMÍA SOCIAL", mencion: "ADMINISTRACIÓN" },
    "46068": { codigo: 46068, especialidad: "ECONOMÍA SOCIAL", mencion: "ADUANA" },
    "46069": { codigo: 46069, especialidad: "ECONOMÍA SOCIAL", mencion: "ECONOMÍA DIGITAL" },
    "46070": { codigo: 46070, especialidad: "ECONOMÍA SOCIAL", mencion: "CONTABILIDAD" },
    "46071": { codigo: 46071, especialidad: "ECONOMÍA SOCIAL", mencion: "TURISMO" },
    "48069": { codigo: 48069, especialidad: "ARTE", mencion: "ARTES AUDIOVISUALES" },
    "49000": { codigo: 49000, especialidad: "EDUCACIÓN FÍSICA", mencion: "PROMOCIÓN DEL ENTRENAMIENTO DEPORTIVO" },
    "49001": { codigo: 49001, especialidad: "EDUCACIÓN FÍSICA", mencion: "PROMOCIÓN DE LA ACTIVIDAD FÍSICA Y RECREACIÓN" }
  };

  function obtenerPlanesEstudioCatalogo() {
    let planes = null;
    try {
      const raw = localStorage.getItem('sgh_catalogos');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.planes_estudio && Object.keys(parsed.planes_estudio).length > 0) {
          planes = parsed.planes_estudio;
        }
      }
    } catch(e) {}
    if (!planes && typeof catalogosGlobal === 'object' && catalogosGlobal.planes_estudio && Object.keys(catalogosGlobal.planes_estudio).length > 0) {
      planes = catalogosGlobal.planes_estudio;
    }
    return planes || PLANES_ESTUDIO_FALLBACK;
  }

  function actualizarContadorPlanes() {
    const total = document.querySelectorAll('.chk-plan-item:checked').length;
    const badge = document.getElementById('p-planes-counter');
    if (badge) {
      badge.textContent = `${total} seleccionado${total === 1 ? '' : 's'}`;
    }
  }

  function poblarCheckboxesPlanes(planesActivos = {}) {
    const container = document.getElementById('plantel-planes-container');
    if (!container) return;
    
    const allPlanes = obtenerPlanesEstudioCatalogo();
    container.innerHTML = '';

    const keys = Object.keys(allPlanes).sort((a, b) => Number(a) - Number(b));
    if (keys.length === 0) {
      container.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem; grid-column: 1 / -1; margin:0;">No hay planes de estudio registrados.</p>';
      actualizarContadorPlanes();
      return;
    }

    keys.forEach(planCod => {
      const planData = allPlanes[planCod] || {};
      const isChecked = Boolean(planesActivos && (planesActivos.hasOwnProperty(planCod) || planesActivos[planCod] !== undefined));
      
      let desc = '';
      if (planCod === '20000') desc = 'EDUCACIÓN INICIAL';
      else if (planCod === '21000') desc = 'EDUCACIÓN PRIMARIA';
      else if (planData.mencion && planData.especialidad) desc = `${planData.especialidad} - ${planData.mencion}`;
      else if (planData.mencion) desc = planData.mencion;
      else if (planData.especialidad) desc = planData.especialidad;
      else if (planData.nombre) desc = planData.nombre;
      else desc = 'PLAN REGULAR';

      const label = document.createElement('label');
      label.style.cssText = `
        display: flex;
        align-items: flex-start;
        gap: 8px;
        font-size: 0.8rem;
        cursor: pointer;
        padding: 8px 10px;
        border-radius: 6px;
        background: white;
        border: 1px solid #e2e8f0;
        transition: all 0.15s ease;
      `;
      label.onmouseover = () => { label.style.borderColor = 'var(--primary-color)'; label.style.background = '#f1f5f9'; };
      label.onmouseout = () => { label.style.borderColor = '#e2e8f0'; label.style.background = 'white'; };

      label.innerHTML = `
        <input type="checkbox" class="chk-plan-item" value="${planCod}" ${isChecked ? 'checked' : ''}
          style="margin-top: 2px; width: 16px; height: 16px; cursor: pointer; accent-color: var(--primary-color);">
        <div style="line-height: 1.25;">
          <strong style="color: var(--text-main); font-size: 0.85rem; display: block;">${planCod}</strong>
          <span style="color: var(--text-muted); font-size: 0.72rem; display: block; margin-top: 2px;">${desc}</span>
        </div>
      `;

      const inputChk = label.querySelector('input');
      inputChk.addEventListener('change', actualizarContadorPlanes);

      container.appendChild(label);
    });

    actualizarContadorPlanes();
  }

  function cerrarModalPlantel() {
     if (modalPlantel) {
       modalPlantel.style.display = 'none';
       modalPlantel.scrollTop = 0;
       if (modalPlantel.scrollTo) modalPlantel.scrollTo(0, 0);
       const card = modalPlantel.querySelector('.lock-card');
       if (card) {
         card.scrollTop = 0;
         if (card.scrollTo) card.scrollTo(0, 0);
       }
       const planesContainer = document.getElementById('plantel-planes-container');
       if (planesContainer) {
         planesContainer.scrollTop = 0;
         if (planesContainer.scrollTo) planesContainer.scrollTo(0, 0);
       }
     }
  }

  function openPlantelModal(plantel = null) {
     formPlantel.reset();
     document.getElementById('p-uid').value = '';
     document.getElementById('modal-plantel-title').innerText = plantel ? 'Editar Plantel' : 'Nuevo Plantel';
     
     // Poblar los selectores dinámicamente desde sgh_catalogos
     poblarSelectoresPlantel();

     const userMun = (userData?.rol === 'munadmin') 
       ? (userData?.jerarquia?.municipio || userData?.municipio || '').trim().toUpperCase() 
       : null;
     const inpMun = document.getElementById('p-municipio');

     if(plantel) {
       document.getElementById('p-uid').value = plantel.id;
       document.getElementById('p-codigo').value = plantel.codigos?.plantel || '';
       document.getElementById('p-estadistico').value = plantel.codigos?.estadistico || '';
       document.getElementById('p-denominacion').value = plantel.denominacion || '';
       document.getElementById('p-nominal').value = plantel['nombre-plantel']?.nominal || '';
       document.getElementById('p-eponimo').value = plantel['nombre-plantel']?.nuevo_eponimo || plantel['nombre-plantel']?.['nuevo-eponimo'] || '';
       if (inpMun) {
         inpMun.value = plantel.municipio || userMun || '';
         inpMun.readOnly = !!userMun;
       }
       document.getElementById('p-parroquia').value = plantel.parroquia || '';
       
       // Dependencia desde sgh_catalogos
       asegurarOpcionEnSelect(document.getElementById('p-dependencia'), plantel.dependencia || 'NACIONAL');
       document.getElementById('p-cod-dependencia').value = plantel.codigos?.dependencia?.[0] || '';
       
       // Ubicación Geográfica
       const ubicVal = plantel['ubicacion-geografica'] || plantel.ubicacion || '';
       asegurarOpcionEnSelect(document.getElementById('p-ubicacion'), ubicVal);

       // Nivel
       const nivelVal = plantel.nivel || '';
       asegurarOpcionEnSelect(document.getElementById('p-nivel'), nivelVal);

       // Modalidad
       const modVal = plantel.modalidad || '';
       asegurarOpcionEnSelect(document.getElementById('p-modalidad'), modVal);

       // Turno
       const turnoVal = plantel['turno-plantel'] || plantel.turno || '';
       asegurarOpcionEnSelect(document.getElementById('p-turno'), turnoVal);

       // Metros Cuadrados
       const m2Val = (plantel.metros2 !== undefined && plantel.metros2 !== null) ? plantel.metros2 :
                     ((plantel['metros-cuadrados'] !== undefined && plantel['metros-cuadrados'] !== null) ? plantel['metros-cuadrados'] : (plantel.metros_cuadrados ?? ''));
       document.getElementById('p-metros-cuadrados').value = (m2Val !== '' && m2Val !== null && m2Val !== undefined) ? m2Val : '';

       // Observaciones
       document.getElementById('p-observaciones').value = plantel.observaciones || '';

       // Planes de Estudio activos del plantel
       const planesDelPlantel = plantel['planes-estudio'] || plantel.planes_estudio || {};
       poblarCheckboxesPlanes(planesDelPlantel);

     } else {
       if (inpMun) {
         if (userMun) {
           inpMun.value = userMun;
           inpMun.readOnly = true;
         } else {
           inpMun.value = '';
           inpMun.readOnly = false;
         }
       }
       document.getElementById('p-ubicacion').value = '';
       document.getElementById('p-nivel').value = '';
       document.getElementById('p-modalidad').value = '';
       document.getElementById('p-turno').value = '';
       document.getElementById('p-metros-cuadrados').value = '';
       document.getElementById('p-observaciones').value = '';
       
       // Sin planes para nuevo plantel
       poblarCheckboxesPlanes({});
     }
     
     modalPlantel.style.display = 'flex';
     const resetScroll = () => {
       modalPlantel.scrollTop = 0;
       if (modalPlantel.scrollTo) modalPlantel.scrollTo(0, 0);
       const card = modalPlantel.querySelector('.lock-card');
       if (card) {
         card.scrollTop = 0;
         if (card.scrollTo) card.scrollTo(0, 0);
       }
       const planesContainer = document.getElementById('plantel-planes-container');
       if (planesContainer) {
         planesContainer.scrollTop = 0;
         if (planesContainer.scrollTo) planesContainer.scrollTo(0, 0);
       }
     };
     resetScroll();
     requestAnimationFrame(() => {
       resetScroll();
       setTimeout(resetScroll, 50);
       setTimeout(resetScroll, 150);
     });
  }

  if(document.getElementById('btn-nuevo-plantel')) {
    document.getElementById('btn-nuevo-plantel').addEventListener('click', () => openPlantelModal(null));
  }
  
  if(document.getElementById('btn-cerrar-modal-plantel')) {
    document.getElementById('btn-cerrar-modal-plantel').addEventListener('click', cerrarModalPlantel);
  }
  if(document.getElementById('btn-cancelar-plantel')) {
    document.getElementById('btn-cancelar-plantel').addEventListener('click', cerrarModalPlantel);
  }
  if(modalPlantel) {
    modalPlantel.addEventListener('click', (e) => {
      if(e.target === modalPlantel) cerrarModalPlantel();
    });
  }

  if(formPlantel) {
    formPlantel.addEventListener('submit', async (e) => {
       e.preventDefault();
       
       // Al dar clic en guardar, ubicarse al principio del modal de inmediato
       if (modalPlantel) {
         modalPlantel.scrollTop = 0;
         if (modalPlantel.scrollTo) modalPlantel.scrollTo({ top: 0, behavior: 'smooth' });
         const card = modalPlantel.querySelector('.lock-card');
         if (card) {
           card.scrollTop = 0;
           if (card.scrollTo) card.scrollTo({ top: 0, behavior: 'smooth' });
         }
       }

       const id = document.getElementById('p-uid').value;
       const isEdit = !!id;
       const btn = document.getElementById('btn-guardar-plantel');
       
       const codP = document.getElementById('p-codigo').value.toUpperCase();
       
       const userMun = (userData?.rol === 'munadmin') 
         ? (userData?.jerarquia?.municipio || userData?.municipio || '').trim().toUpperCase() 
         : null;
       const munFinal = userMun || document.getElementById('p-municipio').value.toUpperCase().trim();
       
       const metros2Raw = document.getElementById('p-metros-cuadrados').value;
       const metros2Val = metros2Raw !== '' ? (parseFloat(metros2Raw) || 0) : null;
       const ubicacionVal = document.getElementById('p-ubicacion').value.trim().toUpperCase();
       const nivelVal = document.getElementById('p-nivel').value.trim().toUpperCase();
       const modalidadVal = document.getElementById('p-modalidad').value.trim().toUpperCase();
       const turnoVal = document.getElementById('p-turno').value.trim().toUpperCase();
       const obsVal = document.getElementById('p-observaciones').value.trim();

       // Recolectar planes de estudio seleccionados
       const planesCatalogo = obtenerPlanesEstudioCatalogo();
       const planesSelected = {};
       document.querySelectorAll('.chk-plan-item:checked').forEach(chk => {
         const cod = chk.value;
         const pData = planesCatalogo[cod] || {};
         if (cod === '20000' || cod === '21000') {
           planesSelected[cod] = {
             especialidad: null,
             mencion: null
           };
         } else {
           planesSelected[cod] = {
             especialidad: pData.especialidad !== undefined ? pData.especialidad : null,
             mencion: pData.mencion !== undefined ? pData.mencion : null
           };
         }
       });

       const newData = {
          "municipio": munFinal,
          "parroquia": document.getElementById('p-parroquia').value.toUpperCase(),
          "denominacion": document.getElementById('p-denominacion').value.toUpperCase(),
          "nombre-plantel": {
            "nominal": document.getElementById('p-nominal').value.toUpperCase(),
            "nuevo-eponimo": document.getElementById('p-eponimo').value.toUpperCase()
          },
          "codigos": {
            "plantel": codP,
            "estadistico": Number(document.getElementById('p-estadistico').value) || 0,
            "dependencia": [ Number(document.getElementById('p-cod-dependencia').value) || 0 ]
          },
          "dependencia": document.getElementById('p-dependencia').value,
          "ubicacion-geografica": ubicacionVal,
          "nivel": nivelVal,
          "modalidad": modalidadVal,
          "turno-plantel": turnoVal,
          "metros2": metros2Val,
          "observaciones": obsVal,
          "planes-estudio": planesSelected
       };

       if (isEdit) {
          newData["planes_estudio"] = deleteField();
          newData["ubicacion"] = deleteField();
          newData["turno"] = deleteField();
       }

       try {
         btn.disabled = true;
         btn.innerText = 'Guardando...';
         
         if(isEdit) {
            // Check if user changed the DEA Code (which is the document ID).
            if (codP !== id) {
               // We need to create a new doc and copy existing data, then delete old doc.
               // For safety, we should fetch the full old doc first to preserve matricula/secciones.
               const oldDocSnap = await getDoc(doc(db, "planteles", id));
               if (oldDocSnap.exists()) {
                   const oldData = oldDocSnap.data();
                   newData['matricula'] = oldData['matricula'] || {};
                   newData['secciones-planes'] = oldData['secciones-planes'] || {};
                   
                   await safeSetDoc(doc(db, "planteles", codP), newData);
                   await deleteDoc(doc(db, "planteles", id));
               }
            } else {
               await safeUpdateDoc(doc(db, "planteles", id), newData);
            }
         } else {
            newData['matricula'] = {};
            newData['secciones-planes'] = {};
            await safeSetDoc(doc(db, "planteles", codP), newData);
         }
         
         cerrarModalPlantel();
         await loadPlanteles(); // reload table
         
       } catch(err) {
         console.error(err);
         showConfirm("Error", "Ocurrió un problema guardando el plantel.", "danger");
       } finally {
         btn.disabled = false;
         btn.innerText = 'Guardar Plantel';
       }
    });
  }



  
  // --- MODULO: LISTAS MAESTRAS ---
  window.loadListasMaestras = async function(nombreLista, tipo) {
      if (typeof catalogosGlobal === 'undefined' || !catalogosGlobal || (!catalogosGlobal.listas_desplegables && !catalogosGlobal.situacion_laboral)) {
        try {
          const snap = await getDoc(doc(db, "sistema", "catalogos_maestros"));
          if (snap.exists()) {
            catalogosGlobal = snap.data();
          }
        } catch (e) {
          console.error(e);
          showConfirm("Error", "Ocurrió un problema cargando las listas.", "danger");
          return;
        }
      }
      
      // En vez de construir un menú selector, vamos directo al editor
      if (nombreLista && tipo) {
          window.renderEditorLista(nombreLista, tipo, null);
      }
  };

  window.renderEditorLista = function(nombre, tipo, selectedBtn) {
      const container = document.getElementById('lista-editor-container');
      const titulo = document.getElementById('lista-titulo');
      const body = document.getElementById('lista-editor-body');
      
      container.style.display = 'block';
      titulo.innerText = nombre.replace(/_/g, ' ').toUpperCase();
      body.innerHTML = '';
      
      const btnAdd = document.getElementById('btn-add-lista');
      if(btnAdd) {
          btnAdd.onclick = async () => {
              if(tipo === 'array') {
                  const val = await showPrompt('Nuevo Valor', 'Ingrese el valor para añadir a la lista:');
                  if(val && val.trim()) {
                      if(!catalogosGlobal.listas_desplegables[nombre]) catalogosGlobal.listas_desplegables[nombre] = [];
                      catalogosGlobal.listas_desplegables[nombre].push(val.trim().toUpperCase());
                      window.renderEditorLista(nombre, tipo, selectedBtn);
                      document.getElementById('btn-guardar-listas').style.display = 'block';
                  }
              } else if (tipo === 'object') {
                  const res = await showPromptDual('Añadir Situación Laboral', 'Ingrese la clave corta y su descripción correspondiente:', '', '');
                  if(res && res.key.trim() && res.val.trim()) {
                      let k = res.key.trim().toUpperCase();
                      if(!catalogosGlobal[nombre]) catalogosGlobal[nombre] = {};
                      if(catalogosGlobal[nombre][k]) {
                          showConfirm("Atención", "Esa clave ya existe en la lista.", "danger");
                          return;
                      }
                      catalogosGlobal[nombre][k] = res.val.trim().toUpperCase();
                      window.renderEditorLista(nombre, tipo, selectedBtn);
                      document.getElementById('btn-guardar-listas').style.display = 'block';
                  }
              }
          };
      }
      
      if(tipo === 'array') {
          const lista = catalogosGlobal.listas_desplegables[nombre] || [];
          lista.forEach((item, index) => {
              const card = document.createElement('div');
              card.style.cssText = 'background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); display: flex; flex-direction: column; justify-content: space-between; transition: transform 0.2s ease, box-shadow 0.2s ease;';
              card.onmouseenter = () => { card.style.transform = 'translateY(-2px)'; card.style.boxShadow = '0 5px 15px rgba(0,0,0,0.08)'; };
              card.onmouseleave = () => { card.style.transform = 'translateY(0)'; card.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; };
              
              const contentDiv = document.createElement('div');
              const h4 = document.createElement('h4');
              h4.style.margin = '0 0 10px';
              h4.style.color = 'var(--text-main)';
              h4.style.fontSize = '1.05rem';
              h4.style.fontWeight = 'bold';
              h4.style.lineHeight = '1.4';
              h4.innerText = item;
              contentDiv.appendChild(h4);
              
              const btnDiv = document.createElement('div');
              btnDiv.style.display = 'flex';
              btnDiv.style.gap = '10px';
              btnDiv.style.marginTop = '20px';
              
              const btnEdit = document.createElement('button');
              btnEdit.innerHTML = '✏️ Editar';
              btnEdit.style.cssText = 'flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; color: var(--primary-color); padding: 8px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.85rem;';
              btnEdit.onclick = async () => {
                  const newVal = await showPrompt('Editar Valor', 'Modifique el valor:', item);
                  if(newVal && newVal.trim() && newVal.trim().toUpperCase() !== item) {
                      catalogosGlobal.listas_desplegables[nombre][index] = newVal.trim().toUpperCase();
                      window.renderEditorLista(nombre, tipo, selectedBtn);
                      document.getElementById('btn-guardar-listas').style.display = 'block';
                  }
              };
              
              const btnDel = document.createElement('button');
              btnDel.innerHTML = '🗑️ Eliminar';
              btnDel.style.cssText = 'flex: 1; background: #fee2e2; border: 1px solid #fecaca; color: #dc2626; padding: 8px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.85rem;';
              btnDel.onclick = async () => {
                  if(await showConfirm('Eliminar ítem', '¿Seguro que deseas eliminar este elemento de la lista?')) {
                      catalogosGlobal.listas_desplegables[nombre].splice(index, 1);
                      window.renderEditorLista(nombre, tipo, selectedBtn);
                      document.getElementById('btn-guardar-listas').style.display = 'block';
                  }
              };
              
              btnDiv.appendChild(btnEdit);
              btnDiv.appendChild(btnDel);
              
              card.appendChild(contentDiv);
              card.appendChild(btnDiv);
              body.appendChild(card);
          });
      }
      
      if (tipo === 'object') {
          const obj = catalogosGlobal[nombre] || {};
          for(let key of Object.keys(obj)) {
              const card = document.createElement('div');
              card.style.cssText = 'background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); display: flex; flex-direction: column; justify-content: space-between; transition: transform 0.2s ease, box-shadow 0.2s ease;';
              card.onmouseenter = () => { card.style.transform = 'translateY(-2px)'; card.style.boxShadow = '0 5px 15px rgba(0,0,0,0.08)'; };
              card.onmouseleave = () => { card.style.transform = 'translateY(0)'; card.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; };
              
              const contentDiv = document.createElement('div');
              
              const headerDiv = document.createElement('div');
              headerDiv.style.display = 'flex';
              headerDiv.style.justifyContent = 'space-between';
              headerDiv.style.alignItems = 'start';
              headerDiv.style.marginBottom = '10px';
              
              const badge = document.createElement('span');
              badge.style.cssText = 'background: rgba(37,99,235,0.1); color: var(--primary-color); padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold;';
              badge.innerText = key;
              headerDiv.appendChild(badge);
              
              const h4 = document.createElement('h4');
              h4.style.margin = '0 0 5px';
              h4.style.color = 'var(--text-main)';
              h4.style.fontSize = '0.95rem';
              h4.style.lineHeight = '1.4';
              h4.innerText = obj[key];
              
              contentDiv.appendChild(headerDiv);
              contentDiv.appendChild(h4);
              
              const btnDiv = document.createElement('div');
              btnDiv.style.display = 'flex';
              btnDiv.style.gap = '10px';
              btnDiv.style.marginTop = '20px';
              
              const btnEdit = document.createElement('button');
              btnEdit.innerHTML = '✏️ Editar';
              btnEdit.style.cssText = 'flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; color: var(--primary-color); padding: 8px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.85rem;';
              btnEdit.onclick = async () => {
                  const res = await showPromptDual('Editar Situación Laboral', 'Modifique la clave y/o descripción:', key, obj[key]);
                  if(!res || !res.key.trim() || !res.val.trim()) return;
                  
                  let k = res.key.trim().toUpperCase();
                  let newVal = res.val.trim().toUpperCase();
                  
                  if(k !== key) {
                      if(catalogosGlobal[nombre][k]) {
                          showConfirm("Atención", "Esa clave ya existe en la lista.", "danger");
                          return;
                      }
                      catalogosGlobal[nombre][k] = newVal;
                      delete catalogosGlobal[nombre][key];
                  } else {
                      catalogosGlobal[nombre][key] = newVal;
                  }
                  
                  window.renderEditorLista(nombre, tipo, selectedBtn);
                  document.getElementById('btn-guardar-listas').style.display = 'block';
              };
              
              const btnDel = document.createElement('button');
              btnDel.innerHTML = '🗑️ Eliminar';
              btnDel.style.cssText = 'flex: 1; background: #fee2e2; border: 1px solid #fecaca; color: #dc2626; padding: 8px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.85rem;';
              btnDel.onclick = async () => {
                  if(await showConfirm('Eliminar Clave', '¿Seguro que quieres eliminar esta situación laboral? Esto podría afectar a los empleados que ya la tengan asignada.')) {
                      delete catalogosGlobal[nombre][key];
                      window.renderEditorLista(nombre, tipo, selectedBtn);
                      document.getElementById('btn-guardar-listas').style.display = 'block';
                  }
              };
              
              btnDiv.appendChild(btnEdit);
              btnDiv.appendChild(btnDel);
              
              card.appendChild(contentDiv);
              card.appendChild(btnDiv);
              body.appendChild(card);
          }
      }
  };

  const btnGuardarListas = document.getElementById('btn-guardar-listas');
  if(btnGuardarListas) {
      btnGuardarListas.addEventListener('click', async () => {
          btnGuardarListas.innerText = 'Guardando...';
          btnGuardarListas.disabled = true;
          try {
              catalogosGlobal.ultima_actualizacion = new Date().toISOString();
              await safeSetDoc(doc(db, "sistema", "catalogos_maestros"), catalogosGlobal);
              btnGuardarListas.innerText = '✅ Guardado Exitoso';
              btnGuardarListas.style.background = '#10b981';
              setTimeout(() => {
                  btnGuardarListas.style.display = 'none';
                  btnGuardarListas.innerText = '💾 Guardar Cambios';
                  btnGuardarListas.disabled = false;
                  btnGuardarListas.style.background = 'var(--success)';
              }, 2000);
          } catch(err) {
              console.error(err);
              showConfirm("Error", "Ocurrió un problema al guardar los cambios.", "danger");
              btnGuardarListas.innerText = '💾 Guardar Cambios';
              btnGuardarListas.disabled = false;
          }
      });
  }

  // --- EXPORTACIÓN DE NÓMINA MUNICIPAL A EXCEL (.XLSX) ---
  const modalSelMunNomina = document.getElementById('modal-seleccionar-municipio-nomina');
  const selMunNomina = document.getElementById('sel-municipio-nomina-modal');
  const btnCancelarSelMunNomina = document.getElementById('btn-cancelar-sel-mun-nomina');
  const btnConfirmarSelMunNomina = document.getElementById('btn-confirmar-sel-mun-nomina');

  function cerrarModalSelMunNomina() {
    if (modalSelMunNomina) modalSelMunNomina.style.display = 'none';
  }

  if (btnCancelarSelMunNomina) btnCancelarSelMunNomina.addEventListener('click', cerrarModalSelMunNomina);
  if (modalSelMunNomina) {
    modalSelMunNomina.addEventListener('click', (e) => {
      if (e.target === modalSelMunNomina) cerrarModalSelMunNomina();
    });
  }

  if (btnConfirmarSelMunNomina) {
    btnConfirmarSelMunNomina.addEventListener('click', () => {
      const munElegido = selMunNomina ? selMunNomina.value.trim().toUpperCase() : '';
      if (!munElegido) {
        showToast("Por favor, seleccione un municipio para continuar.", "warning");
        return;
      }
      cerrarModalSelMunNomina();
      exportarNominaMunicipalExcel(munElegido);
    });
  }

  async function exportarNominaMunicipalExcel(municipioForzado = null) {
    if (window._isExportingExcelMun) {
      showToast("Generando nómina municipal en Excel, por favor espere...", "info");
      return;
    }

    // 1. Determinar el municipio objetivo
    let userMun = municipioForzado || (userData?.jerarquia?.municipio || userData?.municipio || '').trim().toUpperCase();

    // Si es un rol zonal o superadmin que no tiene un municipio exclusivo asignado, pedirle que seleccione el municipio
    if (!userMun) {
      if (modalSelMunNomina && selMunNomina) {
        selMunNomina.innerHTML = '<option value="">-- SELECCIONE MUNICIPIO --</option>' +
          MUNICIPIOS_MERIDA.map(m => `<option value="${m}">${m}</option>`).join('');
        modalSelMunNomina.style.display = 'flex';
      } else {
        showAlert("Aviso", "No se detectó el municipio a exportar.", "warning");
      }
      return;
    }

    window._isExportingExcelMun = true;

    try {
      showToast(`Generando nómina del Municipio ${userMun}...`, "info", 4000);

      // 2. Consultar el personal registrado en dicho municipio (Zero-Cost / Indexado)
      const qPersonal = query(collection(db, 'cargos_personal'), where('municipio', '==', userMun));
      const snapPersonal = await getDocs(qPersonal);

      if (snapPersonal.empty) {
        showAlert("Aviso", `No se encontraron funcionarios registrados en la nómina del municipio ${userMun}.`, "info");
        return;
      }

      // 3. Obtener o consolidar los datos maestros de los planteles del municipio
      const plantelesMap = new Map();
      if (Array.isArray(currentPlanteles) && currentPlanteles.length > 0) {
        currentPlanteles.forEach(p => {
          const cod = (p.codigos?.plantel || p.codigoDEA || p.id || '').toString().trim().toUpperCase();
          if (cod) plantelesMap.set(cod, p);
        });
      }

      // Si la memoria local no tiene los planteles cargados, consultarlos de una sola vez
      if (plantelesMap.size === 0) {
        try {
          const snapPlanteles = await getDocs(query(collection(db, "planteles"), where("municipio", "==", userMun)));
          snapPlanteles.forEach(docSnap => {
            const pData = docSnap.data();
            const cod = (pData.codigos?.plantel || pData.codigoDEA || docSnap.id || '').toString().trim().toUpperCase();
            if (cod) plantelesMap.set(cod, { id: docSnap.id, ...pData });
          });
        } catch (errP) {
          console.warn("Aviso consultando planteles del municipio:", errP);
        }
      }

      // 4. Extraer lista de funcionarios y ordenar por Código de Plantel (Código DEA) ascendente
      const listaPersonal = snapPersonal.docs.map(d => ({ id: d.id, ...d.data() }));

      listaPersonal.sort((a, b) => {
        const deaA = (a['codigo-plantel'] || a.codigoDEA || '').toString().trim().toUpperCase();
        const deaB = (b['codigo-plantel'] || b.codigoDEA || '').toString().trim().toUpperCase();
        const compDEA = deaA.localeCompare(deaB);
        if (compDEA !== 0) return compDEA;

        // Orden secundario: Apellidos y Nombres o Cédula
        const nomA = (a['nombre-apellido'] || a['apellidos-nombres'] || a.nombre || '').toString().trim().toUpperCase();
        const nomB = (b['nombre-apellido'] || b['apellidos-nombres'] || b.nombre || '').toString().trim().toUpperCase();
        return nomA.localeCompare(nomB);
      });

      // 5. Mapear exhaustivamente las 55 columnas institucionales oficiales
      const filasExcel = listaPersonal.map((emp, index) => {
        const deaEmp = (emp['codigo-plantel'] || emp.codigoDEA || '').toString().trim().toUpperCase();
        const pInfo = plantelesMap.get(deaEmp) || {};

        // Datos enriquecidos del plantel
        const pDenominacion = pInfo.denominacion || '';
        const pNombreNominal = pInfo['nombre-plantel']?.nominal || '';
        const pNuevoEponimo = pInfo['nombre-plantel']?.['nuevo-eponimo'] || pInfo['nombre-plantel']?.nuevo_eponimo || '';

        let codDep = pInfo.codigos?.dependencia;
        if (Array.isArray(codDep)) codDep = codDep.join(', ');
        const pCodDependencia = codDep || '';

        const pCodEstadistico = pInfo.codigos?.estadistico || '';
        const pDependencia = pInfo.dependencia || emp['dependencia'] || '';
        const pNivelesMod = pInfo.nivel || '';
        const pTurnos = pInfo['turno-plantel'] || '';
        const pUbicacion = pInfo['ubicacion-geografica'] || '';

        // Datos personales del funcionario
        const cedulaNum = emp['cedula-identidad'] || emp.cedula || '';
        const nacionalidad = emp['nacionalidad'] || (String(cedulaNum).startsWith('E') ? 'E' : 'V');

        const priNombre = emp['primer-nombre'] || emp.primer_nombre || '';
        const segNombre = emp['segundo-nombre'] || emp.segundo_nombre || '';
        const priApellido = emp['primer-apellido'] || emp.primer_apellido || '';
        const segApellido = emp['segundo-apellido'] || emp.segundo_apellido || '';
        
        let nombreCompleto = emp['nombre-apellido'] || emp['apellidos-nombres'] || emp.nombre || '';
        if (!nombreCompleto) {
          nombreCompleto = `${priApellido} ${segApellido} ${priNombre} ${segNombre}`.trim().replace(/\s+/g, ' ');
        }

        const horasAcad = Number(emp['horas-academicas']) || 0;
        const horasAdmin = Number(emp['horas-administrativas']) || 0;

        return {
          'N°': index + 1,
          // 1. Identificación y Datos Personales
          'Nacionalidad': nacionalidad,
          'Cédula': cedulaNum,
          'Apellidos y Nombres': nombreCompleto.toUpperCase(),
          'Género': emp['genero'] || '',
          'Fecha de Nacimiento': emp['fecha-nacimiento'] || '',
          'Edad': emp['edad'] || '',
          'Estado Civil': emp['estado-civil'] || '',
          'Lugar de Nacimiento': emp['lugar-nacimiento'] || '',

          // 2. Ubicación y Contacto
          'Teléfono Habitación': emp['tel-habitacion'] || '',
          'Teléfono Celular': emp['tel-celular'] || '',
          'Teléfono Oficina': emp['tel-oficina'] || '',
          'Correo Electrónico': emp['correo'] || '',
          'Dirección de Habitación': emp['direccion'] || '',

          // 3. Formación Académica
          'Nivel de Instrucción': emp['nivel-instruccion'] || emp['instruccion'] || '',
          'Profesión / Título': emp['profesion'] || '',
          'Denominación': pDenominacion,
          'Nombre Nominal': pNombreNominal,
          'Nuevo Epónimo': pNuevoEponimo,

          // 4. Ubicación Administrativa y Cargo
          'Código Plantel (DEA)': deaEmp,
          'Cód. Dependencia': pCodDependencia,
          'Cód. Estadístico': pCodEstadistico,
          'Dependencia': pDependencia,
          'Niveles-Modalidades': pNivelesMod,
          'Turno(s)': pTurnos,
          'Ubicación Geográfica': pUbicacion,
          'Ubicación Administrativa': emp['ubicacion-administrativa'] || '',
          'Tipo de Personal': emp['tipo-personal'] || '',
          'Subcategoría': emp['subcategoria'] || '',
          'Cargo': emp['cargo'] || '',
          'Código RAC': emp['codigo-rac'] || emp['codigo-cargo'] || '',
          'Condición': emp['titular'] || '',
          'Fecha de Ingreso': emp['fecha-ingreso'] || '',
          'Años de Antigüedad': emp['antiguedad'] || '',
          'Turnos que Atiende': emp['turnos-atiende'] || '',

          // 5. Carga Horaria y Pedagógica
          'Horas Académicas': horasAcad,
          'Horas Administrativas': horasAdmin,
          'Atiende Matrícula': emp['atiende-matricula'] || '',
          'Nivel / Modalidad': emp['nivel-modalidad'] || '',
          'Especialidad que Imparte': emp['especialidad-imparte'] || '',

          // 6. Situación Laboral
          'Situación Laboral': emp['situacion-laboral'] || '',
          'Observaciones': emp['observaciones'] || '',

          // 7. Dotación y Bienestar Social
          'Talla Camisa': emp['talla-camisa'] || '',
          'Talla Pantalón': emp['talla-pantalon'] || '',
          'Talla Zapato': emp['talla-zapato'] || '',
          'Actividad Deportiva': emp['actividad-deportiva'] || '',
          'Actividad Cultural': emp['actividad-cultural'] || '',
          'Tipo de Vivienda': emp['tipo-vivienda'] || '',
          'Condición Vivienda': emp['condicion-vivienda'] || '',
          'Tipo Material Vivienda': emp['tipo-material'] || '',
          'Tipo de Enfermedad': emp['tipo-enfermedad'] || '',
          'Medicamento': emp['medicamento'] || '',
          'Discapacidad': emp['discapacidad'] || '',

          // 8. Organización Comunitaria y Electoral
          'UBCH': emp['ubch'] || '',
          'Circuito Comunal': emp['circuito-comunal'] || '',
          'Centro de Votación': emp['centro-votacion'] || ''
        };
      });

      // 6. Crear libro y hoja de cálculo Excel
      const ws = XLSX.utils.json_to_sheet(filasExcel);

      const colWidths = Object.keys(filasExcel[0] || {}).map(key => {
        const maxLen = Math.max(
          key.length,
          ...filasExcel.map(r => String(r[key] || '').length)
        );
        return { wch: Math.min(Math.max(maxLen + 2, 10), 45) };
      });
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Nómina ${userMun}`.slice(0, 31));

      const fechaHoy = new Date().toISOString().slice(0, 10);
      const munLimpio = userMun.replace(/[^a-zA-Z0-9_-]/g, '_');
      const nombreArchivo = `Nomina_Personal_Municipio_${munLimpio}_${fechaHoy}.xlsx`;

      XLSX.writeFile(wb, nombreArchivo);
      showToast(`Nómina de ${userMun} descargada con éxito (${filasExcel.length} funcionarios en orden de código plantel).`, "success", 4500);

    } catch (err) {
      console.error("Error exportando nómina municipal a Excel:", err);
      showAlert("Error", "No se pudo generar el archivo Excel: " + err.message, "danger");
    } finally {
      setTimeout(() => {
        window._isExportingExcelMun = false;
      }, 1500);
    }
  }

  window.exportarNominaMunicipalExcel = exportarNominaMunicipalExcel;

}


