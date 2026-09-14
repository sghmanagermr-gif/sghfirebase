# 🔬 Auditoría Arquitectónica — Proyecto `BD RAC` (solo_para_analisis)
**Skill aplicado:** Google Apps Script Web App Architect  
**Evaluador:** Antigravity  
**Propósito:** Determinar la viabilidad de reutilizar este código en el `sghd_gas` Dashboard.

---

## 1. 📐 Estructura y Propósito General

Este proyecto es un **CRUD completo + Dashboard de gestión** para la "Base de Datos RAC" del sistema escolar de Mérida. Su función principal es servir como panel de administración central donde usuarios con diferentes roles pueden:

- **Consultar y editar** el catálogo de planteles educativos (filtrando por municipio, parroquia y dependencia).
- **Gestionar catálogos** de cargos de personal (Docente, Administrativo, Obrero), Turnos, Niveles, Modalidades, Planes de Estudio y Estatus Laboral.
- **Visualizar un Dashboard** con gráficos de barras, pastel y dona generados con **Chart.js**.
- **Controlar el acceso** con un sistema de roles y permisos por módulo (RBAC).

**Arquitectura de datos:** En lugar de Google Sheets, usa un **archivo JSON en Google Drive** (`bd_rac.json`, ~850 KB) como base de datos. Toda lectura y escritura pasa por ese archivo.

**Archivos del proyecto:**

| Archivo | Rol |
|:---|:---|
| `Code.gs` | Backend: RBAC, lectura/escritura JSON Drive, búsqueda de planteles |
| `Index.html` | Estructura HTML: Sidebar, 7 tabs, modales, contenedores |
| `Styles.html` | Capa CSS: Dark mode glassmorphism, sistema de diseño completo |
| `JS.html` | Lógica JavaScript: Renderizado, eventos, gráficos, CRUD en cliente |

---

## 2. ⚖️ Evaluación de las 7 Reglas de Oro

### Regla 1 — Separación Absoluta de Capas
**Resultado: ✅ CUMPLE**

El proyecto separa correctamente:
- `Styles.html` solo tiene CSS.
- `JS.html` solo tiene JavaScript.
- `Index.html` solo tiene estructura HTML.
- `Code.gs` solo tiene lógica de servidor.

Usa la función `include()` para inyectar las capas en `Index.html`, el mismo patrón establecido en el SGH principal.

---

### Regla 2 — Abstracción de Recursos (IDs centralizados)
**Resultado: 🟡 CUMPLE PARCIALMENTE — Con una infracción crítica**

```javascript
// Code.gs — línea ~80 (getFile)
function getFile() {
  const FILE_ID = "14Tm4TFyGKDCbGAFTop50qabmSopWdr_g"; // ← ID HARDCODEADO
  try {
    return DriveApp.getFileById(FILE_ID);
  } catch (e) { ... }
}
```

> [!CAUTION]
> **El ID del archivo JSON de Drive está literalmente pegado dentro de la función.** Si ese archivo alguna vez se recrea, elimina o migra a otra cuenta, la aplicación entera deja de funcionar sin posibilidad de corregirlo desde la interfaz. Debería estar en un objeto `CONFIG` centralizado al inicio del archivo, igual que `SGHD_CONFIG` en nuestro dashboard.

Los correos del RBAC también están hardcodeados (aceptable como configuración, pero no ideal).

---

### Regla 3 — Cero Consultas Repetidas / Eficiencia de Lectura
**Resultado: 🟡 CUMPLE PARCIALMENTE — Con un punto de ineficiencia**

El diseño de carga diferida (lazy loading) para el árbol pesado de municipios (~850 KB) **es correcto y brillante**: no lo carga al inicio, solo cuando el usuario abre esa pestaña. Esto es una Regla de Oro 3 bien aplicada.

Sin embargo, al inicio de sesión se producen **DOS lecturas completas del archivo JSON**:

```javascript
// JS.html — loadData()
google.script.run.getCatalogos();       // Lectura #1 del archivo JSON
// ...luego automáticamente:
loadPlantelesStats();                   // llama a getPlantelesStats()
                                        // que internamente hace _readRawDB() → Lectura #2
```

**Impacto:** Dos lecturas de un archivo JSON de Drive al inicio. Dado que el archivo pesa ~850 KB, cada lectura tiene latencia real. Son 2 viajes de red innecesarios cuando podrían consolidarse en uno solo.

---

### Regla 4 — Huellas de Auditoría
**Resultado: ❌ NO CUMPLE**

> [!WARNING]
> **No existe ningún mecanismo de auditoría.** No hay registro de quién guardó qué, cuándo, ni qué datos cambió. Para un sistema con múltiples usuarios con roles diferentes que pueden crear, editar y eliminar cargos, planes de estudio y datos de planteles, esto es un vacío serio. Si un usuario borra un plan de estudio accidentalmente, no hay forma de saber quién lo hizo ni de recuperarlo.

---

### Regla 5 — Escrituras en Lote / Una Sola Operación
**Resultado: ✅ CUMPLE (adaptado al paradigma JSON)**

La Regla de Oro 5 nació para evitar `appendRow` en Sheets. Aquí no hay Sheets, sino un JSON. La filosofía equivalente —escribir todo el archivo en una sola operación atómica— se cumple:

```javascript
function _writeRawDB(data) {
  file.setContent(JSON.stringify(data, null, 2)); // Una sola escritura atómica
  return { success: true };
}
```

✅ Correcto: lee el JSON, modifica en memoria, escribe completo.

---

### Regla 6 — Robustez con try/catch
**Resultado: ✅ CUMPLE BIEN**

- `getFile()`, `_readRawDB()`, `_writeRawDB()` tienen try/catch con mensajes descriptivos y claros.
- Los callbacks del cliente (`withFailureHandler`) muestran toasts de error al usuario.
- Los errores de acceso denegado se lanzan con mensajes que explican qué hacer (`"solicite al administrador que comparta el archivo..."`).

Un punto débil: el cliente usa `confirm()` nativo del navegador para confirmaciones de eliminación. En ciertos entornos de Google Apps Script (iframes), `confirm()` puede ser bloqueado por políticas de seguridad del navegador. Debería usarse un modal personalizado.

---

### Regla 7 — Solo Primitivos al Cliente
**Resultado: ✅ CUMPLE**

Todas las funciones (`getCatalogos`, `getMunicipios`, `getPlantelesStats`, `searchPlanteles`) retornan exclusivamente objetos literales, arrays, strings y números. Ninguna filtra objetos internos de GAS (Sheet, File, Range, etc.) hacia el cliente.

---

## 3. 🚀 Potencial de Actualización para `sghd_gas`

Estos son los componentes más valiosos para integrar en el Dashboard de Mérida, ordenados por prioridad:

### 🥇 Prioridad ALTA — Implementar de inmediato

#### A. Sistema de Gráficos con Chart.js
El proyecto integra tres tipos de gráficos (`pie`, `doughnut`, `bar`) con `Chart.js`. Esta librería es perfectamente importable en `sghd_gas` para reemplazar las barras horizontales actuales con visualizaciones más ricas.

```javascript
// Patrón a reutilizar (JS.html — renderPlantelesCharts)
chartMunicipios = new Chart(munCtx, {
  type: 'bar',
  data: { labels: munLabels, datasets: [{ data: munData, ... }] },
  options: { responsive: true, maintainAspectRatio: false, ... }
});
```

#### B. Sistema de Toasts (Notificaciones)
La función `showToast(message, type)` con animación CSS `slideIn` es elegante, no bloquea al usuario y es perfectamente reutilizable. Actualmente `sghd_gas` no tiene sistema de notificaciones.

#### C. Búsqueda con Debounce del lado del cliente
```javascript
let searchTimeout = null;
function onSearchPlantel() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => applyPlantelesFilter(), 500);
}
```
Este patrón evita llamadas repetidas al servidor mientras el usuario sigue escribiendo. Es una práctica de eficiencia que `sghd_gas` puede adoptar si se agrega un filtro de búsqueda por municipio.

### 🥈 Prioridad MEDIA — Evaluar para la siguiente fase

#### D. Sistema RBAC (Control de Acceso por Roles)
`getUserAccess()` + `applyPermissionsUI()` es un sistema de permisos bien diseñado. Para una futura versión del `sghd_gas` donde diferentes Zonas Educativas puedan ver solo sus municipios, este patrón es adaptable directamente.

#### E. Paginación de Resultados
```javascript
function renderPagination(totalPages) { ... }
```
Si el `sghd_gas` agrega un listado paginado de empleados por municipio, este componente es listo para reutilizar.

#### F. Normalización recursiva `toUpperRecursive()`
Función elegante y genérica para garantizar que todos los datos guardados lleguen en MAYÚSCULAS. Útil para mantener consistencia en los datos del SGH.

### 🥉 Prioridad BAJA — Considerar a largo plazo

#### G. Sistema de Modales Reutilizables
`openModal(id)` / `closeModal(id)` es un patrón CSS+JS simple que ya usamos en el SGH. El diseño oscuro con `backdrop-filter: blur` es más premium que el actual.

---

## 4. 🚨 Alertas de Riesgo — Leer antes de integrar

> [!CAUTION]
> **Alerta 1 — ID de archivo hardcodeado:** El `FILE_ID = "14Tm4TFyGKDCbGAFTop50qabmSopWdr_g"` en `Code.gs` es el riesgo arquitectónico más alto. Antes de integrar cualquier función de este proyecto, ese ID debe moverse a un objeto `CONFIG` en la cima del archivo, igual que hacemos en `sghd_gas`.

> [!WARNING]
> **Alerta 2 — Sin auditoría:** Si se integra la lógica de escritura de este proyecto en cualquier módulo, se debe agregar `registrarHuellaAuditoria()` en cada operación de guardado. El sistema actual no deja ningún rastro de cambios.

> [!WARNING]
> **Alerta 3 — Doble carga inicial:** Al integrar `getPlantelesStats()`, hacerlo dentro de la misma llamada que `getCatalogos()`, retornando ambos resultados en un solo objeto, para evitar dos lecturas del archivo al inicio.

> [!NOTE]
> **Alerta 4 — CDN externo (Chart.js + Font Awesome):** Estas librerías se cargan desde `cdnjs.cloudflare.com` y `cdn.jsdelivr.net`. En entornos GAS con restricciones de red institucionales, estos dominios pueden ser bloqueados. Para producción, considerar alojar las librerías en Drive o usar alternativas nativas de Charts de Google.

> [!NOTE]
> **Alerta 5 — `confirm()` bloqueado en iframes:** Las llamadas a `confirm(...)` para eliminar registros pueden fallar silenciosamente en navegadores modernos dentro de un iframe de GAS. Reemplazar con un modal de confirmación personalizado antes de desplegar.

---

## 5. ✅ Conclusión General

| Dimensión | Calificación |
|:---|:---|
| Calidad arquitectónica general | 🟡 Buena (con correcciones) |
| Seguridad de acceso (RBAC) | ✅ Muy buena |
| Eficiencia de datos | 🟡 Aceptable (doble lectura inicial) |
| Robustez (manejo de errores) | ✅ Buena |
| Separación de capas | ✅ Excelente |
| Trazabilidad y auditoría | ❌ Inexistente |
| Potencial de reutilización para `sghd_gas` | 🟢 **ALTO** — principalmente Chart.js + Toast + RBAC |

**Veredicto:** Este es un proyecto de calidad superior a la media y con patrones inteligentes (lazy loading, búsqueda server-side, RBAC). Con las correcciones señaladas (centralizar el FILE_ID, agregar auditoría, corregir doble lectura), sus componentes más valiosos pueden integrarse con seguridad en el `sghd_gas`.
