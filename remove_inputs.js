const fs = require('fs');
const path = 'C:\\Proyectos\\sgh-2.0\\frontend\\index.html';
let content = fs.readFileSync(path, 'utf8');

const matBlockOld = `                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                  <div><label style="font-size: 0.75rem; color: #64748b;">Maternal Fem</label><input type="number" class="mat-input mat-inicial" id="matFem" min="0" value="" style="background: white; color: #0f172a; border-color: #cbd5e1;" /></div>
                  <div><label style="font-size: 0.75rem; color: #64748b;">Maternal Mas</label><input type="number" class="mat-input mat-inicial" id="matMas" min="0" value="" style="background: white; color: #0f172a; border-color: #cbd5e1;" /></div>
                  <div><label style="font-size: 0.75rem; color: #64748b;">Maternal Sec</label><input type="number" class="sec-input sec-inicial sec-master-input" id="secMat" data-plan="20000" data-tipo="maternal" min="0" value="" style="background: white; color: #0f172a; border-color: #cbd5e1;" /></div>
                </div>`;

const matBlockNew = `                <div style="display: grid; grid-template-columns: 1fr; gap: 15px; margin-bottom: 20px;">
                  <div><label style="font-size: 0.75rem; color: #64748b;">Maternal Sec</label><input type="number" class="sec-input sec-inicial sec-master-input" id="secMat" data-plan="20000" data-tipo="maternal" min="0" value="" style="background: white; color: #0f172a; border-color: #cbd5e1;" /></div>
                </div>`;

const preBlockOld = `                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                  <div><label style="font-size: 0.75rem; color: #64748b;">Preescolar Fem</label><input type="number" class="mat-input mat-inicial" id="preFem" min="0" value="" style="background: white; color: #0f172a; border-color: #cbd5e1;" /></div>
                  <div><label style="font-size: 0.75rem; color: #64748b;">Preescolar Mas</label><input type="number" class="mat-input mat-inicial" id="preMas" min="0" value="" style="background: white; color: #0f172a; border-color: #cbd5e1;" /></div>
                  <div><label style="font-size: 0.75rem; color: #64748b;">Preescolar Sec</label><input type="number" class="sec-input sec-inicial sec-master-input" id="secPre" data-plan="20000" data-tipo="preescolar" min="0" value="" style="background: white; color: #0f172a; border-color: #cbd5e1;" /></div>
                </div>`;

const preBlockNew = `                <div style="display: grid; grid-template-columns: 1fr; gap: 15px; margin-bottom: 20px;">
                  <div><label style="font-size: 0.75rem; color: #64748b;">Preescolar Sec</label><input type="number" class="sec-input sec-inicial sec-master-input" id="secPre" data-plan="20000" data-tipo="preescolar" min="0" value="" style="background: white; color: #0f172a; border-color: #cbd5e1;" /></div>
                </div>`;

if (content.includes('id="matFem"')) {
    content = content.split(matBlockOld).join(matBlockNew);
    content = content.split(preBlockOld).join(preBlockNew);
    fs.writeFileSync(path, content, 'utf8');
    console.log('index.html patched correctly');
} else {
    console.log('Inputs not found or already patched.');
}
