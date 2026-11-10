const fs = require('fs');
const path = require('path');
const os = require('os');
const xlsx = require('xlsx');

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

async function run() {
  console.log('=== REGISTRANDO LAS 9 SEDES ADMINISTRATIVAS DE ZONA EN PLANTELES ===');
  
  const wb = xlsx.readFile('nomina_acualizada/RAC_zona.xlsx');
  const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });

  const sedesMap = new Map();

  for (let i = 2; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[4]) continue;

    const codDep = String(r[4]).trim();
    const rawNombre = String(r[7] || '').trim();
    const ci = String(r[15] || '').trim().replace(/\D/g, '');
    const nomPersona = String(r[16] || '').trim().toUpperCase();
    const cargo = String(r[13] || '').trim().toUpperCase();
    const codRac = String(r[12] || '').trim();
    const tipoPersonal = String(r[14] || 'ADMINISTRATIVO').trim().toUpperCase();

    let nombreLimpio = rawNombre;
    let oficina = '';
    const match = rawNombre.match(/\((.*?)\)/);
    if (match) {
      oficina = match[1].trim().toUpperCase();
      nombreLimpio = rawNombre.replace(/\(.*?\)/, '').trim().toUpperCase();
    }
    if (codDep === '001200339') {
      nombreLimpio = 'DIVISIÓN DE GESTIÓN HUMANA';
    }

    if (!sedesMap.has(codDep)) {
      sedesMap.set(codDep, {
        codigo: codDep,
        nombre: nombreLimpio,
        personal: []
      });
    }

    if (ci) {
      sedesMap.get(codDep).personal.push({
        cedula: ci,
        nombre: nomPersona,
        cargo,
        tipo_personal: tipoPersonal,
        cod_rac: codRac,
        oficina
      });
    }
  }

  console.log(`✓ Total Sedes detectadas: ${sedesMap.size}`);

  const token = await ensureFreshToken();
  const writes = [];

  for (const [codDep, sede] of sedesMap.entries()) {
    console.log(`• Sede ${codDep}: ${sede.nombre} (${sede.personal.length} funcionarios)`);
    
    const docPath = `projects/sgh-merida/databases/(default)/documents/planteles/${codDep}`;
    
    // Convertir personal_resumen a formato Firestore
    const personalValues = sede.personal.map(p => ({
      mapValue: {
        fields: {
          cedula: { stringValue: p.cedula },
          nombre: { stringValue: p.nombre },
          cargo: { stringValue: p.cargo },
          tipo_personal: { stringValue: p.tipo_personal },
          cod_rac: { stringValue: p.cod_rac },
          oficina: { stringValue: p.oficina }
        }
      }
    }));

    const fields = {
      codigoDEA: { stringValue: codDep },
      codigoPlantel: { stringValue: codDep },
      'codigo-plantel': { stringValue: codDep },
      nombre_plantel: { stringValue: sede.nombre },
      'nombre-plantel': {
        mapValue: {
          fields: {
            nominal: { stringValue: sede.nombre },
            eponimo: { stringValue: sede.nombre }
          }
        }
      },
      denominacion: { stringValue: 'SEDE ADMINISTRATIVA' },
      dependencia: { stringValue: 'NACIONAL' },
      municipio: { stringValue: 'LIBERTADOR' },
      MUNICIPIO: { stringValue: 'LIBERTADOR' },
      parroquia: { stringValue: 'SAGRARIO' },
      PARROQUIA: { stringValue: 'SAGRARIO' },
      estado: { stringValue: 'MÉRIDA' },
      es_planta: { booleanValue: true },
      es_sede_administrativa: { booleanValue: true },
      total_personal: { integerValue: String(sede.personal.length) },
      personal_resumen: {
        arrayValue: {
          values: personalValues
        }
      },
      matricula: {
        mapValue: {
          fields: {
            'total-gen': { integerValue: '0' }
          }
        }
      },
      fecha_registro: { stringValue: new Date().toISOString() },
      ultima_actualizacion: { stringValue: new Date().toISOString() }
    };

    writes.push({
      update: {
        name: docPath,
        fields
      }
    });
  }

  console.log(`\nEnviando commit de ${writes.length} documentos a /planteles en Cloud Firestore...`);
  const url = 'https://firestore.googleapis.com/v1/projects/sgh-merida/databases/(default)/documents:commit';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ writes })
  });

  const resData = await res.json();
  if (res.status === 200) {
    console.log('✓ ¡Las 9 sedes de planta fueron creadas exitosamente en /planteles! (HTTP 200)');
  } else {
    console.error('Error al registrar sedes:', res.status, resData);
  }
}

run().catch(console.error);

