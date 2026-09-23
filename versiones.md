# Historial de Versiones - SGH Firebase (Zero-Cost)

Este archivo constituye el registro cronológico y estructurado de todas las versiones del sistema SGH, detallando sintéticamente las características, mejoras, correcciones y novedades introducidas en cada entrega institucional.

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
