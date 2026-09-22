import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

const EXCEL_PATH = path.join(process.env.USERPROFILE, 'Downloads', 'Nomina_Personal_Consolidado_Estadal_MERIDA_2026-09-21 (5).xlsx');
const BD_SGH_PATH = path.resolve('public', 'bd_sgh.json');
const OUTPUT_PATH = path.resolve('public', 'resumen_estadisticas.json');

console.log('--- GENERADOR DE RESUMEN DE ESTADÍSTICAS ZERO-COST ---');
console.log('Leyendo Excel:', EXCEL_PATH);

if (!fs.existsSync(EXCEL_PATH)) {
  console.error('Error: No se encontró el archivo Excel en Descargas:', EXCEL_PATH);
  process.exit(1);
}

const wb = XLSX.readFile(EXCEL_PATH);
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet);
console.log(`Total registros leídos del Excel: ${rows.length}`);

console.log('Leyendo base de planteles:', BD_SGH_PATH);
const bdSgh = JSON.parse(fs.readFileSync(BD_SGH_PATH, 'utf8'));

// 1. Mapear planteles desde bd_sgh.json
const plantelesMap = new Map(); // DEA -> info
const plantelesPorMunicipio = {}; // Mun -> Array de escuelas

for (const [mName, mData] of Object.entries(bdSgh.municipios || {})) {
  const munNorm = mName.trim().toUpperCase();
  if (!plantelesPorMunicipio[munNorm]) plantelesPorMunicipio[munNorm] = [];

  for (const [pName, pData] of Object.entries(mData.parroquias || {})) {
    const parrNorm = pName.trim().toUpperCase();
    for (const [dea, info] of Object.entries(pData.planteles || {})) {
      const deaNorm = dea.trim().toUpperCase();
      const nombre = (info.nuevo_eponimo || info.nombre_plantel || info.denominacion || 'Desconocido').trim().toUpperCase();
      
      const pObj = {
        dea: deaNorm,
        nombre: nombre,
        municipio: munNorm,
        parroquia: parrNorm,
        dependencia: info.dependencia || ''
      };
      plantelesMap.set(deaNorm, pObj);
      plantelesPorMunicipio[munNorm].push(pObj);
    }
  }
}

const totalPlantelesEstado = plantelesMap.size;
console.log(`Total planteles mapeados: ${totalPlantelesEstado} en ${Object.keys(plantelesPorMunicipio).length} municipios.`);

// 2. Auxiliar para cálculo de jubilación
function parseFecha(str) {
  if (!str) return null;
  if (typeof str === 'number') {
    return new Date((str - (25567 + 2)) * 86400 * 1000);
  }
  const parts = String(str).trim().split('/');
  if (parts.length === 3) {
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    return new Date(y, m, d);
  }
  const dt = new Date(str);
  return isNaN(dt.getTime()) ? null : dt;
}

const hoy = new Date();
const anioJubilacion = hoy.getFullYear() + 1;
const pivoteJubilacion = new Date(anioJubilacion, 2, 31);
const fechaLimite = new Date(pivoteJubilacion);
fechaLimite.setFullYear(fechaLimite.getFullYear() - 25);

// 3. Estructuras de acumulación
const global = {
  totalPersonal: rows.length,
  totalPlanteles: totalPlantelesEstado,
  docentes: 0,
  administrativos: 0,
  obreros: 0,
  situacion_laboral: {},
  jubilables: {
    total: 0,
    porMunicipio: [] // [{ clave: 'LIBERTADOR', count: 505 }, ...]
  },
  matricula: {
    cargados: 0,
    pendientes: totalPlantelesEstado,
    porMunicipio: {} // { [mun]: { cargados: 0, pendientes: N } }
  }
};

const porMunicipio = {};
const jubMunCount = {};

// Inicializar porMunicipio con los planteles
for (const [munNorm, arrPlanteles] of Object.entries(plantelesPorMunicipio)) {
  porMunicipio[munNorm] = {
    totalPersonal: 0,
    totalPlanteles: arrPlanteles.length,
    docentes: 0,
    administrativos: 0,
    obreros: 0,
    situacion_laboral: {},
    jubilables: {}, // { [dea]: count }
    matricula: {
      cargados: 0,
      pendientes: arrPlanteles.length,
      arrCargados: [],
      arrPendientes: arrPlanteles.map(p => p.nombre).sort()
    }
  };
  global.matricula.porMunicipio[munNorm] = {
    cargados: 0,
    pendientes: arrPlanteles.length
  };
}

// 4. Procesar personal del Excel
rows.forEach(r => {
  const tipo = (r['Tipo de Personal'] || '').toUpperCase();
  if (tipo.includes('DOCENTE')) global.docentes++;
  else if (tipo.includes('ADMINISTRATIVO')) global.administrativos++;
  else if (tipo.includes('OBRERO')) global.obreros++;

  const sit = (r['Situación Laboral'] || 'NO DEFINIDA').toUpperCase().trim();
  global.situacion_laboral[sit] = (global.situacion_laboral[sit] || 0) + 1;

  // Municipio del trabajador
  let mun = (r['Municipio'] || '').toUpperCase().trim();
  const dea = (r['Código Plantel (DEA)'] || '').toUpperCase().trim();
  
  if (!mun && dea && plantelesMap.has(dea)) {
    mun = plantelesMap.get(dea).municipio;
  }
  if (!mun) mun = 'SIN MUNICIPIO';

  if (!porMunicipio[mun]) {
    porMunicipio[mun] = {
      totalPersonal: 0,
      totalPlanteles: 0,
      docentes: 0,
      administrativos: 0,
      obreros: 0,
      situacion_laboral: {},
      jubilables: {},
      matricula: { cargados: 0, pendientes: 0, arrCargados: [], arrPendientes: [] }
    };
  }

  porMunicipio[mun].totalPersonal++;
  if (tipo.includes('DOCENTE')) porMunicipio[mun].docentes++;
  else if (tipo.includes('ADMINISTRATIVO')) porMunicipio[mun].administrativos++;
  else if (tipo.includes('OBRERO')) porMunicipio[mun].obreros++;

  porMunicipio[mun].situacion_laboral[sit] = (porMunicipio[mun].situacion_laboral[sit] || 0) + 1;

  // Jubilación
  const dt = parseFecha(r['Fecha de Ingreso']);
  const ant = parseInt(r['Años de Antigüedad'], 10) || 0;
  const esJub = (dt && dt <= fechaLimite) || (ant >= 25);
  
  if (esJub) {
    global.jubilables.total++;
    jubMunCount[mun] = (jubMunCount[mun] || 0) + 1;

    const clavePlantel = dea || 'SIN_DEA';
    porMunicipio[mun].jubilables[clavePlantel] = (porMunicipio[mun].jubilables[clavePlantel] || 0) + 1;
  }
});

// Formatear jubilables globales ordenados
global.jubilables.porMunicipio = Object.entries(jubMunCount)
  .map(([clave, count]) => ({ clave, count }))
  .sort((a, b) => b.count - a.count);

// Formatear jubilables por municipio ordenados
for (const [mun, data] of Object.entries(porMunicipio)) {
  const listaJub = Object.entries(data.jubilables)
    .map(([dea, count]) => {
      const p = plantelesMap.get(dea);
      return {
        clave: dea,
        nombre: p ? p.nombre : dea,
        count
      };
    })
    .sort((a, b) => b.count - a.count);
  data.jubilables = listaJub;
}

const resultadoFinal = {
  fecha_generacion: new Date().toISOString(),
  origen: 'Nomina_Personal_Consolidado_Estadal_MERIDA_2026-09-21.xlsx',
  global,
  porMunicipio
};

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(resultadoFinal, null, 2), 'utf8');
console.log('✅ Archivo generado exitosamente en:', OUTPUT_PATH);
console.log('Resumen Global:', {
  totalPersonal: global.totalPersonal,
  docentes: global.docentes,
  administrativos: global.administrativos,
  obreros: global.obreros,
  jubilables: global.jubilables.total,
  totalPlanteles: global.totalPlanteles
});
