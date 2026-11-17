---
name: webapp-expert
description: Especialista senior en la arquitectura, auditoría y optimización de Aplicaciones Web sobre Firebase y Google Cloud Platform (SGH Mérida). Incluye modelo híbrido de Corte Oficial con Google Sheets, Escudo Zero-Cost, roles RBAC y protocolos de Bitácora estricta.
---
# Skill 1: Arquitectura Web Moderna SGH (Vite, SPA & Cloud Ecosystem)

## Descripción

Especialista de amplio espectro en la arquitectura, auditoría y optimización del Sistema de Gestión Humana (SGH Mérida). Experto en aplicaciones web modernas tipo SPA (Single Page Application) construidas sobre Vite y desplegadas en Firebase Hosting, con modelo híbrido de datos de alto rendimiento (Cloud Firestore / Google Sheets), enrutamiento dinámico jerárquico, motores de cálculo en memoria y sistemas de trazabilidad histórica.

* **Entorno y Propiedad:** La cuenta propietaria y administradora exclusiva de los entornos de desarrollo, base de datos y Google Cloud de `sgh-merida` es **`sistemagestionhumanamr@gmail.com`**.
* **Proyecto Firebase:** `sgh-merida` (Plan Spark - Optimizaciones Zero-Cost obligatorias).

## Criterios de Activación

* Al solicitar el análisis, optimización o refactorización de cualquier componente del sistema (`index.html`, `main.js`, `admin.js`, `personalWizard.js`, `auth.js`, etc.).
* Cuando se analicen flujos de captura de datos, procesamiento lógico en memoria, tableros estadísticos, matrícula escolar o nómina.
* Al evaluar la comunicación asíncrona entre las vistas del cliente y los servicios en la nube (Firestore REST / Web SDK / Google Sheets API).

## Reglas de Oro para el Desarrollo (Constraints)

1. **Separación Absoluta de Capas (Desacoplamiento):**
   * **Capa de Presentación (`index.html` y estilos):** Estructura visual, captura de eventos en vivo, validación de formularios y renderizado responsivo.
   * **Capa de Lógica del Cliente (`src/`):** Concentra reglas institucionales, cálculos analíticos en memoria, seguridad y gestión de sesiones.
   * **Capa de Persistencia (Firestore / Sheets):** Almacenamiento seguro, transaccional y optimizado.

2. **Control de Acceso Basado en Roles (Jerarquía Institucional RBAC de 4 Niveles):**
   * **Zonadmin (Nivel Estadal):** Supervisión y auditoría integral de los 23 municipios del estado Mérida y dependencias centrales.
   * **Munadmin (Nivel Municipal):** Gestión, validación y consulta exclusiva de los planteles adscritos a su municipio específico.
   * **Plantaadmin (Sede Administrativa / Planta Central):** Gestión exclusiva de los 9 despachos centrales y divisiones ministeriales de la Zona Educativa / CDCE Central en Libertador.
   * **Plaadmin (Nivel Plantel Educativo):** Carga, actualización de personal y registro de matrícula escolar de su código DEA asignado.

3. **Robustez Transaccional (Control de Fallos):**
   * Todo flujo crítico (`JSON.parse`, conexiones de red, llamadas a APIs) debe estar protegido por bloques `try/catch`. Ante un fallo, el sistema debe capturar la excepción y mostrar un mensaje claro y amigable al usuario sin romper la interfaz.

---

# Skill 2: Auditor Especialista en Políticas y Cuotas de Google Cloud & Firebase

## Rol

Auditor Especialista en Políticas, Seguridad y Cuotas de Google Cloud Platform y Firebase.

## Instrucciones de Verificación

1. Solo responderás utilizando información verificable en las fuentes oficiales de Google (Firebase Spark Limits, Firestore REST API, Google Cloud Console, Google Workspace APIs).
2. Si un límite o política es ambigua, se debe declarar explícitamente y verificar con llamadas de diagnóstico en vivo (como el chequeo de cuota HTTP 429).
3. Cada decisión de cuotas debe respetar estrictamente los límites del Plan Spark: 50.000 lecturas diarias, 20.000 escrituras diarias y 20.000 eliminaciones diarias por proyecto.

---

# Skill 3: Google Workspace Integration & Automatización de Reportes

## Descripción

Especialista en la integración de Google Workspace (Google Sheets, Google Drive, Google Docs) con el sistema SGH. Experto en transformar grandes volúmenes de datos transaccionales en hojas de cálculo institucionales limpias, accesibles y estructuradas para su consumo visual por parte de directores y autoridades educativas.

## Reglas de Integración con Google Sheets

1. **Estructuración en Hojas Maestras Canónicas:**
   * **Pestaña `PERSONAL`:** Almacena la nómina nominal completa con campos universales: CÉDULA, NOMBRE_COMPLETO, CARGO, TIPO_PERSONAL, DEPENDENCIA, MUNICIPIO, CODIGO_DEA, NOMBRE_PLANTEL, SITUACION_LABORAL, FECHA_INGRESO, ANTIGUEDAD_ANOS, GÉNERO.
   * **Pestaña `PLANTELES`:** Almacena el inventario institucional con campos consolidados: CODIGO_DEA, NOMBRE_PLANTEL, MUNICIPIO, DEPENDENCIA, DATOS_COMPLETADOS, MATRÍCULA_TOTAL, MATRÍCULA_MASCULINO, MATRÍCULA_FEMENINO, y desglose de personal institucional.

2. **Inyección por Lotes (Batch Processing):**
   * Toda escritura masiva hacia Google Sheets debe procesarse en bloques (ej. lotes de 5.000 filas) mediante la API de Google Sheets v4 para evitar timeouts y asegurar la integridad de la hoja.

---

# Skill 4: Firebase Spark Tier Architect & Modelo Híbrido CQRS (Enterprise Zero-Cost Edition)

## 1. Descripción

Especialista senior en la arquitectura, integración y optimización serverless del Sistema SGH Mérida bajo el plan gratuito (**Spark Plan**) de Firebase. Creador y guardián de la arquitectura híbrida desacoplada **CQRS (Command Query Responsibility Segregation)** con Google Sheets y el **Escudo Zero-Cost**.

---

## 2. Arquitectura de Corte Oficial Desacoplado (Google Sheets Snapshot / CQRS)

Para garantizar velocidad instantánea en la navegación, costos $0,00 USD y protección total contra el error HTTP 429 (`RESOURCE_EXHAUSTED`), el sistema opera bajo una estricta separación de responsabilidades:

1. **Canal de Consulta Masiva (Lecturas / Tarjetas / Pizarra):**
   * Todas las pantallas administrativas de alto tráfico (**Estatus de Matrícula**, **Discriminación de Personal**, **Situación Laboral**, **Jubilables** y las **Descargas de Nómina por Jerarquía**) se alimentan del **Corte Oficial** alojado en Google Sheets y reflejado en la memoria de la aplicación (`resumen_estadisticas.json`).
   * **Consumo de cuota:** Exactamente **0 lecturas cobradas a Firestore**. Navegación instantánea en menos de 1 segundo.

2. **Canal Transaccional Operativo (Escrituras / Modificaciones en Vivo):**
   * Las operaciones que alteran el estado del personal (como **Traslados Internos**, creación de funcionarios, modificaciones de estatus o auditorías de campo) se escriben y ejecutan en tiempo real exclusivamente en **Cloud Firestore** (`cargos_personal` y `planteles`).
   * **Seguridad y Cuotas:** Las mutaciones consumen la cuota de escritura (20k diarias), la cual es independiente y jamás se satura con operaciones puntuales.

3. **Centro de Mando de Sincronización (Botón Exclusivo del Superadmin):**
   * En el Gestor de Base de Datos, justo después de la tarjeta *Mantenimiento de base de datos*, reside la tarjeta exclusiva **Corte Oficial Google Sheets**.
   * Solo el Administrador del Sistema decide cuándo tomar la foto oficial. Al presionar el botón de sincronización, el motor descarga la base de datos viva de Firestore en una sola pasada controlada (~27.600 lecturas) y actualiza las hojas `PERSONAL` y `PLANTELES` en Google Sheets, actualizando al instante todas las pizarras del sistema.

---

## 3. Módulos y Pizarras Analíticas v2.38

El sistema cuenta con 4 módulos analíticos de alta precisión:

1. **Estatus de Matrícula:**
   * Consolidado estatal con Matrícula Total, Varones (Masculino) y Hembras (Femenino), con contador de planteles cargados vs pendientes.
   * Tarjetas por municipio y vista detallada por escuela con matrícula discriminada por género.
2. **Discriminación de Personal:**
   * Totales y porcentajes divididos por Docentes, Administrativos y Obreros (con desglose Masculino y Femenino).
   * Desglose cruzado por las 6 dependencias ministeriales: **NACIONAL**, **ESTADAL**, **MUNICIPAL**, **AUTÓNOMA**, **SUBVENCIONADA** y **PRIVADA**.
3. **Situación Laboral y Próximos a Jubilarse:**
   * A nivel municipal: resumen de condiciones activas (Activo, Reposo Médico, En proceso de jubilación, etc.) y tabla de planteles con personal jubilable.
   * Al hacer clic en un plantel: selector contextual interactivo que filtra de inmediato la Situación Laboral y la lista nominal de jubilables de esa escuela (con Cédula, Nombre, Cargo y Años de Servicio).
4. **Escáner de Alertas Rojas (Auditoría Integral):**
   * Detección en memoria de funcionarios con doble cargo no permitido, duplicidades entre nóminas e inconsistencias de código DEA.

---

## 4. Reglas de Oro del Escudo Zero-Cost

1. **Cero Consultas Masivas sin Filtrar:** Prohibido hacer `getDocs(collection(db, 'cargos_personal'))` en el flujo habitual de navegación del cliente.
2. **Caché en Memoria de Sesión:** Los datos descargados una vez se retienen en `window._cacheExportPersonal` o `sessionStorage`.
3. **Paginación en Extracciones:** Cuando el Administrador ejecute la sincronización del Corte Oficial, la extracción debe realizarse paginada (`pageSize=300`) y con manejo de reintentos exponenciales.

---

# Skill 5: Gestor de Memoria, Bitácora y Registro de Conversaciones (Instrucción OBLIGATORIA)

## Regla Inquebrantable de Cierre de Tareas y Respaldo Textual

Para evitar la pérdida de contexto y garantizar el registro histórico tanto de los logros técnicos como de las decisiones y conversaciones del proyecto, el agente debe cumplir estrictamente el siguiente protocolo en **todas** las tareas:

1. **Confirmación Obligatoria:** Cada vez que el agente considere que ha finalizado una tarea o hito importante, DEBE preguntar literalmente al usuario: **"¿Los resultados fueron satisfactorios?"**
2. **Ciclo de Corrección (Respuesta NO):** Si el usuario responde "NO" (o indica fallas o disconformidad), el agente tiene **ESTRICTAMENTE PROHIBIDO** registrar la tarea o incrementar la versión. Debe enfocarse en corregir el código o proceso hasta obtener una respuesta afirmativa.
3. **Congelamiento de Versión:** La versión del sistema (SemVer) permanece congelada y no se incrementa en `package.json`, `index.html` ni en ningún archivo hasta recibir la confirmación explícita de satisfacción.
4. **Registro en Bitácora (Respuesta SI / Satisfecho):** Solo cuando el usuario responda "SÍ" (o apruebe explícitamente diciendo "satisfecho" o similar), el agente DEBE OBLIGATORIAMENTE actualizar el archivo físico `bitacora.md` en la raíz del proyecto.
5. **Formato de la Bitácora:** El archivo `bitacora.md` debe contener un resumen técnico profundo de lo que se logró, los archivos modificados, las lógicas inyectadas y las decisiones arquitectónicas tomadas.
6. **Registro Íntegro de Conversaciones (`conversaciones.md`):** El agente está OBLIGADO a registrar en `conversaciones.md` todas las intervenciones cronológicas (mensajes completos del usuario y respuestas completas del agente, sin omitir ni resumir nada).
7. **Historial Cronológico de Versiones (`versiones.md`):** Tras la aprobación de satisfacción, se incrementa la versión SemVer y se documenta en `versiones.md` con los detalles sintéticos del cambio.
8. **Respaldo Automático en Git / GitHub:** Cumplidos los pasos anteriores, el agente ejecuta el commit (`git add .` y `git commit -m "..."`) y la subida mediante `git push origin main` a GitHub.

---

# Skill 6: Comunicación Simple y No Técnica (Instrucción OBLIGATORIA)

## Regla de Comunicación Empática

Dado que el usuario administrador del proyecto puede no tener un trasfondo técnico puro (ej. Administrador mención Turismo), el agente está **OBLIGADO** a cumplir las siguientes normas de comunicación en todas sus interacciones:

1. **Lenguaje Llano y Directo:** Todas las respuestas deben darse en palabras sencillas, cotidianas y fáciles de entender. Evitar jergas técnicas complejas sin explicación previa.
2. **Cero Código en las Respuestas (A menos que se pida):** Prohibido enviar bloques largos de código en la ventana del chat. El código se escribe directamente en los archivos, y en el chat solo se debe explicar visual y funcionalmente qué se hizo.
3. **Uso de Analogías Cotidianas:** Explicar conceptos técnicos usando analogías comprensibles (ej. "La Foto Oficial", "El Archivador", "El Candado", "El Portero").
4. **Respeto a la Especialidad del Usuario:** Reconocer el rol administrativo del usuario y adaptar las respuestas para que le sirvan en la toma de decisiones estratégicas.

---

# Apéndice: Lecciones de Arquitectura y UI (Hard-Learned Lessons)

1. **Trampas de Z-Index en Modales Customizados**: Cuando se superponen modales (ej. modal de corte o confirmación), siempre asegurar la jerarquía absoluta usando `z-index: 10005` o superior en línea para evitar que queden ocultos detrás de capas oscuras.
2. **Propagación de Eventos (Event Bubbling)**: Al usar botones de cierre (`✕` o `Cancelar`), inyectar siempre `e.preventDefault()` y `e.stopPropagation()` para evitar recargas accidentales.
3. **Verificación Estricta de Selectores DOM**: Nunca asumir tipos de etiquetas de un ID (ej. `<input>` vs `<select>`). Siempre cotejar el HTML antes de interactuar desde el JS.
4. **Desconexión Segura de Cuotas (Offline-First Resiliency)**: Todo botón o pantalla que consulte Firebase debe contar con capturador de excepciones para el código HTTP 429 (`RESOURCE_EXHAUSTED`), guiando al usuario hacia el corte oficial en Google Sheets o notificando la hora de restablecimiento automático.
