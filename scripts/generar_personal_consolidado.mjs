import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';
import { normalizarMunicipio } from '../webapp/src/geografia.js';

const DEST_FILE = path.resolve('nomina_acualizada', 'corte_noviembre_17_consolidado.xlsx');
const TARGET_ORIGINAL = path.resolve('nomina_acualizada', 'corte_noviembre_17.xlsx');

const PERSONAL_PATH = path.resolve('scratch', 'corte_oficial_firestore_personal.json');
const PLANTELES_PATH = path.resolve('scratch', 'corte_oficial_firestore_planteles.json');

console.log('========================================================================');
console.log('=== SGH MÉRIDA: GENERADOR DE PERSONAL CONSOLIDADO (CORTE OFICIAL) ===');
console.log('========================================================================');

const personal = JSON.parse(fs.readFileSync(PERSONAL_PATH, 'utf8'));
const planteles = JSON.parse(fs.readFileSync(PLANTELES_PATH, 'utf8'));

console.log(`• Registros de personal: ${personal.length}`);
console.log(`• Registros de planteles: ${planteles.length}`);

// Mapa de planteles para enriquecer datos vacíos
const plantelesMap = new Map();
for (const pl of planteles) {
  const dea = String(pl.codigos?.plantel || pl.codigoDEA || pl.id || pl._id || '').trim().toUpperCase();
  if (dea) plantelesMap.set(dea, pl);
}

function normalizarDep(raw) {
  const d = String(raw || '').trim().toUpperCase();
  if (d.includes('AUTONOM')) return 'AUTONOMA';
  if (d.includes('SUBVENCION')) return 'SUBVENCIONADA';
  if (d.includes('PRIVAD')) return 'PRIVADA';
  if (d.includes('MUNICIPAL')) return 'MUNICIPAL';
  if (d.includes('ESTADAL') && !d.includes('NACIONAL')) return 'ESTADAL';
  if (d.includes('NACIONAL')) return 'NACIONAL';
  return d || 'NACIONAL';
}

const headersConsolidado = [
  '_id',
  'cedula',
  'nombre_completo',
  'nacionalidad',
  'genero',
  'fecha_nacimiento',
  'edad',
  'estado_civil',
  'lugar_nacimiento',
  'telefono_celular',
  'telefono_habitacion',
  'telefono_oficina',
  'correo',
  'direccion',
  'instruccion',
  'profesion',
  'codigo_plantel',
  'nombre_plantel',
  'municipio',
  'parroquia',
  'estado',
  'ubicacion_administrativa',
  'oficina',
  'tipo_personal',
  'rango',
  'cargo',
  'codigo_rac',
  'dependencia_administrativa',
  'titular',
  'situacion_laboral',
  'observaciones',
  'fecha_ingreso',
  'antiguedad',
  'pertenece_estructura_municipal',
  'cargo_estructura_municipal',
  'horas_recibo',
  'horas_academicas',
  'horas_administrativas',
  'horas_por_programar',
  'turnos_atiende',
  'atiende_matricula',
  'nivel_modalidad',
  'especialidad_imparte',
  'talla_camisa',
  'talla_pantalon',
  'talla_zapato',
  'tipo_vivienda',
  'condicion_vivienda',
  'tipo_material',
  'actividad_deportiva',
  'actividad_cultural',
  'tipo_enfermedad',
  'medicamento',
  'discapacidad',
  'ubch',
  'circuito_comunal',
  'centro_votacion',
  'planes_estudio_json',
  'ultima_actualizacion'
];

console.log(`• Consolidando filas para ${headersConsolidado.length} columnas oficiales...`);

const rowsPersonal = [headersConsolidado];

for (let i = 0; i < personal.length; i++) {
  const p = personal[i];

  const docId = String(p._id || '').trim();
  const cedula = String(p.cedula || p.CEDULA || p['cedula-identidad'] || (docId.includes('_') ? docId.split('_').pop() : docId) || '').trim();
  const nombre = String(p['nombre-apellido'] || p.nombres || p['apellidos-nombres'] || p.NOMBRE || p.nombre || '').trim().toUpperCase();
  const nacionalidad = String(p.nacionalidad || p.NACIONALIDAD || (cedula ? 'V' : '')).trim().toUpperCase();
  const genero = String(p.genero || p.GENERO || '').trim().toUpperCase();
  const fechaNac = String(p['fecha-nacimiento'] || p['FECHA DE NACIMIENTO'] || p.fechaNacimiento || '').trim();
  const edad = p.edad ?? p.EDAD ?? '';
  const estadoCivil = String(p['estado-civil'] || p['ESTADO CIVIL'] || p.estadoCivil || '').trim().toUpperCase();
  const lugarNac = String(p['lugar-nacimiento'] || p.lugarNacimiento || '').trim().toUpperCase();

  const telCelular = String(p['tel-celular'] || p['TELEFONO CELULAR'] || p.telefonoCelular || '').trim();
  const telHab = String(p['tel-habitacion'] || p['TELEFONO HABITACION'] || p.telefonoHabitacion || '').trim();
  const telOfi = String(p['tel-oficina'] || p['TELEFONO OFICINA'] || '').trim();
  const correo = String(p.correo || p.CORREO || '').trim().toLowerCase();
  const direccion = String(p.direccion || p.DIRECCION || '').trim().toUpperCase();

  const instruccion = String(p.instruccion || p['nivel-instruccion'] || p.nivelInstruccion || '').trim().toUpperCase();
  const profesion = String(p.profesion || p['PROFESIÓN'] || '').trim().toUpperCase();

  const codigoPlantel = String(p['codigo-plantel'] || p.codigoDEA || p.codigoPlantel || p['CODIGO DEL PLANTEL'] || (docId.includes('_') ? docId.split('_')[0] : '') || '').trim().toUpperCase();

  const plInfo = plantelesMap.get(codigoPlantel) || {};
  let nombrePlantel = String(
    p.plantel ||
    p['ubicacion-fisica'] ||
    p['UBICACIÓN FÍSICA'] ||
    plInfo['nombre-plantel']?.['nuevo-eponimo'] ||
    plInfo['nombre-plantel']?.nuevo_eponimo ||
    plInfo['nombre-plantel']?.nominal ||
    plInfo.denominacion ||
    plInfo.nombre ||
    ''
  ).trim().toUpperCase();

  let municipio = normalizarMunicipio(p.municipio || p.MUNICIPIO || plInfo.municipio || '');
  let parroquia = String(p.parroquia || p.PARROQUIA || plInfo.parroquia || '').trim().toUpperCase();
  const estado = 'MÉRIDA';
  const ubicAdmin = String(p['ubicacion-administrativa'] || p['UBICACIÓN ADMINISTRATIVA'] || '').trim();
  const oficina = String(p.oficina || '').trim().toUpperCase();

  const tipoPersonal = String(p['tipo-personal'] || p['TIPO PERSONAL'] || p.tipoPersonal || '').trim().toUpperCase();
  const rango = String(p.subcategoria || p.rango || '').trim().toUpperCase();
  const cargo = String(p.cargo || p.CARGO || p['codigo-cargo'] || p.codigoCargo || '').trim().toUpperCase();
  const codigoRac = String(p['codigo-rac'] || p['CODIGO RAC'] || p.codigoRac || '').trim().toUpperCase();
  const dependencia = normalizarDep(p.dependencia || p.DEPENDENCIA || plInfo.dependencia);
  const titular = String(p.titular || p.TITULAR || '').trim().toUpperCase();
  const situacionLaboral = String(p['situacion-laboral'] || p['SITUACIÓN DEL TRABAJADOR'] || p.situacion || 'ACTIVO').trim().toUpperCase();

  const observaciones = String(p.observaciones || p.OBSERVACIÓN || p.observacion || p['descripcion-situacion'] || '').trim().toUpperCase();

  const fechaIngreso = String(p['fecha-ingreso'] || p['FECHA DE INGRESO'] || p.fechaIngreso || '').trim();
  const antiguedad = p.antiguedad ?? p.ANTIGUEDAD ?? '';

  const estMun = String(p['pertenece-estructura-municipal'] || '').trim().toUpperCase();
  const cargoEstMun = String(p['cargo-estructura-municipal'] || '').trim().toUpperCase();

  const horasRecibo = p['horas-recibo'] ?? p['HORAS DE RECIBO'] ?? p.horasRecibo ?? '';
  const horasAcad = p['horas-academicas'] ?? p['HORAS ACADEMICAS'] ?? p.horasAcademicas ?? '';
  const horasAdmin = p['horas-administrativas'] ?? p['HORAS ADMINISTRATIVAS'] ?? p.horasAdministrativas ?? '';
  const horasProg = p['horas-por-programar'] ?? '';

  const turnosAtiende = String(p['turnos-atiende'] || p['TURNOS DEL PLANTEL'] || '').trim().toUpperCase();
  const atiendeMatricula = String(p['atiende-matricula'] || '').trim().toUpperCase();
  const nivelModalidad = String(p['nivel-modalidad'] || '').trim().toUpperCase();
  const espImparte = String(p['especialidad-imparte'] || '').trim().toUpperCase();

  const tallaCamisa = String(p['talla-camisa'] || '').trim().toUpperCase();
  const tallaPantalon = String(p['talla-pantalon'] || '').trim().toUpperCase();
  const tallaZapato = String(p['talla-zapato'] || '').trim().toUpperCase();
  const tipoVivienda = String(p['tipo-vivienda'] || '').trim().toUpperCase();
  const condicionVivienda = String(p['condicion-vivienda'] || '').trim().toUpperCase();
  const tipoMaterial = String(p['tipo-material'] || '').trim().toUpperCase();

  const actDeportiva = String(p['actividad-deportiva'] || p['ACTIVIDAD DEPORTIVA'] || '').trim().toUpperCase();
  const actCultural = String(p['actividad-cultural'] || p['ACTIVIDAD CULTURAL'] || '').trim().toUpperCase();
  const tipoEnfermedad = String(p['tipo-enfermedad'] || '').trim().toUpperCase();
  const medicamento = String(p.medicamento || p.MEDICAMENTO || '').trim().toUpperCase();
  const discapacidad = String(p.discapacidad || '').trim().toUpperCase();

  const ubch = String(p.ubch || p.UBCH || '').trim().toUpperCase();
  const circComunal = String(p['circuito-comunal'] || p['CIRCUITO COMUNAL'] || '').trim().toUpperCase();
  const centroVot = String(p['centro-votacion'] || '').trim().toUpperCase();

  // Extraer cualquier carga horaria de planes de estudio si existe
  const planesKeys = Object.keys(p).filter(k => /^\d{5}$/.test(k));
  let planesJson = '';
  if (planesKeys.length > 0) {
    const obj = {};
    for (const pk of planesKeys) {
      obj[pk] = p[pk];
    }
    planesJson = JSON.stringify(obj);
  }

  const ultimaAct = String(p.ultima_actualizacion || '').trim();

  rowsPersonal.push([
    docId,
    cedula,
    nombre,
    nacionalidad,
    genero,
    fechaNac,
    edad,
    estadoCivil,
    lugarNac,
    telCelular,
    telHab,
    telOfi,
    correo,
    direccion,
    instruccion,
    profesion,
    codigoPlantel,
    nombrePlantel,
    municipio,
    parroquia,
    estado,
    ubicAdmin,
    oficina,
    tipoPersonal,
    rango,
    cargo,
    codigoRac,
    dependencia,
    titular,
    situacionLaboral,
    observaciones,
    fechaIngreso,
    antiguedad,
    estMun,
    cargoEstMun,
    horasRecibo,
    horasAcad,
    horasAdmin,
    horasProg,
    turnosAtiende,
    atiendeMatricula,
    nivelModalidad,
    espImparte,
    tallaCamisa,
    tallaPantalon,
    tallaZapato,
    tipoVivienda,
    condicionVivienda,
    tipoMaterial,
    actDeportiva,
    actCultural,
    tipoEnfermedad,
    medicamento,
    discapacidad,
    ubch,
    circComunal,
    centroVot,
    planesJson,
    ultimaAct
  ]);
}

console.log(`✓ Filas construidas: ${rowsPersonal.length - 1} registros.`);

// 2. Preparar hoja PLANTELES
console.log('• Preparando hoja PLANTELES...');
const headersPlanteles = [
  '_id',
  'codigo_institucional',
  'nombre_plantel',
  'nuevo_eponimo',
  'denominacion',
  'den_abr',
  'dependencia_administrativa',
  'municipio',
  'parroquia',
  'estado',
  'ubicacion_geografica',
  'nivel',
  'modalidad',
  'turno',
  'matricula_total',
  'matricula_masculino',
  'matricula_femenino',
  'matricula_desglosada_json',
  'total_personal',
  'codigo_estadistico',
  'codigo_dependencia',
  'planes_estudio',
  'secciones_planes',
  'datos_completados',
  'observaciones',
  'ultima_actualizacion'
];

const rowsPlanteles = [headersPlanteles];
for (const pl of planteles) {
  const id = String(pl._id || pl.id || '').trim();
  const dea = String(pl.codigos?.plantel || pl.codigoDEA || pl.codigoPlantel || id).trim().toUpperCase();
  const nom = String(pl['nombre-plantel']?.nominal || pl.nombre_plantel || pl.nombre || '').trim().toUpperCase();
  const eponimo = String(pl['nombre-plantel']?.['nuevo-eponimo'] || pl['nuevo-eponimo'] || pl.nuevo_eponimo || pl.eponimo || nom).trim().toUpperCase();
  const denominacion = String(pl.denominacion || '').trim().toUpperCase();
  const denAbr = String(pl['denominacion-abr'] || pl.den_abr || '').trim().toUpperCase();
  const dep = normalizarDep(pl.dependencia);
  const mun = normalizarMunicipio(pl.municipio || pl.MUNICIPIO || '');
  const par = String(pl.parroquia || pl.PARROQUIA || '').trim().toUpperCase();
  const est = 'MÉRIDA';
  const ubiGeo = String(pl['ubicacion-geografica'] || pl.ubicacion || '').trim().toUpperCase();
  const nivel = String(pl.nivel || '').trim().toUpperCase();
  const modalidad = String(pl.modalidad || '').trim().toUpperCase();
  const turno = String(pl['turno-plantel'] || pl.turno || '').trim().toUpperCase();
  
  const matTotal = pl['matricula-total'] ?? pl.matricula?.['total-gen'] ?? '';
  const matMas = pl.matricula?.['total-gen-mas'] ?? '';
  const matFem = pl.matricula?.['total-gen-fem'] ?? '';
  const matDesglose = pl.matricula ? JSON.stringify(pl.matricula) : '';

  const totalPer = pl.total_personal ?? (Array.isArray(pl.personal_resumen) ? pl.personal_resumen.length : '');
  const codEst = String(pl.codigos?.estadistico || pl['codigo-estadistico'] || pl.codigo_estadistico || '').trim();
  const codDep = String(pl.codigos?.dependencia || pl.codigo_dependencia || '').trim();
  const planesEst = pl['planes-estudio'] ? JSON.stringify(pl['planes-estudio']) : '';
  const secPlanes = pl['secciones-planes'] ? JSON.stringify(pl['secciones-planes']) : '';
  const datosComp = pl.datos_completados ? 'SI' : 'NO';
  const obs = String(pl.observaciones || '').trim().toUpperCase();
  const ultAct = String(pl.ultima_actualizacion || '').trim();

  rowsPlanteles.push([
    id,
    dea,
    nom,
    eponimo,
    denominacion,
    denAbr,
    dep,
    mun,
    par,
    est,
    ubiGeo,
    nivel,
    modalidad,
    turno,
    matTotal,
    matMas,
    matFem,
    matDesglose,
    totalPer,
    codEst,
    codDep,
    planesEst,
    secPlanes,
    datosComp,
    obs,
    ultAct
  ]);
}

console.log('• Creando hojas en libro Excel...');
const wb = xlsx.utils.book_new();

const wsPersonal = xlsx.utils.aoa_to_sheet(rowsPersonal);
const wsPlanteles = xlsx.utils.aoa_to_sheet(rowsPlanteles);

xlsx.utils.book_append_sheet(wb, wsPersonal, 'PERSONAL_CONSOLIDADO');
xlsx.utils.book_append_sheet(wb, wsPlanteles, 'PLANTELES_CONSOLIDADO');

// Escribir en DEST_FILE
xlsx.writeFile(wb, DEST_FILE);
const statDest = fs.statSync(DEST_FILE);
console.log(`✓ Archivo consolidado generado: ${DEST_FILE} (${(statDest.size / (1024 * 1024)).toFixed(2)} MB)`);

// Intentar escribir también en TARGET_ORIGINAL si no está bloqueado
try {
  const fd = fs.openSync(TARGET_ORIGINAL, 'r+');
  fs.closeSync(fd);
  // Si está libre, leer el libro original y añadir la hoja
  const wbOrig = xlsx.readFile(TARGET_ORIGINAL);
  if (wbOrig.SheetNames.includes('PERSONAL_CONSOLIDADO')) {
    delete wbOrig.Sheets['PERSONAL_CONSOLIDADO'];
    const idx = wbOrig.SheetNames.indexOf('PERSONAL_CONSOLIDADO');
    if (idx > -1) wbOrig.SheetNames.splice(idx, 1);
  }
  xlsx.utils.book_append_sheet(wbOrig, wsPersonal, 'PERSONAL_CONSOLIDADO');
  xlsx.writeFile(wbOrig, TARGET_ORIGINAL);
  console.log(`✓ Pestaña PERSONAL_CONSOLIDADO añadida con éxito al archivo original ${TARGET_ORIGINAL}`);
} catch (e) {
  console.log(`ℹ Nota: El archivo original ${TARGET_ORIGINAL} se encuentra abierto en Excel por el usuario. El consolidado quedó resguardado en ${DEST_FILE}.`);
}

console.log('\n========================================================================');
console.log('🎉 CONSOLIDACIÓN COMPLETADA EXITOSAMENTE');
console.log(`   Pestaña PERSONAL_CONSOLIDADO: 27501 registros x ${headersConsolidado.length} columnas`);
console.log(`   Pestaña PLANTELES_CONSOLIDADO: 1185 planteles x ${headersPlanteles.length} columnas`);
console.log('========================================================================');
