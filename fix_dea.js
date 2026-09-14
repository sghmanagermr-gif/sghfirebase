const fs = require('fs');
const wizardJsPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\personalWizard.js';
let content = fs.readFileSync(wizardJsPath, 'utf8');

const correctLogic = `
        let dea = '';
        const stPlantel = localStorage.getItem('plantelSeleccionado');
        if (stPlantel) {
            try {
                const pt = JSON.parse(stPlantel);
                dea = pt.codigoDEA || pt.codigo_dea || pt.plantel_codigo; // Manejar posibles variaciones
            } catch (e) {}
        }

        if (!dea) {
            const uStr = localStorage.getItem('sgh_user');
            if (uStr) {
                try {
                    const usr = JSON.parse(uStr);
                    if (usr.planteles && usr.planteles.length > 0) {
                        dea = usr.planteles[0];
                    } else if (usr.jerarquia && usr.jerarquia.plantel_codigo) {
                        dea = usr.jerarquia.plantel_codigo;
                    }
                } catch (e) {}
            }
        }
        
        if (dea) {
            cargarPersonalExistente(dea);
        } else {
            console.warn("No se pudo determinar el código DEA del plantel actual para cargar personal.");
        }
`;

content = content.replace(/if \(window\.currentPlantelDEA\) \{[\s\S]*?cargarPersonalExistente\(window\.currentPlantelDEA\);[\s\S]*?\}/, correctLogic);

fs.writeFileSync(wizardJsPath, content);
console.log("Fixed DEA extraction logic in personalWizard.js");
