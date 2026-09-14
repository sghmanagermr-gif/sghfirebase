const fs = require('fs');

const indexPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';

if (fs.existsSync(indexPath)) {
    let htmlContent = fs.readFileSync(indexPath, 'utf8');
    
    const targetBlock = `<div style="position: relative;">
            <span style="position: absolute; left: 10px; top: 0; height: 100%; color: #94a3b8; pointer-events: none; display: flex; align-items: center; justify-content: center;">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </span>
            <input type="text" id="buscador-personal" placeholder="Buscar cédula o nombre..." style="padding: 8px 12px 8px 32px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px; width: 260px; outline: none; transition: all 0.2s; background: white; color: #1e293b; box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);" onfocus="this.style.borderColor='#3b82f6'; this.style.boxShadow='0 0 0 3px rgba(59,130,246,0.1)';" onblur="this.style.borderColor='#cbd5e1'; this.style.boxShadow='inset 0 1px 2px rgba(0,0,0,0.05)';">
          </div>`;
          
    const replacementBlock = `<div style="position: relative; display: flex; align-items: center;">
            <span style="position: absolute; left: 10px; color: #94a3b8; pointer-events: none; display: flex; align-items: center; justify-content: center; height: 100%;">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-top: 2px;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </span>
            <input type="text" id="buscador-personal" placeholder="Buscar cédula o nombre..." style="display: block; padding: 8px 12px 8px 32px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px; width: 260px; outline: none; transition: all 0.2s; background: white; color: #1e293b; box-shadow: inset 0 1px 2px rgba(0,0,0,0.05); box-sizing: border-box;" onfocus="this.style.borderColor='#3b82f6'; this.style.boxShadow='0 0 0 3px rgba(59,130,246,0.1)';" onblur="this.style.borderColor='#cbd5e1'; this.style.boxShadow='inset 0 1px 2px rgba(0,0,0,0.05)';">
          </div>`;

    if (htmlContent.includes(targetBlock)) {
        htmlContent = htmlContent.replace(targetBlock, replacementBlock);
        fs.writeFileSync(indexPath, htmlContent);
        console.log("Icon alignment fixed 3.");
    } else {
        // Fallback in case there are invisible characters or different spacing
        console.log("Could not find the exact block to replace. Attempting regex replacement...");
        const regex = /<div style="position: relative;">\s*<span[^>]*>\s*<svg[^>]*>.*?<\/svg>\s*<\/span>\s*<input[^>]*id="buscador-personal"[^>]*>\s*<\/div>/g;
        htmlContent = htmlContent.replace(regex, replacementBlock);
        fs.writeFileSync(indexPath, htmlContent);
        console.log("Fallback replacement done.");
    }
}
