const fs = require('fs');
const path = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';
let content = fs.readFileSync(path, 'utf8');

if (content.includes('liveData.matricula.total')) {
    content = content.replace(/liveData\.matricula\.total/g, 'liveData.matricula["total-gen"]');
    fs.writeFileSync(path, content, 'utf8');
    console.log('Listener parcheado.');
} else {
    console.log('No encontrado.');
}
