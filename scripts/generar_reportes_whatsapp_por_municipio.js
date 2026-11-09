const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

console.log('=== GENERANDO REPORTES WHATSAPP DE FUNCIONARIOS POR MUNICIPIO ===');

// 1. Cargar metadatos completos de RAC.xlsx
const wbRac = xlsx.readFile('RAC.xlsx');
const wsRac = wbRac.Sheets['PERSONAL'];
const rowsRac = xlsx.utils.sheet_to_json(wsRac, { header: 1 });
const headerRac = rowsRac[0];

const colCedula = headerRac.indexOf('CEDULA');
const colNombre = headerRac.indexOf('NOMBRE Y APELLIDO');
const colPlantelDea = headerRac.indexOf('CODIGO DEL PLANTEL');
const colNombrePlantel = headerRac.indexOf('UBICACIÓN FÍSICA');
const colCargo = headerRac.indexOf('CARGO');
const colHorasAcad = headerRac.indexOf('HORAS ACADEMICAS');
const colHorasAdm = headerRac.indexOf('HORAS ADMINISTRATIVAS');
const colTitular = headerRac.indexOf('TITULAR');
const colTipoPersonal = headerRac.indexOf('TIPO PERSONAL');
const colDependencia = headerRac.indexOf('DEPENDENCIA');

const racMapByDeaCi = new Map();
const racMapByCi = new Map();

for (let i = 1; i < rowsRac.length; i++) {
  const r = rowsRac[i];
  if (!r) continue;
  const ced = String(r[colCedula] || '').trim().replace(/\D/g, '');
  let dea = String(r[colPlantelDea] || '').trim().toUpperCase();
  if (dea.startsWith('0D')) dea = 'OD' + dea.substring(2);
  if (!ced) continue;

  const key = `${dea}_${ced}`;
  racMapByDeaCi.set(key, r);
  if (!racMapByCi.has(ced)) racMapByCi.set(ced, r);
}

// 2. Cargar resumen de huérfanos
const resumen = JSON.parse(fs.readFileSync('scratch/resumen_global_huerfanos_rac.json', 'utf8'));

// Crear directorio si no existe
const outDir = path.resolve('huerfanos', 'reportes_whatsapp_por_municipio');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function formatCedula(ci) {
  const s = String(ci).trim().replace(/\D/g, '');
  if (s.length <= 3) return s;
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function cleanFilename(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

const masterReportLines = [
  '*GOBERNACIÓN DEL ESTADO BOLIVARIANO DE MÉRIDA*',
  '*CENTRO REGIONAL DE DESARROLLO DE LA CALIDAD EDUCATIVA (CRDCE)*',
  '*SISTEMA DE GESTIÓN HUMANA (SGH)*',
  '',
  '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
  '*CONSOLIDADO ESTADAL: FUNCIONARIOS REGULARIZADOS EN CARGA MASIVA DEL RAC*',
  '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
  '',
  'A continuación se detalla la nómina completa de los 1.891 funcionarios incorporados a la plataforma SGH Mérida por municipio y por plantel educativo:',
  ''
];

const municipiosKeys = Object.keys(resumen.porMunicipio).sort((a, b) => a.localeCompare(b));
let totalGeneralFuncionarios = 0;

for (const mun of municipiosKeys) {
  const dataMun = resumen.porMunicipio[mun];
  const plantelesKeys = Object.keys(dataMun.planteles).sort((a, b) => a.localeCompare(b));

  let totalMunFuncionarios = 0;
  plantelesKeys.forEach(d => {
    totalMunFuncionarios += dataMun.planteles[d].personal.length;
  });
  totalGeneralFuncionarios += totalMunFuncionarios;

  const munReportLines = [
    '*INFORME OFICIAL: FUNCIONARIOS REGULARIZADOS (CARGA MASIVA RAC)*',
    `*MUNICIPIO ${mun} – ESTADO BOLIVARIANO DE MÉRIDA*`,
    '',
    'Saludos cordiales. Se informa formalmente la incorporación y vinculación al Sistema SGH de los siguientes funcionarios que laboran en las instituciones del municipio y figuraban pendientes en nómina ministerial RAC:',
    '',
    '*DATOS RESUMEN:*',
    `• *Municipio:* ${mun}`,
    `• *Total Funcionarios Regularizados:* ${totalMunFuncionarios}`,
    `• *Planteles Educativos Atendidos:* ${plantelesKeys.length}`,
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '*DETALLE DE PERSONAL POR INSTITUCIÓN EDUCATIVA:*',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    ''
  ];

  masterReportLines.push(`\n════════════════════════════════════════════════════════════`);
  masterReportLines.push(`🏛️ *MUNICIPIO ${mun}* (Total: ${totalMunFuncionarios} funcionarios en ${plantelesKeys.length} planteles)`);
  masterReportLines.push(`════════════════════════════════════════════════════════════\n`);

  for (const deaOriginal of plantelesKeys) {
    let dea = deaOriginal.trim().toUpperCase();
    if (dea.startsWith('0D')) dea = 'OD' + dea.substring(2);

    const plt = dataMun.planteles[deaOriginal];
    const personal = plt.personal;
    const nombrePlantel = (plt.nombre || dea).trim().toUpperCase();

    const headerPlantel = `📍 *${dea} - ${nombrePlantel}* (${personal.length}):`;
    munReportLines.push(headerPlantel);
    masterReportLines.push(headerPlantel);

    personal.forEach(p => {
      const ci = String(p.cedula).trim().replace(/\D/g, '');
      const key = `${dea}_${ci}`;
      const r = racMapByDeaCi.get(key) || racMapByCi.get(ci) || {};

      const nombre = String(r[colNombre] || p.nombre || '').trim().toUpperCase();
      const cargo = String(r[colCargo] || p.cargo || '').trim().toUpperCase();
      const tipo = String(r[colTipoPersonal] || p.tipo || '').trim().toUpperCase();
      const dep = String(r[colDependencia] || p.dep || 'NACIONAL').trim().toUpperCase();
      const titular = String(r[colTitular] || p.titular || 'SI').trim().toUpperCase();
      const hrsAcad = Number(r[colHorasAcad]) || 0;
      const hrsAdm = Number(r[colHorasAdm]) || 0;
      const hrs = hrsAcad + hrsAdm > 0 ? hrsAcad + hrsAdm : (p.hrs || 0);
      const condicion = (titular === 'SI' || titular === 'TITULAR') ? 'Titular' : 'Contratado';

      const linePers = `• *${nombre}* | C.I. V-${formatCedula(ci)}\n  _Cargo:_ ${cargo} (${hrs} hrs - ${condicion}) – _Tipo:_ ${tipo} (${dep}) – Activo(a)`;
      munReportLines.push(linePers);
      masterReportLines.push(linePers);
    });

    munReportLines.push('');
    masterReportLines.push('');
  }

  munReportLines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  munReportLines.push('*Dirección de Gestión Humana - CRDCE Mérida*');
  munReportLines.push('_Sistema SGH Mérida v2.31.1_');

  // Guardar archivo individual del municipio
  const filenameMun = `reporte_whatsapp_${cleanFilename(mun)}.txt`;
  fs.writeFileSync(path.join(outDir, filenameMun), munReportLines.join('\n'), 'utf8');
}

masterReportLines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
masterReportLines.push(`*TOTAL GENERAL ESTADAL REGULARIZADO:* ${totalGeneralFuncionarios} funcionarios en 23 municipios.`);
masterReportLines.push('*Dirección de Gestión Humana - CRDCE Mérida*');
masterReportLines.push('_Sistema SGH Mérida v2.31.1_');

const masterPath = path.resolve('huerfanos', 'reporte_whatsapp_todos_los_municipios.txt');
fs.writeFileSync(masterPath, masterReportLines.join('\n'), 'utf8');

console.log(`✓ Generados 23 reportes individuales en: ${outDir}`);
console.log(`✓ Generado reporte maestro consolidado en: ${masterPath}`);

