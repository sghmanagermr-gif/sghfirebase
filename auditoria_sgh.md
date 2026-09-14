# 🔍 AUDITORÍA SGH — Skill: Google Apps Script Web App Architect
**Archivo auditado:** `codigo.gs` (2853 líneas) · `datos.json` · `bd_sgh.json` (referenciado)
**Fecha:** 2026-07-08

---

## SECCIÓN 1 — DIAGNÓSTICO GENERAL

| # | Regla de Oro | Estado | Módulo(s) crítico(s) |
|---|---|---|---|
| 1 | Separación Absoluta de Capas | ✅ **Cumple** | Toda la lógica está en `codigo.gs` |
| 2 | Abstracción y Dinamismo de Recursos | ⚠️ **Parcial** | `diagnosticarPermisos()`, `testLogin()` |
| 3 | Centralización Lógica e Inyección de Cálculos | ⚠️ **Parcial** | `guardarDatosPlantel()`, `guardarRegistroPersonal()` (2da versión) |
| 4 | Trazabilidad y Gestión de Históricos | ❌ **No Cumple** | `guardarSoloVacantes()`, `eliminarRegistroPersonal()` (parcial), `obtenerListadoPersonal()`, `prepararExcelDescarga()`, `eliminarExcelDescarga()` |
| 5 | Inyección Eficiente de Datos (Anti-bloqueo) | ❌ **No Cumple** | `guardarDatosPlantel()`, `_renumerarYLimpiarBasica()`, `cambiarClaveUsuario()`, `eliminarRegistroPersonal()` |
| 6 | Robustez Transaccional (Control de Fallos) | ⚠️ **Parcial** | `guardarDatosPlantel()`, `guardarRegistroPersonal()` (2da versión), `eliminarRegistroPersonal()`, `cambiarClaveUsuario()`, `obtenerListadoPersonal()` |
| 7 | Pureza en la Comunicación Asíncrona | ✅ **Cumple** | Todos los `return` son objetos planos con primitivos |

---

## SECCIÓN 2 — DETALLE DE INFRACCIONES

---

### 🔴 REGLA 2 — Abstracción de Recursos (IDs hardcodeados)

#### `diagnosticarPermisos()` · Línea 2692
```javascript
var idHojaPrueba = "16CqKF3ov9oPO6uCYYkoIKpki_PDggt9DENocT1MHH04";
```
**Por qué viola la regla:** ID de una hoja de plantel específica embebido directamente en el código de producción, fuera del `CONFIG_GLOBAL`.

**Peligro real:** Si ese ID de plantel cambia (el archivo de Drive fue recreado, se migró), el test silenciosamente fallará o apuntará a un recurso inexistente, causando confusión en diagnósticos futuros. Peor aún: si se despliega a producción con este bloque olvidado, cualquier usuario puede inferir IDs de plantel leyendo el código fuente del script.

---

#### `testLogin()` · Línea 2717–2737
```javascript
var USUARIO_PRUEBA = "T0715D1406";
var CLAVE_PRUEBA   = "CLAVE_REAL";
```
**Por qué viola la regla:** Credencial hardcodeada en código de producción.

**Peligro real:** Si alguien reemplaza `"CLAVE_REAL"` por la clave real y hace commit, las credenciales quedan expuestas. Estas funciones de diagnóstico nunca deben existir en el archivo de producción.

---

### 🔴 REGLA 3 — Centralización Lógica (Escrituras atómicas iterativas en hojas de Media)

#### `guardarDatosPlantel()` · Líneas 1413–1415 y 1423
```javascript
sh.getRange("K2").setValue(busqueda.usuario || "");
sh.getRange("W2").setValue(dp.nombre_plantel || "");
sh.getRange("AU2").setValue(matPlan);
// ...
sh.getRange(cells[i-1]).setValue(val); // dentro de un for()
```
**Por qué viola la regla:** Se llama a `setValue()` 3 veces para la cabecera, y luego **dentro de un bucle `for`** para las secciones por año. Cada llamada a la API de Sheets es una operación de red bloqueante.

**Peligro real:** Con 8 planes de estudio × N años × M secciones, este loop puede ejecutar 20-40 llamadas individuales a la API. En GAS, el límite de ejecución es 6 minutos. Con una hoja de media compleja, se puede llegar al timeout, corrompiendo la escritura parcialmente (algunos datos escritos, otros no).

---

#### `guardarRegistroPersonal()` (2da versión) · Líneas 1718–2305
> Esta es la función que reemplaza a la primera `guardarRegistroPersonal()` (línea 1113). Existe una **colisión de nombres** — hay DOS funciones con el mismo nombre en el mismo archivo.

**Por qué viola la Regla 3:** La 2da versión no usa el motor `_construirFilaRegistro()` que centraliza toda la lógica. Construye la fila directamente con lógica esparcida. Adicionalmente:
```javascript
// Línea 1902
hojaPersonal.getRange(newFila - 1, 1, 1, filaData.length).copyTo(...)
// Línea 2003
hojaBasica.getRange(newFilaB - 1, 1, 1, 88).copyTo(...)
// Línea 2214
sh.getRange(fIdx - 1, 1, 1, maxColP).copyTo(...)
```
El uso de `copyTo()` para copiar formato implica una **lectura + escritura** adicional. Esto se repite por cada hoja de plan de estudio activo.

**Peligro real:** `copyTo()` es una de las llamadas más costosas de la API. En un plantel con 6 planes de media y 30 empleados, una sola sesión de registro puede demorar 30–60 segundos visibles para el usuario.

---

### 🔴 REGLA 4 — Trazabilidad (Ausencia de auditoría en flujos críticos)

| Función | Flujo crítico sin auditoría |
|---|---|
| `guardarSoloVacantes()` (L. 1243) | Actualiza datos de vacantes. **Sin `registrarHuellaAuditoria()`**. |
| `obtenerListadoPersonal()` (L. 2307) | Acceso masivo a datos personales de empleados. Sin registro de consulta. |
| `prepararExcelDescarga()` (L. 2750) | Exportación de toda la hoja PERSONAL o CUADRATURA a Excel. **Sin auditoría**. Riesgo de fuga de datos no rastreable. |
| `eliminarExcelDescarga()` (L. 2844) | Sin auditoría de limpieza del temporal. |

> `eliminarRegistroPersonal()` **sí registra** auditoría, pero **sólo al final** (L. 2510). Si el proceso falla antes de ese punto (ej. al eliminar de hojas de Media), el error queda sin traza de quién lo intentó.

---

### 🔴 REGLA 5 — Inyección Eficiente (Escrituras fuera del patrón batch)

#### `_renumerarYLimpiarBasica()` · Líneas 1713–1715
```javascript
for (var j = filasParaBorrar.length - 1; j >= 0; j--) {
  hojaBasica.deleteRow(filasParaBorrar[j]); // 🔴 UNA LLAMADA API POR FILA
}
```
**Por qué viola la regla:** `deleteRow()` dentro de un bucle es el anti-patrón clásico. Cada eliminación es una llamada a la API que recalcula la hoja entera.

**Peligro real:** Si hay 15 filas residuales a borrar = 15 llamadas individuales a Sheets. Con el recálculo implícito de cada `deleteRow`, esto puede tardar varios segundos adicionales en una hoja grande y acercarse al límite de ejecución.

---

#### `cambiarClaveUsuario()` · Líneas 2583
```javascript
hojaPlanteles.getRange(i + 2, 2).setValue(nuevaClave); // Una sola celda
```
**Por qué viola la regla:** Se usa `setValue()` de una sola celda cuando el estándar del Skill es `setValues()` con array bidimensional. Para consistencia arquitectural, incluso una sola celda debe tratarse con el patrón batch.

---

#### `guardarDatosPlantel()` · Línea 1394
```javascript
hojaPlantel.getRange(2, 75).setValue(vacantesStr); // Segunda escritura separada
```
**Por qué viola la regla:** Ya se hizo `setValues()` en la línea 1391 para 74 columnas, pero la columna 75 se escribe en una segunda operación separada. Estas deberían ser una sola operación de 75 columnas.

---

#### `eliminarRegistroPersonal()` · Líneas 2496–2506
```javascript
for (var r = rangeVals.length - 1; r >= 0; r--) {
  if (String(rangeVals[r][0]).trim() === targetCedula) {
    sh.deleteRow(r + 6); // 🔴 dentro del loop
  }
}
```
**Por qué viola la regla:** Misma infracción que `_renumerarYLimpiarBasica()`. `deleteRow()` iterativo dentro de un bucle.

---

#### `hojaBasica.appendRow(rowData)` · Línea 2465 en `eliminarRegistroPersonal()`
```javascript
hojaHistorico.appendRow(rowData);
```
**Por qué viola la regla:** `appendRow()` es un anti-patrón según el Skill. Debe reemplazarse por `getLastRow() + 1` + `setValues()`.

---

### 🔴 REGLA 6 — Robustez Transaccional (try/catch incompletos o ausentes)

#### `guardarRegistroPersonal()` 2da versión — `guardarSoloVacantes()` — `eliminarRegistroPersonal()` — `obtenerListadoPersonal()`
Todas tienen el try/catch externo correcto, **pero el mensaje de error devuelto es desnudo**:
```javascript
return { exito: false, error: e.message }; // Sin prefijo contextual
```
**Por qué viola la regla:** `e.message` puede ser `undefined` en algunos contextos de GAS (ej. `RangeError` de la API de Sheets). El Skill exige un mensaje amigable con contexto.

---

#### `guardarDatosPlantel()` · Línea 1449, 1494, 1499
```javascript
sh.getRange("A25").setValue("DEBUG: Error al cargar...");
sh.getRange("A26").setValue("DEBUG: Error setValues: " + errSetValues.toString());
sh.getRange("A27").setValue("DEBUG: planInfoArr no encontrado...");
```
**Peligro real:** Código de depuración (`DEBUG:`) que **escribe directamente en celdas de la hoja de producción** ante un error. Esto corrompe datos reales y es completamente inapropiado para producción. Estos deben eliminarse o reemplazarse con `console.error()`.

---

#### **CRITICAL: Colisión de nombre `guardarRegistroPersonal()`**
El archivo define **dos funciones con el mismo nombre** (`guardarRegistroPersonal`) en las líneas 1113 y 1718. En Google Apps Script, la segunda definición **sobrescribe silenciosamente** a la primera. Esto significa que:
- Toda la arquitectura de `_construirFilaRegistro()`, `_autoProvisionarHojaPersonal()` y `ENCABEZADOS_REGISTRO_PERSONAL` (Módulos 7–9) está **completamente muerta y nunca se ejecuta**.
- La función real que corre (línea 1718) no usa `Registro_Personal` sino `PERSONAL`, tiene lógica diferente y menos protecciones.

**Este es el bug más crítico del archivo.**

---

## SECCIÓN 3 — PROPUESTA DE REFACTORIZACIÓN

### FIX 1: Eliminar código de diagnóstico de producción (Regla 2)
Las funciones `diagnosticarPermisos()` y `testLogin()` deben eliminarse del archivo de producción. Si se necesitan para depuración eventual, créalas en un archivo separado `diagnostico.gs` que NO se despliega.

---

### FIX 2: Resolver la colisión de `guardarRegistroPersonal()` (Regla 6 — CRÍTICO)
Renombrar la primera función (línea 1113) como `guardarRegistroPersonal_LEGACY()` y marcarla para evaluación, o eliminarla si la segunda versión (L. 1718) es la definitiva. Acción inmediata: buscar cuál llama el frontend e igualar los nombres.

---

### FIX 3: Reemplazar `appendRow()` por `setValues()` en `eliminarRegistroPersonal()` (Regla 5)

**❌ Código actual (L. 2465):**
```javascript
hojaHistorico.appendRow(rowData);
```

**✅ Código corregido:**
```javascript
// Anti-bloqueo: setValues() en lugar de appendRow() (Regla de Oro 5)
var filaHistorico = hojaHistorico.getLastRow() + 1;
hojaHistorico.getRange(filaHistorico, 1, 1, rowData.length).setValues([rowData]);
```

---

### FIX 4: Eliminar `deleteRow()` iterativo en `_renumerarYLimpiarBasica()` y `eliminarRegistroPersonal()` (Regla 5)

**❌ Código actual (L. 1713–1715 y L. 2496–2506):**
```javascript
for (var j = filasParaBorrar.length - 1; j >= 0; j--) {
  hojaBasica.deleteRow(filasParaBorrar[j]);
}
```

> [!NOTE]
> En GAS no existe un método nativo para eliminar múltiples filas no contiguas en una sola llamada. La mejor práctica es eliminar en orden inverso (ya lo hace), pero agregar `SpreadsheetApp.flush()` solo una vez AL FINAL del loop para minimizar recálculos intermedios:

**✅ Código corregido:**
```javascript
// Eliminar en orden inverso (ya correcto) + flush único al final
for (var j = filasParaBorrar.length - 1; j >= 0; j--) {
  hojaBasica.deleteRow(filasParaBorrar[j]);
}
SpreadsheetApp.flush(); // Un solo flush al terminar todas las eliminaciones
```

Para `eliminarRegistroPersonal()` en hojas de Media, el mismo patrón:
```javascript
// Recopilar filas a eliminar ANTES del loop
var filasAEliminar = [];
for (var r = 0; r < rangeVals.length; r++) {
  if (String(rangeVals[r][0]).trim() === targetCedula) {
    filasAEliminar.push(r + 6);
  }
}
// Eliminar en orden inverso con flush único
for (var d = filasAEliminar.length - 1; d >= 0; d--) {
  sh.deleteRow(filasAEliminar[d]);
}
if (filasAEliminar.length > 0) SpreadsheetApp.flush();
```

---

### FIX 5: Unificar la escritura de las columnas 1–74 y 75 en `guardarDatosPlantel()` (Regla 5)

**❌ Código actual (L. 1391–1394):**
```javascript
hojaPlantel.getRange(2, 1, 1, 74).setValues([filaData]);
// Segunda operación separada:
var vacantesStr = ...;
hojaPlantel.getRange(2, 75).setValue(vacantesStr);
```

**✅ Código corregido — una sola escritura de 75 columnas:**
```javascript
// Agregar vacantesStr al bloque filaData ANTES de escribir
var vacantesStr = (payload.vacantes && Object.keys(payload.vacantes).length > 0)
  ? JSON.stringify(payload.vacantes) : '';
filaData.push(vacantesStr); // Ahora filaData tiene 75 elementos

// Una única operación de escritura (Regla de Oro 5)
hojaPlantel.getRange(2, 1, 1, 75).setValues([filaData]);
```

---

### FIX 6: Eliminar código DEBUG de celdas de producción en `guardarDatosPlantel()` (Regla 6)

**❌ Código actual (L. 1449, 1494, 1499):**
```javascript
sh.getRange("A25").setValue("DEBUG: Error al cargar catálogos: " + ...);
sh.getRange("A26").setValue("DEBUG: Error setValues: " + errSetValues.toString());
sh.getRange("A27").setValue("DEBUG: planInfoArr no encontrado para plan " + codPlan);
```

**✅ Código corregido — usar console.error() y nunca escribir en celdas de datos:**
```javascript
// Reemplazar todas las líneas DEBUG con console.error()
console.error("[SGH] Error al cargar catálogos para plan " + codPlan + ": " +
              (catalogosGlobales ? catalogosGlobales.error : "catalogos null"));
// En el catch de setValues:
console.error("[SGH] Error setValues en plan " + codPlan + ": " + errSetValues.toString());
// Cuando planInfoArr es null:
console.warn("[SGH] planInfoArr no encontrado para plan: " + codPlan);
```

---

### FIX 7: Agregar auditoría a `guardarSoloVacantes()`, `prepararExcelDescarga()` y `obtenerListadoPersonal()` (Regla 4)

**`guardarSoloVacantes()` — agregar antes del `return { exito: true }`:**
```javascript
// Regla de Oro 4: huella de auditoría obligatoria
registrarHuellaAuditoria(
  payload.usuarioRegistrador,
  "ACTUALIZAR_VACANTES",
  busqueda.usuario,
  "COMPLETADO"
);
return { exito: true };
```

**`prepararExcelDescarga()` — agregar antes del `return { exito: true, ... }`:**
```javascript
// Regla de Oro 4: toda exportación de datos debe quedar registrada
registrarHuellaAuditoria(
  "SISTEMA",
  "EXPORTAR_" + tipoDescarga,
  idHojaPlantel + " | " + nombreArchivo,
  "COMPLETADO"
);
return { exito: true, tempId: tempId, nombreArchivo: nombreArchivo };
```

---

### FIX 8: Mensajes de error con contexto en funciones sin prefijo (Regla 6)

**Patrón estándar a aplicar en TODAS las funciones:**
```javascript
// ❌ Actual (desnudo):
return { exito: false, error: e.message };

// ✅ Correcto (con contexto amigable):
return { exito: false, error: "Error interno en [NombreFuncion]: " + (e.message || "Error desconocido") };
```

---

## RESUMEN EJECUTIVO

| Prioridad | Infracción | Impacto |
|---|---|---|
| 🔴 P0 | Colisión de nombre `guardarRegistroPersonal()` (dos funciones) | Módulos 7–9 completamente inactivos |
| 🔴 P0 | Código DEBUG escribe en celdas de producción | Corrupción silenciosa de datos reales |
| 🔴 P1 | Sin auditoría en exportación Excel (`prepararExcelDescarga`) | Fuga de datos no rastreable |
| 🔴 P1 | `appendRow()` en historico personal | Anti-patrón de rendimiento |
| 🟡 P2 | `deleteRow()` iterativo sin `flush()` | Riesgo de timeout en hojas grandes |
| 🟡 P2 | Dos escrituras separadas en `guardarDatosPlantel()` col 74/75 | API call extra innecesaria |
| 🟡 P2 | IDs hardcodeados en `diagnosticarPermisos()` / `testLogin()` | Exposición de datos en código fuente |
| 🟢 P3 | Mensajes de error desnudos (`e.message` sin contexto) | Dificulta el diagnóstico en producción |
