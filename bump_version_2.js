const fs = require('fs');

const packagePath = 'C:\\Proyectos\\sgh-2.0\\frontend\\package.json';
const indexPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';

// Actualizar package.json
if (fs.existsSync(packagePath)) {
    let pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    pkg.version = '2.6.10';
    fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
    console.log("package.json version updated to 2.6.10");
}

// Actualizar index.html
if (fs.existsSync(indexPath)) {
    let htmlContent = fs.readFileSync(indexPath, 'utf8');
    
    // Buscar versiones antiguas y reemplazar por 2.6.10
    htmlContent = htmlContent.replace(/<title>SGH - v[\d\.]+<\/title>/g, '<title>SGH - v2.6.10</title>');
    htmlContent = htmlContent.replace(/<span style="color: var\(--primary-color\);">SGH<\/span> v[\d\.]+/g, '<span style="color: var(--primary-color);">SGH</span> v2.6.10');
    
    fs.writeFileSync(indexPath, htmlContent);
    console.log("index.html versions updated to v2.6.10");
}
