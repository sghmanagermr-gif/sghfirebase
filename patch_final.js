const fs = require('fs');

const mainPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';
let mainContent = fs.readFileSync(mainPath, 'utf8');

// Modificar onLogin
mainContent = mainContent.replace(
    /onLogin: async \(userData\) => \{\s*if\(userData.rol === 'plaadmin'\) \{/,
    "onLogin: async (userData) => {\n      window.sgh_user_data = userData;\n      if(userData.rol === 'plaadmin') {"
);

// Modificar checkPlantelData
mainContent = mainContent.replace(
    /currentPlantel = data;\s*mostrarCandado\(codigoDEA, data\);/,
    "currentPlantel = data;\n        window.currentPlantelDEA = codigoDEA;\n        mostrarCandado(codigoDEA, data);"
);

fs.writeFileSync(mainPath, mainContent);


const wizardPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\personalWizard.js';
let wizardContent = fs.readFileSync(wizardPath, 'utf8');

const cleanMostrarFormulario = `
          let dea = '';
          if (window.currentPlantelDEA) {
              dea = window.currentPlantelDEA;
          } else if (window.sgh_user_data && window.sgh_user_data.jerarquia) {
              dea = window.sgh_user_data.jerarquia.plantel_codigo;
          }

          if (dea) {
              cargarPersonalExistente(dea);
          } else {
              console.warn("No se pudo determinar el código DEA del plantel actual para cargar personal.");
              const tbody = document.getElementById('tbody-personal-existente');
              if(tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #ef4444;">No hay sesión de DEA detectada.</td></tr>';
          }
`;

wizardContent = wizardContent.replace(/let dea = '';[\s\S]*?if\(tbody\) tbody\.innerHTML = '.*?';\s*\}/, cleanMostrarFormulario.trim());

const cleanCargarPersonal = `
async function cargarPersonalExistente(codigoDEA) {
      const tbody = document.getElementById('tbody-personal-existente');
      if (!tbody) return;
      
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #64748b;">Cargando personal...</td></tr>';
      
      try {
          const db = getFirestore();
          const q = query(collection(db, 'cargos_personal'), where('codigo-plantel', '==', codigoDEA));
          const querySnapshot = await getDocs(q);
          
          tbody.innerHTML = ''; 
          
          if (querySnapshot.empty) {
              tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #64748b;">No hay personal registrado en este plantel.</td></tr>';
              return;
          }
`;

wizardContent = wizardContent.replace(/async function cargarPersonalExistente\(codigoDEA\) \{[\s\S]*?if \(querySnapshot\.empty\) \{[\s\S]*?return;[\s\S]*?\}/, cleanCargarPersonal.trim());

fs.writeFileSync(wizardPath, wizardContent);
console.log("Patch final applied.");
