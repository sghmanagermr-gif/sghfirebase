import fs from 'fs';
import path from 'path';
import os from 'os';
import { GoogleAuth } from 'google-auth-library';
import { normalizarMunicipio } from '../webapp/src/geografia.js';

const SPREADSHEET_ID = '1xRXGCx-oZiiFQqZB0K6VQZTYoU2bZVH-Y5yuTAPKKgU';
const PROJECT_ID = 'sgh-merida';
const OUTPUT_RESUMEN = path.resolve('webapp', 'public', 'resumen_estadisticas.json');
const DIST_RESUMEN = path.resolve('webapp', 'dist', 'resumen_estadisticas.json');
const SCRATCH_PERSONAL = path.resolve('scratch', 'corte_oficial_firestore_personal.json');
const SCRATCH_PLANTELES = path.resolve('scratch', 'corte_oficial_firestore_planteles.json');

async function ensureFreshFirebaseToken() {
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

function parseFirestoreField(field) {
  if (!field) return null;
  if (field.stringValue !== undefined) return field.stringValue;
  if (field.integerValue !== undefined) return parseInt(field.integerValue, 10);
  if (field.doubleValue !== undefined) return parseFloat(field.doubleValue);
  if (field.booleanValue !== undefined) return field.booleanValue;
  if (field.timestampValue !== undefined) return field.timestampValue;
  if (field.nullValue !== undefined) return null;
  if (field.mapValue !== undefined) {
    const obj = {};
    const subFields = field.mapValue.fields || {};
    for (const [k, v] of Object.entries(subFields)) {
      obj[k] = parseFirestoreField(v);
    }
    return obj;
  }
  if (field.arrayValue !== undefined) {
    const arr = field.arrayValue.values || [];
    return arr.map(parseFirestoreField);
  }
  return null;
}

function parseFirestoreDoc(doc) {
  const data = {};
  const fields = doc.fields || {};
  for (const [k, v] of Object.entries(fields)) {
    data[k] = parseFirestoreField(v);
  }
  data._id = doc.name.split('/').pop();
  return data;
}

async function fetchFirestoreCollection(collectionName) {
  console.log(`• Extrayendo colección "${collectionName}" desde Firestore...`);
  const docs = [];
  let pageToken = null;
  let pageIndex = 1;
  const liveFilePath = path.resolve('scratch', `corte_live_${collectionName}.jsonl`);
  fs.writeFileSync(liveFilePath, '', 'utf8');

  do {
    const url = new URL(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collectionName}`);
    url.searchParams.set('pageSize', '300');
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    let data = null;

    for (let attempt = 1; attempt <= 6; attempt++) {
      try {
        const freshToken = await ensureFreshFirebaseToken();
        const res = await fetch(url.toString(), {
          headers: { Authorization: 'Bearer ' + freshToken }
        });
        if (res.status === 429) {
          console.warn(`\n  [429 Rate Limit] Pausando 10 segundos antes de reintentar lote ${pageIndex} (intento ${attempt}/6)...`);
          await new Promise(r => setTimeout(r, 10000));
          continue;
        }
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`HTTP ${res.status}: ${errText}`);
        }
        data = await res.json();
        break;
      } catch (e) {
        if (attempt === 6) throw e;
        console.warn(`\n  [Error red] Reintentando en ${3 * attempt}s: ${e.message}`);
        await new Promise(r => setTimeout(r, 3000 * attempt));
      }
    }

    if (!data) {
      throw new Error(`No se pudo obtener el lote ${pageIndex} de ${collectionName} tras 6 intentos.`);
    }

    if (data && data.documents) {
      for (const d of data.documents) {
        const parsed = parseFirestoreDoc(d);
        docs.push(parsed);
        fs.appendFileSync(liveFilePath, JSON.stringify(parsed) + '\n', 'utf8');
      }
    }
    pageToken = data?.nextPageToken || null;
    process.stdout.write(`  [${collectionName}] Lote ${pageIndex++}: ${docs.length} documentos acumulados...\r`);

    // Pausa preventiva de 400ms para no saturar el limitador de velocidad
    await new Promise(r => setTimeout(r, 400));
  } while (pageToken);

  console.log(`\n✓ Colección "${collectionName}" completada: ${docs.length} documentos.`);
  return docs;
}

async function getGoogleSheetsClient() {
  const auth = new GoogleAuth({
    keyFile: 'service-account.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  return auth.getClient();
}

const DEPS_OFICIALES = ['NACIONAL', 'ESTADAL', 'MUNICIPAL', 'AUTONOMA', 'SUBVENCIONADA', 'PRIVADA'];
function normalizarDep(raw) {
  const d = String(raw || '').trim().toUpperCase();
  if (d.includes('AUTONOM')) return 'AUTONOMA';
  if (d.includes('SUBVENCION')) return 'SUBVENCIONADA';
  if (d.includes('PRIVAD')) return 'PRIVADA';
  if (d.includes('MUNICIPAL')) return 'MUNICIPAL';
  if (d.includes('ESTADAL') && !d.includes('NACIONAL')) return 'ESTADAL';
  return 'NACIONAL';
}

function parseFechaIngreso(str) {
  if (!str) return null;
  if (typeof str === 'number') {
    return new Date((str - (25567 + 2)) * 86400 * 1000);
  }
  const parts = String(str).trim().split('/');
  if (parts.length === 3) {
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    return new Date(y, m, d);
  }
  const dt = new Date(str);
  return isNaN(dt.getTime()) ? null : dt;
}

function obtenerNombreCompleto(p) {
  if (!p) return '';
  return String(
    p['nombre-apellido'] ||
    p.nombres ||
    p['apellidos-nombres'] ||
    p.NOMBRE ||
    p.nombre ||
    ''
  ).trim().toUpperCase();
}

const hoy = new Date();
const anioJub = hoy.getFullYear() + 1;
const pivoteJub = new Date(anioJub, 2, 31);
const fechaLimiteJub = new Date(pivoteJub);
fechaLimiteJub.setFullYear(fechaLimiteJub.getFullYear() - 25);

async function exportarAGoogleSheets(planteles, personal) {
  console.log('\n--- Escribiendo datos en Google Sheets (ID: ' + SPREADSHEET_ID + ') ---');
  const client = await getGoogleSheetsClient();

  // Mapa de planteles para enriquecimiento de nombre y datos institucionales
  const plantelesMap = new Map();
  for (const pl of planteles) {
    const dea = String(pl.codigos?.plantel || pl.codigoDEA || pl.id || pl._id || '').trim().toUpperCase();
    if (dea) plantelesMap.set(dea, pl);
  }

  // 1. Preparar datos de PERSONAL
  console.log('• Formateando pestaña PERSONAL...');
  const headerPersonal = [
    'CEDULA',
    'NOMBRE_COMPLETO',
    'CARGO',
    'TIPO_PERSONAL',
    'DEPENDENCIA',
    'MUNICIPIO',
    'CODIGO_DEA',
    'NOMBRE_PLANTEL',
    'SITUACION_LABORAL',
    'FECHA_INGRESO',
    'ANTIGUEDAD_ANOS',
    'GENERO'
  ];

  const rowsPersonal = [headerPersonal];
  for (const p of personal) {
    const cedula = String(p['cedula-identidad'] || p.cedula || p.CEDULA || p['CÉDULA'] || p._id || '').trim().toUpperCase();
    const nombre = obtenerNombreCompleto(p);

    const cargo = String(p.cargo || p.CARGO || '').trim().toUpperCase();
    const tipo = String(p['tipo-personal'] || p.tipo_personal || p['TIPO PERSONAL'] || p.TIPO || '').trim().toUpperCase();
    const dep = normalizarDep(p.dependencia || p.DEPENDENCIA);
    const mun = normalizarMunicipio(p.municipio || p.MUNICIPIO || '');
    const dea = String(p['codigo-plantel'] || p.codigoDEA || p.codigoPlantel || p.DEA || '').trim().toUpperCase();

    // Enriquecimiento de nombre de plantel cruzado con plantelesMap
    const pInfo = plantelesMap.get(dea) || {};
    let nomPlantel = String(
      p.plantel ||
      p['ubicacion-fisica'] ||
      p['UBICACIÓN FÍSICA'] ||
      pInfo['nombre-plantel']?.['nuevo-eponimo'] ||
      pInfo['nombre-plantel']?.nuevo_eponimo ||
      pInfo['nombre-plantel']?.nominal ||
      pInfo.denominacion ||
      pInfo.nombre ||
      p['nombre-plantel'] ||
      ''
    ).trim().toUpperCase();

    const situacion = String(p['situacion-laboral'] || p.situacion_laboral || p['SITUACIÓN DEL TRABAJADOR'] || p.condicion || p.CONDICION || 'ACTIVO').trim().toUpperCase();
    const fechaIngreso = String(p['fecha-ingreso'] || p.fecha_ingreso || p['FECHA DE INGRESO'] || p.FECHA_INGRESO || '').trim();

    let antiguedad = p.antiguedad ?? p['antiguedad'] ?? p['ANTIGUEDAD'] ?? p['Años de Antigüedad'] ?? p.anos_servicio;
    if (antiguedad === undefined || antiguedad === null || antiguedad === '') {
      if (fechaIngreso) {
        const dt = parseFechaIngreso(fechaIngreso);
        if (dt) {
          const diff = hoy.getFullYear() - dt.getFullYear();
          antiguedad = diff >= 0 ? diff : '';
        }
      }
    }
    antiguedad = antiguedad !== undefined && antiguedad !== null ? String(antiguedad).trim() : '';

    const genero = String(p.genero || p['genero'] || p['GENERO'] || p.sexo || p['sexo'] || p['SEXO'] || '').trim().toUpperCase();

    rowsPersonal.push([
      cedula,
      nombre,
      cargo,
      tipo,
      dep,
      mun,
      dea,
      nomPlantel,
      situacion,
      fechaIngreso,
      antiguedad,
      genero
    ]);
  }

  // 2. Preparar datos de PLANTELES
  console.log('• Formateando pestaña PLANTELES...');
  const headerPlanteles = [
    'CODIGO_DEA',
    'NOMBRE_PLANTEL',
    'MUNICIPIO',
    'DEPENDENCIA',
    'DATOS_COMPLETADOS',
    'MATRICULA_TOTAL',
    'MATRICULA_MASCULINO',
    'MATRICULA_FEMENINO',
    'PERSONAL_TOTAL',
    'DOCENTES_TOTAL',
    'DOCENTES_MAS',
    'DOCENTES_FEM',
    'ADMINISTRATIVOS_TOTAL',
    'ADMINISTRATIVOS_MAS',
    'ADMINISTRATIVOS_FEM',
    'OBREROS_TOTAL',
    'OBREROS_MAS',
    'OBREROS_FEM'
  ];

  // Indexar personal por plantel
  const personalPorDea = new Map();
  for (const pers of personal) {
    const dea = String(pers['codigo-plantel'] || pers.codigoDEA || pers.codigoPlantel || pers.DEA || '').trim().toUpperCase();
    if (!dea) continue;
    if (!personalPorDea.has(dea)) {
      personalPorDea.set(dea, { tot: 0, docTot: 0, docM: 0, docF: 0, admTot: 0, admM: 0, admF: 0, obrTot: 0, obrM: 0, obrF: 0 });
    }
    const stat = personalPorDea.get(dea);
    stat.tot++;
    const tipo = String(pers.tipo_personal || pers['tipo-personal'] || pers.cargo || '').toUpperCase();
    const gen = String(pers.genero || pers.sexo || '').toUpperCase();
    const esMas = gen.startsWith('M') || gen === '1';

    if (tipo.includes('DOC') || tipo.includes('AULA') || tipo.includes('PROF')) {
      stat.docTot++;
      if (esMas) stat.docM++; else stat.docF++;
    } else if (tipo.includes('ADM') || tipo.includes('TSU') || tipo.includes('SEC')) {
      stat.admTot++;
      if (esMas) stat.admM++; else stat.admF++;
    } else if (tipo.includes('OBR') || tipo.includes('ASEAD') || tipo.includes('VIG')) {
      stat.obrTot++;
      if (esMas) stat.obrM++; else stat.obrF++;
    }
  }

  const rowsPlanteles = [headerPlanteles];
  for (const pl of planteles) {
    const dea = String(pl.codigos?.plantel || pl.codigoDEA || pl.id || pl._id || '').trim().toUpperCase();
    const nombre = String(pl['nombre-plantel']?.['nuevo-eponimo'] || pl['nombre-plantel']?.nuevo_eponimo || pl.denominacion || pl.nombre || dea).trim().toUpperCase();
    const mun = normalizarMunicipio(pl.municipio || '');
    const dep = normalizarDep(pl.dependencia);
    const matTot = Number(pl['matricula-total'] || pl.matriculaTotal || pl.matricula?.['total-gen'] || 0);
    const matMas = Number(pl['matricula-masculino'] || pl['total-gen-mas'] || pl.masculino || pl.matricula?.['total-gen-mas'] || 0);
    const matFem = Number(pl['matricula-femenino'] || pl['total-gen-fem'] || pl.femenino || pl.matricula?.['total-gen-fem'] || 0);
    const completado = Boolean(pl.datos_completados || pl.matricula_cargada || (matTot > 0));

    const persStat = personalPorDea.get(dea) || { tot: 0, docTot: 0, docM: 0, docF: 0, admTot: 0, admM: 0, admF: 0, obrTot: 0, obrM: 0, obrF: 0 };

    rowsPlanteles.push([
      dea,
      nombre,
      mun,
      dep,
      completado ? 'SI' : 'NO',
      matTot,
      matMas,
      matFem,
      persStat.tot,
      persStat.docTot,
      persStat.docM,
      persStat.docF,
      persStat.admTot,
      persStat.admM,
      persStat.admF,
      persStat.obrTot,
      persStat.obrM,
      persStat.obrF
    ]);
  }

  // 3. Ajustar tamaño de cuadrícula (Grid Resize) para soportar todas las filas
  console.log('• Consultando metadata de hojas en Google Sheets...');
  const meta = await client.request({
    url: `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`
  });
  const sheetPersonal = meta.data.sheets.find(s => s.properties.title === 'PERSONAL');
  const sheetPlanteles = meta.data.sheets.find(s => s.properties.title === 'PLANTELES');

  const resizeRequests = [];
  if (sheetPersonal) {
    resizeRequests.push({
      updateSheetProperties: {
        properties: {
          sheetId: sheetPersonal.properties.sheetId,
          gridProperties: { rowCount: rowsPersonal.length + 500, columnCount: 15 }
        },
        fields: 'gridProperties(rowCount,columnCount)'
      }
    });
  }
  if (sheetPlanteles) {
    resizeRequests.push({
      updateSheetProperties: {
        properties: {
          sheetId: sheetPlanteles.properties.sheetId,
          gridProperties: { rowCount: rowsPlanteles.length + 200, columnCount: 20 }
        },
        fields: 'gridProperties(rowCount,columnCount)'
      }
    });
  }

  if (resizeRequests.length > 0) {
    console.log(`• Expandiendo cuadrículas: PERSONAL (${rowsPersonal.length + 500} filas), PLANTELES (${rowsPlanteles.length + 200} filas)...`);
    await client.request({
      url: `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`,
      method: 'POST',
      data: { requests: resizeRequests }
    });
    console.log('✓ Cuadrículas redimensionadas exitosamente.');
  }

  // 4. Limpiar y escribir en Google Sheets
  // Pestaña PERSONAL
  console.log(`• Escribiendo ${rowsPersonal.length} filas en hoja PERSONAL...`);
  await client.request({
    url: `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/PERSONAL!A1:Z:clear`,
    method: 'POST'
  });

  const BATCH_SIZE = 5000;
  for (let i = 0; i < rowsPersonal.length; i += BATCH_SIZE) {
    const chunk = rowsPersonal.slice(i, i + BATCH_SIZE);
    const startRow = i + 1;
    const endRow = i + chunk.length;
    await client.request({
      url: `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/PERSONAL!A${startRow}:L${endRow}?valueInputOption=USER_ENTERED`,
      method: 'PUT',
      data: { values: chunk }
    });
    console.log(`  PERSONAL: filas ${startRow} a ${endRow} escritas...`);
  }

  // Pestaña PLANTELES
  console.log(`• Escribiendo ${rowsPlanteles.length} filas en hoja PLANTELES...`);
  await client.request({
    url: `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/PLANTELES!A1:Z:clear`,
    method: 'POST'
  });

  await client.request({
    url: `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/PLANTELES!A1:R${rowsPlanteles.length}?valueInputOption=USER_ENTERED`,
    method: 'PUT',
    data: { values: rowsPlanteles }
  });

  console.log('✓ Google Sheets actualizado exitosamente con las dos pestañas maestras!');
}

function compilarFichaLocal(planteles, personal) {
  console.log('\n--- Compilando resumen_estadisticas.json para la Pizarra ---');

  // Indexar planteles
  const plantelesMap = new Map();
  planteles.forEach(p => {
    const dea = String(p.codigos?.plantel || p.codigoDEA || p.id || p._id || '').trim().toUpperCase();
    const nombre = String(p['nombre-plantel']?.['nuevo-eponimo'] || p['nombre-plantel']?.nuevo_eponimo || p.denominacion || p.nombre || dea).trim().toUpperCase();
    const esPlanta = Boolean(p.es_planta || p.denominacion === 'SEDE ADMINISTRATIVA' || dea.startsWith('0012'));
    const mun = esPlanta ? 'PLANTA CENTRAL' : normalizarMunicipio(p.municipio || '');
    const dep = normalizarDep(p.dependencia);
    const matTot = Number(p['matricula-total'] || p.matriculaTotal || p.matricula?.['total-gen'] || 0);
    const matMas = Number(p['matricula-masculino'] || p['total-gen-mas'] || p.masculino || p.matricula?.['total-gen-mas'] || 0);
    const matFem = Number(p['matricula-femenino'] || p['total-gen-fem'] || p.femenino || p.matricula?.['total-gen-fem'] || 0);
    const cargado = Boolean(p.datos_completados || p.matricula_cargada || (matTot > 0));

    plantelesMap.set(dea, {
      dea,
      nombre,
      municipio: mun,
      dependencia: dep,
      esPlanta,
      cargado,
      matricula: { total: matTot, masculino: matMas, femenino: matFem }
    });
  });

  const plantelesEducativos = planteles.filter(p => !p.es_planta && p.denominacion !== 'SEDE ADMINISTRATIVA' && !(p.codigos?.plantel || p.codigoDEA || p.id || '').startsWith('0012'));

  const global = {
    totalPersonal: personal.length,
    totalPlanteles: plantelesEducativos.length,
    docentes: { total: 0, mas: 0, fem: 0 },
    administrativos: { total: 0, mas: 0, fem: 0 },
    obreros: { total: 0, mas: 0, fem: 0 },
    porDependencia: {},
    situacion_laboral: {},
    jubilables: { total: 0, porMunicipio: [] },
    matricula: {
      total: 0,
      masculino: 0,
      femenino: 0,
      plantelesTotal: plantelesEducativos.length,
      cargados: 0,
      pendientes: 0,
      porMunicipio: {}
    }
  };

  DEPS_OFICIALES.forEach(dep => {
    global.porDependencia[dep] = {
      total: 0,
      docentes: { total: 0, mas: 0, fem: 0 },
      administrativos: { total: 0, mas: 0, fem: 0 },
      obreros: { total: 0, mas: 0, fem: 0 }
    };
  });

  const porMunicipio = {};
  const jubPorMun = {};
  const personalPorPlantelMap = new Map();

  // Inicializar planteles en personalPorPlantelMap
  plantelesMap.forEach((pl, dea) => {
    personalPorPlantelMap.set(dea, {
      dea,
      nombre: pl.nombre,
      dependencia: pl.dependencia,
      municipio: pl.municipio,
      total: 0,
      docentes: { total: 0, mas: 0, fem: 0 },
      administrativos: { total: 0, mas: 0, fem: 0 },
      obreros: { total: 0, mas: 0, fem: 0 },
      situacion_laboral: {},
      jubilables: { total: 0, lista: [] }
    });
  });

  // Procesar personal
  personal.forEach(pers => {
    const tipo = String(pers.tipo_personal || pers['tipo-personal'] || pers.cargo || '').toUpperCase();
    const gen = String(pers.genero || pers.sexo || '').toUpperCase();
    const esMas = gen.startsWith('M') || gen === '1';

    let dea = String(pers['codigo-plantel'] || pers.codigoDEA || pers.codigoPlantel || pers.DEA || '').trim().toUpperCase();
    const plInfo = plantelesMap.get(dea);
    const esPlantaPers = Boolean(plInfo?.esPlanta || dea.startsWith('0012') || pers.es_planta || pers.denominacion === 'SEDE ADMINISTRATIVA');
    const mun = esPlantaPers ? 'PLANTA CENTRAL' : normalizarMunicipio(pers.municipio || plInfo?.municipio || '');
    const dep = normalizarDep(pers.dependencia || plInfo?.dependencia);

    if (!porMunicipio[mun]) {
      porMunicipio[mun] = {
        totalPersonal: 0,
        totalPlanteles: 0,
        docentes: { total: 0, mas: 0, fem: 0 },
        administrativos: { total: 0, mas: 0, fem: 0 },
        obreros: { total: 0, mas: 0, fem: 0 },
        porDependencia: {},
        situacion_laboral: {},
        jubilables: [],
        matricula: { total: 0, masculino: 0, femenino: 0, plantelesTotal: 0, cargados: 0, pendientes: 0, planteles: [] },
        personal_detallado: {
          total: 0,
          docentes: { total: 0, mas: 0, fem: 0 },
          administrativos: { total: 0, mas: 0, fem: 0 },
          obreros: { total: 0, mas: 0, fem: 0 },
          porDependencia: {},
          planteles: []
        }
      };
      DEPS_OFICIALES.forEach(d => {
        porMunicipio[mun].porDependencia[d] = { total: 0, docentes: { total: 0, mas: 0, fem: 0 }, administrativos: { total: 0, mas: 0, fem: 0 }, obreros: { total: 0, mas: 0, fem: 0 } };
        porMunicipio[mun].personal_detallado.porDependencia[d] = { total: 0, docentes: { total: 0, mas: 0, fem: 0 }, administrativos: { total: 0, mas: 0, fem: 0 }, obreros: { total: 0, mas: 0, fem: 0 } };
      });
    }

    const mMun = porMunicipio[mun];
    mMun.totalPersonal++;
    mMun.personal_detallado.total++;

    let targetGrupo = 'docentes';
    if (tipo.includes('ADM') || tipo.includes('TSU') || tipo.includes('SEC')) {
      targetGrupo = 'administrativos';
    } else if (tipo.includes('OBR') || tipo.includes('ASEAD') || tipo.includes('VIG')) {
      targetGrupo = 'obreros';
    }

    // Global
    global[targetGrupo].total++;
    if (esMas) global[targetGrupo].mas++; else global[targetGrupo].fem++;
    global.porDependencia[dep].total++;
    global.porDependencia[dep][targetGrupo].total++;
    if (esMas) global.porDependencia[dep][targetGrupo].mas++; else global.porDependencia[dep][targetGrupo].fem++;

    // Municipal
    mMun[targetGrupo].total++;
    if (esMas) mMun[targetGrupo].mas++; else mMun[targetGrupo].fem++;
    mMun.porDependencia[dep].total++;
    mMun.porDependencia[dep][targetGrupo].total++;
    if (esMas) mMun.porDependencia[dep][targetGrupo].mas++; else mMun.porDependencia[dep][targetGrupo].fem++;

    mMun.personal_detallado[targetGrupo].total++;
    if (esMas) mMun.personal_detallado[targetGrupo].mas++; else mMun.personal_detallado[targetGrupo].fem++;
    mMun.personal_detallado.porDependencia[dep].total++;
    mMun.personal_detallado.porDependencia[dep][targetGrupo].total++;
    if (esMas) mMun.personal_detallado.porDependencia[dep][targetGrupo].mas++; else mMun.personal_detallado.porDependencia[dep][targetGrupo].fem++;

    // Situación laboral
    const sit = String(pers.situacion_laboral || pers['situacion-laboral'] || pers.condicion || 'ACTIVO').trim().toUpperCase();
    global.situacion_laboral[sit] = (global.situacion_laboral[sit] || 0) + 1;
    mMun.situacion_laboral[sit] = (mMun.situacion_laboral[sit] || 0) + 1;

    // Jubilables
    const dt = parseFechaIngreso(pers.fecha_ingreso || pers['fecha-ingreso']);
    const ant = parseInt(pers.antiguedad || pers.anos_servicio, 10) || 0;
    const esJub = (dt && dt <= fechaLimiteJub) || (ant >= 25);

    // Registro por plantel
    if (!dea) dea = 'SIN_DEA';
    if (!personalPorPlantelMap.has(dea)) {
      const plInfo = plantelesMap.get(dea);
      const nomP = plInfo ? (plInfo['nombre-plantel']?.['nuevo-eponimo'] || plInfo['nombre-plantel']?.nominal || plInfo.denominacion || plInfo.nombre || dea) : (pers.plantel || pers['ubicacion-fisica'] || pers['nombre-plantel'] || 'PLANTEL NO ESPECIFICADO');
      personalPorPlantelMap.set(dea, {
        dea,
        nombre: nomP,
        dependencia: dep,
        municipio: mun,
        total: 0,
        docentes: { total: 0, mas: 0, fem: 0 },
        administrativos: { total: 0, mas: 0, fem: 0 },
        obreros: { total: 0, mas: 0, fem: 0 },
        situacion_laboral: {},
        jubilables: { total: 0, lista: [] }
      });
    }

    const pPlant = personalPorPlantelMap.get(dea);
    pPlant.total++;
    pPlant[targetGrupo].total++;
    if (esMas) pPlant[targetGrupo].mas++; else pPlant[targetGrupo].fem++;
    pPlant.situacion_laboral[sit] = (pPlant.situacion_laboral[sit] || 0) + 1;

    if (esJub) {
      global.jubilables.total++;
      jubPorMun[mun] = (jubPorMun[mun] || 0) + 1;
      pPlant.jubilables.total++;
      pPlant.jubilables.lista.push({
        cedula: String(pers.cedula || pers['cedula-identidad'] || pers.CEDULA || pers._id || '').trim(),
        nombre: obtenerNombreCompleto(pers),
        cargo: String(pers.cargo || pers.CARGO || tipo).trim(),
        antiguedad: ant || 25
      });
    }
  });

  // Integrar Planteles y Matrícula por Municipio
  plantelesMap.forEach((pl, dea) => {
    const mun = pl.municipio;
    if (!mun) return;
    if (!porMunicipio[mun]) {
      porMunicipio[mun] = {
        totalPersonal: 0,
        totalPlanteles: 0,
        docentes: { total: 0, mas: 0, fem: 0 },
        administrativos: { total: 0, mas: 0, fem: 0 },
        obreros: { total: 0, mas: 0, fem: 0 },
        porDependencia: {},
        situacion_laboral: {},
        jubilables: [],
        matricula: { total: 0, masculino: 0, femenino: 0, plantelesTotal: 0, cargados: 0, pendientes: 0, planteles: [] },
        personal_detallado: { total: 0, docentes: { total: 0, mas: 0, fem: 0 }, administrativos: { total: 0, mas: 0, fem: 0 }, obreros: { total: 0, mas: 0, fem: 0 }, porDependencia: {}, planteles: [] }
      };
      DEPS_OFICIALES.forEach(d => {
        porMunicipio[mun].porDependencia[d] = { total: 0, docentes: { total: 0, mas: 0, fem: 0 }, administrativos: { total: 0, mas: 0, fem: 0 }, obreros: { total: 0, mas: 0, fem: 0 } };
        porMunicipio[mun].personal_detallado.porDependencia[d] = { total: 0, docentes: { total: 0, mas: 0, fem: 0 }, administrativos: { total: 0, mas: 0, fem: 0 }, obreros: { total: 0, mas: 0, fem: 0 } };
      });
    }

    const mMun = porMunicipio[mun];
    mMun.totalPlanteles++;

    const mat = pl.matricula;
    const cargado = pl.cargado;

    // Las sedes de Planta Central no matriculan alumnos, no deben figurar como pendientes de matrícula escolar
    if (!pl.esPlanta) {
      mMun.matricula.plantelesTotal++;

      if (cargado) {
        mMun.matricula.cargados++;
        mMun.matricula.total += mat.total;
        mMun.matricula.masculino += mat.masculino;
        mMun.matricula.femenino += mat.femenino;

        global.matricula.cargados++;
        global.matricula.total += mat.total;
        global.matricula.masculino += mat.masculino;
        global.matricula.femenino += mat.femenino;
      } else {
        mMun.matricula.pendientes++;
        global.matricula.pendientes++;
      }

      mMun.matricula.planteles.push({
        id: dea,
        dea,
        nombre: pl.nombre,
        total: mat.total,
        masculino: mat.masculino,
        femenino: mat.femenino,
        cargado
      });
    }

    const persPlant = personalPorPlantelMap.get(dea);
    if (persPlant) {
      mMun.personal_detallado.planteles.push(persPlant);
    }
  });

  // Consolidar jubilables por municipio
  for (const [mun, mMun] of Object.entries(porMunicipio)) {
    const plantelesConJub = mMun.personal_detallado.planteles
      .filter(p => p.jubilables && p.jubilables.total > 0)
      .map(p => ({ clave: p.dea, nombre: p.nombre, count: p.jubilables.total }))
      .sort((a, b) => b.count - a.count);

    mMun.jubilables = plantelesConJub;
    mMun.matricula.planteles.sort((a, b) => a.nombre.localeCompare(b.nombre));
    mMun.personal_detallado.planteles.sort((a, b) => a.nombre.localeCompare(b.nombre));

    global.matricula.porMunicipio[mun] = {
      total: mMun.matricula.total,
      masculino: mMun.matricula.masculino,
      femenino: mMun.matricula.femenino,
      plantelesTotal: mMun.matricula.plantelesTotal,
      cargados: mMun.matricula.cargados,
      pendientes: mMun.matricula.pendientes
    };
  }

  global.jubilables.porMunicipio = Object.entries(jubPorMun)
    .map(([clave, count]) => ({ clave, count }))
    .sort((a, b) => b.count - a.count);

  // Inyectar Aliases Municipales
  const aliases = {
    'JULIO CESAR SALAS': 'JULIO CESAR',
    'JULIO CÉSAR SALAS': 'JULIO CESAR',
    'CARACCIOLO PARRA OLMEDO': 'CARACCIOLO PARRA',
    'ANTONIO PINTO SALINAS': 'ANTONIO PINTO SALINA',
    'TULIO FEBRES CORDERO': 'TULIO FEBRES',
    'ANDRÉS BELLO': 'ANDRES BELLO',
    'CAMPO ELÍAS': 'CAMPO ELIAS',
    'ARZOBISPO CHACÓN': 'ARZOBISPO CHACON',
    'RIVAS DÁVILA': 'RIVAS DAVILA',
    'JUSTO BRICENO': 'JUSTO BRICEÑO'
  };

  for (const [alias, canonical] of Object.entries(aliases)) {
    if (porMunicipio[canonical]) {
      porMunicipio[alias] = porMunicipio[canonical];
    }
  }

  global.totalMatricula = global.matricula.total;
  global.personal_detallado = {
    total: global.totalPersonal,
    docentes: { ...global.docentes },
    administrativos: { ...global.administrativos },
    obreros: { ...global.obreros },
    porDependencia: global.porDependencia
  };

  const resultado = {
    version: '2.38.7',
    fecha_corte: new Date().toISOString(),
    descripcion_corte: 'Corte Oficial Cloud Firestore (17 de Noviembre 2026)',
    global,
    porMunicipio
  };

  fs.writeFileSync(OUTPUT_RESUMEN, JSON.stringify(resultado, null, 2), 'utf8');
  fs.writeFileSync(DIST_RESUMEN, JSON.stringify(resultado, null, 2), 'utf8');
  console.log('✓ resumen_estadisticas.json generado con éxito en webapp/public y webapp/dist!');
}

async function main() {
  const args = process.argv.slice(2);
  const isCheckOnly = args.includes('--check');
  const isSoloDescarga = args.includes('--solo-descarga') || args.includes('--download-only');

  console.log('========================================================================');
  console.log('=== SGH MÉRIDA: SINCRONIZADOR DE CORTE OFICIAL FIREBASE ➔ SHEETS ===');
  console.log('========================================================================');
  console.log(`Documento Google Sheets ID: ${SPREADSHEET_ID}`);

  try {
    const token = await ensureFreshFirebaseToken();
    console.log('• Verificando cuota de Firestore en Google Cloud...');
    const testRes = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/planteles?pageSize=1`, {
      headers: { Authorization: 'Bearer ' + token }
    });

    console.log(`• Estado de cuota Firestore: HTTP ${testRes.status}`);

    if (testRes.status === 429) {
      console.log('\n⚠️ La cuota de lectura de Firestore se encuentra temporalmente agotada (HTTP 429).');
      if (isCheckOnly) return;
      process.exit(0);
    }

    if (!testRes.ok) {
      const err = await testRes.text();
      console.error('Error al conectar a Firestore:', err);
      process.exit(1);
    }

    if (isCheckOnly) {
      console.log('✓ Conexión activa y cuota disponible.');
      return;
    }

    console.log('✓ Conexión a Firestore exitosa (Cuota disponible). Iniciando extracción completa...');
    const planteles = await fetchFirestoreCollection('planteles');
    fs.writeFileSync(SCRATCH_PLANTELES, JSON.stringify(planteles, null, 2), 'utf8');
    console.log('✓ Respaldo crudo de planteles guardado inmediatamente en scratch/.');

    const personal = await fetchFirestoreCollection('cargos_personal');
    fs.writeFileSync(SCRATCH_PERSONAL, JSON.stringify(personal, null, 2), 'utf8');
    console.log('✓ Respaldo crudo de personal guardado inmediatamente en scratch/.');

    if (isSoloDescarga) {
      console.log('\n[Modo Solo Descarga Activado]: Omitiendo volcado a Google Sheets según instrucción.');
      compilarFichaLocal(planteles, personal);
      console.log('\n========================================================================');
      console.log('🎉 DESCARGA COMPLETA A DISCO LOCAL FINALIZADA CON ÉXITO.');
      console.log('   Archivos listos para auditoría:');
      console.log(`   - ${SCRATCH_PLANTELES}`);
      console.log(`   - ${SCRATCH_PERSONAL}`);
      console.log('========================================================================');
      return;
    }

    await exportarAGoogleSheets(planteles, personal);
    compilarFichaLocal(planteles, personal);

    console.log('\n========================================================================');
    console.log('🎉 SINCRONIZACIÓN MAESTRA COMPLETADA CON ÉXITO.');
    console.log('========================================================================');
  } catch (err) {
    if (err.message === 'RESOURCE_EXHAUSTED_429') {
      console.log('\n⚠️ Cuota de Firestore alcanzada durante la extracción.');
    } else {
      console.error('Error durante la sincronización:', err);
    }
  }
}

main();
