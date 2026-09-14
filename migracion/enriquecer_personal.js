const fs = require('fs');

console.log('Iniciando proceso de enriquecimiento de datos...');

// 1. Cargar CSVs
const personalCsv = fs.readFileSync('RAC ESTADO MERIDA - PERSONAL.csv', 'utf-8').split('\n');
const plantelesCsv = fs.readFileSync('RAC ESTADO MERIDA - PLANTELES.csv', 'utf-8').split('\n');

// 2. Cargar JSON de respaldo
const bdSgh = JSON.parse(fs.readFileSync('../bd_sgh.json', 'utf-8'));
const jsonPlantelesByCode = {};
const jsonPlantelesByName = {};

if (bdSgh.municipios) {
    for (const municipio in bdSgh.municipios) {
        const parroquias = bdSgh.municipios[municipio].parroquias;
        if (parroquias) {
            for (const parroquia in parroquias) {
                const dataParroquia = parroquias[parroquia];
                if (dataParroquia && dataParroquia.planteles) {
                const planteles = dataParroquia.planteles;
                for (const codigo in planteles) {
                    const nombre = planteles[codigo].nombre_plantel || '';
                    const eponimo = planteles[codigo].nuevo_eponimo || '';
                    
                    jsonPlantelesByCode[codigo] = { eponimo, nombre };
                    if (nombre) jsonPlantelesByName[nombre] = { eponimo, codigo };
                }
            }
        }
        }
    }
}

// 3. Parsear Planteles CSV
const plantelesHeaders = plantelesCsv[0].split(',');
const idxNombrePlantel = plantelesHeaders.indexOf('NOMBRE NOMINAL DEL PLANTEL');
const idxEponimo = plantelesHeaders.indexOf('NUEVO EPÓNIMO');
const idxCodigoPlantelPlanteles = plantelesHeaders.indexOf('CODIGO DEL PLANTEL');

const plantelesByCode = {};
const plantelesByName = {};

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

for (let i = 1; i < plantelesCsv.length; i++) {
    if (!plantelesCsv[i].trim()) continue;
    const row = parseCSVRow(plantelesCsv[i].trim());
    if (row.length > idxCodigoPlantelPlanteles) {
        const codigo = row[idxCodigoPlantelPlanteles] ? row[idxCodigoPlantelPlanteles].trim() : '';
        const eponimo = row[idxEponimo] ? row[idxEponimo].trim() : '';
        const nombre = row[idxNombrePlantel] ? row[idxNombrePlantel].trim() : '';
        
        if (codigo) plantelesByCode[codigo] = { eponimo };
        if (nombre) plantelesByName[nombre] = { eponimo };
    }
}

// 4. Enriquecer Personal CSV
const personalHeaders = personalCsv[0].split(',');
const idxCodigoPlantelPersonal = personalHeaders.indexOf('CODIGO DEL PLANTEL');
const idxUbicacionFisica = personalHeaders.indexOf('UBICACIÓN FÍSICA');

// Vamos a añadir la columna al final
const newHeaders = personalCsv[0].trim() + ',"NUEVO EPÓNIMO"\n';
let outputCsv = newHeaders;

let matchCsvCode = 0;
let matchCsvName = 0;
let matchJsonCode = 0;
let matchJsonName = 0;
let noMatch = 0;

for (let i = 1; i < personalCsv.length; i++) {
    const line = personalCsv[i].trim();
    if (!line) continue;
    
    const parsedRow = parseCSVRow(line);
    let codigo = '';
    let ubicacion = '';
    
    if (parsedRow.length > idxCodigoPlantelPersonal) {
        codigo = parsedRow[idxCodigoPlantelPersonal] ? parsedRow[idxCodigoPlantelPersonal].trim() : '';
        ubicacion = parsedRow[idxUbicacionFisica] ? parsedRow[idxUbicacionFisica].trim() : '';
    }
    
    let eponimoEncontrado = '';
    
    if (codigo && plantelesByCode[codigo]) {
        eponimoEncontrado = plantelesByCode[codigo].eponimo;
        matchCsvCode++;
    } else if (ubicacion && plantelesByName[ubicacion]) {
        eponimoEncontrado = plantelesByName[ubicacion].eponimo;
        matchCsvName++;
    } else if (codigo && jsonPlantelesByCode[codigo]) {
        eponimoEncontrado = jsonPlantelesByCode[codigo].eponimo;
        matchJsonCode++;
    } else if (ubicacion && jsonPlantelesByName[ubicacion]) {
        eponimoEncontrado = jsonPlantelesByName[ubicacion].eponimo;
        matchJsonName++;
    } else {
        noMatch++;
    }
    
    // Escapar comillas dobles si el eponimo las tiene
    eponimoEncontrado = eponimoEncontrado.replace(/"/g, '""');
    outputCsv += line + `,"${eponimoEncontrado}"\n`;
}

// 5. Guardar el nuevo archivo
fs.writeFileSync('RAC ESTADO MERIDA - PERSONAL ENRIQUECIDO.csv', outputCsv);

console.log('--- RESUMEN DE ENRIQUECIMIENTO ---');
console.log(`Coincidencias (CSV Código): ${matchCsvCode}`);
console.log(`Coincidencias (CSV Nombre): ${matchCsvName}`);
console.log(`Coincidencias rescatadas (JSON Código): ${matchJsonCode}`);
console.log(`Coincidencias rescatadas (JSON Nombre): ${matchJsonName}`);
console.log(`Huérfanos totales (sin eponimo en ningún lado): ${noMatch}`);

console.log('¡Archivo "RAC ESTADO MERIDA - PERSONAL ENRIQUECIDO.csv" generado con éxito!');
