import fs from 'fs';
import path from 'path';
import os from 'os';

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

function convertVal(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'number') {
    if (Number.isInteger(v)) return { integerValue: String(v) };
    return { doubleValue: v };
  }
  if (typeof v === 'boolean') return { booleanValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(convertVal) } };
  if (typeof v === 'object') {
    const fields = {};
    for (const [k, val] of Object.entries(v)) {
      fields[k] = convertVal(val);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(v) };
}

async function updateFullOD03621407() {
  const token = await ensureFreshToken();
  const dea = 'OD03621407';

  const patchObj = {
    'nombre-plantel': {
      nominal: 'ESCUELA ESTADAL EL RINCON',
      'nuevo-eponimo': 'RICARDO RAMIREZ MORENO',
      nuevo_eponimo: 'RICARDO RAMIREZ MORENO'
    },
    nombre_plantel: 'ESCUELA ESTADAL EL RINCON',
    nuevo_eponimo: 'RICARDO RAMIREZ MORENO',
    denominacion: 'ESCUELA',
    den_abr: 'E',
    dependencia: 'ESTADAL',
    municipio: 'CARACCIOLO PARRA',
    parroquia: 'TUCANI',
    estado: 'MÉRIDA',
    nivel: 'INICIAL - PRIMARIA',
    codigo_estadistico: '141590',
    codigo_plantel: 'OD03621407',
    codigoDEA: 'OD03621407',
    codigos: {
      plantel: 'OD03621407',
      estadistico: 141590,
      dependencia: ''
    },
    'planes-estudio': {
      '20000': { codigo: 20000, especialidad: 'INICIAL' },
      '21000': { codigo: 21000 }
    },
    datos_completados: true,
    ultima_actualizacion: new Date().toISOString()
  };

  const fieldPaths = Object.keys(patchObj).map(k => {
    const safeKey = k.includes('-') ? '`' + k + '`' : k;
    return 'updateMask.fieldPaths=' + encodeURIComponent(safeKey);
  }).join('&');
  const url = `https://firestore.googleapis.com/v1/projects/sgh-merida/databases/(default)/documents/planteles/${dea}?${fieldPaths}`;

  const fields = {};
  for (const [k, v] of Object.entries(patchObj)) {
    fields[k] = convertVal(v);
  }

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      console.log(`Intento ${attempt}...`);
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields })
      });

      console.log('PATCH Status:', res.status);
      const data = await res.json();
      if (res.status === 200) {
        console.log('✓ Firestore actualizado exitosamente con la ficha institucional de OD03621407!');
        return;
      } else {
        console.error('Error:', data);
        return;
      }
    } catch (e) {
      console.warn(`Intento ${attempt} falló con: ${e.message}`);
      if (attempt === 5) throw e;
      await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }
}

updateFullOD03621407();
