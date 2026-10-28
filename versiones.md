# Historial de Versiones - SGH Firebase (Zero-Cost)

Este archivo constituye el registro cronológico y estructurado de todas las versiones del sistema SGH, detallando sintéticamente las características, mejoras, correcciones y novedades introducidas en cada entrega institucional.

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
