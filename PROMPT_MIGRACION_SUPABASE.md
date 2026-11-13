# PROMPT MAESTRO DE CONSULTORÍA TÉCNICA: MIGRACIÓN DE SGH WEBAPP (FIREBASE FIRESTORE A SUPABASE POSTGRESQL)

## INSTRUCCIÓN PARA EL MODELO DE IA
Actúa como un **Arquitecto Principal de Bases de Datos Cloud y Especialista en Migraciones de Alto Rendimiento (PostgreSQL, Supabase, Seguridad RLS y Frontend Vanilla JS / Vite)**. 

Tu misión es recibir la descripción arquitectónica, volumen de datos y requerimientos operativos del **Sistema de Gestión Humana (SGH v2.37.1)** y generar una **propuesta técnica completa, detallada y ejecutable** para migrar su almacenamiento y autenticación desde **Google Firebase (Firestore NoSQL, Plan Spark)** hacia **Supabase (PostgreSQL relacional)**, maximizando el aprovechamiento de su plan gratuito sin restricciones artificiales de lectura.

---

## 1. CONTEXTO INSTITUCIONAL Y ENVERGADURA DEL SISTEMA

* **Nombre del Sistema:** Sistema de Gestión Humana (SGH v2.37.1).
* **Organización:** Dirección de Educación / Jefatura de Gestión Humana del Estado Mérida, Venezuela.
* **Propósito:** Registro, control de nómina y auditoría laboral continua de las instituciones educativas públicas y su personal dependiente en toda la entidad federal.
* **Volumen de Datos Actual:**
  * **División Político-Territorial:** 23 Municipios y 86 Parroquias plenamente estructurados.
  * **Planteles Educativos:** ~1.100 instituciones clasificadas en cuatro dependencias: Nacional, Estadal, Municipal y Subvencionado.
  * **Expedientes de Personal:** 23.031+ registros activos en la colección principal (`cargos_personal`), abarcando tres tipos de personal: Docente, Administrativo y Obrero.
  * **Cuentas de Usuario:** ~1.000 usuarios jerárquicos (`superadmin`, `munadmin`, `plaadmin`).
  * **Campos Críticos por Registro de Cargo:** Cédula de identidad, primer y segundo nombre, primer y segundo apellido, sexo, fecha de nacimiento, tipo de personal, dependencia institucional, código DEA del plantel de adscripción, nombre del plantel, municipio, parroquia, condición de nombramiento, situación laboral (Activo, Incapacitado, Comisión de Servicio, Reposo Médico, Adecuación Laboral, etc.), código de cargo, denominación del cargo, horas de recibo, horas de aula, turno de trabajo (Mañana, Tarde, Integral), observaciones institucionales y metadatos de auditoría.

---

## 2. ARQUITECTURA TÉCNICA ACTUAL DEL CLIENTE (`webapp`)

* **Naturaleza del Frontend:** Single Page Application (SPA) modular y ligera, construida sobre **Vite** en JavaScript Vanilla moderno (ES Modules estándar, sin frameworks pesados como React o Angular), Tailwind CSS y SheetJS (`xlsx`) para exportación masiva.
* **Estructura Modular Clave:**
  * `src/main.js`: Orquestador principal, enrutamiento condicional de vistas, modales globales y cálculo de estadísticas visuales.
  * `src/admin.js`: Panel de control administrativo, gestión de usuarios, reportería estadística y el módulo crítico **Auditor de Cédulas**.
  * `src/auth.js`: Control de ciclo de vida de autenticación, manejo de persistencia por pestaña (`browserSessionPersistence`), verificación de roles y restricción de jornadas por municipio activo.
  * `src/personalWizard.js`: Asistente por pasos para la creación y edición de expedientes de personal con validaciones en vivo de carga horaria, turnos y asignaturas.
  * `src/dbUtils.js`: Capa de abstracción de datos y sanitizador global recursivo (conversión automática a mayúsculas, protección de correos y limpieza de cadenas).
  * `src/geografia.js`: Catálogo y normalizador de municipios y parroquias del estado.
  * `src/catalogosPlanes.js`: Mallas curriculares, códigos de planes de estudio y tablas de asignaturas oficiales.

---

## 3. PROBLEMÁTICA CRÍTICA CON EL MODELO ACTUAL (FIREBASE FIRESTORE - PLAN SPARK)

1. **Cuota Severa de Lecturas Diarias (50.000 lecturas/día):**
   * Firestore factura cada documento obtenido como una lectura independiente.
   * Ejecutar una auditoría analítica global o simultánea sobre los 23.031 registros consume más del 46% de la cuota total diaria en una sola pasada.
   * La concurrencia de directores actualizando datos agota rápidamente el límite, arrojando errores HTTP 429 (`RESOURCE_EXHAUSTED / Quota exceeded`).
2. **Congelamiento de Consultas en Dispositivos Móviles:**
   * Ante el código de saturación 429 de Firestore, el SDK cliente de Firebase entra en un bucle continuo de reintentos exponenciales (*exponential backoff*).
   * Como la promesa de red no se rechaza de inmediato, el navegador del celular mantiene el indicador de carga (*spinner*) girando indefinidamente, inutilizando el **Auditor de Cédulas** en teléfonos móviles.
3. **Ausencia de Relaciones Nativas (NoSQL Denormalizado):**
   * El código DEA y el municipio están duplicados en cada uno de los 23.031 registros. Si un plantel corrige su código DEA o su denominación, el sistema debe ejecutar actualizaciones masivas en lote documento por documento, consumiendo la cuota diaria de escrituras (límite de 20.000/día).
4. **Búsquedas de Texto Rígidas:**
   * Firestore no soporta búsquedas insensibles a mayúsculas/minúsculas ni coincidencias parciales nativas sin recurrir a índices externos de pago (Algolia/Typesense) o descargas excesivas a memoria.

---

## 4. PLATAFORMA OBJETIVO: SUPABASE (POSTGRESQL RELACIONAL)

Se requiere canalizar el sistema hacia **Supabase** para capitalizar las bondades de su nivel gratuito:
* **Base de datos PostgreSQL 15+ dedicada:** 500 MB de almacenamiento (suficiente para más de 300.000 registros relacionales de texto estructurado).
* **Peticiones API Ilimitadas:** Sin cuota por lectura de filas vía PostgREST.
* **Seguridad por Filas (Row Level Security - RLS):** Control de acceso granular gobernado a nivel de motor SQL.
* **Supabase Auth:** Autenticación JWT integrada compatible con la persistencia en navegador existente.
* **Consultas Relacionales Indexadas:** Tiempos de respuesta sub-10ms en búsquedas por cédula o código institucional gracias a índices B-Tree nativos.

---

## 5. ENTREGABLES REQUERIDOS DEL ESPECIALISTA

Por favor, estructura tu respuesta en los siguientes apartados técnicos exhaustivos:

### A. Diseño del Esquema Relacional de Base de Datos (DDL en PostgreSQL)
* Genera el script SQL completo para crear las tablas necesarias:
  * `municipios` y `parroquias`.
  * `planteles` (con su código DEA como identificador único, dependencia, turnos y matrícula).
  * `cargos_personal` (con claves foráneas hacia `planteles`, `municipios` y `parroquias`, tipos `ENUM` para situaciones laborales y dependencias, y restricciones `CHECK`).
  * `perfiles_usuarios` (vinculada con `auth.users` de Supabase, almacenando el rol y el alcance geográfico o de plantel).
* Implementa claves foráneas con reglas de integridad referencial (`ON UPDATE CASCADE`).
* Diseña los índices B-Tree y GIN óptimos para acelerar la búsqueda de cédulas, nombres, códigos DEA y reportes de auditoría municipal.

### B. Políticas de Seguridad RLS (Row Level Security)
* Define las directivas de seguridad en SQL (`CREATE POLICY`) para garantizar:
  1. `superadmin`: Acceso total de lectura, inserción, actualización y eliminación sobre todas las tablas.
  2. `munadmin`: Lectura y actualización restringida exclusivamente a los planteles y cargos de su municipio asignado.
  3. `plaadmin`: Lectura y actualización restringida exclusivamente al plantel y los cargos vinculados a su código DEA.

### C. Estrategia de Adaptación del Código Frontend (`webapp`)
* Explica cómo instalar e inicializar `@supabase/supabase-js` en el entorno Vite existente.
* Proporciona la equivalencia de código para sustituir `firebase/auth` y `firebase/firestore` en `src/auth.js` y `src/dbUtils.js`.
* Diseña la función optimizada para el **Auditor de Cédulas** en JavaScript, garantizando:
  * Consulta directa con índice B-Tree.
  * Límite de tiempo de espera estricto (timeout de 3 segundos con `AbortController`).
  * Manejo seguro de errores en caso de intermitencia de datos móviles en el celular.

### D. Procedimiento de Migración de Datos (Pipeline ETL)
* Describe el método más limpio y seguro para extraer los 23.031 registros actuales desde Firestore (en formato JSON) e inyectarlos masivamente en las nuevas tablas de Supabase respetando la integridad referencial y resolviendo inconsistencias históricas.

### E. Análisis de Viabilidad y Consumo en el Free Tier de Supabase
* Evalúa detalladamente si el volumen de datos del SGH (23.031 cargos + 1.100 planteles + usuarios) y el tráfico estimado de auditorías opera con holgura dentro de los límites gratuitos de Supabase (500 MB de disco, transferencias de salida mensuales, conexiones activas de Postgres y límites de Edge API).
