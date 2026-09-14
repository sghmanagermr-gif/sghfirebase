import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export function initAdminDashboard(db, userData) {
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
        await setDoc(docRef, configActual);
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
      <div style="background:var(--bg-dark); border-radius:8px; padding:16px; display:flex; align-items:center; justify-content:space-between; border:1px solid ${isActive ? '#10B981' : 'rgba(255,255,255,0.1)'};">
        <span style="font-size:0.9rem; font-weight:600; color:${isActive ? '#10B981' : '#ccc'};">${mun}</span>
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
      <div style="background:var(--bg-dark); padding:10px 15px; border-radius:6px; display:flex; justify-content:space-between; align-items:center; border:1px solid rgba(255,255,255,0.1);">
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
      await updateDoc(docRef, {
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
}
