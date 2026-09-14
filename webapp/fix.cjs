const fs = require('fs');
let b = fs.readFileSync('index.html');
if (b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) {
  b = b.subarray(3);
}
let s = b.toString('utf8');
const replacements = [
  [/Ã¡/g, 'á'], [/Ã©/g, 'é'], [/Ã­/g, 'í'], [/Ã\x8D/g, 'Í'],
  [/Ã³/g, 'ó'], [/Ãº/g, 'ú'], [/Ã±/g, 'ñ'], [/Ã /g, 'Á'],
  [/Ã‰/g, 'É'], [/Ã“/g, 'Ó'], [/Ãš/g, 'Ú'], [/Ã‘/g, 'Ñ'],
  [/Â¿/g, '¿'], [/Â¡/g, '¡'],
  // Sometimes PowerShell saves it with raw ANSI decoding
  // Let's also do a blanket fix by reading it as latin1 buffer and writing it as utf8
];
for (const [bad, good] of replacements) {
  s = s.replace(bad, good);
}
fs.writeFileSync('index.html', s, 'utf8');
console.log('Fixed encoding in index.html');
