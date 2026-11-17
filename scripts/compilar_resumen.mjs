import fs from 'fs';
import path from 'path';
import { normalizarMunicipio } from '../webapp/src/geografia.js';

const OUTPUT_RESUMEN = path.resolve('webapp', 'public', 'resumen_estadisticas.json');
const DIST_RESUMEN = path.resolve('webapp', 'dist', 'resumen_estadisticas.json');

const personal = JSON.parse(fs.readFileSync('scratch/corte_oficial_firestore_personal.json', 'utf8'));
const planteles = JSON.parse(fs.readFileSync('scratch/corte_oficial_firestore_planteles.json', 'utf8'));

const DEPS_OFICIALES = ['NACIONAL', 'ESTADAL', 'MUNICIPAL', 'AUTONOMA', 'SUBVENCIONADA', 'PRIVADA'];
function normalizarDep(raw) {
  const d = String(raw || '').trim().toUpperCase();
  if (d.includes('AUTONOM')) return 'AUTONOMA';
  if (d.includes('SUBVENCION')) return 'SUBVENCIONADA';
  if (d.includes('PRIVAD')) return 'PRIVADA';
  if (d.includes('MUNICIPAL')) return 'MUNICIPAL';
  if (d.includes('ESTADAL') && !d.includes('NACIONAL')) return 'ESTADAL';
  return 'NACIONAL';
}

function parseFechaIngreso(str) {
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
const anioJub = hoy.getFullYear() + 1;
const pivoteJub = new Date(anioJub, 2, 31);
const fechaLimiteJub = new Date(pivoteJub);
fechaLimiteJub.setFullYear(fechaLimiteJub.getFullYear() - 25);

const plantelesMap = new Map();
planteles.forEach(p => {
  const dea = String(p.codigos?.plantel || p.codigoDEA || p.id || p._id || '').trim().toUpperCase();
  const nombre = String(p['nombre-plantel']?.['nuevo-eponimo'] || p['nombre-plantel']?.nuevo_eponimo || p.denominacion || p.nombre || dea).trim().toUpperCase();
  const mun = normalizarMunicipio(p.municipio || '');
  const dep = normalizarDep(p.dependencia);
  const matTot = Number(p['matricula-total'] || p.matriculaTotal || p.matricula?.['total-gen'] || 0);
  const matMas = Number(p['matricula-masculino'] || p['total-gen-mas'] || p.masculino || p.matricula?.['total-gen-mas'] || 0);
  const matFem = Number(p['matricula-femenino'] || p['total-gen-fem'] || p.femenino || p.matricula?.['total-gen-fem'] || 0);
  const cargado = Boolean(p.datos_completados || p.matricula_cargada || (matTot > 0));

  plantelesMap.set(dea, {
    dea,
    nombre,
    municipio: mun,
    dependencia: dep,
    cargado,
    matricula: { total: matTot, masculino: matMas, femenino: matFem }
  });
});

const global = {
  totalPersonal: personal.length,
  totalPlanteles: planteles.length,
  docentes: { total: 0, mas: 0, fem: 0 },
  administrativos: { total: 0, mas: 0, fem: 0 },
  obreros: { total: 0, mas: 0, fem: 0 },
  porDependencia: {},
  situacion_laboral: {},
  jubilables: { total: 0, porMunicipio: [] },
  matricula: {
    total: 0,
    masculino: 0,
    femenino: 0,
    plantelesTotal: planteles.length,
    cargados: 0,
    pendientes: 0,
    porMunicipio: {}
  }
};

DEPS_OFICIALES.forEach(dep => {
  global.porDependencia[dep] = {
    total: 0,
    docentes: { total: 0, mas: 0, fem: 0 },
    administrativos: { total: 0, mas: 0, fem: 0 },
    obreros: { total: 0, mas: 0, fem: 0 }
  };
});

const porMunicipio = {};
const jubPorMun = {};
const personalPorPlantelMap = new Map();

plantelesMap.forEach((pl, dea) => {
  personalPorPlantelMap.set(dea, {
    dea,
    nombre: pl.nombre,
    dependencia: pl.dependencia,
    municipio: pl.municipio,
    total: 0,
    docentes: { total: 0, mas: 0, fem: 0 },
    administrativos: { total: 0, mas: 0, fem: 0 },
    obreros: { total: 0, mas: 0, fem: 0 },
    situacion_laboral: {},
    jubilables: { total: 0, lista: [] }
  });
});

personal.forEach(pers => {
  const tipo = String(pers.tipo_personal || pers['tipo-personal'] || pers.cargo || '').toUpperCase();
  const gen = String(pers.genero || pers.sexo || '').toUpperCase();
  const esMas = gen.startsWith('M') || gen === '1';

  let dea = String(pers['codigo-plantel'] || pers.codigoDEA || pers.codigoPlantel || pers.DEA || '').trim().toUpperCase();
  const plInfo = plantelesMap.get(dea);
  const mun = normalizarMunicipio(pers.municipio || plInfo?.municipio || '');
  const dep = normalizarDep(pers.dependencia || plInfo?.dependencia);

  if (!porMunicipio[mun]) {
    porMunicipio[mun] = {
      totalPersonal: 0,
      totalPlanteles: 0,
      docentes: { total: 0, mas: 0, fem: 0 },
      administrativos: { total: 0, mas: 0, fem: 0 },
      obreros: { total: 0, mas: 0, fem: 0 },
      porDependencia: {},
      situacion_laboral: {},
      jubilables: [],
      matricula: { total: 0, masculino: 0, femenino: 0, plantelesTotal: 0, cargados: 0, pendientes: 0, planteles: [] },
      personal_detallado: {
        total: 0,
        docentes: { total: 0, mas: 0, fem: 0 },
        administrativos: { total: 0, mas: 0, fem: 0 },
        obreros: { total: 0, mas: 0, fem: 0 },
        porDependencia: {},
        planteles: []
      }
    };
    DEPS_OFICIALES.forEach(d => {
      porMunicipio[mun].porDependencia[d] = { total: 0, docentes: { total: 0, mas: 0, fem: 0 }, administrativos: { total: 0, mas: 0, fem: 0 }, obreros: { total: 0, mas: 0, fem: 0 } };
      porMunicipio[mun].personal_detallado.porDependencia[d] = { total: 0, docentes: { total: 0, mas: 0, fem: 0 }, administrativos: { total: 0, mas: 0, fem: 0 }, obreros: { total: 0, mas: 0, fem: 0 } };
    });
  }

  const mMun = porMunicipio[mun];
  mMun.totalPersonal++;
  mMun.personal_detallado.total++;

  let targetGrupo = 'docentes';
  if (tipo.includes('ADM') || tipo.includes('TSU') || tipo.includes('SEC')) {
    targetGrupo = 'administrativos';
  } else if (tipo.includes('OBR') || tipo.includes('ASEAD') || tipo.includes('VIG')) {
    targetGrupo = 'obreros';
  }

  global[targetGrupo].total++;
  if (esMas) global[targetGrupo].mas++; else global[targetGrupo].fem++;
  global.porDependencia[dep].total++;
  global.porDependencia[dep][targetGrupo].total++;
  if (esMas) global.porDependencia[dep][targetGrupo].mas++; else global.porDependencia[dep][targetGrupo].fem++;

  mMun[targetGrupo].total++;
  if (esMas) mMun[targetGrupo].mas++; else mMun[targetGrupo].fem++;
  mMun.porDependencia[dep].total++;
  mMun.porDependencia[dep][targetGrupo].total++;
  if (esMas) mMun.porDependencia[dep][targetGrupo].mas++; else mMun.porDependencia[dep][targetGrupo].fem++;

  mMun.personal_detallado[targetGrupo].total++;
  if (esMas) mMun.personal_detallado[targetGrupo].mas++; else mMun.personal_detallado[targetGrupo].fem++;
  mMun.personal_detallado.porDependencia[dep].total++;
  mMun.personal_detallado.porDependencia[dep][targetGrupo].total++;
  if (esMas) mMun.personal_detallado.porDependencia[dep][targetGrupo].mas++; else mMun.personal_detallado.porDependencia[dep][targetGrupo].fem++;

  const sit = String(pers.situacion_laboral || pers['situacion-laboral'] || pers.condicion || 'ACTIVO').trim().toUpperCase();
  global.situacion_laboral[sit] = (global.situacion_laboral[sit] || 0) + 1;
  mMun.situacion_laboral[sit] = (mMun.situacion_laboral[sit] || 0) + 1;

  const dt = parseFechaIngreso(pers.fecha_ingreso || pers['fecha-ingreso']);
  const ant = parseInt(pers.antiguedad || pers.anos_servicio, 10) || 0;
  const esJub = (dt && dt <= fechaLimiteJub) || (ant >= 25);

  if (!dea) dea = 'SIN_DEA';
  if (!personalPorPlantelMap.has(dea)) {
    const plInfo = plantelesMap.get(dea);
    const nomP = plInfo ? (plInfo.nombre || dea) : (pers.plantel || 'PLANTEL NO ESPECIFICADO');
    personalPorPlantelMap.set(dea, {
      dea,
      nombre: nomP,
      dependencia: dep,
      municipio: mun,
      total: 0,
      docentes: { total: 0, mas: 0, fem: 0 },
      administrativos: { total: 0, mas: 0, fem: 0 },
      obreros: { total: 0, mas: 0, fem: 0 },
      situacion_laboral: {},
      jubilables: { total: 0, lista: [] }
    });
  }

  const pPlant = personalPorPlantelMap.get(dea);
  pPlant.total++;
  pPlant[targetGrupo].total++;
  if (esMas) pPlant[targetGrupo].mas++; else pPlant[targetGrupo].fem++;
  pPlant.situacion_laboral[sit] = (pPlant.situacion_laboral[sit] || 0) + 1;

  if (esJub) {
    global.jubilables.total++;
    jubPorMun[mun] = (jubPorMun[mun] || 0) + 1;
    pPlant.jubilables.total++;
    pPlant.jubilables.lista.push({
      cedula: String(pers.cedula || pers['cedula-identidad'] || pers.CEDULA || pers._id || '').trim(),
      nombre: String(pers['nombre-apellido'] || pers.nombres || pers['apellidos-nombres'] || pers.NOMBRE || '').trim().toUpperCase(),
      tipo: targetGrupo,
      antiguedad: ant
    });
  }
});

// Consolidar planteles en municipios y global
plantelesMap.forEach((pl, dea) => {
  const mun = pl.municipio;
  if (!porMunicipio[mun]) {
    porMunicipio[mun] = {
      totalPersonal: 0,
      totalPlanteles: 0,
      docentes: { total: 0, mas: 0, fem: 0 },
      administrativos: { total: 0, mas: 0, fem: 0 },
      obreros: { total: 0, mas: 0, fem: 0 },
      porDependencia: {},
      situacion_laboral: {},
      jubilables: [],
      matricula: { total: 0, masculino: 0, femenino: 0, plantelesTotal: 0, cargados: 0, pendientes: 0, planteles: [] },
      personal_detallado: { total: 0, docentes: { total: 0, mas: 0, fem: 0 }, administrativos: { total: 0, mas: 0, fem: 0 }, obreros: { total: 0, mas: 0, fem: 0 }, porDependencia: {}, planteles: [] }
    };
  }

  const mMun = porMunicipio[mun];
  mMun.totalPlanteles++;
  mMun.matricula.plantelesTotal++;
  if (pl.cargado) {
    mMun.matricula.cargados++;
    global.matricula.cargados++;
  } else {
    mMun.matricula.pendientes++;
    global.matricula.pendientes++;
  }

  const mTot = pl.matricula.total;
  const mMas = pl.matricula.masculino;
  const mFem = pl.matricula.femenino;

  mMun.matricula.total += mTot;
  mMun.matricula.masculino += mMas;
  mMun.matricula.femenino += mFem;

  global.matricula.total += mTot;
  global.matricula.masculino += mMas;
  global.matricula.femenino += mFem;

  const persPlant = personalPorPlantelMap.get(dea) || { total: 0, docentes: { total: 0, mas: 0, fem: 0 }, administrativos: { total: 0, mas: 0, fem: 0 }, obreros: { total: 0, mas: 0, fem: 0 } };

  mMun.matricula.planteles.push({
    dea,
    nombre: pl.nombre,
    cargado: pl.cargado,
    total: mTot,
    masculino: mMas,
    femenino: mFem
  });

  mMun.personal_detallado.planteles.push({
    dea,
    nombre: pl.nombre,
    total: persPlant.total,
    docentes: persPlant.docentes,
    administrativos: persPlant.administrativos,
    obreros: persPlant.obreros
  });
});

Object.keys(porMunicipio).forEach(m => {
  global.matricula.porMunicipio[m] = {
    total: porMunicipio[m].matricula.total,
    masculino: porMunicipio[m].matricula.masculino,
    femenino: porMunicipio[m].matricula.femenino,
    plantelesTotal: porMunicipio[m].totalPlanteles,
    cargados: porMunicipio[m].matricula.cargados,
    pendientes: porMunicipio[m].matricula.pendientes
  };
});

global.totalMatricula = global.matricula.total;
global.personal_detallado = {
  total: global.totalPersonal,
  docentes: { ...global.docentes },
  administrativos: { ...global.administrativos },
  obreros: { ...global.obreros },
  porDependencia: global.porDependencia
};

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

const resultado = {
  fecha_generacion: new Date().toISOString(),
  origen: 'Corte Oficial Cloud Firestore (17 de Noviembre 2026)',
  version: '2.38.7',
  fecha_corte: new Date().toISOString(),
  descripcion_corte: 'Corte Oficial Cloud Firestore (17 de Noviembre)',
  global,
  porMunicipio
};

fs.writeFileSync(OUTPUT_RESUMEN, JSON.stringify(resultado, null, 2), 'utf8');
fs.writeFileSync(DIST_RESUMEN, JSON.stringify(resultado, null, 2), 'utf8');
console.log('✓ resumen_estadisticas.json compilado y sincronizado con estructura 100% idéntica!');

