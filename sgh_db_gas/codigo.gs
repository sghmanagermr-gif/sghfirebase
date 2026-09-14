// =============================================================================
// DASHBOARD & CRUD SGH — MÉRIDA (SGH_DB_GAS)
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
// Regla de Oro 3: Centralización Lógica en servidor.
// Regla de Oro 4: Auditoría (registrarHuellaAuditoria).
// Regla de Oro 5: Una lectura/escritura por fuente en bloque.
// Regla de Oro 6: try/catch en toda operación de API.
// Regla de Oro 7: Solo primitivos y arrays planos hacia el cliente.
// =============================================================================

// =============================================================================
//  CONFIGURACIÓN DE PERMISOS (RBAC)
// =============================================================================
const PERMISOS_USUARIOS = {
  // Administradores que tienen acceso a TODO el sistema
  ADMINS: ["sistemagestionhumanamr@gmail.com"], 

  // Acceso exclusivo SOLO a Dashboard (Gráficas)
  DASHBOARD_ONLY: ["procesosmeridacdce@gmail.com","oficinadepagomerida@gmail.com"],
  
  // Asignación de correos por módulo
  // IMPORTANTE: Las claves deben coincidir con la normalización del nombre real
  // en la BD (bd_sgh.json). La función normalizeMun() en el front hace:
  //   nombre → quitar tildes → lowercase → solo alfanuméricos
  // Por eso los nombres abreviados de la BD generan claves más cortas.
  MODULOS: {
    "planteles_albertoadriani":       ["gestionhumanacdcealbetoadriani@gmail.com"],
    "planteles_andresbello":          [],
    "planteles_antoniopintosalina":   ["apsnominarac@gmail.com"],  // DB: "ANTONIO PINTO SALINA"
    "planteles_aricagua":             [],
    "planteles_arzobispochacon":      [],  // DB: "ARZOBISPO CHACON" (typo en la BD)
    "planteles_campoelias":           [],
    "planteles_caraccioloparra":      [],  // DB: "CARACCIOLO PARRA"
    "planteles_cardenalquintero":     [],
    "planteles_guaraque":             [],
    "planteles_juliocesar":           [],     // DB: "JULIO CESAR"
    "planteles_justobriceno":         [],
    "planteles_libertador":           [],
    "planteles_miranda":              [],
    "planteles_obisporamosdelora":    [],
    "planteles_padrenoguera":         [],
    "planteles_pueblollano":          [],
    "planteles_rangel":               [],
    "planteles_rivasdavila":          [],
    "planteles_santosmarquina":       [],
    "planteles_sucre":                [],
    "planteles_tovar":                ["gestionhumanatovar@gmail.com"],
    "planteles_tuliofebres":          [],  // DB: "TULIO FEBRES"
    "planteles_zea":                  [],
    "personal_nacional":      ["oficinadepagomerida@gmail.com"],
    "personal_estadal":       [],
    "personal_municipal":     [],
    "personal_autonomo":      [],
    "personal_subvencionado": [],
    "personal_privado":       [],
    "turnos":                 [],
    "nivel-modalidad":  [],
    "planes":           [],
    "estatus":          ["oficinadepagomerida@gmail.com"]
  }
};

/**
 * Retorna los permisos del usuario activo basado en su correo electrónico.
 */
function getUserAccess(clientEmail) {
  let email = (clientEmail || "").toLowerCase().trim();
  
  if (!email) {
    try {
      email = Session.getActiveUser().getEmail().toLowerCase().trim();
    } catch (e) {
      // Salvavidas para el Dueño del script si los tokens OAuth están corruptos
      try {
        email = Session.getEffectiveUser().getEmail().toLowerCase().trim();
      } catch (e2) {
        email = "";
      }
    }
  }
  
  if (!email) {
    return { email: "NO_DETECTADO", permissions: [], isAdmin: false };
  }
  
  if (PERMISOS_USUARIOS.ADMINS.map(e => e.toLowerCase().trim()).includes(email)) {
    return { email, permissions: Object.keys(PERMISOS_USUARIOS.MODULOS), isAdmin: true, isDashboardOnly: false };
  }
  
  if (PERMISOS_USUARIOS.DASHBOARD_ONLY && PERMISOS_USUARIOS.DASHBOARD_ONLY.map(e => e.toLowerCase().trim()).includes(email)) {
    return { email, permissions: Object.keys(PERMISOS_USUARIOS.MODULOS), isAdmin: false, isDashboardOnly: true };
  }
  
  const permissions = [];
  for (const [modulo, correos] of Object.entries(PERMISOS_USUARIOS.MODULOS)) {
    if (correos.map(e => e.toLowerCase().trim()).includes(email)) {
      permissions.push(modulo);
    }
  }
  
  return { email: email, permissions: permissions, isAdmin: false, isDashboardOnly: false };
}

// =============================================================================
// MÓDULO 1 — PropertiesService
// =============================================================================
var _propCache = null;

function _getProp(clave) {
  if (!_propCache) {
    _propCache = PropertiesService.getScriptProperties().getProperties();
  }
  var valor = _propCache[clave] || null;
  if (!valor) {
    throw new Error('Script Property "' + clave + '" no configurada.');
  }
  return valor;
}

// =============================================================================
// MÓDULO 2 — Drive I/O y Utilidades
// =============================================================================

function _readRawDB() {
  var fileId = _getProp('BD_SGH_FILE_ID');
  try {
    var file = DriveApp.getFileById(fileId);
    return JSON.parse(file.getBlob().getDataAsString('UTF-8'));
  } catch (e) {
    throw new Error("Error al leer bd_sgh.json: " + e.message);
  }
}

function _writeRawDB(data) {
  var fileId = _getProp('BD_SGH_FILE_ID');
  try {
    var file = DriveApp.getFileById(fileId);
    file.setContent(JSON.stringify(data, null, 2));
    return { success: true };
  } catch (e) {
    throw new Error("Error al guardar bd_sgh.json: " + e.message);
  }
}

function _toUpperRecursive(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "string") return obj.toUpperCase();
  if (Array.isArray(obj)) return obj.map(_toUpperRecursive);
  if (typeof obj === "object") {
    const newObj = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = _toUpperRecursive(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
}

// =============================================================================
// MÓDULO 3 — Auditoría (Regla de Oro 4)
// =============================================================================
function registrarHuellaAuditoria(usuario, accion, identificador, estado) {
  try {
    var maestroId = _getProp('SGHD_MAESTRO_SHEET_ID');
    var ss = SpreadsheetApp.openById(maestroId);
    var hojaAuditoria = ss.getSheetByName("Histórico_Auditoría");
    
    if (!hojaAuditoria) {
      hojaAuditoria = ss.insertSheet("Histórico_Auditoría");
      hojaAuditoria.appendRow(["Timestamp", "Usuario", "Acción", "Identificador", "Estado"]);
      hojaAuditoria.getRange(1, 1, 1, 5).setFontWeight("bold");
    }
    
    var timestamp = new Date().toISOString();
    var estadoFinal = estado || "COMPLETADO";
    var filaAuditoria = [
      [
        timestamp,
        String(usuario || "SISTEMA"),
        String(accion || "ACCIÓN_DESCONOCIDA"),
        String(identificador || ""),
        String(estadoFinal)
      ]
    ];
    
    hojaAuditoria.getRange(hojaAuditoria.getLastRow() + 1, 1, 1, 5).setValues(filaAuditoria);
  } catch (e) {
    // Falla silenciosa, la auditoría no debe bloquear el flujo
    console.error("Auditoría falló: " + e.message);
  }
}

// =============================================================================
// MÓDULO 4 — API PÚBLICA (Lectura/Bootstrapping)
// =============================================================================

/**
 * Lee los registros del Histórico_Auditoría del Directorio Maestro.
 * Solo accesible para Administradores.
 * @param {string} clientEmail - Correo del usuario solicitante.
 * @param {number} [limite]    - Máximo de filas a retornar (por defecto 200).
 * @returns {{ exito: boolean, registros: Array, error?: string }}
 */
function getHistorico(clientEmail, limite) {
  try {
    var access = getUserAccess(clientEmail);
    if (!access.isAdmin) {
      return { exito: false, error: "Acceso denegado: Solo los administradores pueden ver el Histórico." };
    }

    var maestroId = _getProp('SGHD_MAESTRO_SHEET_ID');
    var ss = SpreadsheetApp.openById(maestroId);
    var hoja = ss.getSheetByName("Histórico_Auditoría");

    if (!hoja || hoja.getLastRow() < 2) {
      return { exito: true, registros: [] };
    }

    var maxFilas = limite || 200;
    var totalFilas = hoja.getLastRow() - 1; // sin encabezado
    var inicio = Math.max(2, hoja.getLastRow() - maxFilas + 1); // últimas N filas
    var cantidadFilas = hoja.getLastRow() - inicio + 1;

    var datos = hoja.getRange(inicio, 1, cantidadFilas, 5).getValues();

    // Invertir para mostrar lo más reciente primero
    var registros = datos.reverse().map(function(fila) {
      return {
        timestamp:    String(fila[0] || ""),
        usuario:      String(fila[1] || ""),
        accion:       String(fila[2] || ""),
        identificador:String(fila[3] || ""),
        estado:       String(fila[4] || "")
      };
    });


    return { exito: true, registros: registros, total: totalFilas };
  } catch(e) {
    return { exito: false, error: e.message };
  }
}

function _calcularStatPlanteles(db) {
  var stats = { total: 0, byMunicipio: {}, byMunicipioDetalle: {}, byDependenciaStats: {} };
  if (!db || !db.municipios) return stats;
  
  for (var muni in db.municipios) {
    stats.byMunicipioDetalle[muni] = {};
    var c = 0;
    var objM = db.municipios[muni];
    if (objM.parroquias) {
      for (var parr in objM.parroquias) {
        if (objM.parroquias[parr].planteles) {
          var pObj = objM.parroquias[parr].planteles;
          for (var p in pObj) {
            stats.byMunicipioDetalle[muni][p] = pObj[p].nombre_plantel || p;
            c++;
            
            // Agrupar estadisticas base por dependencia
            var dep = pObj[p].dependencia ? String(pObj[p].dependencia).toUpperCase().trim() : "SIN ESPECIFICAR";
            if (!stats.byDependenciaStats[dep]) {
              stats.byDependenciaStats[dep] = { total: 0, byMunicipio: {} };
            }
            stats.byDependenciaStats[dep].total++;
            stats.byDependenciaStats[dep].byMunicipio[muni] = (stats.byDependenciaStats[dep].byMunicipio[muni] || 0) + 1;
          }
        }
      }
    }
    stats.byMunicipio[muni] = c;
    stats.total += c;
  }
  return stats;
}

/**
 * Función utilitaria para evitar saturación de memoria y payload (Skill1)
 * Limita los diccionarios a los N elementos con mayores valores, agrupando el resto en "OTROS".
 */
function _topN(obj, maxKeys) {
  var keys = Object.keys(obj);
  if (keys.length <= maxKeys) return obj;
  keys.sort(function(a, b) { return obj[b] - obj[a]; });
  var newObj = {};
  var otros = 0;
  for (var i = 0; i < keys.length; i++) {
    if (i < maxKeys) newObj[keys[i]] = obj[keys[i]];
    else otros += obj[keys[i]];
  }
  if (otros > 0) newObj["OTROS"] = otros;
  return newObj;
}

function _calcularStatPlantelesDetallado(db) {
  var municipios = db.municipios || {};
  var stats = { total: 0, byDependencia: {}, byDenominacion: {}, byMunicipio: {} };
  for (var nomMun in municipios) {
    var parroquias = municipios[nomMun].parroquias || {};
    for (var nomPar in parroquias) {
      var planteles = parroquias[nomPar].planteles || {};
      for (var cod in planteles) {
        var p = planteles[cod];
        stats.total++;
        var dep = ((p.dependencia || 'SIN DATOS') + '').toUpperCase();
        var den = ((p.denominacion || 'SIN DATOS') + '').toUpperCase();
        stats.byDependencia[dep] = (stats.byDependencia[dep] || 0) + 1;
        stats.byDenominacion[den] = (stats.byDenominacion[den] || 0) + 1;
        stats.byMunicipio[nomMun] = (stats.byMunicipio[nomMun] || 0) + 1;
      }
    }
  }
  return stats;
}

function _calcularStatCatalogos(db) {
  var personal = db.personal || {};
  
  var totalObreros = 0;
  var totalRolesAdmin = 0;
  var totalRolesDocente = 0;

  var deps = Object.keys(personal);
  for (var i = 0; i < deps.length; i++) {
    var depData = personal[deps[i]] || {};
    
    var obObj = depData.obrero || {};
    totalObreros += Object.keys(obObj).reduce(function(sum, k) {
      return sum + (((obObj[k] || {}).cargos || []).length);
    }, 0);

    var adObj = depData.administrativo || {};
    totalRolesAdmin += Object.keys(adObj).length;

    var doObj = depData.docente || {};
    totalRolesDocente += Object.keys(doObj).length;
  }

  return {
    cargosDocentes: totalRolesDocente,
    cargosAdministrativos: totalRolesAdmin,
    cargosObreros: totalObreros,
    totalPlanes: Object.keys(db.planes_estudio || {}).length,
    totalTurnos: (db.turnos || []).length
  };
}

function _calcularEstadisticasHojaPersonal(forceRefresh) {
  var cache = CacheService.getScriptCache();
  if (forceRefresh) {
    cache.remove("sgh_stats_personal_v4");
  } else {
    var cached = cache.get("sgh_stats_personal_v4");
    if (cached) return JSON.parse(cached);
  }
  
  var stats = {
    total: 0,
    tipoPersonal: {},
    genero: {},
    municipio: {},
    dependencia: {},
    nivelModalidad: {},
    estatus: {},
    byPlantel: {}, // Columna T (índice 19) — Código DEA del plantel
    byPlantelDep: {}, // Desglose por dependencia
    jubilacion: {
      elegibles: 0,
      noElegibles: 0,
      byMunicipio: {},
      byPlantel: {}
    },
    byDependenciaStats: {} // Contenedor global de estadísticas divididas por dependencia
  };
  
  try {
    var ssId = _getProp('SGHD_MAESTRO_SHEET_ID');
    var ss = SpreadsheetApp.openById(ssId);
    var hoja = ss.getSheetByName("PERSONAL");
    if (!hoja) return stats;
    
    var data = hoja.getDataRange().getValues();
    if (data.length < 2) return stats;
    
    var headers = data[0].map(function(h) { return String(h).toUpperCase().trim(); });
    
    var idxTipo = headers.indexOf("TIPO PERSONAL");
    var idxGenero = headers.indexOf("GENERO");
    var idxMuni = headers.indexOf("MUNICIPIO");
    var idxDep = 30;     // AE (El usuario indica la col 31, índice 30)
    var idxNivel = 42;   // AQ (El usuario indica la col 43, índice 42)
    var idxEstatus = 73; // BV (El usuario indica col 74, índice 73)
    var idxPlantel = 20; // U  (Columna U es el Código DEA)
    var idxFechaIng = 38; // AM (El usuario indica col 39, índice 38)
    
    var targetDateJubilacion = new Date(2027, 2, 15); // 15 de marzo de 2027 (mes 2 = marzo)
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[1] && !row[3]) continue; // Sin cédula ni nombre, fila vacía
      
      stats.total++;
      
      var t = idxTipo > -1 && row[idxTipo] ? String(row[idxTipo]).trim() : "SIN ESPECIFICAR";
      var g = idxGenero > -1 && row[idxGenero] ? String(row[idxGenero]).trim() : "SIN ESPECIFICAR";
      var m = idxMuni > -1 && row[idxMuni] ? String(row[idxMuni]).trim() : "SIN ESPECIFICAR";
      var d = row[idxDep] ? String(row[idxDep]).trim().toUpperCase() : "SIN ESPECIFICAR";
      var n = row[idxNivel] ? String(row[idxNivel]).trim() : "SIN ESPECIFICAR";
      var e = row[idxEstatus] ? String(row[idxEstatus]).trim() : "SIN ESPECIFICAR";
      var p = row[idxPlantel] ? String(row[idxPlantel]).trim().toUpperCase() : "";
      var f = row[idxFechaIng];
      
      stats.tipoPersonal[t] = (stats.tipoPersonal[t] || 0) + 1;
      stats.genero[g] = (stats.genero[g] || 0) + 1;
      stats.municipio[m] = (stats.municipio[m] || 0) + 1;
      stats.dependencia[d] = (stats.dependencia[d] || 0) + 1;
      stats.nivelModalidad[n] = (stats.nivelModalidad[n] || 0) + 1;
      stats.estatus[e] = (stats.estatus[e] || 0) + 1;
      // Agrupación por plantel + municipio para el drill-down
      if (p) {
        var mKey = m + '||' + p;
        stats.byPlantel[mKey] = (stats.byPlantel[mKey] || 0) + 1;
        if (!stats.byPlantelDep[mKey]) stats.byPlantelDep[mKey] = {};
        stats.byPlantelDep[mKey][d] = (stats.byPlantelDep[mKey][d] || 0) + 1;
      }
      
      // Construir estadísticas divididas por dependencia
      if (!stats.byDependenciaStats[d]) {
        stats.byDependenciaStats[d] = {
          total: 0, tipoPersonal: {}, genero: {}, municipio: {}, nivelModalidad: {}, estatus: {},
          jubilacion: { elegibles: 0, noElegibles: 0, byPlantel: {} }
        };
      }
      var depStats = stats.byDependenciaStats[d];
      depStats.total++;
      depStats.tipoPersonal[t] = (depStats.tipoPersonal[t] || 0) + 1;
      depStats.genero[g] = (depStats.genero[g] || 0) + 1;
      depStats.municipio[m] = (depStats.municipio[m] || 0) + 1;
      depStats.nivelModalidad[n] = (depStats.nivelModalidad[n] || 0) + 1;
      depStats.estatus[e] = (depStats.estatus[e] || 0) + 1;

      // Cálculo de Jubilación
      var isElegible = false;
      if (f) {
        var fDate = null;
        if (f instanceof Date) {
          fDate = f;
        } else if (typeof f === 'string' && f.trim() !== "") {
          // Intentar parsear (Sheets a veces devuelve un string si el formato no es nativo)
          var parts = f.split(/[\/\-]/);
          if (parts.length === 3) {
            // Asumir formato DD/MM/YYYY o YYYY/MM/DD
            if (parts[0].length === 4) fDate = new Date(parts[0], parts[1]-1, parts[2]); // YYYY-MM-DD
            else fDate = new Date(parts[2], parts[1]-1, parts[0]); // DD-MM-YYYY
          }
        }
        
        if (fDate && !isNaN(fDate.getTime())) {
          var diffMs = targetDateJubilacion.getTime() - fDate.getTime();
          var years = diffMs / (1000 * 60 * 60 * 24 * 365.25);
          if (years >= 25) isElegible = true;
        }
      }

      if (isElegible) {
        stats.jubilacion.elegibles++;
        stats.jubilacion.byMunicipio[m] = (stats.jubilacion.byMunicipio[m] || 0) + 1;
        if (p) {
          var mKey = m + '||' + p;
          stats.jubilacion.byPlantel[mKey] = (stats.jubilacion.byPlantel[mKey] || 0) + 1;
          if (depStats) depStats.jubilacion.byPlantel[mKey] = (depStats.jubilacion.byPlantel[mKey] || 0) + 1;
        }
        if (depStats) depStats.jubilacion.elegibles++;
      } else {
        stats.jubilacion.noElegibles++;
        if (depStats) depStats.jubilacion.noElegibles++;
      }
    }
    
    // Limitar cardinalidad para evitar fallo silencioso en google.script.run y colapso de gráficas
    stats.dependencia = _topN(stats.dependencia, 30);
    stats.municipio = _topN(stats.municipio, 30);
    stats.nivelModalidad = _topN(stats.nivelModalidad, 30);
    
    try {
      cache.put("sgh_stats_personal_v3", JSON.stringify(stats), 3600);
    } catch (e) {
      // Ignorar si aún excede el límite de 100KB del CacheService
    }
    return stats;
  } catch(err) {
    return stats;
  }
}

function _calcularEstadisticasHojaPlanteles(forceRefresh) {
  var cache = CacheService.getScriptCache();
  if (forceRefresh) {
    cache.remove("sgh_stats_planteles_v2");
  } else {
    var cached = cache.get("sgh_stats_planteles_v2");
    if (cached) return JSON.parse(cached);
  }
  
  var stats = {
    total: 0,
    byMunicipio: {},
    byDependencia: {},
    byDenominacion: {},
    byDependenciaStats: {}
  };
  
  try {
    var ssId = _getProp('SGHD_MAESTRO_SHEET_ID');
    var ss = SpreadsheetApp.openById(ssId);
    var hoja = ss.getSheetByName("PLANTELES");
    if (!hoja) return stats;
    
    var data = hoja.getDataRange().getValues();
    if (data.length < 2) return stats;
    
    var headers = data[0].map(function(h) { return String(h).toUpperCase().trim(); });
    
    var idxMuni = headers.indexOf("MUNICIPIO");
    if(idxMuni === -1) idxMuni = 1;
    var idxDep = headers.indexOf("DEPENDENCIA");
    if(idxDep === -1) idxDep = 36;
    var idxDen = headers.indexOf("DENOMINACIÓN");
    if(idxDen === -1) idxDen = headers.indexOf("DENOMINACIN");
    if(idxDen === -1) idxDen = 3;

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[1] && !row[3]) continue; // Fila vacía si municipio y denominación están vacíos
      
      stats.total++;
      
      var m = row[idxMuni] ? String(row[idxMuni]).trim() : "SIN ESPECIFICAR";
      var d = row[idxDep] ? String(row[idxDep]).trim().toUpperCase() : "SIN ESPECIFICAR";
      var den = row[idxDen] ? String(row[idxDen]).trim() : "SIN ESPECIFICAR";
      
      stats.byMunicipio[m] = (stats.byMunicipio[m] || 0) + 1;
      stats.byDependencia[d] = (stats.byDependencia[d] || 0) + 1;
      stats.byDenominacion[den] = (stats.byDenominacion[den] || 0) + 1;
      
      if (!stats.byDependenciaStats[d]) {
        stats.byDependenciaStats[d] = {
          total: 0, byMunicipio: {}, byDenominacion: {}
        };
      }
      var depStats = stats.byDependenciaStats[d];
      depStats.total++;
      depStats.byMunicipio[m] = (depStats.byMunicipio[m] || 0) + 1;
      depStats.byDenominacion[den] = (depStats.byDenominacion[den] || 0) + 1;
    }
    
    // Limitar cardinalidad
    stats.byDependencia = _topN(stats.byDependencia, 30);
    stats.byDenominacion = _topN(stats.byDenominacion, 30);
    stats.byMunicipio = _topN(stats.byMunicipio, 30);

    try {
      cache.put("sgh_stats_planteles_v2", JSON.stringify(stats), 3600);
    } catch(e) {}
    
    return stats;
  } catch(err) {
    return stats;
  }
}

/**
 * Bootstrap unificado: lee permisos y catálogos en una llamada.
 */
function getBootstrapData(clientEmail, forceRefresh) {
  try {
    var access = getUserAccess(clientEmail);
    var db = _readRawDB();
    
    var catalogos = {
      personal:       db.personal       || {},
      turnos:         db.turnos         || [],
      nivel_modalidad: db.nivel_modalidad || { niveles: [], modalidades: [] },
      planes_estudio: db.planes_estudio || {},
      estatus:        db.estatus        || []
    };
    
    var stats = {
      planteles: _calcularStatPlanteles(db),
      hojaPlanteles: _calcularEstadisticasHojaPlanteles(forceRefresh),
      personal: _calcularStatCatalogos(db),
      hojaPersonal: _calcularEstadisticasHojaPersonal(forceRefresh)
    };
    
    return {
      exito: true,
      access: access,
      catalogos: catalogos,
      stats: stats,
      configuracion: db.configuracion || { municipios_activos: [] }
    };
  } catch (e) {
    return { exito: false, error: "Error en bootstrap: " + e.message };
  }
}

/**
 * Carga de planteles (Pesado)
 */
function getMunicipios() {
  try {
    var db = _readRawDB();
    return {
      exito: true,
      estado: db.estado || "Mérida",
      municipios: db.municipios || {}
    };
  } catch(e) {
    return { exito: false, error: e.message };
  }
}

// =============================================================================
// MÓDULO 5 — API PÚBLICA (Escritura)
// =============================================================================

function saveCatalogos(catalogos, modulo, clientEmail) {
  try {
    var access = getUserAccess(clientEmail);
    if (!access.isAdmin && access.permissions.length === 0 && !access.isDashboardOnly) {
      throw new Error("Acceso denegado: No tienes permisos para guardar datos.");
    }
    var db = _readRawDB();
    var uppercased = _toUpperRecursive(catalogos);
    
    const keyMap = {
      "personal": "personal",
      "turnos": "turnos",
      "nivel_modalidad": "nivel-modalidad",
      "planes_estudio": "planes",
      "estatus": "estatus"
    };

    for (const [dbKey, modKey] of Object.entries(keyMap)) {
      if (access.isAdmin || access.isDashboardOnly || access.permissions.includes(modKey)) {
        if(uppercased[dbKey]) {
           db[dbKey] = uppercased[dbKey];
        }
      }
    }
    
    _writeRawDB(db);
    registrarHuellaAuditoria(access.email, "MODIFICAR_CATALOGO", "Catálogos actualizados: " + (modulo||"Varios"));
    return { exito: true };
  } catch(e) {
    return { exito: false, error: e.message };
  }
}

/**
 * Guarda la configuración de despliegue (municipios activos).
 * Solo permitido para ADMINS.
 */
function saveConfiguracion(configuracion, clientEmail) {
  try {
    var access = getUserAccess(clientEmail);
    if (!access.isAdmin) {
      throw new Error("Acceso denegado: Solo los administradores pueden modificar la configuración de despliegue.");
    }
    var db = _readRawDB();
    db.configuracion = configuracion;
    _writeRawDB(db);
    registrarHuellaAuditoria(access.email, "MODIFICAR_CONFIGURACION", "Despliegue: " + JSON.stringify(configuracion.municipios_activos));
    return { exito: true };
  } catch(e) {
    return { exito: false, error: e.message };
  }
}

function savePlantel(municipio, parroquia, codigo, plantelData, clientEmail) {
  try {
    var access = getUserAccess(clientEmail);
    var munNorm = municipio.replace(/\u00e1/g,'a').replace(/\u00e9/g,'e').replace(/\u00ed/g,'i').replace(/\u00f3/g,'o').replace(/\u00fa/g,'u').replace(/\u00c1/g,'a').replace(/\u00c9/g,'e').replace(/\u00cd/g,'i').replace(/\u00d3/g,'o').replace(/\u00da/g,'u').toLowerCase().replace(/[^a-z0-9]/g,'');
    var munKey = "planteles_" + munNorm;
    if (!access.isAdmin && !access.permissions.includes(munKey)) {
      throw new Error("Acceso denegado: No tienes permisos para editar planteles en " + municipio + ".");
    }
    
    var db = _readRawDB();
    var uppercased = _toUpperRecursive(plantelData);
    var originalCod = uppercased.codigo_original;
    delete uppercased.codigo_original;
    
    if (!db.municipios) db.municipios = {};
    if (!db.municipios[municipio]) db.municipios[municipio] = { parroquias: {} };
    if (!db.municipios[municipio].parroquias) db.municipios[municipio].parroquias = {};
    if (!db.municipios[municipio].parroquias[parroquia]) db.municipios[municipio].parroquias[parroquia] = { planteles: {} };
    if (!db.municipios[municipio].parroquias[parroquia].planteles) db.municipios[municipio].parroquias[parroquia].planteles = {};
    
    var esNuevo = false;
    
    if (originalCod && originalCod !== codigo) {
        if (!db.municipios[municipio].parroquias[parroquia].planteles[originalCod]) {
            throw new Error("El plantel original no fue encontrado para renombrar su código.");
        }
        var oldData = db.municipios[municipio].parroquias[parroquia].planteles[originalCod];
        delete db.municipios[municipio].parroquias[parroquia].planteles[originalCod];
        db.municipios[municipio].parroquias[parroquia].planteles[codigo] = oldData;
    } else if (!db.municipios[municipio].parroquias[parroquia].planteles[codigo]) {
        db.municipios[municipio].parroquias[parroquia].planteles[codigo] = {};
        esNuevo = true;
    }
    
    var plantel = db.municipios[municipio].parroquias[parroquia].planteles[codigo];
    
    const EDITABLE_FIELDS = [
      "nombre_plantel", "nuevo_eponimo", "den_abr", "denominacion", 
      "dependencia", "codigo_dependencia", "codigo_dependencia_2", "codigo_estadistico",
      "ubicacion", "nivel", "modalidad", "turno", "metros2", "observaciones", "planes_estudio"
    ];
    EDITABLE_FIELDS.forEach(field => {
      if (Object.prototype.hasOwnProperty.call(uppercased, field)) {
        plantel[field] = uppercased[field];
      }
    });

    _writeRawDB(db);
    registrarHuellaAuditoria(access.email, esNuevo ? "CREAR_PLANTEL" : "MODIFICAR_PLANTEL", codigo);
    return { exito: true };
  } catch(e) {
    return { exito: false, error: e.message };
  }
}

// =============================================================================
// MÓDULO 6 — WEB ENTRY
// =============================================================================
function doGet(e) {
  try {
    var template = HtmlService.createTemplateFromFile('index');
    template.appNombre = 'Admin SGH · Mérida';
    template.appVersion = '1.0.0';
    let resolvedEmail = (e && e.parameter && e.parameter.user) ? e.parameter.user : "";
    if (!resolvedEmail) {
      try { resolvedEmail = Session.getActiveUser().getEmail(); } catch(ex){}
    }
    if (!resolvedEmail) {
      try { resolvedEmail = Session.getEffectiveUser().getEmail(); } catch(ex){}
    }
    template.devUser = resolvedEmail;
    return template.evaluate()
      .setTitle('SGH DB Admin')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (error) {
    var html = '<html><body><h2>Error</h2><p>' + error.message + '</p></body></html>';
    return HtmlService.createHtmlOutput(html);
  }
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// =============================================================================
// MÓDULO 7 — API Y MICROSERVICIOS (Receptor de sgh_gas)
// =============================================================================
/**
 * Recibe peticiones POST de otras aplicaciones (principalmente sgh_gas).
 * Como este script se despliega "Ejecutar como: Yo" (Admin), tiene permisos 
 * totales sobre los Excel. Esto permite que sgh_gas delegue operaciones que 
 * requieren permisos elevados (Auditoría y Cambio de Clave).
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({exito: false, error: "Payload vacío"}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var payload = JSON.parse(e.postData.contents);
    var resultado = { exito: false, error: "Tipo de petición no reconocida" };
    
    if (payload.tipoPeticion === "AUDITORIA") {
      resultado = _apiRegistrarAuditoria(payload.datos);
    } 
    else if (payload.tipoPeticion === "CAMBIAR_CLAVE") {
      resultado = _apiCambiarClave(payload.datos);
    }
    else if (payload.tipoPeticion === "VALIDAR_LOGIN") {
      resultado = _apiValidarLogin(payload.datos);
    }
    
    return ContentService.createTextOutput(JSON.stringify(resultado))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({exito: false, error: err.message}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * [PRIVADO] Procesa la auditoría recibida desde sgh_gas
 */
function _apiRegistrarAuditoria(datos) {
  try {
    var idsToWrite = ["1cZJGc9uILEQXrPy8Jf_lZDTf56e4gowJFo21WFepufc", "1_GuF2QGiOomHiWZKXJ3DrSTEbUPB8qvHC2pz-S_UvsM"];
    
    // Si viene un ID dinámico y no está en la lista, lo agregamos
    if (datos.maestroId && idsToWrite.indexOf(datos.maestroId) === -1) {
      idsToWrite.push(datos.maestroId);
    }
    
    // Si hay un ID en properties que no esté en la lista, lo agregamos
    var propId = PropertiesService.getScriptProperties().getProperty('SGHD_MAESTRO_SHEET_ID');
    if (propId && idsToWrite.indexOf(propId) === -1) {
      idsToWrite.push(propId);
    }

    var filaAuditoria = [[
      Utilities.formatDate(new Date(), "America/Caracas", "dd/MM/yyyy HH:mm:ss"),
      String(datos.usuario || "SISTEMA"),
      String(datos.accion || "ACCIÓN_DESCONOCIDA"),
      String(datos.identificador || ""),
      String(datos.estado || "COMPLETADO")
    ]];

    for (var i = 0; i < idsToWrite.length; i++) {
      try {
        var ss = SpreadsheetApp.openById(idsToWrite[i]);
        var hojaAuditoria = ss.getSheetByName("Histórico_Auditoría") || ss.getSheetByName("Historico_Auditoria");
        
        if (!hojaAuditoria) {
          hojaAuditoria = ss.insertSheet("Histórico_Auditoría");
          hojaAuditoria.appendRow(["Timestamp", "Usuario", "Acción", "Identificador", "Estado"]);
          hojaAuditoria.getRange(1, 1, 1, 5).setFontWeight("bold");
        }
        
        var ultimaFila = hojaAuditoria.getLastRow() + 1;
        hojaAuditoria.getRange(ultimaFila, 1, 1, 5).setValues(filaAuditoria);
      } catch (errSheet) {
        console.log("SGH-ERROR: Fallo al escribir auditoría en hoja " + idsToWrite[i] + ". " + errSheet.message);
      }
    }
    
    return { exito: true };
  } catch(e) {
    return { exito: false, error: e.message };
  }
}

/**
 * [PRIVADO] Procesa el cambio de clave en el Excel correspondiente
 */
function _apiCambiarClave(datos) {
  try {
    var usuario    = String(datos.usuario).trim().toLowerCase();
    var nuevaClave = String(datos.nuevaClave).trim();
    var claveActual = datos.claveActual ? String(datos.claveActual).trim() : null;

    if (!/^\d+$/.test(nuevaClave)) {
      return { exito: false, error: "Por razones de compatibilidad del sistema, la contraseña debe ser estrictamente NUMÉRICA." };
    }

    var maestroId = datos.maestroId
      || PropertiesService.getScriptProperties().getProperty('SGHD_MAESTRO_SHEET_ID');
    if (!maestroId) return { exito: false, error: "SGHD_MAESTRO_SHEET_ID no configurado en servidor." };

    var ssMaestro     = SpreadsheetApp.openById(maestroId);
    var hojaDirectorio = ssMaestro.getSheetByName("DIRECTORIO");
    if (!hojaDirectorio) return { exito: false, error: "Pestaña DIRECTORIO no encontrada." };

    var dirData   = hojaDirectorio.getDataRange().getValues();
    var municipio = "";
    var filaUsuario = -1;

    for (var i = 1; i < dirData.length; i++) {
      if (String(dirData[i][0]).trim().toLowerCase() === usuario) {
        municipio   = String(dirData[i][5]).trim().toUpperCase(); // Columna F: Municipio
        filaUsuario = i;
        break;
      }
    }

    if (filaUsuario < 0) {
      return { exito: false, error: "Usuario no encontrado en el DIRECTORIO maestro." };
    }

    // Validar clave actual si fue enviada
    if (claveActual !== null) {
      var claveEnHoja = String(dirData[filaUsuario][1]).trim(); // Columna B: Clave
      if (claveActual !== claveEnHoja) {
        return { exito: false, error: "La contraseña actual ingresada es incorrecta." };
      }
    }

    // Obtener ID del archivo PLANTELES IDs del municipio desde bd_sgh.json
    var db = _readRawDB();
    var idPlantelesIDs = (db.hojas_sheet && db.hojas_sheet[municipio]) ? db.hojas_sheet[municipio] : null;

    // Fallback para Justo Briceño (posible diferencia de codificación UTF-8 en la clave del JSON)
    if (!idPlantelesIDs && municipio.indexOf("JUSTO") !== -1) {
      for (var key in db.hojas_sheet) {
        if (key.toUpperCase().indexOf("JUSTO") !== -1) {
          idPlantelesIDs = db.hojas_sheet[key];
          break;
        }
      }
    }

    if (!idPlantelesIDs) {
      return { exito: false, error: "ID del documento PLANTELES IDs no encontrado para el municipio: " + municipio };
    }

    var ssMuni      = SpreadsheetApp.openById(idPlantelesIDs);
    var hojaPlanteles = ssMuni.getSheetByName("PLANTELES") || ssMuni.getSheetByName("PLANTEL");

    if (!hojaPlanteles) {
      return { exito: false, error: "Pestaña PLANTELES no encontrada en el documento del municipio." };
    }

    var plantelesData = hojaPlanteles.getDataRange().getValues();
    var actualizado = false;
    for (var j = 1; j < plantelesData.length; j++) {
      if (String(plantelesData[j][0]).trim().toLowerCase() === usuario) {
        hojaPlanteles.getRange(j + 1, 2).setValue(nuevaClave); // Columna B
        actualizado = true;
        break;
      }
    }

    if (actualizado) {
      var identificadorAuditoria = municipio;
      if (db && db.municipios) {
        var usuarioUpper = String(usuario).toUpperCase();
        var encontrado = false;
        for (var mKey in db.municipios) {
          var parroquias = db.municipios[mKey].parroquias;
          if (!parroquias) continue;
          for (var pKey in parroquias) {
            if (parroquias[pKey].planteles && parroquias[pKey].planteles[usuarioUpper]) {
              identificadorAuditoria = parroquias[pKey].planteles[usuarioUpper].nuevo_eponimo || municipio;
              encontrado = true;
              break;
            }
          }
          if (encontrado) break;
        }
      }

      _apiRegistrarAuditoria({
        timestamp:    new Date().toISOString(),
        usuario:      usuario,
        accion:       "CAMBIAR_CLAVE",
        identificador: identificadorAuditoria,
        estado:       "COMPLETADO"
      });
      return { exito: true };
    } else {
      return { exito: false, error: "Usuario no encontrado en la hoja PLANTELES del municipio." };
    }

  } catch(e) {
    return { exito: false, error: "Error en API Cambiar Clave: " + e.message };
  }
}


/**
 * [PRIVADO] Valida el inicio de sesión leyendo el DIRECTORIO maestro
 */
function _apiValidarLogin(datos) {
  try {
    var usuarioBuscado = String(datos.usuario).trim().toLowerCase();
    var claveIngresada = String(datos.claveIngresada).trim();

    var maestroId = datos.maestroId || PropertiesService.getScriptProperties().getProperty('SGHD_MAESTRO_SHEET_ID');
    if (!maestroId) return { exito: false, error: "SGHD_MAESTRO_SHEET_ID no configurado en servidor." };
    
    var ssMaestro = SpreadsheetApp.openById(maestroId);
    var hojaDirectorio = ssMaestro.getSheetByName("DIRECTORIO");
    
    if (!hojaDirectorio) {
      return { exito: false, error: "Pestaña DIRECTORIO maestra no encontrada." };
    }

    var dirData = hojaDirectorio.getDataRange().getValues();
    for (var i = 1; i < dirData.length; i++) {
      if (String(dirData[i][0]).trim().toLowerCase() === usuarioBuscado) {
        var claveReal = String(dirData[i][1]).trim();
        
        if (claveReal === claveIngresada) {
          // A: CODIGO PLANTEL | B: CLAVE | C: ID HOJA PLANTEL | D: CORREO | E: NOMBRE ARCHIVO | F: MUNICIPIO
          var paquete = {
            f: i + 1, // fila (1-indexed)
            c: claveReal,
            i: String(dirData[i][2]).trim(),
            m: String(dirData[i][5]).trim().toUpperCase()
          };
          
          _apiRegistrarAuditoria({
            timestamp: new Date().toISOString(),
            usuario: usuarioBuscado,
            accion: "LOGIN_OK",
            identificador: "Microservicio_SGH",
            estado: "COMPLETADO"
          });
          
          var CLAVE_GENERICA = "123456";
          var requiereCambio = (claveReal === CLAVE_GENERICA);
          
          return { exito: true, paquete: paquete, requireCambioClave: requiereCambio };
        } else {
          return { exito: false, error: "CONTRASEÑA_INCORRECTA" };
        }
      }
    }
    
    return { exito: false, error: "USUARIO_NO_ENCONTRADO" };
  } catch(e) {
    return { exito: false, error: "Error interno en login: " + e.message };
  }
}
