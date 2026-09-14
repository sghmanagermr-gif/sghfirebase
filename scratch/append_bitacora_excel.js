const fs = require('fs');

const entry = `
### Hito: Implementación de Botón y Exportación Completa de Nómina a Excel (.xlsx) (v2.11.3)
**Fecha:** 2026-09-14
**Módulo:** Personal / Exportación a Excel (.xlsx)

**1. Requerimiento Institucional:**
- Incorporar un botón visible y estilizado para descargar la nómina del personal del plantel directamente en formato Excel (.xlsx).
- La descarga debe incluir absolutamente todos los campos del expediente de cada empleado registrado en el plantel, desde la Cédula de Identidad hasta el Centro de Votación.

**2. Solución Implementada:**
- Integración de Librería Especializada "xlsx" (SheetJS):
  * Se instaló la dependencia en el frontend asegurando compatibilidad total y compilación limpia con Vite.
- Botón en Interfaz con Diseño Institucional:
  * Ubicado en la cabecera de la sección "Personal Registrado en el Plantel" (#seccion-personal-existente), adyacente a la barra de búsqueda en tiempo real.
  * Diseñado con paleta verde institucional de Excel (#107c41), icono SVG de hoja de cálculo y microinteracciones de hover y relieve.
- Cobertura Exhaustiva de Campos (55 Columnas Exportadas):
  1. Identificación y Datos Personales: N°, Nacionalidad, Cédula, Cédula Completa, Primer Apellido, Segundo Apellido, Primer Nombre, Segundo Nombre, Apellidos y Nombres, Género, Fecha de Nacimiento, Edad, Estado Civil, Lugar de Nacimiento.
  2. Ubicación y Contacto: Teléfono Habitación, Teléfono Celular, Teléfono Oficina, Correo Electrónico, Dirección de Habitación.
  3. Formación Académica: Nivel de Instrucción, Profesión / Título.
  4. Ubicación Administrativa y Cargo: Código Plantel (DEA), Ubicación Administrativa, Dependencia, Tipo de Personal, Subcategoría, Cargo, Código RAC, Condición, Fecha de Ingreso, Años de Antigüedad, Turnos que Atiende.
  5. Carga Horaria y Pedagógica: Horas Académicas, Horas Administrativas, Total Horas, Atiende Matrícula, Nivel / Modalidad, Especialidad que Imparte.
  6. Situación Laboral: Situación Laboral, Descripción Situación, Observaciones.
  7. Dotación y Bienestar Social: Talla Camisa, Talla Pantalón, Talla Zapato, Actividad Deportiva, Actividad Cultural, Tipo de Vivienda, Condición Vivienda, Tipo Material Vivienda, Tipo de Enfermedad, Medicamento, Discapacidad.
  8. Organización Comunitaria y Electoral: UBCH, Circuito Comunal, Centro de Votación.
- Arquitectura Costo Cero (Zero-Cost Spark):
  * La exportación consume los datos ya presentes en la memoria de la sesión activa (window._personalPlantelData), sin generar ninguna lectura adicional ni recargo de cuota en Firestore.
  * Ajuste dinámico de ancho de columnas y nomenclatura estandarizada de archivo: Nomina_Personal_[CODIGO_DEA]_[FECHA].xlsx.

**3. Archivos Involucrados:**
- frontend/src/personalWizard.js
- frontend/index.html
- frontend/package.json
- bitacora.md
`;

['c:/Proyectos/sgh-2.0/bitacora.md', 'c:/Proyectos/sgh-mr - firebase/bitacora.md'].forEach(p => {
  fs.appendFileSync(p, entry, 'utf8');
  console.log('Appended to', p);
});
