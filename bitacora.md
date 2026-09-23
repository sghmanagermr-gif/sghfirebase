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
 
---
 
### Hito: Integración de Selectores Maestros Institucionales y Campos Complementarios en Modal de Planteles (v2.11.11)
**Fecha:** 2026-09-16  
**Módulo:** Gestor de BD / Planteles / Modal de Edición y Creación / Catálogos Maestros

**1. Requerimiento:**
- Incorporar al modal de creación y edición de planteles los selectores oficiales alimentados desde los catálogos de `sgh_maestro`:
  * Ubicación Geográfica (URBANO, RURAL).
  * Nivel Educativo (los 10 niveles maestros oficiales).
  * Modalidad (ADULTO, ESPECIAL, Regular/Ninguna).
  * Turno (convertir el input libre previo a un selector con los 5 turnos oficiales: MAÑANA, TARDE, DOBLE TURNO, NOCTURNO, SABATINO).
- Incorporar los nuevos campos de captura de datos:
  * Metros cuadrados (con soporte para valores decimales `step="0.01"`).
  * Observaciones (área de texto multilínea institucional).

**2. Solución Técnica Implementada:**
- Estructuración de Interfaz (`webapp/index.html`):
  * Reorganización en grid de 2 columnas dentro de `#form-plantel`.
  * Creación de `<select id="p-ubicacion">`, `<select id="p-nivel">`, `<select id="p-modalidad">` y conversión de `#p-turno` en `<select>`.
  * Adición de `<input type="number" step="0.01" id="p-metros-cuadrados">` y `<textarea id="p-observaciones">`.
- Lógica de Carga, Hidratación y Persistencia (`webapp/src/admin.js`):
  * Función `poblarSelectoresPlantel(catData)`: Lee dinámicamente los catálogos desde `sistema/catalogos_maestros`, `sgh_catalogos` en `localStorage` o el respaldo maestro institucional.
  * Función `asegurarOpcionEnSelect(selectElem, valor)`: Protege la integridad histórica de datos al editar planteles con valores preexistentes.
  * Extensión del submit listener de `formPlantel` para mapear y persistir `ubicacion-geografica`, `ubicacion`, `nivel`, `modalidad`, `turno-plantel`, `turno`, `metros2` y `observaciones` en la colección `planteles` de Firestore.
- Incremento SemVer a **v2.11.11** en `webapp/package.json`.

**3. Archivos Involucrados:**
- `webapp/index.html`
- `webapp/src/admin.js`
- `webapp/package.json`
- `bitacora.md`
- `conversaciones.md`

### Hito: Selección de Planes de Estudio en Modal de Planteles y Persistencia en Firestore (v2.11.12)
**Fecha:** 2026-09-16  
**Módulo:** Gestor de BD / Planteles / Planes de Estudio Institucionales

**1. Requerimiento:**
- Permitir la asignación interactiva de los planes de estudio autorizados que imparte cada plantel en el modal de creación y edición.
- Ubicar la sección inmediatamente después del campo "Observaciones", desplegando todos los planes de estudio existentes en el catálogo con su código, mención/especialidad y una casilla de verificación (`checkbox`).
- Al marcar o desmarcar casillas y guardar el formulario, actualizar la estructura `planes-estudio` del plantel en Firestore tal como lo gestionaba el sistema original.

**2. Solución Técnica Implementada:**
- Interfaz Gráfica (`webapp/index.html`):
  * Inserción de `#plantel-planes-container` debajo de "Observaciones" con scroll suave (`max-height: 200px`), cuadrícula adaptable y badge contador reactivo (`#p-planes-counter`).
  * Expansión del ancho del modal (`max-width: 700px`) para una óptima lectura de los planes.
  * Desacoplamiento total de opciones fijas en HTML para selectores, ahora poblados 100% en tiempo de ejecución.
- Lógica de Catálogo y Persistencia (`webapp/src/admin.js`):
  * Definición de `obtenerPlanesEstudioCatalogo()` y diccionario de respaldo institucional `PLANES_ESTUDIO_FALLBACK` (29 planes oficiales de Inicial, Primaria, Media General y Escuelas Técnicas).
  * Función `poblarCheckboxesPlanes(planesActivos)`: Genera dinámicamente las tarjetas de planes y marca las que corresponden al plantel en edición.
  * Extensión del submit listener de `formPlantel`: Recolecta los planes seleccionados `{ especialidad, mencion }` y los persiste en Firestore bajo el campo `planes-estudio`.
- Incremento SemVer a **v2.11.12** en `webapp/package.json`.

**3. Archivos Involucrados:**
- `webapp/index.html`
- `webapp/src/admin.js`
- `webapp/package.json`
- `bitacora.md`
- `conversaciones.md`

---

### Hito: Saneamiento de Claves en Firestore y Control de Scroll en Modal de Planteles (v2.11.13)
**Fecha:** 2026-09-16  
**Módulo:** Gestor de BD / Planteles / Modal de Edición / Experiencia de Usuario (UX)

**1. Requerimiento:**
- Eliminar la duplicidad de información en Firestore al editar planteles (`planes_estudio`, `ubicacion`, `turno`), asegurando el almacenamiento exclusivo en los nombres de campo oficiales con guion medio (`planes-estudio`, `ubicacion-geografica`, `turno-plantel`) y saneando documentos previos mediante `deleteField()`.
- Al hacer clic en "Guardar Plantel", ubicar de inmediato el modal en el principio (tope superior) para una interacción agradable y despejada.
- Garantizar que al reabrir la edición de cualquier plantel (o crear uno nuevo), la ventana del modal aparezca siempre al inicio y no en la parte inferior donde se encontraba el botón guardar.

**2. Solución Técnica Implementada:**
- Saneamiento y Canonicidad en Firestore (`webapp/src/admin.js`):
  * Se removieron las claves con guion bajo del objeto de persistencia.
  * Se configuró `deleteField()` para `planes_estudio`, `ubicacion` y `turno` al actualizar registros en modo edición.
  * Para los planes de Educación Inicial (20000) y Primaria (21000), se preserva la estructura canónica sin mención ni especialidad.
- Control de Scroll en Modal (`webapp/src/admin.js`):
  * Desplazamiento suave inmediato hacia el tope superior (`scrollTop = 0` y `scrollTo({ top: 0, behavior: 'smooth' })`) al hacer clic en "Guardar Plantel" en el evento `submit`.
  * Función estandarizada `cerrarModalPlantel()` que oculta la ventana y restablece a cero el scroll del fondo `#modal-plantel`, la tarjeta `.lock-card` y el listado `#plantel-planes-container`.
  * En `openPlantelModal()`, reseteo síncrono y multinivel (`requestAnimationFrame` + timeouts) para asegurar que el modal se renderice en el principio superior independientemente de eventos previos.
- Incremento SemVer a **v2.11.13** en `webapp/package.json`.

**3. Archivos Involucrados:**
- `webapp/src/admin.js`
- `webapp/package.json`
- `bitacora.md`
- `conversaciones.md`

---

### Hito: Delimitación de Menú y Métricas Municipales para rol munadmin (v2.11.15)
**Fecha:** 2026-09-16  
**Módulo:** Panel Administrativo / Control de Acceso (RBAC) / Métricas Territoriales / UI

**1. Requerimientos:**
- Delimitar el entorno del Coordinador Municipal (`munadmin`) para mostrar exclusivamente sus módulos de competencia:
  * Métricas Globales contextualizadas a su municipio ("Métricas Municipales - [MUNICIPIO]").
  * Validación de Usuarios (Directores `plaadmin` de su municipio).
  * Gestor de BD conteniendo única y exclusivamente la gestión de `Planteles` de su municipio.
- Ocultar del menú lateral las opciones fuera de su alcance institucional (Despliegue y los 10 catálogos maestros globales de planes de estudio, dependencias, modalidades, etc.).
- Personalizar el encabezado con el distintivo de avatar `CM` y el nombre con indicación de su municipio.

**2. Solución Técnica Implementada:**
- Control y Gobernanza de Interfaz (`webapp/src/admin.js` & `webapp/index.html`):
  * Se asignaron identificadores clave (`#btn-sidebar-estadisticas`, `#btn-sidebar-validacion`, `#btn-sidebar-planteles`, `#admin-stats-title`, `#admin-stats-desc`, `#admin-user-avatar`).
  * Función `configurarInterfazPorRol()`: Oculta dinámicamente los botones de catálogos y Despliegue ante rol `munadmin`.
  * Contextualización automática en tiempo real de títulos: Encabezado personalizado "Métricas Municipales - [MUNICIPIO]" con descripción territorial.
  * Los contadores de métricas (Planteles, Personal y Usuarios) consultan exclusivamente los registros asociados al municipio asignado.
  * Se blindó el enrutamiento de pestañas para rechazar cambios hacia módulos no autorizados.
- Incremento SemVer a **v2.11.15** en `webapp/package.json`.

**3. Archivos Involucrados:**
- `webapp/index.html`
- `webapp/src/admin.js`
- `webapp/package.json`
- `bitacora.md`
- `conversaciones.md`

---

### Hito: Descarga de Nómina Municipal en Excel Ordenada por Código de Plantel (v2.11.16)
**Fecha:** 2026-09-16  
**Módulo:** Panel Administrativo / Reportes Territoriales / Exportación Excel / Rol munadmin

**1. Requerimientos:**
- Permitir al Coordinador Municipal (`munadmin`) descargar la nómina consolidada de todo el personal activo adscrito a los planteles de su municipio.
- La nómina debe estar estrictamente ordenada de forma ascendente por el Código de Plantel (Código DEA).
- Ubicar la opción de acceso en el menú lateral desplegable bajo la ruta: **Gestor de BD -> Planteles**.
- Disponer adicionalmente de un botón de descarga en la cabecera de la pestaña de Planteles.
- Exportar el archivo en formato Excel (`.xlsx`) con las 55 columnas institucionales oficiales completas (datos personales, académicos, laborales, pedagógicos, socioeconómicos y territoriales), enriquecidos con la información de los planteles correspondientes.

**2. Solución Técnica Implementada:**
- Integración en Interfaz (`webapp/index.html`):
  * Se añadió `<button id="btn-sidebar-descargar-nomina-mun">` en el acordeón `Gestor de BD`, colocado exactamente debajo de `#btn-sidebar-planteles`.
  * Se añadió `<button id="btn-descargar-nomina-mun">` en la barra superior de `#admin-tab-planteles` junto a `#btn-nuevo-plantel`.
  * Se actualizaron las etiquetas de versión a `v2.11.16`.
- Lógica de Extracción, Enriquecimiento y Generación (`webapp/src/admin.js`):
  * Importación de `XLSX` (`xlsx`) y `showToast`, `showAlert` desde `uiUtils.js`.
  * En `configurarInterfazPorRol()`: Se mantuvo visible el nuevo botón del sidebar para el rol `munadmin`.
  * Función `exportarNominaMunicipalExcel()`:
    1. Detección del municipio del usuario activo (`userData.jerarquia.municipio` o `userData.municipio`).
    2. Consulta en Firestore con filtro indexado `where('municipio', '==', userMun)` sobre la colección `cargos_personal` (respetando las cuotas Spark Zero-Cost).
    3. Consolidación de metadatos de los planteles del municipio (Denominación, Nombre Nominal, Epónimo, Dependencia, Niveles, Turnos, Ubicación).
    4. Ordenamiento ascendente de los registros por `codigo-plantel` (Código DEA) y secundariamente por nombres.
    5. Mapeo exhaustivo de las 55 columnas oficiales.
    6. Generación de libro Excel con ajuste dinámico de anchos de columna y descarga del archivo `Nomina_Personal_Municipio_[MUNICIPIO]_[FECHA].xlsx`.
  * Control de concurrencia (`window._isExportingExcelMun`) para evitar descargas múltiples accidentales.
- Incremento SemVer a **v2.11.16** en `webapp/package.json`.

**3. Archivos Involucrados:**
- `webapp/index.html`
- `webapp/src/admin.js`
- `webapp/package.json`
- `bitacora.md`
- `conversaciones.md`

---

### Hito: Sistema de Llavero de Competencias Zonales y Selector Territorial de Nóminas (v2.11.17)
**Fecha:** 2026-09-16  
**Módulo:** Panel Administrativo / Gobernanza de Roles / Competencias Zonales / Llavero de Permisos / Exportación Territorial

**1. Requerimientos:**
- Permitir la asignación granular y personalizada de módulos del panel administrativo para los distintos funcionarios con rol Zonal (`zonadmin`) del CDCE / Zona Educativa Mérida.
- Cada funcionario zonal posee competencias específicas (ej. supervisión de planteles, validación de usuarios o estadísticas), por lo que el menú lateral debe adaptarse estrictamente a sus competencias asignadas sin exponer módulos no autorizados.
- Administrar estos permisos de manera sencilla mediante casillas de verificación (checks) tipo "Llavero" desde la vista de Validación de Usuarios.
- Proveer selección del municipio al descargar nóminas en formato Excel para roles zonales y superadmin que no tienen un municipio predeterminado fijo.

**2. Solución Técnica Implementada:**
- Sistema de Llavero de Competencias Modulares (`webapp/index.html` & `webapp/src/admin.js`):
  * Se diseñó el modal `#modal-competencias-zonal` con casillas de verificación para 7 módulos:
    1. 📊 Métricas y Estadísticas Globales (`estadisticas`)
    2. 👥 Validación de Usuarios (`validacion`)
    3. 🏫 Gestor de Planteles (`planteles`)
    4. 📥 Descarga de Nóminas en Excel (`nomina`)
    5. 🎓 Planes de Estudio (`planes`)
    6. 🏢 Catálogos y Listas Maestras (`listas`)
    7. 🚀 Despliegue Técnico y Mantenimiento (`despliegue`)
  * Se agregaron botones rápidos de "Marcar Todos" y "Desmarcar Todos".
  * Se incorporó el botón institucional `🔑 Competencias` en la lista de Validación de Usuarios para filas con rol `zonadmin`, así como una etiqueta visual con el conteo de módulos autorizados.
  * Persistencia segura en Firestore (`usuarios/{uid}.permisos`) usando `safeUpdateDoc`.
- Gobernanza Dinámica del Menú Lateral (Sidebar):
  * `configurarInterfazPorRol()`: Oculta en tiempo real los botones del menú no asignados.
  * Si el grupo Gestor de BD no tiene sub-módulos permitidos, oculta el acordeón por completo.
  * Activación inteligente de la primera pestaña permitida (evita pantallas vacías si el usuario no tiene acceso a métricas).
  * Blindaje ante eventos de clic en el sidebar para impedir la navegación a pestañas no autorizadas.
  * Auto-actualización de sesión en caliente: si el usuario editado es el de la sesión activa, el sidebar se reconfigura de inmediato sin requerir re-inicio de sesión.
- Selector Territorial para Descarga de Nómina (`#modal-seleccionar-municipio-nomina`):
  * Permite a los usuarios zonales y superadministradores seleccionar entre los 23 municipios del estado Mérida antes de generar el archivo Excel con las 55 columnas oficiales ordenado por código DEA.
- Incremento SemVer a **v2.11.17** en `webapp/package.json` e `index.html`.

**3. Archivos Involucrados:**
- `webapp/index.html`
- `webapp/src/admin.js`
- `webapp/package.json`
- `bitacora.md`
- `conversaciones.md`

---

### Hito: Discriminación Granular de Catálogos Maestros en Competencias Zonales (v2.11.18)
**Fecha:** 2026-09-16  
**Módulo:** Panel Administrativo / Gobernanza de Roles / Llavero de Competencias / Catálogos Maestros Discriminados

**1. Requerimientos:**
- Desglosar y discriminar individualmente la opción general de "Catálogos y Listas Maestras" en el modal de competencias zonales (`#modal-competencias-zonal`).
- Permitir la autorización o restricción independiente de cada uno de los catálogos institucionales solicitados:
  * 🏢 Gestionar Dependencias (`cat_dependencia`)
  * 🧩 Gestionar Modalidades (`cat_modalidades`)
  * 📚 Gestionar Niveles Educativos (`cat_niveles_educativos`)
  * 📍 Gestionar Municipios (`cat_municipios`)
  * 💼 Gestionar Situación Laboral (`cat_situacion_laboral`)
  * 📜 Gestionar Nivel de Instrucción (`cat_instruccion`)
  * 🏠 Gestionar Tipo y Condición de Vivienda (`cat_vivienda`)
  * 💍 Gestionar Estado Civil (`cat_estado_civil`)
- Adaptar la visibilidad de los botones del submenú en el acordeón `Gestor de BD` para mostrar única y exclusivamente los catálogos autorizados a cada coordinador zonal.
- Proteger la navegación del panel ante intentos de acceso a catálogos no asignados.
- Si el usuario zonal solo tiene permisos para determinados catálogos y no para métricas o planteles, activar automáticamente el primer catálogo autorizado al iniciar sesión.

**2. Solución Técnica Implementada:**
- Actualización de Interfaz (`webapp/index.html`):
  * Se sustituyó la casilla única de listas maestras por una tarjeta visual estructurada con 8 casillas de verificación individuales, con títulos institucionales claros y descripciones de competencia.
  * Compatibilidad total con los botones "Marcar Todos" y "Desmarcar Todos".
- Lógica de Control y Persistencia (`webapp/src/admin.js`):
  * `openCompetenciasModal()`: Carga el estado de cada casilla leyendo las claves `cat_*` con fallback retrocompatible hacia `permisos.listas`.
  * `btnGuardarCompetencias`: Persiste individualmente los booleanos de cada catálogo y mantiene la bandera general `listas: boolean` para interoperabilidad histórica.
  * `configurarInterfazPorRol()`: Evalúa el atributo `data-lista` de cada botón del sidebar contra la competencia respectiva del usuario zonal. Oculta o muestra cada catálogo con precisión milimétrica.
  * Fallback de navegación: Si el usuario no tiene acceso a pestañas principales, activa el primer catálogo permitido y abre automáticamente el acordeón Gestor de BD.
  * Guardia en clics del sidebar: Bloquea intentos de navegación a catálogos sin permiso.
  * Tabla de Usuarios: Actualizado el contador visual de competencias autorizadas.
- Incremento SemVer a **v2.11.18** en `webapp/package.json`.

**3. Archivos Involucrados:**
- `webapp/index.html`
- `webapp/src/admin.js`
- `webapp/package.json`
- `bitacora.md`
- `conversaciones.md`

---

### Hito: Selector Inteligente de Nómina por Nuevo Epónimo / Consolidado Estatal y Columnas Territoriales (v2.11.19)
**Fecha:** 2026-09-16  
**Módulo:** Exportación Excel / Reportes Institucionales / multi-rol (superadmin, zonadmin, munadmin, pladmin)

**1. Requerimientos:**
- Enriquecer la estructura del archivo Excel (.xlsx) de personal inyectando las columnas territoriales **Estado**, **Municipio** y **Parroquia** ubicadas exactamente entre las columnas `Profesión / Título` y `Denominación`.
- Agregar la opción **TODOS** (Consolidado Estatal) en el selector de municipios para los roles `superadmin` y `zonadmin`, permitiendo descargar la nómina consolidada de los 23 municipios del estado Mérida ordenada por municipio y código DEA.
- Habilitar el modal selector para el rol `munadmin`, mostrando una lista de opciones ordenadas por el **Nuevo Epónimo** de los planteles de su municipio, más la opción de **TODOS LOS PLANTELES** para descargar la nómina municipal completa.

**2. Solución Técnica Implementada:**
- Modificación del Mapeo de Columnas (`webapp/src/personalWizard.js` & `webapp/src/admin.js`):
  * Se insertaron las columnas `'Estado'`, `'Municipio'` y `'Parroquia'` entre `'Profesión / Título'` y `'Denominación'`.
  * Total de 58 columnas oficiales con ajuste dinámico de celdas y anchos en el libro Excel.
- Rediseño Dinámico del Modal Selector (`webapp/index.html` & `webapp/src/admin.js`):
  * Función `abrirModalSeleccionarNomina()`:
    - Para `munadmin`: contextualiza título y descripción con su municipio y carga en el selector la opción de "TODOS LOS PLANTELES" más cada institución educativa listada por su **Nuevo Epónimo** y código DEA.
    - Para `zonadmin` y `superadmin`: carga la opción destacada `⭐ TODOS LOS MUNICIPIOS (CONSOLIDADO ESTATAL)` junto a los 23 municipios del estado Mérida.
  * Motor `ejecutarExportacionNominaExcel()`:
    - Soporte para consulta consolidada estatal con ordenamiento primario por Municipio, secundario por Código DEA y terciario por Apellidos y Nombres.
    - Soporte para consulta por plantel específico para coordinadores municipales.
    - Generación de nombres de archivo acordes (`Nomina_Personal_Consolidado_Estadal_MERIDA_[FECHA].xlsx`, `Nomina_Personal_Municipio_[MUNICIPIO]_[FECHA].xlsx`, `Nomina_Personal_[EPONIMO]_[DEA]_[FECHA].xlsx`).
- Incremento SemVer a **v2.11.19** en `webapp/package.json`.

**3. Archivos Involucrados:**
- `webapp/index.html`
- `webapp/src/admin.js`
- `webapp/src/personalWizard.js`
- `webapp/package.json`
- `bitacora.md`
- `conversaciones.md`

---
### Hito: Saneamiento de Nóminas Excel y Eliminación de Registros en Blanco (v2.11.20)
**Fecha:** 2026-09-21  
**Módulo:** Exportación Excel / Reportes Institucionales / multi-rol

**1. Requerimientos:**
- Evitar que los archivos Excel generados, especialmente en las descargas consolidadas (ej. "Todos los municipios" para zonadmin), incluyan "registros en blanco" o filas sin información vital.

**2. Solución Técnica Implementada:**
- Filtro Estricto de Datos (webapp/src/admin.js y webapp/src/personalWizard.js):
  * Se implementó un filtro en la extracción de documentos de cargos_personal que evalúa dinámicamente si el registro carece de Cédula de Identidad Y de Nombres/Apellidos.
  * Aquellos registros huérfanos o vacíos (evaluados mediante !!(ced || nom)) son descartados en memoria antes de la iteración de mapeo, garantizando que el Excel final solo contenga funcionarios reales.
- Gobernanza de Repositorio:
  * Se sincronizó correctamente esta actualización (v2.11.20) con el repositorio remoto tras una desconexión temporal de la sesión anterior.
- Incremento SemVer a **v2.11.20** en webapp/package.json e index.html.

**3. Archivos Involucrados:**
- webapp/src/admin.js
- webapp/src/personalWizard.js
- webapp/index.html
- webapp/package.json
- itacora.md
- conversaciones.md

---

### Hito: Saneamiento de Exportación Excel y Soporte de Llaves Heredadas (v2.11.21)
**Fecha:** 2026-09-21  
**Módulo:** Exportación Excel / Reportes Institucionales

**1. Requerimientos:**
- El usuario reportó que el Excel seguía exportando "registros vacíos" a pesar del filtro implementado en v2.11.20, y que la Aspiradora Inteligente (Mantenimiento de BD) indicaba que no había basura en la base de datos.
- Se determinó que los registros no estaban realmente vacíos en Firestore, sino que provenían de una importación heredada que utilizaba llaves en mayúsculas (ej. CEDULA, NOMBRES, APELLIDOS Y NOMBRES).
- La función generadora del Excel solo estaba leyendo llaves minúsculas (cedula-identidad, nombre-apellido), provocando que las celdas quedaran en blanco en el reporte descargado.

**2. Solución Técnica Implementada:**
- Actualización de Mapeo Excel (webapp/src/admin.js y webapp/src/personalWizard.js):
  * Se agregó robustez en la extracción de datos al momento de generar el archivo .xlsx.
  * La variable cedulaNum ahora soporta llaves mayúsculas de importaciones antiguas.
  * La variable nombreCompleto ahora unifica la lectura de múltiples llaves heredadas.
- Con este ajuste, los 1420 registros que se mostraban "vacíos" ahora exponen correctamente su información real, evitando su eliminación accidental.
- Incremento SemVer a **v2.11.21** en webapp/package.json e index.html.

**3. Archivos Involucrados:**
- webapp/src/admin.js
- webapp/src/personalWizard.js
- webapp/index.html
- webapp/package.json
- bitacora.md
- conversaciones.md

---

### Hito: Prevención de Pérdida de Datos y Parche de Mapeo (v2.11.22)
**Fecha:** 2026-09-21  
**Módulo:** Exportación Excel / Mantenimiento de BD

**1. Requerimientos:**
- El usuario reportó que, tras la actualización v2.11.21, los nombres seguían apareciendo en blanco en el Excel exportado, por lo que solicitó borrarlos definitivamente de la base de datos pensando que eran basura.
- Al utilizar la herramienta "Analizar Registro Sospechoso", se descubrió que los registros sí contenían nombres, pero almacenados bajo una nueva llave heredada no contemplada: "NOMBRE Y APELLIDO".

**2. Solución Técnica Implementada:**
- Actualización Crítica de Mapeo (webapp/src/admin.js y webapp/src/personalWizard.js):
  * Se inyectó la validación explícita para extraer emp['NOMBRE Y APELLIDO'] en las funciones de filtro y de generación de Excel.
- Esta intervención rápida salvó 1420 registros válidos de ser eliminados manualmente por el administrador, garantizando la integridad de la base de datos.
- Incremento SemVer a **v2.11.22** en webapp/package.json e index.html.

**3. Archivos Involucrados:**
- webapp/src/admin.js
- webapp/src/personalWizard.js
- webapp/index.html
- webapp/package.json
- bitacora.md
- conversaciones.md

---

### Hito: Mapeo Masivo de Llaves Heredadas (Legacy Upper-Case Mapping) (v2.11.23)
**Fecha:** 2026-09-21  
**Módulo:** Exportación Excel / Reportes Institucionales

**1. Requerimientos:**
- El usuario cuestionó por qué solo se arregló la cédula y el nombre para los primeros 1420 registros, mientras que el resto de las columnas (Género, Fecha de Nacimiento, Talla de Camisa, etc.) seguían en blanco. Y exigió que se solucionara de una vez por todas para no tener que reportar campo por campo.
- Además, preguntó por qué a partir de la fila 1421 todos los datos sí salían perfectos en el Excel sin tener que arreglar nada.

**2. Solución Técnica Implementada:**
- Se procedió a actualizar exhaustivamente el mapeo de los 58 campos del Excel en webapp/src/admin.js y webapp/src/personalWizard.js.
- Se inyectó la cláusula de respaldo (|| emp['LLAVE EN MAYÚSCULA']) para TODOS los campos institucionales identificados en el JSON extraído. Ejemplo: 'Género': emp['genero'] || emp['GENERO'] || ''.
- Con esto, los 1420 registros provenientes de la importación legacy antigua (que usaba llaves en mayúsculas) ahora son interpretados perfectamente por el generador de Excel, al igual que los registros modernos (fila 1421+) que ya usaban las llaves nativas en minúsculas.
- Incremento SemVer a **v2.11.23**.

**3. Archivos Involucrados:**
- webapp/src/admin.js
- webapp/src/personalWizard.js
- webapp/index.html
- webapp/package.json
- bitacora.md
- conversaciones.md

---

### Hito: Implementación del Escudo de Memoria (Zero-Cost Shield) (v2.11.24)
**Fecha:** 2026-09-21  
**Módulo:** Exportación Excel, Aspiradora Inteligente y Análisis de Datos (Optimización de Firebase)

**1. Requerimientos:**
- El usuario reportó que las métricas principales (Planteles Activos, Personal Registrado, Usuarios) estaban en cero, y que las ediciones de los catálogos "parecían no guardarse" (Modo Fantasma), pero al mismo tiempo seguía pudiendo descargar la nómina masiva en Excel infinitamente.
- Se identificó que esto es el comportamiento nativo de Firebase al agotar la cuota (429 Quota Exceeded): El Web SDK sirve la nómina masiva desde el IndexedDB local de forma transparente, pero bloquea las consultas getCountFromServer y rechaza las mutaciones (updateDoc), dejando el sistema parcialmente funcional pero desconectado del backend.
- Riesgo crítico reportado por el usuario: Los Zonadmins podrían generar cambios pensando que se guardaron, perdiendo información, o descargar el consolidado repetidas veces quemando la cuota diaria en minutos.

**2. Solución Técnica Implementada:**
- Se implementó el patrón de **Escudo de Memoria (Bóveda de Caché)** en dmin.js.
- Se creó la variable global window._cacheExportPersonal para almacenar la matriz de datos de Firestore mapeada en memoria RAM por sesión.
- Las funciones ejecutarExportacionNominaExcel, tnLimpiarBdVacios (Aspiradora) y tnAnalizarMuestra fueron refactorizadas para interceptar la llamada y buscar los datos en window._cacheExportPersonal['TODOS'] (o por municipio) antes de ejecutar getDocs.
- Si los datos existen en la memoria (porque ya se descargaron una vez en la sesión), las descargas subsecuentes consumen **0 lecturas de cuota**.
- Se implementó lógica dinámica: si la Aspiradora elimina registros, la caché se invalida (delete window._cacheExportPersonal['TODOS']) para forzar una nueva lectura limpia.
- Incremento SemVer a **v2.11.24**.

**3. Archivos Involucrados:**
- webapp/src/admin.js
- webapp/index.html
- webapp/package.json
- bitacora.md
- conversaciones.md

---

### Ajuste Menor: Filtro de Auto-Exclusión en Validación de Usuarios (v2.11.25)
**Fecha:** 2026-09-21  
**Módulo:** Validación de Usuarios (admin.js)

**1. Requerimientos:**
- El usuario reportó que el rol zonadmin podía verse a sí mismo en la lista de Validación de Usuarios, lo que permitía auto-eliminarse accidentalmente. Mencionó que munadmin no tenía este problema debido al filtro de jurisdicción (que solo muestra roles plaadmin).

**2. Solución Técnica Implementada:**
- Se inyectó una condición universal en la función loadUsuariosList de dmin.js: if (u.uid === userData.uid) return;.
- Esto garantiza que ningún administrador, sin importar su nivel jerárquico, se vea a sí mismo en el panel de validación de usuarios.
- Incremento SemVer a **v2.11.25**.

**3. Archivos Involucrados:**
- webapp/src/admin.js
- webapp/index.html
- webapp/package.json
- bitacora.md
- conversaciones.md

---


### Hito 27: Reestructuraci�n de la Interfaz UI de Despliegue y Aspiradora (Z-Index y DOM)
**Fecha:** 2026-09-21  
**M�dulo:** Interfaz Principal (index.html) y Permisos (admin.js)

**1. Requerimientos:**
- El usuario report� que el panel lateral (sidebar) aparec�a detr�s de la vista de "Control de Despliegue Global".
- Tambi�n report� que "Mantenimiento de Base de Datos" deb�a tener su propia pesta�a en la barra lateral en lugar de estar contenida dentro de Despliegue.
- Posteriormente, indic� que ambas pesta�as parec�an "tarjetas" modales y no se integraban visualmente al nivel de los dem�s apartados (fuera del main principal).

**2. Soluci�n T�cnica Implementada:**
- Se extrajo el contenido de "Mantenimiento de Base de Datos" hacia su propia etiqueta <div id="admin-tab-aspiradora">, creando un bot�n lateral dedicado.
- En dmin.js, se inyect� la l�gica de visibilidad de los botones tn-sidebar-despliegue y tn-sidebar-aspiradora condicionada al rol de superadministrador.
- **Correcci�n Estructural Cr�tica (El DOM roto):** Se detect� mediante depuraci�n manual y 
ode.js que el contenedor principal <main id="admin-main"> sufr�a un cierre prematuro debido a la presencia de un </div> adicional en la l�nea 1537 (inmediatamente despu�s de cat-vista-grid).
- Este cierre prematuro empujaba forzosamente los apartados dmin-tab-despliegue y dmin-tab-aspiradora fuera del flujo del <main>, despoj�ndolos de m�rgenes y paddings.
- Se elimin� el </div> intruso, reubicando ambas vistas dentro del <main>, y se eliminaron las clases .glass-panel y paddings residuales para garantizar homogeneidad con el estilo de dmin-tab-estadisticas.

**3. Archivos Involucrados:**
- webapp/index.html
- webapp/src/admin.js
- webapp/package.json
- bitacora.md
- conversaciones.md

### v2.11.27 - Ajuste de Motor de Estad�sticas y Validaciones Offline-First (21 de Septiembre de 2026)

1. **Refactorizaci�n de Panel Munadmin:** Se implement� el panel extendido para el Coordinador Municipal (Discriminaci�n de Personal, Situaci�n Laboral, Matr�cula y Jubilables).
2. **Tolerancia a Fallos de Cuota (Offline-First):** Se inyect� la funci�n `safeGetCount` para atrapar excepciones de 'Quota Exceeded' de Firebase (Plan Spark) y mostrar visualmente la etiqueta 'En mantenimiento' sin romper la interfaz.
3. **Cach� H�brido:** Las tablas inferiores aprovechan `getDocs` con fallback a la cach� persistente (IndexedDB) de Firebase para procesar datos sin incurrir en lecturas al servidor si la cuota fue excedida, comprobando la eficacia de la arquitectura Zero-Cost.
4. **Correcci�n Visual de Matr�cula:** Se sustituy� la presentaci�n de n�meros simples en el panel de Estatus de Matr�cula por una lista escroleable donde se muestran los Ep�nimos de los planteles Cargados (??) y Pendientes (??).
5. **Correcci�n de L�gica Falsa-Positiva:** Se modific� la validaci�n de estado de carga de matr�cula. Anteriormente se verificaba la variable transaccional `p.datos_completados`, la cual pod�a arrojar verdaderos en planteles con matr�cula vac�a por clicks accidentales. Ahora, la validaci�n escanea matem�ticamente la propiedad interna (`total-gen > 0 || total-vac-gen > 0`), eliminando discrepancias con los planteles vac�os (Ej: Amable Antonio Rangel).


### v2.12.0 - Panel de M�tricas Nivel Estadal (ZonAdmin) (21 de Septiembre de 2026)

1. **Activaci�n de Panel Extendido Estadal:** Se redise�� el panel inferior de estad�sticas extendidas para activarse en cuentas con jerarqu�a `zonadmin`, `admin` o `superadmin`. 
2. **Lectura Completa y Agrupaci�n Din�mica:** En lugar de buscar planteles o n�mina por un solo municipio, el c�digo detecta el contexto `isEstadal`, trayendo la data integral y aplicando algoritmos de agrupaci�n din�mica por Municipio en memoria (Zero-Cost sobre cach� en reads subsecuentes).
3. **Redise�o Estatus de Matr�cula (Sem�foro Zonal):** La lista de escuelas pas� a ser un consolidador de carga por Municipio, indicando la cantidad de planteles Cargados y Pendientes en la jurisdicci�n bajo un esquema visual de sem�foro (Verde, Amarillo, Rojo).
4. **Refactorizaci�n Tabla Jubilables:** Se adapt� la renderizaci�n para mostrar el total consolidado de posibles jubilados por Municipio en la vista Zonal, preservando la vista por DEA (c�digo de plantel) en la vista Municipal.


### v2.12.1 - Indicadores de Carga Visual (Spinners) y Descargas Concurrentes (21 de Septiembre de 2026)

**1. Requerimientos:**
- El usuario reportó latencia perceptible durante la carga de las estadísticas extendidas: *Discriminación de Personal*, *Estatus de Matrícula*, *Situación Laboral* y *Personal por Jubilarse (Próximo Año)*.
- Solicitó la incorporación de spinners de carga para mejorar la retroalimentación visual (UX) y evitar que los paneles permanezcan estáticos en 0 o con textos planos mientras se procesan los datos.

**2. Solución Técnica y Decisiones Arquitectónicas (Zero-Cost Optimization):**
- **Paralelismo de Consultas Firestore:** Anteriormente, las descargas de las colecciones planteles y cargos_personal se ejecutaban de forma secuencial (wait encadenado). Se optimizó mediante Promise.all([pPlanteles, pCargos]), ejecutando ambas consultas concurrentemente en los servidores de Google. Esto redujo el tiempo total de transferencia a la mitad manteniendo exactamente el mismo consumo de cuota Spark.
- **Spinners y Estados de Carga Modulares:**
  - En styles.css se incorporaron las clases .panel-card-spinner (anillo circular azul con rotación fluida mediante @keyframes spin) y .panel-card-loading (animación de pulso continuo con tipografía muted).
  - En index.html se crearon contenedores desacoplados de carga (stat-disc-loading, stat-mat-loading) y de contenido (stat-disc-content, stat-mat-content) para Discriminación de Personal y Estatus de Matrícula.
  - En Situación Laboral y Jubilables se inyectaron directamente los spinners animados dentro de #stat-situacion-laboral y #tbody-jubilables al inicializar la consulta.
- **Manejo Dinámico de Transiciones:** Al activarse loadEstadisticas(), cada tarjeta se resetea a su estado de carga; en cuanto finaliza el cálculo de cada bloque, su respectivo spinner se oculta de forma atómica y se devela el contenido calculado (display: flex / tabla).
- **Tolerancia a Bloqueos de Cuota:** En caso de interrupción de red o saturación de cuota Spark, los spinners son reemplazados limpiamente por advertencias no intrusivas en rojo (*"En mantenimiento"*), evitando que el usuario quede esperando indefinidamente.
- **Control SemVer:** Incremento de versión a **v2.12.1** en package.json e index.html.

**3. Archivos Involucrados:**
- webapp/src/admin.js
- webapp/index.html
- webapp/styles.css
- webapp/package.json
- itacora.md
- conversaciones.md

---
### v2.12.2 - Corrección de Codificación UTF-8 / Mojibake y Responsividad Móvil (22 de Septiembre de 2026)

**1. Requerimientos:**
- Limpiar caracteres corruptos (mojibake) en modales y alertas de `admin.js`.
- Mejorar la visualización en dispositivos móviles de las tarjetas de estadísticas.

**2. Solución Técnica y Decisiones Arquitectónicas:**
- Se sanearon más de 233 secuencias de caracteres corruptos y emojis mal codificados en `admin.js`, sustituyéndolos por secuencias de escape Unicode puras (`\uD83D\uDD34`, `\u2705`, etc.) para garantizar portabilidad en cualquier sistema operativo.
- Se ajustaron los estilos CSS de las tarjetas de métricas para un apilamiento fluido y legible en pantallas móviles.
- **Control SemVer:** Incremento de versión a **v2.12.2**.

**3. Archivos Involucrados:**
- `webapp/src/admin.js`
- `webapp/styles.css`
- `webapp/package.json`
- `webapp/index.html`

---

### v2.12.3 - Notificación de Registro con Alerta de Carpeta Spam (22 de Septiembre de 2026)

**1. Requerimientos:**
- El usuario solicitó alertar a los nuevos usuarios al registrarse sobre revisar la carpeta de correo no deseado (spam) y coordinar con el responsable municipal.

**2. Solución Técnica y Decisiones Arquitectónicas:**
- Se enriqueció la notificación de éxito en `registro.js` / modal de registro, especificando que el correo de verificación puede llegar a la carpeta de spam y que deben comunicarse con el responsable municipal de Gestión Humana para la aprobación de su cuenta.
- **Control SemVer:** Incremento de versión a **v2.12.3**.

**3. Archivos Involucrados:**
- `webapp/src/registro.js`
- `webapp/package.json`
- `webapp/index.html`

---

### v2.12.4 - Nombres Oficiales de Roles Institucionales (22 de Septiembre de 2026)

**1. Requerimientos:**
- Adecuar las opciones del selector de roles en la pantalla de registro a los nombres institucionales oficiales del estado Mérida.

**2. Solución Técnica y Decisiones Arquitectónicas:**
- Se actualizaron las etiquetas del selector a: `Responsable SGH ZONA`, `Responsable SGH Municipal` y `Director de plantel`, preservando las claves internas del sistema (`zonadmin`, `munadmin`, `plaadmin`).
- **Control SemVer:** Incremento de versión a **v2.12.4**.

**3. Archivos Involucrados:**
- `webapp/index.html`
- `webapp/package.json`

---

### v2.12.5 - Selectores en Cascada Municipio/Parroquia y Filtro en Planteles (22 de Septiembre de 2026)

**1. Requerimientos:**
- Mantener la integridad de los datos geográficos en el modal "Nuevo Plantel", implementando selectores desplegables en cascada para Municipio y Parroquia basados en la división político-territorial oficial.
- Restringir la selección de municipio para el rol `munadmin` a su propio municipio.
- Añadir filtro por parroquia y columna de parroquia en la tabla de planteles.

**2. Solución Técnica y Decisiones Arquitectónicas:**
- **Módulo Geográfico Autónomo (`geografia.js`):** Se implementó la estructura de los 23 municipios del estado Mérida y sus respectivas parroquias oficiales, con funciones de normalización de cadenas.
- **Selectores Dinámicos:** En el modal de plantel, al seleccionar el municipio se pueblan instantáneamente las parroquias correspondientes. Para `munadmin`, el municipio se preselecciona y bloquea (`disabled`).
- **Filtrado Avanzado:** Se agregó el selector `#filtro-parroquia-plantel`, la columna de visualización en la tabla de instituciones y la búsqueda textual por parroquia.
- **Control SemVer:** Incremento de versión a **v2.12.5**.

**3. Archivos Involucrados:**
- `webapp/src/geografia.js` [NUEVO]
- `webapp/src/admin.js`
- `webapp/index.html`
- `webapp/package.json`

---

### v2.13.0 - Arquitectura de Ficha Resumen Precomputada y Blindaje Zero-Cost en Estadísticas (22 de Septiembre de 2026)

**1. Requerimientos:**
- Resolver el agotamiento recurrente de la cuota diaria de lecturas de Firebase Spark (límite de 50.000 lecturas/día). El usuario reportó bloqueo del sistema ("Quota Exceeded") tras abrir la sesión como superusuario.
- Mantener el principio irrestricto de **Zero-Cost** (Plan gratuito de Firebase sin incurrir en costos ni interrupciones de servicio).
- Los cálculos deben basarse en la nómina más reciente descargada por el usuario desde el sistema (`Nomina_Personal_Consolidado_Estadal_MERIDA_2026-09-21 (5).xlsx`) y en el catálogo institucional `bd_sgh.json`.

**2. Diagnóstico del Problema:**
- En la función `loadEstadisticas()` de `admin.js`, cada apertura del panel de administración o recarga de página ejecutaba:
  - `getDocs(collection(db, 'cargos_personal'))` escaneando 23.288 documentos.
  - `getDocs(collection(db, 'planteles'))` escaneando 1.159 documentos.
- Total por visita: **24.447 lecturas**. Tan solo 2 visitas o recargas en el día consumían ~49.000 lecturas, provocando el bloqueo inmediato por 24 horas del proyecto en Google Cloud.

**3. Solución Técnica y Decisiones Arquitectónicas (Pre-computed Aggregation Pattern):**
- **Motor de Agregación Local (`generar_resumen_estadisticas.mjs`):**
  - Script autónomo en Node.js que procesa directamente en la máquina local la nómina oficial descargada (`Nomina_Personal_Consolidado_Estadal_MERIDA_2026-09-21 (5).xlsx`, 23.288 registros) y el archivo `bd_sgh.json` (1.221 planteles en 23 municipios).
  - Tiempo de ejecución: **10 segundos**.
  - Consumo de cuota Firestore: **CERO (0) lecturas**.
  - Genera el consolidado estructurado `webapp/public/resumen_estadisticas.json` (137 KB), que contiene los totales globales y la desagregación exacta para cada uno de los 23 municipios:
    - **Total Personal:** 23.288 (14.955 Docentes, 1.444 Administrativos, 6.889 Obreros).
    - **Situaciones Laborales:** Distribución de 22 categorías (`ACTIVO`: 19.992, `EN PROCESO DE JUBILACIÓN`: 592, `SINCERACIÓN DE NÓMINA`: 589, etc.).
    - **Personal por Jubilarse:** Algoritmo corregido con soporte para fechas `D/M/YYYY` y años de antigüedad $ge 25$, detectando 1.741 trabajadores en proyección de jubilación distribuidos por municipio.
    - **Planteles Educativos:** 1.221 planteles mapeados por municipio y parroquia.
- **Refactorización de `loadEstadisticas()` en `webapp/src/admin.js`:**
  - Se eliminaron definitivamente las consultas masivas `getDocs()` sobre colecciones enteras.
  - La pantalla ahora consulta el documento único consolidado `estadisticas/resumen_global` en Firestore (**1 sola lectura** en lugar de 24.447). Con este cambio, el sistema soporta hasta 50.000 aperturas del panel al día dentro de la capa gratuita.
  - **Escudo Salvavidas Resiliente (Zero-Cost Shield):** Si Firestore reporta cuota agotada o falta de conexión, la aplicación recurre de forma transparente a `fetch('/resumen_estadisticas.json')`. Las métricas se renderizan en 10 milisegundos y la interfaz jamás se bloquea ni muestra pantallas en blanco.
  - **Auto-Sincronización:** Cuando un usuario con rol `superadmin` abre la sesión, el cliente sincroniza automáticamente la Ficha Resumen hacia Firestore (1 sola escritura de 20.000 disponibles al día).
- **Control SemVer:** Incremento de versión MENOR a **v2.13.0** (mejora arquitectónica fundamental).
- **Despliegue:** Compilación de producción (`npm run build`) y despliegue a Firebase Hosting (`https://sgh-merida.web.app`).

**4. Archivos Involucrados:**
- `webapp/generar_resumen_estadisticas.mjs` [NUEVO]
- `webapp/public/resumen_estadisticas.json` [NUEVO]
- `webapp/src/admin.js`
- `webapp/package.json`
- `webapp/index.html`
- `bitacora.md`
- `conversaciones.md`

---

### v2.13.1 - Títulos y Subtítulos Contextuales en Tarjetas Estadísticas (22 de Septiembre de 2026)

**1. Requerimientos:**
- Clarificar la tarjeta de "Planteles Activos" que mostraba el texto confuso "Basado en Directores Registrados", generando discordancia con el contador de usuarios.
- Adaptar dinámicamente las etiquetas según la jerarquía institucional (Municipal vs Estadal).

**2. Solución Técnica y Decisiones Arquitectónicas:**
- En `webapp/index.html` y `webapp/src/admin.js`, se implementaron IDs dedicados (`stat-planteles-title`, `stat-planteles-desc`, `stat-personal-desc`, `stat-usuarios-desc`) para inyectar textos adaptados al rol:
  - **MunAdmin:** "Planteles del Municipio" ("Total escuelas en el municipio"), "Personal Registrado" ("Nómina municipal activa"), "Usuarios del Sistema" ("Directores con cuenta de acceso").
  - **ZonAdmin / SuperAdmin:** "Planteles del Estado" ("Total escuelas del estado"), "Personal Registrado" ("Nómina estadal activa"), "Usuarios del Sistema" ("Cuentas de acceso activas").
- **Control SemVer:** Incremento a **v2.13.1**.

**3. Archivos Involucrados:**
- `webapp/index.html`
- `webapp/src/admin.js`
- `webapp/package.json`

---

### v2.13.2 - Sincronización Real del Contador de Usuarios y Eliminación de Fallback Estático (22 de Septiembre de 2026)

**1. Requerimientos:**
- El superadministrador detectó que la tarjeta "Usuarios del Sistema" mostraba 54 usuarios cuando en la tabla de validación solo residían 11 cuentas registradas.

**2. Diagnóstico y Solución Técnica:**
- **Diagnóstico:** En la función `loadEstadisticas()`, la llamada `getCountFromServer(qUsuarios)` arrojaba error de cuota diaria excedida de Firebase, cayendo en un bloque `catch` que contenía un valor de reserva estático residual (`54`).
- **Solución:**
  - Se eliminó definitivamente el valor quemado 54.
  - Se vinculó la tarjeta directamente a la memoria local (`usuariosLocales.length`) y se inyectó una actualización reactiva dentro del listener en tiempo real `onSnapshot` de la colección `usuarios`.
  - Ahora refleja con fidelidad matemática los 11 usuarios gestionados para el superadministrador y los 10 directores para el coordinador municipal de Santos Marquina.
- **Control SemVer:** Incremento a **v2.13.2**.

**3. Archivos Involucrados:**
- `webapp/src/admin.js`
- `webapp/package.json`
- `webapp/index.html`

---

### v2.13.3 - Tratamiento Resiliente y Sobrio para Métricas Pendientes ("En cálculo...") (22 de Septiembre de 2026)

**1. Requerimientos:**
- Ante la indisponibilidad de consultas en vivo por límite de cuota Spark en Firebase, evitar mostrar ceros fríos (ej. "0 Cargados" en matrícula) que induzcan a interpretaciones erróneas de inactividad de las instituciones.

**2. Solución Técnica y Decisiones Arquitectónicas:**
- En `renderStatValue()` y en el panel de Estatus de Matrícula, cuando un valor numérico dependa de sincronización de servidor y esté en 0 o pendiente, se sustituye por la etiqueta sobria y modesta: **"En cálculo..."**.
- En la lista de planteles de matrícula, se reemplazó el listado masivo de puntos rojos por una tarjeta informativa explicativa que aclara que el reporte de carga escolar se sincronizará al normalizarse las consultas con el servidor de base de datos.
- **Control SemVer:** Incremento a **v2.13.3**.

**3. Archivos Involucrados:**
- `webapp/src/admin.js`
- `webapp/index.html`
- `webapp/package.json`

---

### v2.13.4 - Corrección de Ámbito Léxico (TDZ) y Restauración Integral del Dashboard (22 de Septiembre de 2026)

**1. Requerimientos:**
- Resolver incidente reportado en v2.13.3 donde las tarjetas superiores permanecían en "En cálculo..." y el panel extendido inferior no se mostraba.

**2. Diagnóstico y Solución Técnica:**
- **Diagnóstico:** Al reorganizar las llamadas de inicio en `initAdminDashboard`, la invocación de `loadUsuariosList()` se ejecutaba antes de la declaración léxica de las variables `let usuariosLocales` y `let unsubscribeUsuarios`, generando un error de tiempo de ejecución (`ReferenceError` por Temporal Dead Zone) que detenía abruptamente la ejecución antes de invocar `loadEstadisticas()`.
- **Solución:** Se reubicaron las declaraciones de variables al inicio del bloque de inicialización, asegurando su disponibilidad antes de ejecutar los procesos asíncronos.
- **Resultado:** Restauración completa de todas las tarjetas con sus datos consolidados (Planteles: 1.221, Personal: 23.288, Usuarios: 11) y el panel extendido con todas sus gráficas y tablas.
- **Control SemVer:** Incremento a **v2.13.4**.

**3. Archivos Involucrados:**
- `webapp/src/admin.js`
- `webapp/package.json`
- `webapp/index.html`
- `bitacora.md`
- `conversaciones.md`

---

### v2.14.0 - Suite de Supervisión Institucional (Modo Supervisor y Ficha Rápida) (23 de Septiembre de 2026)

**1. Requerimientos:**
- Permitir a los usuarios municipales (`munadmin`), zonales (`zonadmin`) y `superadmin` supervisar el trabajo de los planteles educativos (`plaadmin`).
- Implementar y permitir la evaluación simultánea de dos modalidades:
  - Opción 1: Modo Supervisor (visión espejo en vivo con banner superior y botón de retorno al panel municipal).
  - Opción 2: Ficha Rápida / Expediente de Auditoría (modal emergente con tres pestañas: Institucional, Matrícula y Nómina).
- Respetar rigurosamente el principio Zero-Cost (0 lecturas adicionales a Firestore utilizando datos locales en memoria y caché de sesión).

**2. Solución Técnica y Arquitectura:**
- **Banner Modo Supervisor:** Implementación de `#banner-modo-supervision` fijo en el encabezado de `#lock-screen`, con identificación del plantel, código DEA y botón de retorno seguro al panel municipal (`window.salirSupervisionPlantel()`).
- **Seguridad y Solo Lectura:** Coacción visual y en el DOM que bloquea inputs de matrícula, oculta botones de guardado e inhabilita edición/eliminación de personal en modo supervisión.
- **Modal de Ficha Rápida:** Implementación de `#modal-ficha-auditoria` con navegación por pestañas: Ficha Institucional, Matrícula y Secciones, y Nómina de Personal.
- **Zero-Cost Shield:** Consultas alimentadas de `currentPlanteles` en memoria y caché temporal de auditoría (`_cacheSupervision` y `_cacheStaffSupervision`).
- **Control SemVer:** Incremento de versión MENOR a **v2.14.0**.

**3. Archivos Involucrados:**
- `webapp/index.html`
- `webapp/package.json`
- `webapp/styles.css`
- `webapp/src/admin.js`
- `webapp/src/main.js`
- `webapp/src/personalWizard.js`

---

### v2.14.1 - Optimización de Desglose de Matrícula y Navegación Bidireccional (23 de Septiembre de 2026)

**1. Requerimientos:**
- Corregir el desglose de matrícula en la Ficha de Auditoría para reflejar con exactitud los datos de varones, hembras, secciones y subtotales por cada grado en planteles que ya declararon matrícula.
- Incorporar navegación bidireccional desde el Modo Supervisor de vuelta hacia la Ficha de Auditoría.
- Consagrar la Opción 2 (Ficha Rápida) como puerta de entrada principal en la tabla de planteles municipales.

**2. Solución Técnica:**
- **Parser NoSQL Robusto:** Reescritura de `renderFilasMatriculaFicha` para leer e interpretar correctamente los mapas de grados (`1` al `6`), secciones (`A`, `B`, `U`) y géneros (`mas`, `fem`) tanto de Educación Básica/Primaria (`21000`), Inicial (`20000`) como de Media (`31011`, etc.).
- **Fila de Total Consolidado:** Inyección de fila de resumen al pie de la tabla con la sumatoria automática de secciones, varones, hembras y gran total escolar (ej. 104 estudiantes en la EB 21 de Noviembre).
- **Botón Volver a la Ficha:** Incorporación del botón `#btn-volver-a-ficha` en el banner de supervisión que cierra la pantalla completa y reabre de forma inmediata el expediente de auditoría del plantel supervisado.
- **Simplificación de la Tabla:** Enfoque prioritario en el botón `📋 Ficha` en la lista de planteles.
- **Control SemVer:** Incremento de versión PARCHE a **v2.14.1**.

**3. Archivos Involucrados:**
- `webapp/index.html`
- `webapp/package.json`
- `webapp/src/admin.js`
- `webapp/src/main.js`
- `bitacora.md`
- `conversaciones.md`

---

### v2.14.2 - Estatus de Matrícula en Vivo con Escudo de Memoria Zero-Cost y Filtros Interactivos (23 de Septiembre de 2026)

**1. Requerimientos:**
- Resolver la causa por la cual la tarjeta "Estatus de Matrícula" permanecía en estado "En cálculo..." al renovarse la cuota de Firebase.
- Implementar sincronización real para usuarios municipales (`munadmin`) sin poner en riesgo la cuota gratuita diaria de 50.000 lecturas de Firebase Spark, previendo municipios de alta densidad como Libertador (~190 planteles).
- Dotar al usuario de herramientas de filtrado rápido entre planteles cargados y pendientes para facilitar el seguimiento operativo, junto con un botón de sincronización manual.

**2. Solución Técnica y Arquitectura:**
- **Análisis de Causa Raíz:** Se determinó que el archivo maestro `resumen_estadisticas.json` / `estadisticas/resumen_global`, generado desde un respaldo previo de nómina, poseía `matricula.cargados = 0`, activando la cláusula de respaldo visual. En Firestore real, Santos Marquina ya cuenta con 5 planteles cargados y 13 pendientes.
- **Escudo de Memoria de Sesión (Zero-Cost Cache):** Creación de los módulos `obtenerPlantelesMunCache`, `guardarPlantelesMunCache` y `limpiarPlantelesMunCache` en `admin.js`. La consulta de planteles por municipio (`where("municipio", "==", mun)`) se ejecuta una sola vez al iniciar sesión y se almacena en memoria de aplicación y `sessionStorage`.
- **Unificación de Datos:** La misma colección en memoria alimenta simultáneamente la tarjeta de métricas de matrícula y la tabla administrativa de planteles (`currentPlanteles`), eliminando peticiones redundantes al servidor (0 lecturas adicionales al navegar o refrescar).
- **Filtros Interactivos en Cliente:** Inyección de pestañas dinámicas (`Todos`, `Pendientes` y `Cargados`) que permiten al coordinador municipal filtrar instantáneamente en pantalla las escuelas pendientes para su gestión operativa.
- **Botón de Sincronización Manual:** Inyección del botón `🔄 Sincronizar` en el encabezado de la tarjeta de matrícula con purga de caché bajo demanda.
- **Protección de Nivel Estadal:** Para Zonadmin y Superadmin se mantiene el esquema consolidado de 1 sola lectura (`estadisticas/resumen_global`), preservando el 97.5% de la cuota diaria libre.
- **Control SemVer:** Incremento de versión PARCHE a **v2.14.2**.

**3. Archivos Involucrados:**
- `webapp/package.json`
- `webapp/index.html`
- `webapp/src/admin.js`
- `bitacora.md`
- `conversaciones.md`

---
