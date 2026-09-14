const fs = require('fs');
const wizardPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\personalWizard.js';
const bitacoraPath = 'C:\\Proyectos\\sgh-mr - firebase\\bitacora.md';

if (fs.existsSync(wizardPath)) {
    let content = fs.readFileSync(wizardPath, 'utf8');

    const regexAcc = /const tdAcc = document\.createElement\('td'\);[\s\S]*?<\/button>\s*`;/;
    
    if (regexAcc.test(content)) {
        const newTdAcc = `              const tdAcc = document.createElement('td');
              tdAcc.style.padding = '12px';
              tdAcc.style.textAlign = 'center';
              tdAcc.style.verticalAlign = 'middle';
              
              const baseBtnStyle = "width: 32px; height: 32px; border-radius: 6px; border: 1px solid #e2e8f0; background: white; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.05); margin: 0 4px;";
              
              tdAcc.innerHTML = \`
                  <button class="btn-editar" style="\${baseBtnStyle} color: #3b82f6;" onmouseover="this.style.background='#eff6ff'; this.style.borderColor='#bfdbfe';" onmouseout="this.style.background='white'; this.style.borderColor='#e2e8f0';" title="Editar">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button class="btn-eliminar" style="\${baseBtnStyle} color: #ef4444;" onmouseover="this.style.background='#fef2f2'; this.style.borderColor='#fecaca';" onmouseout="this.style.background='white'; this.style.borderColor='#e2e8f0';" title="Eliminar">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
              \`;`;
              
        content = content.replace(regexAcc, newTdAcc);
        fs.writeFileSync(wizardPath, content);
        console.log("UI patch applied successfully.");
    } else {
        console.log("Error: Could not find tdAcc logic to replace.");
    }
}
