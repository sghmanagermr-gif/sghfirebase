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
  console.log('=== PROTOCOLO CASO_HUERFANOS: EJECUCIÓN ATÓMICA YULENY BERNAL (C.I. 19529390) ===');
  const token = await ensureFreshToken();

  const dea = 'S2855D1410';
  const ci = '19529390';
  const nombre = 'YULENY DEL CARMEN BERNAL RANGEL';
  const cargo = 'BACHILLER II';
  const codRac = '110000';
  const tipo = 'ADMINISTRATIVO';
  const dep = 'NACIONAL';
  const horas = 37;

  const fullFields = {
    cedula: { stringValue: ci },
    'cedula-identidad': { stringValue: ci },
    CEDULA: { integerValue: 19529390 },
    nacionalidad: { stringValue: 'V' },
    'nombre-apellido': { stringValue: nombre },
    'apellidos-nombres': { stringValue: nombre },
    NOMBRE: { stringValue: nombre },
    'codigo-plantel': { stringValue: dea },
    codigoDEA: { stringValue: dea },
    'CODIGO DEL PLANTEL': { stringValue: dea },
    'ubicacion-fisica': { stringValue: 'COMPLEJO EDUCATIVO OMAR GREGORIO RIVAS' },
    plantel: { stringValue: 'COMPLEJO EDUCATIVO OMAR GREGORIO RIVAS' },
    'UBICACIÓN FÍSICA': { stringValue: 'E B-PALMIRA' },
    municipio: { stringValue: 'JULIO CESAR' },
    parroquia: { stringValue: 'PALMIRA' },
    MUNICIPIO: { stringValue: 'JULIO CESAR' },
    PARROQUIA: { stringValue: 'PALMIRA' },
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
    titular: { stringValue: 'SI' },
    TITULAR: { stringValue: 'SI' },
    'horas-administrativas': { integerValue: horas },
    'HORAS ADMINISTRATIVAS': { integerValue: horas },
    'horas-academicas': { integerValue: 0 },
    'HORAS ACADEMICAS': { integerValue: 0 },
    'horas-recibo': { integerValue: horas },
    'HORAS DE RECIBO': { integerValue: horas },
    'situacion-laboral': { stringValue: 'ACTIVO' },
    'SITUACIÓN DEL TRABAJADOR': { stringValue: 'ACTIVO' },
    correo: { stringValue: 'nyleyu1807@gmail.com' },
    'CORREO ELECTRONICO': { stringValue: 'nyleyu1807@gmail.com' },
    'tel-celular': { stringValue: '04264053542' },
    'TELEFONO CELULAR': { stringValue: '04264053542' },
    direccion: { stringValue: 'SAN JOSE DE PALMIRA SECTOR BARRIO NUEVO' },
    DIRECCION: { stringValue: 'SAN JOSE DE PALMIRA SECTOR BARRIO NUEVO' },
    genero: { stringValue: 'FEMENINO' },
    GENERO: { stringValue: 'FEMENINO' },
    'estado-civil': { stringValue: 'SOLTERO(A)' },
    'ESTADO CIVIL': { stringValue: 'SOLTERO(A)' },
    antiguedad: { integerValue: 8 },
    ANTIGUEDAD: { integerValue: 8 },
    'fecha-ingreso': { stringValue: '2017-12-16' },
    'FECHA DE INGRESO': { stringValue: '2017-12-16' },
    'fecha-nacimiento': { stringValue: '1989-07-18' },
    'FECHA DE NACIMIENTO': { stringValue: '1989-07-18' },
    edad: { integerValue: 37 },
    EDAD: { integerValue: 37 },
    ubch: { stringValue: 'PALMIRA B' },
    UBCH: { stringValue: 'PALMIRA B' },
    'circuito-comunal': { stringValue: 'AGRICOLA SAN JOSE DE PALMIRA' },
    'CIRCUITO COMUNAL': { stringValue: 'AGRICOLA SAN JOSE DE PALMIRA' },
    'centro-votacion': { stringValue: 'E-B-PALMIRA' },
    'CENTRO DE VOTACION': { stringValue: 'E-B-PALMIRA' },
    fecha_actualizacion: { stringValue: new Date().toISOString() }
  };

  const writes = [];

  // 1. Actualizar el documento preexistente directo por C.I.
  writes.push({
    update: {
      name: `projects/sgh-merida/databases/(default)/documents/cargos_personal/${ci}`,
      fields: fullFields
    }
  });

  // 2. Crear/actualizar bajo la clave canónica compuesta {dea}_{ci}
  writes.push({
    update: {
      name: `projects/sgh-merida/databases/(default)/documents/cargos_personal/${dea}_${ci}`,
      fields: fullFields
    }
  });

  // 3. Transformación atómica en planteles/S2855D1410 (appendMissingElements e increment)
  writes.push({
    transform: {
      document: `projects/sgh-merida/databases/(default)/documents/planteles/${dea}`,
      fieldTransforms: [
        {
          fieldPath: 'personal_resumen',
          appendMissingElements: {
            values: [
              {
                mapValue: {
                  fields: {
                    cedula: { stringValue: ci },
                    nombres: { stringValue: nombre },
                    cargo: { stringValue: cargo },
                    dependencia: { stringValue: dep },
                    tipo: { stringValue: tipo }
                  }
                }
              }
            ]
          }
        },
        {
          fieldPath: 'total_personal',
          increment: { integerValue: 1 }
        }
      ]
    }
  });

  console.log(`Operaciones preparadas en lote atómico: ${writes.length}`);
  console.log('1. cargos_personal/19529390 (Actualización de vínculo)');
  console.log('2. cargos_personal/S2855D1410_19529390 (Clave canónica institucional)');
  console.log('3. planteles/S2855D1410 (appendMissingElements en personal_resumen)');

  console.log('\nEnviando commit a Cloud Firestore REST API...');
  const res = await commitWrites(writes, token);
  console.log('✓ COMMIT EJECUTADO EXITOSAMENTE CON RESPUESTA HTTP 200!');
  console.log('Commit Time:', res.commitTime);
  console.log('Write Results:', res.writeResults.length);
}

main().catch(err => {
  console.error('Error durante la ejecución atómica:', err);
  process.exit(1);
});

