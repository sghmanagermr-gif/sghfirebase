import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export function initAuth(auth, db, callbacks) {
  const { onLogin, onLogout, onWait, onMunic, onAdmin } = callbacks;

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
      // 1. Leer el documento del usuario
      const userSnap = await getDoc(doc(db, "usuarios", user.uid));
      if (!userSnap.exists()) {
         console.warn("Usuario autenticado pero sin documento en Firestore");
         onWait("Tu cuenta fue creada pero falta el perfil. Contacta soporte.");
         return;
      }
      const userData = userSnap.data();
      // Asignamos el uid para fácil acceso luego
      userData.uid = user.uid;

      // 2. Lógica de Ruteo y Bloqueo según ROL
      if (userData.rol === 'admin') {
         onAdmin(userData);
         return;
      }

      if (userData.rol === 'munic') {
         onMunic(userData);
         return;
      }

      if (userData.rol === 'plant') {
         // Paso 1 de Aprobación: Validado por el Municipal
         if (userData.validacion_municipal !== true) {
            onWait("Cuenta en revisión. Esperando validación de tu Coordinador Municipal.");
            return;
         }

         // Paso 2 de Aprobación: Validar Despliegue (Admin)
         const config = await getDespliegueConfig();
         const isActivo = (config.municipios_activos || []).includes(userData.municipio) || 
                          (config.excepciones || []).includes(userData.codigo);

         if (!isActivo) {
            onWait("Validado por el municipio. El sistema aún no ha sido abierto para tu localidad.");
            return;
         }

         // Acceso Total Concedido
         onLogin(userData);
      }
    } catch(err) {
      console.error("Error en flujo de seguridad:", err);
      onLogout();
    }
  });
}
