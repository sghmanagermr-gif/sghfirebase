const fs = require('fs');
const os = require('os');

async function ensureFreshToken() {
  const configPath = os.homedir() + '/.config/configstore/firebase-tools.json';
  const c = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const now = Date.now();
  if (!c.tokens.expires_at || c.tokens.expires_at <= now + 60000) {
    const clientId = "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com";
    const clientSecret = "j9iVZfS8kkCEFUPaAeJV0sAi";
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

async function commitWrites(writes, token) {
  const url = 'https://firestore.googleapis.com/v1/projects/sgh-merida/databases/(default)/documents:commit';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ writes })
  });
  const data = await res.json();
  if (res.status !== 200) {
    console.error('Commit error:', JSON.stringify(data, null, 2));
    throw new Error(`Commit failed with status ${res.status}`);
  }
  return data;
}

async function main() {
  console.log('--- REMOVIENDO PLANTEL DE EXCEPCIONES EN configuracion/despliegue ---');
  const token = await ensureFreshToken();

  const writes = [
    {
      transform: {
        document: 'projects/sgh-merida/databases/(default)/documents/configuracion/despliegue',
        fieldTransforms: [
          {
            fieldPath: 'excepciones',
            removeAllFromArray: {
              values: [
                { stringValue: 'OD12251410' },
                { stringValue: 'OD16341410' }
              ]
            }
          }
        ]
      }
    }
  ];

  console.log('Enviando commit atómico para revertir excepciones...');
  const res = await commitWrites(writes, token);
  console.log('✓ Excepciones removidas exitosamente. Status 200');
  console.log('Commit Time:', res.commitTime);
}

main().catch(console.error);

