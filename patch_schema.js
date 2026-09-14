const fs = require('fs');
const path = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Modificar sweepZeros
const szTarget = `          const sweepZeros = (obj) => {
              Object.keys(obj).forEach(key => {
                  if (obj[key] === 0) {
                      delete obj[key];
                  } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                      sweepZeros(obj[key]);
                      if (Object.keys(obj[key]).length === 0) delete obj[key];
                  }
              });
          };`;

const szReplacement = `          const sweepZeros = (obj) => {
              Object.keys(obj).forEach(key => {
                  // Lista blanca de propiedades globales que NO deben ser eliminadas aunque estén en 0 o vacías
                  const whitelist = ['modalidades', 'adulto', 'especial', 'total-gen-fem', 'total-gen-mas', 'total-gen', 'total-vac-gen-fem', 'total-vac-gen-mas', 'total-vac-gen'];
                  if (whitelist.includes(key)) return;

                  if (obj[key] === 0) {
                      delete obj[key];
                  } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                      sweepZeros(obj[key]);
                      // No eliminar el objeto si es una de las llaves principales obligatorias
                      const reqKeys = ['basica', 'media'];
                      if (Object.keys(obj[key]).length === 0 && !reqKeys.includes(key)) {
                          delete obj[key];
                      }
                  }
              });
          };`;

if (content.includes(szTarget)) {
    content = content.replace(szTarget, szReplacement);
} else {
    console.log("Could not find sweepZeros target.");
}

// 2. Modificar matricula init
const matInitTarget = `          // ── MATRÍCULA ─────────────────────────────────────────────────────
          const matricula = {
              basica: {},
              media: {},
              total: matTotal
          };`;

const matInitReplacement = `          // ── MATRÍCULA ─────────────────────────────────────────────────────
          const matricula = {
              basica: {},
              media: {},
              modalidades: {
                  adulto: {},
                  especial: {}
              },
              'total-gen-fem': 0,
              'total-gen-mas': 0,
              'total-gen': 0,
              'total-vac-gen-fem': 0,
              'total-vac-gen-mas': 0,
              'total-vac-gen': 0
          };`;

if (content.includes(matInitTarget)) {
    content = content.replace(matInitTarget, matInitReplacement);
} else {
    console.log("Could not find matricula init target.");
}

// 3. Modificar totals calc
const mgTarget = `          // ── 6. TOTAL GENERAL MEDIA ────────────────────────────────────────
          if (matricula.media['media-general'] || matricula.media['media-tecnica']) {
              const mgF = matricula.media['media-general']?.['total-med-fem'] || 0;
              const mgM = matricula.media['media-general']?.['total-med-mas'] || 0;
              const mtF = matricula.media['media-tecnica']?.['total-med-fem'] || 0;
              const mtM = matricula.media['media-tecnica']?.['total-med-mas'] || 0;
              matricula.media['total-gen-med'] = {
                  fem:   mgF + mtF,
                  mas:   mgM + mtM,
                  total: mgF + mtF + mgM + mtM
              };
          }`;

const mgReplacement = `          // ── 6. TOTAL GENERAL MEDIA ────────────────────────────────────────
          if (matricula.media['media-general'] || matricula.media['media-tecnica']) {
              const mgF = matricula.media['media-general']?.['total-med-fem'] || 0;
              const mgM = matricula.media['media-general']?.['total-med-mas'] || 0;
              const mtF = matricula.media['media-tecnica']?.['total-med-fem'] || 0;
              const mtM = matricula.media['media-tecnica']?.['total-med-mas'] || 0;
              matricula.media['total-gen-med'] = {
                  fem:   mgF + mtF,
                  mas:   mgM + mtM,
                  total: mgF + mtF + mgM + mtM
              };
          }

          // ── SUMA GLOBAL DE MATRÍCULA (Básica + Media) ─────────────────────
          let sumFem = 0, sumMas = 0, sumVacFem = 0, sumVacMas = 0;
          if (matricula.basica['20000']) {
              sumFem += (matricula.basica['20000'].maternal?.['total-mat-fem'] || 0) + (matricula.basica['20000'].preescolar?.['total-pre-fem'] || 0);
              sumMas += (matricula.basica['20000'].maternal?.['total-mat-mas'] || 0) + (matricula.basica['20000'].preescolar?.['total-pre-mas'] || 0);
              sumVacFem += (matricula.basica['20000'].maternal?.['total-vac-mat-fem'] || 0) + (matricula.basica['20000'].preescolar?.['total-vac-pre-fem'] || 0);
              sumVacMas += (matricula.basica['20000'].maternal?.['total-vac-mat-mas'] || 0) + (matricula.basica['20000'].preescolar?.['total-vac-pre-mas'] || 0);
          }
          if (matricula.basica['21000']) {
              sumFem += matricula.basica['21000']['total-21000-fem'] || 0;
              sumMas += matricula.basica['21000']['total-21000-mas'] || 0;
              sumVacFem += matricula.basica['21000']['total-vac-21000-fem'] || 0;
              sumVacMas += matricula.basica['21000']['total-vac-21000-mas'] || 0;
          }
          if (matricula.media['total-gen-med']) {
              sumFem += matricula.media['total-gen-med'].fem || 0;
              sumMas += matricula.media['total-gen-med'].mas || 0;
          }
          
          matricula['total-gen-fem'] = sumFem;
          matricula['total-gen-mas'] = sumMas;
          matricula['total-gen'] = sumFem + sumMas;
          matricula['total-vac-gen-fem'] = sumVacFem;
          matricula['total-vac-gen-mas'] = sumVacMas;
          matricula['total-vac-gen'] = sumVacFem + sumVacMas;`;

if (content.includes(mgTarget)) {
    content = content.replace(mgTarget, mgReplacement);
} else {
    console.log("Could not find mgTarget target.");
}

// 4. Update the onSnapshot listener AND the static load to use total-gen
const listenerTarget = `              const inpMatTotal = document.getElementById('inp-matricula-total');
              if (inpMatTotal && liveData.matricula && liveData.matricula.total !== undefined) {
                  inpMatTotal.value = liveData.matricula.total;
              }`;

const listenerReplacement = `              const inpMatTotal = document.getElementById('inp-matricula-total');
              if (inpMatTotal && liveData.matricula && liveData.matricula['total-gen'] !== undefined) {
                  inpMatTotal.value = liveData.matricula['total-gen'];
              }`;

if (content.includes(listenerTarget)) {
    content = content.replace(listenerTarget, listenerReplacement);
} else {
    console.log("Could not find listener target.");
}

const loadTarget = `document.getElementById('inp-matricula-total').value = dp.matricula?.total || '';`;
const loadReplacement = `document.getElementById('inp-matricula-total').value = dp.matricula?.['total-gen'] || '';`;

if (content.includes(loadTarget)) {
    content = content.replace(loadTarget, loadReplacement);
} else {
    console.log("Could not find static load target.");
}

fs.writeFileSync(path, content, 'utf8');
console.log("Patch aplicado correctamente.");
