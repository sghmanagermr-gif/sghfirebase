// Configuración de Firebase (Tu Llave Maestra)
const firebaseConfig = {
    apiKey: "AIzaSyDSdDRB10kbtor5ROR50AsCxVmk0fOpqFo",
    authDomain: "sgh-merida.firebaseapp.com",
    projectId: "sgh-merida",
    storageBucket: "sgh-merida.firebasestorage.app",
    messagingSenderId: "873672016601",
    appId: "1:873672016601:web:3024d5b94ee3926c8e34c8"
};

// Inicializar Firebase (Compat)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Función principal para cargar el Dashboard
async function cargarDashboard() {
    try {
        console.log("Iniciando carga de métricas desde Firestore...");

        // 1. Total de Planteles
        const snapPlanteles = await db.collection("planteles").count().get();
        animarValor('val-planteles', snapPlanteles.data().count);

        // 2. Total de Personal (Cargos)
        const snapPersonal = await db.collection("cargos_personal").count().get();
        animarValor('val-total-personal', snapPersonal.data().count);

        // 3. Personal Docente
        const snapDocente = await db.collection("cargos_personal").where("TIPO PERSONAL", "==", "DOCENTE").count().get();
        animarValor('val-docentes', snapDocente.data().count);

        // 4. Personal Administrativo
        const snapAdmin = await db.collection("cargos_personal").where("TIPO PERSONAL", "==", "ADMINISTRATIVO").count().get();
        animarValor('val-admin', snapAdmin.data().count);

        // 5. Personal Obrero
        const snapObrero = await db.collection("cargos_personal").where("TIPO PERSONAL", "==", "OBRERO").count().get();
        animarValor('val-obrero', snapObrero.data().count);

    } catch (error) {
        console.error("Error cargando el Dashboard:", error);
        alert("Hubo un error conectando a Firebase. Revisa la consola.");
    }
}

// Función auxiliar para animar los números mientras se muestran
function animarValor(elementId, valorFinal) {
    const obj = document.getElementById(elementId);
    let startTimestamp = null;
    const duration = 1000; // 1 segundo de animación

    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        
        // Efecto easeOutQuart
        const easeOut = 1 - Math.pow(1 - progress, 4);
        
        let valorActual = Math.floor(easeOut * valorFinal);
        
        // Formatear con puntos de miles
        obj.textContent = valorActual.toLocaleString('es-VE');
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.textContent = valorFinal.toLocaleString('es-VE');
        }
    };
    
    window.requestAnimationFrame(step);
}

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', cargarDashboard);
