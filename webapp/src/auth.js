import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { normalizarMunicipio } from './geografia.js';

export function initAuth(auth, db, callbacks) {
  const { onLogin, onLogout, onWait, onAdmin } = callbacks;

  // Cache config in session storage to save reads (Zero-Cost strategy)
  let despliegueConfig = null;

  async function getDespliegueConfig() {
    if (despliegueConfig) return despliegueConfig;
    
    const sessionConfig = sessionStorage.getItem('sgh_despliegue_config');
    if (sessionConfig) {
      despliegueConfig = JSON.parse(sessionConfig);
      return despliegueConfig;
    }
    
    try {
      const snap = await getDoc(doc(db, "configuracion", "despliegue"));
      if (snap.exists()) {
        despliegueConfig = snap.data();
        sessionStorage.setItem('sgh_despliegue_config', JSON.stringify(despliegueConfig));
        return despliegueConfig;
      }
    } catch(e) {
      console.error("Error leyendo configuracion de despliegue", e);
    }
    
    return { municipios_activos: [], excepciones: [] };
  }

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      onLogout();
      return;
    }

    try {
      // 1. Leer el documento del usuario por UID con Auto-Recuperación por correo
      let userSnap = await getDoc(doc(db, "usuarios", user.uid));
      let userData = null;

      if (userSnap.exists()) {
        userData = userSnap.data();
      } else {
        // Fallback inteligente: si el Document ID no coincide con el UID de Auth (ej. creado con Auto-ID)
        console.warn("[Auth Recovery] Documento no encontrado por UID:", user.uid, "Buscando por correo:", user.email);
        try {
          const emailRaw = (user.email || '').trim();
          const emailLower = emailRaw.toLowerCase();
          
          let snapEmail = await getDocs(query(collection(db, "usuarios"), where("email", "==", emailRaw)));
          if (snapEmail.empty && emailLower !== emailRaw) {
            snapEmail = await getDocs(query(collection(db, "usuarios"), where("email", "==", emailLower)));
          }

          if (!snapEmail.empty) {
            const foundDoc = snapEmail.docs[0];
            userData = foundDoc.data();
            console.log("[Auth Recovery] ¡Perfil localizado por correo! Documento ID:", foundDoc.id, "Auto-revinculando al UID:", user.uid);
            
            // Auto-revinculación inmediata en Firestore para que futuros accesos sean O(1)
            try {
              await setDoc(doc(db, "usuarios", user.uid), {
                ...userData,
                uid: user.uid,
                doc_original_id: foundDoc.id,
                revinculado_el: new Date().toISOString()
              });
              console.log("[Auth Recovery] Documento revinculado exitosamente con ID:", user.uid);
            } catch (errSync) {
              console.warn("[Auth Recovery] Aviso revinculando UID en Firestore:", errSync);
            }
          }
        } catch (errQuery) {
          console.warn("[Auth Recovery] Error buscando perfil por correo:", errQuery);
        }
      }

      if (!userData) {
         console.warn("Usuario autenticado pero sin documento en Firestore");
         onWait("Tu cuenta de acceso fue creada, pero aún no se registran los datos de tu institución. Por favor completa tu ficha a continuación:", "Completar Perfil Institucional", user);
         return;
      }
      // Asignamos el uid para fácil acceso luego
      userData.uid = user.uid;

      // --- Carga de Catálogos Maestros al Local Storage ---
      if (!localStorage.getItem('sgh_catalogos')) {
         try {
            const catalogosRef = doc(db, 'sistema', 'catalogos_maestros');
            const catalogosSnap = await getDoc(catalogosRef);
            if (catalogosSnap.exists()) {
               localStorage.setItem('sgh_catalogos', JSON.stringify(catalogosSnap.data()));
               console.log('Catálogos maestros guardados en Local Storage.');
            }
         } catch(catErr) {
            console.error('Error cargando catálogos maestros:', catErr);
         }
      }

      // 1. Revisión de estado de aprobación general institucional
      const estaAprobado = userData.estado_aprobacion === 'APROBADO';
      const esRolEspecial = ['superadmin', 'admin', 'zonadmin'].includes(userData.rol);

      if (userData.estado_aprobacion === 'PENDIENTE') {
          const superiorTxt = userData.rol === 'plantadmin' 
              ? 'la Dirección de Zona Educativa / Gestión Humana'
              : (userData.rol === 'plaadmin' ? 'su Coordinador Municipal o Sala Técnica' : 'su superior');
          onWait(`Su solicitud está registrada con éxito y se encuentra en espera de validación y aprobación por <b>${superiorTxt}</b>.<br><br>Una vez autorizada por el responsable en el sistema, su acceso quedará activo automáticamente.`, "Cuenta en Revisión");
          return;
      }
      if (userData.estado_aprobacion === 'RECHAZADO') {
          onWait("Tu solicitud de acceso ha sido rechazada por la autoridad institucional.", "Acceso Rechazado");
          return;
      }

      // Si tiene el campo y no es APROBADO ni los anteriores, es un estado desconocido
      if (userData.estado_aprobacion && userData.estado_aprobacion !== 'APROBADO') {
          onWait("Tu cuenta tiene un estado institucional desconocido: " + userData.estado_aprobacion, "Cuenta en Revisión");
          return;
      }

      // 2. Doble Candado: Verificación de correo (solo para cuentas no aprobadas o no exentas)
      if (!user.emailVerified && !esRolEspecial && !estaAprobado) {
          onWait("Tu cuenta requiere verificación de correo. Si no recibiste el mensaje, puedes solicitar un reenvío o comunicarte con tu superior para su validación directa.", "Cuenta en Revisión");
          return;
      }

      // 3. Lógica de Ruteo y Bloqueo según ROL (ya está APROBADO o es un rol viejo)
      if (['superadmin', 'admin', 'zonadmin', 'munadmin'].includes(userData.rol)) {
         onAdmin(userData);
         return;
      }



      if (userData.rol === 'plant' || userData.rol === 'plaadmin' || userData.rol === 'plantadmin') {
         // --- GATE: DESPLIEGUE ---
         const despliegue = await getDespliegueConfig();

         // INTERRUPTOR MAESTRO: Si el despliegue general está apagado (En Mantenimiento)
         if (despliegue.despliegue_activo === false) {
            sessionStorage.removeItem('sgh_despliegue_config');
            const mensajeMantenimiento = `El Sistema SGH se encuentra actualmente en <b>labores de mantenimiento institucional y actualización técnica</b>. Por favor, manténgase atento a los canales oficiales.`;
            onWait(mensajeMantenimiento, "Sistema en Mantenimiento");
            return;
         }

         // Control de Despliegue para Planta Central / Zona Educativa
         if (userData.rol === 'plantadmin') {
            const codDep = userData.jerarquia?.plantel_codigo || userData.plantel_codigo;
            const isExp = Boolean(codDep && despliegue.excepciones?.includes(codDep));
            const isPlantaActiva = (despliegue.planta_activa !== false);

            if (!isPlantaActiva && !isExp) {
               sessionStorage.removeItem('sgh_despliegue_config');
               const mensajeDespliegue = `El acceso para las dependencias de la <b>Planta Central / Zona Educativa</b> se encuentra temporalmente en pausa técnica. Por favor, manténgase atento a las instrucciones de la Dirección.`;
               onWait(mensajeDespliegue, "Despliegue Institucional");
               return;
            }

            onLogin(userData);
            return;
         }

         const cod = userData.jerarquia?.plantel_codigo || userData.plantel_codigo;
         const mun = userData.jerarquia?.municipio || userData.municipio;
         const munNorm = normalizarMunicipio(mun);
         
         const isExp = Boolean(cod && despliegue.excepciones?.includes(cod));
         const isMun = Boolean(mun && (
            despliegue.municipios_activos?.includes(mun) ||
            (munNorm && despliegue.municipios_activos?.some(m => normalizarMunicipio(m) === munNorm))
         ));
         
         if (!isExp && !isMun) {
            sessionStorage.removeItem('sgh_despliegue_config');
            const mensajeDespliegue = mun
               ? `El Sistema SGH aún <b>no está habilitado para el municipio</b> ${mun}. Por favor, manténgase atento a los canales oficiales.`
               : `El Sistema SGH aún <b>no está habilitado para su plantel</b>. Por favor, manténgase atento a los canales oficiales.`;
            onWait(mensajeDespliegue, "Despliegue Institucional");
            return;
         }

         // Acceso Total Concedido al Plantel
         onLogin(userData);
      }
    } catch(err) {
      console.error("Error en flujo de seguridad:", err);
      onLogout();
    }
  });
}
