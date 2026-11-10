const fs = require('fs');
const path = require('path');
const os = require('os');

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

async function checkDoc(docId, token) {
  const url = `https://firestore.googleapis.com/v1/projects/sgh-merida/databases/(default)/documents/cargos_personal/${encodeURIComponent(docId)}`;
  const res = await fetch(url, {
    headers: { Authorization: 'Bearer ' + token }
  });
  if (res.status === 404) return { status: 404, exists: false };
  if (res.status === 200) {
    const data = await res.json();
    return { status: 200, exists: true, data };
  }
  return { status: res.status, error: await res.text() };
}

async function audit() {
  console.log('====================================================================');
  console.log('=== AUDITORÍA EN VIVO: POST-EJECUCIÓN BLOQUE 2 METROPOLITANO     ===');
  console.log('====================================================================\n');
  const token = await ensureFreshToken();

  const tests = [
    // 1. Caso Testigo Campo Elías: Jorge Alberto Alonso Navarrete (CI 22654384)
    { id: '22654384', expected: 'DELETED_404', desc: 'Clave legada asimétrica Jorge Alonso (Campo Elías)' },
    { id: 'OD00611406_22654384', expected: 'EXISTS_200', desc: 'Cargo canónico simétrico Jorge Alonso (OD00611406 - Campo Elías)' },

    // 2. Caso Testigo Sucre: Liliam María Gómez de García (CI 20435542)
    { id: '20435542', expected: 'DELETED_404', desc: 'Clave legada asimétrica Liliam Gómez (Sucre)' },
    { id: 'OD14731420_20435542', expected: 'EXISTS_200', desc: 'Cargo canónico simétrico Liliam Gómez (OD14731420 - Sucre)' },

    // 3. Caso Testigo Planta Central: Directora de Zona Maurian Zamudia (CI 9384726)
    // Debe permanecer intacta como SEDE ADMINISTRATIVA sin ser pisada ni afectada
    { id: '001200330_9384726', expected: 'EXISTS_200', desc: 'Cargo canónico Planta Central Directora de Zona (001200330)' }
  ];

  let exitosos = 0;
  for (const t of tests) {
    const r = await checkDoc(t.id, token);
    const cumple = (t.expected === 'DELETED_404' && r.status === 404) || (t.expected === 'EXISTS_200' && r.status === 200);
    if (cumple) exitosos++;

    console.log(`• Caso: ${t.desc}`);
    console.log(`  ID en Firestore: ${t.id}`);
    console.log(`  Estado: HTTP ${r.status} (${cumple ? '✓ VERIFICADO Y CONFORME' : '❌ NO CONFORME'})`);

    if (r.exists) {
      const f = r.data.fields || {};
      console.log(`  Metadatos canónicos:`);
      console.log(`    - Nombre: ${f['nombre-apellido']?.stringValue || f.NOMBRE?.stringValue}`);
      console.log(`    - Plantel / Sede: ${f.plantel?.stringValue}`);
      console.log(`    - Municipio: ${f.municipio?.stringValue}`);
      console.log(`    - Parroquia: ${f.parroquia?.stringValue}`);
      console.log(`    - Simetría homologada: ${f.simetria_homologada?.booleanValue}`);
      if (f.es_planta?.booleanValue) console.log(`    - Flag Institucional: Planta Central (es_planta = true)`);
    }
    console.log('--------------------------------------------------------------------');
  }

  console.log(`\nResultado Global: ${exitosos}/${tests.length} casos verificados exitosamente con la regla.`);
}

audit().catch(console.error);

