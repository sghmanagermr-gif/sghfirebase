import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';

const EXCEL_PATH = path.resolve('nomina_acualizada', 'corte_noviembre_17.xlsx');
const PERSONAL_PATH = path.resolve('scratch', 'corte_oficial_firestore_personal.json');
const PLANTELES_PATH = path.resolve('scratch', 'corte_oficial_firestore_planteles.json');

console.log('========================================================================');
console.log('=== SGH MÉRIDA: EXPORTACIÓN EN CRUDO A EXCEL (CORTE 17 NOVIEMBRE) ===');
console.log('========================================================================');
console.log(`Destino: ${EXCEL_PATH}`);

if (!fs.existsSync(PERSONAL_PATH) || !fs.existsSync(PLANTELES_PATH)) {
  console.error('Error: No se encontraron los archivos de corte descargados en scratch/.');
  process.exit(1);
}

const personal = JSON.parse(fs.readFileSync(PERSONAL_PATH, 'utf8'));
const planteles = JSON.parse(fs.readFileSync(PLANTELES_PATH, 'utf8'));

console.log(`• Cargados ${personal.length} registros de personal desde disco.`);
console.log(`• Cargados ${planteles.length} registros de planteles desde disco.`);

// 1. Preparar hoja PERSONAL
console.log('\n• Analizando las 197 claves físicas de PERSONAL...');
const personalKeyFreq = {};
for (const p of personal) {
  for (const k of Object.keys(p)) {
    personalKeyFreq[k] = (personalKeyFreq[k] || 0) + 1;
  }
}

// Ordenar claves por frecuencia para legibilidad óptima
const personalKeys = Object.entries(personalKeyFreq)
  .sort((a, b) => b[1] - a[1])
  .map(e => e[0]);

// Colocar _id de primero
const idIdx = personalKeys.indexOf('_id');
if (idIdx > -1) {
  personalKeys.splice(idIdx, 1);
  personalKeys.unshift('_id');
}

console.log(`✓ Columnas determinadas para PERSONAL: ${personalKeys.length} columnas.`);

const rowsPersonal = [personalKeys];
for (let i = 0; i < personal.length; i++) {
  const p = personal[i];
  const row = [];
  for (let j = 0; j < personalKeys.length; j++) {
    const k = personalKeys[j];
    const val = p[k];
    if (val === undefined || val === null) {
      row.push('');
    } else if (typeof val === 'object') {
      row.push(JSON.stringify(val));
    } else {
      row.push(val);
    }
  }
  rowsPersonal.push(row);
}

console.log(`• Creando hoja de cálculo PERSONAL (${rowsPersonal.length} filas)...`);
const wsPersonal = xlsx.utils.aoa_to_sheet(rowsPersonal);

// 2. Preparar hoja PLANTELES
console.log('\n• Analizando las 50 claves físicas de PLANTELES...');
const plantelesKeyFreq = {};
for (const pl of planteles) {
  for (const k of Object.keys(pl)) {
    plantelesKeyFreq[k] = (plantelesKeyFreq[k] || 0) + 1;
  }
}

const plantelesKeys = Object.entries(plantelesKeyFreq)
  .sort((a, b) => b[1] - a[1])
  .map(e => e[0]);

const plIdIdx = plantelesKeys.indexOf('_id');
if (plIdIdx > -1) {
  plantelesKeys.splice(plIdIdx, 1);
  plantelesKeys.unshift('_id');
}

console.log(`✓ Columnas determinadas para PLANTELES: ${plantelesKeys.length} columnas.`);

const rowsPlanteles = [plantelesKeys];
for (let i = 0; i < planteles.length; i++) {
  const pl = planteles[i];
  const row = [];
  for (let j = 0; j < plantelesKeys.length; j++) {
    const k = plantelesKeys[j];
    const val = pl[k];
    if (val === undefined || val === null) {
      row.push('');
    } else if (typeof val === 'object') {
      row.push(JSON.stringify(val));
    } else {
      row.push(val);
    }
  }
  rowsPlanteles.push(row);
}

console.log(`• Creando hoja de cálculo PLANTELES (${rowsPlanteles.length} filas)...`);
const wsPlanteles = xlsx.utils.aoa_to_sheet(rowsPlanteles);

// 3. Crear libro y escribir archivo
console.log('\n• Escribiendo archivo Excel definitivo...');
const wb = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb, wsPersonal, 'PERSONAL');
xlsx.utils.book_append_sheet(wb, wsPlanteles, 'PLANTELES');

xlsx.writeFile(wb, EXCEL_PATH);

const stat = fs.statSync(EXCEL_PATH);
const sizeMB = (stat.size / (1024 * 1024)).toFixed(2);

console.log('\n========================================================================');
console.log('🎉 EXPORTACIÓN EN CRUDO COMPLETADA EXITOSAMENTE');
console.log(`   Archivo generado: ${EXCEL_PATH}`);
console.log(`   Tamaño del archivo: ${sizeMB} MB`);
console.log(`   Pestaña PERSONAL: ${personal.length} registros x ${personalKeys.length} columnas`);
console.log(`   Pestaña PLANTELES: ${planteles.length} registros x ${plantelesKeys.length} columnas`);
console.log('========================================================================');
