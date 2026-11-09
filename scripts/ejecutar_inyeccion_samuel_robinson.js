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
  console.log('=== PROTOCOLO CASO_HUERFANOS: INYECCIÓN OD04391414 (UEB SAMUEL ROBINSON) ===');
  const token = await ensureFreshToken();

  const dea = 'OD04391414';
  const targetCis = ['19319516', '19383373', '19503305', '19865117', '19996685'];

  // Cargar datos de RAC
  const wbRac = xlsx.readFile('RAC.xlsx');
  const wsRac = wbRac.Sheets[wbRac.SheetNames[0]];
  const racRows = xlsx.utils.sheet_to_json(wsRac);

  const writes = [];
  const appendValues = [];

  for (const ci of targetCis) {
    const row = racRows.find(r => String(r['CEDULA'] || '').trim().replace(/[^0-9]/g, '') === ci);
    if (!row) {
      throw new Error(`No se encontró en RAC la cédula ${ci}`);
    }

    const nombre = String(row['NOMBRE Y APELLIDO'] || '').trim().toUpperCase();
    const cargo = String(row['CARGO'] || 'DOCENTE').trim().toUpperCase();
    const codRac = String(row['CODIGO RAC'] || '').trim();
    const tipo = String(row['TIPO PERSONAL'] || 'DOCENTE').trim().toUpperCase();
    const dep = String(row['DEPENDENCIA'] || 'NACIONAL').trim().toUpperCase();
    const titular = String(row['TITULAR'] || 'SI').trim().toUpperCase();
    const hrsAcad = Number(row['HORAS ACADEMICAS']) || 0;
    const hrsAdm = Number(row['HORAS ADMINISTRATIVAS']) || 0;
    const hrsRec = hrsAcad + hrsAdm;
    const mun = 'OBISPO RAMOS DE LORA';
    const parr = 'SANTA ELENA DE ARENALES';
    const plantelNombre = 'SAMUEL ROBINSON';
    const email = String(row['CORREO ELECTRONICO'] || '').trim().toLowerCase();
    const tlf = String(row['TELEFONO CELULAR'] || '').trim();
    const direccion = String(row['DIRECCION'] || '').trim().toUpperCase();
    const genero = String(row['GENERO'] || '').trim().toUpperCase();
    const estadoCivil = String(row['ESTADO CIVIL'] || '').trim().toUpperCase();
    const antiguedad = Number(row['ANTIGUEDAD']) || 0;
    const fIngreso = String(row['FECHA DE INGRESO'] || '');
    const edad = Number(row['EDAD']) || 0;
    const ubch = String(row['UBCH'] || '').trim().toUpperCase();
    const circuito = String(row['CIRCUITO COMUNAL'] || '').trim().toUpperCase();
    const centroVot = String(row['CENTRO DE VOTACION'] || '').trim().toUpperCase();
    const situacion = String(row['SITUACIÓN DEL TRABAJADOR'] || 'ACTIVO').trim().toUpperCase();

    const docFields = {
      cedula: { stringValue: ci },
      'cedula-identidad': { stringValue: ci },
      CEDULA: { integerValue: Number(ci) },
      nacionalidad: { stringValue: 'V' },
      'nombre-apellido': { stringValue: nombre },
      'apellidos-nombres': { stringValue: nombre },
      NOMBRE: { stringValue: nombre },
      'codigo-plantel': { stringValue: dea },
      codigoDEA: { stringValue: dea },
      'CODIGO DEL PLANTEL': { stringValue: dea },
      'ubicacion-fisica': { stringValue: plantelNombre },
      plantel: { stringValue: plantelNombre },
      'UBICACIÓN FÍSICA': { stringValue: plantelNombre },
      municipio: { stringValue: mun },
      parroquia: { stringValue: parr },
      MUNICIPIO: { stringValue: mun },
      PARROQUIA: { stringValue: parr },
      estado: { stringValue: 'MÉRIDA' },
      ESTADO: { stringValue: 'MERIDA' },
      cargo: { stringValue: cargo },
      CARGO: { stringValue: cargo },
      'codigo-rac': { stringValue: codRac },
      'CODIGO RAC': { stringValue: codRac },
      'tipo-personal': { stringValue: tipo },
      'TIPO PERSONAL': { stringValue: tipo },
      dependencia: { stringValue: dep },
      DEPENDENCIA: { stringValue: dep },
      titular: { stringValue: titular },
      TITULAR: { stringValue: titular },
      'horas-academicas': { integerValue: hrsAcad },
      'HORAS ACADEMICAS': { integerValue: hrsAcad },
      'horas-administrativas': { integerValue: hrsAdm },
      'HORAS ADMINISTRATIVAS': { integerValue: hrsAdm },
      'horas-recibo': { integerValue: hrsRec },
      'HORAS DE RECIBO': { integerValue: hrsRec },
      'situacion-laboral': { stringValue: situacion },
      'SITUACIÓN DEL TRABAJADOR': { stringValue: situacion },
      correo: { stringValue: email },
      'CORREO ELECTRONICO': { stringValue: email },
      'tel-celular': { stringValue: tlf },
      'TELEFONO CELULAR': { stringValue: tlf },
      direccion: { stringValue: direccion },
      DIRECCION: { stringValue: direccion },
      genero: { stringValue: genero },
      GENERO: { stringValue: genero },
      'estado-civil': { stringValue: estadoCivil },
      'ESTADO CIVIL': { stringValue: estadoCivil },
      antiguedad: { integerValue: antiguedad },
      ANTIGUEDAD: { integerValue: antiguedad },
      'fecha-ingreso': { stringValue: fIngreso },
      'FECHA DE INGRESO': { stringValue: fIngreso },
      edad: { integerValue: edad },
      EDAD: { integerValue: edad },
      ubch: { stringValue: ubch },
      UBCH: { stringValue: ubch },
      'circuito-comunal': { stringValue: circuito },
      'CIRCUITO COMUNAL': { stringValue: circuito },
      'centro-votacion': { stringValue: centroVot },
      'CENTRO DE VOTACION': { stringValue: centroVot },
      fecha_actualizacion: { stringValue: new Date().toISOString() }
    };

    // 1. Crear documento canónico compuesto {dea}_{ci}
    writes.push({
      update: {
        name: `projects/sgh-merida/databases/(default)/documents/cargos_personal/${dea}_${ci}`,
        fields: docFields
      }
    });

    // 2. Preparar elemento para appendMissingElements
    appendValues.push({
      mapValue: {
        fields: {
          cedula: { stringValue: ci },
          nombres: { stringValue: nombre },
          cargo: { stringValue: cargo },
          dependencia: { stringValue: dep },
          tipo: { stringValue: tipo }
        }
      }
    });

    console.log(`✓ Preparado [C.I. ${ci}] ${nombre} (${cargo})`);
  }

  // 3. Transformación atómica en planteles/OD04391414
  writes.push({
    transform: {
      document: `projects/sgh-merida/databases/(default)/documents/planteles/${dea}`,
      fieldTransforms: [
        {
          fieldPath: 'personal_resumen',
          appendMissingElements: {
            values: appendValues
          }
        },
        {
          fieldPath: 'total_personal',
          increment: { integerValue: targetCis.length }
        }
      ]
    }
  });

  console.log(`\nTotal operaciones preparadas en lote atómico: ${writes.length}`);
  console.log(`- 5 documentos nuevos creados en cargos_personal/${dea}_{ci}`);
  console.log(`- 1 transformación appendMissingElements e increment en planteles/${dea}`);

  console.log('\nEnviando commit atómico a Cloud Firestore REST API...');
  const res = await commitWrites(writes, token);
  console.log('✓ COMMIT EJECUTADO EXITOSAMENTE CON RESPUESTA HTTP 200!');
  console.log('Commit Time:', res.commitTime);
  console.log('Write Results:', res.writeResults.length);
}

main().catch(err => {
  console.error('Error durante la ejecución atómica:', err);
  process.exit(1);
});

