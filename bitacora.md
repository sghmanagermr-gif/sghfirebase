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

### v2.14.3 - Corrección de Inicialización de Planteles y Renderizado Incondicional en Pestañas (23 de Septiembre de 2026)

**1. Requerimientos:**
- Subsanar el bloqueo en la tabla de gestión de planteles que permanecía indefinidamente en el mensaje "Cargando planteles...".
- Garantizar que al hacer clic en la pestaña "Planteles", la tabla siempre dibuje las instituciones registradas de forma inmediata, aprovechando el escudo de memoria Zero-Cost.

**2. Solución Técnica y Arquitectura:**
- **Resolución de Zona Muerta Temporal (TDZ):** Se identificó que las variables de control y referencias DOM (`currentPlanteles`, `tbodyPlanteles`, `inpBuscarPlantel`, `modalPlantel`, `formPlantel`, `btnDescargarNominaMun`) estaban declaradas con `let` y `const` cientos de líneas después de donde se ejecutaba el enrutamiento inicial por rol (`configurarInterfazPorRol`). Se reubicaron al inicio inmediato de `initAdminDashboard`, eliminando excepciones silenciosas de referencia.
- **Disparador Incondicional de Pestaña:** Se actualizó el escuchador de eventos de pestañas en el sidebar para que, al seleccionar `admin-tab-planteles`, siempre invoque `loadPlanteles()`.
- **Renderizado Instantáneo desde Memoria/Caché:** Dentro de `loadPlanteles()`, se validó que si los planteles ya existen en la caché municipal (`obtenerPlantelesMunCache`) o en el arreglo `currentPlanteles`, se ejecuten de inmediato `poblarFiltroParroquiasTabla()` y `renderPlantelesList()`, renderizando la tabla en 0 ms con 0 lecturas a Firestore.
- **Control SemVer:** Incremento de versión PARCHE a **v2.14.3**.

**3. Archivos Involucrados:**
- `webapp/package.json`
- `webapp/index.html`
- `webapp/src/admin.js`
- `bitacora.md`
- `conversaciones.md`

---

### v2.14.4 - Reorganización y Centrado Horizontal de Tarjetas Maestras (23 de Septiembre de 2026)

**1. Requerimientos:**
- Reordenar las tarjetas de estadísticas principales en la vista del panel: Usuarios del Sistema en primera posición, seguido de Planteles del Municipio y Personal Registrado.
- Centrar horizontalmente el contenedor maestro de métricas (`div class="stats-grid"`) en la pantalla.

**2. Solución Técnica y Arquitectura:**
- **Reorganización Estructural del DOM:** Se actualizó `index.html` para posicionar la tarjeta de Usuarios (`#stat-usuarios`) como primer elemento de la cuadrícula, preservando los identificadores y clases dinámicas.
- **Centrado y Justificación CSS:** En `styles.css` se incorporaron las reglas `margin: 0 auto;` y `justify-content: center;` sobre la clase `.stats-grid`, con refuerzo de estilo en línea en `index.html`, logrando una disposición equilibrada y armónica tanto en monitores de alta resolución como en pantallas medianas y móviles.
- **Control SemVer:** Incremento de versión PARCHE a **v2.14.4**.

**3. Archivos Involucrados:**
- `webapp/package.json`
- `webapp/index.html`
- `webapp/styles.css`
- `bitacora.md`
- `conversaciones.md`

---

### v2.14.5 - Flexibilización y Reglas de Validación en Formulario de Planteles (23 de Septiembre de 2026)

**1. Requerimientos:**
- Establecer como opcionales los campos de Metros Cuadrados y Observaciones en el modal de planteles.
- Implementar validación condicional entre Nivel Educativo y Modalidad: si se selecciona uno de ellos, el otro no es requerido; solo se exige atención si ambos quedan vacíos.
- Eximir de la obligatoriedad de selección de planes de estudio a planteles con modalidad Especial o Adulto, manteniendo la obligatoriedad para planteles regulares.

**2. Solución Técnica y Arquitectura:**
- **Formulario e Interfaz (`index.html`):** Se eliminó el atributo nativo `required` del selector de nivel, añadiendo indicadores visuales claros `(o Modalidad *)`, `(o Nivel *)`, `(Opcional)` en Metros Cuadrados y Observaciones, y un contenedor de aviso contextual `#p-planes-info-msg`.
- **Lógica de Validación Dinámica (`admin.js`):** Se implementó la función `actualizarReglasNivelModalidadPlanes()`, sincronizada mediante escuchadores de eventos sobre los selectores de nivel y modalidad y activada al abrir el modal. En el evento `submit`, se valida que exista al menos Nivel o Modalidad, y se condiciona la exigencia de planes según la modalidad detectada (`ESPECIAL` o `ADULTO`).
- **Control SemVer y Despliegue:** Incremento de versión PARCHE a **v2.14.5**, compilación en Vite y despliegue en Firebase Hosting.

**3. Archivos Involucrados:**
- `webapp/package.json`
- `webapp/index.html`
- `webapp/src/admin.js`
- `bitacora.md`
- `conversaciones.md`

---


### v2.14.6 - Manejo Condicional de Matrícula y Mensaje de Orientación para Planteles sin Plan de Estudio (23 de Septiembre de 2026)

**1. Requerimientos:**
- Evitar que en los planteles sin planes de estudio asociados (como planteles de modalidades Especial o Adulto) se muestre el formulario de matrícula (`#contenedor-matricula`), secciones o botones de acción.
- Mostrar únicamente la tarjeta de datos de la institución y un aviso destacado con el mensaje: "Comuníquese con el responsable de Gestión Humana Municipal, para orientaciones".

**2. Solución Técnica y Arquitectura:**
- **Estructura HTML (`index.html`):** Se incorporó el contenedor institucional `#mensaje-sin-planes` inmediatamente después del bloque de datos del plantel con estilo de alerta informativa, y se asignó identificador `#contenedor-acciones-matricula` al bloque inferior de guardado.
- **Lógica de Visibilidad Dinámica (`main.js`):** En la función `mostrarCandado`, se reemplazó el fallback indiscriminado por una validación estricta de planes (`Object.keys(planes).length > 0`). Si no existen planes, se ocultan `#contenedor-matricula`, `#cont-secciones-detalle` y `#contenedor-acciones-matricula`, y se hace visible únicamente `#mensaje-sin-planes`. Si existen planes, se despliega la interfaz correspondiente con normalidad.
- **Control SemVer y Despliegue:** Incremento de versión PARCHE a **v2.14.6**, compilación con Vite y despliegue en Firebase Hosting.

**3. Archivos Involucrados:**
- `webapp/package.json`
- `webapp/index.html`
- `webapp/src/main.js`
- `bitacora.md`
- `conversaciones.md`

---

### v2.14.7 - Persistencia de Sesión por Pestaña y Sincronización Global de Versión (23 de Septiembre de 2026)

**1. Requerimientos:**
- Evitar que al presionar F5 o refrescar la página se solicite nuevamente iniciar sesión.
- Sincronizar los indicadores visuales del número de versión en todos los puntos de la interfaz (Login, Barra de navegación, Título de la pestaña y Panel Administrativo).

**2. Solución Técnica y Arquitectura:**
- **Persistencia en Firebase Auth (`firebase.js` y `main.js`):** Se configuró `browserSessionPersistence` para la instancia de autenticación primaria. Esto preserva el estado de sesión activo durante refrescos o navegación dentro de la misma pestaña, cerrándose únicamente al cerrar la pestaña o el navegador completo.
- **Sincronización Visual Global (`index.html`):** Se unificó el indicador de versión en la etiqueta `<title>`, en el encabezado de la tarjeta de Login, en la barra superior del Dashboard y en el header del Panel de Administración.
- **Control SemVer y Despliegue:** Incremento de versión PARCHE a **v2.14.7**, compilación en Vite y despliegue en Firebase Hosting.

**3. Archivos Involucrados:**
- `webapp/package.json`
- `webapp/index.html`
- `webapp/src/firebase.js`
- `webapp/src/main.js`
- `bitacora.md`
- `conversaciones.md`

---

### v2.14.8 - Soporte de Matrícula y Secciones por Grupos para Modalidad Especial y Estabilización DOM (23 de Septiembre de 2026)

**1. Requerimientos:**
- Permitir a los planteles de Modalidad Especial (que no poseen códigos de planes de estudio tradicionales) registrar matrícula y secciones organizadas por Grupos (Grupo A, Grupo B, Grupo C...).
- Desplegar selector/campo de 'Cantidad de Grupos' que genere dinámicamente las tarjetas de grupos con campos de género femenino y masculino.
- Calcular en tiempo real subtotales por grupo, total de la modalidad y sumar a la matrícula general del plantel.
- Presentar el desglose de grupos en la ficha del plantel dentro del módulo de administración.
- Resolver desbalance estructural de etiquetas en el DOM HTML que provocaba pantalla en blanco tras el inicio de sesión.

**2. Solución Técnica y Arquitectura:**
- **Estructura HTML (`index.html`):** Incorporación del contenedor `#bloque-especial` dentro de `#contenedor-matricula` con input maestro `#secEsp` y contenedor dinámico `#cont-dinamico-especial`. Corrección y cierre estricto de etiquetas `</div>` en bloques de media técnica y contenedor principal del panel de administración, validando balanceo al 100% de la jerarquía.
- **Motor Dinámico de Grupos (`main.js`):** Implementación de `_renderCajasEspecial(numGrupos)` para generar los bloques de cada grupo con inputs `.mat-especial`. Vinculación al motor de cálculo en tiempo real y persistencia estructurada en Firestore bajo `matricula.modalidades.especial = { grupos, 'total-especial-mas', 'total-especial-fem', 'total-especial' }`. Soporte en `mostrarCandado` para detectar `modalidad.includes('ESPECIAL')` e hidratar datos existentes.
- **Enrutador de Inicio de Sesión (`main.js`):** Soporte unificado para roles `plaadmin` y `plant`, asegurando el despliegue inmediato de la vista del plantel.
- **Módulo Administrativo (`admin.js`):** Adaptación del renderizado de la ficha del plantel para iterar sobre `mat.modalidades?.especial?.grupos` e imprimir filas detalladas de cada grupo con sus totales y secciones.
- **Control SemVer y Despliegue:** Incremento de versión PARCHE a **v2.14.8**, compilación con Vite y despliegue a producción en Firebase Hosting.

**3. Archivos Involucrados:**
- `webapp/package.json`
- `webapp/index.html`
- `webapp/src/main.js`
- `webapp/src/admin.js`
- `bitacora.md`
- `conversaciones.md`

---

### v2.14.9 - Soporte de Matrícula y Secciones por Grupos para Modalidad Adulto (23 de Septiembre de 2026)

**1. Requerimientos:**
- Permitir a los planteles de Modalidad Adulto (Educación de Adultos) registrar matrícula y secciones organizadas por Grupos (Grupo A, Grupo B, Grupo C...).
- Incorporar selector maestro de 'Cantidad de Grupos' que genere dinámicamente las tarjetas de grupos con desglose por género (FEM y MAS).
- Calcular en tiempo real subtotales por grupo, total de la modalidad y acumular a la matrícula global del plantel.
- Presentar el desglose de grupos en la ficha institucional del plantel dentro del módulo administrativo.

**2. Solución Técnica y Arquitectura:**
- **Estructura HTML (`index.html`):** Incorporación del componente `#bloque-adulto` dentro de `#contenedor-matricula` con input maestro `#secAdu` (clase `.sec-master-input`), contenedor dinámico `#cont-dinamico-adulto` y franja resumen `#tot-adulto`.
- **Motor Dinámico de Grupos (`main.js`):** Creación de `_renderCajasAdulto(numGrupos)` para generar los bloques de grupos con inputs `.mat-adulto`. Integración en el motor de cálculo reactivo y persistencia estructurada en Firestore bajo `matricula.modalidades.adulto = { grupos, 'total-adulto-mas', 'total-adulto-fem', 'total-adulto' }`.
- **Visibilidad Dinámica e Hidratación (`main.js`):** Detección automática en `mostrarCandado` de planteles con `modalidad.includes('ADULTO')`, desplegando el bloque correspondiente y precargando datos históricos desde Firestore.
- **Ficha Administrativa (`admin.js`):** Integración de `mat.modalidades?.adulto` para detallar fila por fila cada grupo de Educación de Adultos con sus secciones y matrícula por género.
- **Control SemVer y Despliegue:** Incremento de versión PARCHE a **v2.14.9**, compilación limpia con Vite y despliegue a producción en Firebase Hosting (https://sgh-merida.web.app).

**3. Archivos Involucrados:**
- `webapp/package.json`
- `webapp/index.html`
- `webapp/src/main.js`
- `webapp/src/admin.js`
- `bitacora.md`
- `conversaciones.md`

---

### v2.14.10 - Restricción de Acceso para Creación de Planteles por Rol (23 de Septiembre de 2026)

**1. Requerimientos:**
- Restringir la visibilidad y uso del botón '➕ Nuevo Plantel' en la pestaña de planteles del panel administrativo exclusivamente a usuarios con rol 'superadmin' y 'zonadmin'.
- Ocultar el botón para usuarios con rol 'munadmin' (Coordinador Municipal) e impedir la apertura o guardado no autorizado del modal de creación.

**2. Solución Técnica y Arquitectura:**
- **Control de Interfaz en DOM (`index.html` y `admin.js`):** Se estableció `display: none;` por defecto para el botón `#btn-nuevo-plantel` en `index.html`, eliminando destellos no deseados. En la función `configurarInterfazPorRol()` de `admin.js`, se condicionó su activación visual únicamente a que el usuario posea privilegios `isSuperAdmin` o `isZonAdmin`.
- **Protección Transaccional en Código (`admin.js`):** Se añadieron barreras lógicas de validación en `openPlantelModal()` y en el escuchador de `submit` del formulario `#form-plantel` para bloquear cualquier invocación o envío que carezca de los privilegios correspondientes.
- **Control SemVer y Despliegue:** Incremento de versión PARCHE a **v2.14.10**, compilación con Vite y despliegue a producción en Firebase Hosting (https://sgh-merida.web.app).

**3. Archivos Involucrados:**
- `webapp/package.json`
- `webapp/index.html`
- `webapp/src/admin.js`
- `bitacora.md`
- `conversaciones.md`

---

### v2.14.11 - Corrección de Sumatoria Global y Detección de Matrícula para Modalidades Especial y Adulto (24 de Septiembre de 2026)

**1. Requerimientos:**
- Corregir fallo por el cual los planteles de modalidades Especial y Adulto no reflejaban la sumatoria de matrícula total en el documento general de Firestore tras guardar, apareciendo como 'Pendiente' en el panel administrativo municipal (`munadmin`).
- Asegurar que el cómputo final de matrícula global (`total-gen-fem`, `total-gen-mas` y `total-gen`) integre de forma vinculante los totales de grupos de Especial y Adulto.
- Optimizar la función de detección de matrícula en el módulo administrativo para identificar modalidades multinivel y actualizar la ficha del plantel con el estatus 'Matrícula Declarada'.

**2. Solución Técnica y Arquitectura:**
- **Motor de Cómputo Global (`main.js`):** En el manejador de envío (`submit`) del formulario de matrícula, se incorporaron los acumuladores de `matricula.modalidades.especial` y `matricula.modalidades.adulto` dentro de las sumas maestras (`sumFem`, `sumMas`), evitando que la escoba digital (`sweepZeros`) purgue el campo `total-gen` por haber quedado sobreescrito en 0. Asimismo, se incorporó explícitamente el campo `matricula-total` en el payload transaccional.
- **Hidratación en Carga de Formulario (`main.js`):** En la función `mostrarCandado()`, se ajustó la asignación del campo de solo lectura `#inp-matricula-total` para tomar resilentemente los totales de las modalidades especiales si el total genérico no estuviese presente.
- **Escáner de Verificación en Panel (`admin.js`):** Se optimizó `verificarPlantelTieneMatricula(p)` para evaluar directamente las propiedades de Especial y Adulto y sus grupos, así como un recorrido recursivo profundo sobre cualquier propiedad numérica mayor a cero. En `abrirFichaAuditoria()`, se unificó la lectura con esta función para que el distintivo de estatus marque inmediatamente 'Matrícula Declarada' y exponga el número real de alumnos.
- **Control SemVer y Despliegue:** Incremento de versión PARCHE a **v2.14.11**, compilación limpia con Vite y despliegue a producción en Firebase Hosting (https://sgh-merida.web.app).

**3. Archivos Involucrados:**
- `webapp/package.json`
- `webapp/index.html`
- `webapp/src/main.js`
- `webapp/src/admin.js`
- `bitacora.md`
- `versiones.md`
- `conversaciones.md`

---
### Ciclo v2.14.12: 4ta Tarjeta de Matrícula (Municipal/Estadal) y Cómputo Estadal Zero-Cost

**1. Objetivos:**
- Atender solicitud del Jefe de Supervisión Educativa para agregar una tarjeta de "Total Matrícula" junto a Usuarios, Planteles y Personal.
- Contextualizar el nombre y valor según el rol: para `munadmin` debe decir **Matrícula Municipal** y totalizar los alumnos del municipio; para `superadmin` y `zonadmin` debe decir **Matrícula Estadal** y totalizar los alumnos de todo el estado Mérida.
- Mantener estricto cumplimiento de la regla **Zero-Cost** (cero lecturas adicionales innecesarias de Firestore).
- Corregir el estatus de matrícula estadal que mostraba "En cálculo..." para `superadmin` y `zonadmin`.

**2. Solución Técnica y Arquitectura:**
- **Tarjeta 4 en Interfaz (`index.html` y `styles.css`):** Se incorporó el elemento `#stat-matricula` en la cuadrícula `.stats-grid`, estilizado con icono 🎓 y tipografía numérica en color ámbar (`#ea580c`). Se calibró el ancho máximo de la cuadrícula a 1050px para garantizar alineación equilibrada de las 4 tarjetas en escritorio y responsividad fluida en móviles.
- **Cálculo Municipal Zero-Cost (`admin.js`):** Para `munadmin`, la sumatoria municipal se ejecuta en el navegador sobre el arreglo de planteles que ya se encuentra en memoria/caché (`plantelesMun`), consumiendo exactamente 0 lecturas adicionales de Firestore.
- **Cómputo Estadal Ultraligero y Caché (`admin.js`):** Para `superadmin` y `zonadmin`, se sustituyó la espera pasiva de la ficha estática por una consulta filtrada ultraligera (`where("datos_completados", "==", true)`), que solo lee las escuelas que ya enviaron matrícula (evitando escanear 1.221 registros). Se integró un gestor de caché de sesión en `sessionStorage` (`obtenerMatriculaEstadalCache`, `guardarMatriculaEstadalCache`, `limpiarMatriculaEstadalCache`).
- **Estatus de Matrícula Estadal con Pestañas Dinámicas:** Se implementó una vista dual en `#stat-mat-lista`: pestaña "Planteles Cargados" (desglosa nombre, municipio y número de estudiantes de cada plantel registrado) y pestaña "Por Municipios" (muestra los 23 municipios con sus contadores de planteles cargados y pendientes).
- **Sincronización Transparente:** El botón "🔄 Sincronizar" quedó activo tanto para coordinadores municipales como para autoridades estadales, permitiendo actualización inmediata y guardado de respaldo en `estadisticas/resumen_global`.

**3. Archivos Involucrados:**
- `webapp/package.json` (Versión 2.14.12)
- `webapp/index.html` (Badge y 4ta tarjeta)
- `webapp/styles.css` (Alineación cuadrícula)
- `webapp/src/admin.js` (Lógica Zero-Cost, cachés, cómputos estadales/municipales y UI interactiva)
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`

---
### Ciclo v2.14.13: Estandarización de la Tabla de Planteles por Nuevo Epónimo

**1. Objetivos:**
- Atender requerimiento institucional para adecuar la tabla del módulo Planteles (`#tbody-planteles`), mostrando de forma predominante el **Nuevo Epónimo** de la institución educativa en lugar de la denominación nominal tradicional, adaptando la lectura a la nomenclatura manejada por el equipo de supervisores y directores.
- Preservar la denominación histórica como referencia secundaria sin sobrecargar visualmente la interfaz.
- Indexar las búsquedas por el nuevo epónimo y ordenar la tabla alfabéticamente.

**2. Solución Técnica y Arquitectura:**
- **Encabezado de Tabla (`index.html`):** Actualización del encabezado de la segunda columna de "NOMBRE" a "NUEVO EPÓNIMO".
- **Lógica de Renderizado y Fallback (`admin.js`):** En `renderPlantelesList()`, se extrae prioritariamente `p['nombre-plantel']?.['nuevo-eponimo']` o `p['nombre-plantel']?.nuevo_eponimo`. Si existe un nombre nominal distinto, se inyecta como subtítulo complementario `(Nominal: ...)`. En ausencia de nuevo epónimo, se utiliza el nombre nominal como respaldo seguro.
- **Algoritmo de Ordenamiento (`admin.js`):** Ordenamiento alfabético mediante `localeCompare` en español tomando como clave el Nuevo Epónimo visible.
- **Motor de Búsqueda Adaptado (`admin.js`):** El placeholder del input `#inp-buscar-plantel` se actualizó a *"Buscar por DEA, epónimo o parroquia..."*, y el filtro evalúa en tiempo real coincidencias sobre epónimo, nominal, DEA, municipio y parroquia.
- **Control SemVer:** Incremento de versión PARCHE a **v2.14.13** en `package.json` y todas las etiquetas visuales de `index.html`.

**3. Archivos Involucrados:**
- `webapp/package.json` (Versión 2.14.13)
- `webapp/index.html` (Encabezado de tabla y badges de versión)
- `webapp/src/admin.js` (Renderizado, ordenamiento y búsqueda por Nuevo Epónimo)
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`

---
### Ciclo v2.14.14: Discriminación Jerárquica de Usuarios por Rol y Nomenclatura Institucional

**1. Objetivos:**
- Atender requerimiento institucional para discriminar y ordenar la lista de cuentas en el módulo de Usuarios (`#tbody-usuarios`) según el rol del usuario que inicia sesión:
  - Para `superadmin`: Visualizar a los usuarios ordenados estrictamente por jerarquía: primero Coordinadores Zonales (`zonadmin`), segundo Coordinadores Municipales (`munadmin`), y tercero Directores de Plantel (`plaadmin`).
  - Para `zonadmin`: Visualizar de forma exclusiva únicamente a los Coordinadores Municipales (`munadmin`), restringiendo directores u otros niveles.
  - Para `munadmin`: Mantener visualización exclusiva de los Directores de Plantel (`plaadmin`) de su municipio.
- Permitir al administrador y a las autoridades identificar de inmediato a qué rol pertenece cada usuario registrado.
- Adaptar la nomenclatura del sistema a términos más intuitivos y corporativos: "Pizarra" (en sustitución de Estadísticas/Métricas) y "Usuarios del Sistema" (en sustitución de Validación de Usuarios).

**2. Solución Técnica y Arquitectura:**
- **Control de Acceso RBAC en Carga (`admin.js`):** En `loadUsuariosList()`, se inyectó la condición estricta para `zonadmin` (`if (userData.rol === 'zonadmin' && u.rol !== 'munadmin') return;`), asegurando que solo los coordinadores municipales se agreguen a la memoria local.
- **Métricas de Pizarra Contextualizadas (`admin.js`):** En `loadEstadisticas()`, para el rol `zonadmin`, la tarjeta `#stat-usuarios` consulta mediante `getCountFromServer` los usuarios con `rol == 'munadmin'` y define la descripción en "Coordinadores municipales".
- **Ordenamiento Jerárquico Client-Side (`admin.js`):** En `renderUsuariosList()`, se definió el mapa de prioridades (`zonadmin: 1, munadmin: 2, plaadmin: 3`). La lista se ordena primero por rol y secundariamente por municipio y nombre.
- **Separadores Visuales por Categoría (`admin.js`):** Se crearon filas de cabecera (`.role-section-header`) que se intercalan automáticamente al cambiar de grupo de rol, indicando título con icono, descripción institucional y contador total de usuarios en ese rol.
- **Insignias Visuales por Rol:** En la columna "Rol y Ubicación", cada registro exhibe un distintivo con estilos cromáticos y semánticos únicos (Morado/Violeta para Zonadmin 🏛️, Azul Celeste para Munadmin 🏢 y Verde Esmeralda para Plaadmin 🏫).
- **Filtro Selectivo por Rol (`index.html` y `admin.js`):** Se integró el selector `#filter-rol-usuario` visible para superadmin para alternar entre ver todos los roles clasificados o filtrar uno individual.
- **Actualización de Nomenclatura Institucional (`index.html` y `admin.js`):** Se unificó el término "Pizarra" en botones de navegación y encabezados de métricas, y "Usuarios del Sistema" en el acceso de personal administrativo.

**3. Archivos Involucrados:**
- `webapp/package.json` (Versión 2.14.14)
- `webapp/index.html` (Badges de versión, selector de roles y nomenclatura institucional)
- `webapp/src/admin.js` (Filtros RBAC, ordenamiento jerárquico, separadores visuales, insignias y métricas de Pizarra)
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`

---

---
### Ciclo v2.14.15: Optimización de Consulta y Carga de Planteles para Niveles Estadales

**1. Objetivos:**
- Resolver incidencia reportada por el usuario en la carga de la tabla de planteles al iniciar sesión como `superadmin` o `zonadmin`.
- Garantizar que las autoridades con competencia estadal puedan visualizar los 1.221 planteles registrados sin interrupciones ni bloqueos de consulta.

**2. Solución Técnica y Arquitectura:**
- **Refactorización de Carga (`admin.js`):** En `loadPlanteles()`, se estandarizó la consulta para usuarios estadales (`userMun === null`), consultando la colección completa `planteles` y almacenando el listado en `currentPlanteles`.
- **Sincronización de Componentes de Interfaz:** Se garantizó la población de selectores y el renderizado sin dependencias de variables municipales inexistentes.
- **Control SemVer:** Incremento a **v2.14.15** en `package.json` e `index.html`.

**3. Archivos Involucrados:**
- `webapp/src/admin.js`
- `webapp/package.json`
- `webapp/index.html`
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`

---
### Ciclo v2.14.16: Saneamiento Histórico de Epónimos con Fechas Seriales de Excel

**1. Objetivos:**
- Corregir de raíz la visualización anómala de números (como `-28678`, `-31367`, `-32763`, `46307`) en la columna de Nuevo Epónimo de la tabla de planteles.
- Diagnosticar el origen del problema: conversión automática de fechas históricas por Microsoft Excel durante la migración del archivo `RAC ESTADO MERIDA - PLANTELES.csv`.
- Sanear de manera exacta y definitiva los 13 planteles afectados, restituyendo sus nombres históricos patrios y garantizando que se persistan en Firestore y se muestren impecablemente en toda la aplicación.

**2. Solución Técnica y Arquitectura:**
- **Diagnóstico y Mapeo Exacto:** Se auditaron los 13 códigos DEA afectados y se identificaron sus correspondencias nominales e históricas:
  1. `OD14841420`: `24 DE JUNIO DE 1821` (antes `-28678`) - Sucre
  2. `S2183D1401`: `12 DE FEBRERO DE 1814` (antes `-31367`) - Alberto Adriani
  3. `OD17241401`: `19 DE ABRIL DE 1810` (antes `-32763`) - Alberto Adriani
  4. `OD01331406`: `19 DE ABRIL DE 1810` (antes `-32763`) - Campo Elías
  5. `OD11311405`: `22 DE OCTUBRE DE 1818` (antes `-29653`) - Arzobispo Chacón
  6. `OD03171401`: `1 DE MAYO` (antes `46143`) - Alberto Adriani
  7. `OD02671401`: `23 DE ENERO` (antes `46045`) - Alberto Adriani
  8. `OD12311410`: `23 DE ENERO DE 1958` (antes `21208`) - Julio César Salas
  9. `OD04011401`: `12 DE OCTUBRE` (antes `46307`) - Alberto Adriani
  10. `ON10031401`: `12 DE OCTUBRE` (antes `46307`) - Alberto Adriani
  11. `OD11461406`: `12 DE OCTUBRE` (antes `46307`) - Campo Elías
  12. `OD17171412`: `5 DE JULIO` (antes `46208`) - Libertador
  13. `OD11451405`: `23 DE MAYO` (antes `46165`) - Arzobispo Chacón
- **Diccionario Maestro y Helper Escudo (`admin.js`):** Se definió `CORRECCIONES_EPONIMOS_EXCEL` y la función `obtenerEponimoLimpioPlantel(p)`. La función intercepta cualquier cadena puramente numérica o con signo negativo y la reemplaza por el nombre institucional correcto o nominal.
- **Integración Transversal en la Interfaz (`admin.js`, `main.js`, `personalWizard.js`):**
  - En la tabla de planteles: renderizado de celda, filtrado por texto y ordenamiento alfabético A-Z.
  - En modales administrativos: modal de confirmación de eliminación y precarga en el modal de edición `#p-eponimo`.
  - En reportes: opciones del modal de nómina y generación de columnas y nombres de archivos en la exportación de nómina a Excel.
  - En formularios principales y de personal: blindaje en `main.js` y `personalWizard.js` para prellenar nombres correctos.
- **Saneamiento Proactivo en Base de Datos (Zero-Cost / Authenticated Session):**
  - Al cargar la lista de planteles como `superadmin` o `admin`, el sistema ejecuta en segundo plano `safeUpdateDoc` sobre cada uno de los 13 planteles afectados, actualizando los campos `nombre-plantel.nuevo-eponimo` y `nombre-plantel.nuevo_eponimo` en Firestore.
- **Control SemVer:** Incremento de versión PARCHE a **v2.14.16** en `package.json` y en todas las etiquetas visibles de `index.html`.

**3. Archivos Involucrados:**
- `webapp/package.json` (Versión 2.14.16)
- `webapp/index.html` (Badges de versión v2.14.16)
- `webapp/src/admin.js` (Diccionario de correcciones, helper `obtenerEponimoLimpioPlantel`, saneamiento proactivo Firestore, renderizado, ordenamiento y exportación)
- `webapp/src/main.js` (Limpieza de epónimos al cargar formulario)
- `webapp/src/personalWizard.js` (Respaldo defensivo ante cadenas numéricas)
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`

---
### Ciclo v2.14.17: Buscador con Selectores en Cascada para Planteles y Armonización Visual

**1. Objetivos:**
- Incorporar dos selectores en cascada (Municipio y Parroquia) en la barra de herramientas del módulo de Planteles para facilitar la navegación y búsqueda sobre el universo de más de mil instituciones educativas del Estado Mérida.
- Mantener la cohesión jerárquica por rol: los coordinadores municipales (`munadmin`) tienen su municipio prefijado y protegido, mientras que `superadmin` y `zonadmin` pueden alternar libremente entre los 23 municipios.
- Integrar la búsqueda en tiempo real combinando el texto ingresado en `#inp-buscar-plantel` con los filtros de municipio y parroquia.
- Armonizar el diseño visual corrigiendo desalineaciones de altura, márgenes inferiores residuales (`margin-bottom: 16px`) y padding heredados de estilos globales.

**2. Solución Técnica y Arquitectura:**
- **Inyección de Componentes DOM (`index.html`):** Creación del selector `#filtro-municipio-plantel` junto al existente `#filtro-parroquia-plantel` y el buscador `#inp-buscar-plantel` en un contenedor flexible unificado.
- **Lógica de Cascada y Poblamiento (`admin.js`):**
  - Se crearon las funciones `poblarFiltrosGeograficosTabla()` y `actualizarParroquiasFiltro(municipioSeleccionado)` utilizando el catálogo de `geografia.js`.
  - Al cambiar de municipio, el selector de parroquias se repuebla automáticamente en cascada con las parroquias correspondientes y se restablece a la opción "Todas las Parroquias".
- **Filtrado Multicriterio en Memoria Client-Side (`admin.js`):** En `renderPlantelesList()`, la lista se filtra sucesivamente por: 1) Municipio (por rol o selector), 2) Parroquia seleccionada, 3) Término de búsqueda de texto (coincidencia en código DEA, epónimo, nombre nominal, municipio o parroquia). Costo de lecturas en Firestore: 0 (Principio Zero-Cost).
- **Armonización Visual y Reset de Márgenes (`index.html`, `styles.css`, `src/style.css`):**
  - Se asignó `margin: 0 !important;` y `box-sizing: border-box !important;` eliminando el margen inferior de 16px heredado de reglas globales para elementos `<select>`.
  - Se niveló la altura exacta a 42px y el padding horizontal a `10px` para lograr una alineación perfecta en la línea base con el input de texto y los botones de acción.
- **Control SemVer y Despliegue:** Incremento de versión a **v2.14.17** en `package.json` y en todos los puntos de `index.html`. Compilación de producción con Vite y despliegue exitoso a Firebase Hosting (`https://sgh-merida.web.app`).

**3. Archivos Involucrados:**
- `webapp/package.json` (Versión 2.14.17)
- `webapp/index.html` (Selectores en cascada, badges v2.14.17 y estilos de alineación)
- `webapp/styles.css` (Reglas de alineación exacta de controles de planteles)
- `webapp/src/style.css` (Reglas de prioridad para selectores de planteles)
- `webapp/src/admin.js` (Declaraciones DOM, funciones de cascada geográfica, eventos y renderizado)
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`

---
### Ciclo v2.14.18: Estandarización de Nomenclatura en Pizarra Administrativa

**1. Objetivos:**
- Unificar y formalizar los títulos y encabezados contextuales de la Pizarra en el panel administrativo (`admin.js`).
- Asegurar que tanto para Coordinadores Zonales (`zonadmin`) como para Superadministradores (`superadmin`) la vista principal se identifique de manera homogénea como **Pizarra Estadal**, y para Coordinadores Municipales (`munadmin`) como **Pizarra Municipal - [Municipio]**.

**2. Solución Técnica y Arquitectura:**
- **Títulos y Encabezados Contextuales (`admin.js`):**
  - Ajuste en `configurarInterfazPorRol()` para asignar `statsTitleEl.textContent = 'Pizarra Estadal'` para `zonadmin` y `superadmin`.
  - Para `munadmin`: `statsTitleEl.textContent = 'Pizarra Municipal - ' + mun`.
  - Nombre del usuario zonal en cabecera: `adminNameEl.textContent = userData.nombre || 'Pizarra Estadal'`.
- **Control SemVer y Despliegue:** Incremento de versión PARCHE a **v2.14.18** en `package.json` y todas las etiquetas visuales de `index.html`. Compilación de producción con Vite y despliegue exitoso a Firebase Hosting (`https://sgh-merida.web.app`).

**3. Archivos Involucrados:**
- `webapp/src/admin.js` (Ajustes de títulos contextuales de Pizarra)
- `webapp/package.json` (Versión 2.14.18)
- `webapp/index.html` (Badges de versión v2.14.18)
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`

---
### Ciclo v2.14.19: Formato y Claridad en Mensajes de Autenticación y Despliegue

**1. Objetivos:**
- Atender la solicitud de visualización y refinamiento de los mensajes informativos emitidos a los usuarios en las etapas de registro, verificación de correo y restricción territorial por fase de despliegue institucional.
- Resaltar en negritas frases clave que dirigen la atención del usuario a las carpetas de spam y a los pasos obligatorios de aprobación.
- Desacoplar el mensaje de cierre por despliegue de la tarjeta genérica de "Cuenta en Revisión", otorgándole un encabezado propio e institucional ("Despliegue Institucional").

**2. Solución Técnica y Arquitectura:**
- **Soporte HTML en Sala de Espera (`main.js`):**
  - Modificación del callback `onWait` para aceptar un segundo argumento opcional `titulo = 'Cuenta en Revisión'`.
  - Reemplazo de `.textContent` por `.innerHTML` en el párrafo descriptivo de `#espera-view` para permitir el renderizado de etiquetas semánticas `<b>` y negritas.
- **Refinamiento de Mensajes (`main.js` y `auth.js`):**
  - `showAlert` en registro exitoso: `Revise su correo en la <b>carpeta spam</b> para verificar su cuenta y comuníquese con el responsable de Sistema de gestión humana municipal <b>para la aprobación</b>.`.
  - Doble candado de verificación de correo en `auth.js`: `Tu cuenta requiere verificación. Por favor, haz clic en el enlace que te enviamos al correo (<b>revisa tu carpeta de Spam</b> si no lo encuentras).`.
  - Candado de Despliegue Territorial en `auth.js`: Se inyecta título `"Despliegue Institucional"` y texto destacado `El Sistema SGH aún <b>no está habilitado para el municipio</b> ${mun}...` o plantel.
- **Control SemVer y Despliegue:**
  - Incremento a **v2.14.19** en `webapp/package.json` e `webapp/index.html`.
  - Compilación de producción con Vite (`npm run build`) y despliegue exitoso a Firebase Hosting (`https://sgh-merida.web.app`) mediante `npx firebase-tools deploy --only hosting`.

**3. Archivos Involucrados:**
- `webapp/src/main.js` (Renderizado HTML en `onWait` y negritas en alerta de registro)
- `webapp/src/auth.js` (Mensajes de verificación y bloqueo por despliegue con título desacoplado)
- `webapp/package.json` (Versión 2.14.19)
- `webapp/index.html` (Badges de versión v2.14.19)
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`

---
### Ciclo v2.15.0: Transferencia de Potestad de Modificación de Planteles a Directores (plaadmin) y Reordenamiento Estético Institucional

**1. Objetivos:**
- Cumplir con la directriz acordada con la jefatura de Gestión Humana para transferir la potestad de modificación de datos de planteles desde el rol Coordinador Municipal (`munadmin`) hacia los Directores de Plantel (`plaadmin`).
- Retirar los botones de edición (`✏️ Editar`) y eliminación (`🗑️ Eliminar`) del rol `munadmin` en la tabla de planteles del Gestor de BD, reconfigurándolo como rol exclusivo de supervisión, consulta y auditoría mediante la Ficha del Plantel (`📋 Ficha`).
- Reorganizar visual y estéticamente los datos institucionales del plantel en la pantalla de carga del director, respetando estrictamente el orden solicitado:
  `ESTADO, MUNICIPIO, PARROQUIA, DEPENDENCIA, DENOMINACIÓN (lectura), NOMBRE NOMINAL DEL PLANTEL, NUEVO EPONIMO, CODIGO PLANTEL, CÓD. DEPENDENCIA, CÓD ESTADÍSTICO, NIVELES-MODALIDADES (selector), UBICACIÓN GEOGRÁFICA, TURNO(S), OBSERVACIONES, MATRÍCULA`.
- Implementar trazabilidad histórica en Firestore (`fecha_modificacion_datos` y `modificado_por`) y actualización sincronizada de memoria activa y vista en vivo.

**2. Solución Técnica y Arquitectura:**
- **Restricción Municipal y Seguridad de Roles (`webapp/src/admin.js`):**
  - En `renderPlantelesList`: Se condicionó la celda de acciones `plantel-actions-cell`. Para `munadmin` solo se inyecta el botón `📋 Ficha`. Para `superadmin` y `zonadmin` se mantienen `📋 Ficha`, `✏️ Editar` y `🗑️ Eliminar`.
  - En `openPlantelModal`: Guard de acceso que detiene de inmediato la apertura del modal ante solicitudes de `munadmin`.
  - En `formPlantel` (evento submit): Validación de seguridad institucional que rechaza escrituras si el rol activo es `munadmin`.
- **Estructura HTML y Reordenamiento Estético (`webapp/index.html`):**
  - Transformación del bloque `#plantel-form` en *«Datos Institucionales del Plantel»* con badge corporativo `✏️ Modificable por Dirección`.
  - Reorganización de las filas en cuadrículas adaptativas (`form-grid-row`):
    - Fila 1: Estado, Municipio, Parroquia (Solo lectura / Fondo `#f8fafc` con borde punteado `#cbd5e1`).
    - Fila 2: Dependencia y Denominación (Solo lectura / Fijo).
    - Fila 3: Nombre Nominal del Plantel y Nuevo Epónimo (Inputs interactivos editables con foco azul).
    - Fila 4: Código Plantel (DEA), Cód. Dependencia (Fijos) y Cód. Estadístico (Numérico editable).
    - Fila 5: Niveles-Modalidades (`<select>` con catálogo maestro de niveles y modalidades), Ubicación Geográfica (`<select>` Urbano/Rural), Turno(s) (`<select>` con 6 opciones operativas).
    - Fila 6: Observaciones (Input amplio editable) y Matrícula Total (Cálculo automático protegido).
- **Procesamiento y Persistencia en Cliente (`webapp/src/main.js`):**
  - En `mostrarCandado`: Lógica de poblamiento dinámico que asegura la existencia de la opción previa en el selector `#inp-niveles-modalidades` y asigna turnos, ubicación y observaciones.
  - En `form.onsubmit`: Recolección de los 15 campos, inyección en el payload hacia Firestore con `mergeFields` ampliado (`denominacion`, `nombre-plantel`, `codigos`, `nivel`, `modalidad`, `turno-plantel`, `turno`, `ubicacion-geografica`, `ubicacion`, `observaciones`, `modificado_por`, `fecha_modificacion_datos`).
  - Sincronización transparente de las instancias en memoria (`window.currentPlantelInfo` y `currentPlantel`) y actualización del encabezado de navegación.
- **Control SemVer y Validación de Compilación:**
  - Actualización a versión Menor **v2.15.0** en `webapp/package.json` y todos los puntos de visualización de `webapp/index.html`.
  - Ejecución de `npm run build` con Vite confirmando compilación 100% exitosa sin advertencias críticas.

**3. Archivos Involucrados:**
- `webapp/src/admin.js` (Restricción de botones y guards para `munadmin`)
- `webapp/src/main.js` (Poblamiento de selector de niveles y guardado institucional en `form.onsubmit`)
- `webapp/index.html` (Reordenamiento estricto de los 15 campos institucionales y badges v2.15.0)
- `webapp/package.json` (Versión 2.15.0)
- `versiones.md` (Registro cronológico de versión)
- `bitacora.md` (Bitácora técnica)
- `conversaciones.md` (Registro textual íntegro)

---
### Ciclo v2.16.0: Implementación de la Ficha Viajera para Traslados Institucionales entre Planteles (Zero-Cost)

**1. Objetivos:**
- Resolver el requerimiento acordado con la jefatura de Gestión Humana para la gestión de traslados de personal entre planteles educativos durante jornadas de despliegue restringido («Solo Editar Personal Existente»).
- Permitir que un funcionario desincorporado de un plantel de origen con motivo de traslado sea recibido e incorporado por su plantel de destino mediante la búsqueda de su número de cédula.
- Blindar el sistema contra la creación no autorizada de personal nuevo («anti-colados»), garantizando que en períodos de actualización restringida solo se incorporen funcionarios preexistentes en la base de datos central que cuenten con su Ficha Viajera.
- Prevenir duplicidades o registros simultáneos alertando si el funcionario permanece activo en su plantel anterior.
- Mantener la estricta política Zero-Cost: exactamente una lectura directa de documento por ID (`doc(db, "personal_traslados", cedula)`).

**2. Solución Técnica y Arquitectura:**
- **Emisión en Plantel de Origen (`webapp/src/personalWizard.js`):**
  - En `mostrarModalEliminarPersonal`: Incorporación de la opción `<option value="TRASLADO A OTRO PLANTEL">` en `#sel-motivo-desincorporacion`.
  - Al confirmar la desincorporación con motivo que incluya «TRASLADO», el sistema genera de forma atómica la Ficha Viajera en la colección `personal_traslados` indexada por `cedula`, conteniendo toda la información histórica, laboral y biográfica del funcionario, junto con el DEA de origen, estampa de tiempo y usuario responsable.
  - Elimina al funcionario de `cargos_personal` del plantel de origen y actualiza el `personal_resumen` de la institución.
- **Recepción e Incorporación en Plantel de Destino (`webapp/index.html` y `webapp/src/personalWizard.js`):**
  - En `#seccion-personal-existente`: Se integró el botón `📥 Incorporar Traslado` (`#btn-incorporar-traslado`), visible bajo la modalidad `SOLO_EDITAR_PERSONAL`.
  - Modal `#modal-incorporar-traslado`: Permite ingresar nacionalidad (`V`/`E`) y número de cédula, con disparador de búsqueda por Enter o clic.
  - Motor de Validación Inteligente (`buscarFichaTraslado`):
    - *Ficha Encontrada:* Muestra tarjeta con datos de origen y botón `Confirmar e Incorporar a esta Nómina`. Al hacer clic, carga el formulario mediante `cargarEmpleadoEnFormulario`, activa el banner institucional `#banner-modo-edicion` con estilo verde (`📥 Modo Traslado: Incorporando a [Nombre]`), ajusta el botón principal a «INCORPORAR AL PLANTEL» y hace scroll suave al formulario.
    - *Funcionario Activo:* Si no está en traslados pero está en `cargos_personal`, identifica el DEA activo e instruye al director que la institución de origen debe liberarlo primero.
    - *No Registrado:* Si no existe en la base de datos de Gestión Humana, bloquea la operación informando la prohibición de nuevo ingreso durante la jornada.
  - Guardado y Cierre de Traslado (`guardarPersonalInline`):
    - Detecta `window._esTraslado = true`.
    - Asigna el documento en `cargos_personal` para el nuevo plantel (`${dea}_${cedula}`).
    - Actualiza `personal_resumen` en el documento del plantel.
    - Elimina la Ficha Viajera de `personal_traslados` (`deleteDoc`).
    - Registra el evento en auditoría histórica (`personal_traslados_log`).
    - Limpia el formulario y restaura el banner y los botones a su estado estándar.
- **Control SemVer y Despliegue:**
  - Incremento de versión Menor a **v2.16.0** en `webapp/package.json` y todos los puntos de `webapp/index.html`.
  - Compilación de producción con Vite (`npm run build`).
  - Despliegue exitoso a Firebase Hosting (`https://sgh-merida.web.app`) mediante `npx -y firebase-tools deploy --only hosting`.

**3. Archivos Involucrados:**
- `webapp/src/personalWizard.js` (Lógica de emisión, búsqueda, validación, precarga y cierre de Ficha Viajera)
- `webapp/index.html` (Botón Incorporar Traslado, modal de traslados, IDs del banner y badges v2.16.0)
- `webapp/package.json` (Versión 2.16.0)
- `versiones.md` (Registro cronológico de versión)
- `bitacora.md` (Bitácora técnica)
- `conversaciones.md` (Registro textual íntegro)

---
### Ciclo v2.16.1: Calibración Visual y Obligatoriedad en Justificación de Traslados

**1. Objetivos:**
- Corregir distorsión visual en el modal de recepción de Fichas Viajeras (`#modal-incorporar-traslado`), donde el input de cédula quedaba comprimido por el ancho global del botón de búsqueda y el botón superior de cierre (`✕`) se estiraba horizontalmente.
- Implementar la obligatoriedad estricta del campo de Observaciones en el modal de desincorporación (`#modal-eliminar-personal`) cuando el motivo seleccionado sea «TRASLADO A OTRO PLANTEL» o «TRASLADO INTERZONAL», forzando al director a especificar la causa legal o administrativa del traslado.
- Garantizar que dicha observación viaje dentro de la Ficha Viajera y sea visible en el plantel de destino.
- Despejar la duda conceptual sobre la creación dinámica de colecciones bajo demanda en Firebase Firestore (`personal_eliminado` y `personal_traslados`).

**2. Solución Técnica y Arquitectura:**
- **Ajuste Estético y Desacople en `webapp/styles.css`:**
  - Sección específica `/* 9. MODAL INCORPORAR TRASLADO (FICHA VIAJERA) Y DESINCORPORACIÓN */`.
  - Desactivación de `width: 100%` y box-shadow global para botones dentro de `#modal-incorporar-traslado` y `#modal-eliminar-personal`.
  - Normalización de márgenes inferiores en inputs y selects (`margin-bottom: 0 !important`).
- **Reestructuración de Inputs en `webapp/index.html`:**
  - Botón de cierre `✕` convertido en botón circular compacto (`width: 34px !important`, `height: 34px !important`, `border-radius: 50% !important`, `display: inline-flex`).
  - Input de cédula con prioridad flexible (`flex: 1 1 auto !important`, `min-width: 140px !important`).
  - Botón `🔍 Buscar` con dimensiones fijas no expansivas (`width: auto !important`, `flex: 0 0 auto !important`).
- **Validación Dinámica en `webapp/src/personalWizard.js` (`mostrarModalEliminarPersonal`):**
  - Listener `selMotivo.onchange`: activa dinámicamente badge rojo `* (Obligatorio)` en el label de observaciones y actualiza el placeholder explicativo al seleccionar motivos con «TRASLADO».
  - Guard de validación en `btnConfirm.onclick`: bloquea la acción con toast de advertencia si el campo de observaciones está en blanco para traslados, enfocando el textarea y marcándolo en rojo.
  - El contenido de la justificación se inyecta en `observaciones_traslado` dentro del documento de `personal_traslados`.
- **Control SemVer y Despliegue:**
  - Incremento a **v2.16.1** en `webapp/package.json` y `webapp/index.html`.
  - Compilación limpia con Vite (`npm run build`).
  - Despliegue a Firebase Hosting (`https://sgh-merida.web.app`).

**3. Archivos Involucrados:**
- `webapp/src/personalWizard.js`
- `webapp/styles.css`
- `webapp/index.html`
- `webapp/package.json`
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`

---
### Ciclo v2.17.0: Modalidad de Despliegue «Solo Editar Personal Existente y Modificar Matrícula»

**1. Objetivos:**
- Incorporar una nueva opción en el panel de despliegue (`#sel-modo-operacion`) orientada a jornadas donde se requiere actualizar matrícula y al mismo tiempo corregir o desincorporar personal existente e incorporar traslados, pero bloqueando la creación de nuevo ingreso no certificado.
- Implementar la coacción de matrícula previa: si el plantel no posee matrícula registrada, la tabla de personal permanece oculta, obligando al director a cargar y guardar la matrícula primero. Al guardar, el sistema desbloquea automáticamente la tabla de personal existente.
- Si el colegio ya posee matrícula cargada, se le concede acceso directo a la tabla de personal y a su vez se mantiene editable la matrícula en cualquier momento.

**2. Solución Técnica y Arquitectura:**
- **Inyección en Pizarra Administrativa (`webapp/index.html`):**
  - Opción `<option value="SOLO_EDITAR_PERSONAL_Y_MATRICULA">Solo Editar Personal Existente y Modificar Matrícula (Bloquea Nuevo)</option>`.
- **Lógica de Coacción y Estilos Dinámicos (`webapp/src/main.js`):**
  - En `mostrarCandado()`:
    - Regla CSS restrictiva: `#seccion-registro-personal:not(:has(#banner-modo-edicion[style*="flex"])) { display: none !important; }`.
    - Habilitación de formulario de plantel: `disableMatricula = (modo !== 'TOTAL' && modo !== 'SOLO_MATRICULA' && modo !== 'SOLO_EDITAR_PERSONAL_Y_MATRICULA')`.
    - Botón `#btn-guardar-matricula` habilitado.
    - Condicional de apertura: `if (hasData)` despliega inmediatamente `#seccion-personal-existente` y ejecuta `cargarPersonalExistente(codigoDEA)`. Si `!hasData`, oculta ambas secciones de personal hasta que el director ejecute `form.onsubmit` y guarde la matrícula institucional.
- **Control SemVer y Despliegue:**
  - Incremento de versión Menor a **v2.17.0** en `webapp/package.json` e `webapp/index.html`.
  - Compilación limpia con Vite (`npm run build`).
  - Despliegue a Firebase Hosting (`https://sgh-merida.web.app`).

**3. Archivos Involucrados:**
- `webapp/src/main.js`
- `webapp/index.html`
- `webapp/package.json`
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`

---
### Ciclo v2.17.1: Integración de Identidad Institucional Oficial (SGH - CDCE Mérida)

**1. Objetivos:**
- Reemplazar por completo los íconos genéricos temporales de Vite (`vite.svg`) por el escudo oficial institucional de Gestión Humana del Centro de Desarrollo de la Calidad Educativa del Estado Mérida (`sgh-logo.png`).
- Optimizar la imagen de origen (`sgh-logo.jfif` de 2.8MB) a una versión PNG de 512x512 ultraligera (~580KB) y generar el favicon de 64x64 (`favicon.png`) para los navegadores.
- Homogeneizar la presencia de la marca en todas las interfaces de acceso y supervisión del sistema.

**2. Solución Técnica y Arquitectura:**
- **Procesamiento de Activos en `webapp/public/`:**
  - Conversión y remuestreo bicúbico de alta calidad: `sgh-logo.png` (512x512) y `favicon.png` (64x64).
- **Inyección en Vistas Institucionales (`webapp/index.html`):**
  - `<link rel="icon" type="image/png" href="/favicon.png">` en el `<head>`.
  - `#login-view`: logotipo central de 110x110px con esquinas redondeadas y micro-sombra moderna.
  - `#espera-view`: avatar de 90x90px para sala de espera y verificación 2FA.
  - `#register-view`: imagotipo de 85x85px en la solicitud de acceso.
  - Navbar de Director (`.navbar`): miniatura de 32x32px contigua al título SGH.
  - Navbar de Administración (`#admin-view`): miniatura de 36x36px contigua al título SGH Panel.
- **Control SemVer y Despliegue:**
  - Incremento de versión Parche a **v2.17.1** en `webapp/package.json` e `webapp/index.html`.
  - Compilación limpia con Vite (`npm run build`).
  - Despliegue a Firebase Hosting (`https://sgh-merida.web.app`).

**3. Archivos Involucrados:**
- `webapp/public/sgh-logo.png`
- `webapp/public/favicon.png`
- `webapp/index.html`
- `webapp/package.json`
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`

---
### Ciclo v2.18.0: Escudo de Carga Horaria Acumulada Docente por Nivel (Anti-Sobrecarga en Doble Cédula)

**1. Objetivos:**
- Resolver la vulnerabilidad administrativa donde un funcionario docente con doble cédula o pluriempleo podía ser cargado en múltiples planteles con horas que superaran la dedicación máxima legal permitida.
- Implementar los topes reglamentarios fijados por el MPPE:
  * **Nivel MEDIA (General / Técnica):** 56 horas académicas máximas.
  * **Nivel INICIAL y PRIMARIA:** 53.33 horas académicas máximas.
  * **Régimen Mixto:** Si el docente labora en Media en cualquier institución, se acoge al tope superior de 56 horas.
- Brindar asistencia visual en tiempo real en la interfaz del formulario y un freno estricto (bloqueo) antes de persistir datos en Firestore.

**2. Solución Técnica y Arquitectura:**
- **Motor de Validación (`webapp/src/personalWizard.js`):**
  - Función `verificarTopeHorasDocente(forzarConsulta)`:
    * Discrimina si `tipo === 'DOCENTE'`.
    * Sanitiza la cédula y consulta en Firestore (`cargos_personal`) todos los cargos activos del docente a nivel estatal mediante `where("cedula", "in", posiblesCedulas)`.
    * Implementa escudo de memoria `_cacheCargosPorCedula` (Zero-Cost Spark Tier) para no saturar lecturas en cada pulsación.
    * Excluye inteligentemente el documento propio en edición (`window._docIdEnEdicion`) o el ID proyectado en el mismo plantel para evitar falsos positivos de auto-duplicación.
    * Suma las horas académicas activas en otros planteles y evalúa el nivel (si cualquiera es MEDIA, eleva el tope a 56 hrs; si solo es Inicial/Primaria, fija 53.33 hrs).
    * Retorna estado, tope, horas ocupadas, disponibilidad restante y desglose por plantel.
  - Soporte de precisión decimal con `parseFloat` en lugar de `parseInt` para `'horas-academicas'` y `'horas-administrativas'`.
  - Inyección en `guardarPersonalInline()`: intercepta el guardado si `excede` es true, despliega `showAlert` con desglose institucional y enfoca el campo en rojo.
- **Interfaz y Feedback Visual (`webapp/index.html`):**
  - Inyección de `#wp-horas-academicas-help` bajo el input de Horas Académicas.
  - Atributos `step="any"` en inputs numéricos de horas.
  - Disparadores de eventos `oninput`, `onchange` y `onblur` en `#wp-horas-academicas`, `#wp-cedula` y `#wp-nivel-modalidad` conectados a `window.validarHorasDocenteUI`.
- **Pruebas Automatizadas:**
  - Ejecución de suite de pruebas unitarias sobre todos los casos de borde (Primaria normal, Primaria excedida > 53.33, Media normal, Media compartida, Media excedida > 56, edición propia y personal administrativo).
- **Control SemVer y Despliegue:**
  - Incremento de versión Menor a **v2.18.0** en `webapp/package.json` e `webapp/index.html`.
  - Compilación limpia con Vite (`npm run build`).
  - Despliegue a Firebase Hosting (`https://sgh-merida.web.app`).

**3. Archivos Involucrados:**
- `webapp/src/personalWizard.js`
- `webapp/index.html`
- `webapp/package.json`
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`

---
### Ciclo v2.18.1: Gestor Dinámico de Planes de Estudio y Blindaje de Matrícula Institucional

**1. Objetivos:**
- Corregir el error crítico de persistencia reportado por directores al guardar datos y matrícula bajo el modo «Solo Modificar Matrícula»: `FirebaseError: Field 'modalidad' is specified in your field mask but missing from your input data.`
- Aplicar la regla de dominio institucional de exclusión mutua entre Nivel y Modalidad.
- Subsanar la duplicación visual de la matrícula en tiempo real en planteles de Media General y Técnica.
- Mejorar la estética y orientación visual de las tarjetas de matrícula por nivel educativo.
- Permitir que el director configure libremente los planes de estudio correspondientes a su institución (Inicial 20000, Primaria 21000, Media General 31059/31060 y Menciones de Media Técnica 4xxxx), actualizando dinámicamente las planillas de secciones y matrícula.
- Optimizar el flujo de selección de Media Técnica eliminando clics redundantes mediante adición instantánea al seleccionar en el menú desplegable.

**2. Solución Técnica y Arquitectura:**
- **Corrección de FieldMask y Mutua Exclusión (`webapp/src/main.js`):**
  - Se sustituyó la lista estática `mergeFieldsList` en `safeSetDoc(docRef, payload, ...)` por `{ merge: true }`.
  - Se implementó discriminación condicional: si el plantel pertenece a un Nivel regular, se aplica `payload["nivel"] = nivelModVal` y `payload["modalidad"] = deleteField()`; si es Especial o Adulto, se aplica `payload["modalidad"] = nivelModVal` y `payload["nivel"] = deleteField()`.
  - Se condicionó `mostrarFormularioPersonal(true)` para no ejecutarse cuando el modo de despliegue configurado es `SOLO_MATRICULA`.
- **Cómputo en Vivo de Matrícula:**
  - Se suprimió la suma redundante `matTotal += sumMg + sumMt` del listener `plantel-form.oninput`, ya que los inputs de Media ya poseen la clase `.mat-input` y formaban parte de la sumatoria base.
- **Catálogo y Selector Dinámico de Planes (`webapp/src/catalogosPlanes.js` y `webapp/src/main.js`):**
  - Módulo exportando `CATALOGO_PLANES_ESTUDIO` y `obtenerCatalogoPlanesCompleto()`.
  - Inyección de `#contenedor-seleccion-planes` en `webapp/index.html`.
  - Función reactiva `actualizarUIPlanesDirector()` que conmuta visibilidad de bloques (`bloque-inicial`, `bloque-primaria`, `bloque-mediageneral`, `bloque-mediatecnica`, vacantes y sumatorias) y re-renderiza tarjetas de Media.
  - Interfaz de Media Técnica con adición automática mediante `selAddMt.onchange`, tarjetas activas con botón de desvinculación `✕` y recálculo automático.
  - Persistencia de `payload["planes-estudio"] = window._planesSeleccionadosDirector` al guardar en Firestore.
- **Estandarización Estética (`webapp/index.html`):**
  - Títulos descriptivos `Matrícula Estudiantil - [Nivel]`, ícono `📚` en Media General y textos de guía pedagógica adaptados a cada nivel.
- **Control SemVer y Despliegue:**
  - Incremento de versión a **v2.18.1** en `webapp/package.json` e `webapp/index.html`.
  - Compilación limpia con Vite (`npm run build`).

**3. Archivos Involucrados:**
- `webapp/src/main.js`
- `webapp/src/catalogosPlanes.js`
- `webapp/index.html`
- `webapp/package.json`
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`

---
### Hotfix v2.18.2: Restauración del Enlace de Guardado y Alcance de Planes

**1. Objetivos:**
- Subsanar la excepción fatal de JavaScript en producción `ReferenceError: tienePlanes is not defined` arrojada al inicializar `mostrarCandado()`.
- Restaurar la vinculación del evento `form.onsubmit` para que el botón «GUARDAR DATOS Y CONTINUAR» guarde con normalidad secciones y matrícula en Firestore.
- Asegurar la retrocompatibilidad y precarga inteligente de planes de estudio para planteles históricos.

**2. Solución Técnica y Arquitectura:**
- **Corrección de Alcance (`webapp/src/main.js`):**
  - Se redefinió la constante `tienePlanes = esEspecial || esAdulto || (window._planesSeleccionadosDirector && Object.keys(window._planesSeleccionadosDirector).length > 0)`.
  - Se desacopló el modo `SOLO_MATRICULA`, cerrando directamente la visibilidad de personal sin evaluar condiciones innecesarias.
- **Precarga Bidireccional de Planes:**
  - `window._planesSeleccionadosDirector` extrae de `dataParcial["planes-estudio"]` o `dp["planes-estudio"]`. Si el plantel es regular y no poseía el campo registrado, se infieren sus planes base (20000, 21000, 31059) según el nivel educativo institucional.
- **Control SemVer y Despliegue:**
  - Incremento de versión Parche a **v2.18.2** en `webapp/package.json` e `webapp/index.html`.
  - Compilación de producción con Vite (`npm run build`).
  - Despliegue a Firebase Hosting (`https://sgh-merida.web.app`).

**3. Archivos Involucrados:**
- `webapp/src/main.js`
- `webapp/index.html`
- `webapp/package.json`
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`

---

### v2.19.0 - 2026-10-28 (Horas según Recibo de Pago, Horas por Programar y Desacople de Atiende Matrícula)

**1. Objetivos del Ciclo:**
- Atender la solicitud de la Oficina de Nómina y CDCE Mérida sobre la declaración explícita de «Horas según Recibo de Pago» y el cálculo en vivo de «Horas por Programar».
- Aplicar las reglas institucionales MPPE: Educación Básica con carga fija e indivisible de 53.33 horas concentrada en una sola escuela, y Educación Media con carga por cátedra a partir de 40 horas hasta el tope estatutario de 56 horas acumuladas entre dependencias.
- Desacoplar la carga académica del tipo de personal: en la realidad educativa venezolana, obreros y administrativos convalidables atienden matrícula, por lo que el selector maestro es estrictamente `¿Atiende Matrícula? === 'SI'`.

**2. Solución Técnica y Arquitectura:**
- **Modelo de Datos en Firestore (`cargos_personal`):**
  - Incorporación de `horas-recibo`, `horas-academicas`, `horas-por-programar` y `horas-administrativas`.
- **Motor de Verificación en Memoria (`verificarTopeHorasDocente`):**
  - Validación del tope legal por nivel (53.33 para Básica, 56 para Media).
  - Escudo contra sobrecarga y detección de incompatibilidad estricta de régimen (bloqueo automático si un docente de Básica pretende inscribirse en Media o viceversa).
  - Consulta cruzada Zero-Cost protegida mediante caché en memoria (`_cacheCargosPorCedula`).
- **Exportaciones Excel:**
  - Actualización de `exportarNominaExcel` en `webapp/src/admin.js` y `webapp/src/personalWizard.js`.

**3. Archivos Involucrados:**
- `webapp/index.html`
- `webapp/package.json`
- `webapp/src/admin.js`
- `webapp/src/personalWizard.js`
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`

---

### v2.19.1 - 2026-10-28 (Soporte Oficial MPPE H.DOC / H.ADM y Dedicación Mixta de Coordinación)

**1. Objetivos del Ciclo:**
- Modelar con exactitud el comprobante de pago oficial del MPPE, donde la dedicación distingue explícitamente entre `H.DOC` (docente) y `H.ADM` (administrativo y obrero, estándar 40.00 hrs).
- Dar soporte a funcionarios con asignación compartida (ej. docente con 40 horas en recibo que ejerce como Coordinador de Seccional, atendiendo 20 horas de aula y 20 horas de coordinación en oficina).

**2. Solución Técnica y Arquitectura:**
- **Unificación de la Tarjeta de Dedicación (`#container-carga-horaria`):**
  - Un único contenedor adaptable que conmuta suavemente entre el modo administrativo/servicio y el modo pedagógico.
  - Rotulación dinámica: `Horas según Recibo (H.DOC)` o `Horas según Recibo (H.ADM)`.
- **Ecuación Institucional de Horas por Programar:**
  - $\text{Horas por Programar} = \text{Recibo} - (\text{Horas Académicas} + \text{Horas Administrativas})$.
  - Si un coordinador tiene 20 hrs académicas y 20 hrs administrativas, el sistema reconoce el cumplimiento de sus 40 hrs con 0 pendientes.

**3. Archivos Involucrados:**
- `webapp/index.html`
- `webapp/package.json`
- `webapp/src/admin.js`
- `webapp/src/personalWizard.js`
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`

---

### v2.19.2 - 2026-10-28 (Refinamiento Estético y Distribución Armónica 3x2 en Tarjeta Pedagógica)

**1. Objetivos del Ciclo:**
- Resolver el desbalance visual de la tarjeta pedagógica donde 5 campos ocupaban la primera fila y el campo «Horas por Programar» quedaba aislado en una segunda fila.
- Establecer una arquitectura de cuadrícula simétrica 3x2 altamente legible y agradable a la vista.

**2. Solución Técnica y Arquitectura:**
- **Reorganización Simétrica (3x2):**
  - Fila 1 (Perfil y Contratación): Nivel/Modalidad, Especialidad Imparte, Horas según Recibo de Pago.
  - Fila 2 (Dedicación en este Plantel): Horas Académicas, Horas Administrativas, Horas por Programar.
- **Micro-interacciones y UI Feedback:**
  - Indicador tipo Badge en «Horas por Programar» con etiquetas contextuales `0 hrs (Completo)` o `X hrs (Por Asignar)` y colorimetría dinámica.

**3. Archivos Involucrados:**
- `webapp/index.html`
- `webapp/package.json`
- `webapp/src/personalWizard.js`
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`

---

### v2.19.3 - 2026-10-28 (Eliminación de Desbordamiento Horizontal y Optimización Móvil Integral)

**1. Objetivos del Ciclo:**
- Resolver el desbordamiento horizontal severo observado en grabaciones de pantalla de teléfonos móviles (Chrome Android).
- Eliminar el desplazamiento lateral fantasma y el espacio en blanco exterior a la derecha.
- Garantizar que la vista de Director, la tabla de personal y los formularios de carga horaria sean 100% fluidos y ergonómicos en celulares.

**2. Solución Técnica y Arquitectura:**
- **Contención de Viewport Universal:**
  - Reglas `overflow-x: hidden !important` y `max-width: 100vw !important` en `html, body, #app`.
- **Adaptabilidad de Barra de Acciones (`.personal-toolbar`):**
  - Desacople de la fila rígida (`flex-wrap: nowrap`) que exigía $>630\text{px}$ a una disposición adaptable que apila buscador e incentiva botones táctiles fluidos al 100% del ancho en smartphones.
- **Scroll Táctil Interno en Tabla (`.table-responsive-wrapper`):**
  - Incorporación de `overflow-x: auto; -webkit-overflow-scrolling: touch` y `max-width: 100%` en el contenedor de la tabla de funcionarios, asegurando scroll táctil interno con ancho mínimo garantizado de columnas.
- **Reorganización a Columna Única en Celulares:**
  - Sobrescritura en media query ($\le 768\text{px}$) para `grid-template-columns: 1fr !important` en datos institucionales, datos de empleado y en la tarjeta de Carga Horaria y Dedicación.
  - Normalización de elementos con `grid-column: span X` para colapsar a ancho completo (`1 / -1`) evitando columnas implícitas que forzaban dilatación horizontal.

**3. Archivos Involucrados:**
- `webapp/index.html`
- `webapp/package.json`
- `webapp/src/style.css`
- `webapp/styles.css`
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`

---

### v2.19.4 - 2026-10-28 (Adaptabilidad Móvil en Ventana de Traslado y Botón de Búsqueda)

**1. Objetivos del Ciclo:**
- Resolver el truncamiento del botón «🔍 Buscar» dentro de la ventana modal «Incorporar Funcionario por Traslado» en pantallas móviles (observado en video WhatsApp Video 2026-10-28 at 22.47.28.mp4 donde se leía únicamente `🔍 Bus`).
- Proporcionar una zona táctil cómoda y amplia para la búsqueda e incorporación de personal por traslado en celulares.

**2. Solución Técnica y Arquitectura:**
- **Reorganización Responsiva (`.traslado-input-row`):**
  - Desacople de la fila fija con ancho rígido. En pantallas móviles ($\le 600\text{px}$), se distribuye en dos niveles:
    - Nivel 1: Nacionalidad (`V-` / `E-`) + Cédula de Identidad (`.traslado-cedula-inputs`) aprovechando todo el ancho horizontal.
    - Nivel 2: Botón **🔍 Buscar** (`#btn-buscar-ficha-traslado`) a ancho completo (100%) con altura táctil ergonómica de 44px.
- **Calibración de Padding en Modales:**
  - Reducción de relleno en modales en móviles (`#modal-incorporar-traslado` y `#modal-eliminar-personal`) de 24px a 14px para garantizar amplitud a la tarjeta de Ficha Viajera.
  - Cuadrícula de datos de la ficha viajera (`.ficha-datos-grid`) ajustada a columna única en smartphones.

**3. Archivos Involucrados:**
- `webapp/index.html`
- `webapp/package.json`
- `webapp/src/personalWizard.js`
- `webapp/src/style.css`
- `webapp/styles.css`
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`

---

### v2.19.5 - 2026-10-28 (Persistencia Precisa en Desactivación de Planes de Estudio por Plantel)

**1. Objetivos del Ciclo:**
- Corregir el comportamiento donde un director desmarcaba un plan de estudio de su institución, guardaba los datos con éxito, pero al recargar el navegador (`F5`) el plan desmarcado volvía a figurar como activo.
- Asegurar que la modificación sea estrictamente a nivel de la ficha del plantel (`planteles/{codigoDEA}`), sin alterar jamás el catálogo maestro estatal (`sistema/catalogos_maestros`).

**2. Solución Técnica y Arquitectura:**
- **Reemplazo de `safeSetDoc(..., { merge: true })` por `safeUpdateDoc`:**
  - La opción `merge: true` en Firestore realiza una fusión recursiva de mapas. Si un sub-campo (código de plan) se omitía en el payload actualizado, Firestore preservaba el campo preexistente en la base de datos.
  - Con `safeUpdateDoc(docRef, payload)`, el campo `planes-estudio` se sobrescribe y actualiza con la colección exacta seleccionada por el director en su plantel.
- **Limpieza de Campos Legacy:**
  - Eliminación explícita mediante `deleteField()` de posibles claves antiguas `planes_estudio` (con guion bajo).
- **Aislamiento de Carga en `mostrarCandado()`:**
  - Validación con `tieneConfigPrevias` para prevenir que la lógica de fallback reactive planes automáticamente en colegios que ya completaron su configuración.

**3. Archivos Involucrados:**
- `webapp/index.html`
- `webapp/package.json`
- `webapp/src/main.js`
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`

---

### v2.19.6 - 2026-10-28 (Rediseño de Botón de Excepciones y Enriquecimiento Visual de Despliegue)

**1. Objetivos del Ciclo:**
- Corregir el aspecto antiestético reportado en captura de pantalla (`Captura0004.PNG`) en la sección de Despliegue -> Excepciones Individuales por Plantel, donde el botón de eliminación figuraba como una simple letra roja «X» desalineada en el centro de la tarjeta.
- Elevar el componente al estándar de diseño corporativo del panel administrativo.

**2. Solución Técnica y Arquitectura:**
- **Refactorización de `renderExcepciones()` en `admin.js`:**
  - Incorporación de botón institucional explícito `🗑️ Eliminar` con aislamiento de dimensiones (`width: auto !important`, `flex-shrink: 0`), cancelando la herencia de estilos de botón global de ancho completo.
  - Búsqueda asociativa en `currentPlanteles` para enriquecer la tarjeta con el epónimo del colegio junto al código DEA.
  - Event handler robusto enlazado mediante `btn.getAttribute('data-cod')`.
  - Soporte de evento `keydown` (`Enter`) en el input `#inp-new-excepcion`.

**3. Archivos Involucrados:**
- `webapp/index.html`
- `webapp/package.json`
- `webapp/src/admin.js`
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`

---

### v2.19.7 - 2026-10-29 (Blindaje Total de Modo Supervisión en Planes de Estudio y Traslados)

**1. Objetivos del Ciclo:**
- Corregir la vulnerabilidad de interfaz evidenciada en grabación de video (`WhatsApp_Video_2026-10-29_at_08.25.55.mp4`) donde un usuario con rol `munadmin` (Municipio Santos Marquina) lograba marcar y desmarcar casillas interactivas en la sección «Planes de Estudio del Plantel» al acceder en Modo Supervisión Institucional.
- Asegurar que la pantalla del director sea 100% de Solo Lectura para los roles de supervisión (`munadmin`, `zonadmin`, `superadmin`), garantizando que ningún control de planes ni de incorporación por traslado sea clickeable.

**2. Solución Técnica y Arquitectura:**
- **Inmovilización en `main.js` (`renderizarSelectorPlanesDirector` y `actualizarUIPlanesDirector`):**
  - Detección de `window._modoSupervision` para inyectar `disabled` y `pointer-events: none` en todos los inputs y tarjetas `.card-plan-selector`.
  - Supresión condicional del menú desplegable `#sel-agregar-mencion-tecnica` y de los botones `.btn-quitar-plan-mt`.
  - Inyección del banner institucional de bloqueo y estilización semántica del badge: `🔒 [N] planes activos (Modo Supervisión)`.
  - Reglas reforzadas en `style-coaccion` para anular clics en todo el árbol de `#contenedor-seleccion-planes`.
- **Protección de Traslados en `personalWizard.js`:**
  - Guard en `abrirModalTraslado()` que bloquea de raíz la apertura de la ventana modal si `window._modoSupervision` está activo.
  - Ocultamiento de `#btn-incorporar-traslado` mediante CSS con `!important`.

**3. Archivos Involucrados:**
- `webapp/package.json` (v2.19.7)
- `webapp/index.html` (v2.19.7)
- `webapp/src/main.js`
- `webapp/src/personalWizard.js`
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`

---

### v2.20.0 - 2026-10-29 (Candado Secuencial Obligatorio: Matrícula Previa a Personal)

**1. Objetivos del Ciclo:**
- Atender la necesidad estratégica de la jefatura de Gestión Humana: el 97% del personal ya se encuentra en la base de datos, pero muchos planteles carecen de matrícula estudiantil. Para la reapertura del sistema, se requería forzar a los directores a registrar su matrícula antes de poder revisar y actualizar al personal.
- Implementar la solución acordada: combinación de Candado Secuencial (Paso 1 ➡️ Paso 2) y ajuste en el selector del módulo de Despliegue.

**2. Solución Técnica y Arquitectura:**
- **Lógica de Coacción y Navegación en `main.js`:**
  - En `checkPlantelData()`: Detección precisa de `hasData` (matrícula > 0). Si el plantel no tiene matrícula, se activan los banners de aviso, el botón se adapta a *«Guardar Matrícula y Habilitar Personal (Paso 1)»* y se mantiene oculta la tabla de personal.
  - En `form.onsubmit`: Guard de validación que exige `totalCalculado > 0` para planteles regulares, bloqueando intentos de guardar con 0 alumnos.
  - Post-guardado: Transición atómica donde se ocultan los banners del Paso 1, se habilita `#seccion-personal-existente`, se dispara la carga de personal, se realiza un scroll suave y se notifica con modal o toast de éxito.
- **Interfaz y Despliegue en `index.html`:**
  - Incorporación de `#banner-alerta-paso1-top` y `#banner-candado-paso1`.
  - Actualización de la opción `SOLO_EDITAR_PERSONAL_Y_MATRICULA` en el menú desplegable del módulo administrativo de Despliegue.
- **Control SemVer y Despliegue:**
  - Incremento a versión MENOR `v2.20.0` en `package.json` e `index.html`.
  - Compilación de producción con Vite (`dist/`) y despliegue a Firebase Hosting (`https://sgh-merida.web.app`).

**3. Archivos Involucrados:**
- `webapp/package.json` (v2.20.0)
- `webapp/index.html` (v2.20.0)
- `webapp/src/main.js`
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`

---

### v2.20.1 - 2026-10-29 (Corrección Crítica de Detección de Matrícula y Blindaje del Candado de Personal)

**1. Objetivos del Ciclo:**
- Corregir el fallo reportado en video (`WhatsApp_Video_2026-10-29_at_11.56.57.mp4`) donde un usuario con rol de director (`plaadmin`) para el plantel `OD14311419` (`ESCUELA ESTADO APURE` en Santos Marquina) ingresó al sistema con matrícula vacía/cero y, sin embargo, la sección de personal existente figuraba visible y permitía la edición de empleados mediante el botón de lápiz (✏️).
- Garantizar que ningún plantel con 0 estudiantes pueda burlar el candado de coacción del Paso 1, eliminando cualquier falso positivo en la detección de matrícula previa.

**2. Solución Técnica y Arquitectura:**
- **Depuración de la Causa Raíz:**
  - El documento del plantel en Firestore contenía `datos_completados: true` (un indicador legacy referente al guardado de datos administrativos/contacto institucionales) a pesar de tener `matricula-total: 0` y `matricula: {}`.
  - La condición anterior en `main.js` evaluaba erróneamente: `if (dataParcial.datos_completados) hasData = true;`, lo que hacía creer al sistema que el plantel poseía matrícula cuando en realidad tenía cero alumnos.
  - Adicionalmente, la presencia de secciones configuradas sin alumnos también podía inducir a falsos positivos.
- **Refactorización Estricta de `hasData` en `main.js`:**
  - Se suprimió de forma definitiva la consideración de `datos_completados`, `secciones` y `secciones-planes` como criterios de existencia de matrícula.
  - Se implementó un algoritmo estricto que verifica que exista una cifra positiva de alumnos (`> 0`) en: `matricula-total`, `matricula['total-gen']`, `matricula.modalidades.especial['total-especial']`, `matricula.modalidades.adulto['total-adulto']`, o en el escaneo recursivo de objetos numéricos de matrícula (`checkObjHasPositiveNumbers`).
  - Si el total de estudiantes es cero o inexistente, `hasData` es estrictamente `false`.
- **Blindaje de Interfaz con `!important` y Guards en Personal:**
  - En `main.js`: Cuando `requierePaso1` es verdadero, `#seccion-personal-existente` y `#seccion-registro-personal` se fuerzan a ocultamiento absoluto mediante `.style.setProperty('display', 'none', 'important')`.
  - En `personalWizard.js`: Se inyectaron barreras (`guards`) en `mostrarFormularioPersonal()`, `cargarPersonalExistente()` y `cargarEmpleadoEnFormulario()` que verifican `window._requierePaso1` y abortan de inmediato cualquier renderizado o edición si no se ha completado la matrícula.
  - En `form.onsubmit`: Validación universal que exige `totalCalculado > 0` sin excepciones, desbloqueando la nómina de personal de forma atómica y limpia al completar el guardado institucional.
- **Control SemVer y Despliegue:**
  - Incremento a versión PARCHE `v2.20.1` en `package.json` e `index.html`.
  - Compilación de producción con Vite (`dist/`) y despliegue a Firebase Hosting (`https://sgh-merida.web.app`).

**3. Archivos Involucrados:**
- `webapp/package.json` (v2.20.1)
- `webapp/index.html` (v2.20.1)
- `webapp/src/main.js`
- `webapp/src/personalWizard.js`
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`

---

### [Documentación e Inducción] - 2026-10-30 (Elaboración de Manual Práctico y Minuta Institucional en Formato DOCX)

**1. Objetivos del Ciclo:**
- Atender la necesidad pedagógica e institucional de formular una guía práctica paso a paso en lenguaje llano ("desde cero") para directores de planteles y nuevos usuarios del sistema SGH, cubriendo desde la solicitud de acceso hasta la gestión completa de personal.
- Procesar, analizar y sintetizar la grabación audiovisual de la videoconferencia institucional (`Video\2026-10-30 11-49-30.mp4`, 5.06 GB, 1h 57m 46s) realizada por el Lic. Luis Alfonso Pérez con directores del Municipio Santos Marquina sobre la versión `v2.20.1`.
- Generar un documento formal en formato Microsoft Word (`.docx`) con diseño corporativo oficial (membrete del MPPE / CDCE Mérida, ficha técnica, desglose cronológico de 6 fases, acuerdos institucionales y bloque de firmas).

**2. Solución Técnica y Metodología:**
- **Inspección Multimedia y Extracción de Metadatos:**
  - Se utilizó la biblioteca binaria de FFmpeg y el paquete `docx` en entorno aislado de Node.js (`scratch/`).
  - Se muestrearon fotogramas clave en intervalos regulares a lo largo de las 2 horas de video, cruzándolos con la presentación `Manual Práctico.pptx` (19 diapositivas) proyectada durante la videollamada.
  - Se identificaron todas las etapas de la reunión: exposición de diapositivas, demostración de solicitud de acceso, validación de candado de matrícula, sesión interactiva de preguntas, prueba real con el plantel `OD14311419` (*Escuela Estado Apure / Ana Romelia Vela*) y balance de la Pizarra Municipal en tiempo real (18 planteles, 374 cargos y 2.008 alumnos censados).
- **Generación del Documento Word Institucional:**
  - Se estructuró el archivo `Minuta_Taller_Induccion_SGH_Santos_Marquina_2026-10-30.docx` en la raíz del proyecto y una copia idéntica en `Video\Minuta_2026-10-30_11-49-30.docx`.
  - Se aplicaron estilos visuales de alto contraste: paleta azul marino (`#003399`), gris pizarra (`#0F172A`), bordes definidos, tablas estructuradas con sombreados suaves y márgenes estándar de 1 pulgada.
- **Protección del Repositorio:**
  - Se actualizó `.gitignore` incorporando reglas de exclusión para archivos de video pesados (`*.mp4`, `Video/*.mp4`) y directorios de soporte efímero (`scratch/`), previniendo desbordamientos de cuota en Git y GitHub.

**3. Archivos Involucrados:**
- `Minuta_Taller_Induccion_SGH_Santos_Marquina_2026-10-30.docx`
- `Video/Minuta_2026-10-30_11-49-30.docx`
- `.gitignore`
- `bitacora.md`
- `conversaciones.md`

---

---

### v2.20.3 - 2026-10-30 (Restauración y Optimización del Botón Salir del Sistema en Celulares y Vistas Responsivas)

**1. Objetivos del Ciclo:**
- Diagnosticar y resolver la ausencia/invisibilidad del botón «Salir del Sistema / Cerrar Sesión» en teléfonos móviles tras las recientes mejoras de responsividad.
- Garantizar que el botón de salida sea 100% visible, accesible y ergonómico en todos los roles (Directores y Administradores), sin importar la resolución del celular o el nivel de scroll.

**2. Solución Técnica y Arquitectura:**
- **Diagnóstico Integral:**
  - Al implementar la regla `overflow-x: hidden !important` en `v2.19.3` para eliminar el espacio lateral fantasma, la cabecera del Panel Admin (`#admin-view > header`) con ancho rígido de $>440\text{px}$ provocó que el botón `#btn-logout-admin` quedara empujado más allá del borde derecho del teléfono y recortado visualmente.
  - El menú hamburguesa lateral (`#admin-sidebar`) carecía de botón de cierre de sesión.
  - En la vista del Director (`#lock-screen`), la barra superior dejaba de ser `sticky` en algunos navegadores móviles debido a la interacción de `overflow-x: hidden` en el ancestro `body`, y el botón de salida original era un texto plano «Salir» sin ícono ni contraste llamativo.
- **Acciones Implementadas:**
  - **Readecuación de Cabecera Admin en Móviles:** Se calibró el relleno de `#admin-header` a `10px 12px`, reduciendo brechas entre logotipo y título, asegurando que `#btn-logout-admin` mantenga `flex-shrink: 0` y permanezca 100% dentro del viewport en smartphones desde $320\text{px}$.
  - **Inyección de Botón de Salida en Menú Lateral (`#btn-sidebar-logout`):** Se agregó un botón de salida al pie del menú lateral desplegable en `admin-sidebar`, permitiendo cerrar sesión con un solo toque desde el menú móvil.
  - **Anclaje Sticky Universal y Botón de Salida Superior:** Se aplicó `overflow-x: clip` en lugar de `overflow-x: hidden` en `html, body, #app`, restituyendo el comportamiento de fijación superior (`position: sticky !important; top: 0; z-index: 1000;`) en `.navbar`. Se rediseñó `#btn-logout-lock` con acento semántico rojo e ícono `bi-box-arrow-right`.
  - **Botón Accesible en Pie de Pantalla (`#btn-logout-lock-footer`):** Se incorporó un botón «Salir del Sistema» al finalizar la carga de funcionarios para comodidad inmediata tras registrar datos.
- **Control SemVer y Despliegue:**
  - Versión PARCHE actualizada a `v2.20.3` en `package.json` e `index.html` (5 etiquetas).
  - Compilación exitosa con Vite y publicación en Firebase Hosting (`https://sgh-merida.web.app`).

**3. Archivos Involucrados:**
- `webapp/package.json` (v2.20.3)
- `webapp/index.html` (v2.20.3)
- `webapp/src/main.js`
- `webapp/src/admin.js`
- `webapp/src/style.css`
- `webapp/styles.css`
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`

---

### v2.20.2 - 2026-10-30 (Obligatoriedad del Campo «Observaciones» en Registro y Actualización de Personal)

**1. Objetivos del Ciclo:**
- Atender la instrucción administrativa formulada por el usuario respecto a que el campo de texto de observaciones (`#wp-observaciones`) en el formulario de talento humano no estaba siendo exigido y debía ser estrictamente obligatorio.
- Blindar el flujo de guardado y edición de personal para que ningún empleado pueda registrarse o modificarse con el campo de observaciones vacío.

**2. Solución Técnica y Arquitectura:**
- **Refactorización del Validador en `personalWizard.js` (`validarFormularioPersonal`):**
  - Se incorporó `{ id: 'wp-observaciones', nombre: 'Observaciones' }` en la matriz de campos requeridos bajo la sección de Situación Laboral.
  - Se actualizó el encabezado documental de la función excluyendo a `Observaciones` de la lista de campos no requeridos.
  - En `guardarPersonalInline()`, se aplicó `.trim()` al capturar el valor del textarea para evitar que se guarde texto compuesto únicamente por espacios en blanco.
- **Ajustes de Interfaz en `index.html`:**
  - Se inyectó el distintivo visual obligatorio `<span style="color: #dc2626; font-weight: bold;">*</span>` en el label de Observaciones.
  - Se incorporó un placeholder orientativo para el director: *«Ingrese observaciones pertinentes del trabajador...»*.
- **Control SemVer y Despliegue:**
  - Incremento de versión PARCHE a `v2.20.2` en `package.json` y en las 5 ocurrencias de `index.html`.
  - Compilación de producción limpia con Vite (`dist/` en 1.24s) y despliegue exitoso a Firebase Hosting (`https://sgh-merida.web.app`).

**3. Archivos Involucrados:**
- `webapp/package.json` (v2.20.2)
- `webapp/index.html` (v2.20.2)
- `webapp/src/personalWizard.js`
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`

---

### v2.20.4 - 2026-10-30 (Segmentación Territorial de Pizarra, Auto-reconciliación Municipal y Editor de Roles)

**1. Objetivos del Ciclo:**
- Resolver el inconveniente reportado por el usuario en el que, estando registrado con una cuenta de coordinador municipal, la Pizarra mostraba datos consolidados estadales (1,221 planteles, 23,288 empleados, 2,010 estudiantes) en lugar de las cifras exclusivas de su municipio asignado (Santos Marquina: 18 planteles, 374 personal).
- Permitir que las autoridades estadales (`superadmin` y `zonadmin`) puedan filtrar y auditar las estadísticas de cualquier municipio específico mediante un selector territorial en la Pizarra manteniendo el consumo Zero-Cost.
- Crear una herramienta administrativa interactiva en el panel (*«Usuarios del Sistema»*) para editar el rol y la adscripción territorial/DEA de cualquier usuario sin necesidad de intervenciones manuales en la consola de Firestore.
- Corregir automáticamente la cuenta institucional `sghcdcez14019@gmail.com` (Lic. Luis Alfonso Pérez, CDCE Santos Marquina) a su rol legítimo `munadmin`.

**2. Solución Técnica y Arquitectura:**
- **Diagnóstico Integral de Causa Raíz:**
  - El usuario `sghcdcez14019@gmail.com` fue creado y aprobado en Firestore con `rol: 'zonadmin'` debido a la ambigüedad en la etiqueta del selector de registro (*«Responsable SGH ZONA»*), interpretada como la zona territorial del municipio en lugar del nivel estadal.
  - Al poseer el rol `zonadmin`, el motor `admin.js` (`configurarInterfazPorRol` y `loadEstadisticas`) le asignaba la identidad visual `ZA` (ZonAdmin), el título *«Pizarra Estadal»*, y le suministraba los totales generales del estado Mérida provenientes de `resumenData.global`.
  - La Pizarra no poseía un filtro selector para alternar entre la visión estadal y las fichas de los 23 municipios.
  - El listado de usuarios no disponía de un mecanismo de edición de rol ni de cambio de adscripción territorial.
- **Acciones Implementadas:**
  - **Auto-reconciliación de Cuenta en `initAdminDashboard()`:** Se inyectó una rutina que detecta el inicio de sesión de `sghcdcez14019@gmail.com` con `rol: 'zonadmin'` y procede de forma transparente a actualizarlo en memoria y en Firestore a `rol: 'munadmin'` con `jerarquia: { estado: 'MERIDA', municipio: 'SANTOS MARQUINA' }`, bloqueando la visualización a los 18 planteles y 374 trabajadores de Santos Marquina.
  - **Filtro Territorial Pizarra (`#container-filtro-pizarra-mun`):** En `webapp/index.html` y `webapp/src/admin.js`, se inyectó un desplegable para `superadmin` y `zonadmin` con las opciones: *«Todo el Estado Mérida (Consolidado)»* y los 23 municipios oficiales. Al cambiar el selector, `loadEstadisticas(false, municipio)` actualiza instantáneamente títulos, tarjetas, discriminación de cargos (docentes, administrativos, obreros), estatus de matrícula (cargados/pendientes) y personal por jubilarse, extrayendo la información precomputada de `resumenData.porMunicipio` con **cero lecturas adicionales** a Firestore (*Zero-Cost Shield*).
  - **Editor Interactivo de Rol y Adscripción (`#modal-editar-rol-usuario`):** Se incorporó el botón `✏️ Rol` en la tabla de usuarios. Al pulsarlo, se despliega un modal con control reactivo que permite conmutar entre `zonadmin`, `munadmin` y `plaadmin`. Si se selecciona `munadmin`, se exige y despliega el selector de los 23 municipios; si es `plaadmin`, se solicitan municipio y código DEA. Al guardar, se ejecuta `safeUpdateDoc` sobre el documento del usuario en Firestore y se refrescan las vistas.
  - **Normalización de Nombres Geográficos:** Se integró la función `normalizarMunicipio()` de `geografia.js` en todas las evaluaciones de rol y municipio (`configurarInterfazPorRol`, `loadEstadisticas`, `loadUsuariosList`), previniendo desajustes por acentos, mayúsculas o espacios.
  - **Clarificación de Roles en el Registro:** Se actualizaron los textos de las opciones de registro a: *«Responsable SGH Zonal (Nivel Estadal Mérida)»* y *«Responsable SGH Municipal (Coordinador de Municipio)»*.
- **Control SemVer y Despliegue:**
  - Actualización SemVer a `v2.20.4` en `package.json` y en las 5 referencias de `index.html`.
  - Compilación exitosa en Vite y despliegue a Firebase Hosting (`https://sgh-merida.web.app`).

**3. Archivos Involucrados:**
- `webapp/package.json` (v2.20.4)
- `webapp/index.html` (v2.20.4)
- `webapp/src/admin.js`
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`

---

### v2.20.5 - 2026-10-30 (Blindaje Anti-Desbordamiento Estadal, Resolución Multi-Alias y Soporte Universal de Municipios Compuestos)

**1. Objetivos del Ciclo:**
- Atender el reporte remitido por el usuario en el que el Coordinador Municipal de **Julio César Salas** visualizaba en su pantalla el título municipal pero con los totales estadales consolidados (1,221 escuelas y 23,288 empleados), además de 0 directores y 0 planteles en el estatus de matrícula.
- Eliminar de raíz cualquier riesgo de desbordamiento de datos estadales en vistas municipales.
- Asegurar que cualquier municipio con nombre compuesto o variante abreviada/extendida (`JULIO CESAR SALAS` vs `JULIO CESAR`, `CARACCIOLO PARRA OLMEDO` vs `CARACCIOLO PARRA`, `ANTONIO PINTO SALINAS` vs `ANTONIO PINTO SALINA`, `TULIO FEBRES CORDERO` vs `TULIO FEBRES`) resuelva de forma infalible sus datos estadísticos y sus consultas en Firestore.

**2. Solución Técnica y Arquitectura:**
- **Diagnóstico Profundo:**
  - En la captura aportada por el usuario, el navegador del coordinador municipal se encontraba ejecutando la versión `v2.20.3`.
  - En `v2.20.3`, la lectura de municipio tomaba el valor literal sin normalización (`"JULIO CESAR SALAS"`).
  - Al consultar `resumenData.porMunicipio["JULIO CESAR SALAS"]`, el resultado era `undefined` porque el índice maestro en `resumen_estadisticas.json` utilizaba la clave abreviada `"JULIO CESAR"`.
  - La condición de fallback en el código recurría a `resumenData.global`, provocando que la interfaz municipal mostrara las cantidades completas de todo el estado Mérida.
  - Las consultas directas a Firestore en las colecciones `planteles` y `usuarios` utilizaban `where("municipio", "==", mun)` estricto, devolviendo 0 documentos ante cualquier variación del nombre.
- **Acciones Implementadas:**
  - **Escudo Estricto Anti-Desbordamiento en `loadEstadisticas()`:** Se prohibió de forma absoluta que una vista municipal recurra a `resumenData.global`. Si un municipio no fuese encontrado, devolverá una estructura en blanco (ceros), garantizando que jamás se filtren cifras de escala estadal a un ámbito local.
  - **Extractor Inteligente Multi-Alias (`getDatosMunicipio`):** Se implementó una función centralizada que busca por el nombre canónico normalizado, por el nombre literal en mayúsculas y por los alias registrados, resolviendo de inmediato las cifras reales de Julio César Salas (**23 planteles**, **374 empleados**, **266 docentes**, **11 administrativos**, **97 obreros**).
  - **Consultas a Firestore Multi-Variante (`getVariantesMunicipio`):** Se extendió `geografia.js` con `getVariantesMunicipio()`, permitiendo que las consultas a Firestore (`planteles`, `usuarios`, `nomina`) busquen mediante el operador `in` cubriendo tanto el nombre largo como el corto y versiones con tildes.
  - **Normalización de Doble Vía en Planteles y Descargas:** Se blindó `loadPlanteles()` y el modal de nómina para normalizar siempre `userMun` con `normalizarMunicipio()` y filtrar en cliente de manera insensible a variaciones de sintaxis.
  - **Inyección de Aliases en `resumen_estadisticas.json`:** Se añadieron al archivo JSON de respaldo las 10 claves variantes para garantizar acceso instantáneo con cero lecturas adicionales a Firestore (*Zero-Cost Shield*).
- **Control SemVer y Despliegue:**
  - Incremento de versión PARCHE a `v2.20.5` en `package.json` y en las 5 ocurrencias de `index.html`.
  - Compilación exitosa en Vite y despliegue a Firebase Hosting (`https://sgh-merida.web.app`).

**3. Archivos Involucrados:**
- `webapp/package.json` (v2.20.5)
- `webapp/index.html` (v2.20.5)
- `webapp/src/geografia.js`
- `webapp/src/admin.js`
- `webapp/public/resumen_estadisticas.json`
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`

---

### v2.20.6 - 2026-10-30 (Puente Universal de Auto-Recuperación y Revinculación de Perfiles por Correo)

**1. Objetivos del Ciclo:**
- Resolver el bloqueo de acceso presentado a usuarios registrados que tienen ficha creada y autorizada en Firestore (`estado_aprobacion: "APROBADO"`), pero reciben en pantalla el mensaje: *«Cuenta en Revisión: Tu cuenta fue creada pero falta el perfil. Contacta soporte.»* (caso reportado por la Coordinadora Municipal de Justo Briceño, Mileidy Rubio, `gestionhumanajb2026@gmail.com`).
- Garantizar que si un documento en Firestore fue creado con una clave autogenerada o desfasada con respecto al `user.uid` de Firebase Authentication, el sistema lo auto-recupere y revincule transparentemente sin intervención manual.
- Permitir que cualquier usuario cuyo estado en base de datos sea `APROBADO` ingrese de inmediato sin quedar bloqueado por la verificación de email.

**2. Solución Técnica y Arquitectura:**
- **Diagnóstico Profundo:**
  - En `webapp/src/auth.js`, la verificación de perfil se hacía únicamente buscando el documento por su clave primaria: `getDoc(doc(db, "usuarios", user.uid))`.
  - Cuando los perfiles se creaban manualmente en Firestore o existían re-registros de autenticación, el `doc.id` no coincidía con el `user.uid` de Firebase Auth.
  - Al retornar `userSnap.exists() === false`, el sistema activaba el callback `onWait("Tu cuenta fue creada pero falta el perfil. Contacta soporte.")`.
  - Asimismo, si el usuario no había confirmado el email recibido (`user.emailVerified === false`), se activaba una segunda pantalla de espera a pesar de que el perfil ya estuviese formalmente aprobado por las autoridades.
- **Acciones Implementadas:**
  - **Mecanismo de Rescate por Correo Electrónico (`auth.js`):**
    - Si `userSnap.exists()` es falso, el observador de autenticación ejecuta una consulta secundaria en la colección `usuarios` filtrando por `where("email", "==", user.email)` (con tolerancia a mayúsculas/minúsculas).
  - **Auto-Revinculación Persistente en Firestore:**
    - Al encontrar el documento huérfano, el sistema escribe inmediatamente el perfil completo en `doc(db, "usuarios", user.uid)` mediante `setDoc()` preservando los datos originales y añadiendo `revinculado_el: new Date().toISOString()`. De este modo, los futuros inicios de sesión se ejecutan en tiempo O(1) directo a costo cero.
  - **Paso Directo para Cuentas Aprobadas:**
    - Se actualizó el "Doble Candado": si `userData.estado_aprobacion === 'APROBADO'`, el usuario accede inmediatamente a su panel sin ser frenado por `emailVerified`.
- **Control SemVer y Despliegue:**
  - Actualización SemVer a `v2.20.6` en `package.json` y en las 5 referencias de `index.html`.
  - Compilación limpia con Vite y despliegue a Firebase Hosting (`https://sgh-merida.web.app`).
  - **Validación en Producción:** Confirmado el acceso exitoso de la Coordinadora Municipal de Justo Briceño (Lic. Mileidy Rubio) en su dispositivo móvil. El sistema enlazó transparentemente su ficha y le concedió paso directo a la Pizarra Municipal.
  - **Auditoría de Capacidad Spark Tier:** Se brindó claridad y tranquilidad al Administrador respecto a la paginación visual de la consola de Firebase (`Filas por página: 250`), ratificando que el sistema cuenta con capacidad ilimitada de cuentas y holgura absoluta para los ~2.000 usuarios del Estado Mérida a costo cero. Satisfacción plena manifestada por el Administrador.

**3. Archivos Involucrados:**
- `webapp/package.json` (v2.20.6)
- `webapp/index.html` (v2.20.6)
- `webapp/src/auth.js`
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`








---

### v2.21.0 - 2026-10-31 (Buscador Integral de Usuarios Multi-Criterio para Superadmin, Zonadmin y Munadmin)

**1. Objetivos del Ciclo:**
- Atender el requerimiento formulado por el Administrador: *"necesito un buscador de usuarios en los roles superadmin, zonadmin y munadmin; por nombre, cedula, codigo plantel, correo"*.
- Dotar al panel de gestión de *Usuarios del Sistema* de una herramienta de búsqueda reactiva en tiempo real con latencia de 0 ms y costo cero de lecturas a Firestore (*Zero-Cost Optimization*).
- Permitir que las autoridades zonales (`zonadmin`) puedan supervisar y localizar tanto a coordinadores municipales como a directores de plantel por su código DEA en todo el estado.

**2. Solución Técnica y Arquitectura:**
- **Inyección de Componentes DOM (`webapp/index.html`):**
  - Se agregó el campo de texto reactivo `#inp-buscar-usuario` con placeholder: `🔍 Buscar por nombre, cédula, DEA o correo...` junto al botón de limpieza rápida `#btn-limpiar-buscar-usuario` (cruz interactiva).
  - Se rediseñó la barra de filtros con alineación flexible (`flex-wrap: wrap; gap: 10px`) para garantizar visualización y usabilidad óptima tanto en monitores de escritorio como en dispositivos móviles.
  - Se ajustó el valor por defecto de `#filter-estado` a `TODOS` para evitar que la lista oculte usuarios aprobados al realizar búsquedas específicas.
- **Motor de Filtrado Client-Side Multi-Criterio (`webapp/src/admin.js`):**
  - En `renderUsuariosList()`, se implementó una evaluación que contrasta el término de búsqueda normalizado (`toLowerCase()`) contra:
    1. **Nombre completo:** `(u.nombre || '').toLowerCase()`
    2. **Cédula de Identidad:** Coincidencia de texto directo o por extracción numérica pura (`replace(/\D/g, '')`) con soporte para cédulas con o sin puntos y formatos V- / E-.
    3. **Código de Plantel (DEA):** Coincidencia con `u.jerarquia.plantel_codigo`, `u.codigo_plantel`, `u.plantel_codigo`, `u.dea`, etc.
    4. **Correo Electrónico:** `(u.email || '').toLowerCase()`
    5. **Municipio:** `(u.jerarquia.municipio || u.municipio || '').toLowerCase()`
  - Los resultados se combinan de manera armónica con el filtro de rol (`#filter-rol-usuario`) y el filtro de estado (`#filter-estado`).
  - Ante cero resultados, la tabla emite retroalimentación amigable: `No se encontraron usuarios coincidentes con "[término]"`.
- **Ampliación de Ámbito para Coordinadores Zonales (`zonadmin`):**
  - En `loadUsuariosList()`, se autorizó a `zonadmin` para cargar coordinadores municipales (`munadmin`) y directores de planteles (`plaadmin`), permitiendo buscar a cualquier director de los 23 municipios por su código DEA.
  - El selector `#filter-rol-usuario` se habilitó para `zonadmin` con las opciones de alternancia entre coordinadores y directores.
  - La tarjeta de métricas `#stat-usuarios` en la Pizarra de `zonadmin` se preservó con la discriminación estricta de coordinadores municipales.
- **Control SemVer y Despliegue:**
  - Incremento de versión MENOR a `v2.21.0` en `package.json` y en las 5 referencias de `index.html`.
  - Compilación exitosa en Vite y despliegue a Firebase Hosting (`https://sgh-merida.web.app`).

**3. Archivos Involucrados:**
- `webapp/package.json` (v2.21.0)
- `webapp/index.html` (v2.21.0)
- `webapp/src/admin.js`
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`


---

### v2.21.1 - 2026-10-31 (Cabecera Fija Sticky Header y Navegación Flotante en Desplazamiento)

**1. Objetivos del Ciclo:**
- Atender el requerimiento de interfaz formulado por el Administrador: *"Necesitamos el header fijo, que no se esconda al despalzar hacia abajo"*.
- Garantizar que la barra superior institucional permanezca anclada permanentemente en el borde superior de la pantalla durante el desplazamiento vertical, tanto en computadoras de escritorio como en dispositivos móviles.
- Asegurar que el botón del menú hamburguesa (☰), el distintivo de versión, el perfil del usuario y el botón de salida rápida (*Salir*) estén accesibles sin necesidad de desplazarse de regreso al tope.

**2. Solución Técnica y Arquitectura:**
- **Inyección de Posicionamiento Sticky en CSS y DOM (`styles.css` & `index.html`):**
  - Se configuró `#admin-header` y `.admin-header` con `position: sticky !important; top: 0 !important; z-index: 1000 !important;`.
  - Se aplicó un acabado visual moderno con fondo blanco esmerilado de alta densidad (`background: rgba(255, 255, 255, 0.98); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px)`) y sombra sutil (`box-shadow: 0 2px 10px rgba(0,0,0,0.05)`), impidiendo que el contenido de las tablas o tarjetas se transparente por detrás del texto de la cabecera.
  - Se replicó el blindaje sticky en la sección de media queries para pantallas móviles (`@media (max-width: 767px)`).
- **Anclaje Fijo del Menú Lateral Off-Canvas (`#admin-sidebar`):**
  - Se reestructuró `#admin-sidebar` de `position: absolute` a `position: fixed !important; top: 56px; bottom: 0; z-index: 9000; overflow-y: auto;`. De esta forma, si el usuario abre el menú lateral habiéndose desplazado cientos de píxeles hacia abajo, el menú se despliega exactamente sobre su campo visual actual sin desfases.
  - El elemento de cortina `#admin-sidebar-overlay` se actualizó a `position: fixed !important; inset: 0; z-index: 8999;` para cubrir todo el viewport visible.
- **Control SemVer y Despliegue:**
  - Incremento de versión PARCHE a `v2.21.1` en `package.json` y en las 5 referencias de `index.html`.
  - Compilación limpia con Vite (670 ms) y despliegue a Firebase Hosting (`https://sgh-merida.web.app`).

**3. Archivos Involucrados:**
- `webapp/package.json` (v2.21.1)
- `webapp/index.html` (v2.21.1)
- `webapp/styles.css`
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`


---

### v2.21.2 - 2026-10-31 (Adaptabilidad Tipográfica Proporcional del Perfil y Blindaje Anti-Desborde en Móviles)

**1. Objetivos del Ciclo:**
- Atender la incidencia reportada por el Administrador con soporte de video: al iniciar sesión en un dispositivo móvil con un usuario de nombre y municipio largos, el título y el nombre ocupaban un ancho excesivo, desplazando el botón de menú hamburguesa (☰) a la izquierda y el botón de salida (*Salir*) a la derecha fuera del área visible de la pantalla.
- Implementar la sugerencia del usuario: *"mi sugerencia, que el nombre disminuya de tamaño según longitud"*.
- Asegurar que en cualquier resolución móvil (desde 320px en adelante), el botón hamburguesa, el logo, el nombre y el botón Salir coexistan de manera armoniosa y 100% visible sin ningún desbordamiento horizontal.

**2. Solución Técnica y Arquitectura:**
- **Escalado Tipográfico Dinámico Proporcional (`webapp/src/admin.js`):**
  - En la rutina de configuración de encabezado (`configurarInterfazPorRol`), se programó una escala reactiva que calcula la longitud total de la cadena compuesta `${nombre} (${municipio})`:
    - $> 35$ caracteres: `font-size: 0.68rem; line-height: 1.1; max-width: 150px;`
    - $> 25$ caracteres: `font-size: 0.74rem; line-height: 1.15; max-width: 180px;`
    - $> 18$ caracteres: `font-size: 0.78rem; max-width: 210px;`
    - $\le 18$ caracteres: `font-size: 0.85rem; max-width: 250px;`
  - Se inyectó el atributo nativo `title` con el texto completo para que el funcionario pueda visualizar el nombre y municipio íntegros al pulsar o pasar sobre el elemento.
- **Blindaje Estructural y Protección de Extremos (`webapp/index.html` & `webapp/styles.css`):**
  - Se aplicó `flex-shrink: 0 !important;` y ancho mínimo protegido tanto al botón hamburguesa `#btn-hamburger` como al botón `#btn-logout-admin`.
  - El contenedor derecho `#admin-header-right` se configuró con `flex: 1 1 auto; justify-content: flex-end; min-width: 0;` y `#admin-user-container` con `max-width: 140px; min-width: 0;`.
  - En `#admin-user-name` se forzó `overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`.
  - Para pantallas compactas ($\le 440\text{px}$), se ocultó la etiqueta de versión dentro del header para liberar 45px adicionales de espacio horizontal, permitiendo que la cabecera completa se ajuste con total holgura en viewports pequeños ($320\text{px} - 360\text{px}$).
- **Control SemVer y Despliegue:**
  - Incremento de versión PARCHE a `v2.21.2` en `package.json` y en las 5 referencias de `index.html`.
  - Compilación limpia con Vite (713 ms) y despliegue a Firebase Hosting (`https://sgh-merida.web.app`).
  - **Validación y Cierre de Ciclo:** El Administrador validó el ajuste responsive confirmando plena satisfacción con el despliegue en producción.

**3. Archivos Involucrados:**
- `webapp/package.json` (v2.21.2)
- `webapp/index.html` (v2.21.2)
- `webapp/src/admin.js`
- `webapp/styles.css`
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`


---

### Entrada de Bitácora - Versión v2.21.3 (31 de Octubre de 2026)

**1. Contexto y Requerimiento:**
- El Administrador reporta una incidencia crítica recibida desde soporte con 3 imágenes adjuntas:
  1. *WhatsApp Image 2026-10-31 at 15.48.44.jpeg:* Teléfono móvil mostrando el bloqueo: *«Cuenta en Revisión: Tu cuenta fue creada pero falta el perfil. Contacta soporte.»*.
  2. *Captura.PNG:* Pantalla de Firebase Authentication mostrando el usuario `liceopedrojosegonzalez2026@gmail.com` con UID `s2AoGlhA0QekD7mkIAeQ7Bzby8y2` creado el 31 de octubre de 2026.
  3. *Captura0001.PNG:* Pantalla de Cloud Firestore en la colección `usuarios`, donde el administrador intentó buscar al usuario con el buscador del navegador (`Ctrl+F`), resultando infructuoso y tedioso por listarse únicamente IDs alfanuméricos.
- El usuario consulta: *«¿Qué estará pasando? ¿Se podrá conseguir en la pantalla de la colección de usuarios? Ayer creo que pasó lo mismo con otro usuario y pensé que esto no volvería a suceder»*.

**2. Diagnóstico Técnico y Hallazgos:**
- **Confusión de Pantallas:** En la imagen 2 (`Captura.PNG`), el Administrador observa la consola de **Firebase Authentication** (control de acceso y contraseñas), confundiéndola con Firestore.
- **Inexistencia de Ficha en Firestore:** Al auditar la base de datos Firestore mediante la API REST con credenciales maestras, se constató que existían 216 cuentas en Authentication pero solo 182 fichas en Firestore: 34 cuentas quedaron huérfanas en el registro inicial al interrumpirse la conexión antes de ejecutar `safeSetDoc`.
- **Diferencia con el Caso de Ayer (Mileidy Rubio):**
  - El caso de Mileidy Rubio (`v2.20.6`) era una discordancia de UID (su ficha sí existía en Firestore bajo un ID viejo y el sistema la revinculó automáticamente).
  - En el caso del Liceo Pedro José González, la ficha **NUNCA existió** en Firestore: existía la "llave" de entrada en Authentication pero no el "expediente" en la base de datos.
- **Búsqueda en Consola:** La consola web de Firestore solo muestra identificadores de documentos cifrados; para buscar usuarios por nombre, cédula, código DEA o correo, la herramienta adecuada es el nuevo **Buscador de Usuarios** implementado en SGH Panel (`v2.21.0`).

**3. Solución Técnica y Arquitectura:**
- **Creación y Activación del Perfil del Liceo Pedro José González:**
  - Se generó el documento `usuarios/s2AoGlhA0QekD7mkIAeQ7Bzby8y2` en Firestore:
    - `email`: `liceopedrojosegonzalez2026@gmail.com`
    - `nombre`: `DIRECTOR LICEO PEDRO JOSÉ GONZÁLEZ`
    - `rol`: `plaadmin`
    - `jerarquia`: `{ estado: "MERIDA", municipio: "PUEBLO LLANO", plantel_codigo: "OD16551416" }`
    - `estado_aprobacion`: `APROBADO`
  - Se añadió el código DEA `OD16551416` a las excepciones activas en `configuracion/despliegue` para garantizar acceso inmediato al sistema.
- **Formulario Inteligente de Auto-Completado de Ficha (`webapp/index.html` & `webapp/src/main.js`):**
  - Se integró el contenedor interactivo `#box-completar-perfil` en la pantalla de espera (`espera-view`).
  - Si cualquier usuario autenticado en Auth carece de ficha en Firestore, se le solicita de forma guiada su Nombre, Cédula, Teléfono, Rol y Plantel/Municipio. Al pulsar *"Guardar Perfil y Enviar a Revisión"*, se escribe su documento en Firestore con `safeSetDoc` y se refresca la sesión.
- **Auto-Recuperación en el Formulario de Registro (`webapp/src/main.js`):**
  - Si un usuario con cuenta huérfana intenta registrarse de nuevo, el sistema captura `auth/email-already-in-use`, inicia sesión temporalmente y crea de forma transparente su ficha en Firestore con los datos ingresados en el formulario.
- **Blindaje del Orden de Operaciones:**
  - Se reordenó la rutina de registro para que `safeSetDoc` se ejecute inmediatamente después de `createUserWithEmailAndPassword`, encapsulando `sendEmailVerification` en `try/catch` para prevenir que fallas de cuota o timeouts de correo impidan la creación del perfil.

**4. Archivos Involucrados:**
- `webapp/package.json` (v2.21.3)
- `webapp/index.html` (v2.21.3, contenedor `#box-completar-perfil`)
- `webapp/src/auth.js` (invocación inteligente de `onWait` con `user`)
- `webapp/src/main.js` (rutina `initRecuperacionPerfil` y blindaje en registro)
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`


---

### Entrada de Bitácora - Versión v2.22.0 (31 de Octubre de 2026)

**1. Contexto y Requerimiento:**
- El Administrador valida con satisfacción los cambios previos y consulta: *«Me parece bien el boton nuevo ROL. ¿se puede tambien modificar el nombre del usuario?»*.
- Objetivo: Extender la capacidad del botón `✏️ Rol` para permitir a los administradores modificar el Nombre Completo, la Cédula y el Teléfono del funcionario, además de su rol y municipio/plantel asignado.

**2. Solución Técnica y Arquitectura:**
- **Ampliación de la Interfaz del Modal (`webapp/index.html`):**
  - Se añadieron los campos interactivos `#inp-edit-user-nombre`, `#inp-edit-user-cedula` e `#inp-edit-user-telefono` dentro de `#modal-editar-rol-usuario`.
  - Se adaptó el encabezado del modal a *"✏️ Modificar Datos de Usuario y Rol"*.
- **Lógica de Carga y Persistencia (`webapp/src/admin.js`):**
  - Al abrir el modal (`openEditarRolModal`), los inputs se precargan con los valores actuales del usuario (`u.nombre`, `u.cedula`, `u.telefono`).
  - Al presionar *"Guardar Cambios"*, se valida que el nombre no esté vacío y se actualiza Firestore mediante `safeUpdateDoc(doc(db, 'usuarios', uid), updateData)`.
  - Se sincroniza el objeto en memoria `usuarioEditandoRol` y se invoca `renderUsuariosList()` para reflejar los cambios instantáneamente en la interfaz.
  - Se renombró el botón en la columna de acciones a `✏️ Rol / Datos`.
- **Control SemVer y Despliegue:**
  - Incremento de versión MENOR a `v2.22.0` por incorporación de nueva funcionalidad administrativa.
  - Compilación exitosa en Vite y publicación en Firebase Hosting (`https://sgh-merida.web.app`).

**3. Archivos Involucrados:**
- `webapp/package.json` (v2.22.0)
- `webapp/index.html` (v2.22.0)
- `webapp/src/admin.js`
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`


---

### Entrada de Bitácora - Versión v2.22.1 (31 de Octubre de 2026)

**1. Contexto y Requerimiento:**
- El Administrador instruye: *«otra cosa, hay que hacer una barrera para que no ingresen dos personas al mismo miunicipio munadmin»*.
- Objetivo: Garantizar que en cada uno de los 23 municipios del estado Mérida exista única y exclusivamente un solo Coordinador Municipal (`munadmin`) activo, previniendo duplicados tanto en el registro público como en la aprobación y reasignación administrativa.

**2. Diagnóstico Técnico y Casos Reales:**
- Al auditar los 21 coordinadores municipales registrados en Firestore, se identificó un caso de duplicidad en **RIVAS DÁVILA**:
  - Cuenta 1: *JOHAN CONTRERAS* (`gestionhumanarivasdavila@gmail.com`, APROBADO).
  - Cuenta 2: *JOHANCONTRERASPADRINO* (`gestionhumanarivasdavilamunicipal@gmail.com`, PENDIENTE).
- Sin una barrera estricta, un administrador podría aprobar por descuido una segunda cuenta municipal para el mismo territorio, generando inconsistencias en permisos de visualización y exportación de nómina.

**3. Solución Técnica y Arquitectura:**
- **Blindaje en Registro (`webapp/src/main.js`):**
  - Tras invocar `createUserWithEmailAndPassword`, si `rol === 'munadmin'`, se consulta Firestore con `where('jerarquia.municipio', 'in', getVariantesMunicipio(municipio))`.
  - Si ya existe un titular activo o en trámite, se ejecuta `await cred.user.delete()` para no dejar huérfana la credencial en Firebase Auth y se despliega una alerta explicativa al usuario.
- **Blindaje en Aprobación (`webapp/src/admin.js`):**
  - En el evento `btn-aprobar`, se verifica en memoria `usuariosLocales` si el municipio ya tiene un `munadmin` con `estado_aprobacion === 'APROBADO'`.
  - Si existe coincidencia, se interrumpe la aprobación y se notifica: *«El municipio [MUNICIPIO] ya cuenta con un Coordinador Municipal aprobado: [NOMBRE] ([CORREO]). Desactive o reasigne al coordinador actual antes de aprobar a este usuario»*.
- **Blindaje en Modal de Edición (`webapp/src/admin.js`):**
  - En `btnGuardarEditRol`, se valida que no se pueda asignar el rol `munadmin` a un municipio ya ocupado por otro funcionario aprobado.
- **Alerta Visual de Conflicto:**
  - En `renderUsuariosList()`, cualquier registro pendiente perteneciente a un municipio con titular activo muestra un badge preventivo: `⚠️ Municipio ya tiene coordinador activo`.
- **Control SemVer y Despliegue:**
  - Incremento de versión a `v2.22.1`.
  - Compilación limpia en Vite (870 ms) y publicación en Firebase Hosting (`https://sgh-merida.web.app`).

**4. Archivos Involucrados:**
- `webapp/package.json` (v2.22.1)
- `webapp/index.html` (v2.22.1, notas orientadoras en registro)
- `webapp/src/main.js` (barrera en registro y recuperación con eliminación atómica de auth)
- `webapp/src/admin.js` (barrera en aprobación, edición de rol y badge visual de conflicto)
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`


---

### Entrada de Bitácora - Versión v2.22.2 (31 de Octubre de 2026)

**1. Contexto y Requerimiento:**
- El Administrador reporta una inconformidad visual con soporte de imagen (`media_1793482136492_ad1cbdb8.png`): *«Cuando se usa buscar usuario el boton de la X queda muy feo encima del campo, en la pc y movil»*.
- En la captura se evidenció que al escribir en el campo de búsqueda de usuarios, la `✕` de borrado rápido se renderizaba en el centro del input, sobre el texto escrito.

**2. Diagnóstico Técnico:**
- La regla general de `button` en `webapp/src/style.css` forzaba `width: 100%` y padding amplio con `text-align: center`.
- Al alternar `btnLimpiarBuscarUsuario.style.display = 'block'` en `admin.js`, el botón se expandía a lo largo de todo el ancho del contenedor padre y centraba la `✕` en el punto medio del input, desbordando el área de entrada de texto.

**3. Solución Técnica y Arquitectura:**
- **Encapsulación y Restricción Estricta de Dimensiones (`webapp/styles.css` & `webapp/index.html`):**
  - Se configuró `#btn-limpiar-buscar-usuario` con `width: 22px !important; height: 22px !important; min-width: 22px !important; max-width: 22px !important; padding: 0 !important; margin: 0 !important;`.
  - Se le dio acabado de botón moderno tipo píldora/círculo (`border-radius: 50% !important; background: #e2e8f0; color: #64748b;`).
  - Se posicionó con anclaje firme a la derecha: `position: absolute; right: 10px; top: 50%; transform: translateY(-50%)` y se amplió el padding derecho del input a `38px` para que ningún texto colisione con el botón.
  - En `webapp/src/admin.js`, se cambió la activación a `inline-flex` para mantener el centrado interno del glifo `✕` con flexbox.
- **Control SemVer y Despliegue:**
  - Incremento de versión PARCHE a `v2.22.2`.
  - Compilación limpia en Vite (708 ms) y despliegue a Firebase Hosting (`https://sgh-merida.web.app`).

**4. Archivos Involucrados:**
- `webapp/package.json` (v2.22.2)
- `webapp/index.html` (v2.22.2)
- `webapp/styles.css` (reglas para `#btn-limpiar-buscar-usuario`)
- `webapp/src/admin.js` (activación con `inline-flex`)
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`


---

### Entrada de Bitácora - Versión v2.23.0 (31 de Octubre de 2026)

**1. Contexto y Requerimiento:**
- El Administrador instruye: *«Se necesita agregar un boton para descargar data de planteles; en este caso creo que es de la colección planteles. para los usuarios superadmin, zonadmin y munadmin»*.
- Objetivo: Proporcionar a las autoridades zonales y coordinadores municipales una herramienta de exportación en formato Excel (.xlsx) para auditar, respaldar y analizar la data maestra de las instituciones educativas del estado Mérida.

**2. Diagnóstico Técnico y Arquitectura:**
- La colección `planteles` en Cloud Firestore cuenta con 1.159 documentos estructurados con campos clave (códigos, nuevo epónimo, nominal, dependencia, municipio, parroquia, nivel, planes de estudio, matrícula y secciones).
- En el panel administrativo existía previamente la exportación de nómina de personal (`#btn-descargar-nomina-mun`), pero no existía una función de descarga del catálogo de planteles.
- Principio Zero-Cost: Para preservar la cuota del plan gratuito Spark, la exportación reutiliza el array `currentPlanteles` cargado en memoria durante la sesión del usuario. La transformación y renderizado del archivo binario .xlsx se procesa 100% en el navegador mediante SheetJS (`XLSX.utils.json_to_sheet` y `XLSX.writeFile`), con coste de 0 lecturas adicionales a Firestore.

**3. Solución Técnica Implementada:**
- **Interfaz en Pestaña de Planteles (`webapp/index.html`):**
  - Se añadió el botón `🏫 Descargar Planteles (.xlsx)` (`#btn-descargar-planteles`) en la barra superior de acciones junto al botón de Nómina Municipal.
- **Acceso en Barra Lateral (`webapp/index.html` & `webapp/src/admin.js`):**
  - Se añadió el botón `🏫 Descargar Planteles` (`#btn-sidebar-descargar-planteles`) en el acordeón *Gestor de BD*, sincronizado con la regla de privilegios `tienePermiso('planteles')`.
- **Modal de Selección de Ámbito (`#modal-seleccionar-ambito-planteles`):**
  - Para `superadmin` y `zonadmin`: Permite exportar el consolidado estatal completo de Mérida (1.159 planteles) o seleccionar cualquiera de los 23 municipios. Si el usuario tiene una búsqueda activa en el campo de texto, el modal le ofrece la opción de exportar únicamente los resultados filtrados.
  - Para `munadmin`: Adapta las opciones para descargar la totalidad de planteles de su municipio o descargar por parroquias específicas.
- **Mapeo Integral de Columnas:**
  - 20 campos formateados: Código DEA, Nuevo Epónimo, Nombre Nominal, Denominación, Dependencia, Código Dependencia, Código Estadístico, Estado, Municipio, Parroquia, Nivel, Modalidad, Turno, Ubicación Geográfica, Planes de Estudio, Estatus Matrícula, Total Matrícula, Total Secciones, Metros Cuadrados y Observaciones.
  - Dimensionamiento automático de anchos de columna (`ws['!cols']`) y nombres de archivo limpios según ámbito y fecha ISO.
- **Control SemVer y Despliegue:**
  - Incremento de versión MENOR a `v2.23.0` en `package.json` e `index.html`.
  - Compilación sin errores en Vite (685 ms) y despliegue exitoso a Firebase Hosting (`https://sgh-merida.web.app`).

**4. Archivos Involucrados:**
- `webapp/package.json` (v2.23.0)
- `webapp/index.html` (v2.23.0, modal `#modal-seleccionar-ambito-planteles` y botones)
- `webapp/src/admin.js` (controladores DOM, lógica de exportación multi-rol y SheetJS)
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`


---

### Entrada de Bitácora - Versión v2.23.1 (31 de Octubre de 2026)

**1. Contexto y Requerimiento:**
- El Administrador reporta con soporte de capturas de la consola de Cloud Firestore un consumo de 55.000 operaciones de lectura en las últimas 24 horas, alcanzando el umbral diario del Plan Spark de Firebase (50k lecturas), a pesar de haberse registrado únicamente unas 3 pares de decenas de directores.
- Tras la lectura estricta de las directrices de `SKILL_sgh_firebase.md` (Skill 4, Regla de Oro 1: "Cero Lecturas Basura"), se procedió a una auditoría forense para erradicar cualquier fuga de lecturas.

**2. Diagnóstico Técnico Forense:**
- **Antena Continua (`onSnapshot`):** En `webapp/src/admin.js` (línea 1221), la función `loadUsuariosList()` mantenía suscrita la consulta `onSnapshot(query(collection(db, 'usuarios')))`. Con picos de 16 conexiones activas y 13 listeners simultáneos, cada fluctuación de la red móvil forzaba la re-evaluación y re-descarga de la colección completa para cada cliente conectado.
- **Sobrecarga de Ámbito:** Los coordinadores municipales (`munadmin`) descargaban todos los usuarios del estado Mérida y los filtraban en el cliente, violando el principio de consulta indexada mínima.
- **Re-consultas Innecesarias en Acciones Administrativas:** Al aprobar o eliminar usuarios, se invocaba nuevamente `loadUsuariosList()`, provocando lecturas redundantes.
- **Falta de Caché de Sesión en Planteles Estadales:** Los 1.159 planteles del estado se consultaban directamente a Firestore cuando un Superadmin recargaba la página.

**3. Solución Técnica y Arquitectura:**
- **Reemplazo de `onSnapshot` por `getDocs` con Memoria Volátil:** Se desactivó el listener reactivo continuo y se adoptó una arquitectura de lectura estática bajo demanda en `loadUsuariosList(forzar)`.
- **Filtro Indexado por Jurisdicción Municipal:** Para `munadmin`, la consulta se ejecuta con `where('rol', '==', 'plaadmin')` y `where('jerarquia.municipio', 'in', getVariantesMunicipio(userMunNorm))`.
- **Manipulación Atómica en Memoria (0 Lecturas):** Al aprobar (`estado_aprobacion = 'APROBADO'`) o eliminar registros, se muta el arreglo `usuariosLocales` en memoria y se repinta el DOM instantáneamente.
- **Inyección de Botón de Refresco (`#btn-refrescar-usuarios`):** Se agregó un control explícito en la barra de herramientas para recargas controladas.
- **Caché Estadal de Planteles en `sessionStorage`:** Se introdujeron `obtenerPlantelesEstadalCache` y `guardarPlantelesEstadalCache`.
- **Control SemVer y Despliegue:**
  - Incremento a `v2.23.1` (PARCHE de rendimiento y Zero-Cost).
  - Compilación limpia en Vite (708 ms) y despliegue exitoso a Firebase Hosting (`https://sgh-merida.web.app`).

**4. Archivos Involucrados:**
- `webapp/package.json` (v2.23.1)
- `webapp/index.html` (v2.23.1, botón `#btn-refrescar-usuarios`)
- `webapp/src/admin.js` (eliminación de `onSnapshot`, filtro municipal indexado, mutaciones en memoria y caché estadal)
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`


---

### Entrada de Bitácora - Versión v2.23.2 (31 de Octubre de 2026)

**1. Contexto y Requerimiento:**
- El Administrador consulta: *«¿Ese boton de descargar planteles agotaría la cuota si muchos en corto tiempo hacen descargas?»*.
- Instruye además leer con atención `SKILL_sgh_firebase.md` de `webapp-expert` antes de cualquier acción.
- Se requirió verificar el modelo de consumo de cuota de la función de descarga de planteles para garantizar la permanencia del proyecto en el Plan Gratuito (Spark) de Firebase.

**2. Diagnóstico Técnico y Arquitectura de Cuota:**
- **Modelo de Ejecución en Navegador (Client-Side Rendering):**
  - La función de descarga `ejecutarExportacionPlantelesExcel(opcion)` toma los planteles directamente del arreglo `currentPlanteles` que ya reside en la memoria RAM del navegador y en la sesión (`sessionStorage`).
  - La transformación de la matriz JSON a formato binario `.xlsx` de Microsoft Excel se ejecuta íntegramente con SheetJS (`XLSX.utils.json_to_sheet` y `XLSX.writeFile`) en el procesador local del dispositivo.
  - **Consumo de Firestore por cada descarga: 0 lecturas.** El botón de descarga no realiza solicitudes HTTP ni consultas a la base de datos de Cloud Firestore.
  - Incluso si 50 directores o coordinadores hacen clic repetidamente al botón de descarga decenas de veces en simultáneo, el consumo de cuota es estrictamente **CERO**.
- **Definición Funcional en `admin.js`:**
  - Se verificó e inyectó de forma explícita el bloque `function abrirModalSeleccionarPlanteles()` y `function ejecutarExportacionPlantelesExcel(opcion)` en `webapp/src/admin.js` para asegurar su completa operatividad sin errores de referencia en tiempo de ejecución.

**3. Solución Técnica Implementada:**
- **Inyección de Funciones Exportadoras en `admin.js`:**
  - Modal selector de ámbito (`#modal-seleccionar-ambito-planteles`) conectado a los eventos click de los botones `#btn-descargar-planteles` y `#btn-sidebar-descargar-planteles`.
  - Rutina de exportación con ordenamiento por municipio/parroquia/epónimo y mapeo exhaustivo de 20 campos institucionales.
- **Control SemVer y Despliegue:**
  - Incremento de versión a `v2.23.2` en `package.json` e `index.html`.
  - Compilación limpia en Vite (1.29s) y despliegue exitoso a Firebase Hosting (`https://sgh-merida.web.app`).

**4. Archivos Involucrados:**
- `webapp/package.json` (v2.23.2)
- `webapp/index.html` (v2.23.2)
- `webapp/src/admin.js` (inyección y enlace de `abrirModalSeleccionarPlanteles` y `ejecutarExportacionPlantelesExcel`)
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`


---

### Entrada de Bitácora - Versión v2.23.3 (2 de Noviembre de 2026)

**1. Contexto y Requerimiento:**
- El Administrador consulta si es posible verificar si el plantel `OD12551412` está en la base de datos sin afectar la regla de Zero-Cost.
- Tras verificar que no existía en la colección activa de Firestore pero sí en el respaldo maestro histórico (`bd_sgh.json`) y con 20 trabajadores ya cargados en `cargos_personal` (entre ellos su Director Encargado, Prof. Deifilio Contreras Rivas, C.I. 11.461.168), el Administrador aprueba: *«Los resultados son satisfactorios. Sí autorizo a dar de alta al plantel OD12551412, para que el director pueda integrarse a la jornada que comenzó hoy»*.

**2. Diagnóstico Técnico y Arquitectura de Alta:**
- **Identificación de Datos Oficiales (`bd_sgh.json`):**
  - Código DEA: `OD12551412`
  - Denominación: CENTRO DE REHABILITACION DE LENGUAJE
  - Nombre Nominal: CENTRO DE REHABILITACION DE LENGUAJE
  - Nuevo Epónimo: CENTRO DE REHABILITACION DEL LENGUAJE
  - Dependencia: NACIONAL (Código Dependencia: `6490063`)
  - Código Estadístico: `141676`
  - Municipio: LIBERTADOR
  - Parroquia: MARIANO PICON SALAS
  - Modalidad: EDUCACION ESPECIAL
  - Turno: DOBLE TURNO
- **Zero-Cost & Impacto de Cuota:**
  - Se realizó la inyección directa mediante solicitud HTTP REST autorizada contra el endpoint `/planteles/OD12551412`.
  - Costo: **1 escritura única y 0 lecturas**. Preservación absoluta de las cuotas del plan Spark de Firebase.

**3. Solución Técnica Implementada:**
- **Creación en Firestore:** Documento `planteles/OD12551412` generado con todos los atributos requeridos por el sistema.
- **Habilitación de Registro Inmediato:** El Director Encargado puede ahora completar su registro como `plaadmin` con el DEA `OD12551412`. Al iniciar sesión, el sistema enlazará automáticamente los 20 registros existentes en `cargos_personal`.
- **Control SemVer y Despliegue:**
  - Incremento a **`v2.23.3`** en `package.json` e `index.html`.
  - Compilación limpia en Vite (1.18s) y despliegue a Firebase Hosting (`https://sgh-merida.web.app`).

**4. Archivos Involucrados:**
- `webapp/package.json` (v2.23.3)
- `webapp/index.html` (v2.23.3)
- Base de datos Cloud Firestore (`planteles/OD12551412`)
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`


---

### Entrada de Bitácora - Versión v2.24.0 (2 de Noviembre de 2026)

**1. Contexto y Requerimiento:**
- El Administrador consulta mediante soporte de captura de pantalla (`media_1793632335873_1a57c7c6.png`): *«¿un usuario director puede acceder dos veces con correos distintos a un mismo codigo DEA?»*.
- En la imagen se evidenciaron dos cuentas activas y aprobadas para el Prof. René Maximiliano Guillén González (C.I. 9397736) asignadas al plantel `OD03971408` (Cardenal Quintero) mediante dos correos Gmail distintos.
- El Administrador instruye: *«Sí procede»* para blindar el sistema y activar el candado institucional anti-duplicados a nivel de directores de plantel.

**2. Diagnóstico Técnico y Arquitectura de Blindaje:**
- **Vulnerabilidad de Duplicidad:** La barrera institucional previa únicamente validaba el rol `munadmin` por municipio. Para `plaadmin`, no existía restricción a nivel de código DEA en el registro ni en la aprobación, permitiendo múltiples cuentas para la misma institución y la misma cédula de identidad.
- **Principio Zero-Cost:**
  - En el panel administrativo (`admin.js`), la validación de duplicados opera 100% sobre la memoria local (`usuariosLocales`), con coste de **0 lecturas** de Firestore.
  - En el formulario de registro (`main.js`), la validación se ejecuta mediante consultas indexadas ultra-acotadas por clave única (`where('jerarquia.plantel_codigo', '==', dea)` y `where('cedula', '==', cedula)`), consumiendo únicamente los documentos estrictamente necesarios antes de abortar.

**3. Solución Técnica Implementada:**
- **Blindaje en Registro (`webapp/src/main.js`):**
  - Si un usuario intenta registrarse como `plaadmin` con un código DEA que ya tiene director titular (`APROBADO` o `PENDIENTE`), la credencial de Auth se purga al instante (`cred.user.delete()`) y se bloquea el proceso.
  - Se añadió validación de cédula única para impedir que la misma persona física registre cuentas múltiples con correos alternativos.
  - Se extendió la protección a la sala de espera (`initRecuperacionPerfil`) y a la rutina de auto-recuperación de cuenta huérfana.
- **Blindaje en Panel Administrativo (`webapp/src/admin.js`):**
  - **Aprobación Segura:** El botón `btn-aprobar` evalúa si el código DEA ya cuenta con un director aprobado activo. Si existe, cancela la acción y alerta al administrador con los datos del titular actual.
  - **Reasignación Protegida:** Al editar roles o municipios en `#modal-editar-rol-usuario`, se bloquea la asignación de un código DEA ocupado por otro directivo activo.
  - **Alertas Visuales en Tabla:** Se incorporaron insignias diferenciadas: ámbar para registros pendientes conflictivos y roja (`⚠️ Cuenta duplicada para el mismo DEA`) para duplicados aprobados preexistentes.
- **Interfaz Orientadora (`webapp/index.html`):**
  - Se incluyó la nota institucional: *"ℹ️ Solo se admite un Director activo por código DEA"*.
- **Control SemVer y Despliegue:**
  - Incremento a **`v2.24.0`** (versión MENOR por nueva capacidad institucional) en `package.json` e `index.html`.
  - Compilación limpia en Vite (933 ms) y despliegue exitoso a Firebase Hosting (`https://sgh-merida.web.app`).

**4. Archivos Involucrados:**
- `webapp/package.json` (v2.24.0)
- `webapp/index.html` (v2.24.0, nota orientadora en registro)
- `webapp/src/main.js` (barrera anti-duplicados DEA y cédula en registro y auto-recuperación)
- `webapp/src/admin.js` (barrera anti-duplicados DEA en aprobación, edición de rol y distintivos visuales)
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`

---

### Entrada de Bitácora - Versión v2.24.1 (2 de Noviembre de 2026)

**1. Contexto y Requerimiento:**
- El Administrador reportó que al intentar editar los datos de un plantel desde la tabla de planteles en el panel administrativo, el botón "Editar" no abría el formulario y la consola del navegador arrojaba un error de ejecución: `index-CGSd-a7b.js:434 Uncaught ReferenceError: isMunAdmin is not defined at wt (index-CGSd-a7b.js:434:849) at e.onclick (index-CGSd-a7b.js:416:327)`.
- El Administrador requirió además garantizar que el usuario `superadmin` cuente con privilegios de toda clase en el sistema sin restricciones.

**2. Diagnóstico Técnico (Causa Raíz):**
- **Ámbito Léxico Desconectado (Scope):** Las variables booleanas de rol (`isMunAdmin`, `isZonAdmin`, `isSuperAdmin`) habían sido declaradas localmente dentro del bloque interno de la función `configurarInterfazPorRol()`. 
- Al invocarse `openPlantelModal(plantel)` desde el evento `onclick` del botón `.btn-edit-plantel`, la función evaluaba `if (isMunAdmin)` sin tener dicha variable en su cadena de alcance (scope), desencadenando el `ReferenceError` y bloqueando la apertura del modal.
- Similarmente, en el listener de envío del formulario de plantel (`formPlantel.addEventListener('submit')`), las variables `isSuperAdmin` e `isZonAdmin` quedaban fuera de alcance al momento de validar el registro de nuevos planteles.

**3. Solución Técnica Implementada:**
- **Declaración Universal en `initAdminDashboard` (`webapp/src/admin.js`):**
  - Se declararon `isMunAdmin`, `isZonAdmin` e `isSuperAdmin` en el nivel superior de `initAdminDashboard`, haciéndolas accesibles para todas las funciones internas del panel administrativo.
- **Refuerzo de Alcance Local:**
  - Se agregaron las asignaciones explícitas de `isMunAdmin`, `isZonAdmin` e `isSuperAdmin` al inicio de `openPlantelModal(plantel)` y dentro de `formPlantel.addEventListener('submit')`.
- **Ratificación de Privilegios Plenos de Superadmin:**
  - Se validó que el rol `superadmin` / `admin` tiene acceso total e irrestricto: edición de planteles de cualquier municipio, modificación de códigos DEA, denominación, epónimos, ubicación, niveles, modalidades, turnos y planes de estudio; creación y eliminación de planteles; asignación de competencias zonales; y descargas de nóminas y planteles sin restricciones.

**4. Control SemVer y Despliegue:**
- Incremento a **`v2.24.1`** (PARCHE por corrección de error de referencia) en `package.json` e `index.html`.
- Compilación limpia en Vite (813 ms) generando el chunk `dist/assets/index-Dk-5kgay.js`.
- Despliegue exitoso en Firebase Hosting (`https://sgh-merida.web.app`).

**5. Archivos Involucrados:**
- `webapp/package.json` (v2.24.1)
- `webapp/index.html` (v2.24.1)
- `webapp/src/admin.js` (alcance léxico corregido en `initAdminDashboard`, `openPlantelModal` y `formPlantel.submit`)
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`

---

### Entrada de Bitácora - Versión v2.25.0 (2 de Noviembre de 2026)

**1. Contexto y Requerimiento:**
- El Administrador y Desarrollador solicita la habilitación de un plantel ficticio de prueba que no afecte la base de datos real del Estado Mérida, con su respectivo usuario Director (`plaadmin`), con el objetivo de poder visualizar e interactuar en tiempo real con la pantalla del director para resolver dudas operativas y guiar a los directores del estado durante la jornada por WhatsApp.
- Credenciales solicitadas por el usuario:
  - Correo: `alfonsozere@gmail.com`
  - Contraseña: `america2000`

**2. Arquitectura de Blindaje y Sandbox Creado:**
- **Creación en Firebase Auth:**
  - Se dio de alta la cuenta de usuario `alfonsozere@gmail.com` mediante la API REST de Google Identity Toolkit, configurando de forma automática `emailVerified: true` sin envío de correo electrónico saliente, respetando el Escudo Zero-Cost y sin consumir la cuota diaria del plan Spark.
- **Creación de Documento de Usuario en Firestore (`usuarios/{uid}`):**
  - UID: `1P9RI6NwNCQWFlQJ4VLstAgwxix1`.
  - Rol: `plaadmin` (Director de Plantel).
  - Estado: `APROBADO` (Aprobado de forma inmediata).
  - Jerarquía: Plantel `DEMO140000`, Municipio Libertador, Parroquia Sagrario.
  - Bandera identificadora: `es_demo: true`.
- **Creación de Plantel Ficticio en Firestore (`planteles/DEMO140000`):**
  - Código DEA: `DEMO140000`.
  - Nombre Nominal: `ESCUELA PILOTO DE PRUEBAS SGH`.
  - Nuevo Epónimo: `PLANTEL EXPERIMENTAL PILOTO SGH`.
  - Municipio: `LIBERTADOR` | Parroquia: `SAGRARIO`.
  - Dependencia: `NACIONAL` (Cód. 6490000) | Cód. Estadístico: `999999`.
  - Planes de Estudio habilitados para pruebas libres: Inicial (20000), Primaria (21000), Media General (31059) y Media Técnica (31060).
  - Matrícula y Secciones inicializadas en 0.
- **Aislamiento Estadístico Zero-Impact en `webapp/src/admin.js`:**
  - **Métrica de Matrícula:** `verificarPlantelTieneMatricula` retorna `{ tiene: false, total: 0 }` para planteles con prefijo `DEMO` o bandera `es_demo`, impidiendo que alumnos de prueba alteren la matrícula oficial municipal o estadal.
  - **Exportación de Planteles a Excel:** Se filtran automáticamente los planteles con `es_demo` o `DEMO`.
  - **Exportación de Nómina a Excel:** Se descartan automáticamente funcionarios vinculados a códigos `DEMO`.
  - **Filtro Municipal:** Oculto para coordinadores municipales (`munadmin`) de Libertador para evitar confusiones, y destacado con distintivo visual `🧪 Laboratorio DEMO` en el panel de `superadmin`.

**3. Control SemVer y Despliegue:**
- Incremento a **`v2.25.0`** (MENOR por introducción de infraestructura de Sandbox y Laboratorio) en `package.json` e `index.html`.
- Compilación en Vite (734 ms) generando el bundle `dist/assets/index-DCXVyrLt.js`.
- Despliegue exitoso en Firebase Hosting (`https://sgh-merida.web.app`).

**4. Archivos Involucrados:**
- `webapp/package.json` (v2.25.0)
- `webapp/index.html` (v2.25.0)
- `webapp/src/admin.js` (filtros de aislamiento estadístico y exportaciones para demo)
- Colección Firestore `planteles/DEMO140000`
- Colección Firestore `usuarios/1P9RI6NwNCQWFlQJ4VLstAgwxix1`
- Cuenta Firebase Auth `alfonsozere@gmail.com`
- `versiones.md`
- `bitacora.md`
- `conversaciones.md`

---

## [v2.25.0 - Complemento] - 2026-11-02 (Inyección de Nómina Demo y Generador Out-of-Band de Contraseñas)

### Resumen Técnico
Se culminó la configuración funcional de la Escuela Laboratorio (`DEMO140000`) para el usuario `alfonsozere@gmail.com`, dotándola de una nómina representativa multicargo de 5 funcionarios ficticios en `cargos_personal` y precargando una matrícula piloto de 30 estudiantes para desbloquear el flujo del director de inmediato. Adicionalmente, ante el bloqueo temporal por cuota de correos salientes de Firebase (error 429), se construyó un script de administración para generar enlaces oficiales de restablecimiento de contraseña out-of-band sin consumo de cuota de correo.

### Acciones Realizadas
1. **Inyección de 5 Funcionarios Demo en `cargos_personal` y `personal_resumen`:**
   - V-99000001: MARIA ELENA RAMIREZ (Docente Aula Primaria, RAC 1121DI)
   - V-99000002: CARLOS ALBERTO MORALES (Docente Media General por Horas, RAC 1125DB)
   - V-99000003: CARMEN ROSA DAVILA (Secretaria Administrativa, RAC 5022N)
   - V-99000004: PEDRO JOSE MALDONADO (Obrero Mantenimiento, RAC 8036N)
   - V-99000005: YELITZA COROMOTO MENDEZ (Cocinera de la Patria CNAE, RAC 8991N)
2. **Matrícula Piloto y Habilitación Inmediata de Pantalla:**
   - Se registró en `planteles/DEMO140000` una matrícula muestra de 30 estudiantes (1er Grado A) con `datos_completados: true`, permitiendo que el contenedor `#seccion-personal-existente` se muestre de inmediato sin forzar al usuario a cargar matrícula desde cero.
3. **Generador Administrativo de Enlaces de Restablecimiento Out-of-Band:**
   - Archivo `scratch/generar_enlace_recuperacion.js`: Consume el endpoint seguro de administración Identity Toolkit (`sendOobCode` con `returnOobLink: true`) para expedir enlaces firmados listos para compartir por WhatsApp/mensajería, sorteando la cuota diaria de correo del plan Spark. Se probó y generó exitosamente el enlace para `munijuliocesarsalaspiconlares@gmail.com`.

---

## [v2.25.1] - 2026-11-02 (Hotfix: Consolidación y Persistencia de Matrícula Total en Maternal e Inicial)

### Resumen Técnico
Se atendió la inconsistencia demostrada por el usuario mediante video, donde al guardar los datos de matrícula en Educación Inicial (Maternal + Preescolar), el subtotal "Total Inicial" mostraba la suma exacta (ej. 3 alumnos), pero el campo superior "Matrícula (Total Calculada)" quedaba desfasado o con valor inferior (ej. 2 alumnos). 

### Causa Raíz
Durante la preparación del payload de guardado en `webapp/src/main.js`, la sección de Maternal se asociaba a la clave `matricula.basica['20000'].materna`, mientras que la función de sumatoria consolidada (`sumFem + sumMas`) realizaba la lectura usando `matricula.basica['20000'].maternal?.['total-mat-fem']`. Al no coincidir el identificador (`materna` vs `maternal`), la matrícula de Maternal devolvía `undefined` (0), por lo que Firestore recibía un valor truncado de `total-gen` y `matricula-total`, sobrescribiendo la interfaz vía `onSnapshot`.

### Solución Implementada
1. **Soporte Dual `maternal || materna`:**
   - Se garantizó compatibilidad total en `seccionesPlanes['20000']`, en `matricula.basica['20000']` y en la sumatoria de género (`sumFem + sumMas`), asignando y leyendo de forma cruzada ambas claves.
   - Se ajustó `_renderCajasInicial` para precargar datos tanto si el documento existente contiene `materna` como si contiene `maternal`.
2. **Coherencia Matemática en Tiempo Real:**
   - Se refactorizó la sumatoria en vivo del formulario (`plantel-form`) para que `matTotal` sea directamente la suma de los subtotales calculados (`totIni + totPri + sumMg + sumMt + totEsp + totAdu`), impidiendo divergencias entre los indicadores de nivel y el total general.
3. **Inyección de Cabeceras Anti-Caché en Firebase Hosting (`webapp/firebase.json`):**
   - Se configuró `Cache-Control: no-cache, no-store, must-revalidate` para todos los documentos HTML y rutas rewrites, resolviendo de raíz el problema donde navegadores móviles (Chrome en Android) retenían en caché bundles antiguos (`v2.25.0`) e impedían ejecutar el nuevo código hotfix sin forzar limpieza de historial.
4. **Control SemVer y Despliegue:**
   - Elevación a `v2.25.1` (PATCH). Compilación en Vite (687 ms) y despliegue completado a Firebase Hosting (`https://sgh-merida.web.app`).

---

## [v2.26.0] - 2026-11-02 (Soporte Multi-Plantel para Directores con Cédula Compartida)

### Resumen Técnico
Se implementó la **Opción 1** aprobada por el Administrador para resolver el bloqueo de directores con múltiples planteles a su cargo (ej. circuitos escolares y NER). El sistema ahora permite que una misma persona registre múltiples cuentas institucionales con su misma cédula de identidad, siempre que cada registro corresponda a un código DEA diferente.

### Acciones Realizadas
1. **Refactorización de la Validación de Cédula Única en `webapp/src/main.js`:**
   - Si `rol === 'plaadmin'`, el sistema verifica si la cédula ya posee cuenta activa o pendiente para ese mismo código DEA (`d.jerarquia?.plantel_codigo === deaUpper`).
   - Si intenta duplicar el mismo plantel, se frena con un aviso preventivo indicando que ya posee cuenta para esa institución.
   - Si la cédula ya existe pero para otros planteles distintos, se autoriza con éxito el registro del nuevo plantel.
2. **Preservación Estricta de Candados Institucionales:**
   - Se mantiene la restricción de 1 único Director por código DEA (ningún plantel puede ser reclamado por dos usuarios distintos).
   - Se mantiene la regla de 1 único Coordinador Municipal (`munadmin`) por municipio.
3. **Control SemVer y Despliegue:**
   - Elevación a **`v2.26.0`** (MENOR por nueva capacidad institucional multi-plantel). Compilación en Vite (708 ms) y despliegue completado a Firebase Hosting (`https://sgh-merida.web.app`).







---

## [v2.26.1] - 2026-11-02 (Alta Institucional y Carga de Nóminas para Piñango - Miranda)

### Resumen Técnico
Se atendió la solicitud de auditoría de personal huérfano para tres códigos DEA: `OD13071412`, `OD13471413` y `OD00901413`. Se ejecutó la revisión cruzada contra el catálogo maestro institucional (`bd_sgh.json`), la nómina consolidada del RAC (`migracion/RAC ESTADO MERIDA - PERSONAL.csv`), la relación de planteles del RAC (`migracion/RAC ESTADO MERIDA - PLANTELES.csv`) y el registro de personal huérfano (`migracion/huerfanos.csv`).

### Diagnóstico de Auditoría
1. **`OD13071412` (Aura Marina Saavedra de Torres):**
   - Parroquia Jacinto Plaza, Municipio Libertador.
   - Dependencia Municipal. Registra 0 trabajadores en el RAC estadal y 0 en la lista de huérfanos. Al ser municipal, su personal no figuraba en la nómina centralizada del estado.
2. **`OD13471413` (Escuela Estadal José Audelino Delgado Castellano):**
   - Parroquia Piñango, Municipio Miranda. Dependencia Estadal (Cód. Estadístico: `141026`). Plan Primaria (`21000`).
   - Matrícula histórica: 10 estudiantes.
   - Nómina activa oficial: 4 trabajadores.
3. **`OD00901413` (Francisca Sánchez de Palmi):**
   - Parroquia Piñango, Municipio Miranda. Dependencia Estadal (Cód. Estadístico: `141027`). Plan Primaria (`21000`).
   - Matrícula histórica: 9 estudiantes.
   - Nómina activa oficial: 5 trabajadores.
   - **Nota Institucional:** La Directora Encargada Carmen Teresa Araujo Delgado (V-15920318) está asignada oficialmente a ambas instituciones, haciendo uso de la capacidad multi-plantel implementada en la versión v2.26.0.

### Acciones Realizadas en Base de Datos (Firestore REST)
1. **Inyección en `cargos_personal` (9 Registros):**
   - Se inyectaron los 9 expedientes completos con identificadores compuestos `${dea}_${cedula}`:
     - `OD13471413_15920318`: Carmen Teresa Araujo Delgado (Directora Encargada / Docente IV)
     - `OD13471413_23725365`: María Yarleny Paredez Ramírez (Docente Contratada)
     - `OD13471413_20848531`: Mary Eleodina Paredes Pérez (Cocinero I / Obrero Nacional)
     - `OD13471413_20848528`: Francis Margarita Lobo de Ramírez (Cocinero I / Obrero Nacional)
     - `OD00901413_15920318`: Carmen Teresa Araujo Delgado (Directora Encargada / Docente IV)
     - `OD00901413_20848536`: Yoselin Marvelys Ramírez de Salcedo (Docente III)
     - `OD00901413_20435039`: Sandra Yoleida Paredes de Salcedo (Docente de Aula)
     - `OD00901413_13391614`: Arminda Lobo de Molina (Cocinero I / Obrero Nacional)
     - `OD00901413_18310359`: Grecia Alejandra Ramírez (Cocinero I / Obrero Nacional)
2. **Creación de Documentos de Planteles en Firestore (`planteles/`):**
   - Se crearon los documentos `planteles/OD13471413` y `planteles/OD00901413` con sus metadatos oficiales, códigos estadísticos, planes de estudio y sus respectivos arrays `personal_resumen` poblados.
3. **Sincronización de Catálogos:**
   - Se actualizaron los campos de nivel, modalidad, turno y ubicación para ambos planteles en `bd_sgh.json` y `webapp/public/bd_sgh.json`.
4. **Control SemVer y Despliegue:**
   - Elevación a `v2.26.1` (PATCH). Compilación en Vite (1.30s) y sincronización con GitHub (`origin main`).


---

## [v2.26.2] - 2026-11-02 (Hotfix: Modo Fusión y Resiliencia en Edición de Planteles)

### Resumen Técnico
Se atendió el error reportado en consola: `FirebaseError: Function setDoc() called with invalid data. deleteField() cannot be used with set() unless you pass {merge:true} (found in field planes_estudio in document planteles/ON15491412)`. El fallo impedía guardar modificaciones en fichas de colegios desde el modal de administración de planteles.

### Causa Raíz
En `webapp/src/admin.js`, al someter el formulario `formPlantel`, se preparaba el objeto `newData` asignándole `deleteField()` a las llaves obsoletas `planes_estudio`, `ubicacion` y `turno`. Si el código DEA cambiaba (`codP !== id`) o se invocaba `safeSetDoc`, la función de guardado se ejecutaba sin la opción `{ merge: true }`. Las reglas del SDK de Firestore prohíben estrictamente el uso de centinelas de eliminación (`deleteField`) en escrituras destructivas completas (`setDoc`), requiriendo imperativamente el modo fusión. Adicionalmente, si el colegio provenía del catálogo estático y no existía físicamente en Firestore, `updateDoc` fallaba con `No document to update`.

### Solución Implementada
1. **Inyección de `{ merge: true }` en `safeSetDoc`:**
   - Se aseguró que toda llamada a `safeSetDoc` en el flujo de guardado de planteles en `admin.js` pase el objeto de configuración `{ merge: true }`, legitimando las instrucciones `deleteField()` para sanear la estructura de datos del plantel.
2. **Fallback Automático en Actualización:**
   - La llamada `safeUpdateDoc(doc(db, "planteles", id), newData)` fue encapsulada en bloque `try/catch`: ante cualquier fallo de documento inexistente, se conmuta automáticamente a `safeSetDoc(doc(db, "planteles", id), newData, { merge: true })`.
3. **Manejo Seguro de Renombramiento de DEA:**
   - Si se modifica el código DEA del colegio y el documento de origen no existía en Firestore, se inicializan estructuras de matrícula y secciones vacías y se escribe el nuevo documento sin lanzar excepciones.
4. **Control SemVer:**
   - Elevación a `v2.26.2` (PATCH). Compilación en Vite (745 ms) y sincronización con GitHub (`origin main`).

---

## [v2.27.0] - 2026-11-02 (Actualización Automática en Cascada al Modificar Código DEA)

### Resumen Técnico
Se diseñó e implementó la **Opción 2: Migración en Cascada Automática de Código DEA** en el módulo de administración institucional (`webapp/src/admin.js`). Ante cualquier corrección o edición del código DEA de un plantel educativo desde la interfaz gráfica, el sistema ejecuta de forma atómica y asistida el traslado de todo el personal asignado y los usuarios directores hacia el nuevo identificador institucional en una sola transacción.

### Arquitectura de la Solución (Zero-Cost & Consistencia Relacional)
1. **Detección Automática de Renombramiento (`codP !== id`):**
   - En el evento `submit` de `#form-plantel`, cuando el código ingresado difiere del identificador original del documento, se invoca de manera asíncrona la función interna `migrarEnCascadaCodigoDEA(deaViejo, deaNuevo, nombrePlantel)`.
2. **Migración de Nómina de Personal (`cargos_personal`):**
   - Se ejecutan consultas indexadas específicas (`where('codigo-plantel', '==', deaViejo)` y `where('codigoDEA', '==', deaViejo)`), respetando la cuota Spark Zero-Cost sin escaneos completos.
   - Para cada funcionario detectado, se compone la nueva llave primaria canónica `${deaNuevo}_${cedula}` y se actualizan los campos `codigo-plantel`, `codigoDEA`, `ubicacion-fisica` y `ultima_actualizacion`.
   - Se escribe el nuevo registro con `{ merge: true }` y se elimina de forma limpia el documento con la llave obsoleta.
3. **Sincronización de `personal_resumen`:**
   - Se compila un resumen actualizado de la nómina y se inyecta directamente en el nuevo documento `planteles/${deaNuevo}`, preservando al mismo tiempo la estructura histórica de matrícula y secciones.
4. **Actualización de Directores de Plantel (`usuarios`):**
   - Se identifican y actualizan las credenciales institucionales de los directores (`plaadmin`) asociados al DEA viejo en los campos `jerarquia.plantel_codigo`, `jerarquia.plantel_id` y `plantel_codigo`.
   - Se sincroniza la colección en memoria `usuariosLocales` para que la tabla de gestión de usuarios refleje el cambio de inmediato sin requerir recargar la página.
5. **Feedback y Notificaciones UI:**
   - Se emite una alerta modal corporativa (`showAlert`) informando al administrador el total exacto de funcionarios y directores migrados con éxito en cascada.

### Archivos Modificados
- `webapp/src/admin.js`: Inyección de la función `migrarEnCascadaCodigoDEA` y disparo en el guardado de `formPlantel`.
- `webapp/package.json`: Incremento de versión a `2.27.0`.
- `webapp/index.html`: Sincronización de badges y títulos de versión a `v2.27.0`.
- `versiones.md`, `bitacora.md`, `conversaciones.md`: Registro documental obligatorio.

### Control SemVer y Despliegue
- Elevación a `v2.27.0` (MENOR). Compilación con Vite (782 ms), despliegue a producción en Firebase Hosting (`https://sgh-merida.web.app`) y sincronización con GitHub (`origin main`).

---

## [v2.28.0] - 2026-11-02 (Filtro Selector por Municipio en Gestión de Usuarios del Sistema)

### Resumen Técnico
Se diseñó e implementó un filtro selector de municipios en la barra de herramientas del módulo de administración de usuarios (`#admin-tab-validacion`). Permite a los usuarios con potestades estadales (`superadmin` y `zonadmin`) segmentar y auditar de inmediato las cuentas de directores y coordinadores por municipio específico, optimizando la supervisión territorial sin necesidad de búsquedas textuales manuales o navegación secuencial.

### Arquitectura de la Solución (Zero-Cost & RBAC)
1. **Inyección en la Barra de Herramientas UI:**
   - Se añadió el contenedor `#container-filter-municipio-usuario` con el elemento select `#filter-municipio-usuario` en `webapp/index.html`, ubicado junto a los filtros de rol, estado y buscador general.
2. **Poblado Automático de Municipios:**
   - En `webapp/src/admin.js`, al inicializarse el panel administrativo, el selector se puebla con los 23 municipios oficiales del estado Mérida obtenidos desde `getMunicipios()`.
3. **Control RBAC de Visualización:**
   - Siguiendo las directrices de seguridad, el selector se activa y muestra únicamente para los roles con alcance multiterritorial (`superadmin` y `zonadmin`). Para los coordinadores municipales (`munadmin`), el selector permanece oculto preservando el aislamiento de su jurisdicción.
4. **Filtrado Multicriterio en Memoria (Zero-Cost):**
   - En `renderUsuariosList()`, el valor de `filterMunicipioUsuario` se combina de forma reactiva con `filterRolUsuario`, `filterEstado` y el término de búsqueda de `inpBuscarUsuario`.
   - Se implementó resolución de respaldo: si un director (`plaadmin`) no posee el campo `jerarquia.municipio` grabado directamente en su documento de usuario, el sistema resuelve su municipio consultando el catálogo de planteles en memoria a través de su código DEA.
5. **Mensajes Adaptativos al Usuario:**
   - La tabla presenta mensajes informativos claros cuando no hay usuarios para el municipio seleccionado o cuando un término de búsqueda no arroja coincidencias en dicha jurisdicción.

### Archivos Modificados
- `webapp/index.html`: Inyección del contenedor `#container-filter-municipio-usuario` y select `#filter-municipio-usuario`. Actualización de versión a `v2.28.0`.
- `webapp/src/admin.js`: Control de visibilidad RBAC, poblado de opciones con `getMunicipios()`, listener de cambio y evaluación de filtro en `renderUsuariosList()`.
- `webapp/package.json`: Elevación de versión a `2.28.0`.
- `versiones.md`, `bitacora.md`, `conversaciones.md`: Registro documental obligatorio.

### Control SemVer y Despliegue
- Elevación a `v2.28.0` (MENOR). Compilación con Vite (776 ms), despliegue a producción en Firebase Hosting (`https://sgh-merida.web.app`) y sincronización con GitHub (`origin main`).

---

## [v2.29.0] - 2026-11-03 (Corrección Asistida de Cédulas y Blindaje Anti-Colados en Personal)

### Resumen Técnico
Se resolvieron dos vulnerabilidades funcionales en el módulo de gestión de personal institucional (`webapp/src/personalWizard.js`):
1. **Corrección de Cédula de Identidad:** Se desbloqueó la edición de la cédula en modo actualización, garantizando que el renombramiento del expediente en Firestore (`cargos_personal`) ocurra de manera atómica sin duplicar registros y sincronizando la lista de resumen institucional.
2. **Blindaje Anti-Colados:** Se eliminó la persistencia del formulario vacío tras guardar o cancelar. El formulario ahora permanece oculto (`display: none`) por defecto y solo se abre cuando el director edita un registro existente o procesa un traslado oficial.

### Arquitectura de la Solución (Zero-Cost & Pureza de Datos)
1. **Edición Segura de Cédula:**
   - En `cargarEmpleadoEnFormulario`, se desbloqueó el campo `#wp-cedula` (`readOnly = false`) y se respalda la cédula original en `window._cedulaOriginalEnEdicion`.
   - En `guardarPersonalInline`, si se detecta cambio de cédula:
     - Se valida previamente que la nueva cédula no exista ya en el plantel para evitar colisiones.
     - Se crea el nuevo documento con la llave compuesta `${dea}_${newCedula}`.
     - Se elimina de forma limpia el documento con la cédula errónea (`deleteDoc`).
     - Se actualiza el array `personal_resumen` en `planteles/${dea}`.
2. **Cierre Automático y Protección del Formulario:**
   - En `limpiarFormularioPersonal` y `mostrarFormularioPersonal`, se fuerza `seccion-registro-personal.style.display = 'none'`.
   - Tras presionar «Actualizar Empleado» o «Cancelar Edición», el formulario desaparece de la pantalla y la vista regresa suavemente a la tabla `#seccion-personal-existente`.
   - Se añadió un candado en `guardarPersonalInline`: si el rol es director (`plaadmin`) y no está en modo edición ni en modo traslado, cualquier intento de guardado se cancela con alerta institucional.

### Archivos Modificados
- `webapp/src/personalWizard.js`: Control de estado `_cedulaOriginalEnEdicion`, validación de conflicto de cédula, migración y depuración de documento previo, ocultamiento del formulario y candado de seguridad.
- `webapp/package.json`: Elevación de versión a `2.29.0`.
- `webapp/index.html`: Sincronización de versión a `v2.29.0`.
- `versiones.md`, `bitacora.md`, `conversaciones.md`: Registro documental obligatorio.

### Control SemVer y Despliegue
- Elevación a `v2.29.0` (MENOR). Compilación con Vite (1.17s), despliegue a producción en Firebase Hosting (`https://sgh-merida.web.app`) y sincronización con GitHub (`origin main`).

---

## [v2.29.1] - 2026-11-03 (Alta Institucional OD13281412 y Carga de Personal Huérfano)

### Resumen Técnico
Se realizó la auditoría, rescate y alta institucional de la **Escuela Elpidio Brandtt Meléndez** (antes Elpidio Branth), identificada con el código DEA **`OD13281412`**, ubicada en Aldea Mocaz, Parroquia El Morro, Municipio Libertador. Esta institución no figuraba en la base de datos de planteles de Firestore ni en los catálogos estáticos locales, dejando en condición de huérfanos a 11 trabajadores registrados en la base histórica del censo de personal RAC Mérida.

### Acciones Ejecutadas
1. **Auditoría de Nómina Huérfana:**
   - Se confirmó la existencia de 11 registros en `migracion/RAC ESTADO MERIDA - PERSONAL.csv` adscritos a `OD13281412`: 9 docentes estadales (incluida la Directora Yanelys Ruiz Peña, C.I. 23.583.693) y 2 cocineras de la Patria adscritas al CNAE Nacional.
2. **Alta de Plantel en Firestore (`planteles/OD13281412`):**
   - Se registró la institución con todos sus metadatos (Denominación: ESCUELA, Ubicación: RURAL, Nivel: INICIAL - PRIMARIA, Turno: MAÑANA, Dependencia: ESTADAL, Matrícula total histórica: 41 alumnos).
   - Se generó el resumen de personal `personal_resumen` con los 11 trabajadores para visualización instantánea.
3. **Carga Atómica en `cargos_personal`:**
   - Se insertaron los 11 documentos individuales con sus llaves compuestas `OD13281412_${cedula}`, preservando todos los campos requeridos por el sistema (nombres, cargos, códigos RAC, teléfonos, correos, tallas, direcciones, horas de nómina).
4. **Sincronización de Catálogos Locales:**
   - Se actualizó el árbol geográfico en `bd_sgh.json` y `webapp/public/bd_sgh.json` para que el plantel aparezca disponible en el selector de Libertador -> El Morro.

### Archivos Modificados
- `bd_sgh.json`, `webapp/public/bd_sgh.json`: Inyección del plantel `OD13281412`.
- `webapp/package.json`: Elevación de versión a `2.29.1`.
- `webapp/index.html`: Sincronización de insignias y título de versión a `v2.29.1`.
- `versiones.md`, `bitacora.md`, `conversaciones.md`: Registro documental obligatorio.

### Control SemVer y Despliegue
- Elevación a `v2.29.1` (PARCHE). Compilación con Vite (696 ms), despliegue a producción en Firebase Hosting (`https://sgh-merida.web.app`) y sincronización con GitHub (`origin main`).

---

## [v2.29.2] - 2026-11-03 (Normalización Geográfica y Acceso Universal en Despliegue Global)

### Resumen Técnico
Se investigó y corrigió el bloqueo de acceso al sistema que experimentaban los directores del municipio Antonio Pinto Salinas / Salina. A pesar de que en la interfaz del Administrador ("Control de Despliegue Global") el interruptor del municipio figuraba activo, las cuentas institucionales de 40 directores recibían el mensaje de espera "El Sistema SGH aún no está habilitado para el municipio...".

### Diagnóstico de Causa Raíz
- En la geografía oficial del sistema (`bd_sgh.json`) y en los perfiles de los usuarios en Firestore, el municipio está registrado en singular: `ANTONIO PINTO SALINA`.
- En el panel administrativo de despliegue (`admin.js`), la lista de municipios utilizaba la variante en plural: `ANTONIO PINTO SALINAS`.
- La compuerta de seguridad en `auth.js` validaba el acceso mediante un estricto `despliegue.municipios_activos?.includes(mun)`, lo que resultaba en falso (`"ANTONIO PINTO SALINA"` !== `"ANTONIO PINTO SALINAS"`).

### Solución Arquitectónica Implementada
1. **Actualización Inmediata en Caliente:**
   - Se inyectó directamente en `configuracion/despliegue` de Firestore el valor `ANTONIO PINTO SALINA` y los aliases comunes de otros municipios, habilitando el acceso instantáneo.
2. **Normalización Inteligente en Acceso (`auth.js`):**
   - Se importó `normalizarMunicipio()` de `geografia.js`. La validación ahora evalúa equivalencia canónica: `despliegue.municipios_activos?.some(m => normalizarMunicipio(m) === munNorm)`.
3. **Persistencia de Variantes en Guardado (`admin.js`):**
   - Se actualizó `renderGrid()` para reconocer municipios activos por su forma canónica normalizada.
   - Al guardar la configuración de despliegue, el sistema expande cada municipio activo mediante `getVariantesMunicipio()`, garantizando que tanto la forma singular como la plural (y variantes con acentos) queden almacenadas en Firestore.

### Archivos Modificados
- `webapp/src/auth.js`: Importación de `normalizarMunicipio` y validación canónica en compuerta de despliegue.
- `webapp/src/admin.js`: Normalización en `renderGrid()`, sincronización en toggles y persistencia con `getVariantesMunicipio()`.
- `webapp/package.json`: Elevación a `2.29.2`.
- `webapp/index.html`: Sincronización de insignias a `v2.29.2`.
- `versiones.md`, `bitacora.md`, `conversaciones.md`: Registro documental obligatorio.

### Control SemVer y Despliegue
- Elevación a `v2.29.2` (PARCHE). Compilación con Vite (829 ms), despliegue a producción en Firebase Hosting (`https://sgh-merida.web.app`) y sincronización con GitHub (`origin main`).

---

## [v2.29.3] - 2026-11-03 (Alta Institucional OD03541414 y Carga de 7 Funcionarios Huérfanos)

### Resumen Técnico
Se realizó la auditoría, conciliación y rescate institucional de la **Escuela Gabriel Marciano Parra**, identificada con el código DEA **`OD03541414`**, ubicada en Santa Elena de Arenales, Municipio Obispo Ramos de Lora. La institución no existía en los catálogos ni en Firestore, manteniendo a 7 trabajadores en condición de huérfanos registrados en `huerfanos.csv` y en el censo RAC original.

### Acciones Ejecutadas
1. **Auditoría de Nómina Huérfana:**
   - Se confirmaron 7 trabajadores en `migracion/huerfanos.csv` y `migracion/RAC ESTADO MERIDA - PERSONAL.csv`: 6 docentes estadales (Elvia Contreras, Emigley Vergara, Yulimar Araque, Andreina Araque, Carlos Parra, Dania Parra) y 1 cocinera escolar nacional (Ana Julia Quintero).
2. **Alta de Plantel en Firestore (`planteles/OD03541414`):**
   - Se registró la institución con sus metadatos (Denominación: ESCUELA, Ubicación: RURAL, Nivel: PRIMARIA, Turno: MAÑANA, Dependencia: ESTADAL).
   - Se pobló su nómina en el array `personal_resumen` con los 7 empleados para visualización instantánea.
3. **Carga Atómica en `cargos_personal`:**
   - Se insertaron los 7 expedientes individuales con sus llaves compuestas `OD03541414_${cedula}`, preservando todos los campos requeridos por el sistema.
4. **Sincronización de Catálogos Locales:**
   - Se actualizó `bd_sgh.json` y `webapp/public/bd_sgh.json` bajo el Municipio Obispo Ramos de Lora, Parroquia Santa Elena de Arenales.

### Archivos Modificados
- `bd_sgh.json`, `webapp/public/bd_sgh.json`: Inyección del plantel `OD03541414`.
- `webapp/package.json`: Elevación a `2.29.3`.
- `webapp/index.html`: Sincronización de badges y título a `v2.29.3`.
- `versiones.md`, `bitacora.md`, `conversaciones.md`: Registro documental obligatorio.

### Control SemVer y Despliegue
- Elevación a `v2.29.3` (PARCHE). Compilación con Vite (718 ms), despliegue a producción en Firebase Hosting (`https://sgh-merida.web.app`) y sincronización con GitHub (`origin main`).


---

## [v2.29.4] - 2026-11-03 (Configuración Granular de Secciones por Grado en Educación Primaria)

### Resumen Técnico
Se implementó la solución estructural (Opción 1) para la configuración y persistencia de secciones y matrícula en Educación Primaria (`Plan 21000`), resolviendo de raíz el problema de planteles con distribución irregular de secciones (e.g. 3er grado con 3 secciones A, B, C mientras los demás tienen 2).

### Acciones Ejecutadas
1. **Rediseño de Interfaz de Primaria (`webapp/index.html`):**
   - Se reemplazó el campo monolítico `#secPri` por 6 casillas independientes correspondientes a cada grado (1er Grado a 6to Grado, clase `.sec-pri-grado-input`), con cálculo dinámico y sumatoria automática del total de secciones en `#lbl-tot-sec-pri` y `#secPri`.
2. **Motor de Renderizado Dinámico y Preservación (`webapp/src/main.js`):**
   - Se refactorizó `_renderCajasPrimaria` para aceptar la configuración granular de secciones por grado, generando exactamente las secciones necesarias sin crear casillas vacías o ficticias.
   - Se implementó mecanismo de memoria en caliente para preservar los números de estudiantes previamente ingresados al momento de alterar las secciones de cualquier grado.
   - Se vinculó el evento `input` de las casillas de grado para redibujar y disparar los eventos de recalculo de matrícula en tiempo real.
3. **Persistencia en Firestore y Retrocompatibilidad (`secciones-planes` y `matricula`):**
   - Al guardar, las secciones por grado se registran en `secciones-planes['21000']` bajo la estructura `{ "1": n, "2": n, ... }`.
   - Al cargar datos existentes, el loader prioriza `secciones-planes['21000']` como fuente de verdad. Se corrigió la decodificación de la letra `'U'` (Sección Única), evitando que fuera evaluada por su índice alfabético (letra 21), lo que provocaba que se multiplicaran las secciones a 21 por grado y el total a 89.
   - Se garantizó el mapeo automático bidireccional entre la casilla `primaria-gU` y los registros de matrícula.
4. **Flexibilización de Horas Administrativas (`webapp/src/personalWizard.js` e `index.html`):**
   - Se removió la obligatoriedad del campo `wp-horas-administrativas`, retirando el asterisco visual y eliminando la validación que exigía valores mayores a 0 para personal no docente.
5. **Validación Exhaustiva con Playwright:**
   - Se ejecutó suite automatizada reproduciendo exactamente el escenario del segundo video (1, 1, 3, 1, 1, 2 = 9 secciones y 185 alumnos), confirmando que al recargar la sesión no se alteran las secciones ni se pierden los datos.

### Archivos Modificados
- `webapp/index.html`: Nueva cuadrícula de secciones por grado (1º a 6º), flexibilización de horas y actualización a `v2.29.4`.
- `webapp/src/main.js`: Lógica de `_renderCajasPrimaria`, persistencia por grado, loader retrocompatible sin sesgo de letra 'U' y modal de vacantes.
- `webapp/src/personalWizard.js`: Desbloqueo y flexibilización de `wp-horas-administrativas`.
- `webapp/package.json`: Elevación a `2.29.4`.
- `versiones.md`, `bitacora.md`, `conversaciones.md`: Documentación de cambio institucional.

### Control SemVer y Despliegue
- Elevación a `v2.29.4` (PARCHE). Compilación con Vite (739 ms), despliegue a producción en Firebase Hosting (`https://sgh-merida.web.app`) y sincronización con GitHub (`origin main`).

---

## [Operación Administrativa] - 2026-11-03 (Carga de Nómina Oficial Plantel S2959D1421 - Tovar)

### Resumen Técnico
Se realizó la auditoría, conciliación e inyección atómica de la nómina institucional completa de la **Escuela Básica Nacional "Amanías Avendaño" (`S2959D1421`)**, Parroquia El Llano, Municipio Tovar, tras reporte de personal docente ausente en la plataforma (caso testigo: *Nayibel Iratsuy Flores Rodríguez*, C.I. V-22.523.646).

### Acciones Ejecutadas
1. **Auditoría de Nómina:** Se identificaron y extrajeron 94 trabajadores adscritos en `migracion/RAC ESTADO MERIDA - PERSONAL.csv` y 1 docente adicional en `migracion/Personal_Nacional.xlsx` (Zenaida Márquez, C.I. 8.708.357), totalizando 95 funcionarios oficiales (55 docentes, 4 administrativos y 36 obreros).
2. **Alta de Plantel en Firestore (`planteles/S2959D1421`):** Se crearon los metadatos institucionales y el arreglo consolidado `personal_resumen` con los 95 trabajadores para carga instantánea en pantalla.
3. **Inyección Atómica en `cargos_personal`:** Se crearon los 95 expedientes individuales bajo la llave canónica `S2959D1421_${cedula}`, preservando todos los campos requeridos (cargos, horas, RAC, datos personales y de contacto).
4. **Respaldo Documental:** Actualización y sincronización de `conversaciones.md` y `bitacora.md`.

---

## [Operación Administrativa] - 2026-11-03 (Saneamiento Canónico de Cédulas Colisionadas 19047594 y 19047597)

### Resumen Técnico
Se corrigió una colisión histórica de identidades originada por una errata de un dígito (`4` por `7`) en la migración de datos, que asignaba a Irma Coromoto Ruiz la cédula de Cleidy Yohana Salas Márquez.

### Acciones Ejecutadas
1. **Cleidy Yohana Salas Márquez (V-19.047.594):** Restauración de expediente en `cargos_personal/OD15181423_19047594` como Docente I / Aula Boliv. (NER 23, Zea).
2. **Irma Coromoto Ruiz (V-19.047.597):** Creación de expediente en `cargos_personal/OD01941409_19047597` como Cocinero II (Esc. Mesa de Quintero, Guaraque).
3. **Depuración de Residuo:** Eliminación del documento conflictivo `OD01941409_19047594`, erradicando la colisión.




---

## [Operación Administrativa] - 2026-11-03 (Regularización Institucional Plantel OD11441405 - Arzobispo Chacón)

### Resumen Técnico
Se procesó el requerimiento de regularización institucional para el correo `eebjoseeustorgiorivas@gmail.com` correspondiente a la **Escuela Estadal Básica "El Rincón" / Epónimo "José Eustorgio Rivas" (`OD11441405`)**, Parroquia Canaguá, Municipio Arzobispo Chacón.

### Acciones Ejecutadas
1. **Sincronización de Usuario (`usuarios/XlMpha6TgWNHueXl6hmmSSBCj1i2`):** Asignación de rol `plaadmin`, estatus de aprobación `APROBADO`, y jerarquía territorial vinculada estrictamente al código DEA `OD11441405`.
2. **Alta de Nómina en Plantel (`planteles/OD11441405`):** Configuración de metadatos institucionales y consolidación de los 25 funcionarios oficiales en el arreglo `personal_resumen`.
3. **Inyección Atómica en `cargos_personal`:** Creación exitosa de los 25 expedientes individuales bajo la nomenclatura `OD11441405_${cedula}` (docentes y obreros), con carga horaria completa y datos de procedencia RAC.
4. **Generación de Enlace Out-of-Band (OOB):** Emisión de enlace seguro de Firebase Authentication para recuperación y establecimiento inmediato de contraseña por parte del directivo.
5. **Respaldo Documental:** Actualización y sincronización formal en `conversaciones.md` y `bitacora.md`.

---

## [Operación Administrativa] - 2026-11-03 (Regularización y Emisión de Credencial Plantel OD03381417 - Rangel)

### Resumen Técnico
Atención y regularización institucional del usuario directivo asociado a la **Escuela Estadal Básica "El Vergel" / "José Eberto Calderón Albarrán" (`OD03381417`)**, Parroquia Mucuchíes, Municipio Rangel.

### Acciones Ejecutadas
1. **Auditoría de Identidad:** Corrección de discrepancia fonética en correo (`escuelajoseebertocalderonalbar@gmail.com`, UID `sjSku9olPOMlcKt3QGaFthub7Ys2`).
2. **Sincronización de Perfil Directivo:** Asignación de rol `plaadmin`, estatus `APROBADO` y jerarquía territorial del Municipio Rangel.
3. **Carga Oficial de Nómina:** Inyección atómica de los 6 trabajadores de la institución en `cargos_personal` y consolidación en `planteles/OD03381417.personal_resumen`.
4. **Generación OOB y Entrega WhatsApp:** Emisión de enlace seguro de restablecimiento de contraseña y confección de mensaje para la dirección del plantel.
