import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

const EXCEL_PATH = path.resolve('nomina_acualizada', 'Nomina_Personal_Consolidado_Estadal_MERIDA_2026-11-09.xlsx');
const BD_SGH_PATH = path.resolve('bd_sgh.json');
const OUTPUT_PATH = path.resolve('webapp', 'public', 'resumen_estadisticas.json');

console.log('--- REGENERADOR DE RESUMEN DE ESTADÍSTICAS SGH (2026-11-09) ---');
console.log('Leyendo Excel:', EXCEL_PATH);

const wb = XLSX.readFile(EXCEL_PATH);
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet);
console.log(`Total registros leídos del Excel: ${rows.length}`);

console.log('Leyendo base de planteles:', BD_SGH_PATH);
const bdSgh = JSON.parse(fs.readFileSync(BD_SGH_PATH, 'utf8'));

// 1. Mapear planteles desde bd_sgh.json
const plantelesMap = new Map();
const plantelesPorMunicipio = {};

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

const global = {
  totalPersonal: rows.length,
  totalPlanteles: totalPlantelesEstado,
  docentes: 0,
  administrativos: 0,
  obreros: 0,
  situacion_laboral: {},
  jubilables: {
    total: 0,
    porMunicipio: []
  },
  matricula: {
    cargados: 0,
    pendientes: totalPlantelesEstado,
    porMunicipio: {}
  }
};

const porMunicipio = {};
const jubMunCount = {};

for (const [munNorm, arrPlanteles] of Object.entries(plantelesPorMunicipio)) {
  porMunicipio[munNorm] = {
    totalPersonal: 0,
    totalPlanteles: arrPlanteles.length,
    docentes: 0,
    administrativos: 0,
    obreros: 0,
    situacion_laboral: {},
    jubilables: {},
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

rows.forEach(r => {
  const tipo = (r['Tipo de Personal'] || '').toUpperCase();
  if (tipo.includes('DOCENTE')) global.docentes++;
  else if (tipo.includes('ADMINISTRATIVO')) global.administrativos++;
  else if (tipo.includes('OBRERO')) global.obreros++;

  const sit = (r['Situación Laboral'] || 'NO DEFINIDA').toUpperCase().trim();
  global.situacion_laboral[sit] = (global.situacion_laboral[sit] || 0) + 1;

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

global.jubilables.porMunicipio = Object.entries(jubMunCount)
  .map(([clave, count]) => ({ clave, count }))
  .sort((a, b) => b.count - a.count);

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

// Inyectar Aliases obligatorios (Intervención 180)
const aliases = {
  'JULIO CESAR SALAS': 'JULIO CESAR',
  'JULIO CÉSAR SALAS': 'JULIO CESAR',
  'CARACCIOLO PARRA OLMEDO': 'CARACCIOLO PARRA',
  'ANTONIO PINTO SALINAS': 'ANTONIO PINTO SALINA',
  'TULIO FEBRES CORDERO': 'TULIO FEBRES',
  'ANDRÉS BELLO': 'ANDRES BELLO',
  'CAMPO ELÍAS': 'CAMPO ELIAS',
  'ARZOBISPO CHACÓN': 'ARZOBISPO CHACON',
  'RIVAS DÁVILA': 'RIVAS DAVILA',
  'JUSTO BRICENO': 'JUSTO BRICEÑO'
};

for (const [alias, canonical] of Object.entries(aliases)) {
  if (porMunicipio[canonical]) {
    porMunicipio[alias] = porMunicipio[canonical];
  }
}

const resultadoFinal = {
  fecha_generacion: new Date().toISOString(),
  origen: 'Nomina_Personal_Consolidado_Estadal_MERIDA_2026-11-09.xlsx',
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

