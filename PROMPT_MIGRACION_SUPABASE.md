# PROMPT MAESTRO DE CONSULTORÍA ARQUITECTÓNICA: EVOLUCIÓN Y MIGRACIÓN DEL SISTEMA DE GESTIÓN HUMANA (SGH) A SUPABASE (POSTGRESQL)

## INSTRUCCIÓN PARA EL MODELO DE IA
Actúa como un **Arquitecto Principal de Software, Especialista en Bases de Datos Relacionales (PostgreSQL/Supabase) y Consultor Senior en Modernización de Sistemas Web**.

Tu misión es analizar la arquitectura global, volumen de información, fortalezas operativas y limitaciones estructurales del **Sistema de Gestión Humana (SGH v2.37.1)**, y diseñar una propuesta integral para evolucionar su capa de persistencia y seguridad desde una base de datos documental NoSQL (Google Firebase Firestore) hacia una plataforma relacional de alto rendimiento como **Supabase (PostgreSQL + PostgREST + Supabase Auth + Row Level Security)**.

---

## 1. VISIÓN GENERAL Y ALCANCE DEL SISTEMA SGH

* **Propósito:** Plataforma integral para el registro, control de adscripción, auditoría de carga horaria y gestión de nómina educativa del Estado Mérida, Venezuela.
* **Escala y Dimensión Institucional:**
  * **División Geográfica:** 23 Municipios y 86 Parroquias.
  * **Unidades Operativas (Planteles):** ~1.100 instituciones educativas distribuidas en dependencias Nacional, Estadal, Municipal y Subvencionado.
  * **Población Laboral Registrada:** ~23.000 a 25.000 expedientes activos clasificados en tres sectores: Docente, Administrativo y Obrero.
  * **Comunidad de Usuarios:** Alrededor de 1.000 usuarios concurrentes o periódicos estructurados en tres niveles jerárquicos:
    * `superadmin`: Nivel directivo estadal (Jefatura de Gestión Humana / Desarrollador), con supervisión y control total del estado.
    * `munadmin`: Coordinadores municipales, con visibilidad y control sobre las instituciones de su jurisdicción.
    * `plaadmin`: Directores de planteles educativos, encargados de la actualización del personal adscrito a su sede.

---

## 2. ARQUITECTURA TECNOLÓGICA DEL CLIENTE (`webapp`)

* **Frontend:** Single Page Application (SPA) modular desarrollada con **Vite** en **JavaScript Vanilla moderno (ES Modules)**, con estilos en CSS3 / Tailwind CSS y utilidades para procesamiento en cliente (SheetJS `xlsx`).
* **Módulos Fundamentales:**
  * `src/main.js`: Enrutamiento ligero, orquestación del dashboard, cálculo de métricas y gestión de modales.
  * `src/admin.js`: Panel administrativo, gestión de credenciales y roles, reportes consolidados y herramientas de búsqueda y auditoría.
  * `src/auth.js`: Control de sesiones de usuario, persistencia por pestaña y verificación de jerarquías.
  * `src/personalWizard.js`: Flujo guiado para ingreso y edición de personal, con validación de coherencia en asignaturas, turnos y carga horaria semanal.
  * `src/dbUtils.js`: Capa de abstracción para lectura/escritura y sanitización recursiva de datos (normalización a mayúsculas, protección de correos y limpieza de cadenas).
  * `src/geografia.js` y `src/catalogosPlanes.js`: Módulos de referencia estática (municipios, parroquias, códigos de planes de estudio y denominaciones de cargos).

---

## 3. ANÁLISIS DE FORTALEZAS Y DEBILIDADES DEL SISTEMA ACTUAL

### Fortalezas del SGH:
1. **Frontend Ligero y Veloz:** Al estar construido en JavaScript Vanilla sin sobrecarga de frameworks, la carga inicial es prácticamente instantánea y consume muy poca memoria en los navegadores.
2. **Lógica de Negocio y Validaciones Maduras:** Reglas institucionales consolidadas para el cruce de turnos, coherencia de horas (recibo vs aula), control de situaciones laborales (Activo, Incapacitado, Comisión de Servicio, Reposo, Adecuación) y normalización de datos en cliente.
3. **Flujos de Trabajo Adaptados al Usuario:** Asistentes paso a paso y paneles diferenciados por rol que ya son familiares para directores y supervisores municipales.

### Debilidades y Limitaciones del Modelo NoSQL Actual (Firestore):
1. **Carencia de Integridad Referencial Nativa:** En el modelo NoSQL documental, la información del plantel (código DEA, nombre, municipio) y del personal están desnormalizadas. Si un plantel modifica su denominación o código institucional, se requiere actualizar miles de documentos individuales, arriesgando desincronización o inconsistencia de datos.
2. **Incompatibilidad con Consultas Analíticas y Agregaciones:** Firestore cobra y procesa cada documento leído individualmente. Obtener estadísticas globales por municipio (como cantidad de escuelas por dependencia, horas docentes por turno o totales por tipo de personal) exige descargar colecciones completas al navegador en lugar de ejecutar una consulta agregada (`GROUP BY`, `SUM`, `COUNT`) en el motor de la base de datos.
3. **Consultas Complejas y Búsquedas Limitadas:** Dificultad para realizar búsquedas insensibles a mayúsculas/minúsculas, cruces relacionales entre planteles y personal, o filtros multi-condicionales sin crear una multiplicidad de índices compuestos rígidos.
4. **Economía de Operación en Capas Gratuitas:** Los límites de lectura por documento en bases de datos NoSQL penalizan las auditorías masivas periódicas, mientras que los motores relacionales evalúan consultas en memoria y servidor sin penalización por fila leída.

---

## 4. OPORTUNIDADES AL MIGRAR A SUPABASE (POSTGRESQL)

* **Motor Relacional Maduro (PostgreSQL 15+):** Relaciones 1:N y N:M con claves foráneas, restricciones de integridad y cascadas automáticas (`ON UPDATE CASCADE`).
* **Vistas SQL y Funciones Agregadas:** Capacidad de generar vistas (`VIEW` o `MATERIALIZED VIEW`) y funciones RPC que calculen resúmenes estadísticos municipales en milisegundos directamente en el servidor.
* **Seguridad Declarativa con RLS (Row Level Security):** Delegación de la seguridad jerárquica (`superadmin`, `munadmin`, `plaadmin`) a nivel de base de datos, garantizando que un usuario jamás reciba datos ajenos a su jurisdicción.
* **APIs Instantáneas (PostgREST):** Consumo directo desde JavaScript con una sintaxis limpia, fluida y con soporte para filtros relacionales profundos.
* **Aprovechamiento del Nivel Gratuito de Supabase:** 500 MB de base de datos relacional (espacio de sobra para ~30.000 registros tabulares), solicitudes API sin límite de lecturas por fila y autenticación integrada (Supabase Auth).

---

## 5. REQUERIMIENTOS DE LA CONSULTORÍA (ENTREGABLES DEL EXPERTO)

Como especialista, por favor desarrolla una propuesta técnica exhaustiva organizada en los siguientes puntos:

### A. Modelo Entidad-Relación y Esquema Relacional (DDL PostgreSQL)
* Diseña la estructura de tablas normalizada: `municipios`, `parroquias`, `planteles`, `personal`, `cargos` y `usuarios_perfiles`.
* Define tipos de datos precisos, claves primarias, claves foráneas con reglas de actualización, enumeraciones (`ENUM`) para situaciones laborales y tipos de personal, y restricciones `CHECK` para control de horas y turnos.
* Propón los índices B-Tree estratégicos para acelerar búsquedas frecuentes (cédula, código DEA, nombres y filtros por dependencia).

### B. Vistas de Auditoría y Reportería Analítica
* Diseña vistas SQL optimizadas para generar resúmenes automáticos por municipio (conteo de planteles por dependencia, desglose de personal docente/administrativo/obrero y porcentaje de completitud de expedientes), evitando transferir miles de filas al cliente.

### C. Estrategia de Seguridad Jerárquica con RLS
* Elabora las políticas de Row Level Security (`CREATE POLICY`) que modelen exactamente los tres roles del SGH:
  * Control total para el `superadmin`.
  * Filtro geográfico automático para el `munadmin` (sólo accede a registros pertenecientes a su municipio).
  * Filtro institucional para el `plaadmin` (sólo accede al plantel y cargos de su código DEA).

### D. Plan de Adaptación del Frontend (`webapp`)
* Explica cómo estructurar un nuevo módulo cliente `src/supabase.js` utilizando `@supabase/supabase-js`.
* Muestra cómo refactorizar `src/auth.js` y `src/dbUtils.js` para desacoplar Firebase y conectarse a Supabase conservando la arquitectura modular en JavaScript Vanilla y las validaciones de negocio ya existentes.

### E. Estrategia de Migración y Transición de Datos (ETL)
* Diseña una metodología clara para exportar la base de datos documental actual (JSON de Firestore), normalizar y depurar los datos, e insertarlos en el nuevo esquema relacional sin pérdida de trazabilidad ni duplicación de registros.
