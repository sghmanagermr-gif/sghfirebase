const fs = require('fs');

const nota = `
**Actualización Normativa Complementaria (Media - Administrativos y Obreros):**
- Se incorporó la aclaratoria institucional de que en el subsistema de EDUCACIÓN MEDIA (Media General y Media Técnica) TAMBIÉN APLICA LA REGLA DE 30 ESTUDIANTES POR ADMINISTRATIVO/OBRERO.
- Por ende, el cálculo de Cuadratura en los liceos audita de forma dual:
  * Docentes: Mediante Horas de Malla Curricular frente a Horas Académicas de nómina (#wp-horas-academicas).
  * Personal de Soporte (Administrativos y Obreros): Mediante la división de la Matrícula total del liceo entre 30.
- El informe ejecutivo formal (.docx) fue actualizado con esta sección específica y sus ejemplos prácticos.
`;

const paths = [
  'c:/Proyectos/sgh-mr - firebase/bitacora.md',
  'c:/Proyectos/sgh-2.0/bitacora.md'
];

paths.forEach(p => {
  if (fs.existsSync(p)) {
    fs.appendFileSync(p, nota, 'utf8');
    console.log('Nota complementaria anexada en:', p);
  }
});
