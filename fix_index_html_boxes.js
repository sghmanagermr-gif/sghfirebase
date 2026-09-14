const fs = require('fs');
const path = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';
let content = fs.readFileSync(path, 'utf8');

const t1 = `                  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <div><label style="font-size: 0.75rem; color: #64748b;">Maternal Fem</label><input type="number" class="mat-input mat-inicial" id="matFem" min="0" value="" style="background: white; color: #0f172a; border-color: #cbd5e1;" /></div>
                    <div><label style="font-size: 0.75rem; color: #64748b;">Maternal Mas</label><input type="number" class="mat-input mat-inicial" id="matMas" min="0" value="" style="background: white; color: #0f172a; border-color: #cbd5e1;" /></div>
                    <div><label style="font-size: 0.75rem; color: #64748b;">Maternal Sec</label><input type="number" class="sec-input sec-inicial" id="secMat" min="0" value="" style="background: white; color: #0f172a; border-color: #cbd5e1;" /></div>
                  </div>
                  <h4 style="font-size: 0.9rem; color: #475569; margin-bottom: 10px;">Preescolar</h4>
                  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <div><label style="font-size: 0.75rem; color: #64748b;">Preescolar Fem</label><input type="number" class="mat-input mat-inicial" id="preFem" min="0" value="" style="background: white; color: #0f172a; border-color: #cbd5e1;" /></div>
                    <div><label style="font-size: 0.75rem; color: #64748b;">Preescolar Mas</label><input type="number" class="mat-input mat-inicial" id="preMas" min="0" value="" style="background: white; color: #0f172a; border-color: #cbd5e1;" /></div>
                    <div><label style="font-size: 0.75rem; color: #64748b;">Preescolar Sec</label><input type="number" class="sec-input sec-inicial" id="secPre" min="0" value="" style="background: white; color: #0f172a; border-color: #cbd5e1;" /></div>
                  </div>`;

const r1 = `                  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <div><label style="font-size: 0.75rem; color: #64748b;">Maternal Fem</label><input type="number" class="mat-input mat-inicial" id="matFem" min="0" value="" style="background: white; color: #0f172a; border-color: #cbd5e1;" /></div>
                    <div><label style="font-size: 0.75rem; color: #64748b;">Maternal Mas</label><input type="number" class="mat-input mat-inicial" id="matMas" min="0" value="" style="background: white; color: #0f172a; border-color: #cbd5e1;" /></div>
                    <div><label style="font-size: 0.75rem; color: #64748b;">Maternal Sec</label><input type="number" class="sec-input sec-inicial" id="secMat" data-plan="20000" data-tipo="maternal" min="0" value="" style="background: white; color: #0f172a; border-color: #cbd5e1;" /></div>
                  </div>
                  <div id="cont-dinamico-maternal"></div>
                  <h4 style="font-size: 0.9rem; color: #475569; margin-bottom: 10px;">Preescolar</h4>
                  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <div><label style="font-size: 0.75rem; color: #64748b;">Preescolar Fem</label><input type="number" class="mat-input mat-inicial" id="preFem" min="0" value="" style="background: white; color: #0f172a; border-color: #cbd5e1;" /></div>
                    <div><label style="font-size: 0.75rem; color: #64748b;">Preescolar Mas</label><input type="number" class="mat-input mat-inicial" id="preMas" min="0" value="" style="background: white; color: #0f172a; border-color: #cbd5e1;" /></div>
                    <div><label style="font-size: 0.75rem; color: #64748b;">Preescolar Sec</label><input type="number" class="sec-input sec-inicial" id="secPre" data-plan="20000" data-tipo="preescolar" min="0" value="" style="background: white; color: #0f172a; border-color: #cbd5e1;" /></div>
                  </div>
                  <div id="cont-dinamico-preescolar"></div>`;

const t2 = `                  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <div><label style="font-size: 0.75rem; color: #64748b;">Primaria Fem</label><input type="number" class="mat-input mat-primaria" id="priFem" min="0" value="" style="background: white; color: #0f172a; border-color: #cbd5e1;" /></div>
                    <div><label style="font-size: 0.75rem; color: #64748b;">Primaria Mas</label><input type="number" class="mat-input mat-primaria" id="priMas" min="0" value="" style="background: white; color: #0f172a; border-color: #cbd5e1;" /></div>
                    <div><label style="font-size: 0.75rem; color: #64748b;">Secciones Totales</label><input type="number" class="sec-input sec-primaria" id="secPri" min="0" value="" style="background: white; color: #0f172a; border-color: #cbd5e1;" /></div>
                  </div>`;

const r2 = `                  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <div><label style="font-size: 0.75rem; color: #64748b;">Primaria Fem</label><input type="number" class="mat-input mat-primaria" id="priFem" min="0" value="" style="background: white; color: #0f172a; border-color: #cbd5e1;" /></div>
                    <div><label style="font-size: 0.75rem; color: #64748b;">Primaria Mas</label><input type="number" class="mat-input mat-primaria" id="priMas" min="0" value="" style="background: white; color: #0f172a; border-color: #cbd5e1;" /></div>
                    <div><label style="font-size: 0.75rem; color: #64748b;">Secciones Totales</label><input type="number" class="sec-input sec-primaria" id="secPri" data-plan="21000" min="0" value="" style="background: white; color: #0f172a; border-color: #cbd5e1;" /></div>
                  </div>
                  <div id="cont-dinamico-primaria"></div>`;

let changes = 0;
if (content.includes(t1)) { content = content.replace(t1, r1); changes++; }
if (content.includes(t2)) { content = content.replace(t2, r2); changes++; }

if (changes > 0) {
    fs.writeFileSync(path, content, 'utf8');
    console.log('HTML updated successfully! Changed:', changes);
} else {
    console.log('No changes needed or strings not found.');
}
