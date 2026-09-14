const fs = require('fs');
const path = require('path');

const projectRoot = 'C:\\Proyectos\\sgh-2.0\\frontend';
const mainJsPath = path.join(projectRoot, 'src', 'main.js');

let content = fs.readFileSync(mainJsPath, 'utf8');

const targetStr = `              if (inpMatTotal && liveData.matricula && liveData.matricula["total-gen"] !== undefined) {`;

const replacementStr = `              if (liveData.personal_resumen && liveData.personal_resumen.length > 0) {
                  const tbody = document.getElementById('tbody-lista-personal');
                  const seccionLista = document.getElementById('seccion-lista-personal');
                  if (tbody && seccionLista) {
                      seccionLista.style.display = 'block';
                      tbody.innerHTML = liveData.personal_resumen.map(p => 
                          '<tr style="border-bottom: 1px solid #f1f5f9;">' +
                          '<td style="padding: 12px; color: #334155;">' + (p.cedula || '') + '</td>' +
                          '<td style="padding: 12px; color: #334155; font-weight: 500;">' + (p.nombre || '') + '</td>' +
                          '<td style="padding: 12px; color: #64748b;">' + (p.cargo || '') + '</td>' +
                          '</tr>'
                      ).join('');
                  }
              } else {
                  const seccionLista = document.getElementById('seccion-lista-personal');
                  if (seccionLista) seccionLista.style.display = 'none';
              }
              
              if (inpMatTotal && liveData.matricula && liveData.matricula["total-gen"] !== undefined) {`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    fs.writeFileSync(mainJsPath, content, 'utf8');
    console.log('main.js patched with table renderer.');
} else {
    console.log('Target string not found in main.js.');
}
