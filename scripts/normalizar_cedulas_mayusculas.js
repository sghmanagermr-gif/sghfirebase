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

const sleep = ms => new Promise(res => setTimeout(res, ms));

async function run() {
  console.log('========================================================================');
  console.log('=== SCRIPT DE SANEAMIENTO MASIVO: NORMALIZACIÓN DE CÉDULAS A MINÚSCULAS ===');
  console.log('========================================================================\n');

  let token = await ensureFreshToken();
  const commitUrl = 'https://firestore.googleapis.com/v1/projects/sgh-merida/databases/(default)/documents:commit';
  const baseUrl = 'https://firestore.googleapis.com/v1/projects/sgh-merida/databases/(default)/documents/cargos_personal';

  let pageToken = '';
  let totalEscaneados = 0;
  let totalModificados = 0;
  let pageNum = 1;

  do {
    token = await ensureFreshToken();
    const url = `${baseUrl}?pageSize=300${pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : ''}`;
    
    let res;
    try {
      res = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
    } catch (e) {
      console.error('Error de red al consultar página:', e.message);
      await sleep(3000);
      continue;
    }

    if (res.status === 429) {
      console.warn('⚠️ Cuota diaria de lecturas de Firestore Spark alcanzada (429 RESOURCE_EXHAUSTED).');
      console.warn('El script debe reanudarse al reinicio de la cuota (04:00 AM) o con Plan Blaze.');
      break;
    }

    if (res.status !== 200) {
      console.error('Error en consulta de documentos:', res.status, await res.text());
      break;
    }

    const data = await res.json();
    const docs = data.documents || [];
    totalEscaneados += docs.length;

    const writes = [];

    for (const doc of docs) {
      const f = doc.fields || {};
      const docId = doc.name.split('/').pop();

      const tieneCedulaMin = !!f.cedula?.stringValue;
      const tieneCedulaCaps = f.CEDULA !== undefined;
      const ciFromDocId = docId.includes('_') ? docId.split('_')[1] : docId;

      // Si falta cedula en minúsculas
      if (!tieneCedulaMin) {
        let ciValor = '';
        if (tieneCedulaCaps) {
          ciValor = String(f.CEDULA.integerValue || f.CEDULA.stringValue || '').trim();
        }
        if (!ciValor && /^\d+$/.test(ciFromDocId)) {
          ciValor = ciFromDocId;
        }

        if (ciValor) {
          const fieldsToPatch = {
            'cedula': { stringValue: ciValor },
            'cedula-identidad': { stringValue: ciValor }
          };

          const dea = f['codigo-plantel']?.stringValue || f['codigoDEA']?.stringValue || f['codigoPlantel']?.stringValue || f['CODIGO DEL PLANTEL']?.stringValue || f['CODIGO']?.stringValue;
          if (dea) {
            fieldsToPatch['codigo-plantel'] = { stringValue: dea };
            fieldsToPatch['codigoDEA'] = { stringValue: dea };
            fieldsToPatch['codigoPlantel'] = { stringValue: dea };
          }

          const fieldPaths = Object.keys(fieldsToPatch).map(k => k.includes('-') ? `\`${k}\`` : k);

          writes.push({
            update: {
              name: doc.name,
              fields: fieldsToPatch
            },
            updateMask: {
              fieldPaths: fieldPaths
            }
          });
        }
      }
    }

    if (writes.length > 0) {
      totalModificados += writes.length;
      console.log(`Página ${pageNum}: ${writes.length} registros identificados para normalizar. Enviando commit...`);
      
      const commitRes = await fetch(commitUrl, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ writes })
      });

      if (commitRes.status === 200) {
        console.log(`✓ Commit de página ${pageNum} exitoso (${writes.length} docs actualizados).`);
      } else {
        console.error(`Error en commit página ${pageNum}:`, await commitRes.text());
      }
    } else {
      console.log(`Página ${pageNum}: 300 documentos escaneados, 0 requirieron cambio.`);
    }

    pageToken = data.nextPageToken || '';
    pageNum++;
    await sleep(250); // Pausa preventiva anti-flood
  } while (pageToken);

  console.log('\n========================================================================');
  console.log(`Resumen de Saneamiento:`);
  console.log(`- Total documentos escaneados: ${totalEscaneados}`);
  console.log(`- Total documentos normalizados a minúsculas: ${totalModificados}`);
  console.log('========================================================================');
}

run().catch(console.error);

