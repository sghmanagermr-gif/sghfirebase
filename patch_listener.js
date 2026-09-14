const fs = require('fs');
const path = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';
let content = fs.readFileSync(path, 'utf8');

// Update import
if (!content.includes('onSnapshot')) {
    content = content.replace(
        /import \{ getFirestore, doc, getDoc, setDoc, deleteField \} from 'firebase\/firestore';/,
        "import { getFirestore, doc, getDoc, setDoc, deleteField, onSnapshot } from 'firebase/firestore';"
    );
}

// In checkPlantelData, add onSnapshot listener after getting the initial docSnap
const target = `      currentPlantel = data;
      mostrarCandado(codigoDEA, data);`;

const replacement = `      currentPlantel = data;
      mostrarCandado(codigoDEA, data);
      
      // Suscripción reactiva a cambios en Firestore para mantener el UI actualizado con los datos reales
      if (!window._unsubPlantel) {
          window._unsubPlantel = onSnapshot(docRef, (snap) => {
              if (snap.exists()) {
                  const liveData = snap.data();
                  const inpMatTotal = document.getElementById('inp-matricula-total');
                  if (inpMatTotal && liveData.matricula && liveData.matricula.total !== undefined) {
                      inpMatTotal.value = liveData.matricula.total;
                  }
              }
          });
      }`;

if (content.includes(target) && !content.includes('onSnapshot(docRef')) {
    content = content.replace(target, replacement);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Reemplazo exitoso.');
} else {
    console.log('No se pudo aplicar el reemplazo. onSnapshot ya existe o target no encontrado.');
}
