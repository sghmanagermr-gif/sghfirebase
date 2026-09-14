// =============================================================================
// DASHBOARD SGH — MÉRIDA (SGHD) v2.0
// Archivo: codigo.gs
// =============================================================================
// CONFIGURACIÓN INICIAL (ejecutar UNA VEZ en la consola de GAS):
//   PropertiesService.getScriptProperties().setProperties({
//     'SGHD_MAESTRO_SHEET_ID': '1_GuF2QGiOomHiWZKXJ3DrSTEbUPB8qvHC2pz-S_UvsM',
//     'BD_SGH_FILE_ID':        '14Tm4TFyGKDCbGAFTop50qabmSopWdr_g'
//   });
// =============================================================================
// Regla de Oro 1: Separación Absoluta de Capas.
// Regla de Oro 2: IDs en PropertiesService — nunca hardcodeados en el código.
// Regla de Oro 5: Una lectura masiva por fuente. Cero escrituras.
// Regla de Oro 6: try/catch en toda operación de API. Fallos descriptivos.
// Regla de Oro 7: Solo primitivos y arrays planos hacia el cliente.
// =============================================================================

// ── Índices de columna en la hoja PERSONAL (0-based) ──────────────────────
var COL = {
  CEDULA:             1,
  GENERO:             7,
  ESTADO_CIVIL:      12,
  MUNICIPIO:         17,
  PARROQUIA:         18,
  DEPENDENCIA:       24,
  TIPO_PERSONAL:     31,
  SITUACION_LABORAL: 73
};
var TOTAL_COLS      = 89;
var NOMBRE_HOJA     = 'PERSONAL';

// =============================================================================
// MÓDULO 1 — PropertiesService (Regla de Oro 2)
// Memoización IIFE: una sola llamada a PropertiesService por ejecución.
// =============================================================================
var _propCache = null;

/**
 * Recupera una Script Property por clave.
 * Lanza un error descriptivo si la clave no está configurada.
 * @param {string} clave
 * @returns {string}
 */
function _getProp(clave) {
  if (!_propCache) {
    _propCache = PropertiesService.getScriptProperties().getProperties();
  }
  var valor = _propCache[clave] || null;
  if (!valor) {
    throw new Error(
      'Script Property "' + clave + '" no configurada. ' +
      'Ejecute la configuración inicial en la consola de GAS.'
    );
  }
  return valor;
}

// =============================================================================
// MÓDULO 2 — Lectura de bd_sgh.json desde Drive (SOLO LECTURA)
// =============================================================================

/**
 * Abre bd_sgh.json desde Drive y lo parsea en memoria.
 * El FILE_ID se obtiene de PropertiesService (nunca hardcodeado).
 * @returns {Object} Árbol completo del JSON parseado.
 */
function _readDB() {
  var fileId;
  try {
    fileId = _getProp('BD_SGH_FILE_ID');
  } catch (e) {
    throw new Error('No se pudo recuperar el ID de bd_sgh.json: ' + e.message);
  }

  var file;
  try {
    file = DriveApp.getFileById(fileId);
  } catch (e) {
    throw new Error(
      'No se pudo abrir bd_sgh.json (ID: ' + fileId + '). ' +
      'Verifique que el archivo existe y que la cuenta tiene permisos de Editor. ' +
      'Detalle: ' + e.message
    );
  }

  try {
    return JSON.parse(file.getBlob().getDataAsString('UTF-8'));
  } catch (e) {
    throw new Error('Error al parsear bd_sgh.json. El archivo puede estar corrupto: ' + e.message);
  }
}

// =============================================================================
// MÓDULO 3 — Lectura de la hoja PERSONAL (Google Sheets, SOLO LECTURA)
// =============================================================================

/**
 * Lee la hoja PERSONAL del directorio maestro en bloque (getDisplayValues).
 * El SHEET_ID se obtiene de PropertiesService.
 * @returns {string[][]} Matriz de filas (sin encabezado).
 */
function _leerHojaPersonal() {
  var sheetId;
  try {
    sheetId = _getProp('SGHD_MAESTRO_SHEET_ID');
  } catch (e) {
    throw new Error('No se pudo recuperar el ID del directorio maestro: ' + e.message);
  }

  var ss;
  try {
    ss = SpreadsheetApp.openById(sheetId);
  } catch (e) {
    throw new Error('No se pudo abrir el directorio maestro (ID: ' + sheetId + '): ' + e.message);
  }

  var hoja = ss.getSheetByName(NOMBRE_HOJA);
  if (!hoja) {
    throw new Error('La hoja "' + NOMBRE_HOJA + '" no existe en el directorio maestro.');
  }

  var ultimaFila = hoja.getLastRow();
  if (ultimaFila < 2) return [];

  // getDisplayValues: convierte todo a texto — manejo uniforme de fechas y vacíos
  return hoja.getRange(2, 1, ultimaFila - 1, TOTAL_COLS).getDisplayValues();
}

// =============================================================================
// MÓDULO 4 — Procesamiento estadístico en memoria
// =============================================================================

/**
 * Calcula las estadísticas de planteles a partir del árbol municipios de bd_sgh.json.
 * Complejidad O(n) donde n = total de planteles (~1.192).
 * Esquema real: municipios[nomMun].parroquias[nomPar].planteles[codigo] = PlantelObj
 * @param {Object} db - Objeto parseado de bd_sgh.json.
 * @returns {Object} Stats planas (solo primitivos — Regla de Oro 7).
 */
function _calcularStatPlanteles(db) {
  var municipios   = db.municipios || {};
  var stats = {
    total:          0,
    byDependencia:  {},
    byDenominacion: {},
    byMunicipio:    {}
  };

  for (var nomMun in municipios) {
    if (!municipios.hasOwnProperty(nomMun)) continue;
    var parroquias = municipios[nomMun].parroquias || {};

    for (var nomPar in parroquias) {
      if (!parroquias.hasOwnProperty(nomPar)) continue;
      var planteles = parroquias[nomPar].planteles || {};

      for (var cod in planteles) {
        if (!planteles.hasOwnProperty(cod)) continue;
        var p   = planteles[cod];
        stats.total++;

        var dep = ((p.dependencia  || 'SIN DATOS') + '').toUpperCase();
        var den = ((p.denominacion || 'SIN DATOS') + '').toUpperCase();

        stats.byDependencia[dep]    = (stats.byDependencia[dep]    || 0) + 1;
        stats.byDenominacion[den]   = (stats.byDenominacion[den]   || 0) + 1;
        stats.byMunicipio[nomMun]   = (stats.byMunicipio[nomMun]   || 0) + 1;
      }
    }
  }
  return stats;
}

/**
 * Extrae conteos del catálogo de personal desde bd_sgh.json.
 * Esquema real — personal.docente: Object {codigoCargo: nombreCargo}
 *              — personal.obrero:  Object {codigoCargo: {rango, cargos[]}}
 * @param {Object} db
 * @returns {Object}
 */
function _calcularStatCatalogos(db) {
  var personal = db.personal || {};
  var docente   = personal.docente        || {};
  var admin     = personal.administrativo || {};
  var obrero    = personal.obrero         || {};

  var totalObreros = Object.keys(obrero).reduce(function(sum, k) {
    return sum + ((obrero[k].cargos || []).length);
  }, 0);

  return {
    cargosDocentes:       Object.keys(docente).length,
    cargosAdministrativos: Object.keys(admin).length,
    cargosObreros:        totalObreros,
    totalPlanes:          Object.keys(db.planes_estudio || {}).length,
    totalTurnos:          (db.turnos || []).length
  };
}

/**
 * Calcula las 6 métricas de personal desde la hoja PERSONAL (Google Sheets).
 * @param {string[][]} data - Matriz retornada por getDisplayValues().
 * @returns {Object} Métricas planas (solo primitivos — Regla de Oro 7).
 */
function _calcularMetricasPersonal(data) {
  var totalPersonal   = 0;
  var porTipoPersonal = {};
  var porGenero       = {};
  var porEstadoCivil  = {};
  var porDependencia  = {};
  var porMunicipio    = {};
  var porParroquia    = {};

  for (var i = 0; i < data.length; i++) {
    var row    = data[i];
    var cedula = (row[COL.CEDULA] || '').toString().trim();
    if (!cedula) continue;

    totalPersonal++;

    var tipo        = _norm(row[COL.TIPO_PERSONAL])  || 'SIN CLASIFICAR';
    var genero      = _norm(row[COL.GENERO])          || 'NO ESPECIFICADO';
    var estadoCivil = _norm(row[COL.ESTADO_CIVIL])    || 'NO ESPECIFICADO';
    var dep         = _norm(row[COL.DEPENDENCIA])     || 'SIN DEPENDENCIA';
    var municipio   = _norm(row[COL.MUNICIPIO])       || 'SIN MUNICIPIO';
    var parroquia   = _norm(row[COL.PARROQUIA])       || 'SIN PARROQUIA';

    porTipoPersonal[tipo]       = (porTipoPersonal[tipo]       || 0) + 1;
    porGenero[genero]           = (porGenero[genero]           || 0) + 1;
    porEstadoCivil[estadoCivil] = (porEstadoCivil[estadoCivil] || 0) + 1;
    porDependencia[dep]         = (porDependencia[dep]         || 0) + 1;
    porMunicipio[municipio]     = (porMunicipio[municipio]     || 0) + 1;

    var clave = municipio + ' › ' + parroquia;
    porParroquia[clave] = (porParroquia[clave] || 0) + 1;
  }

  return {
    totalPersonal:   totalPersonal,
    porTipoPersonal: porTipoPersonal,
    porGenero:       porGenero,
    porEstadoCivil:  porEstadoCivil,
    porDependencia:  porDependencia,
    porUbicacion: {
      municipios: porMunicipio,
      parroquias: porParroquia
    }
  };
}

// =============================================================================
// MÓDULO 5 — PUNTO DE ENTRADA PÚBLICO (una sola llamada del cliente)
// =============================================================================

/**
 * Bootstrap unificado: lee bd_sgh.json y la hoja PERSONAL en una sola
 * invocación de google.script.run, eliminando la latencia de múltiples
 * round-trips. Todo el procesamiento ocurre en memoria del servidor.
 *
 * @returns {{
 *   exito: boolean,
 *   personal: Object,       -- métricas de la hoja PERSONAL
 *   plantelStats: Object,   -- estadísticas del árbol municipios/planteles
 *   catalogos: Object,      -- conteos del catálogo RAC (bd_sgh.json)
 *   error?: string
 * }}
 */
function getBootstrapData() {
  try {
    // ── Fuente 1: bd_sgh.json (Drive) ─────────────────────────────────────
    var db           = _readDB();
    var plantelStats = _calcularStatPlanteles(db);
    var catalogos    = _calcularStatCatalogos(db);

    // ── Fuente 2: hoja PERSONAL (Google Sheets) ───────────────────────────
    var dataPersonal = _leerHojaPersonal();
    var personal     = _calcularMetricasPersonal(dataPersonal);

    // ── Retorno limpio — solo primitivos (Regla de Oro 7) ─────────────────
    return {
      exito:        true,
      personal:     personal,
      plantelStats: plantelStats,
      catalogos:    catalogos
    };

  } catch (e) {
    return { exito: false, error: 'Error en bootstrap: ' + e.message };
  }
}

// =============================================================================
// MÓDULO 6 — PUNTO DE ENTRADA WEB
// =============================================================================

function doGet(e) {
  try {
    var plantilla        = HtmlService.createTemplateFromFile('index');
    plantilla.appNombre  = 'Dashboard SGH · Mérida';
    plantilla.appVersion = '2.0.0';

    return plantilla.evaluate()
      .setTitle('Dashboard SGH · Mérida v2')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  } catch (error) {
    var html = '<html><body style="font-family:sans-serif;padding:2rem">'
      + '<h2 style="color:#c0392b">⚠ Error al cargar el Dashboard</h2>'
      + '<p>' + error.message + '</p></body></html>';
    return HtmlService.createHtmlOutput(html).setTitle('Error — SGHD');
  }
}

// =============================================================================
// HELPERS PRIVADOS
// =============================================================================

/** Normaliza string: trim + UPPERCASE para agrupar variantes de etiqueta. */
function _norm(v) {
  var s = ((v || '') + '').trim().toUpperCase();
  return s === '' ? '' : s;
}

// Regla de Oro 1: Separación Absoluta de Capas.
// Regla de Oro 2: IDs centralizados en CONFIG, nunca hardcodeados.
// Regla de Oro 5: UNA sola lectura masiva en memoria. Cero escrituras.
// Regla de Oro 6: Robustez total con try/catch en cada operación de API.
// Regla de Oro 7: Solo primitivos y arrays planos hacia el cliente.
// =============================================================================

var SGHD_CONFIG = {
  // ID del Google Sheet Maestro del Estado Mérida (SOLO LECTURA)
  maestroId:    '1_GuF2QGiOomHiWZKXJ3DrSTEbUPB8qvHC2pz-S_UvsM',
  hojaPersonal: 'PERSONAL',
  // Índices de columna (0-based). Fila 1 = encabezados, datos desde fila 2.
  // Col A (índice 0) = CANTIDAD (ARRAYFORMULA — SOLO LECTURA)
  // Col B (índice 1) = CEDULA (raíz del QUERY+IMPORTRANGE — SOLO LECTURA)
  COL: {
    CEDULA:             1,
    NOMBRE_APELLIDO:    3,
    GENERO:             7,
    ESTADO_CIVIL:      12,
    MUNICIPIO:         17,
    PARROQUIA:         18,
    DEPENDENCIA:       24,
    TIPO_PERSONAL:     31,
    SITUACION_LABORAL: 73
  },
  // Total de columnas a leer (A→CK = 89 columnas)
  TOTAL_COLS: 89
};

// =============================================================================
// PUNTO DE ENTRADA — doGet()
// =============================================================================
function doGet(e) {
  try {
    var plantilla = HtmlService.createTemplateFromFile('index');
    plantilla.appNombre  = 'Dashboard · SGH Mérida';
    plantilla.appVersion = '1.0.0';

    return plantilla.evaluate()
      .setTitle('Dashboard SGH · Mérida')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  } catch (error) {
    var html = '<html><body style="font-family:sans-serif;padding:2rem">'
      + '<h2 style="color:#c0392b">⚠ Error al cargar el Dashboard</h2>'
      + '<p>Por favor, contacte al administrador del sistema.</p></body></html>';
    return HtmlService.createHtmlOutput(html).setTitle('Error — SGHD');
  }
}

// =============================================================================
// FUNCIÓN PRINCIPAL DE DATOS
// UNA sola lectura en memoria → todo el cálculo estadístico ocurre en el
// servidor con arrays en RAM. Cero iteraciones adicionales a la API de Sheets.
// NUNCA escribe ni modifica el documento maestro.
// =============================================================================

/**
 * Lee la hoja PERSONAL una sola vez y devuelve las 6 métricas calculadas.
 *
 * @returns {{
 *   exito: boolean,
 *   totalPersonal: number,
 *   porTipoPersonal: Object,
 *   porGenero: Object,
 *   porEstadoCivil: Object,
 *   porDependencia: Object,
 *   porUbicacion: { municipios: Object, parroquias: Object },
 *   error?: string
 * }}
 */
function obtenerMetricasDashboard() {
  try {

    // ── Paso 1: Abrir documento maestro (SOLO LECTURA) ─────────────────────
    var ss;
    try {
      ss = SpreadsheetApp.openById(SGHD_CONFIG.maestroId);
    } catch (eAcceso) {
      return {
        exito: false,
        error: 'No se pudo acceder al documento maestro. Verifique permisos: ' + eAcceso.message
      };
    }

    var hoja = ss.getSheetByName(SGHD_CONFIG.hojaPersonal);
    if (!hoja) {
      return { exito: false, error: 'La hoja "PERSONAL" no existe en el documento maestro.' };
    }

    var ultimaFila = hoja.getLastRow();
    if (ultimaFila < 2) {
      return {
        exito: true, totalPersonal: 0,
        porTipoPersonal: {}, porGenero: {}, porEstadoCivil: {},
        porDependencia: {}, porUbicacion: { municipios: {}, parroquias: {} }
      };
    }

    // ── Paso 2: ÚNICA lectura masiva en memoria (Regla de Oro 5) ───────────
    // getDisplayValues() convierte todo a texto: manejo uniforme de fechas,
    // números y vacíos sin riesgo de conversiones silenciosas de GAS.
    var totalFilasDatos = ultimaFila - 1;
    var data = hoja.getRange(2, 1, totalFilasDatos, SGHD_CONFIG.TOTAL_COLS)
                   .getDisplayValues();

    // ── Paso 3: Procesamiento estadístico en memoria ───────────────────────
    var totalPersonal   = 0;
    var porTipoPersonal = {};
    var porGenero       = {};
    var porEstadoCivil  = {};
    var porDependencia  = {};
    var porMunicipio    = {};
    var porParroquia    = {};

    var COL = SGHD_CONFIG.COL;

    for (var i = 0; i < data.length; i++) {
      var row = data[i];

      // Filtrar filas sin cédula (filas vacías del QUERY o celdas de fórmula)
      var cedula = String(row[COL.CEDULA] || '').trim();
      if (!cedula) continue;

      totalPersonal++;

      // Métrica 2 — Tipo de Personal
      var tipo = _norm(row[COL.TIPO_PERSONAL]) || 'SIN CLASIFICAR';
      porTipoPersonal[tipo] = (porTipoPersonal[tipo] || 0) + 1;

      // Métrica 3 — Género
      var genero = _norm(row[COL.GENERO]) || 'NO ESPECIFICADO';
      porGenero[genero] = (porGenero[genero] || 0) + 1;

      // Métrica 4 — Estado Civil
      var estadoCivil = _norm(row[COL.ESTADO_CIVIL]) || 'NO ESPECIFICADO';
      porEstadoCivil[estadoCivil] = (porEstadoCivil[estadoCivil] || 0) + 1;

      // Métrica 5 — Dependencia
      var dep = _norm(row[COL.DEPENDENCIA]) || 'SIN DEPENDENCIA';
      porDependencia[dep] = (porDependencia[dep] || 0) + 1;

      // Métrica 6 — Ubicación geográfica (Municipio + Parroquia)
      var municipio = _norm(row[COL.MUNICIPIO]) || 'SIN MUNICIPIO';
      var parroquia = _norm(row[COL.PARROQUIA]) || 'SIN PARROQUIA';
      porMunicipio[municipio] = (porMunicipio[municipio] || 0) + 1;
      var clave = municipio + ' › ' + parroquia;
      porParroquia[clave] = (porParroquia[clave] || 0) + 1;
    }

    // ── Paso 4: Retorno limpio — solo primitivos (Regla de Oro 7) ──────────
    return {
      exito:           true,
      totalPersonal:   totalPersonal,
      porTipoPersonal: porTipoPersonal,
      porGenero:       porGenero,
      porEstadoCivil:  porEstadoCivil,
      porDependencia:  porDependencia,
      porUbicacion: {
        municipios: porMunicipio,
        parroquias: porParroquia
      }
    };

  } catch (e) {
    return { exito: false, error: 'Error interno al procesar métricas: ' + e.message };
  }
}

// =============================================================================
// HELPERS PRIVADOS
// =============================================================================

/** Normaliza: trim + UPPERCASE para agrupar variantes de la misma etiqueta. */
function _norm(v) {
  var s = String(v || '').trim().toUpperCase();
  return s === '' ? '' : s;
}
