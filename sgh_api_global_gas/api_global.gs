/**
 * API GLOBAL SGH — v2 (CacheService)
 * Microservicio para verificar la existencia de una cédula a nivel estatal.
 * Optimizado para grandes volúmenes (20.000+ registros).
 *
 * DESPLIEGUE:
 * - Ejecutar como: "Yo" (propietario del script)
 * - Quién tiene acceso: "Cualquier usuario"
 *
 * CAMBIOS v2:
 * - Búsqueda O(1) mediante índice en CacheService (vs. bucle O(n) anterior).
 * - La caché se renueva automáticamente cada 6 horas o cuando se invalida
 *   explícitamente desde el sistema principal tras un guardado/eliminación.
 */

var ID_HOJA_GLOBAL = "1_GuF2QGiOomHiWZKXJ3DrSTEbUPB8qvHC2pz-S_UvsM";
var CACHE_KEY      = "cedulas_estatales_v3";
var CACHE_TTL      = 21600; // 6 horas en segundos

function doGet(e) {
  // Enrutador: si la petición trae ?accion=invalidar, limpiar la caché y salir.
  // Cualquier otra petición es una consulta de cédula normal.
  if (e && e.parameter && e.parameter.accion === "invalidar") {
    invalidarCache();
    return crearRespuesta({ exito: true, mensaje: "Caché de cédulas estatales invalidado." });
  }
  return procesarPeticion(e);
}
function doPost(e) { return procesarPeticion(e); }

function procesarPeticion(e) {
  try {
    var cedulaConsultada = e.parameter.cedula;

    // Guardia: parámetro obligatorio
    if (!cedulaConsultada) {
      return crearRespuesta({ exito: false, error: "Falta el parámetro cédula en la petición." });
    }

    var cedulaStr = String(cedulaConsultada).trim();
    var dependenciaStr = e.parameter.dependencia ? String(e.parameter.dependencia).trim().toUpperCase() : "";

    // Ignorar "VACANTE" o vacíos — no consumen lectura de Drive ni caché
    if (cedulaStr === "" || cedulaStr === "VACANTE") {
      return crearRespuesta({ exito: true, existe: false });
    }

    // ── 1. Intentar leer el índice desde la caché (O(1), instantáneo) ──────
    var cache    = CacheService.getScriptCache();
    var cacheRaw = cache.get(CACHE_KEY);
    var setCedulas;

    if (cacheRaw) {
      // Caché disponible — deserializar (< 1 ms)
      try {
        setCedulas = JSON.parse(cacheRaw);
      } catch (eJson) {
        // JSON corrupto en caché — reconstruir desde Drive
        setCedulas = _construirIndice();
        _intentarPoblarCache(cache, setCedulas);
      }
    } else {
      // Caché vacía — única lectura real a Drive en el ciclo de 6 horas
      setCedulas = _construirIndice();
      _intentarPoblarCache(cache, setCedulas);
    }

    // ── 2. Búsqueda O(1) en el índice ────────────────────────────────────────
    var existe = false;
    if (setCedulas.hasOwnProperty(cedulaStr)) {
      if (dependenciaStr) {
        // Bloquea solo si ya existe en la MISMA dependencia
        existe = setCedulas[cedulaStr].hasOwnProperty(dependenciaStr);
      } else {
        // Compatibilidad: si el sistema principal no envía dependencia, asume duplicado
        existe = true;
      }
    }
    return crearRespuesta({ exito: true, existe: existe });

  } catch (error) {
    return crearRespuesta({ exito: false, error: "Error en API Global: " + error.toString() });
  }
}

/**
 * Lee TODAS las cédulas de la hoja estatal y construye un objeto-índice { cedula: 1 }.
 * Solo se ejecuta cuando la caché está vacía o expirada (máx. cada 6 horas).
 * Regla de Oro 5: lectura en bloque, sin bucle de getRange individuales.
 */
function _construirIndice() {
  var ssGlobal     = SpreadsheetApp.openById(ID_HOJA_GLOBAL);
  var hojaPersonal = ssGlobal.getSheetByName("PERSONAL");

  // Fail-safe: si la pestaña no existe, lanzar error para que procesarPeticion()
  // lo capture y devuelva { exito: false }, lo que bloquea el guardado en codigo.gs.
  // (Comportamiento idéntico al código v1 original).
  if (!hojaPersonal) {
    throw new Error("No se encontró la pestaña 'PERSONAL' en la BBDD Global.");
  }

  var ultimaFila = hojaPersonal.getLastRow();
  // Hoja vacía (solo encabezado) = nadie registrado aún, índice vacío es correcto.
  if (ultimaFila < 2) return {};

  // Lectura masiva en una sola llamada (Regla de Oro 5 — Anti-bloqueo)
  // Columna B (2) hasta Columna AE (31). Total: 30 columnas.
  var cedulas = hojaPersonal.getRange(2, 2, ultimaFila - 1, 30).getValues();
  var indice  = {};
  cedulas.forEach(function(fila) {
    var c = String(fila[0]).trim();
    var dep = String(fila[29]).trim().toUpperCase(); // Índice 29 = Columna AE (Dependencia Laboral)
    if (c && c !== "VACANTE") {
      if (!indice[c]) {
        indice[c] = {};
      }
      if (dep) {
        indice[c][dep] = true;
      }
    }
  });
  return indice;
}

/**
 * Intenta guardar el índice en CacheService.
 * Si el JSON supera el límite (~100 KB por entrada), opera sin caché de forma segura.
 * Regla de Oro 6: todo fallo está protegido por try/catch sin exponer el error al usuario.
 */
function _intentarPoblarCache(cache, setCedulas) {
  try {
    cache.put(CACHE_KEY, JSON.stringify(setCedulas), CACHE_TTL);
  } catch (eCachePut) {
    // El JSON supera el límite de CacheService. El sistema continúa operando
    // normalmente leyendo desde Drive en cada consulta (degradación elegante).
    console.warn("[SGH-API] CacheService lleno. Operando sin caché: " + eCachePut.message);
  }
}

/**
 * Invalida el caché del índice de cédulas estatales.
 * DEBE llamarse desde el sistema principal (codigo.gs) tras:
 *   - Guardar un registro nuevo de personal.
 *   - Eliminar un registro de personal.
 * Garantiza que la próxima consulta refleje el estado real de la hoja.
 */
function invalidarCache() {
  CacheService.getScriptCache().remove(CACHE_KEY);
  console.info("[SGH-API] Caché de cédulas invalidado correctamente.");
}

/**
 * Función auxiliar para retornar los datos como JSON (Regla de Oro 7 — datos planos).
 */
function crearRespuesta(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}
