const fs = require('fs');
const path = require('path');
const os = require('os');
const xlsx = require('xlsx');

// ====================================================================
// SCRIPT MAESTRO DE MIGRACIÓN Y ENRIQUECIMIENTO UNIFICADO (FASE 3 SGH)
// ====================================================================
// Versión con control de estado y reanudación automática (Stateful Resume)
// ====================================================================

const args = process.argv.slice(2);
const isExecute = args.includes('--execute');
const isDryRun = !isExecute || args.includes('--dry-run');

let targetBloque = '1';
const bloqueArg = args.find(a => a.startsWith('--bloque='));
if (bloqueArg) {
  targetBloque = bloqueArg.split('=')[1].toLowerCase();
}

let limitOps = null;
const limitArg = args.find(a => a.startsWith('--limit='));
if (limitArg) {
  limitOps = parseInt(limitArg.split('=')[1], 10);
}

const stateDir = 'scratch';
fs.mkdirSync(stateDir, { recursive: true });
const stateFile = path.join(stateDir, `estado_progreso_bloque_${targetBloque}.json`);

let startBatchIdx = 0;
if (fs.existsSync(stateFile) && isExecute) {
  try {
    const saved = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    if (saved.bloque === targetBloque && saved.lotes_completados) {
      startBatchIdx = saved.lotes_completados;
      console.log(`📌 Reanudación automática detectada: retomando desde el Lote ${startBatchIdx + 1}`);
    }
  } catch (e) {}
}

const customStartArg = args.find(a => a.startsWith('--start-batch='));
if (customStartArg) {
  startBatchIdx = parseInt(customStartArg.split('=')[1], 10) - 1;
}

console.log('====================================================================');
console.log('=== SGH: PLAN MAESTRO DE MIGRACIÓN Y ENRIQUECIMIENTO UNIFICADO ===');
console.log('====================================================================');
console.log(`• Modo: ${isExecute ? '🚀 PRODUCCIÓN (ESCRITURA REAL EN FIRESTORE)' : '🛡️ SIMULACIÓN EN SECO (DRY-RUN - 0 CONSUMO)'}`);
console.log(`• Bloque Objetivo: ${targetBloque.toUpperCase()}`);
if (startBatchIdx > 0) console.log(`• Punto de Partida: Lote ${startBatchIdx + 1}`);
if (limitOps) console.log(`• Límite Forzado: ${limitOps} registros`);
console.log('--------------------------------------------------------------------\n');

const BLOQUES = {
  '1': {
    nombre: 'Eje Panamericano y Valle del Mocotíes (10 Municipios)',
    municipios: [
      'ALBERTO ADRIANI', 'ANDRÉS BELLO', 'ANTONIO PINTO SALINAS',
      'CARACCIOLO PARRA OLMEDO', 'JULIO CÉSAR SALAS', 'OBISPO RAMOS DE LORA',
      'RIVAS DÁVILA', 'TOVAR', 'TULIO FEBRES CORDERO', 'ZEA'
    ]
  },
  '2': {
    nombre: 'Eje Metropolitano y Pueblos del Sur (8 Municipios)',
    municipios: [
      'ARICAGUA', 'ARZOBISPO CHACÓN', 'CAMPO ELÍAS', 'GUARAQUE',
      'LIBERTADOR', 'PADRE NOGUERA', 'SANTOS MARQUINA', 'SUCRE'
    ]
  },
  '3': {
    nombre: 'Eje Páramo y Cierre General (5 Municipios)',
    municipios: [
      'CARDENAL QUINTERO', 'JUSTO BRICEÑO', 'MIRANDA', 'PUEBLO LLANO', 'RANGEL'
    ]
  }
};

function toCanonicalMun(str) {
  if (!str) return 'SIN MUNICIPIO';
  const clean = str.toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim();

  if (clean.includes('ADRIANI')) return 'ALBERTO ADRIANI';
  if (clean.includes('ANDRES') || clean.includes('BELLO')) return 'ANDRÉS BELLO';
  if (clean.includes('PINTO') || clean.includes('SALINA')) return 'ANTONIO PINTO SALINAS';
  if (clean.includes('ARICAGUA')) return 'ARICAGUA';
  if (clean.includes('CHACON')) return 'ARZOBISPO CHACÓN';
  if (clean.includes('CAMPO') || clean.includes('ELIAS')) return 'CAMPO ELÍAS';
  if (clean.includes('CARACCIOLO') || clean.includes('OLMEDO')) return 'CARACCIOLO PARRA OLMEDO';
  if (clean.includes('CARDENAL') || clean.includes('QUINTERO')) return 'CARDENAL QUINTERO';
  if (clean.includes('GUARAQUE')) return 'GUARAQUE';
  if (clean.includes('JULIO') || clean.includes('SALAS')) return 'JULIO CÉSAR SALAS';
  if (clean.includes('JUSTO') || clean.includes('BRICENO')) return 'JUSTO BRICEÑO';
  if (clean.includes('LIBERTADOR')) return 'LIBERTADOR';
  if (clean.includes('MIRANDA')) return 'MIRANDA';
  if (clean.includes('OBISPO') || clean.includes('LORA')) return 'OBISPO RAMOS DE LORA';
  if (clean.includes('NOGUERA')) return 'PADRE NOGUERA';
  if (clean.includes('PUEBLO') || clean.includes('LLANO')) return 'PUEBLO LLANO';
  if (clean.includes('RANGEL')) return 'RANGEL';
  if (clean.includes('RIVAS') || clean.includes('DAVILA')) return 'RIVAS DÁVILA';
  if (clean.includes('SANTOS') || clean.includes('MARQUINA')) return 'SANTOS MARQUINA';
  if (clean.includes('SUCRE')) return 'SUCRE';
  if (clean.includes('TOVAR')) return 'TOVAR';
  if (clean.includes('TULIO') || clean.includes('FEBRES') || clean.includes('CORDERO')) return 'TULIO FEBRES CORDERO';
  if (clean.includes('ZEA')) return 'ZEA';
  return str.trim().toUpperCase();
}

function excelDateToDMY(val) {
  if (!val || val === 'N/A' || val === 'N/R') return '';
  if (typeof val === 'string') {
    const s = val.trim();
    if (s.includes('/') || s.includes('-')) return s;
  }
  const num = Number(val);
  if (isNaN(num) || num <= 0) return String(val).trim();
  try {
    const parsed = xlsx.SSF.parse_date_code(num);
    if (!parsed) return String(val).trim();
    const d = String(parsed.d).padStart(2, '0');
    const m = String(parsed.m).padStart(2, '0');
    const y = parsed.y;
    return `${d}/${m}/${y}`;
  } catch (e) {
    return String(val).trim();
  }
}

function excelDateToYMD(val) {
  if (!val || val === 'N/A' || val === 'N/R') return '';
  if (typeof val === 'string') {
    const s = val.trim();
    if (s.match(/^\d{4}-\d{2}-\d{2}$/)) return s;
    if (s.includes('/')) {
      const parts = s.split('/');
      if (parts.length === 3) {
        if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
  }
  const num = Number(val);
  if (isNaN(num) || num <= 0) return String(val).trim();
  try {
    const parsed = xlsx.SSF.parse_date_code(num);
    if (!parsed) return String(val).trim();
    const d = String(parsed.d).padStart(2, '0');
    const m = String(parsed.m).padStart(2, '0');
    const y = parsed.y;
    return `${y}-${m}-${d}`;
  } catch (e) {
    return String(val).trim();
  }
}

function toFirestoreNum(val) {
  if (val === '' || val === undefined || val === null) return { stringValue: '' };
  const n = Number(val);
  if (isNaN(n)) return { stringValue: '' };
  if (Number.isInteger(n)) return { integerValue: String(n) };
  return { doubleValue: n };
}

// Catálogo de Planteles
console.log('1. Cargando Catálogo Maestro Unificado de Planteles...');
const plantelesMaestros = new Map();

if (fs.existsSync('bd_sgh.json')) {
  const bd = JSON.parse(fs.readFileSync('bd_sgh.json', 'utf8'));
  for (const [mName, mData] of Object.entries(bd.municipios || {})) {
    const munCanon = toCanonicalMun(mName);
    for (const [pName, pData] of Object.entries(mData.parroquias || {})) {
      const parrCanon = pName.trim().toUpperCase();
      for (const [deaRaw, info] of Object.entries(pData.planteles || {})) {
        let dea = deaRaw.trim().toUpperCase();
        if (dea.startsWith('0D')) dea = 'OD' + dea.substring(2);
        const nombre = (info.nuevo_eponimo || info.nombre_plantel || info.denominacion || dea).trim().toUpperCase();
        plantelesMaestros.set(dea, {
          dea,
          nombre,
          municipio: munCanon,
          parroquia: parrCanon,
          dependencia: String(info.dependencia || 'NACIONAL').trim().toUpperCase()
        });
      }
    }
  }
}

if (fs.existsSync('nomina_acualizada/PlantelesMerida.xlsx')) {
  const wbPl = xlsx.readFile('nomina_acualizada/PlantelesMerida.xlsx');
  const rowsPl = xlsx.utils.sheet_to_json(wbPl.Sheets[wbPl.SheetNames[0]]);
  rowsPl.forEach(r => {
    let dea = String(r['CÓDIGO PLANTEL (EJ OD12345678)'] || '').trim().toUpperCase();
    if (dea.startsWith('0D')) dea = 'OD' + dea.substring(2);
    if (!dea) return;

    const nombre = String(r['NOMBRE DEL NUEVO EPÓNIMO'] || r['NOMBRE NOMINAL O ANTERIOR'] || '').trim().toUpperCase();
    const mun = toCanonicalMun(r['MUNICIPIOS']);
    const parr = String(r['PARROQUIA (AL QUE PERTENECE EL PLANTEL)'] || '').trim().toUpperCase();
    const dep = String(r['DEPENDENCIA SI ES NACIONAL O ESTADAL'] || '').trim().toUpperCase();

    if (!plantelesMaestros.has(dea) || !plantelesMaestros.get(dea).nombre) {
      plantelesMaestros.set(dea, { dea, nombre, municipio: mun, parroquia: parr, dependencia: dep });
    }
  });
}

console.log(`✓ Catálogo Maestro consolidado: ${plantelesMaestros.size} instituciones educativas.`);

// Nómina de Apoyo
console.log('\n2. Leyendo Nómina Consolidada de apoyo...');
const mapNominaApoyo = new Map();
if (fs.existsSync('nomina_acualizada/Nomina_Personal_Consolidado_Estadal_MERIDA_2026-11-09.xlsx')) {
  const wbNom = xlsx.readFile('nomina_acualizada/Nomina_Personal_Consolidado_Estadal_MERIDA_2026-11-09.xlsx');
  const rowsNom = xlsx.utils.sheet_to_json(wbNom.Sheets[wbNom.SheetNames[0]], { header: 1 });
  for (let i = 1; i < rowsNom.length; i++) {
    const r = rowsNom[i];
    const ci = String(r[2] || '').trim().replace(/\D/g, '');
    let dea = String(r[22] || '').trim().toUpperCase();
    if (dea.startsWith('0D')) dea = 'OD' + dea.substring(2);
    if (ci) {
      const key = dea ? `${dea}_${ci}` : ci;
      mapNominaApoyo.set(key, {
        horasRecibo: Number(r[38]) || null,
        horasProgramar: Number(r[41]) || null,
        atiendeMatricula: String(r[42] || '').trim().toUpperCase(),
        observaciones: String(r[46] || '').trim()
      });
    }
  }
  console.log(`✓ Nómina de apoyo indexada: ${mapNominaApoyo.size} registros.`);
}

// RAC.xlsx
console.log('\n3. Leyendo base principal RAC.xlsx (Hoja PERSONAL)...');
const wbRac = xlsx.readFile('RAC.xlsx');
const wsRac = wbRac.Sheets['PERSONAL'];
const rowsRac = xlsx.utils.sheet_to_json(wsRac, { header: 1 });
console.log(`✓ Filas leídas: ${rowsRac.length}`);

// Filtrado
console.log(`\n4. Filtrando registros para BLOQUE ${targetBloque.toUpperCase()}...`);
const targetMunList = targetBloque === 'all'
  ? [...BLOQUES['1'].municipios, ...BLOQUES['2'].municipios, ...BLOQUES['3'].municipios]
  : BLOQUES[targetBloque].municipios;

const registrosSeleccionados = [];

for (let i = 1; i < rowsRac.length; i++) {
  const r = rowsRac[i];
  if (!r) continue;

  const ci = String(r[1] || '').trim().replace(/\D/g, '');
  if (!ci) continue;

  let dea = String(r[20] || '').trim().toUpperCase();
  if (dea.startsWith('0D')) dea = 'OD' + dea.substring(2);

  const rawMun = String(r[17] || '').trim().toUpperCase();
  const plt = plantelesMaestros.get(dea);
  const munCanon = toCanonicalMun(rawMun || plt?.municipio || '');

  if (targetMunList.includes(munCanon)) {
    registrosSeleccionados.push({ row: r, dea, ci, munCanon, plt });
  }
}

if (limitOps && limitOps < registrosSeleccionados.length) {
  registrosSeleccionados.length = limitOps;
}

console.log(`✓ Registros seleccionados para procesar: ${registrosSeleccionados.length}`);

// Mapeo Canónico
console.log('\n5. Mapeando campos canónicos...');
const writesQueue = [];

registrosSeleccionados.forEach(({ row: r, dea, ci, munCanon, plt }) => {
  const targetKey = `${dea}_${ci}`;
  const docPath = `projects/sgh-merida/databases/(default)/documents/cargos_personal/${targetKey}`;
  const apoyo = mapNominaApoyo.get(targetKey) || mapNominaApoyo.get(ci) || {};

  const nac = String(r[2] || 'V').trim().toUpperCase();
  const nombrePersona = String(r[3] || '').trim().toUpperCase();
  const lugarNac = String(r[4] || '').trim().toUpperCase();
  const fNac = excelDateToYMD(r[5]);
  const edad = Number(r[6]) || 0;
  const generoRaw = String(r[7] || '').trim().toUpperCase();
  const genero = generoRaw === 'M' || generoRaw === 'MASCULINO' ? 'MASCULINO' : (generoRaw === 'F' || generoRaw === 'FEMENINO' ? 'FEMENINO' : generoRaw);
  const telHab = String(r[8] || '').trim();
  const telCel = String(r[9] || '').trim();
  const telOfi = String(r[10] || '').trim();
  const email = String(r[11] || '').trim().toLowerCase();
  const edoCivil = String(r[12] || 'SOLTERO(A)').trim().toUpperCase();
  const dir = String(r[13] || '').trim().toUpperCase();
  const instruccion = String(r[14] || '').trim().toUpperCase();
  const profesion = String(r[15] || '').trim().toUpperCase();

  const nombrePlantel = (plt?.nombre || String(r[19] || '').trim() || dea).trim().toUpperCase();
  const parroquia = (plt?.parroquia || String(r[18] || '').trim() || 'CENTRO').trim().toUpperCase();

  const ubicacionAdmin = String(r[29] || '').trim();
  const depTrabajador = String(r[30] || plt?.dependencia || 'NACIONAL').trim().toUpperCase();
  const tipoPersonal = String(r[31] || 'DOCENTE').trim().toUpperCase();
  const subcategoria = String(r[32] || '').trim().toUpperCase();
  const cargo = String(r[33] || 'DOCENTE').trim().toUpperCase();
  const codRac = String(r[34] || '').trim().toUpperCase();
  const titularRaw = String(r[35] || 'Titular').trim();
  const titular = titularRaw.toLowerCase().includes('tit') ? 'Titular' : 'Interino / Contratado';
  const fIngreso = excelDateToDMY(r[38]);
  const antiguedad = Number(r[39]) || 0;
  const situacion = String(r[73] || 'ACTIVO').trim().toUpperCase();
  const observacion = String(r[74] || apoyo.observaciones || '').trim();

  const turnosAtiende = String(r[40] || 'DOBLE TURNO').trim().toUpperCase();
  const atiendeMatRaw = String(r[41] || apoyo.atiendeMatricula || 'NO').trim().toUpperCase();
  const atiendeMat = (atiendeMatRaw === 'SI' || atiendeMatRaw === 'SÍ') ? 'SI' : 'NO';
  const nivelModalidad = String(r[42] || '').trim().toUpperCase();
  const especialidad = String(r[43] || '').trim().toUpperCase();

  const hAcad = Number(r[36]) || 0;
  const hAdm = Number(r[37]) || 0;
  let hRec = apoyo.horasRecibo || (hAcad + hAdm) || 40;
  if (hRec === 0) hRec = 40;
  let hProg = apoyo.horasProgramar !== null && apoyo.horasProgramar !== undefined ? apoyo.horasProgramar : Math.max(0, hRec - (hAcad + hAdm));

  const tallaCamisa = String(r[75] || '').trim().toUpperCase();
  const tallaPantalon = String(r[76] || '').trim().toUpperCase();
  const tallaZapato = String(r[77] || '').trim().toUpperCase();
  const actDeportiva = String(r[78] || '').trim().toUpperCase();
  const actCultural = String(r[79] || '').trim().toUpperCase();
  const tipoVivienda = String(r[80] || '').trim().toUpperCase();
  const condicionVivienda = String(r[81] || '').trim().toUpperCase();
  const tipoMaterial = String(r[82] || '').trim().toUpperCase();
  const tipoEnfermedad = String(r[83] || '').trim().toUpperCase();
  const medicamento = String(r[84] || '').trim().toUpperCase();
  const discapacidad = String(r[85] || 'NO').trim().toUpperCase();

  const ubch = String(r[86] || '').trim().toUpperCase();
  const circuito = String(r[87] || '').trim().toUpperCase();
  const centroVot = String(r[88] || '').trim().toUpperCase();

  const carga31059 = r[47] !== undefined && r[47] !== null && String(r[47]).trim() !== '' ? String(r[47]).trim() : '';
  const carga31060 = r[48] !== undefined && r[48] !== null && String(r[48]).trim() !== '' ? String(r[48]).trim() : '';

  const docFields = {
    cedula: { stringValue: ci },
    'cedula-identidad': { stringValue: ci },
    CEDULA: toFirestoreNum(ci),
    nacionalidad: { stringValue: nac },
    'nombre-apellido': { stringValue: nombrePersona },
    'apellidos-nombres': { stringValue: nombrePersona },
    NOMBRE: { stringValue: nombrePersona },
    nombres: { stringValue: nombrePersona },

    'codigo-plantel': { stringValue: dea },
    codigoDEA: { stringValue: dea },
    codigoPlantel: { stringValue: dea },
    'CODIGO DEL PLANTEL': { stringValue: dea },
    plantel: { stringValue: nombrePlantel },
    'ubicacion-fisica': { stringValue: nombrePlantel },
    'UBICACIÓN FÍSICA': { stringValue: nombrePlantel },
    municipio: { stringValue: munCanon },
    MUNICIPIO: { stringValue: munCanon },
    parroquia: { stringValue: parroquia },
    PARROQUIA: { stringValue: parroquia },
    estado: { stringValue: 'MÉRIDA' },

    'ubicacion-administrativa': { stringValue: ubicacionAdmin },
    'UBICACIÓN ADMINISTRATIVA': { stringValue: ubicacionAdmin },
    dependencia: { stringValue: depTrabajador },
    DEPENDENCIA: { stringValue: depTrabajador },
    'tipo-personal': { stringValue: tipoPersonal },
    'TIPO PERSONAL': { stringValue: tipoPersonal },
    subcategoria: { stringValue: subcategoria },
    cargo: { stringValue: cargo },
    CARGO: { stringValue: cargo },
    'codigo-rac': { stringValue: codRac },
    'CODIGO RAC': { stringValue: codRac },
    titular: { stringValue: titular },
    TITULAR: { stringValue: titular },
    'fecha-ingreso': { stringValue: fIngreso },
    antiguedad: toFirestoreNum(antiguedad),
    'situacion-laboral': { stringValue: situacion },
    'SITUACIÓN DEL TRABAJADOR': { stringValue: situacion },
    observaciones: { stringValue: observacion },

    'turnos-atiende': { stringValue: turnosAtiende },
    'atiende-matricula': { stringValue: atiendeMat },
    'nivel-modalidad': { stringValue: nivelModalidad },
    'especialidad-imparte': { stringValue: especialidad },
    'horas-recibo': toFirestoreNum(hRec),
    'horas-academicas': toFirestoreNum(hAcad),
    'horas-administrativas': toFirestoreNum(hAdm),
    'horas-por-programar': toFirestoreNum(hProg),

    'fecha-nacimiento': { stringValue: fNac },
    'lugar-nacimiento': { stringValue: lugarNac },
    edad: toFirestoreNum(edad),
    genero: { stringValue: genero },
    'estado-civil': { stringValue: edoCivil },
    instruccion: { stringValue: instruccion },
    profesion: { stringValue: profesion },
    'tel-celular': { stringValue: telCel },
    'tel-habitacion': { stringValue: telHab },
    'tel-oficina': { stringValue: telOfi },
    correo: { stringValue: email },
    direccion: { stringValue: dir },

    'talla-camisa': { stringValue: tallaCamisa },
    'talla-pantalon': { stringValue: tallaPantalon },
    'talla-zapato': { stringValue: tallaZapato },
    'actividad-deportiva': { stringValue: actDeportiva },
    'actividad-cultural': { stringValue: actCultural },
    'tipo-vivienda': { stringValue: tipoVivienda },
    'condicion-vivienda': { stringValue: condicionVivienda },
    'tipo-material': { stringValue: tipoMaterial },
    'tipo-enfermedad': { stringValue: tipoEnfermedad },
    medicamento: { stringValue: medicamento },
    discapacidad: { stringValue: discapacidad },

    ubch: { stringValue: ubch },
    'circuito-comunal': { stringValue: circuito },
    'centro-votacion': { stringValue: centroVot },

    ultima_actualizacion: { stringValue: new Date().toISOString() },
    simetria_homologada: { booleanValue: true }
  };

  if (carga31059) docFields['31059'] = { stringValue: carga31059 };
  if (carga31060) docFields['31060'] = { stringValue: carga31060 };

  const fieldPathsBloques1y2 = [
    '`ubicacion-administrativa`',
    '`UBICACIÓN ADMINISTRATIVA`',
    'dependencia',
    'DEPENDENCIA',
    'subcategoria',
    '`turnos-atiende`',
    '`atiende-matricula`',
    '`nivel-modalidad`',
    '`especialidad-imparte`',
    '`horas-por-programar`',
    'observaciones',
    '`fecha-nacimiento`',
    '`lugar-nacimiento`',
    'instruccion',
    'profesion',
    '`tel-habitacion`',
    '`tel-oficina`',
    '`talla-camisa`',
    '`talla-pantalon`',
    '`talla-zapato`',
    '`actividad-deportiva`',
    '`actividad-cultural`',
    '`tipo-vivienda`',
    '`condicion-vivienda`',
    '`tipo-material`',
    '`tipo-enfermedad`',
    'medicamento',
    'discapacidad',
    'ultima_actualizacion'
  ];
  if (carga31059) fieldPathsBloques1y2.push('`31059`');
  if (carga31060) fieldPathsBloques1y2.push('`31060`');

  const op = {
    update: {
      name: docPath,
      fields: docFields
    }
  };

  if (targetBloque === '1' || targetBloque === '2') {
    op.updateMask = { fieldPaths: fieldPathsBloques1y2 };
  }

  writesQueue.push(op);
});

console.log(`• Total Operaciones de Escritura / Enriquecimiento: ${writesQueue.length}`);

// Lotes reducidos a 200 con pausa de ritmo para respetar los límites de Firestore
const BATCH_SIZE = 200;
const totalBatches = Math.ceil(writesQueue.length / BATCH_SIZE);
console.log(`• Lotes programados (${BATCH_SIZE} operaciones c/u): ${totalBatches} lotes.`);

async function ensureFreshToken() {
  const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  const c = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const now = Date.now();
  if (!c.tokens.expires_at || c.tokens.expires_at <= now + 60000) {
    const clientId = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
    const clientSecret = 'j9iVZfS8kkCEFUPaAeJV0sAi';
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: c.tokens.refresh_token
      })
    });
    const data = await res.json();
    if (data.access_token) {
      c.tokens.access_token = data.access_token;
      c.tokens.expires_at = Date.now() + (data.expires_in * 1000);
      fs.writeFileSync(configPath, JSON.stringify(c, null, 2), 'utf8');
    }
  }
  return c.tokens.access_token;
}

async function commitBatchWithRetry(batchWrites, token, batchIdx, total, retries = 5) {
  const url = 'https://firestore.googleapis.com/v1/projects/sgh-merida/databases/(default)/documents:commit';
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ writes: batchWrites })
      });
      const data = await res.json();
      if (res.status === 200) {
        return data;
      }
      console.error(`  [Lote ${batchIdx}/${total}] Intento ${attempt} status ${res.status}:`, JSON.stringify(data).substring(0, 150));
      if (attempt === retries) throw new Error(`Commit falló con status ${res.status}: ${JSON.stringify(data)}`);
      // Espera exponencial ante 429
      const waitMs = res.status === 429 ? 15000 * attempt : 3000 * attempt;
      console.log(`    Pausando ${waitMs / 1000}s para descongestionar cuota...`);
      await new Promise(r => setTimeout(r, waitMs));
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 4000 * attempt));
    }
  }
}

async function run() {
  if (isDryRun) {
    console.log('\n====================================================================');
    console.log('=== RESULTADOS DE LA SIMULACIÓN EN SECO (DRY-RUN - COSTO CERO)   ===');
    console.log('====================================================================');
    console.log(`✓ Total operaciones preparadas: ${writesQueue.length}`);
    console.log(`✓ Consumo de Lecturas: 0 LECTURAS`);
    console.log(`✓ Lotes calculados: ${totalBatches} lotes.`);
    return;
  }

  console.log(`\n🚀 INICIANDO EJECUCIÓN EN FIRESTORE DESDE EL LOTE ${startBatchIdx + 1}/${totalBatches}...`);
  let token = await ensureFreshToken();
  const startTime = Date.now();

  for (let i = startBatchIdx; i < totalBatches; i++) {
    const start = i * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, writesQueue.length);
    const batch = writesQueue.slice(start, end);

    if (i > 0 && i % 10 === 0) {
      token = await ensureFreshToken();
    }

    await commitBatchWithRetry(batch, token, i + 1, totalBatches);

    // Guardar estado persistente tras cada lote exitoso
    fs.writeFileSync(stateFile, JSON.stringify({
      bloque: targetBloque,
      lotes_completados: i + 1,
      total_lotes: totalBatches,
      registros_completados: end,
      total_registros: writesQueue.length,
      timestamp: new Date().toISOString()
    }, null, 2), 'utf8');

    const pct = (((i + 1) / totalBatches) * 100).toFixed(1);
    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(0);
    console.log(`  ✓ Lote ${i + 1}/${totalBatches} completado (${batch.length} ops) [${pct}%] - ${elapsedSec}s transcurridos`);

    // Pausa de cortesía entre lotes para no saturar el token bucket de Firestore
    await new Promise(r => setTimeout(r, 1500));
  }

  // Al finalizar con éxito el 100%, eliminar archivo de estado intermedio
  if (fs.existsSync(stateFile)) fs.unlinkSync(stateFile);

  console.log('\n====================================================================');
  console.log(`=== ¡MIGRACIÓN / ENRIQUECIMIENTO DEL BLOQUE ${targetBloque.toUpperCase()} FINALIZADO CON ÉXITO! ===`);
  console.log('====================================================================');
}

run().catch(err => {
  console.error('\n❌ ERROR EN EJECUCIÓN:', err.message);
  process.exit(1);
});
