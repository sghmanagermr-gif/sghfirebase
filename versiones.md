# Historial de Versiones - SGH Firebase (Zero-Cost)

Este archivo constituye el registro cronológico y estructurado de todas las versiones del sistema SGH, detallando sintéticamente las características, mejoras, correcciones y novedades introducidas en cada entrega institucional.

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
