# 🔬 Diagnóstico Arquitectónico — Hoja "PERSONAL"
**Sistema:** SGH · **Documento:** Directorio Maestro de Mérida  
**Skill aplicado:** Google Apps Script Web App Architect  
**Fuentes:** Inspección visual directa en Google Sheets + Ingeniería inversa en `codigo.gs`

---

## 📊 Resumen Ejecutivo

| Parámetro | Valor |
|:---|:---|
| **Total de Columnas** | 89 (Col A → Col CK) |
| **Fila de Encabezados** | Fila 1 (Inmovilizada) |
| **Filas de Datos** | 23 (una por municipio de Mérida) |
| **Columnas con Datos Reales** | 0 — Todo es placeholder |
| **Fórmulas Activas** | ⚠️ 2 formulas MASIVAS en A2 y B2 |
| **Columnas Congeladas** | ❌ Ninguna |
| **Estado General** | 🔴 RIESGO CRÍTICO (arquitectura de agregación en Sheets) |

---

## ⚠️ ALERTA CRÍTICA: Fórmulas Vivas (Violación Regla de Oro 3)

> [!CAUTION]
> Esta hoja NO es una base de datos convencional. Es una **hoja de agregación centralizada** que usa fórmulas nativas de Google Sheets para consolidar datos de 23 fuentes externas (las hojas de plantel de cada municipio). Esto tiene consecuencias arquitectónicas gravísimas que debes comprender antes de cualquier cambio.

### Fórmula 1 — Celda `A2`
```
=ARRAYFORMULA(SI(B2:B="", "", FILA(B2:B)-1))
```
**Función:** Genera automáticamente la numeración de la columna CANTIDAD (col A) para cada fila que tenga cedula en col B.  
**Riesgo:** Si Apps Script escribe un valor directo en cualquier celda de la columna A, **destruye la ARRAYFORMULA** y corrompe toda la numeración.

### Fórmula 2 — Celda `B2` (**LA MÁS PELIGROSA**)
```
=SI.ERROR(QUERY({
    IMPORTRANGE("1sRp6XJx4L...", "PERSONAL!B2:CK");
    IMPORTRANGE("1nfTGbN7Wn...", "PERSONAL!B2:CK");
    ... (23 IMPORTRANGE en total)
  },
  "SELECT * WHERE Col1 IS NOT NULL", 0),
"")
```
**Función:** Esta fórmula consolida dinámicamente los registros de los 23 planteles de Mérida (uno por municipio) en esta hoja única. Importa las columnas B hasta CK de cada plantel.  
**Riesgo CRÍTICO:** Esta fórmula ocupa el rango B2:CK hasta donde haya datos. Si `guardarRegistroPersonal()` intenta hacer un `setValues()` en esta hoja, **sobrescribirá la fórmula y bloqueará la sincronización de todos los 23 planteles**.

---

## 🗂️ Mapeo Completo de Columnas (A→CK)

### BLOQUE 1 — Identificación Personal (A–P, índice 0-15)

| Col | Índice | Encabezado | Tipo de Dato | Notas |
|:---:|:---:|:---|:---|:---|
| A | 0 | CANTIDAD | Numérico (auto) | ⚡ Generado por ARRAYFORMULA. **No escribir aquí.** |
| B | 1 | CEDULA | Texto/Número | ⚡ Generado por QUERY+IMPORTRANGE. **Solo lectura.** |
| C | 2 | NACIONALIDAD | Texto (V/E) | Sincronizado desde plantel |
| D | 3 | NOMBRE Y APELLIDO | Texto | Sincronizado desde plantel |
| E | 4 | LUGAR DE NACIMIENTO | Texto | Sincronizado desde plantel |
| F | 5 | FECHA DE NACIMIENTO | Fecha | ⚠️ Riesgo de formato inconsistente (texto vs fecha) |
| G | 6 | EDAD | Numérico | Sincronizado; puede ser calculado en plantel |
| H | 7 | GENERO | Texto | Sincronizado desde plantel |
| I | 8 | TELEFONO HABITACION | Texto/Número | ⚠️ Mezcla probable texto-número |
| J | 9 | TELEFONO CELULAR | Texto/Número | ⚠️ Mezcla probable texto-número |
| K | 10 | TELEFONO OFICINA | Texto/Número | ⚠️ Mezcla probable texto-número |
| L | 11 | CORREO ELECTRONICO | Texto | Sincronizado desde plantel |
| M | 12 | ESTADO CIVIL | Texto | Sincronizado desde plantel |
| N | 13 | DIRECCION | Texto largo | Sincronizado desde plantel |
| O | 14 | NIVEL DE INSTRUCCIÓN | Texto | Sincronizado desde plantel |
| P | 15 | PROFESIÓN | Texto | Sincronizado desde plantel |

### BLOQUE 2 — Datos del Plantel y Ubicación (Q–AD, índice 16-29)

| Col | Índice | Encabezado | Tipo de Dato | Notas |
|:---:|:---:|:---|:---|:---|
| Q | 16 | ESTADO | Texto | Dato geográfico del plantel |
| R | 17 | MUNICIPIO | Texto | Dato geográfico del plantel |
| S | 18 | PARROQUIA | Texto | Dato geográfico del plantel |
| T | 19 | UBICACIÓN FÍSICA | Texto | Nombre del plantel |
| U | 20 | CODIGO DEL PLANTEL | Texto | Clave DEA |
| V | 21 | CODIGO DEPENDENCIA 1 | Texto | Código administrativo |
| W | 22 | CODIGO DEPENDENCIA 2 | Texto | Código administrativo |
| X | 23 | CODIGO ESTADISTICO | Texto | Código oficial |
| Y | 24 | DEPENDENCIA | Texto | Nacional/Estadal/Municipal |
| Z | 25 | UBICACIÓN GEOGRAFICA | Texto | Dirección/Sector |
| AA | 26 | NIVEL | Texto | Nivel educativo del plantel |
| AB | 27 | MODALIDAD | Texto | Tipo de institución |
| AC | 28 | TURNOS DEL PLANTEL | Texto | M/T/N o combinación |
| AD | 29 |  | Texto | División administrativa |

### BLOQUE 3 — Datos Laborales y Contractuales (AE–AR y BV–BW, índice 30-43 y 73-74)

| Col | Índice | Encabezado | Tipo de Dato | Notas |
|:---:|:---:|:---|:---|:---|
| AE | 30 | DEPENDENCIA LABORAL | Texto | |
| AF | 31 | TIPO PERSONAL | Texto | DOCENTE / ADMINISTRATIVO / OBRERO |
| AG | 32 | SUB CATEGORIA 1 TP | Texto | Sub-clasificación del tipo |
| AH | 33 | CARGO | Texto | Nombre del cargo oficial |
| AI | 34 | CODIGO RAC | Texto | Código de cargo |
| AJ | 35 | TITULAR | Texto | TITULAR / INTERINO / SUPLENTE |
| AK | 36 | HORAS ACADEMICAS | Numérico | ⚠️ Riesgo de almacenarse como texto |
| AL | 37 | HORAS ADMINISTRATIVAS | Numérico | ⚠️ Riesgo de almacenarse como texto |
| AM | 38 | FECHA DE INGRESO | Fecha | ⚠️ Alto riesgo de inconsistencia formato |
| AN | 39 | ANTIGUEDAD | Numérico/Texto | ⚠️ A veces "X años" (texto), a veces número |
| AO | 40 | TURNOS QUE ATIENDE | Texto | M/T/N o combinación |
| AP | 41 | ATIENDE MATRICULA | Texto (SI/NO) | Activa cuadratura en UI |
| AQ | 42 | NIVEL O MODALIDAD | Texto | |
| AR | 43 | ESPECIALIDAD QUE IMPARTE | Texto | Solo docentes |
| BV | 73 | SITUACIÓN DEL TRABAJADOR | Texto | ACTIVO / REPOSO / JUBILADO, etc. |
| BW | 74 | OBSERVACIÓN | Texto largo | Campo libre |

### BLOQUE 4 — Cuadratura / Planes de Estudio (AS–BU, índice 44-72)

| Col | Índice | Encabezado | Tipo de Dato | Notas |
|:---:|:---:|:---|:---|:---|
| AS | 44 | MATERNAL | Numérico | Horas o matrícula |
| AT | 45 | PREESCOLAR | Numérico | |
| AU | 46 | PRIMARIA | Numérico | |
| AV | 47 | 31059 | Numérico | Plan de estudio Media |
| AW | 48 | 31060 | Numérico | Plan de estudio Media |
| AX | 49 | 41048 | Numérico | Plan de estudio Técnica |
| AY | 50 | 41049 | Numérico | Plan de estudio Técnica |
| AZ | 51 | 41052 | Numérico | Plan de estudio Técnica |
| BA | 52 | 41056 | Numérico | Plan de estudio Técnica |
| BB | 53 | 42000 | Numérico | |
| BC | 54 | 43291 | Numérico | |
| BD | 55 | 43292 | Numérico | |
| BE | 56 | 43293 | Numérico | |
| BF | 57 | 43295 | Numérico | |
| BG | 58 | 43298 | Numérico | |
| BH | 59 | 44001 | Numérico | |
| BI | 60 | 44004 | Numérico | |
| BJ | 61 | 45041 | Numérico | |
| BK | 62 | 45043 | Numérico | |
| BL | 63 | 45045 | Numérico | |
| BM | 64 | 45049 | Numérico | |
| BN | 65 | 46067 | Numérico | |
| BO | 66 | 46068 | Numérico | |
| BP | 67 | 46069 | Numérico | |
| BQ | 68 | 46070 | Numérico | |
| BR | 69 | 46071 | Numérico | |
| BS | 70 | 48069 | Numérico | |
| BT | 71 | 49000 | Numérico | |
| BU | 72 | 49001 | Numérico | |

### BLOQUE 5 — Datos Sociales, Salud y Electorales (BX–CK, índice 75-88)

| Col | Índice | Encabezado | Tipo de Dato | Notas |
|:---:|:---:|:---|:---|:---|
| BX | 75 | TALLA DE CAMISA | Texto | S/M/L/XL |
| BY | 76 | TALLA DE PANTALÓN | Texto/Número | ⚠️ Riesgo de mezcla (28, 30, XL) |
| BZ | 77 | TALLA DE ZAPATO | Texto/Número | ⚠️ Riesgo de mezcla |
| CA | 78 | ACTIVIDAD DEPORTIVA | Texto | |
| CB | 79 | ACTIVIDAD CULTURAL | Texto | |
| CC | 80 | TIPO DE VIVIENDA | Texto | |
| CD | 81 | CONDICIÓN DE VIVIENDA | Texto | |
| CE | 82 | TIPO DE MATERIAL | Texto | |
| CF | 83 | TIPO DE ENFERMEDAD | Texto | |
| CG | 84 | MEDICAMENTO | Texto | |
| CH | 85 | POSEE DISCAPACIDAD | Texto | SI/NO o descripción |
| CI | 86 | UBCH | Texto | |
| CJ | 87 | CIRCUITO COMUNAL | Texto | |
| CK | 88 | CENTRO DE VOTACION | Texto | |

---

## 🔴 Puntos Críticos de Falla Identificados

### 1. Esta hoja es de SOLO LECTURA — No es un destino de escritura
> [!CAUTION]
> El documento `1_GuF2QG...` no es la hoja donde el SGH **guarda** datos. Es el **directorio maestro** que **agrega visualmente** datos de los 23 planteles con IMPORTRANGE. 
> 
> Si `guardarRegistroPersonal()` o `eliminarRegistroPersonal()` apunta al ID de este documento y escribe con `setValues()`, **destruirá la fórmula QUERY/IMPORTRANGE** de B2 permanentemente, corrompiendo la vista de todos los 23 municipios.

### 2. Columna A — ARRAYFORMULA destruible
La fórmula `=ARRAYFORMULA(...)` en A2 ocupa toda la columna A. Si el servidor escribe en cualquier celda A3:A500 directamente, la formula muere sin advertencia.

### 3. Fechas — Riesgo de inconsistencia
Las columnas `F (FECHA DE NACIMIENTO)` y `AM (FECHA DE INGRESO)` son las más susceptibles a llegar como objetos Date de Google Sheets que `getDisplayValues()` convierte a cadenas de texto con formato `DD/MM/YYYY`. Si en algún plantel las fechas están formateadas diferente (YYYY-MM-DD, MM/DD/YYYY), la función `calcularAntiguedad()` del frontend puede recibir cadenas imposibles de parsear.

### 4. Columnas de cuadratura (AV–BU) — Riesgo número/vacío
Las 29 columnas de planes de estudio pueden llegar como cadenas vacías `""` o como el número `0`. El servidor debe siempre forzar `parseInt(valor, 10) || 0` para evitar comparaciones rotas.

### 5. Typo en encabezado: `ATIENDE MATRICUAL` (Col AP)
El encabezado de la columna 41 tiene un error ortográfico: dice **"MATRICUAL"** en lugar de **"MATRICULA"**. Este typo debe estar replicado en los 23 documentos de plantel, por lo que no se puede corregir sin un cambio coordinado en todos.

---

## ✅ Conclusión Arquitectónica y Recomendaciones

> [!IMPORTANT]
> **La hoja PERSONAL del directorio maestro es una vista de solo lectura, no una base de datos operativa.** Cada plantel tiene su propio Google Sheet con su propia hoja PERSONAL, y es en esas hojas individuales donde el SGH lee y escribe.

### Recomendaciones por Regla de Oro:

| Regla | Recomendación |
|:---|:---|
| **Oro 2 — Abstracción de Recursos** | Verificar que `idHojaPlantel` nunca apunte a este documento maestro, sino siempre al Spreadsheet del plantel activo en sesión. |
| **Oro 3 — Cero Fórmulas en BD** | Esta regla aplica a los documentos **individuales de plantel**. La hoja maestra puede conservar sus IMPORTRANGE porque es solo para visualización gerencial, no para operación del SGH. |
| **Oro 5 — setValues en lote** | En los documentos de plantel individuales, seguir usando `setValues()` en lote. **Nunca** escribir en el directorio maestro. |
| **Oro 6 — Robustez** | Agregar una validación en `guardarRegistroPersonal()` que compare `idHojaPlantel` contra el ID del directorio maestro y rechace la operación con un error claro si coincide. |
