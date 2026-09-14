const fs = require('fs');

function parseCSVRow(text) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    if (char === '"') {
      if (inQuotes && text[i+1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function processLine(rawLine) {
  let line = rawLine.trim();
  if (!line) return null;
  
  if (line.startsWith('"') && line.includes('";')) {
    let lastQuoteIdx = line.lastIndexOf('"');
    line = line.substring(1, lastQuoteIdx);
    line = line.replace(/""/g, '"');
  } else if (line.startsWith('"') && line.endsWith('"')) {
    line = line.substring(1, line.length - 1);
    line = line.replace(/""/g, '"');
  }
  
  return parseCSVRow(line);
}

function escapeCSV(val) {
  if (val === undefined || val === null) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

const fileContent = fs.readFileSync('c:/Proyectos/sgh-mr - firebase/migracion/RAC ESTADO MERIDA - PERSONAL ENRIQUECIDO.csv', 'utf8');
const lines = fileContent.split(/\r?\n/);

const headerRow = processLine(lines[0]);
const columnsToExtract = [
  'CEDULA',
  'NOMBRE Y APELLIDO',
  'EDAD',
  'GENERO',
  'TELEFONO CELULAR',
  'ESTADO',
  'MUNICIPIO',
  'PARROQUIA',
  'NUEVO EPÓNIMO',
  'TIPO PERSONAL',
  'TIPO DE ENFERMEDAD',
  'MEDICAMENTO',
  'POSEE DISCAPACIDAD'
];

// Find indices
const indices = columnsToExtract.map(col => {
  const idx = headerRow.indexOf(col);
  if (idx === -1) {
    console.error("Column not found: " + col);
  }
  return idx;
});

const outputLines = [];
outputLines.push(columnsToExtract.map(escapeCSV).join(','));

for (let i = 1; i < lines.length; i++) {
  const row = processLine(lines[i]);
  if (!row || row.length === 0 || (row.length === 1 && !row[0])) continue;
  
  const outRow = indices.map(idx => escapeCSV(row[idx] || ''));
  outputLines.push(outRow.join(','));
}

fs.writeFileSync('c:/Proyectos/sgh-mr - firebase/migracion/PERSONAL_SALUD_CONTACTO.csv', outputLines.join('\n'), 'utf8');
console.log(`Extracted ${outputLines.length - 1} rows and saved to PERSONAL_SALUD_CONTACTO.csv`);
