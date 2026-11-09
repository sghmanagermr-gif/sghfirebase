const fs = require('fs');
const os = require('os');
const xlsx = require('xlsx');

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
  console.log('--- ASEGURANDO PLANTELES OD12251410 Y OD16341410 EN COLECCION planteles/ ---');
  const token = await ensureFreshToken();

  const wbNomina = xlsx.readFile('nomina_acualizada/Nomina_Personal_Consolidado_Estadal_MERIDA_2026-11-07.xlsx');
  const wsNomina = wbNomina.Sheets[wbNomina.SheetNames[0]];
  const nominaRows = xlsx.utils.sheet_to_json(wsNomina);

  const wbPlanteles = xlsx.readFile('nomina_acualizada/PlantelesMerida.xlsx');
  const wsPlanteles = wbPlanteles.Sheets[wbPlanteles.SheetNames[0]];
  const plantelesData = xlsx.utils.sheet_to_json(wsPlanteles);

  const targets = ['OD12251410', 'OD16341410'];
  const writes = [];

  for (const dea of targets) {
    const pInfo = plantelesData.find(r => String(r['CÓDIGO PLANTEL (EJ OD12345678)'] || '').trim().toUpperCase() === dea);
    const staffRows = nominaRows.filter(r => String(r['Código Plantel (DEA)'] || '').trim().toUpperCase() === dea);

    const nombreNominal = pInfo ? (pInfo['NOMBRE DEL PLANTEL COMO APARECE EN EL RECIBO DE PAGO'] || '') : '';
    const nuevoEponimo = pInfo ? (pInfo['NOMBRE DEL NUEVO EPÓNIMO'] || nombreNominal) : nombreNominal;
    const denominacion = pInfo ? (pInfo['DENOMINACION'] || 'ESCUELA') : 'ESCUELA';
    const mun = pInfo ? (pInfo['MUNICIPIOS'] || 'JULIO CESAR') : 'JULIO CESAR';
    const parr = pInfo ? (pInfo['PARROQUIA (AL QUE PERTENECE EL PLANTEL)'] || 'ARAPUEY') : 'ARAPUEY';
    const dep = pInfo ? (pInfo['DEPENDENCIA SI ES NACIONAL O ESTADAL'] || 'ESTADAL') : 'ESTADAL';
    const codEst = pInfo ? Number(pInfo['CÓDIGO ESTADÍSTICO (EL QUE SE USA PARA LA MATRÍCULA)']) || 0 : 0;

    const staffResumen = staffRows.map(r => ({
      mapValue: {
        fields: {
          cedula: { stringValue: String(r['Cédula'] || '').trim().replace(/[^0-9]/g, '') },
          nombres: { stringValue: String(r['Apellidos y Nombres'] || '').trim().toUpperCase() },
          cargo: { stringValue: String(r['Cargo'] || 'DOCENTE').trim().toUpperCase() },
          dependencia: { stringValue: String(r['Dependencia'] || 'ESTADAL').trim().toUpperCase() },
          tipo: { stringValue: String(r['Tipo de Personal'] || 'DOCENTE').trim().toUpperCase() }
        }
      }
    }));

    writes.push({
      update: {
        name: `projects/sgh-merida/databases/(default)/documents/planteles/${dea}`,
        fields: {
          codigoDEA: { stringValue: dea },
          codigos: {
            mapValue: {
              fields: {
                plantel: { stringValue: dea },
                estadistico: { integerValue: codEst },
                dependencia: { stringValue: '' }
              }
            }
          },
          denominacion: { stringValue: denominacion },
          'nombre-plantel': {
            mapValue: {
              fields: {
                nominal: { stringValue: nombreNominal },
                nuevo_eponimo: { stringValue: nuevoEponimo }
              }
            }
          },
          municipio: { stringValue: mun },
          parroquia: { stringValue: parr },
          dependencia: { stringValue: dep },
          estado: { stringValue: 'MÉRIDA' },
          personal_resumen: {
            arrayValue: {
              values: staffResumen
            }
          },
          total_personal: { integerValue: staffResumen.length },
          fecha_actualizacion: { stringValue: new Date().toISOString() }
        }
      }
    });

    console.log(`✓ Preparado ${dea} (${nuevoEponimo}) con ${staffResumen.length} funcionarios`);
  }

  console.log('Enviando commit atómico a Firestore...');
  const res = await commitWrites(writes, token);
  console.log('✓ Commit ejecutado exitosamente! Status 200');
  console.log('Commit Time:', res.commitTime);
}

main().catch(console.error);

