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
  console.log('--- INICIANDO AUDITORÍA EN VIVO POST-BLOQUE 1 ---');
  const token = await ensureFreshToken();

  // Caso testigo Yoneida Guerra (CI 15142594 - Pluriempleo en Arapuey y San Cristóbal de Torondoy)
  const tests = [
    { id: '15142594', expected: 'DELETED_404', desc: 'Clave legada asimétrica de Yoneida Guerra' },
    { id: 'OD12261410_15142594', expected: 'EXISTS_200', desc: 'Cargo 1 simétrico de Yoneida Guerra (OD12261410)' },
    { id: 'S3379N1410_15142594', expected: 'EXISTS_200', desc: 'Cargo 2 simétrico de Yoneida Guerra (S3379N1410)' }
  ];

  for (const t of tests) {
    const r = await checkDoc(t.id, token);
    console.log(`\n• Verificando: ${t.id} (${t.desc})`);
    console.log(`  Resultado: HTTP ${r.status} -> ${r.exists ? 'DOCUMENTO EXISTE' : 'DOCUMENTO NO EXISTE (DELETED)'}`);
    if (r.exists) {
      const f = r.data.fields || {};
      console.log(`  Campos simétricos inyectados:`);
      console.log(`    - Plantel: ${f.plantel?.stringValue}`);
      console.log(`    - Ubicación Física: ${f['ubicacion-fisica']?.stringValue}`);
      console.log(`    - Municipio: ${f.municipio?.stringValue}`);
      console.log(`    - Parroquia: ${f.parroquia?.stringValue}`);
      console.log(`    - Simetría homologada: ${f.simetria_homologada?.booleanValue}`);
    }
  }
}

audit().catch(console.error);

