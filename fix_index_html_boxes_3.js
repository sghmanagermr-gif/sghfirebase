const fs = require('fs');
const path = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';
let content = fs.readFileSync(path, 'utf8');

// The exact string based on the Select-Object output
const target = '                </div>\r\n                <h4 style="font-size: 0.9rem; color: #475569; margin-bottom: 10px;">Preescolar</h4>';
const target2 = '                </div>\n                <h4 style="font-size: 0.9rem; color: #475569; margin-bottom: 10px;">Preescolar</h4>';

let changed = false;
if (content.includes(target)) {
    content = content.replace(target, '                </div>\r\n                <div id="cont-dinamico-maternal"></div>\r\n                <h4 style="font-size: 0.9rem; color: #475569; margin-bottom: 10px;">Preescolar</h4>');
    changed = true;
} else if (content.includes(target2)) {
    content = content.replace(target2, '                </div>\n                <div id="cont-dinamico-maternal"></div>\n                <h4 style="font-size: 0.9rem; color: #475569; margin-bottom: 10px;">Preescolar</h4>');
    changed = true;
} else {
    // regex fallback
    content = content.replace(/<\/div>\s*<h4 style="font-size: 0.9rem; color: #475569; margin-bottom: 10px;">Preescolar<\/h4>/, '</div>\n                <div id="cont-dinamico-maternal"></div>\n                <h4 style="font-size: 0.9rem; color: #475569; margin-bottom: 10px;">Preescolar</h4>');
    changed = true;
}

if (changed) {
    fs.writeFileSync(path, content, 'utf8');
    console.log("Success! Added cont-dinamico-maternal");
}
