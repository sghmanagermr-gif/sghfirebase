const fs = require('fs');
const path = require('path');
const os = require('os');
const xlsx = require('xlsx');

// ====================================================================
// SCRIPT DE ENRIQUECIMIENTO Y LIMPIEZA: PLANTA CENTRAL / ZONA EDUCATIVA
// Reglas:
// 1. Cero duplicados en campos (solo campos canonicos en minusculas).
// 2. Llave simetrica universal: {codigoDEA}_{cedula}.
// 3. Horas academicas y administrativas segun cargo y recibo.
// 4. Genero completo ("FEMENINO" / "MASCULINO").
// 5. Turnos: "DOBLE TURNO".
// 6. Atiende matricula: "NO".
// 7. Fechas convertidas de serial a DD/MM/AAAA.
// ====================================================================

const args = process.argv.slice(2);
const isExecute = args.includes('--execute');
const isDryRun = !isExecute || args.includes('--dry-run');

console.log('====================================================================');
console.log('=== ENRIQUECIMIENTO Y ESTANDARIZACIÓN: PLANTA CENTRAL (213 FUNC.) ===');
console.log('====================================================================');
console.log(`• Modo de Ejecución: ${isExecute ? '🚀 PRODUCCIÓN (ESCRITURA REAL EN FIRESTORE)' : '🛡️ SIMULACIÓN EN SECO (DRY-RUN - 0 CONSUMO)'}`);
console.log('--------------------------------------------------------------------\n');

function toFirestoreHours(val) {
  if (val === '' || val === undefined || val === null) {
    return { stringValue: '' };
  }
  const n = Number(val);
  if (isNaN(n)) return { stringValue: '' };
  if (Number.isInteger(n)) return { integerValue: String(n) };
  return { doubleValue: n };
}

function parseHorasExcel(raw) {
  if (raw === undefined || raw === null) return '';
  const s = String(raw).trim().toUpperCase();
  if (s === 'N/A' || s === '' || s === '0') return '';
  const n = Number(s.replace(',', '.'));
  if (isNaN(n) || n <= 0) return '';
  return n;
}

function excelDateToDMY(val) {
  if (!val || val === 'N/A') return '';
  if (typeof val === 'string' && (val.includes('/') || val.includes('-'))) return val;
  const num = Number(val);
  if (isNaN(num) || num <= 0) return '';
  const parsed = xlsx.SSF.parse_date_code(num);
  if (!parsed) return '';
  const d = String(parsed.d).padStart(2, '0');
  const m = String(parsed.m).padStart(2, '0');
  const y = parsed.y;
  return `${d}/${m}/${y}`;
}

console.log('1. Leyendo nomina_acualizada/RAC_zona.xlsx...');
const wb = xlsx.readFile('nomina_acualizada/RAC_zona.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

const funcionarios = [];
const sedesMap = new Map();

for (let i = 2; i < rows.length; i++) {
  const r = rows[i];
  if (!r || !r[4]) continue;

  const codDep = String(r[4]).trim();
  const rawNombreSede = String(r[7] || '').trim();
  const codRac = String(r[12] || '').trim();
  const rawCargo = String(r[13] || 'ADMINISTRATIVO').trim().toUpperCase();
  const tipoPersonal = String(r[14] || 'ADMINISTRATIVO').trim().toUpperCase();
  const ci = String(r[15] || '').trim().replace(/\D/g, '');
  const nombrePersona = String(r[16] || '').trim().toUpperCase();
  const rawFechaIngreso = r[17];
  const rawSexo = String(r[18] || 'F').trim().toUpperCase();
  const rawHorasAca = r[19];
  const rawHorasAdm = r[20];
  const situacion = String(r[29] || 'ACTIVO').trim().toUpperCase();
  const observacion = String(r[30] || '').trim();

  if (!ci) continue;

  // Extracción de nombre limpio de dependencia y oficina
  let nombreLimpio = rawNombreSede;
  let oficina = '';
  const match = rawNombreSede.match(/\((.*?)\)/);
  if (match) {
    oficina = match[1].trim().toUpperCase();
    nombreLimpio = rawNombreSede.replace(/\(.*?\)/, '').trim().toUpperCase();
  }

  // Regla para 001200339: Nombre canónico DIVISIÓN DE GESTIÓN HUMANA
  if (codDep === '001200339') {
    nombreLimpio = 'DIVISIÓN DE GESTIÓN HUMANA';
  }

  // Género institucional según catálogo
  const genero = rawSexo === 'M' ? 'MASCULINO' : 'FEMENINO';

  // Fecha de ingreso formateada
  const fechaIngreso = excelDateToDMY(rawFechaIngreso);

  // Horas según regla estricta: N/A o vacío queda VACÍO
  const horasAca = parseHorasExcel(rawHorasAca);
  const horasAdm = parseHorasExcel(rawHorasAdm);
  let horasRecibo = '';
  if (horasAca !== '' && horasAdm !== '') {
    horasRecibo = parseFloat((horasAca + horasAdm).toFixed(2));
  } else if (horasAdm !== '') {
    horasRecibo = horasAdm;
  } else if (horasAca !== '') {
    horasRecibo = horasAca;
  }

  funcionarios.push({
    codDep,
    nombreLimpio,
    oficina,
    ci,
    nombrePersona,
    genero,
    codRac,
    cargo: rawCargo,
    tipoPersonal,
    titular: 'Titular',
    fechaIngreso,
    horasAca,
    horasAdm,
    horasRecibo,
    turnosAtiende: 'DOBLE TURNO',
    situacion,
    observacion
  });

  if (!sedesMap.has(codDep)) {
    sedesMap.set(codDep, nombreLimpio);
  }
}

console.log(`✓ Funcionarios procesados: ${funcionarios.length}`);
console.log(`✓ Sedes involucradas: ${sedesMap.size}`);

// Preparar operaciones Firestore
const writesQueue = [];

// 1. Operaciones para cargos_personal (213 funcionarios)
funcionarios.forEach(f => {
  const docKey = `${f.codDep}_${f.ci}`;
  const docPath = `projects/sgh-merida/databases/(default)/documents/cargos_personal/${docKey}`;

  // Esquema 100% CANÓNICO Y LIMPIO (sin redundancias en mayúsculas)
  const docFields = {
    cedula: { stringValue: f.ci },
    'nombre-apellido': { stringValue: f.nombrePersona },
    genero: { stringValue: f.genero },
    'codigo-rac': { stringValue: f.codRac },
    cargo: { stringValue: f.cargo },
    'tipo-personal': { stringValue: f.tipoPersonal },
    titular: { stringValue: f.titular },
    'fecha-ingreso': { stringValue: f.fechaIngreso },
    'horas-academicas': toFirestoreHours(f.horasAca),
    'horas-administrativas': toFirestoreHours(f.horasAdm),
    'horas-recibo': toFirestoreHours(f.horasRecibo),
    'turnos-atiende': { stringValue: f.turnosAtiende },
    'situacion-laboral': { stringValue: f.situacion },
    observaciones: { stringValue: f.observacion },
    'atiende-matricula': { stringValue: 'NO' },
    codigoDEA: { stringValue: f.codDep },
    'codigo-plantel': { stringValue: f.codDep },
    plantel: { stringValue: f.nombreLimpio },
    oficina: { stringValue: f.oficina },
    municipio: { stringValue: 'LIBERTADOR' },
    parroquia: { stringValue: 'SAGRARIO' },
    estado: { stringValue: 'MÉRIDA' },
    dependencia: { stringValue: 'NACIONAL' },
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

// 2. Operaciones para planteles (9 sedes de Zona Educativa)
sedesMap.forEach((nombreSede, codDep) => {
  const docPath = `projects/sgh-merida/databases/(default)/documents/planteles/${codDep}`;
  writesQueue.push({
    update: {
      name: docPath,
      fields: {
        'ubicacion-geografica': { stringValue: 'URBANO' },
        'turno-plantel': { stringValue: 'DOBLE TURNO' },
        'turnos-plantel': { stringValue: 'DOBLE TURNO' },
        'codigo-estadistico': { stringValue: '' },
        nivel: { stringValue: '' },
        modalidad: { stringValue: '' },
        ultima_actualizacion: { stringValue: new Date().toISOString() }
      }
    },
    updateMask: {
      fieldPaths: [
        '`ubicacion-geografica`',
        '`turno-plantel`',
        '`turnos-plantel`',
        '`codigo-estadistico`',
        'nivel',
        'modalidad',
        'ultima_actualizacion'
      ]
    }
  });
});

console.log(`• Total Operaciones en Cola: ${writesQueue.length} (213 personal + ${sedesMap.size} sedes)`);

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
    console.log(`✓ Total operaciones preparadas: ${writesQueue.length}`);
    console.log(`✓ Consumo de Lecturas: 0 LECTURAS`);
    console.log(`✓ Consumo de Escrituras estimado: ${writesQueue.length} escrituras`);
    console.log('\n--- MUESTRA REGISTRO PERSONAL (OBRERO: FRANCISCO RANGEL) ---');
    const obrero = writesQueue.find(w => w.update?.name?.includes('10103751'));
    console.log(JSON.stringify(obrero, null, 2));

    console.log('\n--- MUESTRA REGISTRO PERSONAL (DOCENTE MIXTO: CI 7889616) ---');
    const docente = writesQueue.find(w => w.update?.name?.includes('7889616'));
    console.log(JSON.stringify(docente, null, 2));

    console.log('\n--- MUESTRA REGISTRO SEDE (001200339) ---');
    const sede = writesQueue.find(w => w.update?.name?.includes('planteles/001200339'));
    console.log(JSON.stringify(sede, null, 2));

    const manifestPath = path.join('scratch', 'enriquecer_planta_dryrun_manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify({
      fecha: new Date().toISOString(),
      tipo: 'ENRIQUECIMIENTO_PLANTA_ZONA',
      total_operaciones: writesQueue.length,
      muestra_obrero: obrero,
      muestra_docente: docente,
      muestra_sede: sede
    }, null, 2), 'utf8');
    console.log(`\n✓ Manifiesto dry-run guardado en: ${manifestPath}`);
    return;
  }

  // MODO EJECUCIÓN REAL
  console.log('\n🚀 Iniciando envío a Cloud Firestore en un único lote...');
  const token = await ensureFreshToken();
  await commitWritesWithRetry(writesQueue, token);
  console.log(`✓ Lote de ${writesQueue.length} operaciones confirmado con éxito (HTTP 200).`);

  const commitPath = path.join('scratch', 'enriquecer_planta_commit_manifest.json');
  fs.writeFileSync(commitPath, JSON.stringify({
    fecha: new Date().toISOString(),
    tipo: 'ENRIQUECIMIENTO_PLANTA_ZONA',
    total_operaciones: writesQueue.length,
    estado: 'EXITOSO_HTTP_200'
  }, null, 2), 'utf8');
  console.log(`✓ Manifiesto de ejecución guardado en: ${commitPath}`);
  console.log('\n====================================================================');
  console.log('=== ¡ENRIQUECIMIENTO Y LIMPIEZA DE PLANTA COMPLETADOS CON ÉXITO! ===');
  console.log('====================================================================');
}

run().catch(err => {
  console.error('\n❌ ERROR EN ENRIQUECIMIENTO:', err);
  process.exit(1);
});
