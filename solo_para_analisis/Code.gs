const FILE_NAME = "bd_sgh.json";

// =============================================================================
//  CONFIGURACIÓN DE PERMISOS (RBAC)
// =============================================================================
const PERMISOS_USUARIOS = {
  // Administradores que tienen acceso a TODO el sistema
  ADMINS: ["sistemagestionhumanamr@gmail.com","alfonsozere@gmail.com"], 
  
  // Asignación de correos por módulo
  MODULOS: {
    "planteles":        ["cdcesalasm@gmail.com"],
    "personal":         ["coordinaciondeeducacionsm@gmail.com"],
    "turnos":           ["usuario3@gmail.com"],
    "nivel-modalidad":  ["usuario3@gmail.com"],
    "planes":           ["cuadraturamerida@gmail.com"],
    "estatus":          ["cdcesalasm@gmail.com"]
  }
};

/**
 * Retorna los permisos del usuario activo basado en su correo electrónico.
 */
function getUserAccess() {
  const email = Session.getActiveUser().getEmail().toLowerCase();
  
  // Si no hay correo (ej. permisos insuficientes), retorna sin acceso
  if (!email) {
    return { email: "NO_DETECTADO", permissions: [], isAdmin: false };
  }
  
  if (PERMISOS_USUARIOS.ADMINS.map(e => e.toLowerCase()).includes(email)) {
    return { email, permissions: Object.keys(PERMISOS_USUARIOS.MODULOS), isAdmin: true };
  }
  
  const permissions = [];
  for (const [modulo, correos] of Object.entries(PERMISOS_USUARIOS.MODULOS)) {
    if (correos.map(e => e.toLowerCase()).includes(email)) {
      permissions.push(modulo);
    }
  }
  
  return { email: email, permissions: permissions, isAdmin: false };
}

/**
 * Serves the web application.
 */
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('BD RAC - Dashboard & CRUD')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Helper function to include HTML templates (Styles and JS) into Index.html.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// =============================================================================
//  DRIVE FILE HELPERS
// =============================================================================

/**
 * Finds bd_rac.json in the user's Google Drive.
 * Creates a minimal default structure if not found.
 */
function getFile() {
  const FILE_ID = "14Tm4TFyGKDCbGAFTop50qabmSopWdr_g";
  try {
    return DriveApp.getFileById(FILE_ID);
  } catch (e) {
    const email = Session.getActiveUser().getEmail().toLowerCase();
    throw new Error(
      "No se pudo acceder a la base de datos compartida. " +
      "Por favor, solicite al administrador que comparta el archivo en Google Drive con su correo electrónico (" + email + ") " +
      "con permisos de Editor."
    );
  }
}

/**
 * Reads and parses the full JSON from Drive.
 * @private
 */
function _readRawDB() {
  try {
    const file = getFile();
    return JSON.parse(file.getBlob().getDataAsString());
  } catch (e) {
    throw new Error("Error al leer bd_rac.json en Google Drive: " + e.message);
  }
}

/**
 * Overwrites bd_rac.json in Drive with the given object.
 * @private
 */
function _writeRawDB(data) {
  try {
    const file = getFile();
    file.setContent(JSON.stringify(data, null, 2));
    return { success: true };
  } catch (e) {
    throw new Error("Error al guardar bd_rac.json en Google Drive: " + e.message);
  }
}

// =============================================================================
//  PUBLIC API — CATÁLOGOS (liviano, ~15 KB)
// =============================================================================

/**
 * Returns only the catalog sections (personal, turnos, nivel_modalidad,
 * planes_estudio, estatus). Does NOT transfer the heavy municipios tree.
 * Called on initial page load.
 */
function getCatalogos() {
  const db = _readRawDB();
  return {
    personal:       db.personal       || { docente: [], administrativo: [], obrero: [] },
    turnos:         db.turnos         || [],
    nivel_modalidad: db.nivel_modalidad || { niveles: [], modalidades: [] },
    planes_estudio: db.planes_estudio || [],
    estatus:        db.estatus        || []
  };
}

/**
 * Saves ONLY the catalog sections back to Drive, leaving municipios intact.
 * Valida los permisos para actualizar solo los módulos autorizados.
 * @param {Object} catalogos - { personal, turnos, nivel_modalidad, planes_estudio, estatus }
 */
/**
 * Recursivamente convierte todos los valores tipo string de un objeto o array a mayúsculas.
 */
function toUpperRecursive(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj === "string") {
    return obj.toUpperCase();
  }
  if (Array.isArray(obj)) {
    return obj.map(toUpperRecursive);
  }
  if (typeof obj === "object") {
    const newObj = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = toUpperRecursive(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
}

/**
 * Saves ONLY the catalog sections back to Drive, leaving municipios intact.
 * Valida los permisos para actualizar solo los módulos autorizados.
 * @param {Object} catalogos - { personal, turnos, nivel_modalidad, planes_estudio, estatus }
 */
function saveCatalogos(catalogos) {
  const access = getUserAccess();
  if (!access.isAdmin && access.permissions.length === 0) {
    throw new Error("Acceso denegado: No tienes permisos para guardar datos.");
  }

  const db = _readRawDB();
  const uppercasedCatalogos = toUpperRecursive(catalogos);
  
  // Mapa de claves de la BD hacia las claves de permisos (módulos)
  const keyMap = {
    "personal": "personal",
    "turnos": "turnos",
    "nivel_modalidad": "nivel-modalidad",
    "planes_estudio": "planes",
    "estatus": "estatus"
  };

  // Solo se actualizan las partes de la BD a las que el usuario tiene acceso
  for (const [dbKey, modKey] of Object.entries(keyMap)) {
    if (access.isAdmin || access.permissions.includes(modKey)) {
      db[dbKey] = uppercasedCatalogos[dbKey];
    }
  }

  return _writeRawDB(db);
}

// =============================================================================
//  PUBLIC API — MUNICIPIOS / PLANTELES (pesado, ~850 KB, carga bajo demanda)
// =============================================================================

/**
 * Returns the full estado/municipios tree.
 * Called lazily only when the user opens the Planteles tab.
 */
function getMunicipios() {
  const db = _readRawDB();
  return {
    estado:     db.estado     || "Mérida",
    municipios: db.municipios || {}
  };
}

/**
 * Server-side full-text search across all planteles.
 * Returns a flat list — avoids sending ~850 KB to the client for a search.
 *
 * @param {string} query - Search term (case-insensitive).
 * @returns {Array<Object>} Flat list of matching plantel records.
 */
function searchPlanteles(query) {
  const db = _readRawDB();
  const municipios = db.municipios || {};
  const q = (query || "").trim().toLowerCase();
  const results = [];

  for (const [nomMunicipio, municipioData] of Object.entries(municipios)) {
    const parroquias = municipioData.parroquias || {};
    for (const [nomParroquia, parroquiaData] of Object.entries(parroquias)) {
      const planteles = parroquiaData.planteles || {};
      for (const [codigo, plantel] of Object.entries(planteles)) {
        // Match against code, name, municipality, parish, denomination, dependency
        if (
          !q ||
          codigo.toLowerCase().includes(q) ||
          (plantel.nombre_plantel   || "").toLowerCase().includes(q) ||
          (plantel.nuevo_eponimo    || "").toLowerCase().includes(q) ||
          nomMunicipio.toLowerCase().includes(q)  ||
          nomParroquia.toLowerCase().includes(q)  ||
          (plantel.denominacion     || "").toLowerCase().includes(q) ||
          (plantel.dependencia      || "").toLowerCase().includes(q)
        ) {
          results.push({
            codigo,
            municipio: nomMunicipio,
            parroquia: nomParroquia,
            nombre_plantel:   plantel.nombre_plantel   || "",
            nuevo_eponimo:    plantel.nuevo_eponimo    || "",
            den_abr:          plantel.den_abr          || "",
            denominacion:     plantel.denominacion     || "",
            dependencia:      plantel.dependencia      || "",
            codigo_estadistico: plantel.codigo_estadistico || "",
            // editable optional fields
            ubicacion:        plantel.ubicacion        || null,
            nivel:            plantel.nivel            || null,
            modalidad:        plantel.modalidad        || null,
            turno:            plantel.turno            || null,
            metros2:          plantel.metros2          || null,
            observaciones:    plantel.observaciones    || null,
            planes_estudio:   plantel.planes_estudio   || {}
          });
        }
      }
    }
  }

  return results;
}

/**
 * Returns aggregated summary stats about planteles (for the Dashboard).
 * Reads the full tree but returns only small count objects.
 */
function getPlantelesStats() {
  const db = _readRawDB();
  const municipios = db.municipios || {};

  let total = 0;
  const byDependencia  = {};
  const byMunicipio    = {};
  const byDenominacion = {};

  for (const [nomMunicipio, municipioData] of Object.entries(municipios)) {
    const parroquias = municipioData.parroquias || {};
    for (const parroquiaData of Object.values(parroquias)) {
      const planteles = parroquiaData.planteles || {};
      for (const plantel of Object.values(planteles)) {
        total++;
        const dep = plantel.dependencia || "SIN DATOS";
        const den = plantel.denominacion || "SIN DATOS";
        byDependencia[dep]   = (byDependencia[dep]   || 0) + 1;
        byDenominacion[den]  = (byDenominacion[den]  || 0) + 1;
        byMunicipio[nomMunicipio] = (byMunicipio[nomMunicipio] || 0) + 1;
      }
    }
  }

  return { total, byDependencia, byMunicipio, byDenominacion };
}

/**
 * Updates editable fields of a single plantel and its linked planes_estudio.
 *
 * @param {string} municipio   - Municipality name (key).
 * @param {string} parroquia   - Parish name (key).
 * @param {string} codigo      - Plantel code (key).
 * @param {Object} plantelData - Object with editable fields to merge.
 *        Editable: ubicacion, nivel, modalidad, turno, metros2, observaciones, planes_estudio
 * @returns {{ success: boolean }}
 */
function savePlantel(municipio, parroquia, codigo, plantelData) {
  const access = getUserAccess();
  if (!access.isAdmin && !access.permissions.includes("planteles")) {
    throw new Error("Acceso denegado: No tienes permisos para modificar planteles.");
  }

  const db = _readRawDB();
  const uppercasedPlantelData = toUpperRecursive(plantelData);

  const plantel = (
    db.municipios &&
    db.municipios[municipio] &&
    db.municipios[municipio].parroquias &&
    db.municipios[municipio].parroquias[parroquia] &&
    db.municipios[municipio].parroquias[parroquia].planteles &&
    db.municipios[municipio].parroquias[parroquia].planteles[codigo]
  );

  if (!plantel) {
    throw new Error(
      `Plantel ${codigo} no encontrado en ${municipio} / ${parroquia}.`
    );
  }

  // Only allow updating specific optional/editable fields
  const EDITABLE_FIELDS = [
    "ubicacion", "nivel", "modalidad", "turno",
    "metros2", "observaciones", "planes_estudio"
  ];

  EDITABLE_FIELDS.forEach(field => {
    if (Object.prototype.hasOwnProperty.call(uppercasedPlantelData, field)) {
      db.municipios[municipio].parroquias[parroquia].planteles[codigo][field] =
        uppercasedPlantelData[field];
    }
  });

  return _writeRawDB(db);
}

// =============================================================================
//  LEGACY COMPAT — kept so any old call to getDatabase / saveDatabase
//  from a cached client session still works.
// =============================================================================

/** @deprecated Use getCatalogos() instead. */
function getDatabase() {
  return getCatalogos();
}

/** @deprecated Use saveCatalogos() instead. */
function saveDatabase(data) {
  return saveCatalogos(data);
}
