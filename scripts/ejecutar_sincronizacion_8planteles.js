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
  console.log('========================================================================');
  console.log('=== SINCRONIZACIÓN ATÓMICA DE 8 PLANTELES Y SANEAMIENTO DE NÓMINA ===');
  console.log('========================================================================\n');

  const token = await ensureFreshToken();

  // 1. Cargar PlantelesMerida.xlsx
  const wbPlanteles = xlsx.readFile('nomina_acualizada/PlantelesMerida.xlsx');
  const wsPlanteles = wbPlanteles.Sheets['PLANTELES-MERIDA'] || wbPlanteles.Sheets[wbPlanteles.SheetNames[0]];
  const plantelesData = xlsx.utils.sheet_to_json(wsPlanteles);

  // 2. Cargar nómina consolidada para extraer todo el personal de esos 8 planteles
  const wbNomina = xlsx.readFile('nomina_acualizada/Nomina_Personal_Consolidado_Estadal_MERIDA_2026-11-07.xlsx');
  const wsNomina = wbNomina.Sheets[wbNomina.SheetNames[0]];
  const nominaRows = xlsx.utils.sheet_to_json(wsNomina);

  const targetDeas = [
    'OD00611406',
    'OD05041421',
    'OD11201405',
    'OD13921417',
    'OD14561420',
    'OD17721407',
    'OD19090103',
    'ON12421406'
  ];

  // Extraer personal consolidado por plantel
  const personalPorPlantel = {};
  targetDeas.forEach(d => personalPorPlantel[d] = []);

  nominaRows.forEach(r => {
    const dea = String(r['Código Plantel (DEA)'] || '').trim().toUpperCase();
    if (personalPorPlantel[dea]) {
      personalPorPlantel[dea].push({
        cedula: String(r['Cédula'] || '').trim().replace(/[^0-9]/g, ''),
        nombres: String(r['Apellidos y Nombres'] || '').trim().toUpperCase(),
        cargo: String(r['Cargo'] || 'DOCENTE').trim().toUpperCase(),
        dependencia: String(r['Dependencia'] || 'NACIONAL').trim().toUpperCase(),
        tipo: String(r['Tipo de Personal'] || 'DOCENTE').trim().toUpperCase()
      });
    }
  });

  const writes = [];

  // A. Actualizar / Crear los 8 Planteles en planteles/{dea}
  console.log('--- 1. Preparando 8 planteles para la colección planteles/... ---');
  let totalPersonalConsolidado = 0;

  for (const dea of targetDeas) {
    const pExcel = plantelesData.find(r => Object.values(r).some(v => String(v || '').trim().toUpperCase() === dea)) || {};
    const staffList = personalPorPlantel[dea] || [];
    totalPersonalConsolidado += staffList.length;

    const municipio = pExcel['MUNICIPIOS'] || '';
    const parroquia = pExcel['PARROQUIA (AL QUE PERTENECE EL PLANTEL)'] || '';
    const dependencia = pExcel['DEPENDENCIA SI ES NACIONAL O ESTADAL'] || 'NACIONAL';
    const denominacion = pExcel['DENOMINACION'] || 'ESCUELA';
    const denominacionAbr = pExcel['DENOMINACION (ABR.)'] || 'E';
    const nombreNominal = pExcel['NOMBRE DEL PLANTEL COMO APARECE EN EL RECIBO DE PAGO'] || '';
    const nuevoEponimo = pExcel['NOMBRE DEL NUEVO EPÓNIMO'] || nombreNominal;
    const codDep = String(pExcel['CÓDIGO DEPENDENCIA'] || '');
    const codEst = String(pExcel['CÓDIGO ESTADÍSTICO (EL QUE SE USA PARA LA MATRÍCULA)'] || '');

    const personalResumenValues = staffList.map(p => ({
      mapValue: {
        fields: {
          cedula: { stringValue: p.cedula },
          nombres: { stringValue: p.nombres },
          cargo: { stringValue: p.cargo },
          dependencia: { stringValue: p.dependencia },
          tipo: { stringValue: p.tipo }
        }
      }
    }));

    const plantelFields = {
      codigoDEA: { stringValue: dea },
      'codigo-plantel': { stringValue: dea },
      denominacion: { stringValue: denominacion },
      'denominacion-abr': { stringValue: denominacionAbr },
      'nombre-plantel': {
        mapValue: {
          fields: {
            nominal: { stringValue: nombreNominal },
            'nuevo-eponimo': { stringValue: nuevoEponimo },
            nuevo_eponimo: { stringValue: nuevoEponimo }
          }
        }
      },
      nombre: { stringValue: nuevoEponimo },
      eponimo: { stringValue: nuevoEponimo },
      estado: { stringValue: 'MÉRIDA' },
      municipio: { stringValue: municipio },
      parroquia: { stringValue: parroquia },
      dependencia: { stringValue: dependencia },
      codigos: {
        mapValue: {
          fields: {
            plantel: { stringValue: dea },
            dependencia: { stringValue: codDep },
            estadistico: { stringValue: codEst }
          }
        }
      },
      personal_resumen: {
        arrayValue: {
          values: personalResumenValues
        }
      },
      total_personal: { integerValue: String(staffList.length) },
      fecha_actualizacion: { stringValue: new Date().toISOString() },
      origen_actualizacion: { stringValue: 'SANEAMIENTO_PLANTELES_MERIDA_2026' }
    };

    writes.push({
      update: {
        name: `projects/sgh-merida/databases/(default)/documents/planteles/${dea}`,
        fields: plantelFields
      }
    });

    console.log(`✓ [Plantel ${dea}] ${nuevoEponimo} | Mun: ${municipio} | Parr: ${parroquia} (${staffList.length} trabajadores consolidados)`);
  }

  // B. Actualizar los 15 trabajadores de las filas 3 a 17 con su Municipio y Parroquia en cargos_personal
  console.log('\n--- 2. Preparando actualizaciones de Municipio para los 15 trabajadores ---');
  const trabajadores15 = [
    { ci: '22654384', nombre: 'JORGE ALBERTO ALONSO NAVARRETE', dea: 'OD00611406', mun: 'CAMPO ELIAS', parr: 'MONTALBAN' },
    { ci: '23493717', nombre: 'ISAMAR CONTRERAS', dea: 'OD05041421', mun: 'TOVAR', parr: 'TOVAR' },
    { ci: '20830800', nombre: 'JOHANA KARINA CONTRERAS MÁRQUEZ', dea: 'OD11201405', mun: 'ARZOBISPO CHACON', parr: 'CHACANTA' },
    { ci: '20831107', nombre: 'MARIOLY MOLINA ESCALONA', dea: 'OD11201405', mun: 'ARZOBISPO CHACON', parr: 'CHACANTA' },
    { ci: '20831069', nombre: 'YOLEIDA MOLINA MOLINA', dea: 'OD11201405', mun: 'ARZOBISPO CHACON', parr: 'CHACANTA' },
    { ci: '20873854', nombre: 'GLENDYS KARELYS MORENO GARCIA', dea: 'OD13921417', mun: 'RANGEL', parr: 'SAN RAFAEL' },
    { ci: '23716629', nombre: 'MORELBA DESIRETH PICON CARRERO', dea: 'OD14561420', mun: 'SUCRE', parr: 'LA TRAMPA' },
    { ci: '23214059', nombre: 'ISMAEL SILVA', dea: 'OD17721407', mun: 'CARACCIOLO PARRA', parr: 'TUCANI' },
    { ci: '23715815', nombre: 'JESUS MAEL PACHECO', dea: 'OD17721407', mun: 'CARACCIOLO PARRA', parr: 'TUCANI' },
    { ci: '23238390', nombre: 'LUZ SUAREZ', dea: 'OD17721407', mun: 'CARACCIOLO PARRA', parr: 'TUCANI' },
    { ci: '23716088', nombre: 'MARGARET BAYONA', dea: 'OD17721407', mun: 'CARACCIOLO PARRA', parr: 'TUCANI' },
    { ci: '21307333', nombre: 'ROSMARY AVILA', dea: 'OD17721407', mun: 'CARACCIOLO PARRA', parr: 'TUCANI' },
    { ci: '21305825', nombre: 'INGRID PATRICIA MONRROY QUIROZ', dea: 'OD19090103', mun: 'CARACCIOLO PARRA', parr: 'TUCANI' },
    { ci: '23715861', nombre: 'NILMAR ALEXANDRA DELGADO GARCÍA', dea: 'OD19090103', mun: 'CARACCIOLO PARRA', parr: 'TUCANI' },
    { ci: '21182042', nombre: 'MARIA MILAGROS NIÑO ROJAS', dea: 'ON12421406', mun: 'CAMPO ELIAS', parr: 'MONTALBAN' }
  ];

  for (const t of trabajadores15) {
    writes.push({
      update: {
        name: `projects/sgh-merida/databases/(default)/documents/cargos_personal/${t.ci}`,
        fields: {
          municipio: { stringValue: t.mun },
          parroquia: { stringValue: t.parr },
          MUNICIPIO: { stringValue: t.mun },
          PARROQUIA: { stringValue: t.parr },
          fecha_actualizacion: { stringValue: new Date().toISOString() }
        }
      },
      updateMask: {
        fieldPaths: ['municipio', 'parroquia', 'MUNICIPIO', 'PARROQUIA', 'fecha_actualizacion']
      }
    });

    console.log(`✓ [C.I. ${t.ci}] ${t.nombre} -> Municipio: ${t.mun} | Parroquia: ${t.parr}`);
  }

  // C. Depurar los 2 registros de prueba (123 y 12345678)
  console.log('\n--- 3. Eliminando 2 registros dummy de prueba ---');
  writes.push({
    delete: 'projects/sgh-merida/databases/(default)/documents/cargos_personal/123'
  });
  writes.push({
    delete: 'projects/sgh-merida/databases/(default)/documents/cargos_personal/12345678'
  });
  console.log('✓ cargos_personal/123');
  console.log('✓ cargos_personal/12345678');

  console.log(`\n========================================================================`);
  console.log(`Total operaciones preparadas en commit único: ${writes.length}`);
  console.log(`- 8 planteles institucionales (con ${totalPersonalConsolidado} trabajadores consolidados)`);
  console.log(`- 15 actualizaciones territoriales en cargos_personal`);
  console.log(`- 2 eliminaciones de registros dummy`);
  console.log(`========================================================================`);

  console.log('\nEnviando commit atómico a Cloud Firestore REST API...');
  const res = await commitWrites(writes, token);
  console.log('✓ COMMIT EJECUTADO EXITOSAMENTE CON RESPUESTA HTTP 200!');
  console.log('Commit Time:', res.commitTime);

  fs.writeFileSync('scratch/sincronizacion_8planteles_result.json', JSON.stringify({
    totalWrites: writes.length,
    commitTime: res.commitTime,
    planteles: targetDeas,
    totalPersonalConsolidado,
    trabajadores: trabajadores15.map(t => ({ ci: t.ci, nombre: t.nombre, mun: t.mun }))
  }, null, 2), 'utf8');

  console.log('Resultado archivado en scratch/sincronizacion_8planteles_result.json');
}

main().catch(err => {
  console.error('Error fatal durante la sincronización:', err);
  process.exit(1);
});
