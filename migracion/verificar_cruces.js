const fs = require('fs');

const personalCsv = fs.readFileSync('RAC ESTADO MERIDA - PERSONAL.csv', 'utf-8').split('\n');
const plantelesCsv = fs.readFileSync('RAC ESTADO MERIDA - PLANTELES.csv', 'utf-8').split('\n');

// Parse headers
const plantelesHeaders = plantelesCsv[0].split(',');
const idxNombrePlantel = plantelesHeaders.indexOf('NOMBRE NOMINAL DEL PLANTEL');
const idxEponimo = plantelesHeaders.indexOf('NUEVO EPÓNIMO');
const idxCodigoPlantelPlanteles = plantelesHeaders.indexOf('CODIGO DEL PLANTEL');

const personalHeaders = personalCsv[0].split(',');
const idxUbicacionFisica = personalHeaders.indexOf('UBICACIÓN FÍSICA');
const idxCodigoPlantelPersonal = personalHeaders.indexOf('CODIGO DEL PLANTEL');

console.log(`Índices Planteles -> Nombre: ${idxNombrePlantel}, Epónimo: ${idxEponimo}, Código: ${idxCodigoPlantelPlanteles}`);
console.log(`Índices Personal -> Ubicación: ${idxUbicacionFisica}, Código: ${idxCodigoPlantelPersonal}`);

// Build dictionaries
const plantelesByCode = {};
const plantelesByName = {};

for (let i = 1; i < plantelesCsv.length; i++) {
    const parseCSVRow = (str) => {
        const result = [];
        let cur = '';
        let inQuotes = false;
        for (let j = 0; j < str.length; j++) {
            if (str[j] === '"') inQuotes = !inQuotes;
            else if (str[j] === ',' && !inQuotes) { result.push(cur); cur = ''; }
            else cur += str[j];
        }
        result.push(cur);
        return result;
    };
    const row = parseCSVRow(plantelesCsv[i].trim());
    if (row.length > idxCodigoPlantelPlanteles) {
        const codigo = row[idxCodigoPlantelPlanteles] ? row[idxCodigoPlantelPlanteles].trim() : '';
        const nombre = row[idxNombrePlantel] ? row[idxNombrePlantel].trim() : '';
        const eponimo = row[idxEponimo] ? row[idxEponimo].trim() : '';
        
        if (codigo) plantelesByCode[codigo] = { nombre, eponimo };
        if (nombre) plantelesByName[nombre] = { codigo, eponimo };
    }
}

let matchByCode = 0;
let matchByName = 0;
let noMatch = 0;
let totalLines = 0;
const huerfanosList = [];

for (let i = 1; i < personalCsv.length; i++) {
    const line = personalCsv[i].trim();
    if (!line) continue;
    totalLines++;
    
    const parseCSVRow = (str) => {
        const result = [];
        let cur = '';
        let inQuotes = false;
        for (let j = 0; j < str.length; j++) {
            if (str[j] === '"') inQuotes = !inQuotes;
            else if (str[j] === ',' && !inQuotes) { result.push(cur); cur = ''; }
            else cur += str[j];
        }
        result.push(cur);
        return result;
    };
    
    const parsedRow = parseCSVRow(line);
    
    if (parsedRow.length > idxCodigoPlantelPersonal) {
        const codigo = parsedRow[idxCodigoPlantelPersonal] ? parsedRow[idxCodigoPlantelPersonal].trim() : '';
        const ubicacion = parsedRow[idxUbicacionFisica] ? parsedRow[idxUbicacionFisica].trim() : '';
        
        if (codigo && plantelesByCode[codigo]) {
            matchByCode++;
        } else if (ubicacion && plantelesByName[ubicacion]) {
            matchByName++;
        } else {
            noMatch++;
            const cedula = parsedRow[1] ? parsedRow[1].trim() : 'S/N';
            huerfanosList.push(`${cedula},"${codigo}","${ubicacion}"`);
        }
    }
}

fs.writeFileSync('huerfanos.csv', '\uFEFFCEDULA,CODIGO DEL PLANTEL,UBICACION FISICA\n' + huerfanosList.join('\n'));

console.log('--- RESULTADOS DE LA VERIFICACIÓN ---');
console.log(`Total registros analizados: ${totalLines}`);
console.log(`Coinciden perfectamente por CODIGO DEL PLANTEL: ${matchByCode}`);
console.log(`Coinciden solo por UBICACIÓN FÍSICA (Nombre): ${matchByName}`);
console.log(`NO COINCIDEN CON NADA: ${noMatch}`);
console.log('Se ha generado el archivo huerfanos.csv con la lista detallada de los registros sin cruce.');

