const fs = require('fs');

const wizardJsPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\personalWizard.js';
let content = fs.readFileSync(wizardJsPath, 'utf8');

// Modificamos mostrarFormularioPersonal para que muestre el error en la tabla
const newMostrarFormulario = `
          if (dea) {
              cargarPersonalExistente(dea);
          } else {
              console.warn("No se pudo determinar el código DEA del plantel actual para cargar personal.");
              const tbody = document.getElementById('tbody-personal-existente');
              if(tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #ef4444;">Error: No se pudo obtener el código DEA del usuario.</td></tr>';
          }
`;

content = content.replace(/if \(dea\) \{[\s\S]*?cargarPersonalExistente\(dea\);[\s\S]*?\} else \{[\s\S]*?console\.warn[^}]*?\}[\s\S]*?\}/, newMostrarFormulario + '\n    }');

// Modificamos cargarPersonalExistente para mostrar el DEA que está buscando y atrapar errores
const newCargarPersonal = `
async function cargarPersonalExistente(codigoDEA) {
      const tbody = document.getElementById('tbody-personal-existente');
      if (!tbody) return;
      
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #3b82f6;">Cargando personal para DEA: ' + codigoDEA + '...</td></tr>';
      
      try {
          const db = getFirestore();
          const q = query(collection(db, 'cargos_personal'), where('codigo-plantel', '==', codigoDEA));
          const querySnapshot = await getDocs(q);
          
          tbody.innerHTML = ''; 
          
          if (querySnapshot.empty) {
              tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #64748b;">No hay personal registrado en el plantel ' + codigoDEA + '.</td></tr>';
              return;
          }
`;

content = content.replace(/async function cargarPersonalExistente\(codigoDEA\) \{[\s\S]*?if \(querySnapshot\.empty\) \{[\s\S]*?return;[\s\S]*?\}/, newCargarPersonal);

fs.writeFileSync(wizardJsPath, content);
console.log("Debug patch applied");
