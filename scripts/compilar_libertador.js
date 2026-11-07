const fs = require('fs');
const xlsx = require('xlsx');

function loadFileRows(f) {
  const wb = xlsx.readFile('huerfanos/' + f);
  const sheetName = wb.SheetNames[0];
  const rows = xlsx.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });
  let hIdx = rows.findIndex(r => r && r.some(c => String(c).includes('Código') || String(c).includes('C.I')));
  const headers = rows[hIdx].map(h => String(h || '').trim());
  const ciCol = headers.findIndex(h => h.toUpperCase().includes('C.I'));
  const nomCol = headers.findIndex(h => h.toUpperCase().includes('NOMBRE'));
  const deaCol = headers.findIndex(h => h.toUpperCase().includes('CÓDIGO') || h.toUpperCase().includes('CODIGO'));

  const data = [];
  for (let i = hIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r.some(c => c !== null && c !== undefined && String(c).trim() !== '')) continue;
    const rawCi = String(r[ciCol] || '').trim();
    const ci = rawCi.replace(/[^0-9]/g, '');
    if (!ci && !r[nomCol]) continue;

    let origen = f;
    if (f === 'libertador1.xlsx' && r[9]) {
      origen = `libertador1.xlsx (${r[9]})`;
    }

    data.push({
      circuito: r[0] != null ? String(r[0]).trim() : '',
      institucion: r[1] != null ? String(r[1]).trim() : '',
      codigoPlantel: r[deaCol] != null ? String(r[deaCol]).trim().toUpperCase() : '',
      dependencia: r[3] != null ? String(r[3]).trim() : '',
      nombre: r[nomCol] != null ? String(r[nomCol]).trim() : '',
      ciRaw: rawCi,
      ci: ci,
      cargo: r[6] != null ? String(r[6]).trim() : '',
      telefono: r[7] != null ? String(r[7]).trim() : '',
      observaciones: r[8] != null ? String(r[8]).trim() : '',
      archivoOrigen: origen
    });
  }
  return data;
}

function main() {
  console.log('=== COMPILADOR OFICIAL LIBERTADOR.XLSX ===\n');

  const d1 = loadFileRows('libertador1.xlsx');
  const d2 = loadFileRows('libertador2.xlsx');
  const d3 = loadFileRows('libertador3.xlsx');

  console.log(`libertador1.xlsx: ${d1.length} funcionarios`);
  console.log(`libertador2.xlsx: ${d2.length} funcionarios`);
  console.log(`libertador3.xlsx: ${d3.length} funcionarios`);

  const all = [...d1, ...d2, ...d3];
  console.log(`Total consolidado: ${all.length} funcionarios`);

  // Detectar repetidos por cédula
  const ciCount = new Map();
  for (const item of all) {
    if (item.ci) {
      ciCount.set(item.ci, (ciCount.get(item.ci) || 0) + 1);
    }
  }

  for (const item of all) {
    item.repetido = (item.ci && ciCount.get(item.ci) > 1) ? 'SI' : 'NO';
  }

  const repetidosCount = all.filter(x => x.repetido === 'SI').length;
  console.log(`Registros con cédula repetida: ${repetidosCount}`);

  // 1. Matriz para la hoja consolidada
  const headerRow = [
    'Circuito',
    'Institución',
    'Código de plantel',
    'Dependencia',
    'Nombre del funcionario',
    'C.I.',
    'Cargo',
    'Teléfono',
    'Observaciones',
    'Archivo de origen',
    '¿Repetido?'
  ];

  const consolidadoRows = [
    ['PERSONAL AGREGADO AL SISTEMA EN JULIO QUE NO APARECE EN ESTA FASE — CONSOLIDADO GENERAL (LIBERTADOR 1, 2 Y 3)'],
    [`Compilación unificada: libertador1.xlsx (${d1.length}) + libertador2.xlsx (${d2.length}) + libertador3.xlsx (${d3.length}) = Total ${all.length} registros`],
    headerRow
  ];

  for (const item of all) {
    consolidadoRows.push([
      item.circuito,
      item.institucion,
      item.codigoPlantel,
      item.dependencia,
      item.nombre,
      item.ciRaw,
      item.cargo,
      item.telefono,
      item.observaciones,
      item.archivoOrigen,
      item.repetido
    ]);
  }

  // 2. Crear Workbook
  const wb = xlsx.utils.book_new();

  // Hoja 1: Personal Consolidado
  const wsConsolidado = xlsx.utils.aoa_to_sheet(consolidadoRows);
  // Ajuste de anchos de columna
  wsConsolidado['!cols'] = [
    { wch: 10 }, // Circuito
    { wch: 42 }, // Institución
    { wch: 20 }, // Código de plantel
    { wch: 15 }, // Dependencia
    { wch: 38 }, // Nombre
    { wch: 15 }, // C.I.
    { wch: 28 }, // Cargo
    { wch: 15 }, // Teléfono
    { wch: 45 }, // Observaciones
    { wch: 30 }, // Archivo origen
    { wch: 12 }  // Repetido
  ];
  xlsx.utils.book_append_sheet(wb, wsConsolidado, 'Personal Consolidado');

  // Hoja 2: Resumen Estadístico
  const deasUnicos = new Set(all.map(x => x.codigoPlantel).filter(Boolean));
  const circuitosUnicos = new Set(all.map(x => x.circuito).filter(Boolean));
  const cedulasUnicas = new Set(all.map(x => x.ci).filter(Boolean));

  const resumenRows = [
    ['RESUMEN ESTADÍSTICO - MUNICIPIO LIBERTADOR CONSOLIDADO'],
    [''],
    ['Métrica', 'Valor'],
    ['Total Registros Consolidados', all.length],
    ['Cédulas Únicas', cedulasUnicas.size],
    ['Cédulas Repetidas (Ocurrencias)', repetidosCount],
    ['Planteles Únicos (Códigos DEA)', deasUnicos.size],
    ['Circuitos Educativos', circuitosUnicos.size],
    [''],
    ['Desglose por Archivo Fuente', 'Cantidad'],
    ['libertador1.xlsx', d1.length],
    ['libertador2.xlsx', d2.length],
    ['libertador3.xlsx', d3.length]
  ];
  const wsResumen = xlsx.utils.aoa_to_sheet(resumenRows);
  wsResumen['!cols'] = [{ wch: 35 }, { wch: 15 }];
  xlsx.utils.book_append_sheet(wb, wsResumen, 'Resumen');

  // 3. Escribir archivo consolidado
  const outPath = 'huerfanos/libertador.xlsx';
  xlsx.writeFile(wb, outPath);
  console.log(`\n✓ Archivo compilado exitosamente en: ${outPath}`);
}

main();

