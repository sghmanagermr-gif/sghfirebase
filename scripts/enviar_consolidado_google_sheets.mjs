import fs from 'fs';
import path from 'path';
import { GoogleAuth } from 'google-auth-library';
import { normalizarMunicipio } from '../webapp/src/geografia.js';

const SPREADSHEET_ID = '1xRXGCx-oZiiFQqZB0K6VQZTYoU2bZVH-Y5yuTAPKKgU';
const PERSONAL_PATH = path.resolve('scratch', 'corte_oficial_firestore_personal.json');
const PLANTELES_PATH = path.resolve('scratch', 'corte_oficial_firestore_planteles.json');

console.log('========================================================================');
console.log('=== SGH MÉRIDA: TRANSMISIÓN CONSOLIDADA A GOOGLE SHEETS ===');
console.log('========================================================================');
console.log(`Documento Google Sheets ID: ${SPREADSHEET_ID}`);

if (!fs.existsSync(PERSONAL_PATH) || !fs.existsSync(PLANTELES_PATH)) {
  console.error('Error: Faltan los archivos de corte descargados en scratch/.');
  process.exit(1);
}

const personal = JSON.parse(fs.readFileSync(PERSONAL_PATH, 'utf8'));
const planteles = JSON.parse(fs.readFileSync(PLANTELES_PATH, 'utf8'));

console.log(`• Cargados ${personal.length} registros de personal.`);
console.log(`• Cargados ${planteles.length} registros de planteles.`);

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

function colName(n) {
  let s = '';
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - m) / 26);
  }
  return s;
}

// 1. Indexar planteles y personal
const plantelesMap = new Map();
for (const pl of planteles) {
  const dea = String(pl.codigos?.plantel || pl.codigoDEA || pl.id || pl._id || '').trim().toUpperCase();
  if (dea) plantelesMap.set(dea, pl);
}

const personalPorDea = new Map();
for (const pers of personal) {
  const dea = String(pers['codigo-plantel'] || pers.codigoDEA || pers.codigoPlantel || pers.DEA || pers._id?.split('_')[0] || '').trim().toUpperCase();
  if (!dea) continue;
  if (!personalPorDea.has(dea)) {
    personalPorDea.set(dea, { tot: 0, docTot: 0, docM: 0, docF: 0, admTot: 0, admM: 0, admF: 0, obrTot: 0, obrM: 0, obrF: 0 });
  }
  const stat = personalPorDea.get(dea);
  stat.tot++;
  const tipo = String(pers.tipo_personal || pers['tipo-personal'] || pers.cargo || '').toUpperCase();
  const gen = String(pers.genero || pers.GENERO || pers.sexo || '').toUpperCase();
  const esMas = gen.startsWith('M') || gen === '1';

  if (tipo.includes('DOC') || tipo.includes('AULA') || tipo.includes('PROF')) {
    stat.docTot++;
    if (esMas) stat.docM++; else stat.docF++;
  } else if (tipo.includes('ADM') || tipo.includes('TSU') || tipo.includes('SEC')) {
    stat.admTot++;
    if (esMas) stat.admM++; else stat.admF++;
  } else if (tipo.includes('OBR') || tipo.includes('ASEAD') || tipo.includes('VIG')) {
    stat.obrTot++;
    if (esMas) stat.obrM++; else stat.obrF++;
  }
}

// 2. Preparar filas PERSONAL (59 columnas)
console.log('\n• Formateando datos para pestaña PERSONAL (59 columnas)...');
const headersPersonal = [
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

const rowsPersonal = [headersPersonal];
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

  const planesKeys = Object.keys(p).filter(k => /^\d{5}$/.test(k));
  let planesJson = '';
  if (planesKeys.length > 0) {
    const obj = {};
    for (const pk of planesKeys) obj[pk] = p[pk];
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

// 3. Preparar filas PLANTELES (35 columnas con matrícula desglosada y personal detallado)
console.log('• Formateando datos para pestaña PLANTELES (35 columnas)...');
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
  'docentes_total',
  'docentes_mas',
  'docentes_fem',
  'administrativos_total',
  'administrativos_mas',
  'administrativos_fem',
  'obreros_total',
  'obreros_mas',
  'obreros_fem',
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

  const persStat = personalPorDea.get(dea) || { tot: 0, docTot: 0, docM: 0, docF: 0, admTot: 0, admM: 0, admF: 0, obrTot: 0, obrM: 0, obrF: 0 };
  const totalPer = persStat.tot || pl.total_personal || (Array.isArray(pl.personal_resumen) ? pl.personal_resumen.length : 0);

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
    persStat.docTot,
    persStat.docM,
    persStat.docF,
    persStat.admTot,
    persStat.admM,
    persStat.admF,
    persStat.obrTot,
    persStat.obrM,
    persStat.obrF,
    codEst,
    codDep,
    planesEst,
    secPlanes,
    datosComp,
    obs,
    ultAct
  ]);
}

// 4. Conectar y escribir en Google Sheets
async function transmitirAGoogleSheets() {
  console.log('\n• Conectando con Google Sheets API...');
  const auth = new GoogleAuth({
    keyFile: 'service-account.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  const client = await auth.getClient();

  // Limpiar PERSONAL
  console.log('• Limpiando hoja PERSONAL...');
  await client.request({
    url: `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/PERSONAL!A1:BW45000:clear`,
    method: 'POST'
  });

  // Escribir PERSONAL por lotes de 2500 filas
  const endColPersonal = colName(headersPersonal.length); // BG (59)
  const BATCH_SIZE = 2500;
  console.log(`• Transmitiendo ${rowsPersonal.length} filas a PERSONAL (Columnas A a ${endColPersonal})...`);

  for (let i = 0; i < rowsPersonal.length; i += BATCH_SIZE) {
    const chunk = rowsPersonal.slice(i, i + BATCH_SIZE);
    const startRow = i + 1;
    const endRow = i + chunk.length;
    await client.request({
      url: `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/PERSONAL!A${startRow}:${endColPersonal}${endRow}?valueInputOption=USER_ENTERED`,
      method: 'PUT',
      data: { values: chunk }
    });
    console.log(`  ✓ PERSONAL: filas ${startRow} a ${endRow} enviadas con éxito.`);
    // Breve pausa para cuidar cuota de escritura de Sheets
    await new Promise(r => setTimeout(r, 400));
  }

  // Limpiar PLANTELES
  console.log('\n• Limpiando hoja PLANTELES...');
  await client.request({
    url: `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/PLANTELES!A1:BZ7000:clear`,
    method: 'POST'
  });

  // Escribir PLANTELES
  const endColPlanteles = colName(headersPlanteles.length); // AI (35)
  console.log(`• Transmitiendo ${rowsPlanteles.length} filas a PLANTELES (Columnas A a ${endColPlanteles})...`);

  await client.request({
    url: `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/PLANTELES!A1:${endColPlanteles}${rowsPlanteles.length}?valueInputOption=USER_ENTERED`,
    method: 'PUT',
    data: { values: rowsPlanteles }
  });
  console.log('  ✓ PLANTELES: enviadas todas las filas exitosamente.');

  console.log('\n========================================================================');
  console.log('🎉 TRANSMISIÓN A GOOGLE SHEETS COMPLETADA CON ÉXITO');
  console.log(`   Documento ID: ${SPREADSHEET_ID}`);
  console.log(`   Pestaña PERSONAL: ${rowsPersonal.length - 1} funcionarios x ${headersPersonal.length} columnas`);
  console.log(`   Pestaña PLANTELES: ${rowsPlanteles.length - 1} instituciones x ${headersPlanteles.length} columnas`);
  console.log('========================================================================');
}

transmitirAGoogleSheets().catch(err => {
  console.error('\n❌ Error al transmitir a Google Sheets:', err);
  process.exit(1);
});
