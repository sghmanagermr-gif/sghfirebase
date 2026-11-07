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
  console.log('=== EJECUCIÓN ATÓMICA CASO_HUERFANOS: MUNICIPIO LIBERTADOR (501) ===');
  console.log('========================================================================\n');

  const token = await ensureFreshToken();

  // 1. Cargar RAC para campos complementarios
  console.log('Cargando RAC.xlsx para metadata complementaria...');
  const wbRac = xlsx.readFile('RAC.xlsx');
  const dataRac = xlsx.utils.sheet_to_json(wbRac.Sheets[wbRac.SheetNames[0]]);
  const racByCiAndDea = new Map();
  for (const r of dataRac) {
    const ci = String(r['CEDULA'] || '').trim().replace(/[^0-9]/g, '');
    const dea = String(r['CODIGO DEL PLANTEL'] || '').trim().toUpperCase();
    if (ci && dea) {
      racByCiAndDea.set(`${dea}_${ci}`, r);
    }
  }
  console.log(`RAC indexado por DEA_CI: ${racByCiAndDea.size} combinaciones.`);

  // 2. Cargar resultados auditados
  const auditData = JSON.parse(fs.readFileSync('scratch/libertador_audit_results.json', 'utf8'));
  const rawConfirmados = auditData.confirmados;

  console.log(`Filas confirmadas en auditoría: ${rawConfirmados.length}`);

  // Filtrar duplicados exactos en origen (manteniendo 501 únicos)
  const uniqueConfirmados = new Map();
  for (const c of rawConfirmados) {
    const key = `${c.dea}_${c.ci}`;
    if (!uniqueConfirmados.has(key)) {
      uniqueConfirmados.set(key, c);
    }
  }

  const confirmados = [...uniqueConfirmados.values()];
  console.log(`Expedientes canónicos únicos a inyectar: ${confirmados.length}`);

  const writes = [];
  const porPlantelConfirmados = {};

  // 3. Preparar updates a cargos_personal
  for (const c of confirmados) {
    const dea = c.dea;
    const ci = c.ci;
    const docId = `${dea}_${ci}`;
    const raw = racByCiAndDea.get(docId) || {};

    if (!porPlantelConfirmados[dea]) porPlantelConfirmados[dea] = [];
    porPlantelConfirmados[dea].push({
      cedula: ci,
      nombres: c.racMatch.nombre || c.nombre,
      cargo: c.racMatch.cargo || c.cargo || 'DOCENTE',
      dependencia: c.racMatch.dependencia || 'NACIONAL',
      tipo: c.racMatch.tipo || 'DOCENTE'
    });

    let hrs = 0;
    const hAcad = Number(c.racMatch.horasAcad) || 0;
    const hAdmin = Number(c.racMatch.horasAdmin) || 0;
    if (hAcad && hAdmin) {
      hrs = hAcad === hAdmin ? hAcad : (hAcad + hAdmin);
    } else {
      hrs = hAcad || hAdmin || 40;
    }

    const fields = {
      cedula: { stringValue: ci },
      'cedula-identidad': { stringValue: ci },
      CEDULA: { stringValue: ci },
      'codigo-plantel': { stringValue: dea },
      codigoPlantel: { stringValue: dea },
      codigoDEA: { stringValue: dea },
      'CODIGO DEL PLANTEL': { stringValue: dea },
      'nombre-apellido': { stringValue: c.racMatch.nombre || c.nombre },
      nombre: { stringValue: c.racMatch.nombre || c.nombre },
      nombres: { stringValue: c.racMatch.nombre || c.nombre },
      'NOMBRE Y APELLIDO': { stringValue: c.racMatch.nombre || c.nombre },
      'tipo-personal': { stringValue: c.racMatch.tipo || 'DOCENTE' },
      tipoPersonal: { stringValue: c.racMatch.tipo || 'DOCENTE' },
      'TIPO PERSONAL': { stringValue: c.racMatch.tipo || 'DOCENTE' },
      cargo: { stringValue: c.racMatch.cargo || c.cargo || 'DOCENTE' },
      CARGO: { stringValue: c.racMatch.cargo || c.cargo || 'DOCENTE' },
      dependencia: { stringValue: c.racMatch.dependencia || 'NACIONAL' },
      DEPENDENCIA: { stringValue: c.racMatch.dependencia || 'NACIONAL' },
      'horas-academicas': { stringValue: String(c.racMatch.horasAcad ?? '40') },
      'HORAS ACADEMICAS': { stringValue: String(c.racMatch.horasAcad ?? '40') },
      'horas-administrativas': { stringValue: String(c.racMatch.horasAdmin ?? '0') },
      'HORAS ADMINISTRATIVAS': { stringValue: String(c.racMatch.horasAdmin ?? '0') },
      horas: { stringValue: String(hrs) },
      titular: { stringValue: c.racMatch.titular || 'SI' },
      TITULAR: { stringValue: c.racMatch.titular || 'SI' },
      'situacion-laboral': { stringValue: 'ACTIVO' },
      'SITUACIÓN DEL TRABAJADOR': { stringValue: 'ACTIVO' },
      'origen-caso': { stringValue: 'CASO_HUERFANOS' },
      municipio: { stringValue: 'LIBERTADOR' },
      circuito: { stringValue: String(c.circuito || '') },
      fecha_actualizacion: { stringValue: new Date().toISOString() }
    };

    if (raw['CODIGO RAC']) fields['CODIGO RAC'] = { stringValue: String(raw['CODIGO RAC']) };
    if (raw['UBICACIÓN FÍSICA']) fields['UBICACIÓN FÍSICA'] = { stringValue: String(raw['UBICACIÓN FÍSICA']) };
    if (raw['CORREO ELECTRONICO']) fields['CORREO ELECTRONICO'] = { stringValue: String(raw['CORREO ELECTRONICO']) };
    if (raw['TELEFONO CELULAR']) fields['TELEFONO CELULAR'] = { stringValue: String(raw['TELEFONO CELULAR']) };

    writes.push({
      update: {
        name: `projects/sgh-merida/databases/(default)/documents/cargos_personal/${docId}`,
        fields
      }
    });
  }

  // 4. Preparar transforms para los 116 planteles (personal_resumen e increment)
  const plantelesCount = Object.keys(porPlantelConfirmados).length;
  console.log(`Planteles a transformar en personal_resumen: ${plantelesCount}`);

  for (const [dea, personalList] of Object.entries(porPlantelConfirmados)) {
    const values = personalList.map(p => ({
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

    writes.push({
      transform: {
        document: `projects/sgh-merida/databases/(default)/documents/planteles/${dea}`,
        fieldTransforms: [
          {
            fieldPath: 'personal_resumen',
            appendMissingElements: { values }
          },
          {
            fieldPath: 'total_personal',
            increment: { integerValue: String(personalList.length) }
          }
        ]
      }
    });
  }

  console.log(`Total operaciones preparadas: ${writes.length}`);
  console.log(`- Documentos cargos_personal: ${confirmados.length}`);
  console.log(`- Transformaciones a planteles: ${plantelesCount}`);

  // 5. Ejecutar en lotes de máximo 300 escrituras por commit
  const batchSize = 300;
  const commitResponses = [];

  for (let i = 0; i < writes.length; i += batchSize) {
    const batch = writes.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(writes.length / batchSize);
    console.log(`\nEnviando Lote ${batchNum} / ${totalBatches} (${batch.length} operaciones) a Cloud Firestore...`);
    
    const res = await commitWrites(batch, token);
    console.log(`✓ Lote ${batchNum} completado exitosamente. Commit time: ${res.commitTime}`);
    commitResponses.push(res);
  }

  console.log('\n========================================================================');
  console.log('✓ INYECCIÓN ATÓMICA DE MUNICIPIO LIBERTADOR FINALIZADA CON ÉXITO');
  console.log(`- ${confirmados.length} expedientes canónicos creados en cargos_personal`);
  console.log(`- ${plantelesCount} planteles actualizados con appendMissingElements e increment`);
  console.log(`- Total commits: ${commitResponses.length} lotes atómicos HTTP 200`);
  console.log('========================================================================');

  fs.writeFileSync('scratch/libertador_commit_results.json', JSON.stringify({
    totalWrites: writes.length,
    confirmadosCount: confirmados.length,
    plantelesCount,
    batches: commitResponses
  }, null, 2), 'utf8');
}

main().catch(err => {
  console.error('Error fatal durante la inyección:', err);
  process.exit(1);
});
