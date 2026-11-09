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

async function commitWritesWithRetry(writes, token, retries = 3) {
  const url = 'https://firestore.googleapis.com/v1/projects/sgh-merida/databases/(default)/documents:commit';
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ writes })
      });
      const data = await res.json();
      if (res.status === 200) {
        return data;
      }
      console.error(`Attempt ${attempt} failed with status ${res.status}:`, JSON.stringify(data).substring(0, 200));
      if (attempt === retries) {
        throw new Error(`Commit failed with status ${res.status}: ${JSON.stringify(data)}`);
      }
    } catch (err) {
      console.warn(`Attempt ${attempt} network error: ${err.message}`);
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }
}

async function main() {
  console.log('================================================================');
  console.log('=== PROTOCOLO CASO_HUERFANOS: CARGA MASIVA GLOBAL RAC (1.893) ===');
  console.log('================================================================\n');

  let token = await ensureFreshToken();

  // 1. Cargar metadatos completos de RAC.xlsx
  console.log('Cargando metadatos completos de RAC.xlsx (30.324 registros)...');
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

  // Mapa rápido de RAC por clave dea_cedula y cedula
  const racFullMapByDeaCi = new Map();
  const racFullMapByCi = new Map();

  for (let i = 1; i < rowsRac.length; i++) {
    const r = rowsRac[i];
    if (!r) continue;
    const ced = String(r[colCedula] || '').trim().replace(/\D/g, '');
    let dea = String(r[colPlantelDea] || '').trim().toUpperCase();
    if (dea.startsWith('0D')) dea = 'OD' + dea.substring(2);
    if (!ced) continue;

    const key = `${dea}_${ced}`;
    racFullMapByDeaCi.set(key, r);
    if (!racFullMapByCi.has(ced)) racFullMapByCi.set(ced, r);
  }
  console.log(`✓ Mapeados ${racFullMapByDeaCi.size} registros únicos DEA_CI de RAC.`);

  // 2. Cargar el resumen de huérfanos previamente auditado
  console.log('\nCargando dataset auditado de huérfanos (scratch/resumen_global_huerfanos_rac.json)...');
  const resumen = JSON.parse(fs.readFileSync('scratch/resumen_global_huerfanos_rac.json', 'utf8'));

  const writesPersonal = [];
  const resumenPorPlantel = new Map();
  const seenDeaCi = new Set();

  let totalProcesados = 0;
  let totalDocentes = 0;
  let totalAdmins = 0;
  let totalObreros = 0;

  for (const [mun, data] of Object.entries(resumen.porMunicipio)) {
    for (const [deaOriginal, plt] of Object.entries(data.planteles)) {
      let dea = deaOriginal.trim().toUpperCase();
      if (dea.startsWith('0D')) dea = 'OD' + dea.substring(2);

      for (const pers of plt.personal) {
        const ci = String(pers.cedula).trim().replace(/\D/g, '');
        const key = `${dea}_${ci}`;

        if (seenDeaCi.has(key)) {
          console.log(`⚠️ Omisión de duplicado exacto en misma institución: ${key}`);
          continue;
        }
        seenDeaCi.add(key);
        totalProcesados++;

        // Obtener metadatos oficiales del RAC
        const r = racFullMapByDeaCi.get(key) || racFullMapByCi.get(ci) || {};
        const nombre = String(r[colNombre] || pers.nombre || '').trim().toUpperCase();
        const cargo = String(r[colCargo] || pers.cargo || '').trim().toUpperCase();
        const codRac = String(r[colCodigoRac] || '').trim();
        const tipo = String(r[colTipoPersonal] || pers.tipo || '').trim().toUpperCase();
        const dep = String(r[colDependencia] || pers.dep || 'NACIONAL').trim().toUpperCase();
        const titular = String(r[colTitular] || pers.titular || 'SI').trim().toUpperCase();
        const hrsAcad = Number(r[colHorasAcad]) || 0;
        const hrsAdm = Number(r[colHorasAdm]) || 0;
        const hrsRec = hrsAcad + hrsAdm > 0 ? hrsAcad + hrsAdm : (pers.hrs || 0);
        const parr = String(r[colParroquia] || 'CENTRO').trim().toUpperCase();
        const plantelNombre = String(r[colNombrePlantel] || plt.nombre || '').trim().toUpperCase();
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

        if (tipo === 'DOCENTE') totalDocentes++;
        else if (tipo === 'ADMINISTRATIVO') totalAdmins++;
        else totalObreros++;

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
          fecha_actualizacion: { stringValue: new Date().toISOString() },
          origen_regularizacion: { stringValue: 'CARGA_MASIVA_HUERFANOS_RAC_2026-11-09' }
        };

        // Crear/actualizar documento canónico {dea}_{ci}
        writesPersonal.push({
          update: {
            name: `projects/sgh-merida/databases/(default)/documents/cargos_personal/${dea}_${ci}`,
            fields: docFields
          }
        });

        // Agrupar para personal_resumen
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
      }
    }
  }

  console.log(`\nDocumentos canónicos preparados en cargos_personal: ${writesPersonal.length}`);
  console.log(`Planteles receptores involucrados: ${resumenPorPlantel.size}`);
  console.log(`Desglose: Docentes: ${totalDocentes}, Administrativos: ${totalAdmins}, Obreros: ${totalObreros}`);

  // 3. Preparar transforms de planteles
  const writesPlanteles = [];
  for (const [dea, items] of resumenPorPlantel.entries()) {
    writesPlanteles.push({
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
  }
  console.log(`Transforms preparados para planteles: ${writesPlanteles.length}`);

  // 4. Consolidar todas las operaciones de escritura
  const allWrites = [...writesPersonal, ...writesPlanteles];
  console.log(`\n================================================================`);
  console.log(`TOTAL OPERACIONES ATÓMICAS GLOBALES: ${allWrites.length}`);
  console.log(`================================================================`);

  // 5. Enviar en lotes (Batches) de 400 operaciones por commit (límite Firestore: 500)
  const BATCH_SIZE = 400;
  const totalBatches = Math.ceil(allWrites.length / BATCH_SIZE);
  console.log(`\nDividiendo en ${totalBatches} lotes de máximo ${BATCH_SIZE} operaciones...`);

  let operacionesConfirmadas = 0;
  for (let b = 0; b < totalBatches; b++) {
    const start = b * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, allWrites.length);
    const chunk = allWrites.slice(start, end);

    console.log(`\n[Lote ${b + 1}/${totalBatches}] Enviando operaciones ${start + 1} a ${end} (${chunk.length} ops)...`);
    token = await ensureFreshToken();
    const res = await commitWritesWithRetry(chunk, token);
    const writeCount = res.writeResults ? res.writeResults.length : 0;
    operacionesConfirmadas += writeCount;
    console.log(`✓ Lote ${b + 1} completado con éxito (HTTP 200). Confirmadas: ${writeCount}. CommitTime: ${res.commitTime}`);
    // Pequeño descanso de 1 segundo entre lotes para cortesía de red
    if (b < totalBatches - 1) await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n================================================================`);
  console.log(`✓✓✓ CARGA MASIVA GLOBAL COMPLETADA CON ÉXITO ABSOLUTO!`);
  console.log(`Total operaciones enviadas y confirmadas: ${operacionesConfirmadas}/${allWrites.length}`);
  console.log(`================================================================\n`);

  // 6. Guardar manifiesto de inyección
  const manifiesto = {
    fecha: new Date().toISOString(),
    total_huerfanos_incorporados: writesPersonal.length,
    planteles_actualizados: resumenPorPlantel.size,
    operaciones_confirmadas: operacionesConfirmadas,
    desglose: {
      docentes: totalDocentes,
      administrativos: totalAdmins,
      obreros: totalObreros
    }
  };
  fs.writeFileSync('scratch/manifiesto_carga_masiva_huerfanos_rac.json', JSON.stringify(manifiesto, null, 2), 'utf8');
  console.log('Manifiesto guardado en scratch/manifiesto_carga_masiva_huerfanos_rac.json');
}

main().catch(err => {
  console.error('\n❌ ERROR FATAL DURANTE LA CARGA MASIVA:', err);
  process.exit(1);
});

