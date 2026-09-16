# Bitácora de Desarrollo - SGH 2.0

## [v2.6.0] - 2026-08-19 (Nueva Función: Tabla de Personal Existente)

### Resumen Técnico
Se implementó el requerimiento de inyectar una tabla resumen con el personal previamente cargado, situada justo antes del asistente de registro de personal en la plataforma SGH. El objetivo fue mejorar la experiencia del usuario (plaadmin) permitiéndole visualizar a los empleados ya registrados sin sacrificar los lineamientos de optimización de costos.

### Lógicas Inyectadas y Decisiones Arquitectónicas (Zero-Cost Optimization)
- **Consulta con Índice Específico:** Para mantener el principio "Zero-Cost", la tabla se alimenta mediante una consulta estructurada a la colección `cargos_personal`: `query(collection(db, 'cargos_personal'), where('codigo-plantel', '==', codigoDEA))`. Esto asegura que Firestore solo escanee los documentos correspondientes al colegio (lectura O(N) relativa al plantel, no a la DB global), eludiendo de forma absoluta el uso ineficiente de `get()` en toda la colección.
- **Inyección DOM Dinámica:** Se creó el contenedor `#seccion-personal-existente` como un `lock-card glass-panel` con `max-height: 300px` y `overflow-y: auto` para brindar scroll vertical sin recargar visualmente el DOM. Los `thead` se mantuvieron con `position: sticky`.
- **Estructura Desacoplada (Frontend):** Las lógicas de ocultar/mostrar este componente se acoplaron a las funciones existentes `mostrarFormularioPersonal` y `cerrarFormularioPersonal` del motor `personalWizard.js`.

### Archivos Modificados
- `C:\Proyectos\sgh-2.0\frontend\index.html`: Inyección de la estructura HTML de la tabla (`<div id="seccion-personal-existente">`).
- `C:\Proyectos\sgh-2.0\frontend\src\personalWizard.js`: Inyección del método `cargarPersonalExistente` e importación de la librería de Firestore.

---

### Hotfix (v2.6.1)
- **Corrección Lógica de Extracción DEA:** Se identificó que la variable global `window.currentPlantelDEA` no estaba siendo seteada en la vista principal por el archivo `main.js`. Por lo tanto, la función `mostrarFormularioPersonal()` fue refactorizada para extraer de forma autónoma el `codigoDEA` del colegio directamente desde `localStorage` (ya sea de `plantelSeleccionado` o `sgh_user`), asegurando la carga exitosa de los registros en la tabla.
---

### Hotfix (v2.6.2)
- **Extracción de Variables de Sesión (Zero-Cost):** Se identificó que la aplicación no almacena los datos de sesión en `localStorage` directamente, lo que causaba el fallo silencioso en la carga de la tabla. Se inyectaron variables globales dinámicas (`window.sgh_user_data` y `window.currentPlantelDEA`) dentro de los observadores de sesión nativos de Firebase en `main.js`. Esto permite a los módulos independientes como `personalWizard.js` consultar el código DEA en tiempo de ejecución de manera segura y precisa.
---

### Hotfix (v2.6.3)
- **Corrección de Mapeo de Datos:** Se ajustó la llave de lectura de la colección `cargos_personal` para los nombres del personal en la tabla, de `apellidos-nombres` a `nombre-apellido`, evitando que se renderizaran como "N/A".
---

### Tarea (Diseño y UI)
- **Refactorización de Botones de Acción (Personal):** Se eliminaron los botones basados en emojis y padding excesivo en la tabla de `cargos_personal`. Se implementó un diseño moderno basado en SVG (Lucide-style), flexbox gap (10px) y micro-animaciones en `hover` (cambio de color dinámico y traslación) para garantizar una interfaz de usuario premium.
---

### Hotfix Estético (v2.6.4)
- **Refactorización de UI (Action Buttons):** Se eliminaron los botones basados en emojis nativos de la tabla de personal y se sustituyeron por íconos SVG de trazo limpio (Lucide Style). Se les aplicó `inline-flex` con alineación centralizada, bordes sutiles, micro-sombras (`box-shadow`) y transiciones de color dinámicas (`hover`) para elevar el acabado visual a un nivel corporativo (Premium Design).
---

### Hotfix Estético y Usabilidad (v2.6.5)
- **Claridad de Acciones (Botones con Texto):** En respuesta a la pérdida de legibilidad reportada por el usuario ("no se sabe cuál es cuál"), se reemplazaron los íconos SVG de los botones de acción por etiquetas de texto explícitas ("Editar" y "Eliminar"). Se aplicó un estilo corporativo tipo 'Badge' o 'Pill' con colores semánticos (azul para edición, rojo para eliminación), asegurando máxima claridad funcional sin sacrificar la estética moderna.
---

### Corrección Estética Final (v2.6.6)
- **Restauración de Íconos SVG:** A petición del usuario, se descartó el texto y se restauraron los íconos (lápiz para editar, bote de basura detallado para eliminar). Se ajustaron a un contenedor cuadrado diminuto (`32x32`) y se inyectó el atributo `xmlns` para garantizar que el navegador los renderice correctamente en la tabla, manteniendo el aspecto 100% corporativo sin textos anchos.
---

### Corrección de Alineación (v2.6.7)
- **Flexbox Horizontal Forzado:** Para solucionar el apilamiento vertical no deseado de los botones ("uno al lado del otro"), se envolvió el contenido de la celda de acciones en un contenedor `div` con la propiedad estricta `display: flex; flex-direction: row; flex-wrap: nowrap`. Esto garantiza que los íconos de edición y eliminación se mantengan alineados horizontalmente independientemente del ancho de la tabla.
---

### Optimizacion Buscador Zero-Cost (v2.6.8)
- **Filtro Client-Side (Cero Lecturas):** A solicitud del usuario para maximizar eficiencia bajo el Spark Plan, se implementó un buscador de personal en tiempo real (por cédula y nombre). El buscador opera 100% en memoria sobre el DOM (array ya descargado), garantizando un coste de 0 lecturas adicionales a Firestore.
- **UI Premium:** Se integró un *input box* moderno en el header de la tabla de personal existente, con icono de lupa SVG integrado, transiciones de sombra y foco azul (`#3b82f6`) para mantener coherencia estética.
---

### Seguridad y Persistencia de Sesión (v2.7.2)
- **Zero-Trace Persistence:** Se actualizó la configuración de Firebase Authentication en `firebase.js` y `main.js`, migrando de `browserSessionPersistence` a `inMemoryPersistence`. Esto garantiza que la sesión del usuario sea completamente volátil y se destruya de inmediato al cerrar la pestaña o ventana del navegador, exigiendo autenticación estricta en cada nueva visita.

### Refactorización de Lógica de Formulario (v2.7.3)
- **Validación Robusta (Escoba Digital Fix):** Se reemplazó la validación estática basada en `Object.keys(matricula).length > 0` por una función recursiva `checkValues` en `main.js`. Esto previene el falso positivo de mostrar el formulario de personal cuando existen estructuras residuales vacías o ceros en la base de datos tras una eliminación de matrícula o secciones.

### Refactorización de UI y Anti-Trampas (v2.7.4)
- **Cierre Dinámico del Formulario:** Se implementó una lógica reactiva en el manejador `submit` del formulario principal. Si el usuario intenta burlar el sistema vaciando las cajas de secciones y matrícula mientras el formulario de personal ya está abierto, el sistema detecta sumas en cero y ejecuta `cerrarFormularioPersonal()`, forzando el ocultamiento inmediato de la interfaz de personal y garantizando que solo exista si hay datos reales.


## v2.8.0 - Reestructuración del Formulario de Registro de Personal y Lógica de Presentación
**Fecha:** 2026-08-20T04:34:38.448Z

**Descripción de Cambios:**
- **UI/Arquitectura:** Rediseño completo del formulario de registro de personal en index.html estructurándolo en 5 secciones modulares (Datos Personales, Laborales, Situación del Trabajador, Bienestar Social y Punto y Círculo). Uso de variables dinámicas e IDs estructurados (e.g. wp-cedula).
- **Validación Front-end (Zero-Cost):** Se agregaron validaciones de presentación en personalWizard.js (alidarCedulaUI, calcularEdadUI, calcularAntiguedadUI, 	oggleMatriculaUI) para mitigar peticiones fallidas al servidor.
- **Carga Dinámica de Catálogos:** Se inyectó código para cargar catálogos desde el localStorage (sgh_catalogos) automáticamente al DOM utilizando la clase .c-cat, respetando la regla Zero-Cost.
- **Payload Centralizado:** Actualización del mapeo de datos al objeto empleadoActual en personalWizard.js para los 61 campos, manteniéndolo como un objeto plano que se inyectará limpiamente.
- **SemVer:** Actualización manual de la versión de SGH de v2.7.4 a v2.8.0 debido a la adición estructural sustancial en la UI y nuevas funciones lógicas de presentación.


## v2.8.1 - Corrección de Flujo de Seguridad y Reglas de Firestore
**Fecha:** 2026-08-31T23:49:22.289Z

**Descripción de Cambios:**
- **Seguridad y Accesos (Backend):** Se corrigió la interrupción en el flujo de autenticación (FirebaseError: Missing or insufficient permissions) originada durante la validación del perfil del usuario (onSnapshot y getDoc).
- **Resolución:** El administrador actualizó exitosamente las Reglas de Seguridad (irestore.rules) en la consola de Firebase Cloud Firestore, permitiendo el acceso de lectura y escritura a las colecciones maestras (usuarios, configuracion, planteles) para los usuarios autenticados.
- **Auditoría Zero-Cost:** Se validó que el bloqueo ERR_BLOCKED_BY_CLIENT reportado estaba vinculado a extensiones del navegador del lado del cliente, solucionado tras estabilizar el canal de comunicación en vivo.

### Hito: Carga Integral de Catálogos, Cascada Laboral y Ajustes de Formulario de Personal (v2.9.1 a v2.9.5)
**Fecha:** 2026-09-03
**Módulo:** Gestión de Talento Humano / Registro de Personal

**1. Diagnóstico del Problema:**
- Los catálogos maestros de selectores (.c-cat) no cargaban en el entorno local/producción, quedando en estado 'Cargando...'.
- La cascada de dependencias laborales no respetaba el orden institucional estricto: Tipo de Personal -> Dependencia -> Cargos / Códigos RAC o Rangos Obrero.
- Al seleccionar situación laboral no se desplegaba su descripción normativa oficial.
- Teléfonos de habitación/oficina y datos médicos imponían validaciones bloqueantes.
- El elemento Nivel / Modalidad era un input de texto libre en lugar de un selector clasificado.
- El cursor de los selectores mostraba el ícono de prohibición (🚫) por colisión de especificidad con .form-input:read-only.
- El botón Cuadratura y el campo Especialidad Imparte presentaban colapso dimensional en la grilla responsive.

**2. Soluciones Técnicas Aplicadas:**
- Se implementó un cargador resiliente 'Zero-Cost' (localStorage -> Firestore -> Respaldo en memoria con los 147 cargos docentes, 14 administrativos y 24 rangos obreros).
- Se programó la cascada laboral estricta en el orden establecido, gestionando la visibilidad del selector de Rangos de Obrero y la sincronización con Códigos RAC.
- Se configuró la reactividad en tiempo real de 'Situación Laboral' contra el mapa de las 22 descripciones legales e institucionales.
- Se convirtió 'Nivel / Modalidad' en un selector agrupado (optgroup) que contiene Niveles Educativos y Modalidades.
- Se eliminaron las restricciones rígidas en teléfonos y datos médicos, habilitando prefijos opcionales.
- Se corrigió la regla CSS en style.css restringiendo :read-only a campos de texto y forzando cursor: pointer !important en los selectores.
- Se reestructuró la grilla para que 'Especialidad Imparte' y 'Cuadratura' ocupen celdas contiguas con alineación horizontal milimétrica (42px).

**3. Archivos Modificados:**
- frontend/src/personalWizard.js
- frontend/src/style.css
- frontend/index.html
- frontend/package.json

### Hito: Validación Simétrica de Empleado (Guardar / Actualizar) y Diagnóstico de Reglas de Seguridad (v2.10.2)
**Fecha:** 2026-09-03
**Módulo:** Registro y Actualización de Personal / Seguridad Firestore

**1. Diagnóstico del Problema:**
- El guardado y la actualización de empleados carecían de una validación exhaustiva de campos requeridos, permitiendo envíos con solo cédula y nombres.
- Existía disparidad potencial entre el flujo de creación y el flujo de edición.
- En el formulario de registro de usuario director (plaadmin), la consulta del código DEA fallaba con "El código DEA no existe" debido al bloqueo de permisos de Firestore al no haber sesión iniciada (request.auth == null).

**2. Soluciones Técnicas Aplicadas:**
- Se implementó la función `validarFormularioPersonal()` integrada simétricamente en `guardarPersonalInline()`, ejecutándose con el mismo rigor tanto para nuevos empleados como para empleados en edición.
- Se respetó la lista oficial de campos no requeridos: Teléfono Habitación, Teléfono Oficina, Tipo de Enfermedad, Medicamento y Observaciones.
- Se programó la validación dinámica de dependencias condicionales (Rango de Obrero para Nacional/Obrero, Nivel/Modalidad y Especialidad para Atiende Matrícula = SÍ).
- Se incorporó resaltado visual inmediato (borde rojo), enfoque automático y desplazamiento suave (scrollIntoView) al primer campo faltante, junto con notificaciones Toast descriptivas.
- Se documentó la arquitectura de reglas por departamentos en Firestore para permitir la lectura pública de planteles sin comprometer datos confidenciales.

**3. Archivos Modificados:**
- frontend/src/personalWizard.js
- frontend/package.json
- frontend/index.html

### Hito: Lista Extensa de Instrucción y Reglas Condicionales de Horas por Tipo de Personal (v2.10.6)
**Fecha:** 2026-09-03
**Módulo:** Personal Wizard / Formulario y Validación

**1. Diagnóstico y Requerimientos:**
- El selector de nivel de instrucción con solo 3 opciones resultaba escueto; se requería la jerarquía completa de 8 niveles académicos.
- En modo edición, los registros antiguos con 'SUPERIOR' no cargaban si el catálogo difería.
- El campo 'Ubicación Administrativa' debía ser completamente opcional.
- Las Horas Académicas deben ser requeridas únicamente para personal DOCENTE.
- Las Horas Administrativas deben ser requeridas únicamente para personal ADMINISTRATIVO y OBRERO.

**2. Soluciones Técnicas Aplicadas:**
- Se implementó `LISTA_EXTENSA_INSTRUCCION` fija con los 8 niveles oficiales: SIN INSTRUCCION, BASICA, PRIMARIA, BACHILLER, TECNICO MEDIO, TSU, UNIVERSITARIO, POSTGRADO.
- Se implementó `setSelectSmart()` para tolerancia y normalización automática de términos (ej. SUPERIOR -> UNIVERSITARIO, FEMENINO -> FEM).
- Se retiró `wp-ubicacion-administrativa` de los campos requeridos en `validarFormularioPersonal()`.
- Se integró la lógica condicional en `validarFormularioPersonal()` para exigir Horas Académicas solo si tipo === 'DOCENTE', y Horas Administrativas solo si tipo === 'ADMINISTRATIVO' o tipo === 'OBRERO'.

**3. Archivos Modificados:**
- frontend/src/personalWizard.js
- frontend/index.html
- frontend/package.json

### Hito: Limpieza del Buscador y Desplazamiento Inteligente Diferenciado (v2.10.10)
**Fecha:** 2026-09-03
**Módulo:** Personal Wizard / Usabilidad y Experiencia de Usuario (UX)

**1. Diagnóstico y Requerimientos:**
- El campo de búsqueda (#buscador-personal) conservaba filtros residuales al actualizar un registro, impidiendo visualizar la plantilla completa.
- Al guardar o actualizar, la vista permanecía estática al final de la página o colisionaba contra el borde del header fijo (sticky navbar).
- Se identificó la necesidad de bifurcar el flujo de navegación post-persistencia:
  * Al ACTUALIZAR (edición): El operador desea verificar la tabla de funcionarios registrados.
  * Al GUARDAR (nuevo registro): El operador registra empleados en lote y requiere permanecer en el formulario para el siguiente ingreso.

**2. Soluciones Técnicas Aplicadas:**
- Limpieza Reactiva del Buscador: Al invocar `guardarPersonalInline` en modo edición o `limpiarFormularioPersonal`, se restablece el input de búsqueda a cadena vacía y se despacha el evento sintético `input` para re-renderizar todas las filas de la tabla.
- Calibración de Header Offset: Se implementó un desplazamiento programático con `window.scrollTo` aplicando una compensación de 95px (75px de header sticky + 20px de respiro visual). Además, se añadió `scroll-margin-top: 95px;` a los contenedores `#seccion-personal-existente` y `#seccion-registro-personal`.
- Desplazamiento Condicional y Foco Dinámico:
  * Si `isEditing === true`: Desplaza la vista a `#seccion-personal-existente` y asigna el foco al buscador (#buscador-personal).
  * Si `isEditing === false`: Desplaza la vista a `#seccion-registro-personal` y asigna el foco al campo inicial de Cédula (#wp-cedula).

**3. Archivos Modificados:**
- frontend/src/personalWizard.js
- frontend/index.html
- frontend/package.json

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

**Actualización Normativa Complementaria (Media - Administrativos y Obreros):**
- Se incorporó la aclaratoria institucional de que en el subsistema de EDUCACIÓN MEDIA (Media General y Media Técnica) TAMBIÉN APLICA LA REGLA DE 30 ESTUDIANTES POR ADMINISTRATIVO/OBRERO.
- Por ende, el cálculo de Cuadratura en los liceos audita de forma dual:
  * Docentes: Mediante Horas de Malla Curricular frente a Horas Académicas de nómina (#wp-horas-academicas).
  * Personal de Soporte (Administrativos y Obreros): Mediante la división de la Matrícula total del liceo entre 30.
- El informe ejecutivo formal (.docx) fue actualizado con esta sección específica y sus ejemplos prácticos.

### Hito: Recuperación de Contraseñas, Ocultamiento Preventivo de Cuadratura y Viabilidad de Descarga de Nómina Completa en Excel (v2.11.0 - v2.11.2)
**Fecha:** 2026-09-14
**Módulo:** Autenticación / Registro de Personal / Exportación de Datos

**1. Diagnóstico y Requerimientos:**
- Módulo de Recuperación de Contraseñas: Incorporar mecanismo seguro para que los directores y usuarios del sistema puedan restablecer sus credenciales vía correo institucional sin depender de intervención manual del administrador.
- UX de Retorno a Login: Posterior al envío exitoso del enlace de restablecimiento, habilitar enlace directo "Volver al inicio de sesión" y redirección automática tras 5 segundos.
- Control de Cuadratura: Atender la directriz institucional de invisibilizar temporalmente el botón de Cuadratura en el formulario de Registro de Personal y en los paneles de control.
- Viabilidad de Descarga de Nómina en Excel (.xlsx): Evaluar la factibilidad de exportar a Excel la nómina completa del plantel incluyendo la totalidad de campos (desde Cédula de Identidad hasta Centro de Votación, UBCH y Circuito Comunal).

**2. Soluciones Implementadas y Conclusiones:**
- Recuperación de Contraseña con Firebase Authentication:
  * Se implementó el modal accesible de recuperación con integración nativa a `sendPasswordResetEmail` de Firebase Auth.
  * Se programó la validación estricta de correo electrónico institucional y mensajes claros de estado.
  * Se agregó botón/enlace explícito de retorno inmediato al Login y temporizador automático de 5 segundos con limpieza de memoria.
- Ocultamiento de Cuadratura (v2.11.2):
  * En `personalWizard.js` (`toggleMatriculaUI`), al seleccionar 'Atiende Matrícula = SÍ' se mantienen visibles los campos de Nivel/Modalidad y Especialidad, pero el contenedor del botón de cuadratura (`container-btn-cuadratura`) permanece con `display: none`.
  * En `index.html`, se reforzó con `style="display: none !important;"` tanto en el contenedor como en la tarjeta informativa.
- Estudio de Viabilidad para Descarga Completa en Excel (.xlsx):
  * Factibilidad: 100% Viable y a Costo Cero ($0).
  * Como el expediente completo de cada trabajador ya reside en la memoria del navegador al abrir el plantel (`cargos_personal`), no se requieren lecturas adicionales a Firestore.
  * La exportación abarcará la totalidad de las 8 categorías del formulario (más de 40 campos: Identificación, Localización, Formación Académica, Cargo y Horas, Situación Laboral, Bienestar Social y Participación Comunitaria/Centro de Votación).

**3. Archivos Involucrados:**
- frontend/src/main.js
- frontend/src/personalWizard.js
- frontend/index.html
- frontend/package.json
- bitacora.md

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

### Hito: Optimización de Esquema, Corrección de Descarga Múltiple y Alineación Visual de Nómina Excel (v2.11.4 - v2.11.7)
**Fecha:** 2026-09-14
**Módulo:** Personal / Exportación a Excel (.xlsx) / Interfaz de Usuario (UI)

**1. Requerimientos Institucionales y Observaciones:**
- Depuración de Columnas Redundantes en Excel: Eliminar campos duplicados que sobrecargaban la lectura de la nómina (Cédula Completa, Primer Apellido, Segundo Apellido, Primer Nombre, Segundo Nombre, Total Horas, Descripción Situación).
- Incorporación de Metadatos del Plantel Educativo:
  * Tras "Profesión / Título": Denominación, Nombre Nominal y Nuevo Epónimo.
  * Tras "Código Plantel (DEA)": Cód. Dependencia, Cód. Estadístico, Dependencia, Niveles-Modalidades, Turno(s), Ubicación Geográfica.
- Corrección de Descargas Múltiples Simultáneas: Se detectó que un solo clic en el botón generaba entre 3 y 4 descargas idénticas concurrentes por acumulación de eventos.
- Rediseño y Alineación de Interfaz:
  * El botón verde de exportación se extendía ocupando todo el ancho de la cabecera.
  * Se requirió redimensionarlo a un tamaño compacto y situarlo en disposición horizontal contigua ("lado a lado") con el buscador de personal.
  * Nivelar con precisión milimétrica la altura y margen vertical para que coincida exactamente con el input de búsqueda.

**2. Solución Técnica Implementada:**
- Reestructuración del Esquema de Columnas (`personalWizard.js`):
  * Se extrajeron los 7 campos prescindibles y se inyectaron los 9 campos institucionales procedentes de la configuración global del plantel cargada en memoria.
- Mecanismo Antirrebote y Desacoplamiento de Eventos (`personalWizard.js`):
  * Se removió la vinculación reiterativa de `addEventListener` dentro de `mostrarFormularioPersonal()`.
  * Se implementó cerrojo transaccional en memoria (`window._isExportingExcel`) para garantizar que ante cualquier interacción se ejecute una única exportación a la vez.
- Perfeccionamiento Estético y Alineación CSS (`styles.css` & `index.html`):
  * Se forzó `width: auto !important;`, `white-space: nowrap;` y altura uniforme de `38px` en `.btn-excel-export`.
  * Se neutralizó el margen residual heredado por los inputs del formulario (`margin: 0 !important;` en `.search-wrapper` y `.search-input`), logrando una alineación horizontal y vertical perfecta con el botón.
  * Se organizó el contenedor flex con `gap: 10px; flex-wrap: nowrap;` para una distribución compacta y profesional.
- Cero Costo de Infraestructura (Spark Tier):
  * Toda la extracción de datos y metadatos se ejecuta directamente sobre el estado de la sesión activa en el navegador, preservando el consumo de cuotas de lectura en Firestore en 0.

**3. Archivos Involucrados:**
- webapp/src/personalWizard.js
- webapp/styles.css
- webapp/index.html
- webapp/package.json
- bitacora.md

---

### Hito: Modularización y Redimensión de Tarjetas de Estadísticas (v2.11.8)
**Fecha:** 2026-09-15  
**Módulo:** Panel Administrativo / Métricas y Estadísticas (Rol `munadmin` y Administradores)

**1. Requerimiento:**
- Reducir el tamaño de las tarjetas de métricas (Planteles Activos, Personal Registrado, Usuarios del Sistema) que se mostraban excesivamente grandes.
- Trasladar los estilos desde los atributos inline de `index.html` hacia la hoja de estilos centralizada `styles.css` con comentarios explicativos claros para permitir al usuario calibrar y ajustar las dimensiones a su preferencia.

**2. Solución Técnica Implementada:**
- Desacoplamiento de Estilos a `webapp/styles.css`:
  * Se creó la sección `/* 11. TARJETAS DE ESTADÍSTICAS */` con clases especializadas: `.stats-grid`, `.stat-card`, `.stat-card-icon`, `.stat-card-title`, `.stat-card-number` y `.stat-card-desc`.
  * Se redujo el padding de las tarjetas de `30px` a `16px 20px`, el ícono de `3rem` a `1.8rem`, el número principal de `3.5rem` a `2.2rem` y el ancho mínimo de `300px` a `200px`.
  * Se agregaron comentarios directos señalando cada propiedad modificable para el ajuste fino de tamaños.
- Actualización de `webapp/index.html`:
  * Se eliminaron los estilos inline pesados del contenedor `#admin-tab-estadisticas`, asignando la jerarquía de clases CSS modular.
- Incremento SemVer a **v2.11.8** en `package.json` e `index.html` en cumplimiento de la Regla de Oro 10.

---

### Hito: Calibración Fina de Tarjetas de Estadísticas, Protocolo de Respaldo Textual `conversaciones.md` y Gobernanza Git (v2.11.9)
**Fecha:** 2026-09-16  
**Módulo:** Interfaz de Usuario (UI) / Calibración de Métricas / Gobernanza de Memoria y Protocolos

**1. Requerimiento:**
- Ajuste y reducción del ancho de las tarjetas estadísticas a `160px` para una presentación visual armónica y compacta en el rol `munadmin`.
- Blindaje definitivo ante olvidos de contexto entre sesiones creando el archivo `conversaciones.md` en la raíz del proyecto para alojar todas las intervenciones íntegras y textuales sin omisiones.
- Actualización de la Skill 5 en `SKILL_sgh_firebase.md` para formalizar que cada confirmación de satisfacción ("satisfecho") activa la sincronización obligatoria en `bitacora.md`, `conversaciones.md`, SemVer y subida a GitHub (`git push`).

**2. Solución Técnica Implementada:**
- Calibración CSS (`webapp/styles.css`):
  * Se configuró `grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));` en la clase `.stats-grid` de la sección 11, garantizando distribución horizontal óptima en pantallas medianas y de escritorio.
- Implementación de `conversaciones.md`:
  * Creación del archivo raíz con el historial cronológico completo de la sesión.
- Actualización de Reglas Institucionales (`SKILL_sgh_firebase.md`):
  * Se agregaron las Reglas 5 y 6 a la Skill 5 (`Gestor de Memoria, Bitácora y Registro de Conversaciones`), consolidando el protocolo de respaldo y subida automática a Git.
- Incremento SemVer a **v2.11.9** en `webapp/package.json`.

**3. Archivos Involucrados:**
- `webapp/styles.css`
- `webapp/package.json`
- `conversaciones.md`
- `.agents/skills/webapp-expert/SKILL_sgh_firebase.md`
- `bitacora.md`

---

### Hito: Filtro Estricto de Planteles por Municipio y Seguridad Territorial para rol munadmin (v2.11.10)
**Fecha:** 2026-09-16  
**Módulo:** Gestor de BD / Planteles / Control de Acceso RBAC y Zero-Cost

**1. Requerimiento:**
- En el apartado Gestor de BD -> Planteles, el usuario con rol `munadmin` (Coordinador Municipal) únicamente debe visualizar y gestionar los planteles pertenecientes a su municipio asignado, corrigiendo la anomalía donde se cargaban la totalidad de planteles del Estado.
- Prevenir que el `munadmin` pueda alterar o registrar planteles asignándolos a municipios ajenos a su jurisdicción.

**2. Solución Técnica Implementada:**
- Consulta Optimizada en Firestore (`webapp/src/admin.js` - `loadPlanteles`):
  * Detección dinámica de la jerarquía municipal del usuario (`userData.jerarquia.municipio`).
  * Aplicación de filtro directo `query(collection(db, "planteles"), where("municipio", "==", userMun))`, minimizando las lecturas en Firestore y preservando la cuota diaria del plan Spark.
- Doble Validación y Adaptabilidad en UI (`renderPlantelesList`):
  * Filtrado estricto en memoria para tolerancia ante variaciones de formato o tildes.
  * Personalización contextual del placeholder de búsqueda y mensajes de estado vacío por municipio.
- Blindaje de Integridad Territorial (`openPlantelModal` y `formPlantel` submit):
  * El campo Municipio se autocompleta y bloquea en modo solo lectura (`readOnly`) para el `munadmin`, forzando además que la carga útil persista inmutablemente su municipio oficial.
- Incremento SemVer a **v2.11.10** en `webapp/package.json`.

**3. Archivos Involucrados:**
- `webapp/src/admin.js`
- `webapp/package.json`
- `bitacora.md`
- `conversaciones.md`




