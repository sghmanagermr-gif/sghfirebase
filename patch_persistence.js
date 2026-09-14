const fs = require('fs');
const pathFirebase = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\firebase.js';
const pathMain = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';

function replacePersistence(filePath) {
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        content = content.replace(/browserSessionPersistence/g, 'inMemoryPersistence');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Replaced persistence in ' + filePath);
    } else {
        console.log('File not found: ' + filePath);
    }
}

replacePersistence(pathFirebase);
replacePersistence(pathMain);
