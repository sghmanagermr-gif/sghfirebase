# Historial de Versiones - SGH Firebase (Zero-Cost)

Este archivo constituye el registro cronológico y estructurado de todas las versiones del sistema SGH, detallando sintéticamente las características, mejoras, correcciones y novedades introducidas en cada entrega institucional.

---

### v2.27.0 (2 de Noviembre de 2026)

- **Migración Automática en Cascada al Modificar Código DEA de un Plantel (Opción 2):**
  - **Requerimiento y Diagnóstico Institucional:**
    - Si un administrador modifica el código DEA de una institución educativa desde el modal de edición (`ModalPlantel`) debido a una corrección de código erróneo, los funcionarios registrados previamente en `cargos_personal` y los directores asignados en `usuarios` quedaban desvinculados ("referencia rota"), requiriendo migraciones manuales individuales.
  - **Solución Implementada:**
    - Se incorporó la función institucional `migrarEnCascadaCodigoDEA(deaViejo, deaNuevo, nombrePlantel)` en `webapp/src/admin.js`.
    - **Nómina de Personal (`cargos_personal`):** Al detectar `codP !== id`, el sistema busca de manera indexada todos los funcionarios adscritos al DEA anterior (tanto por `codigo-plantel` como por `codigoDEA`). Genera sus nuevos expedientes con la llave compuesta actualizada `${deaNuevo}_${cedula}`, actualiza su ubicación física y elimina de forma limpia el documento anterior.
    - **Resumen Institucional (`personal_resumen`):** Sincroniza en un solo movimiento el array `personal_resumen` en el documento del nuevo plantel en Firestore para que la visualización sea inmediata.
    - **Directores Institucionales (`usuarios`):** Localiza los usuarios directores vinculados al DEA anterior (`jerarquia.plantel_codigo` y `plantel_codigo`) y actualiza su asignación al nuevo código, sincronizando además la memoria de la tabla de usuarios en pantalla sin recargar.
    - **Alerta de Confirmación:** Tras completar la operación, el panel administrativo presenta un diálogo detallando exactamente cuántos funcionarios de nómina y cuántos directores fueron migrados en cascada.
  - **Despliegue y SemVer:** Versión MENOR `v2.27.0`. Compilada en Vite (782 ms) y sincronizada con GitHub (`origin main`).

---

### v2.26.2 (2 de Noviembre de 2026)

- **Hotfix: Soporte Seguro de Fusión (`{ merge: true }`) en Edición de Planteles:**
  - **Diagnóstico:**
    - Al intentar guardar cambios en la ficha institucional de un plantel desde el panel administrativo (`ModalPlantel`), el sistema emitía el error: `FirebaseError: Function setDoc() called with invalid data. deleteField() cannot be used with set() unless you pass {merge:true} (found in field planes_estudio in document planteles/...)`.
    - Esto ocurría porque al editar un plantel, el sistema limpiaba los campos obsoletos (`planes_estudio`, `ubicacion`, `turno`) mediante la instrucción `deleteField()`, pero la invocación a `safeSetDoc()` no incluía la opción `{ merge: true }`, violando las restricciones del SDK de Firestore.
  - **Solución Implementada:**
    - Se incorporó la opción `{ merge: true }` en todas las ramas de guardado (`safeSetDoc`) dentro de `admin.js`.
    - Se blindó la actualización de documentos (`safeUpdateDoc`) con bloque de contingencia: si el documento aún no existía físicamente en Firestore (proveniente únicamente del catálogo local), se crea automáticamente con `{ merge: true }` sin arrojar error.
    - Se garantizó la preservación de matrícula y secciones si se modifica o renombra el código DEA de la institución.
  - **Despliegue y SemVer:** Versión PATCH `v2.26.2`. Compilada en Vite (745 ms) y sincronizada con GitHub (`origin main`).

---

### v2.26.1 (2 de Noviembre de 2026)

- **Alta Institucional y Carga de Nóminas para Planteles Rurales de Piñango (Municipio Miranda):**
  - **Diagnóstico y Requerimiento:**
    - Se solicitó auditar si existía personal huérfano para tres planteles: `OD13071412`, `OD13471413` y `OD00901413`.
    - `OD13071412` (Aura Marina Saavedra de Torres, Jacinto Plaza - Libertador): De dependencia municipal, no cuenta con personal en las nóminas centralizadas del RAC ni en la lista de huérfanos (0 registros).
    - `OD13471413` (Escuela Estadal José Audelino Delgado Castellano, Piñango - Miranda) y `OD00901413` (Francisca Sánchez de Palmi, Piñango - Miranda): Resultaron **POSITIVOS**, figurando en los registros maestros del RAC con 4 y 5 trabajadores respectivamente, compartiendo la misma Directora Encargada: Prof. Carmen Teresa Araujo Delgado (V-15920318).
  - **Acciones y Carga en Base de Datos Realizadas:**
    - **Alta de Planteles en Firestore (`planteles/`):** Se crearon los documentos oficiales para ambos planteles en Firestore (`OD13471413` y `OD00901413`) con su información geográfica (Piñango, Miranda, Rural), dependencias (Estadal), códigos estadísticos (`141026` y `141027`), planes de estudio de Primaria (`21000`) y matrícula histórica registrada (10 y 9 alumnos respectivamente).
    - **Inyección de 9 Registros de Nómina en `cargos_personal`:** Se cargaron los 9 expedientes con sus datos completos de filiación, contacto, formación, cargo, código RAC, carga horaria, turnos y ubicación administrativa:
      - Para `OD13471413`: V-15920318 (Carmen Araujo, Directora/Docente IV), V-23725365 (María Paredez, Docente Contratada), V-20848531 (Mary Paredes, Cocinero I/Obrero), V-20848528 (Francis Lobo, Cocinero I/Obrero).
      - Para `OD00901413`: V-15920318 (Carmen Araujo, Directora/Docente IV), V-20848536 (Yoselin Ramírez, Docente III), V-20435039 (Sandra Paredes, Docente), V-13391614 (Arminda Lobo, Cocinero I/Obrero), V-18310359 (Grecia Ramírez, Cocinero I/Obrero).
    - **Sincronización de `personal_resumen`:** Ambos planteles quedaron precargados con su array de `personal_resumen` para que al ingresar la directora encuentre su nómina disponible de inmediato.
    - **Actualización de Catálogos Locales:** Sincronizados `bd_sgh.json` y `webapp/public/bd_sgh.json`.
  - **Despliegue y SemVer:** Versión PATCH `v2.26.1`. Compilado en Vite (1.30s) y sincronizado con GitHub (`origin main`).

---

### v2.26.0 (2 de Noviembre de 2026)

- **Soporte Institucional Multi-Plantel para Directores (`plaadmin`) con Cédula Compartida:**
  - **Diagnóstico y Requerimiento:**
    - Se identificaron casos reales de directores encargados o directores de circuitos escolares y NER en el estado Mérida con 2, 5 o más de 10 planteles a su cargo. Al intentar registrar cada plantel con su correo institucional y su código DEA respectivo, el sistema bloqueaba el registro advirtiendo que la cédula ya existía en la base de datos de usuarios.
  - **Solución Implementada (Opción 1 Aprobada):**
    - Se flexibilizó la barrera institucional de cédula única para el rol `plaadmin`, permitiendo que una misma persona (misma cédula) registre múltiples planteles educativos, siempre y cuando cada registro corresponda a un código DEA diferente.
    - Se mantuvo intacto el candado de no duplicidad de plantel (un mismo código DEA jamás podrá tener dos directores activos o en validación) y el candado de un único coordinador por municipio (`munadmin`).
    - En caso de que el mismo director intente registrarse dos veces para el mismo código DEA, el sistema le notifica amigablemente que ya posee cuenta para esa institución específica.
  - **Despliegue y SemVer:** Versión MENOR `v2.26.0` compilada en Vite (708 ms) y desplegada a producción en Firebase Hosting (`https://sgh-merida.web.app`).

---

### v2.25.1 (2 de Noviembre de 2026)

- **Corrección en Cálculo y Persistencia de Matrícula Total (Maternal e Inicial):**
  - **Diagnóstico (Evidencia en Video):**
    - En el formulario del director, al ingresar matrícula en Educación Inicial (Maternal + Preescolar), el subtotal visual de la sección "Total Inicial" sumaba correctamente, pero al presionar *"Guardar Datos y Continuar"*, el campo superior *"Matrícula (Total Calculada)"* (`inp-matricula-total`) quedaba con un valor inferior o congelado, omitiendo a los alumnos registrados en Maternal.
  - **Causa Raíz:**
    - En `webapp/src/main.js`, durante el empaquetado del guardado, el bloque de Maternal se guardaba en el documento como `matricula.basica['20000'].materna`, mientras que la función encargada de sumar el total general (`sumFem + sumMas`) consultaba la clave en inglés `matricula.basica['20000'].maternal?.['total-mat-fem']`. Debido a la discrepancia de nombres (`materna` vs `maternal`), la matrícula de Maternal se evaluaba como 0 en la sumatoria global, guardando en Firestore un `total-gen` y `matricula-total` truncado que luego sobreescribía la interfaz.
  - **Solución Técnica Implementada:**
    - Se implementó soporte dual y retrocompatible (`maternal || materna`) tanto para la lectura, la persistencia en Firestore (`matricula.basica['20000']` y `secciones-planes['20000']`) como para la suma general de género (`sumFem` y `sumMas`).
    - Se sincronizó la sumatoria en vivo del formulario (`plantel-form`) para que `matTotal` sume de forma directa e incontestable los subtotales de cada nivel activo (`totIni + totPri + sumMg + sumMt + totEsp + totAdu`), garantizando paridad matemática exacta en todo momento.
    - Se configuraron cabeceras estrictas de anti-caché en `firebase.json` (`Cache-Control: no-cache, no-store, must-revalidate`) para forzar a los navegadores móviles a descargar siempre la última versión de la aplicación sin retener bundles obsoletos en memoria.
  - **Despliegue y SemVer:** Versión PATCH `v2.25.1` compilada en Vite (687 ms) y desplegada a producción en Firebase Hosting (`https://sgh-merida.web.app`).

---

### v2.25.0 (2 de Noviembre de 2026)

- **Escuela Laboratorio Ficticia (`DEMO140000`) y Usuario Director Sandbox para Soporte en Tiempo Real:**
  - **Diagnóstico y Requerimiento:**
    - El Desarrollador y Administrador requirió contar con un entorno de pruebas idéntico a la pantalla del director (`plaadmin`) para replicar en tiempo real dudas, procedimientos y asistencias a directores por WhatsApp sin contaminar ni alterar las métricas oficiales ni las nóminas de Mérida.
  - **Arquitectura de Blindaje y Sandbox Creado:**
    - **Plantel Ficticio en Firestore (`planteles/DEMO140000`):** Creado con código DEA `DEMO140000`, Epónimo: *"PLANTEL EXPERIMENTAL PILOTO SGH"*, Parroquia Sagrario, Municipio Libertador, habilitado con planes de Inicial (20000), Primaria (21000), Media General (31059) y Media Técnica (31060), identificado con bandera `es_demo: true`.
    - **Usuario Director Aprobado en Auth y Firestore:** Creado con UID `1P9RI6NwNCQWFlQJ4VLstAgwxix1`, correo `alfonsozere@gmail.com`, clave configurada, correo marcado como verificado administrativamente (0 consumo de cuota Spark) y rol `plaadmin` vinculado a `DEMO140000`.
    - **Inyección de Personal Demo Multicargo (5 Registros):** Se cargó en `cargos_personal` y `personal_resumen` una nómina de prueba realista: Docente de Aula Primaria (V-99000001, 1121DI), Docente de Media General por Horas (V-99000002, 1125DB), Secretaria Administrativa (V-99000003, 5022N), Obrero de Mantenimiento (V-99000004, 8036N) y Cocinera de la Patria CNAE (V-99000005, 8991N).
    - **Matrícula Piloto y Desbloqueo Automático:** Se configuró una matrícula muestra de 30 estudiantes (Grado 1A) con `datos_completados: true` para desbloquear la tabla de personal inmediatamente sin obligar al director a completar el Paso 1.
    - **Escudo Protector en Métricas y Exportaciones:**
      - Se blindó la función de auditoría de matrícula (`verificarPlantelTieneMatricula`) para retornar siempre `{ tiene: false, total: 0 }` ante planteles demo.
      - Se excluyeron automáticamente de las exportaciones a Excel tanto de planteles (`ejecutarExportacionPlantelesExcel`) como de nóminas (`ejecutarExportacionNominaExcel`).
      - Se ocultó de la vista de coordinadores municipales (`munadmin`) para evitar confusiones en Libertador, y se identificó visualmente en el panel de superadmin con distintivo `🧪 Laboratorio DEMO`.
  - **Herramienta Administrativa para Recuperación de Contraseñas Out-of-Band:**
    - Se implementó script de soporte (`scratch/generar_enlace_recuperacion.js`) que genera enlaces oficiales de restablecimiento de contraseña vía Identity Toolkit REST (`returnOobLink: true`), mitigando el error 429 por agotamiento de cuota diaria de correos salientes del plan Spark.
  - **Despliegue y SemVer:** Versión MENOR `v2.25.0` compilada en Vite (734 ms) y desplegada a producción en Firebase Hosting (`https://sgh-merida.web.app`).

---

### v2.24.1 (2 de Noviembre de 2026)

- **Corrección de Referencia y Garantía de Plenos Privilegios para Superadmin en Edición de Planteles:**
  - **Diagnóstico del Inconveniente (Causa Raíz):**
    - El Administrador (rol `superadmin`) reportó que al presionar el botón de editar en la tabla de planteles del panel administrativo no abría el formulario y la consola arrojaba: `Uncaught ReferenceError: isMunAdmin is not defined at wt (index-CGSd-a7b.js:434)`.
    - La variable `isMunAdmin` (así como `isSuperAdmin` y `isZonAdmin`) había sido declarada únicamente dentro de la función local `configurarInterfazPorRol()`, quedando fuera de alcance léxico (scope) para la función `openPlantelModal` y el listener de guardado `formPlantel.addEventListener('submit')`.
  - **Solución Técnica Implementada:**
    - Se declararon `isMunAdmin`, `isZonAdmin` e `isSuperAdmin` al nivel principal de `initAdminDashboard` en `webapp/src/admin.js`, garantizando cobertura universal para todas las subfunciones y modales del panel.
    - Se reforzó la definición local explícita en `openPlantelModal` y en el evento de guardado del formulario de planteles.
    - Se ratificaron los privilegios plenos y sin restricciones del rol `superadmin` (`superadmin` y `admin`), asegurando la capacidad irrestricta de edición, creación, cambio de dependencia/parroquia/municipio y eliminación de planteles en todo el estado Mérida.
  - **Despliegue y SemVer:** Actualización de versión a `v2.24.1` (PARCHE) en `package.json` e `index.html`. Compilado en Vite (813 ms) y desplegado exitosamente en Firebase Hosting (`https://sgh-merida.web.app`).

---

### v2.24.0 (2 de Noviembre de 2026)

- **Barrera Institucional Anti-Duplicados para Directores de Plantel (`plaadmin`) y Validación de Cédula Única:**
  - **Diagnóstico del Inconveniente (Causa Raíz):**
    - El Administrador reportó con captura de pantalla (`media_1793632335873_1a57c7c6.png`) la existencia de dos cuentas aprobadas con roles de Director (`plaadmin`) pertenecientes al mismo docente (Prof. René Maximiliano Guillén González, C.I. 9397736) asignadas al mismo código DEA (`OD03971408`), creadas con dos correos distintos (`augustoescuela47@gmail.com` y `escuelacarlos74@gmail.com`).
    - Se identificó que la barrera anti-duplicados previa protegía exclusivamente a los Coordinadores Municipales (`munadmin`), permitiendo que el formulario de registro y la validación en panel dejaran pasar múltiples directores para un mismo plantel.
  - **Soluciones y Blindajes Institucionales Implementados:**
    - **Barrera en Registro Público (`#register-form`):** Al intentar registrarse como `plaadmin`, el sistema verifica si el código DEA ya cuenta con un director activo (`APROBADO` o `PENDIENTE`). Si ya existe un titular, la credencial temporal de Auth se destruye de inmediato (`cred.user.delete()`) y se notifica al usuario con el nombre y correo del titular actual.
    - **Barrera de Cédula Única en Registro:** Se implementó una verificación indexada para impedir que una misma cédula de identidad se registre con correos diferentes, orientando al usuario a recuperar su clave en lugar de duplicar cuentas.
    - **Barrera en Auto-Completado de Ficha (`initRecuperacionPerfil` y auto-recuperación):** Si un usuario completa su perfil en la sala de espera, tampoco puede seleccionar un código DEA que ya tenga director asignado.
    - **Barrera en Aprobación Administrativa (`btn-aprobar`):** Antes de autorizar a un director, el panel valida en memoria local (`usuariosLocales`, 0 lecturas) si ya existe otro director en estatus `APROBADO` para ese DEA, impidiendo aprobaciones duplicadas y alertando al administrador.
    - **Barrera en Edición de Rol / Datos (`modal-editar-rol-usuario`):** Al reasignar rol o DEA a un usuario, se comprueba que el plantel de destino no esté ocupado por otro directivo activo.
    - **Insignias Visuales de Alerta en Tabla de Usuarios:**
      - Si una solicitud pendiente corresponde a un DEA ya ocupado: `⚠️ Plantel ya tiene director activo` (ámbar).
      - Si existen cuentas duplicadas ya aprobadas históricamente para el mismo DEA: `⚠️ Cuenta duplicada para el mismo DEA` (rojo).
    - **Nota Orientadora en Registro:** En el selector de código DEA del formulario se incorporó: *"ℹ️ Solo se admite un Director activo por código DEA"*.
  - **Despliegue Inmediato:** Compilado limpio en Vite (933 ms) y publicado en Firebase Hosting (`https://sgh-merida.web.app`).

---

### v2.23.3 (2 de Noviembre de 2026)

- **Alta Institucional y Vinculación Operativa del Plantel `OD12551412` (Centro de Rehabilitación del Lenguaje):**
  - **Diagnóstico del Inconveniente (Causa Raíz):**
    - Durante la auditoría de registros huérfanos se evidenció que el Centro de Rehabilitación de Lenguaje (DEA: `OD12551412`, Parroquia Mariano Picón Salas, Municipio Libertador) no se encontraba en la colección activa de `planteles` en Cloud Firestore debido a una omisión en los archivos CSV suministrados durante la migración original de planteles.
    - Como consecuencia, el Director Encargado (**Prof. Deifilio Contreras Rivas, C.I. 11.461.168**) no podía registrarse como usuario del sistema (`plaadmin`), recibiendo el error: *"El código DEA no existe en la base de datos institucional"*, y los 20 trabajadores adscritos a dicha institución en la colección `cargos_personal` permanecían sin plantel padre asociado.
  - **Solución Técnica y Alta de Registro:**
    - Se extrajo la ficha completa del archivo maestro institucional (`bd_sgh.json`):
      - **Código DEA:** `OD12551412`
      - **Nombre Nominal:** CENTRO DE REHABILITACION DE LENGUAJE
      - **Nuevo Epónimo:** CENTRO DE REHABILITACION DEL LENGUAJE
      - **Denominación:** CENTRO DE REHABILITACION DE LENGUAJE
      - **Dependencia:** NACIONAL (Cód. Dependencia: `6490063`)
      - **Código Estadístico:** `141676`
      - **Municipio:** LIBERTADOR
      - **Parroquia:** MARIANO PICON SALAS
      - **Modalidad:** EDUCACION ESPECIAL
      - **Turno:** DOBLE TURNO
      - **Planes de Estudio / Matrícula / Secciones:** Inicializados para auditoría.
    - Se inyectó el documento en Firestore mediante la API REST autorizada por credenciales administrativas, consumiendo exactamente **1 escritura y 0 lecturas**, preservando de forma absoluta el principio **Zero-Cost**.
    - El Director Encargado ya puede registrarse de inmediato e iniciar la carga de información en la jornada institucional, quedando enlazado automáticamente con los 20 trabajadores de su nómina.
  - **Control SemVer y Despliegue:**
    - Incremento a **`v2.23.3`** en `package.json` e `index.html`.
    - Compilación limpia en Vite (1.18s) y despliegue a Firebase Hosting (`https://sgh-merida.web.app`).

---

### v2.23.2 (31 de Octubre de 2026)

- **Consolidación Integral de Exportación de Planteles a Excel (.xlsx) y Garantía de Consumo Cero (Zero-Cost):**
  - **Diagnóstico y Corrección de Enlace Operativo:**
    - Se identificó que tras el parche de contención de lecturas de la versión v2.23.1, la definición funcional de `abrirModalSeleccionarPlanteles` y `ejecutarExportacionPlantelesExcel` en `webapp/src/admin.js` requería inyección directa y enlace global.
    - Se inyectó la lógica completa conectada a SheetJS para `abrirModalSeleccionarPlanteles()` y `ejecutarExportacionPlantelesExcel()`, garantizando que al presionar el botón institucional de descarga de planteles (`#btn-descargar-planteles` o `#btn-sidebar-descargar-planteles`) se despliegue fluidamente el modal y se procese el archivo binario en memoria.
  - **Blindaje de Consumo de Cuota (0 Lecturas):**
    - La generación del archivo Excel se realiza al 100% en el procesador del dispositivo cliente (PC o móvil) tomando los datos ya residentes en la memoria RAM de la sesión (`currentPlanteles` o `sessionStorage`).
    - Incluso ante descargas masivas o simultáneas por decenas de coordinadores en pocos segundos, el impacto en la cuota de Firestore es exactamente **0 lecturas**, protegiendo la permanencia indefinida en el plan gratuito Spark de Firebase.
  - **Despliegue Inmediato:** Compilado limpio en Vite (1.29s) y desplegado exitosamente a Firebase Hosting (`https://sgh-merida.web.app`).

---

### v2.23.1 (31 de Octubre de 2026)

- **Blindaje Estricto Zero-Cost y Eliminación de Fuga de Lecturas en Usuarios y Planteles:**
  - **Diagnóstico del Inconveniente (Causa Raíz):**
    - El Administrador evidenció mediante métricas de la consola de Firebase que se alcanzaron 55.000 operaciones de lectura en 24 horas a pesar de haberse registrado únicamente varias decenas de directores.
    - Se identificó la causa raíz: la tabla de usuarios del panel administrativo mantenía un canal en tiempo real continuo (`onSnapshot`) abierto sobre la colección completa `usuarios`. Con 16 conexiones concurrentes y la inestabilidad de la red móvil en Venezuela (desconexiones y reconexiones frecuentes), cada parpadeo de señal re-descargaba la colección íntegra para cada usuario conectado. Además, los coordinadores municipales descargaban a los usuarios de todo el estado en lugar de consultar solo a los de su municipio.
  - **Soluciones y Blindajes Implementados:**
    - **Desactivación de Escucha Continua (`onSnapshot`):** Se reemplazó el listener en vivo por consultas acotadas bajo demanda (`getDocs`), eliminando el consumo fantasma de lecturas por reconexión.
    - **Filtro Indexado por Municipio para Coordinadores (`munadmin`):** El coordinador municipal ahora consulta exclusivamente a los directores (`plaadmin`) adscritos a su territorio municipal mediante cláusulas `where` directas en Firestore, reduciendo en más del 95% el volumen de documentos transferidos.
    - **Actualización Directa en Memoria (Zero-Cost):** Al aprobar (`btn-aprobar`), rechazar o eliminar (`btn-eliminar`) un usuario, la actualización se refleja de inmediato en la memoria local (`usuariosLocales`) y en los contadores del DOM sin realizar lecturas adicionales a la base de datos (0 lecturas).
    - **Botón Institucional de Refresco (`#btn-refrescar-usuarios`):** Se incorporó el botón **🔄 Refrescar** junto a los filtros de búsqueda para que el administrador pueda sincronizar nuevos registros de forma voluntaria y controlada.
    - **Caché Estadal de Planteles en Sesión:** Se blindó la consulta de los 1.159 planteles para Superadmin y Zonadmin mediante `sessionStorage` (`sgh_cache_planteles_ESTADAL`), impidiendo que recargas de página vuelvan a consumir más de un millar de lecturas.
  - **Despliegue Inmediato:** Compilado limpio en Vite (708 ms) y publicado en Firebase Hosting (`https://sgh-merida.web.app`).

---

### v2.23.0 (31 de Octubre de 2026)

- **Descarga y Exportación Institucional de Catálogo de Planteles a Excel (.xlsx) para Superadmin, Zonadmin y Munadmin:**
  - **Objetivo del Requerimiento:**
    - Incorporar un botón interactivo para descargar la data completa de planteles desde la colección `planteles` de Firestore, habilitado para los roles `superadmin`, `zonadmin` y `munadmin`.
  - **Características y Mejoras Implementadas:**
    - **Botón en Pestaña de Planteles (`admin-tab-planteles`):**
      - Se añadió el botón `🏫 Descargar Planteles (.xlsx)` (`#btn-descargar-planteles`) con estilo institucional azul (#0284c7), ubicado en la barra de acciones junto a Nómina y Nuevo Plantel, adaptándose fluidamente tanto a pantallas de escritorio como a celulares.
    - **Acceso Directo en Menú Lateral (`#admin-sidebar`):**
      - Se integró la opción `🏫 Descargar Planteles` (`#btn-sidebar-descargar-planteles`) en el acordeón *Gestor de BD*, permitiendo a los usuarios exportar el catálogo desde cualquier sección del panel sin tener que ir previamente a la tabla.
    - **Modal de Selección de Ámbito Territorial (`#modal-seleccionar-ambito-planteles`):**
      - **Superadmin y Zonadmin:** Permite seleccionar entre exportar el consolidado estatal completo (1.159 planteles) o la data de cualquiera de los 23 municipios de Mérida. Si el usuario realizó una búsqueda por texto en la tabla, el modal ofrece de forma inteligente descargar los resultados filtrados en pantalla.
      - **Coordinadores Municipales (`munadmin`):** Permite exportar la totalidad de escuelas de su municipio o filtrar por una parroquia en específico.
    - **Estructura Enriquecida del Archivo Excel (.xlsx):**
      - El archivo generado incluye 20 columnas institucionales: Código DEA, Nuevo Epónimo, Nombre Nominal, Denominación, Dependencia, Código de Dependencia, Código Estadístico, Estado, Municipio, Parroquia, Nivel Educativo, Modalidad, Turno, Ubicación Geográfica, Planes de Estudio asociados, Estatus de Matrícula (Declarada/Pendiente), Total de Matrícula de Estudiantes, Total de Secciones declaradas, Metros Cuadrados y Observaciones.
      - Auto-ajuste de anchos de columna para una visualización ejecutiva óptima y nombres de archivo dinámicos según el ámbito territorial y la fecha.
    - **Optimización Zero-Cost (Spark):**
      - La exportación se procesa en el cliente utilizando los datos ya cargados en la memoria de la sesión (`currentPlanteles`), generando el libro Excel en menos de un segundo con la librería SheetJS sin lecturas repetidas ni consumo de cuota de Firestore.
  - **Despliegue Inmediato:** Compilado limpio en Vite (685 ms) y publicado en Firebase Hosting (`https://sgh-merida.web.app`).

---

### v2.22.2 (31 de Octubre de 2026)

- **Optimización Estética y Alineación Milimétrica del Botón de Limpieza (`✕`) en el Buscador de Usuarios:**
  - **Diagnóstico del Inconveniente (Causa Raíz):**
    - El Administrador reportó con captura de pantalla que al escribir en el campo *Buscar Usuario* (`#inp-buscar-usuario`), el botón con la `✕` quedaba desalineado y antiestético en medio del campo de texto, interfiriendo visualmente con la lectura de los caracteres escritos tanto en PC como en dispositivos móviles.
    - La causa raíz: las reglas globales de CSS aplicaban `width: 100%`, `padding: 14px 24px` y centrado de texto a los elementos `<button>`, lo que ocasionaba que al desplegarse con `display: block`, el botón abarcara todo el ancho del contenedor y la `✕` quedara flotando en el centro geométrico del input en lugar de ubicarse en el extremo derecho.
  - **Soluciones y Mejoras Implementadas:**
    - **Dimensionamiento Fijo y Estilo Circular Moderno:** Se blindó el botón `#btn-limpiar-buscar-usuario` con dimensiones estrictas (`22px × 22px`), forma circular (`border-radius: 50%`), fondo sutil gris suave (`#e2e8f0`), icono gris carbón y centrado flexbox (`display: inline-flex`).
    - **Posicionamiento Absoluto al Extremo Derecho:** Se ancló a `right: 10px; top: 50%; transform: translateY(-50%)` con holgura de relleno en el input (`padding-right: 38px`), asegurando que jamás se superponga sobre el texto escrito sin importar qué tan largo sea el término de búsqueda.
    - **Efecto Hover Dinámico:** Al pasar el cursor o presionar el botón, se amplía sutilmente con una sombra discreta y fondo contrastante (`#cbd5e1`).
  - **Despliegue Inmediato:** Compilado limpio en Vite (708 ms) y desplegado a Firebase Hosting (`https://sgh-merida.web.app`).

---

### v2.22.1 (31 de Octubre de 2026)

- **Barrera Institucional Anti-Duplicados para Coordinadores Municipales (`munadmin`):**
  - **Objetivo del Requerimiento:**
    - Blindar el sistema para impedir de forma estricta que ingresen o se aprueben dos usuarios diferentes para el mismo municipio bajo el rol de Coordinador Municipal (`munadmin`).
  - **Características y Blindajes Implementados:**
    - **Barrera en el Registro Público (`#register-form`):**
      - Si un usuario intenta registrarse como Coordinador Municipal (`munadmin`) en un municipio que ya cuenta con un coordinador activo (aprobado o en revisión), el sistema bloquea el registro inmediatamente.
      - Para evitar cuentas huérfanas, la credencial temporal de acceso se elimina de inmediato de Firebase Authentication (`user.delete()`) y se despliega una alerta institucional indicando que el municipio ya cuenta con un titular asignado.
      - Se agregó una nota orientadora en el selector de municipios del registro: *"ℹ️ Solo se admite un Coordinador Municipal activo por municipio"*.
    - **Barrera en la Aprobación de Usuarios (`btn-aprobar`):**
      - Antes de aprobar a cualquier usuario con rol `munadmin`, el sistema valida en memoria (`usuariosLocales`, 0 lecturas) si ya existe otro coordinador en estatus APROBADO para ese municipio.
      - Si ya existe un titular activo, se bloquea la aprobación y se notifica al administrador con el nombre y correo del coordinador actual, instruyendo que debe primero rechazar o reasignar al anterior.
    - **Barrera en la Reasignación de Rol (`modal-editar-rol-usuario`):**
      - Al cambiar el rol o municipio de un usuario desde el botón *✏️ Rol / Datos*, se verifica que el municipio de destino no esté ocupado por otro coordinador activo, bloqueando cambios conflictivos.
    - **Alerta Visual en la Tabla de Usuarios:**
      - En la tabla de *Usuarios del Sistema*, si existe una solicitud pendiente de un municipio que ya tiene titular activo (ej. duplicados históricos), se resalta automáticamente con el distintivo: `⚠️ Municipio ya tiene coordinador activo`.
    - **Barrera en Auto-Completado de Ficha (`#box-completar-perfil`):**
      - Los usuarios que completan su ficha en la sala de espera tampoco pueden seleccionar un municipio ya ocupado como `munadmin`.
  - **Despliegue Inmediato:** Compilado limpio en Vite (870 ms) y desplegado a Firebase Hosting (`https://sgh-merida.web.app`).

---

### v2.22.0 (31 de Octubre de 2026)

- **Edición Integral de Identidad y Perfil de Usuarios (Nombre, Cédula, Teléfono, Rol y Adscripción):**
  - **Objetivo del Requerimiento:**
    - Permitir a los administradores del sistema (`superadmin` y `zonadmin`) modificar directamente no solo el rol o municipio de un usuario, sino también su **Nombre Completo**, su **Cédula de Identidad** y su **Teléfono de Contacto**.
  - **Características y Mejoras Implementadas:**
    - **Ampliación del Modal de Edición de Usuarios (`#modal-editar-rol-usuario`):**
      - Se incorporó el campo de texto interactivo **Nombre Completo del Usuario** (`#inp-edit-user-nombre`), permitiendo corregir nombres con errores tipográficos, faltas ortográficas o nombres genéricos de auto-aprovisionamiento institucional.
      - Se añadieron campos para **Cédula de Identidad** (`#inp-edit-user-cedula`) y **Teléfono de Contacto** (`#inp-edit-user-telefono`).
    - **Re-etiquetado del Botón de Acción:** El botón en la tabla de usuarios se renombró a **✏️ Rol / Datos** (`btn-editar-rol`), comunicando con total claridad que permite gestionar tanto los datos personales como la jerarquía institucional.
    - **Persistencia Segura en Firestore:** Al guardar los cambios, la rutina actualiza atómicamente el documento del usuario en la colección `usuarios` de Cloud Firestore (`safeUpdateDoc`), refrescando de forma inmediata la memoria local, la tabla y los contadores sin requerir recargar la página.
  - **Despliegue Inmediato:** Compilado limpio en Vite (732 ms) y desplegado a Firebase Hosting (`https://sgh-merida.web.app`).

---

### v2.21.3 (31 de Octubre de 2026)

- **Auto-Completado de Ficha Institucional y Blindaje contra Cuentas Huérfanas:**
  - **Diagnóstico del Inconveniente (Causa Raíz):**
    - Un usuario institucional (`liceopedrojosegonzalez2026@gmail.com`, Director del Liceo Pedro José González, Municipio Pueblo Llano) ingresó reiteradas veces desde su teléfono celular y quedó detenido en la pantalla: *«Cuenta en Revisión: Tu cuenta fue creada pero falta el perfil. Contacta soporte.»*.
    - Al auditar el backend de Firebase, se constató que la cuenta de acceso existía en Firebase Authentication, pero **NO existía ningún documento en la colección `usuarios` de Cloud Firestore**.
    - La causa raíz: durante el registro inicial desde conexiones móviles inestables (ej. 3G rural con baja tasa de transferencia), si el proceso se interrumpía tras crear las credenciales en Authentication (o si la cuenta era creada directamente en Authentication sin pasar por la base de datos), la ficha en Firestore nunca se guardaba. Además, si el usuario intentaba registrarse de nuevo, el sistema le arrojaba *"El correo ya está en uso"*, dejándolo en un callejón sin salida.
    - Asimismo, en la consola de Firestore, los documentos se listan por códigos alfanuméricos encriptados (IDs internos), por lo que buscar por correo mediante el buscador web de la consola (`Ctrl + F`) resulta ineficaz y tedioso.
  - **Soluciones y Mejoras Implementadas:**
    - **Creación y Activación Inmediata de Ficha:** Se creó directamente el documento de usuario en Firestore para `liceopedrojosegonzalez2026@gmail.com` vinculado a su UID oficial (`s2AoGlhA0QekD7mkIAeQ7Bzby8y2`), adscrito al código DEA `OD16551416` (Liceo Pedro José González, Pueblo Llano), con rol `plaadmin`, estatus `APROBADO`, y se incorporó dicho plantel a las excepciones activas de despliegue institucional para permitir su acceso directo.
    - **Formulario Inteligente de Auto-Completado de Ficha (`#box-completar-perfil`):** Se integró en la pantalla de espera (`espera-view`) una tarjeta interactiva reactiva. Si cualquier usuario en el futuro inicia sesión con credenciales válidas pero sin ficha en Firestore, el sistema ya no lo deja bloqueado: le permite ingresar su Nombre, Cédula, Teléfono, Rol y Código DEA o Municipio, guardando su perfil en Firestore al instante y enviándolo a aprobación.
    - **Auto-Recuperación en el Registro:** Si un usuario con cuenta huérfana intenta volver a registrarse, el sistema captura el aviso `auth/email-already-in-use`, valida sus credenciales y crea automáticamente su ficha en Firestore con los datos ingresados en el formulario, eliminando la necesidad de soporte técnico manual.
    - **Orden de Persistencia Blindado:** Se reordenó la rutina de registro para asegurar que el documento de Firestore se escriba inmediatamente después de crear la cuenta en Authentication, garantizando que fallos o límites en el envío de correos de verificación nunca dejen cuentas sin perfil.
  - **Despliegue Inmediato:** Compilado limpio en Vite y desplegado a Firebase Hosting (`https://sgh-merida.web.app`).

---

### v2.21.2 (31 de Octubre de 2026)

- **Adaptabilidad Tipográfica Proporcional del Perfil y Blindaje Anti-Desborde en Móviles:**
  - **Diagnóstico del Inconveniente (Causa Raíz):**
    - En teléfonos móviles con pantallas estrechas ($360\text{px} - 390\text{px}$), al iniciar sesión un usuario municipal cuyo nombre y municipio son extensos (ej. *CARMEN ELENA RODRIGUEZ (CARACCIOLO PARRA OLMEDO)* o *MILEIDY RUBIO (JUSTO BRICEÑO)*), la etiqueta `#admin-user-name` ocupaba un ancho excesivo sin auto-ajuste de escala.
    - Esto empujaba los extremos del contenedor horizontalmente, provocando que tanto el botón de menú hamburguesa (`☰`) a la izquierda como el botón de salida (`Salir`) a la derecha quedaran recortados y fuera de la vista del usuario.
  - **Soluciones y Mejoras Implementadas:**
    - **Escala Tipográfica Proporcional a la Longitud (Sugerencia del Usuario):** Se programó una rutina reactiva en `admin.js` que evalúa la longitud del texto (nombre + municipio) y reduce dinámicamente el tamaño de fuente (`font-size: 0.68rem` a `0.85rem`) y el interlineado (`line-height`) según los caracteres.
    - **Contenedores Flexibles y Protección de Botones:** Se blindaron los botones `#btn-hamburger` y `#btn-logout-admin` con `flex-shrink: 0 !important;` y anchos mínimos garantizados, impidiendo que bajo ninguna circunstancia sean aplastados o desplazados fuera del viewport.
    - **Truncamiento Inteligente con Tooltip:** Se aplicó `overflow: hidden; text-overflow: ellipsis; white-space: nowrap;` con ancho máximo adaptativo y el atributo `title` nativo, permitiendo ver el nombre completo al tocarlo sin deformar la cabecera.
    - **Micro-Breakpoint para Teléfonos Compactos:** En pantallas $< 440\text{px}$, el distintivo de versión del header se oculta de forma inteligente para ceder espacio vital al nombre y botones.
  - **Despliegue Inmediato:** Compilado limpio en Vite y desplegado a Firebase Hosting (`https://sgh-merida.web.app`).

---

### v2.21.1 (31 de Octubre de 2026)

- **Cabecera Institucional Fija (Sticky Header) y Navegación Flotante en Desplazamiento Vertical:**
  - **Diagnóstico del Inconveniente (Causa Raíz):**
    - Al desplazarse verticalmente hacia abajo en las vistas del panel administrativo (`admin-view`), la cabecera superior (`#admin-header`) se ocultaba fuera del área visible del monitor o teléfono móvil, obligando al usuario a volver a desplazarse hacia arriba para acceder al menú de navegación (hamburguesa `☰`) o al botón de salir del sistema (`Salir`).
  - **Soluciones y Mejoras Implementadas:**
    - **Header Sticky Persistente (`position: sticky; top: 0; z-index: 1000`):** Se blindó `#admin-header` en CSS y en el DOM con posicionamiento fijo/adherente, fondo translúcido esmerilado (`background: rgba(255, 255, 255, 0.98); backdrop-filter: blur(12px)`) y sombra sutil. La cabecera permanece 100% visible y accesible en todo momento durante el desplazamiento de páginas largas (Pizarra, Planteles o Usuarios).
    - **Sidebar y Overlay con Anclaje Fijo (`position: fixed`):** El menú lateral desplegable (`#admin-sidebar`) y su cortina de desenfoque (`#admin-sidebar-overlay`) se configuraron con posicionamiento fijo relativo a la ventana, garantizando que al presionar el menú hamburguesa desde cualquier punto del scroll, el menú se despliegue de forma impecable en la pantalla activa.
  - **Despliegue Inmediato:** Compilado limpio en Vite y desplegado a Firebase Hosting (`https://sgh-merida.web.app`).

---

### v2.21.0 (31 de Octubre de 2026)

- **Buscador Integral de Usuarios Multi-Criterio (Nombre, Cédula, Código DEA y Correo) para Superadmin, Zonadmin y Munadmin:**
  - **Objetivo del Requerimiento:**
    - Atender la necesidad de las autoridades de nivel central (`superadmin`), estadal (`zonadmin`) y municipal (`munadmin`) para localizar instantáneamente a cualquier usuario del sistema (coordinadores zonales, municipales o directores de plantel) mediante sus datos identificatorios clave.
  - **Características y Mejoras Implementadas:**
    - **Buscador Reactivo Multi-Campo (`#inp-buscar-usuario`):** Integrado en la cabecera del módulo *Usuarios del Sistema*. Filtra en tiempo real (0 ms de latencia y costo cero de lecturas) cruzando de forma simultánea:
      - **Nombre completo** del funcionario.
      - **Cédula de identidad** (búsqueda con o sin puntos y numérica directa).
      - **Código de plantel / DEA** (`jerarquia.plantel_codigo`).
      - **Correo electrónico** (`email`).
      - **Municipio** adscrito.
    - **Botón de Limpieza Rápida (`#btn-limpiar-buscar-usuario`):** Botón dinámico tipo `✕` que aparece al escribir y permite restablecer la lista completa con un solo clic.
    - **Ampliación de Competencias para Coordinadores Zonales (`zonadmin`):** Se adaptó la vista para que el rol `zonadmin` pueda supervisar y consultar tanto a los Coordinadores Municipales (`munadmin`) como a los Directores de Plantel (`plaadmin`) de todo el estado, permitiéndoles buscar planteles por su código DEA.
    - **Visualización Enriquecida de Ubicación:** En la columna *Rol y Ubicación*, los directores exhiben tanto su código DEA como su municipio de adscripción (`Plantel: OD... • MUNICIPIO`), optimizando la legibilidad para búsquedas estadales.
    - **Filtros Armónicos:** El selector de estado ahora inicia en *Todos los estados* por defecto, garantizando que el buscador localice a cualquier usuario sin importar si su estatus es Aprobado o Pendiente.
  - **Despliegue Inmediato:** Compilado limpio en Vite y desplegado a Firebase Hosting (`https://sgh-merida.web.app`).

---

### v2.20.6 (30 de Octubre de 2026)

- **Puente Universal de Auto-Recuperación y Revinculación de Perfiles por Correo:**
  - **Diagnóstico del Inconveniente (Causa Raíz):**
    - Un usuario (Mileidy Rubio, Coordinadora Municipal de Justo Briceño, `gestionhumanajb2026@gmail.com`) reportó el bloqueo en pantalla: *«Cuenta en Revisión: Tu cuenta fue creada pero falta el perfil. Contacta soporte.»* a pesar de que su documento de datos existía y figuraba como `estado_aprobacion: "APROBADO"` en la base de datos Firestore.
    - Se constató que en Firestore el documento fue creado con un Document ID autogenerado distinto al Identificador Único (`UID`) de Firebase Authentication.
    - Como el sistema validaba estrictamente `doc(db, "usuarios", user.uid)`, no encontraba el documento por esa clave y asumía erróneamente que el perfil no existía.
    - Adicionalmente, el chequeo de verificación de correo bloqueaba a usuarios aprobados si aún no habían abierto el enlace de confirmación por email.
  - **Soluciones y Mejoras Implementadas:**
    - **Puente de Auto-Recuperación por Correo:** Si el perfil no se localiza de forma directa por su `user.uid`, el sistema efectúa de inmediato una búsqueda de respaldo por su dirección de correo electrónico (`where("email", "==", user.email)`).
    - **Auto-Revinculación Instantánea:** Al encontrar el perfil por correo, el sistema copia y enlaza automáticamente el perfil al `user.uid` del usuario en Firestore (`setDoc(doc(db, "usuarios", user.uid), ...)`), asegurando que todas las lecturas subsiguientes sean de costo cero y velocidad máxima O(1).
    - **Paso Directo para Usuarios Aprobados:** Se integró la regla institucional de que si el usuario ya posee `estado_aprobacion: 'APROBADO'` en su perfil, se le concede acceso inmediato a su Pizarra Municipal sin bloquearlo por verificación de correo.
  - **Despliegue Inmediato:** Compilado limpio en Vite y desplegado a Firebase Hosting (`https://sgh-merida.web.app`).

---

### v2.20.5 (30 de Octubre de 2026)

- **Blindaje Anti-Desbordamiento Estadal, Resolución Multi-Alias y Soporte Universal de Municipios Compuestos:**
  - **Diagnóstico del Inconveniente (Causa Raíz):**
    - Tras recibir la captura del Coordinador Municipal de **Julio César Salas**, se detectó que visualizaba el título municipal (`Pizarra Municipal - JULIO CESAR SALAS`) pero con las cantidades estadales globales (1,221 escuelas y 23,288 trabajadores), además de 0 directores y 0 planteles en el estatus de matrícula.
    - Se constató que la imagen correspondía a la versión previa `v2.20.3` (visible en la pestaña del navegador).
    - En dicha versión previa, el municipio se extraía literalmente del perfil del usuario (`"JULIO CESAR SALAS"`), pero en la base de datos precomputada (`resumen_estadisticas.json`) el índice histórico estaba registrado de forma abreviada como `"JULIO CESAR"`.
    - Al fallar la coincidencia directa (`resumenData.porMunicipio["JULIO CESAR SALAS"] === undefined`), la condición de respaldo caía por defecto en `resumenData.global`, desbordando los totales de todo el estado hacia la vista municipal.
    - Adicionalmente, las consultas directas a Firestore en planteles y usuarios empleaban igualdad estricta sin variantes de nombre, arrojando cero resultados cuando la denominación no coincidía al 100%.
  - **Soluciones y Mejoras Implementadas:**
    - **Escudo Estricto Anti-Desbordamiento:** En `loadEstadisticas()`, se impuso una regla inquebrantable: si la vista es municipal (`esVistaMunicipal`), el sistema **NUNCA** recurrirá a `resumenData.global`. Si un municipio no fuese localizado, reportará ceros, pero jamás las cantidades del estado Mérida.
    - **Extractor de Datos Multi-Alias (`getDatosMunicipio`):** Tanto si se consulta por la denominación oficial abreviada (`JULIO CESAR`), extendida (`JULIO CESAR SALAS`), con tilde (`JULIO CÉSAR SALAS`), o para cualquier otro municipio con variantes (ej. `CARACCIOLO PARRA OLMEDO`, `ANTONIO PINTO SALINAS`, `TULIO FEBRES CORDERO`), el sistema resuelve y extrae de inmediato sus estadísticas reales (en Julio César Salas: **23 planteles**, **374 personal**, **266 docentes**, **11 administrativos**, **97 obreros**).
    - **Consultas a Firestore con Variantes Flexibles (`getVariantesMunicipio`):** Se dotó a `geografia.js` de la función `getVariantesMunicipio()`, conectada a las consultas de `planteles` y `usuarios` en `admin.js` mediante el operador `in`. Esto asegura que el coordinador municipal recupere siempre la totalidad de sus escuelas y directores, sin importar qué variante fue guardada en cada registro.
    - **Inyección de Aliases en Respaldo Local:** Se incorporaron formalmente las 10 variantes de municipios dentro de `resumen_estadisticas.json` para garantizar respuesta instantánea a costo cero (*Zero-Cost Shield*).
  - **Despliegue Inmediato:** Compilado limpio en Vite y desplegado a Firebase Hosting (`https://sgh-merida.web.app`).

---

### v2.20.4 (30 de Octubre de 2026)

- **Segmentación Territorial de la Pizarra por Municipio, Auto-reconciliación de Cuenta Municipal y Editor de Roles:**
  - **Diagnóstico del Inconveniente (Causa Raíz):**
    - Se identificó que la cuenta del Lic. Luis Alfonso Pérez (`sghcdcez14019@gmail.com`, Coordinador del CDCE Municipio Santos Marquina) fue registrada y autorizada en Firestore con el rol institucional `zonadmin` (Zonal / Nivel Estadal) en lugar de `munadmin` (Municipal). Esto se debió a la ambigüedad en la etiqueta original de registro (*«Responsable SGH ZONA»*), la cual indujo a confusión con la "Zona 14 Santos Marquina".
    - Debido a este rol, el sistema le asignaba el avatar `ZA` (ZonAdmin), el título *«Pizarra Estadal»*, y le mostraba los consolidados de los 23 municipios (1,221 escuelas y 23,288 empleados) en lugar de los 18 planteles y 374 funcionarios de Santos Marquina.
    - Asimismo, la Pizarra carecía de un selector territorial que permitiera a las autoridades de nivel estadal filtrar y auditar los datos de un municipio particular sin salir de la vista ejecutiva.
    - No existía en el panel una herramienta que permitiese a un administrador corregir o reasignar el rol y municipio de un usuario registrado erróneamente sin acudir manualmente a la base de datos.
  - **Soluciones y Mejoras Implementadas:**
    - **Auto-reconciliación Transparente de Cuenta:** Al iniciar sesión el usuario `sghcdcez14019@gmail.com`, el sistema sincroniza automáticamente su perfil en Firestore a `rol: 'munadmin'` con `jerarquia: { estado: 'MERIDA', municipio: 'SANTOS MARQUINA' }`, bloqueando su vista al ámbito estricto de Santos Marquina (avatar `CM`, título *«Pizarra Municipal - SANTOS MARQUINA»*, 18 planteles, 374 trabajadores).
    - **Filtro Territorial Dinámico en la Pizarra (Superadmin y Zonadmin):** Se incorporó el selector `#container-filtro-pizarra-mun` en la cabecera de la Pizarra. Los administradores estadales pueden alternar instantáneamente entre el consolidado general de Mérida y cualquiera de los 23 municipios de forma fluida, con cero lecturas adicionales a Firestore (arquitectura *Zero-Cost* basada en `porMunicipio`).
    - **Modal de Edición de Roles y Adscripción Territorial:** En la pestaña *Usuarios del Sistema*, se integró el botón `✏️ Rol` para cada usuario. Abre un modal interactivo (`#modal-editar-rol-usuario`) que permite reclasificar el rol (`zonadmin`, `munadmin`, `plaadmin`), asignar el municipio oficial y, de ser el caso, el código DEA del plantel, actualizando en tiempo real la base de datos de usuarios.
    - **Claridad Semántica en el Registro:** Se actualizaron las etiquetas del formulario de registro público a:
      - `Responsable SGH Zonal (Nivel Estadal Mérida)`
      - `Responsable SGH Municipal (Coordinador de Municipio)`
    - **Normalización Geográfica Universal:** Todas las consultas y filtros de usuarios y planteles utilizan `normalizarMunicipio()` para garantizar total consistencia ante tildes o variaciones de espaciado.
  - **Despliegue Inmediato:** Compilado limpio en Vite y desplegado a Firebase Hosting (`https://sgh-merida.web.app`).

---

### v2.20.3 (30 de Octubre de 2026)

- **Restauración, Adaptabilidad y Blindaje del Botón «Salir del Sistema / Cerrar Sesión» en Teléfonos Móviles:**
  - **Diagnóstico de Causa Raíz:**
    - Al implementar el blindaje contra desbordamiento horizontal en v2.19.3 mediante `overflow-x: hidden !important` en `html, body, #app`, los elementos que excedían el ancho del viewport de celulares ($<440\text{px}$) quedaban recortados e inaccesibles hacia la derecha.
    - En el Panel de Administración (`admin-view`), la cabecera fija poseía un ancho mínimo de $440\text{px}$ debido a sus rellenos rígidos (`padding: 15px 30px`), desplazando el botón `#btn-logout-admin` completamente fuera del área visible de la pantalla en dispositivos móviles sin posibilidad de desplazamiento manual.
    - En la vista del Director (`lock-screen`), el botón de salida figuraba como un botón plano gris sin ícono con el texto genérico «Salir», y al desplazarse verticalmente por el formulario, la barra superior se ocultaba debido a la inhibición del comportamiento `sticky` provocada por contenedores con `overflow-x: hidden`.
    - El menú lateral despegable de administración (`admin-sidebar`) no poseía una opción de cierre de sesión, dejando al usuario sin alternativas en pantallas reducidas.
  - **Corrección y Optimización Integral:**
    - **Cabecera Responsiva en Administrador:** Reducción de relleno en móviles a `10px 12px`, flex-shrink en controles y estilización con ícono y acento de alerta (`#ef4444`) en `#btn-logout-admin` garantizando visibilidad al 100% en pantallas desde $320\text{px}$.
    - **Botón de Salida en Menú Lateral Móvil:** Inyección del botón `#btn-sidebar-logout` («Salir del Sistema») en la base del menú lateral hamburguesa (`admin-sidebar`), ofreciendo acceso directo e instantáneo al navegar en teléfonos.
    - **Barra Superior Sticky y Botón de Salida en Director:** Transición de `overflow-x: hidden` a `overflow-x: clip`, asegurando que la barra de navegación superior permanezca permanentemente anclada arriba (`position: sticky !important`) durante el desplazamiento en teléfonos.
    - **Botón Adicional en el Pie de Pantalla:** Incorporación de `#btn-logout-lock-footer` («Salir del Sistema») al final del formulario institucional para que el director pueda cerrar sesión de inmediato al culminar la carga de su personal sin necesidad de volver al inicio de la página.
  - **Despliegue Inmediato:** Compilado limpio en Vite y desplegado a Firebase Hosting (`https://sgh-merida.web.app`).

---

### v2.20.2 (30 de Octubre de 2026)

- **Obligatoriedad del Campo «Observaciones» en el Asistente de Registro de Personal:**
  - **Inclusión en el Esquema de Validación Obligatoria:**
    - El campo de Observaciones de la Situación Laboral (`#wp-observaciones`) pasa de ser voluntario a **estrictamente obligatorio**.
    - Se incorporó en la lista de campos auditados por `validarFormularioPersonal()` en `personalWizard.js`. Si el usuario deja la casilla en blanco, el sistema detiene el envío, aplica el borde en rojo (`#dc2626`), enfoca el elemento y muestra la alerta: *«Por favor, complete el campo requerido: Observaciones»*.
  - **Identificación Visual Semántica:**
    - Se añadió el asterisco rojo institucional en la etiqueta del formulario: `Observaciones *` junto con un placeholder orientativo para guiar al director.
  - **Saneamiento de Espacios:**
    - Se aplica saneamiento de espacios en blanco (`trim()`) al capturar y guardar el valor en Firestore.
  - **Despliegue Inmediato:** Compilado limpio en Vite y desplegado a Firebase Hosting (`https://sgh-merida.web.app`).

---

### v2.20.1 (29 de Octubre de 2026)

- **Corrección Crítica de Detección de Matrícula y Refuerzo Absoluto del Candado de Personal:**
  - **Detección Estricta Basada en Matrícula Real (> 0 Estudiantes):**
    - Se eliminó el falso positivo provocado por la bandera institucional legacy `datos_completados: true` y por el conteo de secciones, los cuales permitían que colegios sin alumnos inscritos (`matricula-total: 0`, `matricula: {}`) eludieran el bloqueo.
    - El evaluador de `hasData` ahora examina exclusivamente la existencia de una cifra real y positiva de estudiantes (`matricula-total > 0`, `total-gen > 0`, totales de modalidad Adulto/Especial o subcampos numéricos estrictamente mayores a cero dentro del objeto `matricula`).
  - **Bloqueo Profundo y Forzado con `!important`:**
    - Al detectar que una institución carece de matrícula, `#seccion-personal-existente` y `#seccion-registro-personal` son forzadas a `display: none !important;`.
    - Se establecieron barreras de seguridad (`guards`) en `cargarPersonalExistente`, `mostrarFormularioPersonal` y `cargarEmpleadoEnFormulario` mediante la bandera global `window._requierePaso1`, impidiendo la renderización y edición de funcionarios bajo cualquier circunstancia hasta completar el Paso 1.
  - **Desbloqueo Limpio tras Registro:**
    - Al guardar una matrícula válida, se retira la propiedad `!important`, se restablece la vista de la nómina y se sincroniza la sesión sin recargar.
  - **Despliegue Inmediato:** Compilado limpio en Vite y desplegado a Firebase Hosting (`https://sgh-merida.web.app`).

---

### v2.20.0 (29 de Octubre de 2026)

- **Implementación del Candado Secuencial Obligatorio (Paso 1: Matrícula ➡️ Paso 2: Personal):**
  - **Bloqueo Preventivo de Acceso a Nómina para Planteles sin Matrícula:**
    - Si una institución educativa no posee matrícula estudiantil registrada (o su total es 0), la sección de personal existente y registro permanece oculta y bloqueada.
    - Se incorporaron dos banners institucionales de orientación en la pantalla del director (`#banner-alerta-paso1-top` y `#banner-candado-paso1`) indicando formalmente que debe declarar la matrícula de sus alumnos para desbloquear a su talento humano.
    - El botón de guardado se transforma dinámicamente: `💾 Guardar Matrícula y Habilitar Personal (Paso 1)`.
  - **Filtro Anti-Elusión (Validación de 0 Estudiantes):**
    - Se agregó una validación estricta que impide guardar la matrícula si el total de estudiantes declarados es 0, impidiendo que el director intente eludir el requisito guardando formularios vacíos.
  - **Desbloqueo Automatizado y Fluido (Paso 2):**
    - Al guardar una matrícula válida, el sistema oculta los banners del Paso 1, desbloquea la tabla de personal, carga a los trabajadores existentes, efectúa un scroll suave a la nómina y notifica al usuario con un mensaje de confirmación institucional.
  - **Alineación en Módulo de Despliegue del Panel Administrativo:**
    - Se renombró la opción en el selector global: *«Actualización de Personal con Matrícula Obligatoria (Paso 1: Matrícula ➡️ Paso 2: Personal)»*.
  - **Despliegue Inmediato:** Compilado limpio en Vite y desplegado a Firebase Hosting (`https://sgh-merida.web.app`).

---

### v2.19.7 (29 de Octubre de 2026)

- **Blindaje Total de Seguridad y Solo Lectura en «Planes de Estudio del Plantel» para Modo Supervisión:**
  - **Inmovilización Completa del Selector Interactivo de Planes de Estudio:**
    - Se selló el contenedor interactivo `#contenedor-seleccion-planes` ante accesos de Coordinadores Municipales (`munadmin`) y Zonales (`zonadmin`) en Modo Supervisión.
    - Las casillas de verificación (`.chk-plan-director`) y las tarjetas clicables (`.card-plan-selector`) se configuran automáticamente en modo deshabilitado (`disabled = true`) con anulación de eventos de puntero (`pointer-events: none`), impidiendo que el supervisor marque o desmarque planes y altere los formularios de matrícula en pantalla.
    - Se ocultó el desplegable de asignación de menciones técnicas (`#sel-agregar-mencion-tecnica`) y se suprimieron los botones de eliminación (`.btn-quitar-plan-mt`).
  - **Distintivos Visuales de Bloqueo Institucional:**
    - El contador dinámico refleja ahora el estado de supervisión: `🔒 [N] planes activos (Modo Supervisión)` con fondo rojo tenue y borde de advertencia.
    - Se incorporó un cintillo informativo en la cabecera de la sección indicando que la selección de planes se encuentra protegida para el supervisor.
  - **Blindaje del Módulo de Traslados:**
    - Se ocultó el botón `#btn-incorporar-traslado` y se agregó un candado de seguridad en `abrirModalTraslado()` para bloquear incorporaciones en modo supervisión.
  - **Despliegue Inmediato:** Compilado limpio en Vite y desplegado a Firebase Hosting (`https://sgh-merida.web.app`).

---

### v2.19.6 (28 de Octubre de 2026)

- **Rediseño Corporativo de la Lista de Excepciones por Plantel en Módulo de Despliegue:**
  - **Sustitución de Botón «X» sin Estilos por Botón Institucional de Eliminación:**
    - Se reemplazó la letra «X» roja plana que flotaba de forma desalineada en la tarjeta de excepciones por un botón corporativo tipo Pill (`🗑️ Eliminar`), con fondo suave (`#fee2e2`), borde sutil (`#fecaca`), texto semántico rojo y micro-interacción en hover.
  - **Enriquecimiento Visual con Epónimo del Plantel:**
    - La tarjeta de excepción individual ahora muestra el icono representativo (`🏫`), el código DEA en negrita y, si está cargado en memoria, el nombre nominal o nuevo epónimo del colegio, brindando identificación instantánea al administrador.
  - **Atajo de Teclado:** Se añadió soporte para ingresar excepciones pulsando la tecla `Enter` en el campo del código DEA.
  - **Despliegue Inmediato:** Compilado limpio en Vite y desplegado a Firebase Hosting (`https://sgh-merida.web.app`).

---

### v2.19.5 (28 de Octubre de 2026)

- **Corrección en Desactivación y Persistencia de Planes de Estudio en Ficha de Plantel:**
  - **Eliminación Definitiva de Fusión Acumulativa (`merge: true`):**
    - Se reemplazó el guardado con fusión acumulativa en `main.js` por actualización directa (`safeUpdateDoc`).
    - Al desmarcar un plan de estudio en la ficha de un colegio específico, Firebase sobrescribe y reemplaza el mapa de planes del plantel en lugar de fusionarlo, asegurando que el plan desmarcado no reaparezca al recargar (`F5`).
  - **Protección del Catálogo Maestro Estatal:**
    - Se garantiza que el Catálogo Maestro Oficial (`sistema/catalogos_maestros`) se mantenga intacto y universal para todo el estado, afectando única y exclusivamente la asignación del colegio que el director está configurando.
  - **Bloqueo de Auto-Reactivación por Defecto en Planteles Ya Configurados:**
    - Se ajustó la condición de carga inicial en `mostrarCandado()` para evitar que planteles previamente guardados o configurados reactiven planes por defecto si el usuario los desmarcó voluntariamente.
  - **Despliegue Inmediato:** Compilado limpio en Vite y desplegado a Firebase Hosting (`https://sgh-merida.web.app`).

---

### v2.19.4 (28 de Octubre de 2026)

- **Optimización de Usabilidad y Adaptabilidad Móvil en Ventana de Traslado (Ficha Viajera):**
  - **Reorganización Ergonómica del Buscador de Cédula:**
    - Se transformó el grupo de búsqueda de cédula en la ventana *Incorporar Funcionario por Traslado* (`#modal-incorporar-traslado`). En teléfonos inteligentes, la fila ahora distribuye la selección de nacionalidad (`V-` / `E-`) y el campo numérico en el primer renglón, ubicando el botón **🔍 Buscar** en un renglón propio a ancho completo (100% width).
    - Se eliminó el truncamiento visual observado en grabaciones de pantalla móvil donde el botón quedaba cortado (`🔍 Bus...`) debido al límite del marco.
  - **Optimización de Espaciados en Modales para Celulares:**
    - Ajuste de márgenes interiores (padding) en ventanas emergentes de 24px a 14px en dispositivos móviles, ampliando el área visible de la información y previniendo cortes en textos y resultados.
    - Cuadrícula de detalles del funcionario en Ficha Viajera adaptada a una columna en pantallas estrechas.
  - **Despliegue Inmediato:** Compilado limpio en Vite y desplegado a Firebase Hosting (`https://sgh-merida.web.app`).

---

### v2.19.3 (28 de Octubre de 2026)

- **Optimización Integral de Diseño Responsivo y Eliminación de Desbordamiento Horizontal en Celulares:**
  - **Blindaje Estricto de Viewport (Anti-Blowout):**
    - Se aplicó contención global `overflow-x: hidden !important; max-width: 100vw !important;` en `html`, `body` y `#app` con `box-sizing: border-box;` universal.
    - Se eliminó el espacio blanco/vacío a la derecha en navegadores móviles (Chrome Android / iOS Safari), garantizando que el diseño no se desplace lateralmente.
  - **Barra de Acciones Responsiva en Personal Registrado:**
    - Transformación de la barra superior de personal (Buscador, Descargar Nómina Excel, Incorporar Traslado) con flexbox responsivo (`flex-wrap: wrap`), adaptando el buscador y botones al 100% del ancho en pantallas móviles sin desbordar el contenedor.
  - **Contenedor Desplazable Táctil para Tabla de Personal (`table-responsive-wrapper`):**
    - Se encapsuló la tabla de 5 columnas en un contenedor con desplazamiento horizontal táctil interno (`overflow-x: auto; -webkit-overflow-scrolling: touch;`), manteniendo las columnas legibles y compactas sin forzar la dilatación de la pantalla completa.
  - **Colapso Inteligente a Una Columna en Formularios para Móviles:**
    - Se reestructuraron las cuadrículas de datos institucionales del plantel, datos personales, carga horaria (`#container-carga-horaria`) y bienestar social para adoptar automáticamente una sola columna vertical limpia (`grid-template-columns: 1fr`) en pantallas $\le 768\text{px}$.
  - **Ajuste de Relleno (Padding) Ergonómico:**
    - Reducción del padding en tarjetas y formularios en móviles de 30px/24px a 14px/10px para maximizar el área útil de lectura en teléfonos de 360px a 412px de ancho.
  - **Despliegue Inmediato:** Compilado limpio en Vite y desplegado a Firebase Hosting (`https://sgh-merida.web.app`).

---

### v2.19.2 (28 de Octubre de 2026)

- **Refinamiento Estético y Distribución Armónica 3x2 en Carga Horaria y Pedagógica:**
  - **Reorganización Geométrica Equilibrada (3x2):**
    - Se transformó la cuadrícula de captura de la tarjeta pedagógica a una distribución simétrica de 2 filas con 3 columnas cada una:
      - *Fila 1 (Perfil y Contrato):* Nivel / Modalidad, Especialidad Imparte y Horas según Recibo de Pago (`H.DOC` / `H.ADM`).
      - *Fila 2 (Dedicación en este Plantel):* Horas Académicas (en Aula), Horas Administrativas y Horas por Programar.
    - Se eliminó el desbalance visual donde el campo «Horas por Programar» quedaba aislado en una segunda fila.
  - **Diseño Mejorado del Indicador «Horas por Programar»:**
    - Indicador visual dinámico con formato tipo insignia (Badge): muestra `0 hrs (Completo)` con resalte verde esmeralda suave cuando la carga está 100% asignada, o `X hrs (Por Asignar)` en azul celeste cuando restan horas por distribuir.
  - **Despliegue Inmediato:** Compilado limpio en Vite y desplegado a Firebase Hosting (`https://sgh-merida.web.app`).

---

### v2.19.1 (28 de Octubre de 2026)

- **Soporte Oficial de Recibo de Pago MPPE (`H.DOC` / `H.ADM`) y Dedicación Mixta para Coordinadores:**
  - **Fidelidad al Recibo Ministerial:**
    - Identificación y rotulado dinámico de la casilla de nómina según el tipo de trabajador: **Horas según Recibo (H.DOC)** para Docentes, y **Horas según Recibo (H.ADM)** para Personal Administrativo y Obrero (con prellenado estándar de 40 horas).
  - **Soporte de Dedicación Mixta (Docente Coordinador de Seccional):**
    - Permite declarar en simultáneo horas académicas de aula (ej. 20 hrs) y horas administrativas de coordinación/oficina (ej. 20 hrs).
    - Cómputo inteligente de saldo pendiente: $\text{Horas por Programar} = \text{Recibo} - (\text{Horas Académicas} + \text{Horas Administrativas})$, reconociendo el cumplimiento total del contrato laboral.
  - **Unificación de la Tarjeta de Dedicación y Carga Horaria:**
    - Tarjeta adaptable única (`#container-carga-horaria`) que conmuta entre modo Administrativo/Servicio y modo Pedagógico frente a alumnos.

---

### v2.19.0 (28 de Octubre de 2026)

- **Incorporación de Horas según Recibo de Pago y Desacople de «¿Atiende Matrícula?»:**
  - **Desacople Institucional:** Se fijó el selector «¿Atiende Matrícula?» como único gatillo de la carga académica, permitiendo que Personal Obrero o Administrativo debidamente convalidado atienda matrícula.
  - **Reglas Normativas del MPPE:**
    - Básica (Inicial/Primaria): Carga horaria única e indivisible de 53.33 horas concentrada en un solo plantel.
    - Media (General/Técnica): Asignación a partir de 40 horas hasta el tope legal de 56 horas multi-plantel.
    - Incompatibilidad estricta: Bloqueo de cruces de horas entre Básica y Media.
  - **Actualización de Reportes:** Inclusión de las columnas *Horas Recibo de Pago* y *Horas por Programar* en las exportaciones a Excel.

---

### v2.18.2 (28 de Octubre de 2026)

- **Hotfix: Restauración del Enlace de Guardado de Matrícula y Corrección de Alcance de Planes:**
  - **Corrección de Excepción Crítica en Carga (`ReferenceError`):**
    - Subsanado el fallo fatal en la consola `Uncaught (in promise) ReferenceError: tienePlanes is not defined` que ocurría al inicializar la pantalla del plantel en `mostrarCandado()`.
    - Dicha interrupción impedía que el navegador alcanzara la instrucción `form.onsubmit = async (...)`, dejando el botón «GUARDAR DATOS Y CONTINUAR» desconectado e inoperativo para secciones y matrícula.
  - **Definición Segura de Planes y Modalidades:**
    - Se redefinió `tienePlanes` enlazándolo a las modalidades (Especial / Adulto) y al nuevo gestor interactivo `window._planesSeleccionadosDirector`.
    - Se incorporó soporte condicional estricto para `modoDespliegue === 'SOLO_MATRICULA'`, ocultando el personal de forma directa sin evaluaciones intermedias.
  - **Precarga Robusta de Planes Preexistentes:**
    - Lectura bidireccional desde `dataParcial["planes-estudio"]` o datos maestros `dp`, infiriendo planes base por nivel institucional (20000 Inicial, 21000 Primaria, 31059 Media General) para garantizar compatibilidad total con planteles ya registrados.
  - **Despliegue Inmediato:** Compilación limpia con Vite y publicación a Firebase Hosting (`https://sgh-merida.web.app`).

---

### v2.18.1 (28 de Octubre de 2026)

- **Gestor Dinámico de Planes de Estudio y Blindaje de Matrícula Institucional:**
  - **Corrección de Error Crítico en Guardado de Matrícula (`FieldMask`):**
    - Subsanado el fallo en tiempo de ejecución de Firestore: `FirebaseError: Field 'modalidad' is specified in your field mask but missing from your input data.` reportado por directores bajo el modo de despliegue «Solo Modificar Matrícula».
    - Sustitución de listas fijas `mergeFields` por `{ merge: true }` y aplicación de `deleteField()` dinámico en `webapp/src/main.js`.
  - **Exclusión Mutua Institucional (Nivel vs. Modalidad):**
    - Aplicación estricta de regla de dominio educativo: si un plantel es de Nivel regular (Inicial, Primaria, Media General, Media Técnica), se elimina de raíz el campo `modalidad`. Si el plantel es de Modalidad (Especial o Adulto), se elimina de raíz el campo `nivel`.
  - **Corrección de Duplicación en Vivo en Matrícula de Media:**
    - Se eliminó la doble sumatoria de campos de Media (`sumMg + sumMt`) en el detector de eventos en vivo `plantel-form.oninput`, resolviendo la discrepancia visual donde la matrícula total se duplicaba al escribir y solo corregía al guardar.
  - **Estandarización y Guía Visual por Nivel Educativo:**
    - Homogeneización de encabezados en tarjetas de matrícula a `Matrícula Estudiantil - [Nivel/Modalidad]`.
    - Sustitución del símbolo `#` por el ícono representativo `📚` en Media General.
    - Textos de orientación pedagógica diferenciados: para Inicial y Primaria se indica declarar primero secciones y luego estudiantes; para Media se orienta registrar primero matrícula por plan y luego distribuir secciones por año.
  - **Gestor Interactivo de Planes de Estudio (`#contenedor-seleccion-planes`):**
    - Creación del catálogo maestro unificado `webapp/src/catalogosPlanes.js` (Planes 20000, 21000, 31059, 31060 y oferta completa de menciones técnicas 4xxxx).
    - Selector interactivo en la vista del director para habilitar o deshabilitar planes según la realidad de la institución, reconfigurando en tiempo real las planillas de matrícula y secciones.
    - Flujo ágil en Media Técnica: selección directa desde el menú desplegable con incorporación instantánea (`onchange`) y botón de desvinculación (✕), sin botones redundantes.
    - Persistencia garantizada de la estructura `planes-estudio` en el documento del plantel en Firestore.
  - **Respeto a Candado en Modo «Solo Modificar Matrícula»:**
    - Se restringió la llamada a `mostrarFormularioPersonal(true)` tras el guardado exitoso de la matrícula cuando la sesión se encuentra en modo restrictivo `SOLO_MATRICULA`.

---

### v2.18.0 (27 de Octubre de 2026)

- **Escudo de Carga Horaria Acumulada Docente por Nivel (Anti-Sobrecarga en Doble Cédula):**
  - **Topes Normativos por Nivel:** Detección dinámica y aplicación estricta de límites legales según normativa MPPE:
    - *Nivel Media (General / Técnica):* Tope máximo de **56 horas**.
    - *Nivel Inicial y Primaria:* Tope máximo de **53.33 horas**.
    - *Régimen Mixto:* Si el funcionario docente imparte horas en Media en cualquier institución, se acoge al tope superior de 56 horas para garantizar la cobertura de la carga académica de Media.
  - **Soporte de Precisión Decimal:** Modificación de los campos de horas a `step="any"` y cómputo con números de punto flotante (`parseFloat`), preservando con exactitud valores fraccionarios como `53.33`, `33.33` o `12.5`.
  - **Asistencia Visual en Tiempo Real:** Indicador dinámico (`#wp-horas-academicas-help`) situado bajo el campo de horas que informa al director sobre horas ocupadas en otros planteles, disponibilidad remanente y advertencias visuales en rojo ante posibles excesos.
  - **Freno Institucional al Guardar:** Modal de bloqueo (`showAlert`) que intercepta intentos de guardado o incorporación que sobrepasen el tope, presentando el desglose detallado por plantel y la instrucción exacta de horas máximas admisibles.
  - **Protección Zero-Cost en Firestore:** Implementación de escudo de memoria (`_cacheCargosPorCedula`) para ejecutar todas las consultas cruzadas a velocidad instantánea (0 ms) sin penalizar las cuotas de lectura de la capa gratuita Spark.

---

### v2.17.1 (27 de Octubre de 2026)

- **Integración de Identidad Institucional Oficial (SGH - CDCE Mérida):**
  - **Reemplazo Global de Activos Temporales:** Sustitución definitiva del ícono genérico provisional (`vite.svg`) por el emblema oficial del Sistema de Gestión Humana y Centro de Desarrollo de la Calidad Educativa del Estado Mérida (`sgh-logo.png`).
  - **Optimización y Creación de Favicon:** Generación de imagen PNG de 512x512 ultraligera para carga web instantánea y derivación de `favicon.png` de 64x64 para pestañas de navegadores.
  - **Puntos de Integración en la Interfaz:**
    - *Pantalla de Inicio de Sesión (`#login-view`):* Emblema central de 110x110 con bordes redondeados y micro-sombra institucional.
    - *Sala de Espera (`#espera-view`):* Distintivo de 90x90 como encabezado de tarjeta 2FA.
    - *Solicitud de Acceso (`#register-view`):* Emblema de 85x85 presidiendo el formulario de registro.
    - *Barra de Navegación del Director (`.navbar`):* Imagotipo compacto de 32x32 junto a las siglas SGH.
    - *Cabecera del Panel de Administración (`#admin-view`):* Imagotipo de 36x36 junto al título del panel de control.
  - **Despliegue a Producción:** Compilación optimizada con Vite y despliegue a Firebase Hosting (`https://sgh-merida.web.app`).

---

### v2.17.0 (27 de Octubre de 2026)

- **Incorporación de la Modalidad de Despliegue «Solo Editar Personal Existente y Modificar Matrícula»:**
  - **Nueva Opción en Pizarra de Control (`#sel-modo-operacion`):** Inyección del perfil `SOLO_EDITAR_PERSONAL_Y_MATRICULA` con la etiqueta visual *«Solo Editar Personal Existente y Modificar Matrícula (Bloquea Nuevo)»*.
  - **Habilitación de Matrícula y Datos Institucionales:** A diferencia del modo restrictivo previo, este perfil mantiene completamente desbloqueados y editables los campos de matrícula, secciones y datos institucionales del colegio, así como el botón interactivo `#btn-guardar-matricula`.
  - **Coacción Inteligente de Matrícula Previa:**
    - *Planteles con Matrícula Previa:* Acceso inmediato a la tabla de personal registrado para realizar modificaciones, desincorporaciones o recepción de traslados institucionales.
    - *Planteles Nuevos o sin Matrícula:* La tabla de personal se mantiene oculta por diseño; el sistema coacciona al director a completar y guardar primero la matrícula y secciones. Al pulsar «Guardar Datos y Continuar», el sistema desbloquea automáticamente la tabla de personal.
  - **Candado de Seguridad Anti-Nuevo Ingreso:** El formulario de creación de personal desde cero permanece inmutablemente oculto y bloqueado (`display: none !important`), limitando las acciones del director estrictamente a la edición de empleados activos y a la incorporación certificada por Ficha Viajera.
  - **Despliegue a Producción:** Compilación optimizada con Vite y despliegue a Firebase Hosting (`https://sgh-merida.web.app`).

---

### v2.16.1 (27 de Octubre de 2026)

- **Calibración Visual y Obligatoriedad en Justificación de Traslados:**
  - **Alineación y Dimensiones en Modal de Traslado (`#modal-incorporar-traslado`):** Corrección del ancho del input de cédula con propiedad expansiva prioritaria (`flex: 1 1 auto`), estandarización del botón `🔍 Buscar` con tamaño proporcionado (`width: auto`) y desacople del botón de cierre superior (`✕`) convirtiéndolo en un control circular compacto y no invasivo.
  - **Obligatoriedad Estricta en Cuadro de Observaciones:** En el modal de desincorporación (`#modal-eliminar-personal`), al seleccionar «TRASLADO A OTRO PLANTEL» o «TRASLADO INTERZONAL», el sistema activa dinámicamente el indicador `* (Obligatorio)` en color rojo, enfoca el campo de texto y bloquea la operación si el director no especifica la causa o resolución del traslado.
  - **Visibilidad de Observación en Plantel Destino:** La justificación asentada por el director de origen queda registrada en la Ficha Viajera (`observaciones_traslado`) y se visualiza íntegramente en la tarjeta de confirmación del nuevo plantel.
  - **Despliegue a Producción:** Compilación optimizada con Vite y despliegue a Firebase Hosting (`https://sgh-merida.web.app`).

---

### v2.16.0 (27 de Octubre de 2026)

- **Implementación de la Ficha Viajera para Traslados Institucionales entre Planteles:**
  - **Emisión en Plantel de Origen:** Incorporación de la opción formal «TRASLADO A OTRO PLANTEL» en el modal de desincorporación (`#sel-motivo-desincorporacion`). Al seleccionarla, el sistema retira al empleado de la nómina activa del plantel de origen (`cargos_personal`) y genera de forma automática su expediente digital en la colección de Fichas Viajeras (`personal_traslados`), salvaguardando toda su información biográfica y laboral previa.
  - **Recepción e Incorporación en Plantel de Destino:** Integración del botón interactivo `📥 Incorporar Traslado` en la cabecera de la tabla de personal registrado (`#seccion-personal-existente`), habilitado de manera exclusiva bajo la modalidad de despliegue restringido **«Solo Editar Personal Existente (Bloquea Nuevo y Matrícula)»**.
  - **Buscador y Validación Inteligente por C.I.:** Modal especializado (`#modal-incorporar-traslado`) que consulta la cédula del funcionario directamente en `personal_traslados` a costo cero (1 lectura directa por ID de documento):
    - *Ficha Disponible:* Previsualización de datos institucionales (nombres, cédula, cargo anterior, código RAC y DEA de origen) con botón de confirmación que precarga el formulario del director con todos los datos personales prellenados, cambia el banner a «Modo Traslado» y actualiza la acción a «INCORPORAR AL PLANTEL».
    - *Candado de Seguridad (Cero Personal No Autorizado):* Si la cédula no existe en la base de datos central de Gestión Humana, el sistema bloquea la acción informando que en jornadas restringidas no se permite la creación de nuevo ingreso no certificado.
    - *Candado contra Duplicados:* Si el empleado figura como ACTIVO en otro plantel educativo, el sistema detalla el código DEA del plantel de origen e instruye que dicho director debe primero desincorporarlo por traslado.
  - **Cierre Transaccional y Auditoría:** Al guardar la incorporación en el nuevo plantel, el empleado se añade a la nómina del plantel destino, se actualiza el resumen del plantel (`personal_resumen`), se elimina su ficha de `personal_traslados` y se genera un registro histórico inmutable en `personal_traslados_log`.
  - **Despliegue a Producción:** Compilación exitosa con Vite y publicación en Firebase Hosting (`https://sgh-merida.web.app`).

---

### v2.15.0 (27 de Octubre de 2026)

- **Delegación de Potestad de Modificación de Planteles a Directores (`plaadmin`):**
  - **Restricción a Coordinadores Municipales (`munadmin`):** En el módulo *Gestor de BD ➔ Planteles*, se retiraron los botones de modificación (`✏️ Editar`) y eliminación (`🗑️ Eliminar`), transformando el rol municipal en un perfil de supervisión, consulta y auditoría mediante la Ficha del Plantel (`📋 Ficha`).
  - **Empoderamiento del Director (`plaadmin`):** En la pantalla de carga del director, se habilitó la modificación directa de los datos institucionales de su sede, quedando protegidos exclusivamente los datos territoriales y de identidad legal del plantel.
  - **Reordenamiento Estético Institucional de Datos del Plantel:** Ajuste estricto del orden visual de los campos según la directriz institucional:
    1. *Estado* (Lectura / Fijo: MÉRIDA).
    2. *Municipio* (Lectura / Fijo).
    3. *Parroquia* (Lectura / Fijo).
    4. *Dependencia* (Lectura / Fijo).
    5. *Denominación* (Lectura / Fijo).
    6. *Nombre Nominal del Plantel* (Editable).
    7. *Nuevo Epónimo* (Editable).
    8. *Código Plantel* (DEA - Lectura / Fijo).
    9. *Cód. Dependencia* (Lectura / Fijo).
    10. *Cód. Estadístico* (Editable).
    11. *Niveles-Modalidades* (Selector interactivo con catálogo maestro).
    12. *Ubicación Geográfica* (Selector: Urbano / Rural).
    13. *Turno(s)* (Selector: Mañana, Tarde, Doble Turno, Integral, Nocturno, Sabatino).
    14. *Observaciones* (Editable).
    15. *Matrícula* (Cálculo automático de total).
  - **Trazabilidad y Auditoría Institucional:** Registro en Firestore de estampa de tiempo (`fecha_modificacion_datos`) e identificación del usuario (`modificado_por`), con sincronización en tiempo real de memoria activa y bloqueo automático en Modo Supervisión.

---

### v2.14.19 (24 de Septiembre de 2026)

- **Formato y Claridad en Mensajes de Autenticación y Despliegue:**
  - **Registro Exitoso:** Se aplicó formato en negritas para resaltar las directrices clave en la ventana de confirmación (`carpeta spam` y `para la aprobación`).
  - **Verificación de Correo en Espera:** Habilitación de renderizado HTML dinámico en la sala de espera (`#espera-view`) y resaltado en negritas de la indicación (`revisa tu carpeta de Spam`).
  - **Cierre Institucional por Fase de Despliegue:** Se desacopló del título genérico de revisión para mostrar explícitamente el encabezado **«Despliegue Institucional»** y destacar en negritas que el sistema **«no está habilitado para el municipio»** (o su plantel).
  - **Despliegue a Producción:** Compilación optimizada y publicación en Firebase Hosting (`https://sgh-merida.web.app`).

---

### v2.14.18 (24 de Septiembre de 2026)

- **Estandarización de Nomenclatura en Pizarra Administrativa:** Unificación definitiva de las etiquetas visuales del panel de control:
  - Títulos contextuales estandarizados a **Pizarra Municipal - [Municipio]** para Coordinadores Municipales (`munadmin`) y **Pizarra Estadal** para Coordinadores Zonales (`zonadmin`) y Superadministradores (`superadmin`).
  - Nombre de cabecera contextualizado para el rol Zonal (`userData.nombre || 'Pizarra Estadal'`).

---

### v2.14.17 (24 de Septiembre de 2026)

- **Buscador con Selectores en Cascada para Planteles:** Implementación de dos selectores interactivos en la barra de herramientas del módulo de Planteles:
  - **Selector de Municipios (`#filtro-municipio-plantel`):** Despliega los 23 municipios del estado para roles con competencia global (`superadmin` y `zonadmin`), o se fija de forma automática y protegida al municipio asignado para Coordinadores Municipales (`munadmin`).
  - **Selector de Parroquias en Cascada (`#filtro-parroquia-plantel`):** Al elegir un municipio, actualiza inmediatamente en cascada su listado mostrando únicamente las parroquias pertenecientes al mismo.
  - **Búsqueda Multicriterio Integrada (`#inp-buscar-plantel`):** El campo de texto y ambos selectores operan de manera simultánea en memoria del navegador (Zero-Cost), permitiendo filtrar por municipio, parroquia, código DEA y epónimo sin recargas de página.
- **Alineación y Armonización Visual:** Eliminación de márgenes inferiores heredados y ajuste de altura uniforme a 42px con `box-sizing: border-box`, garantizando alineación horizontal perfecta entre el buscador, los selectores y los botones de acción.

---

### v2.14.16 (24 de Septiembre de 2026)

- **Saneamiento Histórico de Epónimos con Fechas de Excel:** Corrección definitiva de los 13 planteles educativos cuyos nombres se encontraban corrompidos con números negativos y seriales de fecha generados por Excel durante la migración original (tales como `-28678`, `-31367`, `-32763`, `46307`, etc.).
- **Mapeo Institucional Exacto:** Se restituyeron formalmente sus nombres históricos y patrios oficiales (ej. `24 DE JUNIO DE 1821`, `12 DE FEBRERO DE 1814`, `19 DE ABRIL DE 1810`, `12 DE OCTUBRE`, etc.).
- **Escudo Preventivo y Filtro de Limpieza (`obtenerEponimoLimpioPlantel`):** Doble capa de validación en tiempo de ejecución para la tabla de planteles, búsqueda, ordenamiento alfabético, modal de edición y exportación de nómina a Excel, garantizando que nunca más se muestren valores numéricos.
- **Saneamiento Automatizado en Firestore:** Al cargar el módulo de planteles con credenciales de `superadmin` o `admin`, el sistema actualiza de forma transparente e imperceptible los documentos en la base de datos de Firebase.

---

### v2.14.15 (24 de Septiembre de 2026)

- **Corrección de Carga de Planteles para Superadmin y Zonadmin:** Optimización de la función de consulta en `admin.js` para usuarios estadales (`superadmin` y `zonadmin`), garantizando la descarga fluida y completa del universo de instituciones educativas sin bloqueos por ausencia de filtro municipal.
- **Sincronización en Memoria:** Corrección de hidratación de tablas y selectores parroquiales en la vista global.

---

### v2.14.14 (24 de Septiembre de 2026)

- **Discriminación Jerárquica de Usuarios por Rol:** Organización y visualización clasificada en el apartado de Usuarios según el rol de la sesión activa:
  - Para **Superadmin (`superadmin`)**: Presentación secuencial y ordenada en bloques: 1º Coordinadores Zonales (`zonadmin`), 2º Coordinadores Municipales (`munadmin`), y 3º Directores de Plantel (`plaadmin`).
  - Para **Coordinador Zonal (`zonadmin`)**: Restricción exclusiva para visualizar únicamente a los Coordinadores Municipales (`munadmin`).
  - Para **Coordinador Municipal (`munadmin`)**: Visualización restringida a Directores de Plantel (`plaadmin`) de su municipio.
- **Separadores Visuales e Insignias de Rol:** Inyección de barras divisorias con iconos y conteos por rol (🏛️ Zonales en morado, 🏢 Municipales en azul y 🏫 Directores en verde), acompañadas de insignias distintivas en cada registro.
- **Filtro Selectivo por Rol (`#filter-rol-usuario`):** Incorporación de selector para alternar entre la vista global clasificada o filtrar por un rol específico.
- **Actualización de Nomenclatura Institucional:** Ajuste formal de etiquetas en menú y encabezados a **Pizarra** (en lugar de Estadísticas/Métricas) y **Usuarios del Sistema** (en lugar de Validación de Usuarios).

---

### v2.14.13 (24 de Septiembre de 2026)

- **Visualización Prioritaria por Nuevo Epónimo en Tabla de Planteles:** Se modificó la columna principal de la tabla de planteles para mostrar de forma destacada el **Nuevo Epónimo** de cada institución educativa en sustitución del nombre tradicional.
- **Referencia Nominal Secundaria:** Para planteles con denominación histórica que difiera del nuevo epónimo, se incorporó una sutil referencia institucional `(Nominal: ...)` debajo del título.
- **Ordenamiento Alfabético Inteligente:** Clasificación automática de la tabla de la A a la Z según el Nuevo Epónimo.
- **Buscador Multicriterio Adaptado:** Actualización del filtro de búsqueda para indexar simultáneamente por Nuevo Epónimo, nombre nominal, código DEA, municipio y parroquia.

---

### v2.14.12 (24 de Septiembre de 2026)

- **Incorporación de 4ta Tarjeta de Estadísticas:** Creación de la tarjeta destacada **Total Matrícula** en la cuadrícula de métricas principales, discriminada dinámicamente como **Matrícula Municipal** para coordinadores municipales (`munadmin`) y **Matrícula Estadal** para autoridades (`superadmin` y `zonadmin`).
- **Arquitectura Zero-Cost Estadal en Tiempo Real:** Cómputo inteligente de carga escolar a nivel de todo el estado consultando únicamente planteles completados (`datos_completados == true`), eliminando el escaneo masivo de las 1.221 escuelas y consumiendo menos de 0.05% de la cuota diaria gratuita.
- **Estatus de Matrícula Interactivo (Doble Pestaña):** Activación de recuentos reales de planteles 'Cargados' y 'Pendientes' para autoridades estadales, con visualización por pestañas ("Planteles Cargados" con detalle de municipio y alumnos, y "Por Municipios" con el resumen de los 23 municipios).
- **Botón de Sincronización Estadal (`btn-sync-matricula-mun`):** Habilitación del botón "🔄 Sincronizar" para `superadmin` y `zonadmin` con depuración de caché en `sessionStorage` y recálculo instantáneo.

---

### v2.14.11 (24 de Septiembre de 2026)

- **Corrección de Sumatoria Global de Matrícula:** Se integraron los totales de las modalidades **Especial** y **Adulto** en el cómputo final de la institución (`total-gen-fem`, `total-gen-mas` y `total-gen`), asegurando que al guardar no se sobreescriban en cero ni sean eliminados por la escoba digital.
- **Detección y Estatus en Panel Administrativo (`munadmin` / `zonadmin`):** Optimización del verificador de matrícula para reconocer la estructura multinivel de Especial y Adulto, pasando el estatus institucional a 'Matrícula Declarada' y mostrando la cantidad exacta de alumnos en las métricas y en la ficha del plantel.
- **Sincronización de Campo Maestro:** Registro explícito del atributo `matricula-total` en Firestore e hidratación inmediata al consultar el formulario del plantel.

---

### v2.14.10 (23 de Septiembre de 2026)

- **Seguridad y Control de Acceso por Rol (RBAC):** Se restringió la visibilidad y el uso del botón "➕ Nuevo Plantel" exclusivamente a usuarios con roles **Superadmin** y **Coordinador Zonal (`zonadmin`)**.
- **Protección para Coordinadores Municipales (`munadmin`):** Ocultamiento estricto del botón de creación en la interfaz y bloqueo a nivel de validación lógica para impedir apertura o guardado no autorizado del modal de planteles.

---

### v2.14.9 (23 de Septiembre de 2026)

- **Soporte de Matrícula y Secciones por Grupos para Modalidad Adulto:** Implementación de captura dinámica de matrícula organizada en Grupos (Grupo A, Grupo B, Grupo C...) para instituciones de Educación de Adultos que no operan bajo planes de estudio tradicionales.
- **Motor Reactivo:** Input maestro "Cantidad de Grupos", generación automática de tarjetas con discriminación por sexo (FEM y MAS) y sumatoria en tiempo real a la matrícula general del colegio.
- **Ficha Administrativa:** Desglose detallado por grupo en el expediente del plantel dentro del panel administrativo.

---

### v2.14.8 (23 de Septiembre de 2026)

- **Soporte de Matrícula y Secciones por Grupos para Modalidad Especial:** Creación del bloque dinámico `#bloque-especial` que permite a las escuelas de Educación Especial ingresar matrícula y secciones organizadas en Grupos (Grupo A, B, C...).
- **Cálculo y Persistencia:** Sumatoria automática por género, cálculo instantáneo del total de la modalidad y almacenamiento estructurado en Firestore.
- **Estabilización de Jerarquía DOM:** Corrección estricta de balanceo de etiquetas HTML, resolviendo desalineaciones que causaban pantalla en blanco tras el inicio de sesión.
- **Robustecimiento de Enrutamiento:** Soporte integral para directores bajo roles `plaadmin` y `plant`.

---

### v2.14.7 (23 de Septiembre de 2026)

- **Persistencia de Sesión por Pestaña:** Configuración de `browserSessionPersistence` en Firebase Auth para preservar la sesión activa al presionar F5 o refrescar la pantalla en la misma pestaña del navegador.
- **Sincronización Global de Indicadores de Versión:** Unificación visual del badge de versión en Login, Navbar de Directores, Título de la pestaña (`<title>`) y cabecera del Panel Administrativo.

---

### v2.14.6 (23 de Septiembre de 2026)

- **Visualización Condicional para Planteles sin Plan de Estudio:** Ocultamiento total de formularios de matrícula y secciones para planteles regulares que no posean planes asignados.
- **Aviso Institucional:** Despliegue automático de tarjeta informativa destacada con la orientación: "Comuníquese con el responsable de Gestión Humana Municipal, para orientaciones".

---

### v2.14.5 (23 de Septiembre de 2026)

- **Flexibilización de Validaciones en Modal de Planteles:** Campos de Metros Cuadrados y Observaciones marcados como opcionales.
- **Validación Cruzada Nivel/Modalidad:** Exigencia de al menos uno de los dos campos (Nivel o Modalidad) sin obligar a llenar ambos.
- **Exención de Planes:** Selección de planes de estudio opcional para modalidades Especial y Adulto.

---

### v2.14.4 (23 de Septiembre de 2026)

- **Reorganización de Métricas Principales:** Reposicionamiento de la tarjeta de Usuarios del Sistema en primer lugar, seguida de Planteles y Personal.
- **Alineación y Centrado CSS:** Centrado horizontal armónico de la cuadrícula de métricas maestras (`.stats-grid`).

---

### v2.14.3 (23 de Septiembre de 2026)

- **Corrección de Inicialización en Pestaña Planteles:** Reubicación de variables de estado para evitar bloqueos por Zona Muerta Temporal (TDZ) y garantizar la carga inmediata de la tabla municipal.

---

### v2.14.2 (23 de Septiembre de 2026)

- **Estatus de Matrícula en Vivo con Escudo Zero-Cost:** Indicador interactivo de planteles con matrícula cargada vs pendiente, botón de sincronización manual y caché unificada en memoria (1 sola lectura a Firestore por sesión).

---

### v2.14.1 (23 de Septiembre de 2026)

- **Optimización de Desglose de Matrícula:** Reestructuración de la ficha de matrícula en modales para reflejar niveles Inicial, Primaria, Media General y Técnica con navegación fluida.

---

### v2.14.0 (23 de Septiembre de 2026)

- **Suite de Supervisión Institucional:** Modo supervisor de solo lectura para coordinadores municipales y ficha rápida de auditoría de planteles.

---

### v2.13.0 a v2.13.4 (22 de Septiembre de 2026)

- **Blindaje Zero-Cost en Estadísticas:** Ficha resumen precomputada para métricas globales y estadales con consumo nulo de cuotas en consultas masivas.
- **Contador Real de Usuarios:** Sincronización precisa de usuarios registrados.
- **Tratamiento Resiliente de Métricas:** Manejo elegante de estados pendientes de cómputo.

---

### v2.12.0 a v2.12.5 (21 y 22 de Septiembre de 2026)

- **Panel de Métricas Nivel Estadal (`zonadmin`):** Métricas consolidadas del estado Mérida con selectores dinámicos en cascada (Municipio / Parroquia).
- **Indicadores de Carga y Responsividad:** Spinners visuales corporativos, optimización UTF-8 sin caracteres corruptos y compatibilidad con dispositivos móviles.
- **Nombres Oficiales de Roles:** Estandarización de nomenclaturas institucionales en el panel de validación de usuarios.

---

### v2.11.0 a v2.11.27 (Septiembre de 2026)

- **Gestión de Planteles por Jurisdicción:** Filtro de planteles según el municipio del usuario `munadmin`.
- **Exportación de Nómina a Excel (.xlsx):** Descarga instantánea de los 55 campos de personal en formato Excel sin costos de lectura en Firestore.
- **Catálogos Maestros:** Selectores vinculados a catálogos centralizados en caché local.

---

### v2.6.0 a v2.8.1 (Agosto de 2026)

- **Módulo de Personal Existente:** Tabla resumen de personal previa al registro con scroll dinámico.
- **Buscador Client-Side Zero-Cost:** Filtrado en tiempo real por cédula y nombre con 0 lecturas adicionales a la base de datos.
- **Candado de Navegación y Formulario de Matrícula:** Validación jerárquica de acceso para planteles educativos.
