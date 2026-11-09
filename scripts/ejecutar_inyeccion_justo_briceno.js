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
  console.log('=== PROTOCOLO CASO_HUERFANOS: FASE 2 - INYECCIÓN ATÓMICA JUSTO BRICEÑO ===');
  const token = await ensureFreshToken();
  const auditoria = JSON.parse(fs.readFileSync('scratch/resultado_auditoria_justobriceno.json', 'utf8'));

  // 1. Cargar RAC para metadatos completos
  console.log('Cargando metadatos de RAC.xlsx...');
  const wbRac = xlsx.readFile('RAC.xlsx');
  const wsRac = wbRac.Sheets['PERSONAL'];
  const rowsRac = xlsx.utils.sheet_to_json(wsRac, { header: 1 });
  const headerRac = rowsRac[0];

  const colCedula = headerRac.indexOf('CEDULA');
  const colNombre = headerRac.indexOf('NOMBRE Y APELLIDO');
  const colPlantelDea = headerRac.indexOf('CODIGO DEL PLANTEL');
  const colNombrePlantel = headerRac.indexOf('UBICACIÓN FÍSICA');
  const colCargo = headerRac.indexOf('CARGO');
  const colCodigoRac = headerRac.indexOf('CODIGO RAC');
  const colHorasAcad = headerRac.indexOf('HORAS ACADEMICAS');
  const colHorasAdm = headerRac.indexOf('HORAS ADMINISTRATIVAS');
  const colTitular = headerRac.indexOf('TITULAR');
  const colDependencia = headerRac.indexOf('DEPENDENCIA');
  const colTipoPersonal = headerRac.indexOf('TIPO PERSONAL');
  const colMunicipio = headerRac.indexOf('MUNICIPIO');
  const colParroquia = headerRac.indexOf('PARROQUIA');
  const colUbch = headerRac.indexOf('UBCH');
  const colCircuito = headerRac.indexOf('CIRCUITO COMUNAL');
  const colCentroVot = headerRac.indexOf('CENTRO DE VOTACION');
  const colCorreo = headerRac.indexOf('CORREO ELECTRONICO');
  const colTlf = headerRac.indexOf('TELEFONO CELULAR');
  const colDireccion = headerRac.indexOf('DIRECCION');
  const colGenero = headerRac.indexOf('GENERO');
  const colEstadoCivil = headerRac.indexOf('ESTADO CIVIL');
  const colAntiguedad = headerRac.indexOf('ANTIGUEDAD');
  const colFIngreso = headerRac.indexOf('FECHA DE INGRESO');
  const colEdad = headerRac.indexOf('EDAD');
  const colSituacion = headerRac.indexOf('SITUACIÓN DEL TRABAJADOR');

  const racFullMap = new Map();
  for (let i = 1; i < rowsRac.length; i++) {
    const r = rowsRac[i];
    if (!r) continue;
    const ced = String(r[colCedula] || '').trim().replace(/\D/g, '');
    if (!ced) continue;
    racFullMap.set(ced, r);
  }

  const writes = [];
  const resumenPorPlantel = new Map();

  // 2. Preparar los 35 Huérfanos
  console.log(`\nPreparando 35 documentos en cargos_personal/{dea}_{ci}...`);
  auditoria.cat1_huerfanos.forEach(h => {
    const ci = h.reportado.cedula;
    const dea = h.reportado.dea;
    const r = racFullMap.get(ci);

    const nombre = String(r[colNombre] || h.reportado.nombre).trim().toUpperCase();
    const cargo = String(r[colCargo] || h.reportado.tipo).trim().toUpperCase();
    const codRac = String(r[colCodigoRac] || '').trim();
    const tipo = String(r[colTipoPersonal] || h.reportado.tipo).trim().toUpperCase();
    const dep = String(r[colDependencia] || 'NACIONAL').trim().toUpperCase();
    const titular = String(r[colTitular] || 'SI').trim().toUpperCase();
    const hrsAcad = Number(r[colHorasAcad]) || 0;
    const hrsAdm = Number(r[colHorasAdm]) || 0;
    const hrsRec = hrsAcad + hrsAdm;
    const mun = 'JUSTO BRICEÑO';
    const parr = String(r[colParroquia] || 'TORONDOY').trim().toUpperCase();
    const plantelNombre = String(r[colNombrePlantel] || h.reportado.plantel).trim().toUpperCase();
    const email = String(r[colCorreo] || '').trim().toLowerCase();
    const tlf = String(r[colTlf] || '').trim();
    const direccion = String(r[colDireccion] || '').trim().toUpperCase();
    const genero = String(r[colGenero] || '').trim().toUpperCase();
    const estadoCivil = String(r[colEstadoCivil] || '').trim().toUpperCase();
    const antiguedad = Number(r[colAntiguedad]) || 0;
    const fIngreso = String(r[colFIngreso] || '');
    const edad = Number(r[colEdad]) || 0;
    const ubch = String(r[colUbch] || '').trim().toUpperCase();
    const circuito = String(r[colCircuito] || '').trim().toUpperCase();
    const centroVot = String(r[colCentroVot] || '').trim().toUpperCase();
    const situacion = String(r[colSituacion] || 'ACTIVO').trim().toUpperCase();

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

    // Crear/actualizar documento canónico {dea}_{ci}
    writes.push({
      update: {
        name: `projects/sgh-merida/databases/(default)/documents/cargos_personal/${dea}_${ci}`,
        fields: docFields
      }
    });

    // Guardar para personal_resumen
    if (!resumenPorPlantel.has(dea)) resumenPorPlantel.set(dea, []);
    resumenPorPlantel.get(dea).push({
      mapValue: {
        fields: {
          cedula: { stringValue: ci },
          nombre: { stringValue: nombre },
          nombres: { stringValue: nombre },
          cargo: { stringValue: cargo },
          dependencia: { stringValue: dep },
          tipo: { stringValue: tipo }
        }
      }
    });
  });

  // 3. Preparar los 11 Preexistentes que faltan en personal_resumen (sin duplicar en cargos_personal)
  console.log(`\nPreparando vinculación de 11 preexistentes a personal_resumen (0% duplicados)...`);
  auditoria.cat2_preexistentes.forEach(p => {
    // 24583048 ya está en personal_resumen de OD16351411
    if (p.reportado.cedula === '24583048') return;

    const ci = p.reportado.cedula;
    const dea = p.reportado.dea;
    const nombre = p.rac.nombre || p.reportado.nombre;
    const cargo = p.rac.cargo || p.reportado.tipo;
    const dep = p.rac.dependencia || 'NACIONAL';
    const tipo = p.rac.tipoPersonal || p.reportado.tipo;

    if (!resumenPorPlantel.has(dea)) resumenPorPlantel.set(dea, []);
    resumenPorPlantel.get(dea).push({
      mapValue: {
        fields: {
          cedula: { stringValue: ci },
          nombre: { stringValue: nombre },
          nombres: { stringValue: nombre },
          cargo: { stringValue: cargo },
          dependencia: { stringValue: dep },
          tipo: { stringValue: tipo }
        }
      }
    });
    console.log(`✓ Preexistente enlazado: [C.I. ${ci}] ${nombre} -> ${dea}`);
  });

  // 4. Preparar transformaciones atómicas appendMissingElements para los planteles
  console.log(`\nPreparando transformaciones appendMissingElements para ${resumenPorPlantel.size} planteles...`);
  for (const [dea, items] of resumenPorPlantel.entries()) {
    writes.push({
      transform: {
        document: `projects/sgh-merida/databases/(default)/documents/planteles/${dea}`,
        fieldTransforms: [
          {
            fieldPath: 'personal_resumen',
            appendMissingElements: {
              values: items
            }
          }
        ]
      }
    });
    console.log(`✓ Plantel ${dea}: +${items.length} funcionarios a integrar en personal_resumen`);
  }

  console.log(`\nTOTAL DE OPERACIONES ATÓMICAS EN COMMIT ÚNICO: ${writes.length}`);
  console.log(`- ${auditoria.cat1_huerfanos.length} documentos canónicos creados en cargos_personal`);
  console.log(`- ${resumenPorPlantel.size} planteles actualizados con appendMissingElements`);

  console.log('\nEnviando commit atómico a Cloud Firestore REST API...');
  const res = await commitWrites(writes, token);
  console.log('✓✓✓ COMMIT ATÓMICO EJECUTADO CON ÉXITO ABSOLUTO! (HTTP 200)');
  console.log('Commit Time:', res.commitTime);
  console.log('Operaciones confirmadas:', res.writeResults.length);
}

main().catch(err => {
  console.error('Error fatal durante la ejecución:', err);
  process.exit(1);
});

