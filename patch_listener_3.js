const fs = require('fs');
const path = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';
let content = fs.readFileSync(path, 'utf8');

// Fix the listener bug where it wouldn't re-subscribe if the DEA code changed,
// and make sure it logs to the console for debugging.
const listenerTarget = `      if (!window._unsubPlantel) {
          window._unsubPlantel = onSnapshot(docRef, (snap) => {
              if (snap.exists()) {
                  const liveData = snap.data();
                  const inpMatTotal = document.getElementById('inp-matricula-total');
                  if (inpMatTotal && liveData.matricula && liveData.matricula["total-gen"] !== undefined) {
                      inpMatTotal.value = liveData.matricula["total-gen"];
                  }
              }
          });
      }`;

const listenerReplacement = `      if (window._unsubPlantel) {
          window._unsubPlantel(); // Desuscribir el anterior si cambió de escuela
      }
      window._unsubPlantel = onSnapshot(docRef, (snap) => {
          if (snap.exists()) {
              const liveData = snap.data();
              console.log("🔥 [onSnapshot] Datos recibidos de Firestore:", liveData.matricula);
              const inpMatTotal = document.getElementById('inp-matricula-total');
              if (inpMatTotal && liveData.matricula && liveData.matricula["total-gen"] !== undefined) {
                  inpMatTotal.value = liveData.matricula["total-gen"];
                  console.log("✅ [onSnapshot] Input de Matrícula Total actualizado a:", liveData.matricula["total-gen"]);
              }
          }
      });`;

if (content.includes(listenerTarget)) {
    content = content.replace(listenerTarget, listenerReplacement);
    console.log("Listener arreglado.");
} else {
    console.log("No se pudo encontrar el listener target.");
}

// Remove the optimistic update that might be overriding the snapshot
const optTarget = `              // Actualizar el input de la tarjeta con el nuevo total guardado
              const inpMatTotal = document.getElementById('inp-matricula-total');
              if (inpMatTotal) inpMatTotal.value = matTotal;`;

if (content.includes(optTarget)) {
    content = content.replace(optTarget, "");
    console.log("Update optimista removido.");
} else {
    console.log("No se pudo encontrar el update optimista.");
}

fs.writeFileSync(path, content, 'utf8');
