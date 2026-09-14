const fs = require('fs');
const path = require('path');

const srcDir = 'c:/Proyectos/sgh-2.0/frontend';
const destDir = 'c:/Proyectos/sgh-mr - firebase/webapp';

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (path.basename(src) === 'node_modules' || path.basename(src) === 'dist' || path.basename(src) === '.git') return;
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const file of fs.readdirSync(src)) {
      copyRecursive(path.join(src, file), path.join(dest, file));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

console.log('Sincronizando archivos de frontend a webapp...');
copyRecursive(srcDir, destDir);
console.log('Sincronización completada.');
