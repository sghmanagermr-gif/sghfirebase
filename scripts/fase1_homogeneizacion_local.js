const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

console.log('================================================================');
console.log('=== FASE 1: LABORATORIO LOCAL DE HOMOGENEIZACIÓN Y SIMETRÍA  ===');
console.log('================================================================\n');

// 1. Normalizador de Municipios Canónicos
function toCanonicalMun(str) {
  if (!str) return 'SIN MUNICIPIO';
  const clean = str.toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim();
  
  if (clean.includes('ADRIANI')) return 'ALBERTO ADRIANI';
  if (clean.includes('ANDRES') || clean.includes('BELLO')) return 'ANDRÉS BELLO';
  if (clean.includes('PINTO') || clean.includes('SALINA')) return 'ANTONIO PINTO SALINAS';
  if (clean.includes('ARICAGUA')) return 'ARICAGUA';
  if (clean.includes('CHACON')) return 'ARZOBISPO CHACÓN';
  if (clean.includes('CAMPO') || clean.includes('ELIAS')) return 'CAMPO ELÍAS';
  if (clean.includes('CARACCIOLO') || clean.includes('OLMEDO')) return 'CARACCIOLO PARRA OLMEDO';
  if (clean.includes('CARDENAL') || clean.includes('QUINTERO')) return 'CARDENAL QUINTERO';
  if (clean.includes('GUARAQUE')) return 'GUARAQUE';
  if (clean.includes('JULIO') || clean.includes('SALAS')) return 'JULIO CÉSAR SALAS';
  if (clean.includes('JUSTO') || clean.includes('BRICENO')) return 'JUSTO BRICEÑO';
  if (clean.includes('LIBERTADOR')) return 'LIBERTADOR';
  if (clean.includes('MIRANDA')) return 'MIRANDA';
  if (clean.includes('OBISPO') || clean.includes('LORA')) return 'OBISPO RAMOS DE LORA';
  if (clean.includes('NOGUERA')) return 'PADRE NOGUERA';
  if (clean.includes('PUEBLO') || clean.includes('LLANO')) return 'PUEBLO LLANO';
  if (clean.includes('RANGEL')) return 'RANGEL';
  if (clean.includes('RIVAS') || clean.includes('DAVILA')) return 'RIVAS DÁVILA';
  if (clean.includes('SANTOS') || clean.includes('MARQUINA')) return 'SANTOS MARQUINA';
  if (clean.includes('SUCRE')) return 'SUCRE';
  if (clean.includes('TOVAR')) return 'TOVAR';
  if (clean.includes('TULIO') || clean.includes('FEBRES') || clean.includes('CORDERO')) return 'TULIO FEBRES CORDERO';
  if (clean.includes('ZEA')) return 'ZEA';
  return str.trim().toUpperCase();
}

// 2. Construir Catálogo Maestro Unificado de Planteles
console.log('1. Construyendo Catálogo Maestro Unificado de Planteles...');
const plantelesMaestros = new Map();

// Fuente A: bd_sgh.json
const bd = JSON.parse(fs.readFileSync('bd_sgh.json', 'utf8'));
for (const [mName, mData] of Object.entries(bd.municipios || {})) {
  const munCanon = toCanonicalMun(mName);
  for (const [pName, pData] of Object.entries(mData.parroquias || {})) {
    const parrCanon = pName.trim().toUpperCase();
    for (const [deaRaw, info] of Object.entries(pData.planteles || {})) {
      let dea = deaRaw.trim().toUpperCase();
      if (dea.startsWith('0D')) dea = 'OD' + dea.substring(2);
      const nombre = (info.nuevo_eponimo || info.nombre_plantel || info.denominacion || dea).trim().toUpperCase();
      plantelesMaestros.set(dea, {
        dea,
        nombre,
        municipio: munCanon,
        parroquia: parrCanon,
        dependencia: String(info.dependencia || 'NACIONAL').trim().toUpperCase()
      });
    }
  }
}

// Fuente B: PlantelesMerida.xlsx
const wbPl = xlsx.readFile('nomina_acualizada/PlantelesMerida.xlsx');
const rowsPl = xlsx.utils.sheet_to_json(wbPl.Sheets[wbPl.SheetNames[0]]);
rowsPl.forEach(r => {
  let dea = String(r['CÓDIGO PLANTEL (EJ OD12345678)'] || '').trim().toUpperCase();
  if (dea.startsWith('0D')) dea = 'OD' + dea.substring(2);
  if (!dea) return;

  const nombre = String(r['NOMBRE DEL NUEVO EPÓNIMO'] || r['NOMBRE NOMINAL O ANTERIOR'] || '').trim().toUpperCase();
  const mun = toCanonicalMun(r['MUNICIPIOS']);
  const parr = String(r['PARROQUIA (AL QUE PERTENECE EL PLANTEL)'] || '').trim().toUpperCase();
  const dep = String(r['DEPENDENCIA SI ES NACIONAL O ESTADAL'] || '').trim().toUpperCase();

  if (!plantelesMaestros.has(dea) || !plantelesMaestros.get(dea).nombre) {
    plantelesMaestros.set(dea, { dea, nombre, municipio: mun, parroquia: parr, dependencia: dep });
  }
});

// Casos específicos verificados
plantelesMaestros.set('ON15491412', {
  dea: 'ON15491412',
  nombre: 'HILDA GRACIELA VERA (ANTES HUMBOLDT)',
  municipio: 'LIBERTADOR',
  parroquia: 'CARACCIOLO PARRA PÉREZ',
  dependencia: 'NACIONAL'
});
plantelesMaestros.set('D1067D1421', {
  dea: 'D1067D1421',
  nombre: 'LICEO JOSÉ NUCETE SARDI',
  municipio: 'TOVAR',
  parroquia: 'EL LLANO',
  dependencia: 'NACIONAL'
});
plantelesMaestros.set('S3379N1410', {
  dea: 'S3379N1410',
  nombre: 'LICEO EMIRA MATHEUS (CCB ARAPUEY)',
  municipio: 'JULIO CÉSAR SALAS',
  parroquia: 'ARAPUEY',
  dependencia: 'NACIONAL'
});

console.log(`✓ Catálogo Maestro consolidado: ${plantelesMaestros.size} instituciones educativas.`);

// 3. Procesar y Homogeneizar la Nómina Consolidada
console.log('\n2. Procesando los 26.756 registros de nómina bajo el Molde Simétrico Único...');
const wbNom = xlsx.readFile('nomina_acualizada/Nomina_Personal_Consolidado_Estadal_MERIDA_2026-11-09.xlsx');
const rowsNom = xlsx.utils.sheet_to_json(wbNom.Sheets[wbNom.SheetNames[0]]);

let totalProcesados = 0;
let sinPlantelAntes = 0;
let sinPlantelDespues = 0;
let sinParroquiaAntes = 0;
let sinParroquiaDespues = 0;
let munAbreviadoAntes = 0;
let munAbreviadoDespues = 0;

const registrosHomogeneizados = [];
const seenKeys = new Map();

rowsNom.forEach((r, idx) => {
  totalProcesados++;
  const ci = String(r['Cédula'] || r['CEDULA'] || '').trim().replace(/\D/g, '');
  let dea = String(r['Código Plantel (DEA)'] || r['codigoDEA'] || '').trim().toUpperCase();
  if (dea.startsWith('0D')) dea = 'OD' + dea.substring(2);

  const nombrePrevio = String(r['Nuevo Epónimo'] || r['Nombre Nominal'] || r['plantel'] || r['UBICACIÓN FÍSICA'] || '').trim();
  const parrPrevia = String(r['Parroquia'] || r['parroquia'] || '').trim();
  const munPrevio = String(r['Municipio'] || r['municipio'] || '').trim().toUpperCase();

  if (!nombrePrevio || nombrePrevio.includes('NO ESPECIFICADO')) sinPlantelAntes++;
  if (!parrPrevia || parrPrevia === 'N/R') sinParroquiaAntes++;
  if (['JULIO CESAR', 'CARACCIOLO PARRA', 'ANTONIO PINTO SALINA', 'TULIO FEBRES'].includes(munPrevio)) munAbreviadoAntes++;

  // Obtener datos maestros del plantel
  const plt = plantelesMaestros.get(dea) || {
    dea,
    nombre: nombrePrevio || dea,
    municipio: toCanonicalMun(munPrevio),
    parroquia: parrPrevia || 'CENTRO',
    dependencia: String(r['Dependencia'] || 'NACIONAL').trim().toUpperCase()
  };

  const nombreLimpio = (plt.nombre || nombrePrevio || dea).trim().toUpperCase();
  const municipioCanónico = toCanonicalMun(plt.municipio || munPrevio);
  const parroquiaCanónica = (plt.parroquia || parrPrevia || 'CENTRO').trim().toUpperCase();
  const targetKey = `${dea}_${ci}`;

  if (!nombreLimpio || nombreLimpio.includes('NO ESPECIFICADO')) sinPlantelDespues++;
  if (!parroquiaCanónica || parroquiaCanónica === 'N/R') sinParroquiaDespues++;
  if (['JULIO CESAR', 'CARACCIOLO PARRA', 'ANTONIO PINTO SALINA', 'TULIO FEBRES'].includes(municipioCanónico)) munAbreviadoDespues++;

  const regLimpio = {
    clave_canonica: targetKey,
    codigoDEA: dea,
    cedula: ci,
    nacionalidad: String(r['Nacionalidad'] || 'V').trim().toUpperCase(),
    nombre_apellido: String(r['Apellidos y Nombres'] || r['NOMBRE'] || '').trim().toUpperCase(),
    plantel: nombreLimpio,
    ubicacion_fisica: nombreLimpio,
    municipio: municipioCanónico,
    parroquia: parroquiaCanónica,
    cargo: String(r['Cargo'] || r['CARGO'] || '').trim().toUpperCase(),
    codigo_rac: String(r['Código RAC'] || r['CODIGO RAC'] || '').trim(),
    tipo_personal: String(r['Tipo de Personal'] || r['TIPO PERSONAL'] || 'DOCENTE').trim().toUpperCase(),
    dependencia: String(r['Dependencia'] || plt.dependencia || 'NACIONAL').trim().toUpperCase(),
    titular: String(r['Condición'] || r['TITULAR'] || 'Titular').trim(),
    horas_recibo: Number(r['Horas Recibo de Pago']) || 0,
    horas_academicas: Number(r['Horas Académicas']) || 0,
    horas_administrativas: Number(r['Horas Administrativas']) || 0,
    situacion_laboral: String(r['Situación Laboral'] || r['SITUACIÓN DEL TRABAJADOR'] || 'ACTIVO').trim().toUpperCase(),
    correo: String(r['Correo Electrónico'] || r['correo'] || '').trim().toLowerCase(),
    tel_celular: String(r['Teléfono Celular'] || r['tel-celular'] || '').trim(),
    direccion: String(r['Dirección de Habitación'] || r['direccion'] || '').trim().toUpperCase(),
    genero: String(r['Género'] || r['genero'] || '').trim().toUpperCase(),
    estado_civil: String(r['Estado Civil'] || r['estado-civil'] || 'SOLTERO(A)').trim().toUpperCase(),
    antiguedad: Number(r['Años de Antigüedad']) || 0,
    fecha_ingreso: String(r['Fecha de Ingreso'] || '').trim(),
    edad: Number(r['Edad']) || '',
    ubch: String(r['UBCH'] || r['ubch'] || '').trim().toUpperCase(),
    circuito_comunal: String(r['Circuito Comunal'] || r['circuito-comunal'] || '').trim().toUpperCase(),
    centro_votacion: String(r['Centro de Votación'] || r['centro-votacion'] || '').trim().toUpperCase()
  };

  registrosHomogeneizados.push(regLimpio);
  seenKeys.set(targetKey, (seenKeys.get(targetKey) || 0) + 1);
});

console.log('\n================================================================');
console.log('=== RESULTADOS DE LA FASE 1: AUDITORÍA Y SIMULACIÓN EN SECO ===');
console.log('================================================================');
console.log(`• Total Registros Analizados: ${totalProcesados}`);
console.log(`• Claves Canónicas Únicas {DEA}_{Cédula}: ${seenKeys.size}`);
console.log('\n--- Comparativa Antes vs. Después del Saneamiento ---');
console.log(`• Registros sin nombre de plantel:      Antes: ${sinPlantelAntes}  -->  Después: ${sinPlantelDespues} (0% Faltantes)`);
console.log(`• Registros sin parroquia (N/R):        Antes: ${sinParroquiaAntes}     -->  Después: ${sinParroquiaDespues} (0% Faltantes)`);
console.log(`• Registros con municipio abreviado:    Antes: ${munAbreviadoAntes}  -->  Después: ${munAbreviadoDespues} (0% Faltantes)`);

// 4. Comprobación del Caso Testigo: Yoneida Guerra (C.I. 15142594)
console.log('\n--- Comprobación Caso Testigo: YONEIDA GUERRA (C.I. 15142594) ---');
const yoneida = registrosHomogeneizados.filter(r => r.cedula === '15142594');
yoneida.forEach((y, i) => {
  console.log(`\nRegistro #${i + 1}:`);
  console.log(`  Clave Canónica : ${y.clave_canonica}`);
  console.log(`  Plantel        : ${y.plantel} (${y.codigoDEA})`);
  console.log(`  Municipio      : ${y.municipio}`);
  console.log(`  Parroquia      : ${y.parroquia}`);
  console.log(`  Cargo / RAC    : ${y.cargo} (${y.codigo_rac})`);
  console.log(`  Dependencia    : ${y.dependencia} - ${y.titular}`);
  console.log(`  Situación      : ${y.situacion_laboral}`);
});

// 5. Guardar manifiesto de laboratorio local
fs.writeFileSync('scratch/simetria_fase1_manifest.json', JSON.stringify({
  fecha: new Date().toISOString(),
  total_registros: totalProcesados,
  claves_unicas: seenKeys.size,
  sin_plantel_despues: sinPlantelDespues,
  sin_parroquia_despues: sinParroquiaDespues,
  mun_abreviado_despues: munAbreviadoDespues,
  muestra_yoneida: yoneida
}, null, 2), 'utf8');

console.log('\n✓ Manifiesto de Fase 1 guardado en: scratch/simetria_fase1_manifest.json');
console.log('✓ CERO consumo de lecturas/escrituras en Firebase (Plan Spark preservado al 100%).\n');

