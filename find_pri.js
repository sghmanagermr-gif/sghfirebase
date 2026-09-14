const fs = require('fs');
const lines = fs.readFileSync('C:\\Proyectos\\sgh-2.0\\frontend\\index.html', 'utf8').split('\n');
const start = lines.findIndex(l => l.includes('id="priFem"'));
if (start !== -1) {
    for (let i = Math.max(0, start - 3); i <= start + 5; i++) {
        console.log((i+1) + ': ' + lines[i]);
    }
} else {
    console.log('Not found');
}
