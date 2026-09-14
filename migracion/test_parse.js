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
        i++; // skip next quote
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
  
  // Clean up the weird Excel export format
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

const fileContent = fs.readFileSync('c:/Proyectos/sgh-mr - firebase/migracion/RAC ESTADO MERIDA - PERSONAL ENRIQUECIDO.csv', 'utf8');
const lines = fileContent.split(/\r?\n/);

const headerRow = processLine(lines[0]);
console.log("Headers:", headerRow);

if (lines.length > 1) {
  const firstDataRow = processLine(lines[1]);
  console.log("First data row has", firstDataRow.length, "columns.");
  console.log("First data row:", firstDataRow);
}
