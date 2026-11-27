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
  const esPlanta = Boolean(p.es_planta || p.denominacion === 'SEDE ADMINISTRATIVA' || dea.startsWith('0012'));
  const mun = esPlanta ? 'PLANTA CENTRAL' : normalizarMunicipio(p.municipio || '');
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
    esPlanta,
    cargado,
    matricula: { total: matTot, masculino: matMas, femenino: matFem }
  });
});

// Incorporar funcionarios registrados en planteles.personal_resumen
const persCedSet = new Set(personal.map(p => String(p.cedula || p._id || '').trim()));
let agregadosDesdePlantel = 0;
planteles.forEach(pl => {
  const dea = String(pl.codigos?.plantel || pl.codigoDEA || pl.id || pl._id || '').trim().toUpperCase();
  const plInfo = plantelesMap.get(dea);
  const depPlantel = plInfo?.dependencia || 'NACIONAL';
  const munPlantel = plInfo?.municipio || '';

  (pl.personal_resumen || []).forEach(r => {
    const ced = String(r.cedula || '').trim();
    if (!ced || persCedSet.has(ced)) return;
    persCedSet.add(ced);
    agregadosDesdePlantel++;

    const cUpper = String(r.cargo || '').toUpperCase();
    let tipo = 'DOCENTE';
    if (cUpper.includes('OBR') || cUpper.includes('ASEAD') || cUpper.includes('VIGIL') || cUpper.includes('PORTER') || cUpper.includes('COCIN') || cUpper.includes('MANTEN') || cUpper.includes('CHOFER') || cUpper.includes('ALBAÑIL') || cUpper.includes('SERVICIOS GENERALES')) {
      tipo = 'OBRERO';
    } else if (cUpper.includes('ADM') || cUpper.includes('SEC') || cUpper.includes('ASIST') || cUpper.includes('TSU') || cUpper.includes('BACHILLER') || cUpper.includes('OFICINA') || cUpper.includes('PROFESIONAL')) {
      tipo = 'ADMINISTRATIVO';
    }

    personal.push({
      _id: `${dea}_${ced}`,
      cedula: ced,
      nombres: r.nombre || '',
      'nombre-apellido': r.nombre || '',
      cargo: r.cargo || '',
      codigoDEA: dea,
      'codigo-plantel': dea,
      municipio: munPlantel,
      dependencia: depPlantel,
      'tipo-personal': tipo,
      genero: 'FEMENINO',
      situacion_laboral: 'ACTIVO'
    });
  });
});

console.log(`• Total personal base: ${personal.length - agregadosDesdePlantel} + ${agregadosDesdePlantel} nuevos de planteles = ${personal.length}`);

const plantelesEducativos = planteles.filter(p => !p.es_planta && p.denominacion !== 'SEDE ADMINISTRATIVA' && !(p.codigos?.plantel || p.codigoDEA || p.id || '').startsWith('0012'));

const global = {
  totalPersonal: personal.length,
  totalPlanteles: plantelesEducativos.length,
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
    plantelesTotal: plantelesEducativos.length,
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
  const esPlantaPers = Boolean(plInfo?.esPlanta || dea.startsWith('0012') || pers.es_planta || pers.denominacion === 'SEDE ADMINISTRATIVA');
  const mun = esPlantaPers ? 'PLANTA CENTRAL' : normalizarMunicipio(pers.municipio || plInfo?.municipio || '');

  // Clasificación canónica de dependencia institucional
  let dep = 'NACIONAL';
  if (plInfo && plInfo.dependencia && plInfo.dependencia !== 'NACIONAL') {
    dep = plInfo.dependencia;
  } else if (pers.dependencia) {
    dep = normalizarDep(pers.dependencia);
  } else if (plInfo?.dependencia) {
    dep = normalizarDep(plInfo.dependencia);
  }

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
  if (tipo.includes('ADM') || tipo.includes('TSU') || tipo.includes('SEC') || tipo.includes('ASIST') || tipo.includes('OFICINA') || tipo.includes('PROFESIONAL')) {
    targetGrupo = 'administrativos';
  } else if (tipo.includes('OBR') || tipo.includes('ASEAD') || tipo.includes('VIGIL') || tipo.includes('PORTER') || tipo.includes('COCIN') || tipo.includes('MANTEN') || tipo.includes('CHOFER') || tipo.includes('ALBAÑIL') || tipo.includes('SERVICIOS GENERALES')) {
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

  if (!pl.esPlanta) {
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

    mMun.matricula.planteles.push({
      dea,
      nombre: pl.nombre,
      dependencia: pl.dependencia,
      cargado: pl.cargado,
      total: mTot,
      masculino: mMas,
      femenino: mFem
    });
  }

  const persPlant = personalPorPlantelMap.get(dea) || { total: 0, docentes: { total: 0, mas: 0, fem: 0 }, administrativos: { total: 0, mas: 0, fem: 0 }, obreros: { total: 0, mas: 0, fem: 0 } };

  mMun.personal_detallado.planteles.push({
    dea,
    nombre: pl.nombre,
    dependencia: pl.dependencia,
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
  origen: 'Consolidado Oficial SGH Mérida con Dependencias Homologadas',
  version: '2.38.15',
  fecha_corte: new Date().toISOString(),
  descripcion_corte: 'Corte Consolidado SGH Mérida con 6 Dependencias',
  global,
  porMunicipio
};

fs.writeFileSync(OUTPUT_RESUMEN, JSON.stringify(resultado, null, 2), 'utf8');
fs.writeFileSync(DIST_RESUMEN, JSON.stringify(resultado, null, 2), 'utf8');
console.log('✓ resumen_estadisticas.json compilado y sincronizado con dependencias 100% canónicas!');
