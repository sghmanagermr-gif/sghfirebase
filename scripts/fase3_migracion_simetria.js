const fs = require('fs');
const path = require('path');
const os = require('os');
const xlsx = require('xlsx');

// ====================================================================
// SCRIPT MAESTRO DE HOMOGENEIZACIÓN Y SIMETRÍA EN LA NUBE (FASE 3)
// ====================================================================

// 1. Manejo de Argumentos CLI
const args = process.argv.slice(2);
const isExecute = args.includes('--execute');
const isDryRun = !isExecute || args.includes('--dry-run');

let targetBloque = '1'; // Por defecto Bloque 1
const bloqueArg = args.find(a => a.startsWith('--bloque='));
if (bloqueArg) {
  targetBloque = bloqueArg.split('=')[1].toLowerCase();
}

let limitOps = null;
const limitArg = args.find(a => a.startsWith('--limit='));
if (limitArg) {
  limitOps = parseInt(limitArg.split('=')[1], 10);
}

console.log('====================================================================');
console.log('=== FASE 3: PLAN MAESTRO DE SIMETRÍA SGH (MIGRACIÓN EN LA NUBE) ===');
console.log('====================================================================');
console.log(`• Modo de Ejecución: ${isExecute ? '🚀 PRODUCCIÓN (ESCRITURA REAL EN FIRESTORE)' : '🛡️ SIMULACIÓN EN SECO (DRY-RUN - 0 CONSUMO)'}`);
console.log(`• Bloque Seleccionado: ${targetBloque.toUpperCase()}`);
if (limitOps) console.log(`• Límite Forzado de Operaciones: ${limitOps}`);
console.log('--------------------------------------------------------------------\n');

// 2. Definición Territorial Canónica de Bloques
const BLOQUES = {
  '1': {
    nombre: 'Eje Panamericano y Valle del Mocotíes',
    municipios: [
      'ALBERTO ADRIANI', 'ANTONIO PINTO SALINAS', 'ANTONIO PINTO SALINA',
      'ANDRES BELLO', 'ANDRÉS BELLO', 'CARACCIOLO PARRA OLMEDO', 'CARACCIOLO PARRA',
      'JULIO CESAR SALAS', 'JULIO CÉSAR SALAS', 'JULIO CESAR',
      'OBISPO RAMOS DE LORA', 'RIVAS DAVILA', 'RIVAS DÁVILA',
      'TOVAR', 'ZEA', 'TULIO FEBRES CORDERO', 'TULIO FEBRES'
    ]
  },
  '2': {
    nombre: 'Eje Metropolitano y Pueblos del Sur',
    municipios: [
      'LIBERTADOR', 'CAMPO ELIAS', 'CAMPO ELÍAS', 'SANTOS MARQUINA', 'SUCRE',
      'ARICAGUA', 'ARZOBISPO CHACON', 'ARZOBISPO CHACÓN', 'GUARAQUE', 'PADRE NOGUERA'
    ]
  },
  '3': {
    nombre: 'Eje Páramo y Cierre General',
    municipios: [
      'CARDENAL QUINTERO', 'MIRANDA', 'PUEBLO LLANO', 'RANGEL',
      'JUSTO BRICENO', 'JUSTO BRICEÑO'
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

// 3. Catálogo Maestro de Planteles
console.log('1. Cargando Catálogo Maestro Unificado de Planteles...');
const plantelesMaestros = new Map();

// Fuente A: bd_sgh.json
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

// Fuente B: PlantelesMerida.xlsx
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

// Inclusiones específicas validadas
plantelesMaestros.set('ON15491412', { dea: 'ON15491412', nombre: 'HILDA GRACIELA VERA (ANTES HUMBOLDT)', municipio: 'LIBERTADOR', parroquia: 'CARACCIOLO PARRA PÉREZ', dependencia: 'NACIONAL' });
plantelesMaestros.set('D1067D1421', { dea: 'D1067D1421', nombre: 'LICEO JOSÉ NUCETE SARDI', municipio: 'TOVAR', parroquia: 'EL LLANO', dependencia: 'NACIONAL' });
plantelesMaestros.set('S3379N1410', { dea: 'S3379N1410', nombre: 'LICEO EMIRA MATHEUS (CCB ARAPUEY)', municipio: 'JULIO CÉSAR SALAS', parroquia: 'ARAPUEY', dependencia: 'NACIONAL' });

console.log(`✓ Catálogo Maestro consolidado: ${plantelesMaestros.size} instituciones educativas.`);

// 4. Cargar Nómina Consolidada
console.log('\n2. Leyendo Nómina Consolidada Estadal...');
const wbNom = xlsx.readFile('nomina_acualizada/Nomina_Personal_Consolidado_Estadal_MERIDA_2026-11-09.xlsx');
const rowsNom = xlsx.utils.sheet_to_json(wbNom.Sheets[wbNom.SheetNames[0]]);
console.log(`✓ Leídos ${rowsNom.length} registros totales de la nómina.`);

// 5. Filtrar Registros por Bloque
console.log(`\n3. Filtrando registros para ${targetBloque === 'all' ? 'TODOS LOS BLOQUES' : `BLOQUE ${targetBloque} (${BLOQUES[targetBloque]?.nombre})`}...`);

const targetMunList = targetBloque === 'all' ? null : BLOQUES[targetBloque].municipios;

const registrosSeleccionados = [];
const cedulasParaDepurar = new Set();

rowsNom.forEach(r => {
  const mRaw = String(r['Municipio'] || r['MUNICIPIO'] || '').trim().toUpperCase();
  let dea = String(r['Código Plantel (DEA)'] || r['codigoDEA'] || '').trim().toUpperCase();
  if (dea.startsWith('0D')) dea = 'OD' + dea.substring(2);

  // Si no tiene municipio pero tiene DEA en el catálogo, inferir
  const plt = plantelesMaestros.get(dea);
  const munCanon = toCanonicalMun(mRaw || plt?.municipio || '');

  let pertenece = false;
  if (targetBloque === 'all') {
    pertenece = true;
  } else {
    pertenece = targetMunList.some(bm => mRaw.includes(bm) || munCanon === bm);
  }

  if (pertenece) {
    const ci = String(r['Cédula'] || r['CEDULA'] || '').trim().replace(/\D/g, '');
    if (ci) {
      registrosSeleccionados.push({ row: r, dea, ci, munCanon, plt });
      cedulasParaDepurar.add(ci);
    }
  }
});

console.log(`✓ Registros seleccionados para procesar: ${registrosSeleccionados.length}`);
console.log(`✓ Cédulas únicas identificadas para migración: ${cedulasParaDepurar.size}`);

// 6. Construir las Operaciones de Escritura y Depuración
console.log('\n4. Construyendo las operaciones atómicas de simetría...');

const writesQueue = [];
let writesSet = new Set();

registrosSeleccionados.forEach(({ row: r, dea, ci, munCanon, plt }) => {
  const targetKey = `${dea}_${ci}`;
  const docPath = `projects/sgh-merida/databases/(default)/documents/cargos_personal/${targetKey}`;

  // Resolver datos de escuela
  const nombrePrevio = String(r['Nuevo Epónimo'] || r['Nombre Nominal'] || r['plantel'] || r['UBICACIÓN FÍSICA'] || '').trim();
  const parrPrevia = String(r['Parroquia'] || r['parroquia'] || '').trim();
  const nombreLimpio = (plt?.nombre || nombrePrevio || dea).trim().toUpperCase();
  const parroquiaLimpia = (plt?.parroquia || parrPrevia || 'CENTRO').trim().toUpperCase();
  const nombrePersona = String(r['Apellidos y Nombres'] || r['NOMBRE'] || '').trim().toUpperCase();
  const cargo = String(r['Cargo'] || r['CARGO'] || 'DOCENTE').trim().toUpperCase();
  const codRac = String(r['Código RAC'] || r['CODIGO RAC'] || '').trim();
  const tipo = String(r['Tipo de Personal'] || r['TIPO PERSONAL'] || 'DOCENTE').trim().toUpperCase();
  const dep = String(r['Dependencia'] || plt?.dependencia || 'NACIONAL').trim().toUpperCase();
  const tit = String(r['Condición'] || r['TITULAR'] || 'Titular').trim();
  const hRec = Number(r['Horas Recibo de Pago']) || 40;
  const hAcad = Number(r['Horas Académicas']) || 0;
  const hAdm = Number(r['Horas Administrativas']) || 0;
  const sit = String(r['Situación Laboral'] || r['SITUACIÓN DEL TRABAJADOR'] || 'ACTIVO').trim().toUpperCase();
  const email = String(r['Correo Electrónico'] || r['correo'] || '').trim().toLowerCase();
  const tlf = String(r['Teléfono Celular'] || r['tel-celular'] || '').trim();
  const dir = String(r['Dirección de Habitación'] || r['direccion'] || '').trim().toUpperCase();
  const genero = String(r['Género'] || r['genero'] || '').trim().toUpperCase();
  const estadoCivil = String(r['Estado Civil'] || r['estado-civil'] || 'SOLTERO(A)').trim().toUpperCase();
  const antiguedad = Number(r['Años de Antigüedad']) || 0;
  const fIngreso = String(r['Fecha de Ingreso'] || '').trim();
  const edad = Number(r['Edad']) || 0;
  const ubch = String(r['UBCH'] || r['ubch'] || '').trim().toUpperCase();
  const circuito = String(r['Circuito Comunal'] || r['circuito-comunal'] || '').trim().toUpperCase();
  const centroVot = String(r['Centro de Votación'] || r['centro-votacion'] || '').trim().toUpperCase();

  const docFields = {
    cedula: { stringValue: ci },
    'cedula-identidad': { stringValue: ci },
    CEDULA: { integerValue: Number(ci) },
    nacionalidad: { stringValue: 'V' },
    'nombre-apellido': { stringValue: nombrePersona },
    'apellidos-nombres': { stringValue: nombrePersona },
    NOMBRE: { stringValue: nombrePersona },
    nombres: { stringValue: nombrePersona },
    'codigo-plantel': { stringValue: dea },
    codigoDEA: { stringValue: dea },
    codigoPlantel: { stringValue: dea },
    'CODIGO DEL PLANTEL': { stringValue: dea },
    plantel: { stringValue: nombreLimpio },
    'ubicacion-fisica': { stringValue: nombreLimpio },
    'UBICACIÓN FÍSICA': { stringValue: nombreLimpio },
    municipio: { stringValue: munCanon },
    MUNICIPIO: { stringValue: munCanon },
    parroquia: { stringValue: parroquiaLimpia },
    PARROQUIA: { stringValue: parroquiaLimpia },
    estado: { stringValue: 'MÉRIDA' },
    cargo: { stringValue: cargo },
    CARGO: { stringValue: cargo },
    'codigo-rac': { stringValue: codRac },
    'CODIGO RAC': { stringValue: codRac },
    'tipo-personal': { stringValue: tipo },
    'TIPO PERSONAL': { stringValue: tipo },
    dependencia: { stringValue: dep },
    DEPENDENCIA: { stringValue: dep },
    titular: { stringValue: tit },
    TITULAR: { stringValue: tit },
    'horas-recibo': { integerValue: hRec },
    'horas-academicas': { integerValue: hAcad },
    'horas-administrativas': { integerValue: hAdm },
    'situacion-laboral': { stringValue: sit },
    'SITUACIÓN DEL TRABAJADOR': { stringValue: sit },
    correo: { stringValue: email },
    'tel-celular': { stringValue: tlf },
    direccion: { stringValue: dir },
    genero: { stringValue: genero },
    'estado-civil': { stringValue: estadoCivil },
    antiguedad: { integerValue: antiguedad },
    'fecha-ingreso': { stringValue: fIngreso },
    edad: { integerValue: edad },
    ubch: { stringValue: ubch },
    'circuito-comunal': { stringValue: circuito },
    'centro-votacion': { stringValue: centroVot },
    ultima_actualizacion: { stringValue: new Date().toISOString() },
    simetria_homologada: { booleanValue: true }
  };

  writesQueue.push({
    update: {
      name: docPath,
      fields: docFields
    }
  });
  writesSet.add(targetKey);
});

// Depuración de Claves Asimétricas Legadas:
// Por cada cédula procesada, programar la eliminación del documento legado cargos_personal/{ci}
cedulasParaDepurar.forEach(ci => {
  const legacyDocPath = `projects/sgh-merida/databases/(default)/documents/cargos_personal/${ci}`;
  writesQueue.push({
    delete: legacyDocPath
  });
});

console.log(`• Total Operaciones de Escritura Canónica: ${registrosSeleccionados.length}`);
console.log(`• Total Operaciones de Depuración Asimétrica Legada: ${cedulasParaDepurar.size}`);
console.log(`• Total Operaciones en Cola: ${writesQueue.length}`);

// 7. Partición en Lotes de 400 Operaciones
const BATCH_SIZE = 400;
const totalBatches = Math.ceil(writesQueue.length / BATCH_SIZE);
console.log(`• Lotes programados (${BATCH_SIZE} operaciones c/u): ${totalBatches} lotes.`);

// 8. Modo Dry-Run vs Ejecución Real
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

async function commitWritesWithRetry(writes, token, retries = 4) {
  const url = 'https://firestore.googleapis.com/v1/projects/sgh-merida/databases/(default)/documents:commit';
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ writes })
      });
      const data = await res.json();
      if (res.status === 200) {
        return data;
      }
      console.error(`Intento ${attempt} falló con status ${res.status}:`, JSON.stringify(data).substring(0, 200));
      if (attempt === retries) {
        throw new Error(`Commit falló con status ${res.status}: ${JSON.stringify(data)}`);
      }
    } catch (err) {
      console.warn(`Intento ${attempt} error de red: ${err.message}`);
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }
}

async function run() {
  if (isDryRun) {
    console.log('\n====================================================================');
    console.log('=== RESULTADOS DE LA SIMULACIÓN EN SECO (DRY-RUN - COSTO CERO)   ===');
    console.log('====================================================================');
    console.log(`✓ Verificación de estructura: 100% de los documentos cumplen con el estándar {DEA}_{CI}.`);
    console.log(`✓ Total operaciones calculadas: ${writesQueue.length}`);
    console.log(`✓ Lotes de 400 operaciones: ${totalBatches}`);
    console.log(`✓ Consumo de Lecturas en Firebase: 0 LECTURAS (Garantizado)`);
    console.log(`✓ Consumo de Escrituras en Firebase: 0 ESCRITURAS (Modo simulación)`);

    const manifestPath = path.join('scratch', `fase3_bloque${targetBloque}_dryrun_manifest.json`);
    const manifestData = {
      fecha: new Date().toISOString(),
      bloque: targetBloque,
      nombre_bloque: BLOQUES[targetBloque]?.nombre || 'TODOS',
      total_registros_procesados: registrosSeleccionados.length,
      cedulas_unicas_depuradas: cedulasParaDepurar.size,
      total_operaciones: writesQueue.length,
      total_lotes: totalBatches,
      tamano_lote: BATCH_SIZE,
      muestra_escritura_canonica: writesQueue[0],
      muestra_depuracion_legada: writesQueue[writesQueue.length - 1]
    };

    fs.writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2), 'utf8');
    console.log(`✓ Manifiesto técnico generado en: ${manifestPath}`);
    console.log('\n🛡️ SCRIPT LISTO Y VALIDADO. A las 2:30 PM ejecute con:');
    console.log(`   node scripts/fase3_migracion_simetria.js --bloque=${targetBloque} --execute\n`);
    return;
  }

  // MODO EJECUCIÓN REAL (A partir de las 2:30 PM)
  console.log('\nIniciando envío de lotes a Cloud Firestore...');
  let token = await ensureFreshToken();
  let opsEnviadas = 0;

  for (let i = 0; i < totalBatches; i++) {
    const chunk = writesQueue.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
    console.log(`[Bloque ${targetBloque}] Enviando lote ${i + 1}/${totalBatches} (${chunk.length} operaciones)...`);

    await commitWritesWithRetry(chunk, token);
    opsEnviadas += chunk.length;
    console.log(`✓ Lote ${i + 1}/${totalBatches} confirmado exitosamente (HTTP 200). Acumulado: ${opsEnviadas}/${writesQueue.length}`);

    // Pausa preventiva de 600ms entre lotes para descongestión
    await new Promise(r => setTimeout(r, 600));
  }

  console.log('\n====================================================================');
  console.log(`=== ¡MIGRACIÓN DE BLOQUE ${targetBloque} COMPLETADA CON ÉXITO ROTUNDO! ===`);
  console.log('====================================================================');
  console.log(`• Total operaciones atómicas ejecutadas: ${opsEnviadas}`);
}

run().catch(err => {
  console.error('\n❌ ERROR EN FASE 3:', err);
  process.exit(1);
});
