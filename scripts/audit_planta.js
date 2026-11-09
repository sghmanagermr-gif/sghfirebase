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

async function run() {
  console.log('--- AUDITORÍA EN VIVO POST-MIGRACIÓN PLANTA / ZONA ---');
  const token = await ensureFreshToken();

  // Test 1: Directora de Zona Educativa
  const r1 = await checkDoc('001200330_9384726', token);
  console.log('\n1. Directora de Zona (001200330_9384726): HTTP', r1.status);
  if (r1.exists) {
    const f = r1.data.fields;
    console.log('   Nombre:', f['nombre-apellido']?.stringValue);
    console.log('   Dependencia:', f.plantel?.stringValue);
    console.log('   Denominación:', f.denominacion?.stringValue);
    console.log('   Es Planta:', f.es_planta?.booleanValue);
  }

  // Test 2: Funcionario de Gestión Humana (001200339) para verificar nombre limpio y oficina
  // Busquemos uno de 001200339 en el excel
  const xlsx = require('xlsx');
  const wb = xlsx.readFile('nomina_acualizada/RAC_zona.xlsx');
  const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
  const rowGH = rows.find(r => r && String(r[4]).trim() === '001200339' && String(r[7]).includes('NOMINA'));
  if (rowGH) {
    const ciGH = String(rowGH[15]).trim().replace(/\D/g, '');
    const docKeyGH = `001200339_${ciGH}`;
    const r2 = await checkDoc(docKeyGH, token);
    console.log(`\n2. Funcionario de Nómina / Gestión Humana (${docKeyGH}): HTTP`, r2.status);
    if (r2.exists) {
      const f = r2.data.fields;
      console.log('   Nombre:', f['nombre-apellido']?.stringValue);
      console.log('   División Limpia:', f.plantel?.stringValue);
      console.log('   Oficina Extraída:', f.oficina?.stringValue);
      console.log('   Municipio:', f.municipio?.stringValue);
      console.log('   Parroquia:', f.parroquia?.stringValue);
    }
  }

  // Test 3: Verificar eliminación de clave legada suelta de la Directora (9384726)
  const r3 = await checkDoc('9384726', token);
  console.log('\n3. Clave legada suelta Directora (9384726): HTTP', r3.status, r3.status === 404 ? '(DELETED / ÉXITO)' : '');
}

run().catch(console.error);

