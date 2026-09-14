const fs = require('fs');
const path = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';
let content = fs.readFileSync(path, 'utf8');

let changes = 0;

if (content.includes('id="secMat" min="0"')) {
    content = content.replace('id="secMat" min="0"', 'id="secMat" data-plan="20000" data-tipo="maternal" min="0"');
    changes++;
}
if (content.includes('id="secPre" min="0"')) {
    content = content.replace('id="secPre" min="0"', 'id="secPre" data-plan="20000" data-tipo="preescolar" min="0"');
    changes++;
}
if (content.includes('id="secPri" min="0"')) {
    content = content.replace('id="secPri" min="0"', 'id="secPri" data-plan="21000" min="0"');
    changes++;
}

// Add the containers if they don't exist
const targetMat = '</div>\n                  <h4 style="font-size: 0.9rem; color: #475569; margin-bottom: 10px;">Preescolar</h4>';
if (content.includes(targetMat) && !content.includes('id="cont-dinamico-maternal"')) {
    content = content.replace(targetMat, '</div>\n                  <div id="cont-dinamico-maternal"></div>\n                  <h4 style="font-size: 0.9rem; color: #475569; margin-bottom: 10px;">Preescolar</h4>');
    changes++;
}

const targetPre = '</div>\n                  <div style="background: #f1f5f9; padding: 12px 20px; border-radius: 6px; display: flex; \r\njustify-content: space-between; align-items: center;">\r\n                    <span style="font-size: 0.9rem; color: var(--primary-color); font-weight: 600;">Total \r\nInicial</span>';
// Let's use Regex to be safe
content = content.replace(/<\/div>\s*<div style="background: #f1f5f9; padding: 12px 20px; border-radius: 6px; display: flex;\s*justify-content: space-between; align-items: center;">\s*<span style="font-size: 0.9rem; color: var\(--primary-color\); font-weight: 600;">Total Inicial<\/span>/, '</div>\n                  <div id="cont-dinamico-preescolar"></div>\n                  <div style="background: #f1f5f9; padding: 12px 20px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">\n                    <span style="font-size: 0.9rem; color: var(--primary-color); font-weight: 600;">Total Inicial</span>');
changes++;

content = content.replace(/<\/div>\s*<div style="background: #f1f5f9; padding: 12px 20px; border-radius: 6px; display: flex;\s*justify-content: space-between; align-items: center;">\s*<span style="font-size: 0.9rem; color: var\(--primary-color\); font-weight: 600;">Total Primaria<\/span>/, '</div>\n                  <div id="cont-dinamico-primaria"></div>\n                  <div style="background: #f1f5f9; padding: 12px 20px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">\n                    <span style="font-size: 0.9rem; color: var(--primary-color); font-weight: 600;">Total Primaria</span>');
changes++;

fs.writeFileSync(path, content, 'utf8');
console.log('Done!');
