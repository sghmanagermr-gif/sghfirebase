const fs = require('fs');

// 1. Agregar ~$* a .gitignore
const giPath = 'c:/Proyectos/sgh-2.0/.gitignore';
if (fs.existsSync(giPath)) {
  let gi = fs.readFileSync(giPath, 'utf8');
  if (!gi.includes('~$*')) {
    gi += '\n# Archivos temporales de Office\n~$*\n';
    fs.writeFileSync(giPath, gi, 'utf8');
    console.log('.gitignore actualizado con ~$*');
  }
}

// 2. Entrada de bitácora
const bitacoraEntry = `
### Hito: Estudio de Viabilidad y Arquitectura del Módulo de Cuadratura (Básica y Media) e Informe Ejecutivo Institucional (.DOCX)
**Fecha:** 2026-09-04
**Módulo:** Planificación y Cuadratura / Auditoría de Talento Humano

**1. Diagnóstico y Requerimientos:**
- Se evaluó la factibilidad técnica y administrativa de determinar el personal requerido frente a excedentes a tres niveles territoriales (Plantel, Municipio y Estado) antes de iniciar la construcción del módulo de Cuadratura.
- Subsistema de Básica (Inicial y Primaria): Evaluación de la relación entre la Matrícula institucional y las vacantes declaradas bajo la 'Fórmula 20/30'.
- Subsistema de Media (General 3**** y Técnica 4****): Evaluación de la relación entre la cantidad de secciones por año multiplicadas por las horas de la Malla Curricular oficial frente a las horas académicas del personal docente.
- Requerimiento de entrega: Generación de un informe ejecutivo formal en formato Word (.docx) redactado en lenguaje administrativo claro y libre de formulaciones matemáticas abstractas (LaTeX / fórmulas crudas).

**2. Soluciones y Conclusiones Arquitectónicas:**
- Subsistema de Básica (La Fórmula 20/30 Institucional):
  * Factor 20 (Docentes): 20 estudiantes por docente regular de aula.
  * Atención Dual en Inicial: Se formalizó el requerimiento de 2 docentes por cada 20 niños en Maternal/Preescolar (titular y auxiliar/acompañamiento), activado al marcar 'Atiende Matrícula = SI' y seleccionar 'INICIAL'.
  * Aulas Unitarias / Multigrado: Se contempló el tratamiento de 'Sección Única' para planteles rurales remotos con baja matrícula integrada de 1° a 6° grado a cargo de un único docente.
  * Factor 30 (Soporte): 30 estudiantes de matrícula global por cada cargo de personal Administrativo u Obrero, permitiendo auditar la sobrepoblación o déficit de personal de secretaría y mantenimiento.
- Subsistema de Media (Malla Curricular y Carga Horaria de Nómina):
  * Anclaje Presupuestario: Se vinculó formalmente el campo 'Horas Académicas' (#wp-horas-academicas) con el recibo de pago oficial del docente y el nivel que atiende (Media General, Media Técnica o Mixto).
  * Demanda Curricular: Las horas requeridas se calculan dinámicamente multiplicando las secciones declaradas por la carga horaria semanal de cada asignatura según el catálogo de planes de estudio (31059, 31060 y planes técnicos amparados en Gaceta Oficial 42.739).
  * Balanza Horaria y Control RAC: Identificación de horas huérfanas por materia (Déficit) y detección de 'Horas por Reprogramar' (horas cobradas en recibo sin sección asignada en aula), erradicando las horas fantasma.
- Consolidación Territorial y Optimización Zero-Cost (Firebase Spark):
  * Se diseñó la persistencia mediante acumuladores desnormalizados (Plantel -> Municipio -> Estado) para garantizar consultas ultrarrápidas sin saturar la cuota gratuita de 50.000 lecturas diarias de Firestore.
- Documentación y Exportación Formal:
  * Se programó el script generador y se emitió el archivo físico 'INFORME_VIABILIDAD_CUADRATURA_SGH.docx' con tipografía y diseño ejecutivo de alto impacto.

**3. Archivos Involucrados:**
- INFORME_VIABILIDAD_CUADRATURA_SGH.docx
- bitacora.md
`;

// 3. Escribir en ambas bitácoras
const paths = [
  'c:/Proyectos/sgh-mr - firebase/bitacora.md',
  'c:/Proyectos/sgh-2.0/bitacora.md'
];

paths.forEach(p => {
  if (fs.existsSync(p)) {
    fs.appendFileSync(p, bitacoraEntry, 'utf8');
    console.log('Bitácora actualizada en:', p);
  }
});
