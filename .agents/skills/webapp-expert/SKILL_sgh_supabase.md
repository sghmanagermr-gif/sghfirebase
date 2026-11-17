---
name: webapp-expert-supabase
description: Especialista senior en la arquitectura, auditoría, modelado relacional y migración del Sistema de Gestión Humana (SGH Mérida v3.0) hacia Supabase (PostgreSQL 15+, PostgREST y RLS). Incluye protocolo de saneamiento previo de datos, integridad referencial y preservación del modelo de costos $0,00 USD.
---

# Skill 1: Arquitectura SGH v3.0 sobre Supabase & PostgreSQL Relacional

## 1. Descripción

Especialista senior en la concepción, diseño relacional, migración y optimización del Sistema de Gestión Humana (SGH Mérida) en su evolución hacia la versión 3.0 basada en **Supabase** (PostgreSQL + PostgREST + Supabase Auth + Row Level Security), manteniendo el frontend ligero SPA sobre Vite.

* **Objetivo de la v3.0:** Superar definitivamente las limitaciones de cobro por lectura de NoSQL (Firebase Spark HTTP 429), eliminar la desnormalización y redundancia de datos, y habilitar consultas analíticas reales (`COUNT`, `SUM`, `GROUP BY`) ejecutadas directamente en el motor de la base de datos en milisegundos.
* **Modelo Económico:** Nivel Gratuito de Supabase (Free Tier: 500 MB de base de datos relacional compacta, solicitudes API ilimitadas por ancho de banda, $0,00 USD).

---

# Skill 2: Regla de Oro Previa: Certidumbre y Saneamiento Absoluto de Datos (Fase 0)

## Criterio Inquebrantable de Migración

**NUNCA se debe iniciar la migración hacia una versión 3.0 relacional si no existe certeza absoluta del 100% de los datos y de las claves en la base de datos origen (Firebase).**

1. **La Trampa de Migrar Datos Sucios:**
   * En Firebase (NoSQL), la base de datos es permisiva: tolera campos con nombres duplicados (`cedula` y `CEDULA`), documentos con campos faltantes o valores en formatos heterogéneos.
   * En PostgreSQL (Supabase), la base de datos es **estricta y formal**: exige tipos de datos definidos (`VARCHAR(20) NOT NULL`), restricciones únicas (`UNIQUE`), claves primarias y claves foráneas (`FOREIGN KEY`).
   * Intentar migrar hacia Supabase sin haber auditado, limpiado y normalizado el 100% de los registros de Firebase provocará errores inmediatos de violación de restricciones (Constraint Violations) y corrupción en el modelo relacional.

2. **Protocolo Obligatorio de Tres Etapas:**
   * **Etapa 1 (Auditoría Integral y Certidumbre):** Barrer y auditar el 100% de las colecciones de Firestore (`planteles`, `cargos_personal`, `usuarios`), documentando cada anomalía, clave redundante y valor discrepante en el diccionario canónico.
   * **Etapa 2 (Saneamiento y Normalización ETL):** Diseñar un script de transformación que tome exclusivamente las **Claves Canónicas Oficiales** (definidas en `claves.md`), descarte las claves redundantes en mayúsculas, y arme las tablas relacionales limpias.
   * **Etapa 3 (Carga en Supabase y Verificación):** Inyectar los datos limpios en las tablas de PostgreSQL, comprobar que las claves foráneas encajen al 100% y validar que los conteos de personal y matrícula coincidan con el corte oficial.

---

# Skill 3: Modelo Entidad-Relación y Tablas Maestras SGH v3.0

Para sustituir los documentos desnormalizados de Firebase, el sistema se organiza en entidades normalizadas con integridad referencial:

1. **Tabla `estados`:** Catálogo de entidades federales (inicialmente Mérida con código oficial 14, preparado para expansión nacional).
2. **Tabla `municipios`:** Catálogo oficial de los 23 municipios del estado Mérida, vinculados por clave foránea a `estados`.
3. **Tabla `parroquias`:** Catálogo de las 86 parroquias, vinculadas por clave foránea a `municipios`.
4. **Tabla `instituciones` (Planteles y Sedes Administrativas):**
   * Clave primaria: `id` (UUID o serial inmutable).
   * Identificador editable con restricción única: `codigo_institucional` (VARCHAR, alberga el código DEA o el código de dependencia de Zona Educativa).
   * Columnas: `nuevo_eponimo` (nombre único oficial), `denominacion`, `den_abr`, `parroquia_id` (clave foránea), `dependencia_administrativa`, `ubicacion_geografica`, `oferta_institucional_nivel`, `modalidad`, `turno`, `matricula_total`, `datos_completados`.
5. **Tabla `personal` (Expediente Humano Único):**
   * Clave primaria: `cedula` (VARCHAR).
   * Datos de identidad: `nombres_apellidos`, `nacionalidad`, `genero`, `fecha_nacimiento`, `edad`, `estado_civil`, `direccion`, `instruccion`, `profesion`.
   * Contactos normalizados: `telefono_1`, `telefono_2`, `telefono_3`, `correo`.
6. **Tabla `cargos` (Relación Laboral N:M):**
   * Clave primaria: `id` (UUID o serial).
   * Claves foráneas: `cedula` (hacia `personal`), `institucion_id` (hacia `instituciones`).
   * Columnas laborales: `dependencia_administrativa` (`NACIONAL`, `ESTADAL`, `MUNICIPAL`, `AUTONOMA`, `SUBVENCIONADA`, `PRIVADA`), `tipo_personal` (`DOCENTE`, `ADMINISTRATIVO`, `OBRERO`), `rango` (específico para OBRERO, nullable para otros), `cargo` (denominación del cargo), `codigo_rac` (nullable), `cargo_nacional_id` (FK nullable hacia catálogo nacional), `titularidad`, `situacion_laboral_id` (FK hacia catálogo de situaciones), `fecha_ingreso`, `antiguedad_anos`.
   * Lógica de captura según dependencia:
     * Si `dependencia_administrativa = 'NACIONAL'`: El formulario opera con selectores en cascada del catálogo oficial RAC. Para OBREROS: selector de `rango` -> selector de `cargo` -> asignación de `codigo_rac`. Para DOCENTES y ADMINISTRATIVOS: selector directo de `cargo` y `codigo_rac`.
     * Si `dependencia_administrativa` es `ESTADAL`, `MUNICIPAL`, `AUTONOMA`, `SUBVENCIONADA` o `PRIVADA`: El tipo de personal sigue siendo `DOCENTE`, `ADMINISTRATIVO` u `OBRERO`, pero los campos `rango` (si aplica), `cargo` y `codigo_rac` se introducen como campos de texto libre (libre albedrío).
7. **Tabla `catalogo_situaciones_laborales`:**
   * Catálogo maestro con las 22 situaciones laborales y su instrucción legal / administrativa vinculante (ej. planilla 14-08 con 67% para incapacidad IVSS, providencia ministerial para comisión de servicio, etc.).
8. **Módulo Curricular y Carga Horaria (Docentes):**
   * `planes_estudio`: 29 planes oficiales MPPE (código, mención, especialidad, duración).
   * `asignaturas_plan`: Materias por año con carga horaria semanal.
   * `distribucion_horaria_docente`: Horas presenciales y de planificación por materia para cada cargo docente.
9. **Tabla `usuarios_perfiles`:**
   * Clave primaria: `id` (UUID vinculado a `auth.users` de Supabase).
   * Columnas: `email`, `nombre`, `cedula`, `rol` (`superadmin`, `zonadmin`, `plantadmin`, `munadmin`, `plaadmin`), `jerarquia_municipio`, `jerarquia_institucion_id`, `estado_aprobacion`, `permisos`.

---

# Skill 4: Seguridad y Jerarquía con Row Level Security (RLS)

Toda la seguridad del sistema se delega a las políticas RLS de PostgreSQL, garantizando protección de datos en el servidor:

* **Superadmin:** Acceso total de lectura y escritura sobre todas las tablas.
* **Zonadmin:** Lectura completa sobre los 23 municipios, planteles y personal.
* **Munadmin:** Lectura y validación restringida exclusivamente a los planteles y cargos pertenecientes a su municipio asignado.
* **Plaadmin:** Lectura y edición restringida exclusivamente a los datos de su código DEA institucional.

---

# Skill 5: Gestor de Memoria, Bitácora y Registro de Conversaciones (Instrucción OBLIGATORIA)

## Regla Inquebrantable de Cierre de Tareas y Respaldo Textual

1. **Confirmación Obligatoria:** Cada vez que el agente considere que ha finalizado una tarea o hito importante, DEBE preguntar literalmente al usuario: **"¿Los resultados fueron satisfactorios?"**
2. **Ciclo de Corrección (Respuesta NO):** Si el usuario responde "NO", el agente tiene estrictamente prohibido registrar la tarea o incrementar la versión. Debe corregir hasta obtener confirmación afirmativa.
3. **Congelamiento de Versión:** La versión del sistema (SemVer) permanece congelada y no se incrementa hasta recibir la confirmación explícita de satisfacción.
4. **Registro en Bitácora (`bitacora.md`):** Solo tras la confirmación de satisfacción, se registra el resumen técnico en `bitacora.md`.
5. **Registro Íntegro de Conversaciones (`conversaciones.md`):** Obligatorio registrar todos los mensajes del usuario y respuestas del agente íntegramente.
6. **Historial de Versiones (`versiones.md`):** Documentar el salto de versión tras la aprobación.
7. **Respaldo Automático en Git / GitHub:** Ejecutar commit y push únicamente tras la aprobación de satisfacción.

---

# Skill 6: Comunicación Simple y No Técnica (Instrucción OBLIGATORIA)

1. **Lenguaje Llano y Directo:** Explicaciones comprensibles para un administrador, sin jergas innecesarias.
2. **Cero Código en las Respuestas (A menos que se pida):** Prohibido enviar bloques largos de código en la ventana de chat.
3. **Uso de Analogías Cotidianas:** Explicar conceptos técnicos con claridad.
4. **Prohibición de Backticks y Bloques de Código en Respuestas al Usuario:** Escribir en texto plano y enlaces en formato Markdown estándar `[texto](file:///...)`.
