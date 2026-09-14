const fs = require('fs');

const indexPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';

if (fs.existsSync(indexPath)) {
    let htmlContent = fs.readFileSync(indexPath, 'utf8');
    
    // El texto objetivo que queremos arreglar
    const target = `<span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #94a3b8; display: flex; align-items: center;">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </span>`;
            
    const replacement = `<span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; margin-top: 1px; display: block;">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </span>`;

    if (htmlContent.includes(target)) {
        htmlContent = htmlContent.replace(target, replacement);
        fs.writeFileSync(indexPath, htmlContent);
        console.log("Icon alignment fixed.");
    } else {
        console.log("Could not find the exact span to replace.");
    }
}
