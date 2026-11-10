const fs = require('fs');
const os = require('os');
const path = require('path');
const xlsx = require('xlsx');

// ====================================================================
// SCRIPT DE SANEAMIENTO: DOCUMENTOS SIN DEA (CLAVES FANTASMA _)
// Fase 1: Eliminación de 97 duplicados fantasma.
// Fase 2: Regularización canónica de los 7 huérfanos con su DEA de RAC.
// Extra: Normalización canónica de OD02271418_19047873 (Marili Rojas).
// ====================================================================

const args = process.argv.slice(2);
const isExecute = args.includes('--execute');
const isDryRun = !isExecute || args.includes('--dry-run');

console.log('====================================================================');
console.log('=== SANEAMIENTO GENERAL: CLAVES FANTASMA _ Y REGULARIZACIÓN DE DEA ===');
console.log('====================================================================');
console.log(`• Modo de Ejecución: ${isExecute ? '🚀 PRODUCCIÓN (ESCRITURA REAL EN FIRESTORE)' : '🛡️ SIMULACIÓN EN SECO (DRY-RUN - 0 CONSUMO)'}`);
console.log('--------------------------------------------------------------------\n');

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

function toFirestoreNum(val) {
  const n = Number(val) || 0;
  if (Number.isInteger(n)) return { integerValue: String(n) };
  return { doubleValue: n };
}

function toFirestoreHours(val) {
  if (val === '' || val === undefined || val === null || val === 'N/A') {
    return { stringValue: '' };
  }
  const n = Number(String(val).replace(',', '.'));
  if (isNaN(n) || n <= 0) return { stringValue: '' };
  if (Number.isInteger(n)) return { integerValue: String(n) };
  return { doubleValue: n };
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
      if (res.status === 200) return data;
      console.error(`Intento ${attempt} falló (${res.status}):`, JSON.stringify(data).substring(0, 200));
      if (attempt === retries) throw new Error(`Commit falló: ${JSON.stringify(data)}`);
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }
}

async function run() {
  const token = await ensureFreshToken();
  const headers = { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };

  // 1. Cargar datos de RAC.xlsx
  console.log('1. Cargando base de datos oficial RAC.xlsx...');
  const wbRac = xlsx.readFile('RAC.xlsx');
  const racPersonal = xlsx.utils.sheet_to_json(wbRac.Sheets['PERSONAL']);
  const racMap = new Map();
  racPersonal.forEach(r => {
    const ci = String(r['CEDULA'] || '').trim().replace(/\D/g, '');
    if (ci && !racMap.has(ci)) {
      racMap.set(ci, r);
    }
  });
  console.log(`✓ Registros RAC cargados: ${racMap.size}`);

  // 2. Cargar auditoría de los 104 documentos
  const auditPath = path.join('scratch', 'auditoria_registros_sin_dea_resultado.json');
  if (!fs.existsSync(auditPath)) {
    throw new Error('No se encontró scratch/auditoria_registros_sin_dea_resultado.json. Ejecute auditar_todos_registros_sin_dea.js primero.');
  }
  const auditData = JSON.parse(fs.readFileSync(auditPath, 'utf8'));

  const docsParaEliminar = [];
  const sieteHuerfanos = [];

  for (const [mun, d] of Object.entries(auditData.detalle_municipios)) {
    for (const c of d.casos) {
      docsParaEliminar.push(c.docIdFantasma);
      if (!c.tieneDocLegitimo) {
        sieteHuerfanos.push(c);
      }
    }
  }

  console.log(`✓ Total documentos fantasma a eliminar: ${docsParaEliminar.length}`);
  console.log(`✓ Total funcionarios huérfanos a regularizar: ${sieteHuerfanos.length}`);

  // 3. Preparar operaciones Firestore
  const writesQueue = [];

  // A. Creación de los 7 expedientes canónicos legítimos
  console.log('\n2. Preparando regularización de los 7 huérfanos con sus planteles legítimos:');
  sieteHuerfanos.forEach(h => {
    const ci = h.ci;
    const r = racMap.get(ci);
    if (!r) {
      console.warn(`⚠️ Advertencia: CI ${ci} no encontrada en RAC.xlsx`);
      return;
    }

    const dea = String(r['CODIGO DEL PLANTEL'] || r['CODIGO DEA'] || h.deaReal).trim().toUpperCase();
    const docKey = `${dea}_${ci}`;
    const docPath = `projects/sgh-merida/databases/(default)/documents/cargos_personal/${docKey}`;

    const nombre = String(r['NOMBRE Y APELLIDO'] || h.nombre).trim().toUpperCase();
    const cargo = String(r['CARGO'] || 'DOCENTE').trim().toUpperCase();
    const codRac = String(r['CODIGO RAC'] || '').trim().toUpperCase();
    const tipoPersonal = String(r['TIPO PERSONAL'] || 'DOCENTE').trim().toUpperCase();
    const titular = String(r['TITULAR'] || 'NO').trim().toUpperCase() === 'SI' ? 'Titular' : 'No Titular';
    const hAca = r['HORAS ACADEMICAS'];
    const hAdm = r['HORAS ADMINISTRATIVAS'];
    const hRecibo = (Number(hAca) || 0) + (Number(hAdm) || 0) || (tipoPersonal === 'DOCENTE' ? 53 : 40);
    const fechaIng = excelDateToDMY(r['FECHA DE INGRESO']);
    const municipio = String(r['MUNICIPIO'] || h.mun).trim().toUpperCase();
    const parroquia = String(r['PARROQUIA'] || 'CENTRO').trim().toUpperCase();
    const plantel = String(r['UBICACIÓN FÍSICA'] || h.plantelReal || dea).trim().toUpperCase();
    const dependencia = String(r['DEPENDENCIA'] || 'ESTADAL').trim().toUpperCase();
    const genero = String(r['GENERO'] || 'FEMENINO').trim().toUpperCase();
    const turnos = String(r['TURNOS QUE ATIENDE'] || 'MAÑANA').trim().toUpperCase();
    const atiendeMat = String(r['ATIENDE MATRICUAL'] || (tipoPersonal === 'DOCENTE' ? 'SI' : 'NO')).trim().toUpperCase();
    const observaciones = String(r['OBSERVACIÓN'] || '').trim();

    const fields = {
      cedula: { stringValue: ci },
      'nombre-apellido': { stringValue: nombre },
      genero: { stringValue: genero },
      cargo: { stringValue: cargo },
      'codigo-rac': { stringValue: codRac },
      'tipo-personal': { stringValue: tipoPersonal },
      titular: { stringValue: titular },
      'horas-academicas': toFirestoreHours(hAca),
      'horas-administrativas': toFirestoreHours(hAdm),
      'horas-recibo': toFirestoreHours(hRecibo),
      'fecha-ingreso': { stringValue: fechaIng },
      'turnos-atiende': { stringValue: turnos },
      'atiende-matricula': { stringValue: atiendeMat },
      observaciones: { stringValue: observaciones },
      codigoDEA: { stringValue: dea },
      'codigo-plantel': { stringValue: dea },
      plantel: { stringValue: plantel },
      municipio: { stringValue: municipio },
      parroquia: { stringValue: parroquia },
      estado: { stringValue: 'MÉRIDA' },
      dependencia: { stringValue: dependencia },
      'situacion-laboral': { stringValue: 'ACTIVO' },
      simetria_homologada: { booleanValue: true },
      ultima_actualizacion: { stringValue: new Date().toISOString() }
    };

    writesQueue.push({
      update: {
        name: docPath,
        fields
      }
    });

    console.log(`  + [ALTA CANÓNICA] ${docKey} -> ${nombre} (${cargo}) en ${plantel}`);
  });

  // B. Normalizar OD02271418_19047873 (Marili Solena Rojas Ramírez) para que tenga campos canónicos con guiones
  const mariliRac = racMap.get('19047873');
  if (mariliRac) {
    const mariliPath = 'projects/sgh-merida/databases/(default)/documents/cargos_personal/OD02271418_19047873';
    writesQueue.push({
      update: {
        name: mariliPath,
        fields: {
          cedula: { stringValue: '19047873' },
          'nombre-apellido': { stringValue: 'MARILI SOLENA ROJAS RAMÍREZ' },
          genero: { stringValue: 'FEMENINO' },
          cargo: { stringValue: 'DOCENTE UNICO' },
          'codigo-rac': { stringValue: 'D/U' },
          'tipo-personal': { stringValue: 'DOCENTE' },
          titular: { stringValue: 'No Titular' },
          'horas-academicas': toFirestoreHours(53),
          'horas-administrativas': toFirestoreHours(0),
          'horas-recibo': toFirestoreHours(53),
          'fecha-ingreso': { stringValue: '01/05/2025' },
          'turnos-atiende': { stringValue: 'MAÑANA' },
          'atiende-matricula': { stringValue: 'SI' },
          observaciones: { stringValue: '14 ESTUDIANTES, PRIMER GRADO, SECCIÓN ÚNICA' },
          codigoDEA: { stringValue: 'OD02271418' },
          'codigo-plantel': { stringValue: 'OD02271418' },
          plantel: { stringValue: 'ESCUELA ESTADAL JOSE GREGORIO RAMIREZ' },
          municipio: { stringValue: 'RIVAS DAVILA' },
          parroquia: { stringValue: 'BAILADORES' },
          estado: { stringValue: 'MÉRIDA' },
          dependencia: { stringValue: 'ESTADAL' },
          'situacion-laboral': { stringValue: 'ACTIVO' },
          simetria_homologada: { booleanValue: true },
          ultima_actualizacion: { stringValue: new Date().toISOString() }
        }
      }
    });
    console.log(`  + [ACTUALIZACIÓN CANÓNICA] OD02271418_19047873 -> MARILI SOLENA ROJAS RAMÍREZ homologada 100%`);
  }

  // C. Eliminación atómica de los 104 documentos fantasma con prefijo '_'
  console.log(`\n3. Preparando la eliminación atómica de los ${docsParaEliminar.length} documentos fantasma:`);
  docsParaEliminar.forEach(docId => {
    const docPath = `projects/sgh-merida/databases/(default)/documents/cargos_personal/${docId}`;
    writesQueue.push({
      delete: docPath
    });
  });

  console.log(`\n• Total Operaciones en Cola: ${writesQueue.length}`);
  console.log(`  - Altas canónicas de huérfanos: ${sieteHuerfanos.length}`);
  console.log(`  - Actualizaciones canónicas: 1 (Marili Rojas)`);
  console.log(`  - Eliminaciones de documentos fantasma: ${docsParaEliminar.length}`);

  if (isDryRun) {
    console.log('\n====================================================================');
    console.log('=== SIMULACIÓN EN SECO (DRY-RUN - COSTO CERO) COMPLETADA CON ÉXITO ===');
    console.log('====================================================================');
    console.log('Para ejecutar en vivo en Cloud Firestore, corra el script con --execute.');
    return;
  }

  // MODO EJECUCIÓN REAL
  console.log('\n🚀 Ejecutando lote atómico en Cloud Firestore...');
  const resCommit = await commitWritesWithRetry(writesQueue, token);
  console.log(`✓ Lote de ${writesQueue.length} operaciones confirmado con éxito (HTTP 200).`);

  // Verificación post-vuelo en vivo
  console.log('\n4. Verificación Post-Vuelo en Vivo:');
  const chk1 = await fetch(`https://firestore.googleapis.com/v1/projects/sgh-merida/databases/(default)/documents/cargos_personal/_19047873`, { headers });
  console.log(`  • Clave fantasma _19047873: Status ${chk1.status} (Esperado: 404 Eliminada)`);

  const chk2 = await fetch(`https://firestore.googleapis.com/v1/projects/sgh-merida/databases/(default)/documents/cargos_personal/OD02271418_19047873`, { headers });
  console.log(`  • Clave canónica OD02271418_19047873: Status ${chk2.status} (Esperado: 200 Activa)`);

  const chk3 = await fetch(`https://firestore.googleapis.com/v1/projects/sgh-merida/databases/(default)/documents/cargos_personal/S2855D1410_19529390`, { headers });
  console.log(`  • Clave canónica Yuleny Bernal (S2855D1410_19529390): Status ${chk3.status} (Esperado: 200 Activa)`);

  // Guardar manifiesto de ejecución
  const manifestPath = path.join('scratch', 'saneamiento_claves_fantasma_commit_manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify({
    fecha: new Date().toISOString(),
    tipo: 'SANEAMIENTO_CLAVES_FANTASMA_Y_REGULARIZACION_DEA',
    total_operaciones: writesQueue.length,
    altas_canónicas: sieteHuerfanos.length,
    eliminaciones_fantasma: docsParaEliminar.length,
    estado: 'EXITOSO_HTTP_200'
  }, null, 2), 'utf8');

  console.log(`✓ Manifiesto guardado en: ${manifestPath}`);
  console.log('\n====================================================================');
  console.log('=== ¡SANEAMIENTO Y REGULARIZACIÓN COMPLETADOS EXITOSAMENTE!       ===');
  console.log('====================================================================');
}

run().catch(err => {
  console.error('\n❌ ERROR EN SANEAMIENTO:', err);
  process.exit(1);
});

