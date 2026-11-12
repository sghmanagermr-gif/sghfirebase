const fs = require('fs');
const path = require('path');
const os = require('os');
const xlsx = require('xlsx');

console.log('====================================================================');
console.log('=== SGH: EJECUCIÓN MAESTRA DE AUDITORÍA INTEGRAL ESTATAL (23 MUN) ===');
console.log('====================================================================');

const args = process.argv.slice(2);
const isExecute = args.includes('--execute');
const isDryRun = !isExecute || args.includes('--dry-run');

console.log(`• Modo: ${isExecute ? '🚀 PRODUCCIÓN (ESCRITURA REAL EN FIRESTORE)' : '🛡️ SIMULACIÓN EN SECO (DRY-RUN - 0 CONSUMO)'}`);

function toFirestoreFields(obj) {
  const out = {};
  if (!obj || typeof obj !== 'object') return out;
  Object.keys(obj).forEach(k => {
    const v = obj[k];
    if (v === null || v === undefined) return;
    if (typeof v === 'object' && (v.stringValue !== undefined || v.integerValue !== undefined || v.booleanValue !== undefined)) {
      out[k] = v;
    } else if (typeof v === 'boolean') {
      out[k] = { booleanValue: v };
    } else if (typeof v === 'number') {
      out[k] = { integerValue: String(v) };
    } else {
      out[k] = { stringValue: String(v).trim() };
    }
  });
  return out;
}

// Cargar RAC para resolución de cualquier DEA faltante
console.log('\n1. Cargando RAC.xlsx para resolución canónica...');
const wbRac = xlsx.readFile('RAC.xlsx');
const racRows = xlsx.utils.sheet_to_json(wbRac.Sheets['PERSONAL']);
const racMapByCi = new Map();
racRows.forEach(r => {
  const ci = String(r['CEDULA_IDENTIDAD'] || r['CEDULA'] || '').trim();
  if (ci && !racMapByCi.has(ci)) {
    racMapByCi.set(ci, r);
  }
});
console.log(`✓ Metadatos de RAC cargados: ${racMapByCi.size} cédulas únicas indexadas.`);

// -------------------------------------------------------------
// FASE A: COMPILAR LOS 123 CARGOS OMITIDOS DE DOBLE CARGO
// -------------------------------------------------------------
console.log('\n2. Compilando cargos omitidos (Doble Cargo)...');

const cargoFiles = fs.readdirSync('scratch').filter(f => (f.startsWith('cargos_') || f.includes('_cargos_')) && f.endsWith('_restauracion.json'));
const allCargos = [];
const cargosByMun = {};

cargoFiles.forEach(f => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join('scratch', f), 'utf8'));
    if (Array.isArray(data)) {
      data.forEach(c => {
        allCargos.push(c);
        const mun = c.municipio || 'DESCONOCIDO';
        cargosByMun[mun] = (cargosByMun[mun] || 0) + 1;
      });
    }
  } catch (e) {
    console.error(`Error leyendo ${f}:`, e.message);
  }
});

console.log(`✓ Total cargos omitidos compilados: ${allCargos.length}`);
console.log('  Desglose por municipio:', cargosByMun);

// -------------------------------------------------------------
// FASE B: COMPILAR LOS 926 PERFILES ENRIQUECIDOS
// -------------------------------------------------------------
console.log('\n3. Compilando perfiles enriquecidos e incompletos...');

const perfilesFiles = fs.readdirSync('scratch').filter(f => f.includes('enriquecimiento_integral') && f.endsWith('.json') && !f.startsWith('expedientes_'));
const allPerfiles = [];
const perfilesByMun = {};

perfilesFiles.forEach(f => {
  try {
    let data = JSON.parse(fs.readFileSync(path.join('scratch', f), 'utf8'));
    if (Array.isArray(data)) {
      // Caso especial Alberto Adriani: filtrar solo los 3 docentes con perfil genuinamente vacío
      if (f.includes('alberto_adriani')) {
        const adrianiCis = ['11220084', '9398666', '16742727'];
        data = data.filter(d => adrianiCis.includes(String(d.ci).trim()));
      }

      data.forEach(p => {
        let dea = String(p.dea || '').trim().toUpperCase();
        const ci = String(p.ci || '').trim();

        // Si DEA está vacío, resolver desde RAC
        if (!dea) {
          const racMatch = racMapByCi.get(ci);
          if (racMatch && racMatch['CODIGO DEL PLANTEL']) {
            dea = String(racMatch['CODIGO DEL PLANTEL']).trim().toUpperCase();
          }
        }

        if (dea && ci) {
          p.dea = dea;
          p.docId = `${dea}_${ci}`;
          allPerfiles.push(p);
          const mun = p.municipio || 'DESCONOCIDO';
          perfilesByMun[mun] = (perfilesByMun[mun] || 0) + 1;
        }
      });
    }
  } catch (e) {
    console.error(`Error leyendo ${f}:`, e.message);
  }
});

console.log(`✓ Total perfiles esenciales compilados: ${allPerfiles.length}`);
console.log('  Desglose por municipio:', perfilesByMun);

// -------------------------------------------------------------
// FASE C: ESTRUCTURAR OPERACIONES ATÓMICAS PARA FIRESTORE
// -------------------------------------------------------------
console.log('\n4. Estructurando operaciones atómicas para Firestore REST API...');

const writesQueue = [];

// 1. Operaciones de cargos completos
allCargos.forEach(c => {
  const targetKey = c.docId || `${c.dea}_${c.ci}`;
  const docPath = `projects/sgh-merida/databases/(default)/documents/cargos_personal/${targetKey}`;

  // Normalizar formato Firestore Value
  const fields = toFirestoreFields(c.fields || {});

  writesQueue.push({
    update: {
      name: docPath,
      fields
    }
  });
});

// 2. Operaciones de perfiles con updateMask quirúrgico
allPerfiles.forEach(p => {
  const targetKey = p.docId;
  const docPath = `projects/sgh-merida/databases/(default)/documents/cargos_personal/${targetKey}`;

  const fields = {};
  const fieldPaths = [];

  Object.keys(p.updates || {}).forEach(k => {
    const val = p.updates[k];
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      if (typeof val === 'number') {
        fields[k] = { integerValue: String(val) };
      } else if (typeof val === 'boolean') {
        fields[k] = { booleanValue: val };
      } else {
        fields[k] = { stringValue: String(val).trim() };
      }
      fieldPaths.push(k.includes('-') || k.includes(' ') ? `\`${k}\`` : k);
    }
  });

  if (fieldPaths.length > 0) {
    writesQueue.push({
      update: {
        name: docPath,
        fields
      },
      updateMask: { fieldPaths }
    });
  }
});

console.log(`\n• Gran Total de Operaciones de Escritura Preparadas: ${writesQueue.length}`);
console.log(`  - Cargos Nuevos / Restaurados: ${allCargos.length}`);
console.log(`  - Perfiles Enriquecidos Quirúrgicamente: ${allPerfiles.length}`);

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
    console.log(`✓ Lotes calculados: ${totalBatches} lotes.`);
    console.log(`✓ Consumo de cuota estimado: ${writesQueue.length} escrituras (~${((writesQueue.length / 20000) * 100).toFixed(1)}% del cupo diario gratuito).`);
    return;
  }

  console.log(`\n🚀 INICIANDO EJECUCIÓN EN FIRESTORE (6 LOTES)...`);
  let token = await ensureFreshToken();
  const startTime = Date.now();

  for (let i = 0; i < totalBatches; i++) {
    const start = i * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, writesQueue.length);
    const batch = writesQueue.slice(start, end);

    if (i > 0 && i % 10 === 0) {
      token = await ensureFreshToken();
    }

    await commitBatchWithRetry(batch, token, i + 1, totalBatches);

    const pct = (((i + 1) / totalBatches) * 100).toFixed(1);
    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(0);
    console.log(`  ✓ Lote ${i + 1}/${totalBatches} completado (${batch.length} ops) [${pct}%] - ${elapsedSec}s transcurridos`);

    await new Promise(r => setTimeout(r, 1500));
  }

  console.log('\n====================================================================');
  console.log('=== ¡AUDITORÍA INTEGRAL ESTATAL APLICADA AL 100% EN FIRESTORE! ===');
  console.log('====================================================================');
}

run().catch(err => {
  console.error('\n❌ ERROR EN EJECUCIÓN:', err.message);
  process.exit(1);
});
