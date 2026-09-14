const fs = require('fs');

const mainPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\main.js';
let src = fs.readFileSync(mainPath, 'utf8');

// ─── NUEVO onsubmit (implementación limpia basada en el esquema JSON oficial) ───
const NEW_ONSUBMIT = `      form.onsubmit = async (e) => {
          e.preventDefault();
          const btn = form.querySelector('button[type="submit"]');
          if (!btn) return;
          btn.textContent = "Guardando...";
          btn.disabled = true;

          // ── GUARD: Datos Incompletos ──────────────────────────────────────
          const matTotal = parseInt(document.getElementById('lbl-matricula-total')?.textContent) || 0;
          let secTotal = 0;
          secTotal += parseInt(document.getElementById('secMat')?.value) || 0;
          secTotal += parseInt(document.getElementById('secPre')?.value) || 0;
          secTotal += parseInt(document.getElementById('secPri')?.value) || 0;
          document.querySelectorAll('.sec-anio-input').forEach(inp => {
              const b1 = inp.closest('div[id^="bloque-"]');
              const b2 = inp.closest('#cont-secciones-detalle');
              if ((b1 && b1.style.display !== 'none') || (b2 && b2.style.display !== 'none')) {
                  secTotal += parseInt(inp.value) || 0;
              }
          });

          if (matTotal === 0 && secTotal === 0 && !window._forceSaveIncompleta) {
              const modalInc = document.getElementById('modal-confirm-incompleta');
              if (modalInc) modalInc.style.display = 'flex';
              btn.textContent = "Guardar Datos y Continuar";
              btn.disabled = false;
              return;
          }
          window._forceSaveIncompleta = false;

          // ── HELPERS ───────────────────────────────────────────────────────
          /** Verifica si el input está dentro de un bloque visible del DOM */
          const isVisible = (el) => {
              const b1 = el.closest('div[id^="bloque-"]');
              const b2 = el.closest('#cont-secciones-detalle');
              return (b1 && b1.style.display !== 'none') || (b2 && b2.style.display !== 'none');
          };

          /** Escoba Digital: elimina claves con valor 0 u objetos vacíos */
          const sweepZeros = (obj) => {
              Object.keys(obj).forEach(key => {
                  if (obj[key] === 0) {
                      delete obj[key];
                  } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                      sweepZeros(obj[key]);
                      if (Object.keys(obj[key]).length === 0) delete obj[key];
                  }
              });
          };

          // ── SECCIONES-PLANES ──────────────────────────────────────────────
          const seccionesPlanes = {};

          // 20000/maternal: se cuenta 1 box-F por sección
          if (document.getElementById('bloque-inicial')?.style.display !== 'none') {
              document.querySelectorAll('.mat-input.mat-maternal[data-sexo="F"]').forEach(inp => {
                  if (!isVisible(inp)) return;
                  const secLetra = inp.dataset.grupo.split('-')[1];
                  if (!seccionesPlanes['20000']) seccionesPlanes['20000'] = {};
                  if (!seccionesPlanes['20000'].maternal) seccionesPlanes['20000'].maternal = {};
                  seccionesPlanes['20000'].maternal[secLetra] = 1;
              });

              // 20000/preescolar
              document.querySelectorAll('.mat-input.mat-preescolar[data-sexo="F"]').forEach(inp => {
                  if (!isVisible(inp)) return;
                  const secLetra = inp.dataset.grupo.split('-')[1];
                  if (!seccionesPlanes['20000']) seccionesPlanes['20000'] = {};
                  if (!seccionesPlanes['20000'].preescolar) seccionesPlanes['20000'].preescolar = {};
                  seccionesPlanes['20000'].preescolar[secLetra] = 1;
              });
          }

          // 21000/primaria: valor = cantidad de grados que tienen esa letra
          if (document.getElementById('bloque-primaria')?.style.display !== 'none') {
              document.querySelectorAll('.mat-input.mat-primaria[data-sexo="F"]').forEach(inp => {
                  if (!isVisible(inp)) return;
                  const match = inp.dataset.grupo.match(/primaria-(\d)([A-Z])/);
                  if (!match) return;
                  const secLetra = match[2];
                  if (!seccionesPlanes['21000']) seccionesPlanes['21000'] = {};
                  seccionesPlanes['21000'][secLetra] = (seccionesPlanes['21000'][secLetra] || 0) + 1;
              });
          }

          // Media: secciones por año de cada plan
          document.querySelectorAll('.sec-anio-input').forEach(inp => {
              if (!isVisible(inp)) return;
              const plan = inp.dataset.plan;
              const anio = inp.dataset.anio;
              const val = parseInt(inp.value) || 0;
              if (val > 0) {
                  if (!seccionesPlanes[plan]) seccionesPlanes[plan] = {};
                  seccionesPlanes[plan][anio] = val;
              }
          });

          // ── MATRÍCULA ─────────────────────────────────────────────────────
          const matricula = {
              basica: {},
              media: {},
              total: matTotal
          };

          // ── 1. MATERNAL ───────────────────────────────────────────────────
          if (seccionesPlanes['20000']?.maternal) {
              const materna = {};
              let tMatMas = 0, tMatFem = 0;

              document.querySelectorAll('.mat-input.mat-maternal').forEach(inp => {
                  if (!isVisible(inp)) return;
                  const secLetra = inp.dataset.grupo.split('-')[1];
                  const val = parseInt(inp.value) || 0;
                  if (!materna[secLetra]) materna[secLetra] = { mas: 0, fem: 0 };
                  if (inp.dataset.sexo === 'F') {
                      materna[secLetra].fem += val;
                      tMatFem += val;
                  } else {
                      materna[secLetra].mas += val;
                      tMatMas += val;
                  }
              });

              // Totales dentro de materna
              materna['total-mat-mas'] = tMatMas;
              materna['total-mat-fem'] = tMatFem;
              materna['total-mat']     = tMatMas + tMatFem;

              // Vacantes maternal
              const vacMat = window._VACANTES_TEMP?.maternal || {};
              const vMatObj = {};
              let vMatMas = 0, vMatFem = 0;
              Object.keys(materna).forEach(secLetra => {
                  if (secLetra.length !== 1) return;
                  if (vacMat[secLetra] === 1) {
                      vMatObj[secLetra] = { mas: materna[secLetra].mas, fem: materna[secLetra].fem };
                      vMatMas += materna[secLetra].mas;
                      vMatFem += materna[secLetra].fem;
                  }
              });
              if (Object.keys(vMatObj).length > 0) {
                  materna.vacantes              = vMatObj;
                  materna['total-vac-mat-mas']  = vMatMas;
                  materna['total-vac-mat-fem']  = vMatFem;
                  materna['total-vac-mat']      = vMatMas + vMatFem;
              }

              if (!matricula.basica['20000']) matricula.basica['20000'] = { 'total-20000': 0 };
              matricula.basica['20000'].materna = materna;
              matricula.basica['20000']['total-20000'] += (tMatMas + tMatFem);
          }

          // ── 2. PREESCOLAR ─────────────────────────────────────────────────
          if (seccionesPlanes['20000']?.preescolar) {
              const preescolar = {};
              let tPreMas = 0, tPreFem = 0;

              document.querySelectorAll('.mat-input.mat-preescolar').forEach(inp => {
                  if (!isVisible(inp)) return;
                  const secLetra = inp.dataset.grupo.split('-')[1];
                  const val = parseInt(inp.value) || 0;
                  if (!preescolar[secLetra]) preescolar[secLetra] = { mas: 0, fem: 0 };
                  if (inp.dataset.sexo === 'F') {
                      preescolar[secLetra].fem += val;
                      tPreFem += val;
                  } else {
                      preescolar[secLetra].mas += val;
                      tPreMas += val;
                  }
              });

              preescolar['total-pre-mas'] = tPreMas;
              preescolar['total-pre-fem'] = tPreFem;
              preescolar['total-pre']     = tPreMas + tPreFem;

              // Vacantes preescolar
              const vacPre = window._VACANTES_TEMP?.preescolar || {};
              const vPreObj = {};
              let vPreMas = 0, vPreFem = 0;
              Object.keys(preescolar).forEach(secLetra => {
                  if (secLetra.length !== 1) return;
                  if (vacPre[secLetra] === 1) {
                      vPreObj[secLetra] = { mas: preescolar[secLetra].mas, fem: preescolar[secLetra].fem };
                      vPreMas += preescolar[secLetra].mas;
                      vPreFem += preescolar[secLetra].fem;
                  }
              });
              if (Object.keys(vPreObj).length > 0) {
                  preescolar.vacantes              = vPreObj;
                  preescolar['total-vac-pre-mas']  = vPreMas;
                  preescolar['total-vac-pre-fem']  = vPreFem;
                  preescolar['total-vac-pre']      = vPreMas + vPreFem;
              }

              if (!matricula.basica['20000']) matricula.basica['20000'] = { 'total-20000': 0 };
              matricula.basica['20000'].preescolar = preescolar;
              matricula.basica['20000']['total-20000'] += (tPreMas + tPreFem);
          }

          // ── 3. PRIMARIA ───────────────────────────────────────────────────
          if (seccionesPlanes['21000']) {
              matricula.basica['21000'] = {
                  'total-21000-mas':     0,
                  'total-21000-fem':     0,
                  'total-21000':         0,
                  'total-vac-21000-mas': 0,
                  'total-vac-21000-fem': 0,
                  'total-vac-21000':     0
              };
              // Inicializar los 6 grados
              for (let g = 1; g <= 6; g++) matricula.basica['21000'][String(g)] = {};

              // Leer inputs
              document.querySelectorAll('.mat-input.mat-primaria').forEach(inp => {
                  if (!isVisible(inp)) return;
                  const match = inp.dataset.grupo.match(/primaria-(\d)([A-Z])/);
                  if (!match) return;
                  const grado = match[1];
                  const secLetra = match[2];
                  const val = parseInt(inp.value) || 0;
                  if (!val) return;

                  const g = matricula.basica['21000'][grado];
                  if (!g[secLetra]) g[secLetra] = { mas: 0, fem: 0 };
                  if (inp.dataset.sexo === 'F') {
                      g[secLetra].fem += val;
                      matricula.basica['21000']['total-21000-fem'] += val;
                  } else {
                      g[secLetra].mas += val;
                      matricula.basica['21000']['total-21000-mas'] += val;
                  }
                  matricula.basica['21000']['total-21000'] += val;
              });

              // Vacantes primaria (key: gradoStr+secLetra, ej: "1A")
              const vacPri = window._VACANTES_TEMP?.primaria || {};
              for (let g = 1; g <= 6; g++) {
                  const gradoStr = String(g);
                  const gObj = matricula.basica['21000'][gradoStr];
                  if (!gObj || Object.keys(gObj).length === 0) continue;

                  const vGrado = {};
                  let vGMas = 0, vGFem = 0;
                  Object.keys(gObj).forEach(secLetra => {
                      if (secLetra.length !== 1) return;
                      if (vacPri[gradoStr + secLetra] === 1) {
                          vGrado[secLetra] = { mas: gObj[secLetra].mas, fem: gObj[secLetra].fem };
                          vGMas += gObj[secLetra].mas;
                          vGFem += gObj[secLetra].fem;
                      }
                  });
                  if (Object.keys(vGrado).length > 0) {
                      gObj.vacantes = vGrado;
                      matricula.basica['21000']['total-vac-21000-mas'] += vGMas;
                      matricula.basica['21000']['total-vac-21000-fem'] += vGFem;
                      matricula.basica['21000']['total-vac-21000']     += (vGMas + vGFem);
                  }
              }
          }

          // ── 4. MEDIA GENERAL ──────────────────────────────────────────────
          if (document.getElementById('bloque-mediageneral')?.style.display !== 'none') {
              const mediaGen = { 'total-med-fem': 0, 'total-med-mas': 0, 'total-med-gen': 0 };

              document.querySelectorAll('.dyn-mg-fem').forEach(inp => {
                  if (!isVisible(inp)) return;
                  const plan = inp.dataset.plan;
                  const fVal = parseInt(inp.value) || 0;
                  const mInp = document.querySelector(\`.dyn-mg-mas[data-plan="\${plan}"]\`);
                  const mVal = mInp ? (parseInt(mInp.value) || 0) : 0;
                  if (!fVal && !mVal) return;

                  if (!mediaGen[plan]) mediaGen[plan] = { fem: 0, mas: 0, total: 0 };
                  mediaGen[plan].fem   += fVal;
                  mediaGen[plan].mas   += mVal;
                  mediaGen[plan].total += (fVal + mVal);

                  mediaGen[\`total-med-\${plan}-fem\`] = (mediaGen[\`total-med-\${plan}-fem\`] || 0) + fVal;
                  mediaGen[\`total-med-\${plan}-mas\`] = (mediaGen[\`total-med-\${plan}-mas\`] || 0) + mVal;
                  mediaGen[\`total-med-\${plan}\`]     = (mediaGen[\`total-med-\${plan}\`]     || 0) + (fVal + mVal);

                  mediaGen['total-med-fem'] += fVal;
                  mediaGen['total-med-mas'] += mVal;
                  mediaGen['total-med-gen'] += (fVal + mVal);
              });

              matricula.media['media-general'] = mediaGen;
          }

          // ── 5. MEDIA TÉCNICA ──────────────────────────────────────────────
          if (document.getElementById('bloque-mediatecnica')?.style.display !== 'none') {
              const mediaTec = { 'total-med-fem': 0, 'total-med-mas': 0, 'total-med-tec': 0 };

              document.querySelectorAll('.dyn-mt-fem').forEach(inp => {
                  if (!isVisible(inp)) return;
                  const plan = inp.dataset.plan;
                  const fVal = parseInt(inp.value) || 0;
                  const mInp = document.querySelector(\`.dyn-mt-mas[data-plan="\${plan}"]\`);
                  const mVal = mInp ? (parseInt(mInp.value) || 0) : 0;
                  if (!fVal && !mVal) return;

                  if (!mediaTec[plan]) mediaTec[plan] = { fem: 0, mas: 0, total: 0 };
                  mediaTec[plan].fem   += fVal;
                  mediaTec[plan].mas   += mVal;
                  mediaTec[plan].total += (fVal + mVal);

                  mediaTec[\`total-med-\${plan}-fem\`] = (mediaTec[\`total-med-\${plan}-fem\`] || 0) + fVal;
                  mediaTec[\`total-med-\${plan}-mas\`] = (mediaTec[\`total-med-\${plan}-mas\`] || 0) + mVal;
                  mediaTec[\`total-med-\${plan}\`]     = (mediaTec[\`total-med-\${plan}\`]     || 0) + (fVal + mVal);

                  mediaTec['total-med-fem'] += fVal;
                  mediaTec['total-med-mas'] += mVal;
                  mediaTec['total-med-tec'] += (fVal + mVal);
              });

              matricula.media['media-tecnica'] = mediaTec;
          }

          // ── 6. TOTAL GENERAL MEDIA ────────────────────────────────────────
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

          // ── 7. ESCOBA DIGITAL + GUARDAR ───────────────────────────────────
          try {
              sweepZeros(matricula);
              sweepZeros(seccionesPlanes);

              const docRef = doc(db, "planteles", codigoDEA);
              const payload = {
                  secciones:  deleteField(),
                  "secciones-planes": seccionesPlanes,
                  matricula:  matricula,
                  vacantes:   deleteField(),
                  datos_completados: true,
                  ultima_actualizacion: new Date().toISOString()
              };

              await safeSetDoc(docRef, payload, {
                  mergeFields: ['secciones', 'secciones-planes', 'matricula', 'vacantes', 'datos_completados', 'ultima_actualizacion']
              });
              showToast("¡Datos del plantel actualizados con éxito!", "success");

          } catch (error) {
              console.error("Error guardando el plantel:", error);
              showToast("Ocurrió un error al guardar los datos.", "error");
          } finally {
              if (btn) {
                  btn.textContent = "Guardar Datos y Continuar";
                  btn.disabled = false;
              }
          }
      };`;

// ─── Reemplazo quirúrgico ─────────────────────────────────────────────────────
const START_ANCHOR = '      form.onsubmit = async (e) => {';
// El anchor de fin debe ser el ÚLTIMO '      };' del bloque (después de safeSetDoc)
const END_ANCHOR_UNIQUE = "btn.disabled = false;\n            }\n        }\n      };";

const startIdx = src.indexOf(START_ANCHOR);
if (startIdx === -1) {
    console.error('ERROR: No se encontró el anchor de inicio.');
    process.exit(1);
}

const endIdx = src.indexOf(END_ANCHOR_UNIQUE, startIdx);
if (endIdx === -1) {
    console.error('ERROR: No se encontró el anchor de fin único.');
    process.exit(1);
}

const endPos = endIdx + END_ANCHOR_UNIQUE.length;

// Verificar que el bloque contiene safeSetDoc
const block = src.substring(startIdx, endPos);
if (!block.includes('safeSetDoc')) {
    console.error('ERROR: El bloque no contiene safeSetDoc.');
    process.exit(1);
}

console.log('Bloque identificado correctamente:');
console.log('  Inicio:', startIdx, '→', src.substring(startIdx, startIdx + 60).trim());
console.log('  Fin:   ', endPos,   '→', src.substring(endPos - 20, endPos).trim());
console.log('  Líneas:', block.split('\n').length);

// Aplicar el reemplazo
src = src.substring(0, startIdx) + NEW_ONSUBMIT + src.substring(endPos);

fs.writeFileSync(mainPath, src);
console.log('\n✅ onsubmit reescrito correctamente.');
console.log('Nuevas líneas del bloque:', NEW_ONSUBMIT.split('\n').length);
