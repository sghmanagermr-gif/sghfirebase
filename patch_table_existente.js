const fs = require('fs');
const path = require('path');

const indexHtmlPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';
const wizardJsPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\personalWizard.js';

function patchIndexHtml() {
  let content = fs.readFileSync(indexHtmlPath, 'utf8');
  
  if (content.includes('seccion-personal-existente')) {
    console.log('index.html already patched.');
  } else {
    const tableHtml = `
      <!-- TABLA DE PERSONAL EXISTENTE -->
      <div id="seccion-personal-existente" class="lock-card glass-panel" style="display: none; margin: 30px auto 0; padding: 24px; max-width: 1200px; width: 95%;">
        <h2 style="margin-top: 0; margin-bottom: 20px; font-size: 1.5rem; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
          Personal Registrado en el Plantel
        </h2>
        <div style="max-height: 300px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
          <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead style="background-color: #f8fafc; position: sticky; top: 0; z-index: 1;">
              <tr>
                <th style="padding: 12px; border-bottom: 2px solid #cbd5e1; color: #475569;">Cédula</th>
                <th style="padding: 12px; border-bottom: 2px solid #cbd5e1; color: #475569;">Nombre y Apellido</th>
                <th style="padding: 12px; border-bottom: 2px solid #cbd5e1; color: #475569;">Tipo de Personal</th>
                <th style="padding: 12px; border-bottom: 2px solid #cbd5e1; color: #475569;">Situación Laboral</th>
                <th style="padding: 12px; border-bottom: 2px solid #cbd5e1; color: #475569; text-align: center;">Acciones</th>
              </tr>
            </thead>
            <tbody id="tbody-personal-existente">
              <!-- Renderizado dinámicamente -->
            </tbody>
          </table>
        </div>
      </div>
`;
    // Find the exact line and inject
    if (content.includes('<div id="seccion-registro-personal"')) {
        content = content.replace('<div id="seccion-registro-personal"', tableHtml + '\n      <div id="seccion-registro-personal"');
    }
    fs.writeFileSync(indexHtmlPath, content);
    console.log('index.html patched.');
  }
}

function patchWizardJs() {
  let content = fs.readFileSync(wizardJsPath, 'utf8');

  // 1. Agregar imports de firestore si no están
  if (!content.includes('getDocs')) {
    content = content.replace(
      "import { collection, doc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';",
      "import { collection, doc, setDoc, updateDoc, arrayUnion, query, where, getDocs, getFirestore } from 'firebase/firestore';"
    );
  }

  // 2. Modificar mostrarFormularioPersonal
  if (!content.includes('cargarPersonalExistente(window.currentPlantelDEA)')) {
    content = content.replace(
      /export function mostrarFormularioPersonal\(\) \{[\s\S]*?contenedor\.scrollIntoView\(\{ behavior: 'smooth', block: 'start' \}\);\s*\}\s*\}/,
      `export function mostrarFormularioPersonal() {
      limpiarFormularioPersonal();
      const contenedor = document.getElementById('seccion-registro-personal');
      const contenedorTabla = document.getElementById('seccion-personal-existente');
      
      if (contenedorTabla) contenedorTabla.style.display = 'block';
      if (contenedor) {
          contenedor.style.display = 'block';
          if(contenedorTabla) {
              contenedorTabla.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
              contenedor.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
      }
      
      if (window.currentPlantelDEA) {
          cargarPersonalExistente(window.currentPlantelDEA);
      }
  }`
    );
  }

  // 3. Modificar cerrarFormularioPersonal
  if (!content.includes('contenedorTabla.style.display = \'none\'')) {
    content = content.replace(
      /export function cerrarFormularioPersonal\(\) \{[\s\S]*?contenedor\.style\.display = 'none';\s*\}\s*\}/,
      `export function cerrarFormularioPersonal() {
      const contenedor = document.getElementById('seccion-registro-personal');
      const contenedorTabla = document.getElementById('seccion-personal-existente');
      if (contenedor) {
          contenedor.style.display = 'none';
      }
      if (contenedorTabla) {
          contenedorTabla.style.display = 'none';
      }
  }`
    );
  }

  // 4. Agregar cargarPersonalExistente
  if (!content.includes('async function cargarPersonalExistente')) {
    const fnCargar = `
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

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #e2e8f0';
            
            const tdCed = document.createElement('td');
            tdCed.style.padding = '12px';
            tdCed.textContent = data['cedula-identidad'] || data.cedula || 'N/A';
            
            const tdNom = document.createElement('td');
            tdNom.style.padding = '12px';
            tdNom.textContent = (data['apellidos-nombres'] || data.nombre || 'N/A').toUpperCase();
            
            const tdTipo = document.createElement('td');
            tdTipo.style.padding = '12px';
            tdTipo.textContent = data['tipo-personal'] || 'N/A';
            
            const tdSit = document.createElement('td');
            tdSit.style.padding = '12px';
            tdSit.textContent = data['situacion-laboral'] || 'N/A';
            
            const tdAcc = document.createElement('td');
            tdAcc.style.padding = '12px';
            tdAcc.style.textAlign = 'center';
            tdAcc.innerHTML = \`
                <button class="btn-editar" style="background: none; border: none; cursor: pointer; color: #3b82f6; margin-right: 10px;" title="Editar">
                    ✏️
                </button>
                <button class="btn-eliminar" style="background: none; border: none; cursor: pointer; color: #ef4444;" title="Eliminar">
                    🗑️
                </button>
            \`;
            
            tr.appendChild(tdCed);
            tr.appendChild(tdNom);
            tr.appendChild(tdTipo);
            tr.appendChild(tdSit);
            tr.appendChild(tdAcc);
            
            tbody.appendChild(tr);
        });
        
    } catch (error) {
        console.error("Error cargando personal:", error);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #ef4444;">Error cargando registros.</td></tr>';
    }
}
`;
    content += '\\n' + fnCargar;
  }
  
  fs.writeFileSync(wizardJsPath, content);
  console.log('personalWizard.js patched.');
}

patchIndexHtml();
patchWizardJs();
