const fs = require('fs');
const path = require('path');
const os = require('os');
const xlsx = require('xlsx');

// ====================================================================
// SCRIPT DE MIGRACIÓN: BLOQUE ESPECIAL PLANTA / ZONA EDUCATIVA
// ====================================================================

const args = process.argv.slice(2);
const isExecute = args.includes('--execute');
const isDryRun = !isExecute || args.includes('--dry-run');

console.log('====================================================================');
console.log('=== FASE 3: BLOQUE ESPECIAL PLANTA / ZONA EDUCATIVA (213 REGISTROS) ===');
console.log('====================================================================');
console.log(`• Modo de Ejecución: ${isExecute ? '🚀 PRODUCCIÓN (ESCRITURA REAL EN FIRESTORE)' : '🛡️ SIMULACIÓN EN SECO (DRY-RUN - 0 CONSUMO)'}`);
console.log('--------------------------------------------------------------------\n');

function toFirestoreNum(val) {
  const n = Number(val) || 0;
  if (Number.isInteger(n)) {
    return { integerValue: String(n) };
  }
  return { doubleValue: n };
}

console.log('1. Leyendo Censo de Planta de Zona Educativa (nomina_acualizada/RAC_zona.xlsx)...');
const wb = xlsx.readFile('nomina_acualizada/RAC_zona.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

// Fila 0 es banner, fila 1 son encabezados, filas 2 en adelante son datos
const funcionarios = [];
const cedulasParaDepurar = new Set();

for (let i = 2; i < rows.length; i++) {
  const r = rows[i];
  if (!r || !r[4]) continue;

  const codDep = String(r[4]).trim();
  const rawNombre = String(r[7] || '').trim();
  const rawCargo = String(r[13] || 'ADMINISTRATIVO').trim().toUpperCase();
  const tipoPersonal = String(r[14] || 'ADMINISTRATIVO').trim().toUpperCase();
  const ci = String(r[15] || '').trim().replace(/\D/g, '');
  const nombrePersona = String(r[16] || '').trim().toUpperCase();
  const sexo = String(r[18] || 'F').trim().toUpperCase();
  const codRac = String(r[12] || '').trim();
  const hAdm = Number(r[20]) || 40;
  const situacion = String(r[29] || 'ACTIVO').trim().toUpperCase();
  const observacion = String(r[30] || '').trim();

  if (!ci) continue;

  // Extracción de nombre limpio de dependencia y oficina
  let nombreLimpio = rawNombre;
  let oficina = '';
  const match = rawNombre.match(/\((.*?)\)/);
  if (match) {
    oficina = match[1].trim().toUpperCase();
    nombreLimpio = rawNombre.replace(/\(.*?\)/, '').trim().toUpperCase();
  }

  // Regla especial acordada para 001200339: Nombre canónico DIVISIÓN DE GESTIÓN HUMANA
  if (codDep === '001200339') {
    nombreLimpio = 'DIVISIÓN DE GESTIÓN HUMANA';
  }

  funcionarios.push({
    codDep,
    nombreLimpio,
    oficina,
    cargo: rawCargo,
    tipoPersonal,
    ci,
    nombrePersona,
    sexo,
    codRac,
    hAdm,
    situacion,
    observacion
  });

  cedulasParaDepurar.add(ci);
}

console.log(`✓ Funcionarios de planta válidos procesados: ${funcionarios.length}`);
console.log(`✓ Cédulas únicas para depuración asimétrica: ${cedulasParaDepurar.size}`);

// Construcción de operaciones Firestore
const writesQueue = [];

funcionarios.forEach(f => {
  const targetKey = `${f.codDep}_${f.ci}`;
  const docPath = `projects/sgh-merida/databases/(default)/documents/cargos_personal/${targetKey}`;

  const docFields = {
    cedula: { stringValue: f.ci },
    'cedula-identidad': { stringValue: f.ci },
    CEDULA: toFirestoreNum(f.ci),
    nacionalidad: { stringValue: 'V' },
    'nombre-apellido': { stringValue: f.nombrePersona },
    'apellidos-nombres': { stringValue: f.nombrePersona },
    NOMBRE: { stringValue: f.nombrePersona },
    nombres: { stringValue: f.nombrePersona },
    'codigo-plantel': { stringValue: f.codDep },
    codigoDEA: { stringValue: f.codDep },
    codigoPlantel: { stringValue: f.codDep },
    codigoDependencia: { stringValue: f.codDep },
    'CODIGO DEL PLANTEL': { stringValue: f.codDep },
    plantel: { stringValue: f.nombreLimpio },
    'ubicacion-fisica': { stringValue: f.nombreLimpio },
    'UBICACIÓN FÍSICA': { stringValue: f.nombreLimpio },
    denominacion: { stringValue: 'SEDE ADMINISTRATIVA' },
    oficina: { stringValue: f.oficina },
    municipio: { stringValue: 'LIBERTADOR' },
    MUNICIPIO: { stringValue: 'LIBERTADOR' },
    parroquia: { stringValue: 'SAGRARIO' },
    PARROQUIA: { stringValue: 'SAGRARIO' },
    estado: { stringValue: 'MÉRIDA' },
    cargo: { stringValue: f.cargo },
    CARGO: { stringValue: f.cargo },
    'codigo-rac': { stringValue: f.codRac },
    'CODIGO RAC': { stringValue: f.codRac },
    'tipo-personal': { stringValue: f.tipoPersonal },
    'TIPO PERSONAL': { stringValue: f.tipoPersonal },
    dependencia: { stringValue: 'NACIONAL' },
    DEPENDENCIA: { stringValue: 'NACIONAL' },
    titular: { stringValue: 'Titular' },
    TITULAR: { stringValue: 'Titular' },
    'horas-recibo': toFirestoreNum(f.hAdm),
    'horas-academicas': toFirestoreNum(0),
    'horas-administrativas': toFirestoreNum(f.hAdm),
    'situacion-laboral': { stringValue: f.situacion },
    'SITUACIÓN DEL TRABAJADOR': { stringValue: f.situacion },
    genero: { stringValue: f.sexo },
    observacion: { stringValue: f.observacion },
    es_planta: { booleanValue: true },
    simetria_homologada: { booleanValue: true },
    ultima_actualizacion: { stringValue: new Date().toISOString() }
  };

  writesQueue.push({
    update: {
      name: docPath,
      fields: docFields
    }
  });
});

// Depuración de claves legadas sueltas cargos_personal/{ci}
cedulasParaDepurar.forEach(ci => {
  const legacyDocPath = `projects/sgh-merida/databases/(default)/documents/cargos_personal/${ci}`;
  writesQueue.push({
    delete: legacyDocPath
  });
});

console.log(`• Total Operaciones Canónicas Planta: ${funcionarios.length}`);
console.log(`• Total Operaciones de Depuración Asimétrica Legada: ${cedulasParaDepurar.size}`);
console.log(`• Total Operaciones en Cola: ${writesQueue.length}`);

const BATCH_SIZE = 400;
const totalBatches = Math.ceil(writesQueue.length / BATCH_SIZE);
console.log(`• Lotes programados (${BATCH_SIZE} ops c/u): ${totalBatches}`);

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
    console.log('=== RESULTADOS DE LA SIMULACIÓN EN SECO (PLANTA - COSTO CERO)    ===');
    console.log('====================================================================');
    console.log(`✓ Total funcionarios de planta: ${funcionarios.length}`);
    console.log(`✓ Total cédulas para depuración: ${cedulasParaDepurar.size}`);
    console.log(`✓ Total operaciones: ${writesQueue.length}`);
    console.log(`✓ Lotes programados: ${totalBatches}`);
    console.log(`✓ Consumo de Lecturas: 0 LECTURAS`);
    console.log(`✓ Consumo de Escrituras estimado: ${funcionarios.length} escrituras`);
    console.log(`✓ Muestra de registro canónico:`);
    console.log(JSON.stringify(writesQueue[0], null, 2));

    const manifestPath = path.join('scratch', 'fase3_planta_dryrun_manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify({
      fecha: new Date().toISOString(),
      tipo: 'BLOQUE_ESPECIAL_PLANTA',
      total_funcionarios: funcionarios.length,
      total_operaciones: writesQueue.length,
      lotes: totalBatches,
      primera_operacion: writesQueue[0]
    }, null, 2), 'utf8');
    console.log(`\n✓ Manifiesto dry-run guardado en: ${manifestPath}`);
    return;
  }

  // MODO EJECUCIÓN REAL
  console.log('\n🚀 Iniciando envío de lotes de Planta a Cloud Firestore...');
  let token = await ensureFreshToken();
  let opsEnviadas = 0;

  for (let i = 0; i < totalBatches; i++) {
    const chunk = writesQueue.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
    console.log(`[Planta / Zona] Enviando lote ${i + 1}/${totalBatches} (${chunk.length} operaciones)...`);

    token = await ensureFreshToken();
    await commitWritesWithRetry(chunk, token);
    opsEnviadas += chunk.length;
    console.log(`✓ Lote ${i + 1}/${totalBatches} confirmado con éxito (HTTP 200). Acumulado: ${opsEnviadas}/${writesQueue.length}`);
    await new Promise(r => setTimeout(r, 600));
  }

  const commitPath = path.join('scratch', 'fase3_planta_commit_manifest.json');
  fs.writeFileSync(commitPath, JSON.stringify({
    fecha: new Date().toISOString(),
    tipo: 'BLOQUE_ESPECIAL_PLANTA',
    total_funcionarios: funcionarios.length,
    total_operaciones: opsEnviadas,
    estado: 'EXITOSO_HTTP_200'
  }, null, 2), 'utf8');
  console.log(`✓ Manifiesto de ejecución en vivo guardado en: ${commitPath}`);
  console.log('\n====================================================================');
  console.log('=== ¡MIGRACIÓN DE PLANTA / ZONA EDUCATIVA COMPLETADA CON ÉXITO!   ===');
  console.log('====================================================================');
}

run().catch(err => {
  console.error('\n❌ ERROR EN PLANTA:', err);
  process.exit(1);
});

