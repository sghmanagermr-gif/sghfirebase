const fs = require('fs');

const indexPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';

if (fs.existsSync(indexPath)) {
    let htmlContent = fs.readFileSync(indexPath, 'utf8');
    
    // The previous span content
    const target = `<span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; margin-top: 1px; display: block;">`;
            
    // The new bulletproof vertically centered span content
    const replacement = `<span style="position: absolute; left: 10px; top: 0; height: 100%; color: #94a3b8; pointer-events: none; display: flex; align-items: center; justify-content: center;">`;

    if (htmlContent.includes(target)) {
        htmlContent = htmlContent.replace(target, replacement);
        fs.writeFileSync(indexPath, htmlContent);
        console.log("Icon alignment fixed using height: 100%.");
    } else {
        console.log("Could not find the exact span to replace.");
    }
}
