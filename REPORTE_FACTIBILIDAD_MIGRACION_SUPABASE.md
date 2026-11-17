# INFORME TÉCNICO DE CONSULTORÍA ARQUITECTÓNICA
## EVALUACIÓN DE FACTIBILIDAD, VIABILIDAD Y COMPLEJIDAD: MIGRACIÓN DE FIREBASE A SUPABASE (POSTGRESQL) PARA SGH MÉRIDA

**Fecha:** 15 de Noviembre de 2026  
**Sistema:** Sistema de Gestión Humana del Estado Mérida (SGH v2.38.6)  
**Autor:** Consultoría de Arquitectura de Software WebApp-Expert  

---

## 1. RESUMEN EJECUTIVO

A solicitud de la Administración del Sistema, se realizó una auditoría técnica profunda para evaluar el escenario de migrar la plataforma del Sistema de Gestión Humana (SGH) desde su infraestructura actual sobre **Google Cloud Firebase (Firestore NoSQL)** hacia un ecosistema relacional de código abierto basado en **Supabase (PostgreSQL + PostgREST + Supabase Auth)**.

### Veredicto Rápido de Tres Factores:
| Factor evaluado | Calificación | Veredicto | Resumen |
| :--- | :---: | :---: | :--- |
| **¿Es Factible?** | **10 / 10** | **TOTALMENTE FACTIBLE** | Técnicamente 100% posible. La naturaleza del SGH es relacional por excelencia. |
| **¿Es Viable?** | **9 / 10** | **ALTAMENTE VIABLE** | Resuelve de raíz el cobro por lectura de Firebase y otorga SQL analítico real. |
| **¿Es Fácil?** | **4 / 10** | **NO ES FÁCIL (COMPLEJIDAD MEDIA-ALTA)** | Exige refactorizar miles de líneas en el cliente, sanear datos y migrar accesos. |

---

## 2. ANÁLISIS DETALLADO POR FACTORES

### 2.1. ¿Es Factible? (Factibilidad Técnica: 100%)
La migración es **técnicamente impecable y natural**. 
El modelo de datos de Gestión Humana educativa no es un documento desestructurado, sino una jerarquía formal de entidades:
- 1 Estado subdividido en 23 Municipios y 86 Parroquias.
- ~1.639 Planteles educativos clasificados en 6 Dependencias.
- ~26.000 Funcionarios con cargos, cédulas, tipos de personal y horas semanales.
- Historiales de matrícula escolar por grado, nivel y sexo.

En Supabase, esto se modela en tablas relacionales con claves foráneas (Foreign Keys), restricciones de integridad referencial y cascadas automáticas (`ON UPDATE CASCADE`), impidiendo que queden registros huérfanos o con datos contradictorios.

---

### 2.2. ¿Es Viable? (Viabilidad Económica, Operativa y de Rendimiento: Muy Alta)

#### A. Ventajas Superiores de Supabase frente a Firebase:
1. **Fin del problema de las Cuotas por Lectura (HTTP 429):**
   - **Firebase Spark:** Cobra y limita por documento leído individual (50.000 lecturas/día). Leer 26.000 funcionarios dos veces agota la cuota diaria del estado.
   - **Supabase Free:** No limita por documento leído. Permite consultas SQL ilimitadas dentro de su ancho de banda mensual.
2. **Consultas Analíticas en Servidor (GROUP BY / COUNT / SUM):**
   - Para saber cuántos docentes masculinos hay en Alberto Adriani, Firebase obliga a descargar todos los documentos al navegador.
   - Supabase ejecuta la suma y conteo en el motor PostgreSQL en menos de 50 milisegundos y envía solo el número final al cliente.
3. **Capacidad de Almacenamiento Holgada:**
   - La capa gratuita de Supabase incluye 500 MB de base de datos PostgreSQL.
   - Todo el estado Mérida (26.000 trabajadores y 1.639 escuelas) ocupa aproximadamente entre 40 MB y 60 MB en tablas tabulares compactas, consumiendo apenas el 10% del espacio gratuito disponible.
4. **Seguridad Nativa con RLS (Row Level Security):**
   - Las reglas de acceso por rol (`zonadmin`, `munadmin`, `plantaadmin`, `plaadmin`) se programan directamente a nivel de base de datos con políticas de fila, garantizando que un director jamás pueda recibir datos de otro colegio, incluso si manipula el código del navegador.

#### B. La Condición Operativa de Supabase a Considerar:
- **Pausa por Inactividad (Free Tier):** En el plan gratuito de Supabase, si un proyecto no recibe ninguna petición durante 7 días continuos, entra en modo de pausa y requiere reactivación. En un sistema educativo activo durante el año escolar esto no ocurre, pero debe contemplarse durante los recesos vacacionales de agosto o diciembre.

---

### 2.3. ¿Es Fácil? (Evaluación de Esfuerzo, Fricción y Riesgos: NO ES FÁCIL)

Decir que migrar a Supabase es fácil sería una falta de honestidad técnica. La migración representa un esfuerzo considerable de reingeniería por las siguientes razones:

#### 1. Fuerte Acoplamiento del Frontend al SDK de Firebase:
La aplicación web del SGH cuenta con más de 15.000 líneas de código JavaScript modular distribuidas en:
- `admin.js`: ~8.700 líneas.
- `personalWizard.js`: ~3.000 líneas.
- `main.js`: ~3.500 líneas.
- `auth.js` y `dbUtils.js`: ~1.500 líneas.

En todos estos archivos existen cientos de llamadas directas al SDK de Firebase (`collection`, `getDocs`, `query`, `where`, `doc`, `updateDoc`, `setDoc`, `runTransaction`). Migrar a Supabase requiere sustituir metódicamente cada una de esas funciones por llamadas al cliente `@supabase/supabase-js` (`supabase.from('tabla').select().eq()`).

#### 2. Saneamiento Estricto de Datos (De NoSQL Permisivo a SQL Riguroso):
En Firebase Firestore, los documentos aceptaron variaciones históricas de nombres de campos:
- Cédulas guardadas como `cedula`, `cedula-identidad` o `CEDULA`.
- Códigos de plantel guardados como `codigoDEA`, `codigo-plantel` o `codigoPlantel`.
En PostgreSQL, una columna se llama estrictamente de una manera y tiene un tipo de dato inmutable (ej. `INTEGER` o `VARCHAR`). Se debe construir un proceso de extracción, transformación y carga (ETL) previo para garantizar que ningún dato quede descartado al insertarse.

#### 3. Migración de Cuentas de Usuario y Contraseñas:
Las contraseñas de los usuarios actuales están resguardadas en Firebase Authentication mediante el algoritmo de hash propietario de Google. No se pueden extraer en texto plano.
Para migrar los usuarios a Supabase Auth se requeriría:
- O bien importar los hashes usando herramientas avanzadas de consola.
- O bien forzar a los usuarios a un proceso de restablecimiento de contraseña mediante correo electrónico.

---

## 3. TABLA COMPARATIVA DIRECTA: FIREBASE VS. SUPABASE

| Característica / Criterio | Firebase Firestore (Actual) | Supabase PostgreSQL (Propuesto) |
| :--- | :--- | :--- |
| **Modelo de Datos** | Documental NoSQL (Colecciones y Documentos) | Relacional SQL (Tablas, Filas y Claves Foráneas) |
| **Límite de Lecturas (Plan Gratis)** | **50.000 documentos/día** (Riesgo HTTP 429) | **Sin límite por fila leída** (Basado en ancho de banda) |
| **Cálculo de Totales y Estadísticas** | Requiere descargar miles de registros al cliente | Se calcula en el servidor vía SQL (`COUNT`, `SUM`, `GROUP BY`) |
| **Integridad de Datos** | Manual en código (Riesgo de inconsistencias) | Nativa en motor (Restricciones `CHECK`, `FOREIGN KEY`) |
| **Búsquedas de Texto** | Limitadas y sensibles a mayúsculas | Búsquedas avanzadas (`ILIKE`, texto completo con índices gin) |
| **Complejidad de Migración** | Ya está funcionando y desplegado | Media-Alta (Requiere refactorizar ~15.000 líneas de frontend) |
| **Riesgo en Operación Activa** | Saturación de cuota en jornadas de alto tráfico | Curva de adaptación y tiempo de desarrollo |

---

## 4. CONCLUSIÓN Y RECOMENDACIÓN ESTRATÉGICA

### ¿Cuál es la ruta más inteligente para el SGH Mérida?

1. **Corto Plazo (Para la contingencia inmediata de hoy y mañana):**
   - **NO migrar a Supabase de forma apresurada en este momento.**
   - La arquitectura que dejamos preparada hoy con el **Corte Oficial en Google Sheets** resuelve el 100% de la emergencia de cuotas de Firebase sin costo, permite arrancar mañana con la base de datos real del viernes a las 8:00 p.m. y mantiene la estabilidad operativa del sistema.

2. **Mediano Plazo (Evolución de Nueva Generación - Fase SGH v3.0):**
   - **SÍ es altamente recomendable migrar a Supabase**, pero como un proyecto planificado y tranquilo.
   - **Metodología sugerida:**
     - Crear un repositorio o rama independiente (`git branch supabase-evolution`).
     - Diseñar el esquema SQL canónico en Supabase con sus tablas (`planteles`, `personal`, `matricula`, `usuarios`).
     - Probar el nuevo cliente `@supabase/supabase-js` módulo por módulo.
     - Cuando el sistema esté 100% probado en laboratorio, realizar el cambio definitivo sin interrumpir la operación escolar del estado.
