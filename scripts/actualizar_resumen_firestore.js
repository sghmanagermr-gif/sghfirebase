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

function convertToFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (typeof val === 'boolean') return { booleanValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(convertToFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = convertToFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

async function updateFirestoreResumen() {
  console.log('--- Sincronizando resumen_estadisticas en Firestore (estadisticas/resumen_global) ---');
  let token = await ensureFreshToken();
  const resumen = JSON.parse(fs.readFileSync('webapp/public/resumen_estadisticas.json', 'utf8'));

  const bodyData = JSON.stringify({ fields: convertToFirestoreValue(resumen).mapValue.fields });
  const url = 'https://firestore.googleapis.com/v1/projects/sgh-merida/databases/(default)/documents/estadisticas/resumen_global';

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      token = await ensureFreshToken();
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: bodyData
      });

      console.log(`Intento ${attempt}: Status ${res.status}`);
      if (res.status === 200) {
        console.log('✓ estadisticas/resumen_global actualizado exitosamente en Firestore!');
        return;
      }
      const err = await res.json();
      console.error('Error al actualizar Firestore:', err);
    } catch (e) {
      console.warn(`Intento ${attempt} falló con error de red: ${e.message}`);
      if (attempt === 4) throw e;
      await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }
}

updateFirestoreResumen().catch(err => {
  console.error('Error fatal al sincronizar Firestore:', err);
  process.exit(1);
});
