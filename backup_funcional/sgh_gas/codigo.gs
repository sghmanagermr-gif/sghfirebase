// =============================================================================
// SISTEMA DE GESTIÓN HUMANA (SGH) - v1.0.0
// Archivo: codigo.gs
// Capa de Servidor — Regla de Oro 1: Separación Absoluta de Capas
// Contiene: lógica de negocio, acceso a datos y seguridad.
// El cliente NO ejecuta ninguna de estas funciones directamente.
// =============================================================================

// =============================================================================
// MÓDULO 1: ABSTRACCIÓN DE RECURSOS (Regla de Oro 2)
// Prohibido hardcodear IDs o rutas. Toda referencia se resuelve aquí,
// leyendo el archivo centralizado datos.json en tiempo de ejecución.
// =============================================================================

/**
 * Configuración global embebida directamente en el script.
 * 
 * Regla de Oro 2: Abstracción de Recursos — fuente única de verdad para IDs.
 * NOTA: Se embebe inline para eliminar la dependencia de permisos sobre
 * archivos de Drive durante la autenticación. Actualizar aquí al cambiar IDs.
 */
var CONFIG_GLOBAL = {
  aplicacion: {
    nombre:  "Sistema de Gestión Humana",
    version: "1.0.0"
  },
  hojas_calculo: {
    directorio_maestro_id: "1cZJGc9uILEQXrPy8Jf_lZDTf56e4gowJFo21WFepufc"
  },
  bases_datos_locales: {
    bd_sgh_id: "14Tm4TFyGKDCbGAFTop50qabmSopWdr_g"
  }
};

/**
 * Función de conveniencia que expone los parámetros de la aplicación
 * leyendo la configuración embebida en el script (CONFIG_GLOBAL).
 *
 * Regla de Oro 7: El objeto retornado contiene únicamente strings y números.
 *
 * @returns {{ exito: boolean, appNombre?: string, appVersion?: string,
 *             directorioMaestroId?: string, bdSghId?: string, error?: string }}
 */
function obtenerParametrosApp() {
  try {
    var cfg = CONFIG_GLOBAL;

    // Validación defensiva: verificar que las claves críticas existan.
    if (!cfg.aplicacion || !cfg.hojas_calculo || !cfg.bases_datos_locales) {
      return {
        exito: false,
        error: "Estructura de CONFIG_GLOBAL inválida en codigo.gs."
      };
    }

    var adminUrl = "";
    try {
      var archivoBd = DriveApp.getFileById(cfg.bases_datos_locales.bd_sgh_id);
      var bd = JSON.parse(archivoBd.getBlob().getDataAsString("UTF-8"));
      adminUrl = bd.admin_url || "";
    } catch(e) {}

    // Regla de Oro 7: retorna solo primitivos, nunca el objeto cfg completo.
    return {
      exito:               true,
      appNombre:           String(cfg.aplicacion.nombre),
      appVersion:          String(cfg.aplicacion.version),
      directorioMaestroId: String(cfg.hojas_calculo.directorio_maestro_id),
      bdSghId:             String(cfg.bases_datos_locales.bd_sgh_id),
      adminUrl:            adminUrl
    };

  } catch (e) {
    return {
      exito: false,
      error: "Error inesperado al resolver parámetros: " + e.message
    };
  }
}


// =============================================================================
// MÓDULO 2: PUNTO DE ENTRADA — doGet() (Regla de Oro 6)
// Sirve la interfaz web. Protegido con bloque try/catch.
// Si algo falla, entrega una página de error amigable (nunca un stack trace).
// =============================================================================

/**
 * Punto de entrada obligatorio de la Web App de Google Apps Script.
 * Sirve el archivo principal de interfaz (index.html).
 *
 * Regla de Oro 1: Solo orquesta la presentación; no ejecuta lógica de negocio.
 * Regla de Oro 6: Robustez total — cualquier fallo renderiza una página de error
 *                 amigable en lugar de exponer excepciones al usuario final.
 *
 * @param {GoogleAppsScript.Events.DoGet} e - Evento HTTP GET con parámetros de URL.
 * @returns {GoogleAppsScript.HTML.HtmlOutput}
 */
function doGet(e) {
  try {
    // Verificación temprana de la configuración antes de servir la UI.
    var params = obtenerParametrosApp();
    if (!params.exito) {
      // Fallo controlado: sirve página de error amigable.
      return _servirPaginaError(
        "Error de Configuración",
        "El sistema no pudo iniciar correctamente. Contacte al administrador.<br><em>Detalle: " + params.error + "</em>"
      );
    }

    // Construye y entrega la interfaz principal.
    var plantilla = HtmlService.createTemplateFromFile("index");

    // Inyecta datos de arranque seguros en la plantilla (solo primitivos).
    plantilla.appNombre  = params.appNombre;
    plantilla.appVersion = params.appVersion;

    return plantilla.evaluate()
      .setTitle(params.appNombre + " · v" + params.appVersion)
      .addMetaTag("viewport", "width=device-width, initial-scale=1")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  } catch (error) {
    // Defensa de último recurso — captura cualquier excepción no prevista.
    return _servirPaginaError(
      "Error Interno del Servidor",
      "Ocurrió un error inesperado al cargar la aplicación. Por favor, intente de nuevo."
    );
  }
}

/**
 * [PRIVADO] Genera una página HTML de error autónoma y amigable.
 * No expone detalles técnicos al usuario final.
 *
 * @param {string} titulo   - Título corto del error.
 * @param {string} mensaje  - Descripción amigable del problema.
 * @returns {GoogleAppsScript.HTML.HtmlOutput}
 */
function _servirPaginaError(titulo, mensaje) {
  var html = "<html><head><title>Error — SGH</title>"
    + "<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;"
    + "height:100vh;margin:0;background:#f5f5f5;}"
    + ".card{background:#fff;padding:2rem 3rem;border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,.1);"
    + "max-width:480px;text-align:center;}"
    + "h2{color:#c0392b;margin-bottom:.5rem;}p{color:#555;line-height:1.6;}</style>"
    + "</head><body><div class='card'>"
    + "<h2>⚠ " + titulo + "</h2>"
    + "<p>" + mensaje + "</p>"
    + "</div></body></html>";

  return HtmlService.createHtmlOutput(html)
    .setTitle("Error — Sistema de Gestión Humana");
}


// =============================================================================
// MÓDULO 3: LECTOR DE CATÁLOGOS DESDE DRIVE (bd_sgh_id)
// Lee y parsea el archivo JSON de base de datos local alojado en Drive.
// Retorna datos puros (arrays de objetos planos) listos para el cliente.
// Reglas de Oro 2, 6 y 7.
// =============================================================================

/**
 * Lee el archivo JSON de catálogos (bd_sgh_id) desde Google Drive,
 * parsea su contenido y retorna las estructuras de datos limpias al cliente.
 *
 * Regla de Oro 2: El ID del archivo se resuelve desde datos.json, nunca hardcodeado.
 * Regla de Oro 6: JSON.parse y apertura de archivo protegidos con try/catch.
 * Regla de Oro 7: Retorna solo arrays de objetos con valores primitivos.
 *                 Nunca retorna el Blob, el File object ni estructuras internas de GAS.
 *
 * @returns {{ exito: boolean, catalogos?: Object, error?: string }}
 *
 * Estructura esperada del retorno exitoso:
 * {
 *   exito: true,
 *   catalogos: {
 *     // Las claves dependen del contenido del JSON de la BD.
 *     // Ejemplo: puestos: [...], departamentos: [...], ...
 *   }
 * }
 */
function obtenerCatalogos() {
  try {
    // Paso 1: Resolver el ID de la BD desde la configuración central (Regla de Oro 2).
    var params = obtenerParametrosApp();

    if (!params.exito) {
      return { exito: false, error: "No se pudo leer la configuración: " + params.error };
    }

    var bdSghId = params.bdSghId;

    // Paso 2: Abrir el archivo desde Drive por su ID.
    var archivoBd;
    try {
      archivoBd = DriveApp.getFileById(bdSghId);
    } catch (eDrive) {
      return {
        exito: false,
        error: "No se pudo acceder al archivo de catálogos en Drive. Verifique el ID 'bd_sgh_id' en datos.json."
      };
    }

    // Paso 3: Leer el contenido del Blob como texto UTF-8.
    var contenidoRaw = archivoBd.getBlob().getDataAsString("UTF-8");

    // Paso 4: Parsear el JSON (Regla de Oro 6 — JSON.parse protegido).
    var datos;
    try {
      datos = JSON.parse(contenidoRaw);
    } catch (eParse) {
      return {
        exito: false,
        error: "El archivo de catálogos contiene JSON malformado. Detalle: " + eParse.message
      };
    }

    // Paso 5: Sanitizar — extraer solo las estructuras planas necesarias.
    // Se garantiza que el retorno sean únicamente arrays/primitivos (Regla de Oro 7).
    // Si el JSON tiene propiedades adicionales desconocidas, se ignoran de forma segura.
    var catalogosSanitizados = _sanitizarCatalogos(datos);

    return {
      exito: true,
      catalogos: catalogosSanitizados
    };

  } catch (e) {
    return {
      exito: false,
      error: "Error inesperado al obtener catálogos: " + e.message
    };
  }
}

/**
 * [PRIVADO] Extrae y valida las secciones de catálogos del JSON crudo.
 * Garantiza que solo se propaguen al cliente arrays con valores primitivos.
 *
 * Regla de Oro 7: Barrera de pureza entre los datos crudos de Drive y el cliente.
 *
 * @param {Object} datos - Objeto JavaScript resultante del JSON.parse del archivo BD.
 * @returns {Object} - Objeto con solo los catálogos válidos como arrays planos.
 */
function _sanitizarCatalogos(datos) {
  try {
    // Convierte a string y de vuelta a JSON para eliminar cualquier referencia
    // a objetos complejos de GAS. Mantiene arrays, diccionarios y primitivos intactos.
    return JSON.parse(JSON.stringify(datos));
  } catch(e) {
    return {};
  }
}


// =============================================================================
// MÓDULO 4: TRAZABILIDAD Y AUDITORÍA (Regla de Oro 4)
// Función obligatoria de huella de auditoría. Debe invocarse desde todo
// módulo que inserte, modifique o valide datos críticos en el sistema.
// Registra: timestamp, usuario/origen, acción y estado en la pestaña
// "Histórico_Auditoría" de la hoja del Directorio Maestro.
// =============================================================================

/**
 * Registra de forma persistente una huella de auditoría en la pestaña
 * "Histórico_Auditoría" de la hoja del Directorio Maestro.
 *
 * Regla de Oro 4: Obligatoria en todo flujo de inserción o validación.
 * Regla de Oro 2: El ID del Directorio Maestro se resuelve desde datos.json.
 * Regla de Oro 5: La fila se inyecta en bloque con setValues() (anti-bloqueo).
 * Regla de Oro 6: Protegida con try/catch — un fallo de auditoría nunca
 *                 debe interrumpir el flujo principal; se reporta silenciosamente.
 *
 * Estructura de columnas en "Histórico_Auditoría":
 *   A: Timestamp (ISO 8601)  |  B: Usuario/Origen  |  C: Acción
 *   D: Identificador/Detalle |  E: Estado resultado
 *
 * @param {string} usuario       - Identificador del usuario o proceso que genera el evento.
 * @param {string} accion        - Código de acción (ej. "LOGIN_OK", "LOGIN_FAIL").
 * @param {string} identificador - Dato contextual adicional (ej. cédula, módulo, registro).
 * @param {string} [estado]      - Estado del resultado. Por defecto "COMPLETADO".
 * @returns {{ exito: boolean, error?: string }}
 */
function registrarHuellaAuditoria(usuario, accion, identificador, estado) {
  console.log('[SGH-TRACE] Registrando auditoría: ' + usuario + ' | ' + accion + ' | ' + identificador + ' | ' + estado);
  try {
    var params = obtenerParametrosApp();
    if (!params.exito || !params.adminUrl) {
      console.log("[SGH-TRACE] No hay adminUrl configurada para auditoría.");
      return; // Falla silenciosa permitida
    }
    
    var payload = {
      tipoPeticion: "AUDITORIA",
      datos: {
        timestamp: new Date().toISOString(),
        usuario: String(usuario || "SISTEMA"),
        accion: String(accion || "ACCIÓN_DESCONOCIDA"),
        identificador: String(identificador || ""),
        estado: String(estado || "COMPLETADO"),
        maestroId: params.directorioMaestroId
      }
    };
    
    var options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    UrlFetchApp.fetch(params.adminUrl, options);
  } catch (e) {
    console.log('[SGH-TRACE] Fallo auditoría silencioso: ' + e.message);
  }
}


// =============================================================================
// MÓDULO 5: BÚSQUEDA EN DIRECTORIO MAESTRO (Función privada de soporte)
// Encapsula el acceso a la hoja del Directorio Maestro y la búsqueda
// de un usuario por su identificador. Retorna solo datos primitivos.
// =============================================================================

/**
 * [PRIVADO] Abre el Directorio Maestro y busca un usuario por su identificador.
 *
 * Supuestos de estructura — pestaña "DIRECTORIO":
 *   A: ID/Cédula  |  B: Nombre completo  |  C: Contraseña
 *   D: Rol        |  E: Estado (ACTIVO / INACTIVO)
 *   F: ID_Hoja_Plantel (clave de enrutamiento dinámico multifilial)
 *   G: Plantel/Dependencia  |  H: Correo institucional
 *
 * Regla de Oro 2: El ID del Directorio se recibe como parámetro, ya resuelto.
 * Regla de Oro 5: Lectura en bloque con getValues() — una sola llamada a la API.
 * Regla de Oro 6: Protegida con try/catch en cada operación crítica.
 * Regla de Oro 7: Nunca retorna objetos Sheet, Range ni estructuras internas de GAS.
 *
 * @param {string} directorioMaestroId - ID de la hoja del Directorio Maestro.
 * @param {string} identificador       - Valor a buscar (cédula/usuario).
 * @returns {{
 *   exito: boolean, encontrado: boolean,
 *   cedula?: string, nombre?: string, clave?: string, rol?: string,
 *   estado?: string, idHojaPlantel?: string, plantel?: string,
 *   correo?: string, fila?: number, error?: string
 * }}
 */
function _buscarUsuarioEnDirectorio(directorioMaestroId, identificador) {
  try {
    var ss = SpreadsheetApp.openById(directorioMaestroId);
    var hoja = ss.getSheetByName("DIRECTORIO");
    if (!hoja) return { exito: false, encontrado: false, error: "Pestaña DIRECTORIO no encontrada en el Maestro." };

    var datos = hoja.getDataRange().getValues();
    var cedulaBuscada = String(identificador).trim().toLowerCase();

    for (var i = 1; i < datos.length; i++) {
      if (String(datos[i][0]).trim().toLowerCase() === cedulaBuscada) {
        return {
          exito: true,
          encontrado: true,
          usuario:       String(datos[i][0]).trim().toUpperCase(),
          clave:         String(datos[i][1]).trim(),
          idHojaPlantel: String(datos[i][2]).trim(),
          correo:        String(datos[i][3]).trim(),
          nombreArchivo: String(datos[i][4]).trim(),
          municipio:     String(datos[i][5]).trim().toUpperCase()
        };
      }
    }
    return { exito: true, encontrado: false, error: "Usuario no encontrado en DIRECTORIO." };
  } catch (e) {
    return { exito: false, encontrado: false, error: "Error al leer DIRECTORIO maestro: " + e.message };
  }
}

/**
 * [PRIVADO] Busca la información de un plantel en el JSON de base de datos local
 * recorriendo el árbol jerárquico.
 */
function _obtenerInfoPlantelBD(bdSghId, codigoDea) {
  try {
    var archivoBd = DriveApp.getFileById(bdSghId);
    var contenido = archivoBd.getBlob().getDataAsString("UTF-8");
    var bd = JSON.parse(contenido);
    var bdConfig = bd.configuracion || {};
    
    if (bd.municipios) {
      for (var munKey in bd.municipios) {
        var mun = bd.municipios[munKey];
        if (mun.parroquias) {
          for (var parKey in mun.parroquias) {
            var par = mun.parroquias[parKey];
            if (par.planteles && par.planteles[codigoDea]) {
              return { 
                exito: true, 
                estado: bd.estado,
                municipio: munKey,
                parroquia: parKey,
                plantel: par.planteles[codigoDea],
                configuracion: bdConfig
              };
            }
          }
        }
      }
    }
    return { exito: false, error: "Plantel no encontrado en bd_sgh.json.", configuracion: bdConfig };
  } catch(e) {
    return { exito: false, error: "Error leyendo BD de planteles: " + e.message, configuracion: {} };
  }
}


// =============================================================================
// MÓDULO 6: AUTENTICACIÓN Y ENRUTAMIENTO DINÁMICO MULTIFILIAL
// Valida credenciales del frontend contra el Directorio Maestro.
// Resuelve el ID de la hoja de plantel en el servidor — el cliente nunca
// conoce ni puede manipular este dato directamente.
// Reglas de Oro: 2, 4, 6, 7.
// =============================================================================

/**
 * Valida las credenciales recibidas del frontend contra el Directorio Maestro.
 * Si el acceso es concedido, retorna el perfil mínimo del usuario y el ID de
 * su hoja de plantel asignada (enrutamiento dinámico multifilial).
 *
 * Flujo interno:
 *   1. Validar payload recibido
 *   2. Resolver IDs desde datos.json             (Regla de Oro 2)
 *   3. Buscar usuario en      (Módulo 5)
 *   4. Validar contraseña                        (comparación interna en servidor)
 *   5. Verificar estado ACTIVO                   (control de acceso)
 *   6. Verificar hoja de plantel asignada        (enrutamiento dinámico)
 *   7. Registrar huella de auditoría             (Regla de Oro 4)
 *   8. Retornar perfil plano sin datos sensibles (Regla de Oro 7)
 *
 * ⚠ SEGURIDAD: `idHojaPlantel` se resuelve en el servidor a partir de los
 *   datos del Directorio. El cliente NUNCA envía este ID — previene
 *   manipulación de rutas (Insecure Direct Object Reference).
 * ⚠ La `clave` del usuario NUNCA se incluye en ningún objeto de retorno.
 *
 * @param {{ usuario: string, clave: string }} credenciales
 * @returns {{
 *   exito: boolean, acceso: boolean,
 *   cedula?: string, nombre?: string, rol?: string,
 *   plantel?: string, correo?: string, idHojaPlantel?: string,
 *   error?: string
 * }}
 */
function validarAccesoUsuario(credenciales) {
  console.log('[SGH-TRACE] validarAccesoUsuario iniciado. Usuario: ' +
              (credenciales ? credenciales.usuario : 'SIN_CREDENCIALES'));
  try {
    if (!credenciales || !credenciales.usuario || !credenciales.clave) {
      return {
        exito: false,
        acceso: false,
        error: "Credenciales incompletas."
      };
    }

    var params = obtenerParametrosApp();
    if (!params.exito || !params.adminUrl) {
      return { exito: false, acceso: false, error: "Servidor central no configurado." };
    }

    var payloadValidar = {
      tipoPeticion: "VALIDAR_LOGIN",
      datos: {
        usuario: String(credenciales.usuario).trim(),
        claveIngresada: String(credenciales.clave).trim(),
        maestroId: params.directorioMaestroId
      }
    };

    var options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payloadValidar),
      muteHttpExceptions: true
    };

    var res = JSON.parse(UrlFetchApp.fetch(params.adminUrl, options).getContentText());

    if (!res.exito) {
      return { exito: true, acceso: false, error: res.error || "Login fallido" };
    }

    // El microservicio retorna: res.paquete (i, c, e, n, m)
    var busqueda = {
      usuario: String(credenciales.usuario).trim().toUpperCase(),
      idHojaPlantel: res.paquete.i,
      clave: res.paquete.c,
      nombreArchivo: res.paquete.n
    };

    // --- Paso 5: Extraer info del plantel desde bd_sgh.json ---
    var infoPlantel = _obtenerInfoPlantelBD(params.bdSghId, busqueda.usuario);

    // --- Paso 5.5: Verificar Despliegue (Municipios Activos) ---
    var municipioDelUsuario = infoPlantel.exito ? String(infoPlantel.municipio).trim().toUpperCase() : String(res.paquete.m).trim().toUpperCase();
    var municipiosActivos = (infoPlantel.configuracion && infoPlantel.configuracion.municipios_activos) ? infoPlantel.configuracion.municipios_activos : [];
    
    // Caso A: Ningún municipio activo → sistema cerrado globalmente por mantenimiento
    if (municipiosActivos.length === 0) {
      return {
        exito: true,
        acceso: false,
        error: "⚠ Sistema cerrado por mantenimiento. Por favor, consulte al responsable inmediato."
      };
    }
    
    // Caso B: Hay municipios activos pero el del usuario no está habilitado aún
    if (municipiosActivos.indexOf(municipioDelUsuario) === -1) {
      return {
        exito: true, // La petición técnica tuvo éxito
        acceso: false, // Pero se deniega el acceso lógico
        error: "El sistema no está habilitado actualmente para el municipio: " + municipioDelUsuario + ". Debe consultar la Circular Nº 02."
      };
    }

    var nombreMostrar = busqueda.nombreArchivo || busqueda.usuario;
    var nombreDependencia = "Dependencia MPPE";

    if (infoPlantel.exito && infoPlantel.plantel) {
      nombreMostrar = infoPlantel.plantel.nombre_plantel || busqueda.nombreArchivo || busqueda.usuario;
      nombreDependencia = (infoPlantel.plantel.denominacion || "") + " " + (infoPlantel.plantel.dependencia || "");
    }

    return {
      exito: true,
      acceso: true,
      cedula: busqueda.usuario,
      nombre: String(nombreMostrar),
      rol: "Usuario Institucional",
      plantel: String(nombreDependencia),
      requireCambioClave: res.requireCambioClave || false,
      idHojaPlantel: String(busqueda.idHojaPlantel),
      datosPlantel: (infoPlantel.exito && infoPlantel.plantel) ? infoPlantel.plantel : {},
      estadoPlantel: (infoPlantel.exito) ? String(infoPlantel.estado || "") : "",
      municipioPlantel: (infoPlantel.exito) ? String(infoPlantel.municipio || "") : "",
      parroquiaPlantel: (infoPlantel.exito) ? String(infoPlantel.parroquia || "") : ""
    };



  } catch (e) {
    return {
      exito: false,
      acceso: false,
      error: "Error crítico durante la validación: " + e.message
    };
  }
}

/**
 * Registra en el Histórico de Auditoría la aceptación electrónica
 * de la Declaración Jurada por parte del director.
 * Se invoca desde el frontend al pulsar "ACEPTO Y CERTIFICO".
 */
function registrarAceptacionDeclaracion(cedula) {
  registrarHuellaAuditoria(
    String(cedula || "DESCONOCIDO"),
    "DECLARACION_ACEPTADA",
    "Declaración Jurada MOE/RAC aceptada",
    "COMPLETADO"
  );
}

// =============================================================================
// MÓDULO 7: CONSTANTES DEL ESQUEMA DE DATOS — REGISTRO_PERSONAL
var ENCABEZADOS_REGISTRO_PERSONAL = [
  // ---- IDENTIFICACION (A-C) ----
  "N° REGISTRO",       // A
  "TIMESTAMP",          // B
  "CEDULA",             // C
  // ---- DATOS PERSONALES (D-P) ----
  "NACIONALIDAD",       // D
  "NOMBRE Y APELLIDO",  // E
  "LUGAR DE NACIMIENTO",// F
  "FECHA DE NACIMIENTO",// G
  "EDAD",               // H
  "GENERO",             // I
  "TELEFONO HABITACION",// J
  "TELEFONO CELULAR",   // K
  "TELEFONO OFICINA",   // L
  "CORREO ELECTRONICO", // M
  "ESTADO CIVIL",       // N
  "DIRECCION",          // O
  "NIVEL DE INSTRUCCION",// P
  "PROFESION",          // Q
  // ---- UBICACION DEL PLANTEL (R-AE) ----
  "ESTADO",             // R
  "MUNICIPIO",          // S
  "PARROQUIA",          // T
  "UBICACION FISICA",   // U
  "CODIGO DEL PLANTEL", // V
  "COD. DEPENDENCIA 1", // W
  "COD. DEPENDENCIA 2", // X
  "COD ESTADISTICO",    // Y
  "DEPENDENCIA",        // Z
  "UBICACION GEOGRAFICA",// AA
  "NIVEL",              // AB
  "MODALIDAD",          // AC
  "TURNOS DEL PLANTEL", // AD
  "UBICACION ADMINISTRATIVA", // AE
  // ---- DATOS LABORALES (AF-BU) ----
  "DEPENDENCIA LABORAL",// AF
  "TIPO PERSONAL",      // AG
  "SUB CATEGORIA",      // AH
  "CARGO",              // AI
  "CODIGO CARGO",       // AJ
  "TITULAR/INTERINO/SUPLENTE", // AK
  "HORAS ACADEMICAS",   // AL
  "HORAS ADMINISTRATIVAS", // AM
  "FECHA INGRESO MPPE", // AN
  "ANOS SERVICIO MPPE", // AO
  "TURNOS QUE ATIENDE", // AP
  "ATIENDE MATRICULA",  // AQ
  "NIVEL O MODALIDAD",  // AR
  "ESPECIALIDAD QUE IMPARTE", // AS
  // ---- CUADRATURA (AT-BU) ----
  "MATERNAL",           // AT
  "PREESCOLAR",         // AU
  "PRIMARIA",           // AV
  "31059",              // AW
  "31060",              // AX
  "41048",              // AY
  "41049",              // AZ
  "41052",              // BA
  "41056",              // BB
  "42000",              // BC
  "43291",              // BD
  "43292",              // BE
  "43293",              // BF
  "43295",              // BG
  "43298",              // BH
  "44001",              // BI
  "44004",              // BJ
  "45041",              // BK
  "45043",              // BL
  "45045",              // BM
  "45049",              // BN
  "46067",              // BO
  "46068",              // BP
  "46069",              // BQ
  "46070",              // BR
  "46071",              // BS
  "48069",              // BT
  "49000",              // BU
  "49001",              // BV
  // ---- SITUACION LABORAL Y DATOS SOCIALES (BW-CK) ----
  "SITUACION DEL TRABAJADOR",  // BW
  "OBSERVACION",               // BX
  "TALLA DE CAMISA",           // BY
  "TALLA DE PANTALON",         // BZ
  "TALLA DE ZAPATO",           // CA
  "ACTIVIDAD DEPORTIVA",       // CB
  "ACTIVIDAD CULTURAL",        // CC
  "TIPO DE VIVIENDA",          // CD
  "CONDICION DE VIVIENDA",     // CE
  "TIPO DE MATERIAL",          // CF
  "TIPO DE ENFERMEDAD",        // CG
  "MEDICAMENTO",               // CH
  "POSEE DISCAPACIDAD",        // CI
  "UBCH",                      // CJ
  "CIRCUITO COMUNAL",          // CK
  "CENTRO DE VOTACION",        // CL
  // ---- METADATOS (CM-CN) ----
  "REGISTRADO POR",    // CM
  "ESTADO REGISTRO"    // CN
];

/** @const {number} Cantidad total de columnas del esquema. */


// =============================================================================
// MÓDULO 8: FUNCIONES PRIVADAS DE SOPORTE AL MOTOR DE CÁLCULO
// Implementan la lógica pura en memoria antes de tocar ninguna hoja.
// Regla de Oro 3: El servidor actúa como motor centralizado de cálculo.
// =============================================================================

/**
 * [PRIVADO] Crea o localiza la pestaña "Registro_Personal" en un Spreadsheet.
 * Si no existe, la auto-provisiona con encabezados formateados y fila fija.
 *
 * Regla de Oro 6: Protegida con try/catch implícito del módulo llamador.
 *
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss - Hoja destino del plantel.
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function _autoProvisionarHojaPersonal(ss) {
  var hoja = ss.getSheetByName("Registro_Personal");

  if (!hoja) {
    hoja = ss.insertSheet("Registro_Personal");

    // Insertar encabezados como bloque bidimensional (Regla de Oro 5).
    var bloqueEncabezados = [ENCABEZADOS_REGISTRO_PERSONAL];
    hoja.getRange(1, 1, 1, NUM_COLS_REGISTRO).setValues(bloqueEncabezados);

    // Formato de encabezados: fondo primario del sistema, texto blanco, negrita.
    hoja.getRange(1, 1, 1, NUM_COLS_REGISTRO)
      .setBackground("#4f46e5")
      .setFontColor("#ffffff")
      .setFontWeight("bold")
      .setFontSize(9)
      .setHorizontalAlignment("center");

    // Congelar la fila de encabezados para navegación cómoda.
    hoja.setFrozenRows(1);

    // Anchos de columna orientativos para columnas clave.
    hoja.setColumnWidth(1, 200);  // A: N° Registro
    hoja.setColumnWidth(2, 160);  // B: Timestamp
    hoja.setColumnWidth(6, 200);  // F: Nombre Completo
    hoja.setColumnWidth(16, 120); // P: Antigüedad

    // Auto-redimensionar el resto de columnas.
    hoja.autoResizeColumns(3, NUM_COLS_REGISTRO - 2);
  }

  return hoja;
}

/**
 * [PRIVADO] Calcula la edad en años completos a partir de una fecha de nacimiento.
 * Implementa el cálculo directamente en código (Regla de Oro 3).
 *
 * @param {string} fechaNacimientoStr - Fecha en formato "YYYY-MM-DD" (input HTML date).
 * @returns {number|string} Edad en años o cadena vacía si el dato es inválido.
 */
function _calcularEdadAnios(fechaNacimientoStr) {
  if (!fechaNacimientoStr || String(fechaNacimientoStr).trim() === "") return "";
  try {
    // Parsear sin depender del timezone del servidor (forma segura).
    var partes = String(fechaNacimientoStr).trim().split("-");
    if (partes.length !== 3) return "";

    var fechaNac = new Date(
      Number(partes[0]),
      Number(partes[1]) - 1, // mes base-0
      Number(partes[2])
    );

    if (isNaN(fechaNac.getTime())) return "";

    var hoy   = new Date();
    var edad  = hoy.getFullYear() - fechaNac.getFullYear();
    var delta = hoy.getMonth() - fechaNac.getMonth();

    // Ajuste si el cumpleaños aún no ha ocurrido este año.
    if (delta < 0 || (delta === 0 && hoy.getDate() < fechaNac.getDate())) {
      edad--;
    }

    return (isNaN(edad) || edad < 0 || edad > 120) ? "" : edad;

  } catch (e) {
    return "";
  }
}

/**
 * [PRIVADO] Genera un identificador único de registro con formato SGH-YYYYMMDD-HHMMSS-CEDULA.
 * Implementado en código como parte del motor central (Regla de Oro 3).
 *
 * @param {string} cedula    - Cédula del trabajador.
 * @param {Date}   ahora     - Objeto Date del momento de creación.
 * @returns {string} ID único del registro.
 */
function _generarIdRegistro(cedula, ahora) {
  var pad   = function(n) { return n < 10 ? "0" + n : String(n); };
  var fecha = ahora.getFullYear()
    + pad(ahora.getMonth() + 1)
    + pad(ahora.getDate());
  var hora  = pad(ahora.getHours())
    + pad(ahora.getMinutes())
    + pad(ahora.getSeconds());
  var cedulaLimpia = String(cedula).replace(/[^0-9A-Za-z]/g, "").toUpperCase();

  return "SGH-" + fecha + "-" + hora + "-" + cedulaLimpia;
}

/**
 * [PRIVADO] Motor de cálculo centralizado (Regla de Oro 3).
 * Procesa la lógica en memoria y devuelve el bloque bidimensional listo
 * para ser inyectado con setValues() en la hoja de destino.
 *
 * Calcula en código:
 *   - Nombre completo (concatenación)
 *   - Edad en años (aritmética de fechas)
 *   - ID único de registro (formato SGH-*)
 *   - Cadena de fórmula dinámica de antigüedad (inyectada como string de fórmula)
 *
 * Regla de Oro 5: El retorno es un array bidimensional [ [v1, v2, ..., v24] ]
 *                 listo para una sola llamada a setValues().
 * Regla de Oro 7: Todos los valores son primitivos o cadenas de fórmula.
 *
 * @param {Object} payload   - Datos planos del formulario enviados por el cliente.
 * @param {Object} usuario   - Perfil validado del usuario (resultado de _buscarUsuarioEnDirectorio).
 * @param {number} filaDestino - Número de fila real donde se escribirá en la hoja (base 1).
 * @returns {Array<Array>}   - Bloque 2D: [[col_A, col_B, ..., col_X]]
 */
function _construirFilaRegistro(payload, usuario, filaDestino) {
  var ahora      = new Date();
  var idRegistro = _generarIdRegistro(payload.cedula, ahora);
  var timestamp  = ahora.toISOString();
  var edad       = _calcularEdadAnios(payload.fechaNacimiento);

  var fechaNacDate = "";
  var fechaIngDate = "";
  try {
    if (payload.fechaNacimiento) {
      var pn = payload.fechaNacimiento.split("-");
      fechaNacDate = new Date(Number(pn[0]), Number(pn[1]) - 1, Number(pn[2]));
    }
  } catch(e) { fechaNacDate = String(payload.fechaNacimiento || ""); }
  try {
    if (payload.fechaIngreso) {
      var pi = payload.fechaIngreso.split("-");
      fechaIngDate = new Date(Number(pi[0]), Number(pi[1]) - 1, Number(pi[2]));
    }
  } catch(e) { fechaIngDate = String(payload.fechaIngreso || ""); }

  // Antiguedad como formula dinamica
  var formulaAntiguedad = '=IFERROR(DATEDIF(AN' + filaDestino + ',TODAY(),"Y")&" a\u00f1o(s) "&DATEDIF(AN' + filaDestino + ',TODAY(),"YM")&" mes(es)","\u2014")';

  // Cuadratura: extraer cada plan
  var cuad = (typeof payload.cuadratura === 'object' && payload.cuadratura !== null) ? payload.cuadratura : {};
  function _c(key) { return cuad[key] !== undefined ? String(cuad[key]) : ''; }

  var dp = payload.datosPlantel || {};

  return [[
    idRegistro,                              // A  - N\u00b0 REGISTRO
    timestamp,                               // B  - TIMESTAMP
    String(payload.cedula || ''),            // C  - CEDULA
    String(payload.nacionalidad || ''),      // D  - NACIONALIDAD
    String(payload.nombreApellido || ''),    // E  - NOMBRE Y APELLIDO
    String(payload.lugarNacimiento || ''),   // F  - LUGAR DE NACIMIENTO
    fechaNacDate,                            // G  - FECHA DE NACIMIENTO
    edad,                                    // H  - EDAD
    String(payload.genero || ''),            // I  - GENERO
    String(payload.telHabitacion || ''),     // J  - TELEFONO HABITACION
    String(payload.telCelular || ''),        // K  - TELEFONO CELULAR
    String(payload.telOficina || ''),        // L  - TELEFONO OFICINA
    String(payload.correo || ''),            // M  - CORREO (lowercase mantenido)
    String(payload.estadoCivil || ''),       // N  - ESTADO CIVIL
    String(payload.direccion || ''),         // O  - DIRECCION
    String(payload.instruccion || ''),       // P  - NIVEL DE INSTRUCCION
    String(payload.profesion || ''),         // Q  - PROFESION
    String(payload.estado || ''),            // R  - ESTADO
    String(payload.municipio || ''),         // S  - MUNICIPIO
    String(payload.parroquia || ''),         // T  - PARROQUIA
    String(dp.nombre_plantel || ''),         // U  - UBICACION FISICA
    String(payload.codigoPlantel || ''),     // V  - CODIGO DEL PLANTEL
    String(dp.codigo_dependencia || ''),     // W  - COD. DEPENDENCIA 1
    String(dp.codigo_dependencia_2 || ''),   // X  - COD. DEPENDENCIA 2
    String(dp.codigo_estadistico || ''),     // Y  - COD ESTADISTICO
    String(dp.dependencia || ''),            // Z  - DEPENDENCIA
    String(dp.ubicacion || ''),              // AA - UBICACION GEOGRAFICA
    String(dp.nivel || ''),                  // AB - NIVEL
    String(dp.modalidad || ''),              // AC - MODALIDAD
    String(dp.turno || ''),                  // AD - TURNOS DEL PLANTEL
    String(payload.ubicacionAdministrativa || ''), // AE
    String(payload.dependenciaLaboral || ''),      // AF
    String(payload.tipoPersonal || ''),            // AG
    String(payload.subCategoria || ''),            // AH
    String(payload.cargo || ''),                   // AI
    String(payload.codigoRac || ''),               // AJ
    String(payload.titular || ''),                 // AK
    payload.horasAcademicas || 0,                  // AL
    payload.horasAdministrativas || 0,             // AM
    fechaIngDate,                                  // AN
    formulaAntiguedad,                             // AO
    String(payload.turnosAtiende || ''),           // AP
    String(payload.atiendeMatricula || ''),        // AQ
    String(payload.nivelModalidad || ''),          // AR
    String(payload.especialidadImparte || ''),     // AS
    _c('maternal'),   // AT - MATERNAL
    _c('preescolar'), // AU - PREESCOLAR
    _c('primaria'),   // AV - PRIMARIA
    _c('p31059'),     // AW - 31059
    _c('p31060'),     // AX - 31060
    _c('p41048'),     // AY - 41048
    _c('p41049'),     // AZ - 41049
    _c('p41052'),     // BA - 41052
    _c('p41056'),     // BB - 41056
    _c('p42000'),     // BC - 42000
    _c('p43291'),     // BD - 43291
    _c('p43292'),     // BE - 43292
    _c('p43293'),     // BF - 43293
    _c('p43295'),     // BG - 43295
    _c('p43298'),     // BH - 43298
    _c('p44001'),     // BI - 44001
    _c('p44004'),     // BJ - 44004
    _c('p45041'),     // BK - 45041
    _c('p45043'),     // BL - 45043
    _c('p45045'),     // BM - 45045
    _c('p45049'),     // BN - 45049
    _c('p46067'),     // BO - 46067
    _c('p46068'),     // BP - 46068
    _c('p46069'),     // BQ - 46069
    _c('p46070'),     // BR - 46070
    _c('p46071'),     // BS - 46071
    _c('p48069'),     // BT - 48069
    _c('p49000'),     // BU - 49000
    _c('p49001'),     // BV - 49001
    String(payload.situacionLaboral || ''),        // BW - SITUACION TRABAJADOR
    String(payload.observacionEstatus || ''),      // BX - OBSERVACION
    String(payload.tallaCamisa || ''),             // BY - TALLA CAMISA
    String(payload.tallaPantalon || ''),           // BZ - TALLA PANTALON
    String(payload.tallaZapato || ''),             // CA - TALLA ZAPATO
    String(payload.actividadDeportiva || ''),      // CB - ACTIVIDAD DEPORTIVA
    String(payload.actividadCultural || ''),       // CC - ACTIVIDAD CULTURAL
    String(payload.tipoVivienda || ''),            // CD - TIPO VIVIENDA
    String(payload.condicionVivienda || ''),       // CE - CONDICION VIVIENDA
    String(payload.tipoMaterial || ''),            // CF - TIPO MATERIAL
    String(payload.tipoEnfermedad || ''),          // CG - TIPO ENFERMEDAD
    String(payload.medicamento || ''),             // CH - MEDICAMENTO
    String(payload.discapacidad || ''),            // CI - POSEE DISCAPACIDAD
    String(payload.ubch || ''),                    // CJ - UBCH
    String(payload.circuitoComunal || ''),         // CK - CIRCUITO COMUNAL
    String(payload.centroVotacion || ''),          // CL - CENTRO VOTACION
    String(usuario.cedula || ''),                  // CM - REGISTRADO POR
    "ACTIVO"                                       // CN - ESTADO REGISTRO
  ]];
}


// =============================================================================
// MÓDULO 9: CÓDIGO LEGACY — _LEGACY_guardarRegistroPersonal_NO_USAR()
// ⚠ RETIRADO (2026-07): Esta versión fue desplazada por la función activa en
// MÓDULO 10 (L. 1718+). En GAS, si dos funciones tienen el mismo nombre,
// la segunda sobrescribe a la primera en tiempo de ejecución.
// Esta versión NUNCA se ejecutó en producción. Se conserva por trazabilidad.
// NO MODIFICAR NI LLAMAR.
// =============================================================================

/**
 * Recibe el payload plano del formulario, re-valida al usuario en el servidor,
 * resuelve dinámicamente la hoja de destino del plantel, procesa los datos en
 * memoria como motor de cálculo centralizado y los inyecta en un único bloque.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * FLUJO INTERNO (Patrón SKILL — Inyección Distributiva):
 *
 *   1. Validar payload básico                        (Regla de Oro 6)
 *   2. Resolver params desde datos.json             (Regla de Oro 2)
 *   3. Re-validar usuario en Directorio Maestro      (Seguridad IDOR)
 *   4. Resolver idHojaPlantel desde Directorio       (Regla de Oro 2)
 *   5. Abrir hoja de destino del plantel             (acceso dinámico)
 *   6. Auto-provisionar pestaña Registro_Personal    (resiliencia)
 *   7. Motor de cálculo: construir bloque 2D memory  (Regla de Oro 3)
 *      — Nombre completo, Edad, ID, Fórmula Antigüedad
 *   8. Inyección en bloque: setValues() x1           (Regla de Oro 5)
 *   9. Registrar huella de auditoría                 (Regla de Oro 4)
 *  10. Retornar objeto plano al cliente              (Regla de Oro 7)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * ⚠ SEGURIDAD:
 *   - El `idHojaPlantel` del payload es IGNORADO. Se re-resuelve desde el
 *     Directorio Maestro para prevenir ataques IDOR.
 *   - El usuario se re-verifica como ACTIVO antes de permitir escritura.
 *
 * @param {{
 *   usuarioRegistrador: string,
 *   cedula: string, nombres: string, apellidos: string,
 *   fechaNacimiento: string, sexo: string, estadoCivil: string,
 *   cargo: string, departamento: string, tipoContrato: string,
 *   nivelInstruccion: string, fechaIngreso: string, codigoMppe: string,
 *   telefono: string, correoPersonal: string, municipio: string,
 *   direccion: string
 * }} payload - Objeto plano con primitivos del formulario (Regla de Oro 7).
 *
 * @returns {{
 *   exito: boolean,
 *   idRegistro?: string,
 *   mensaje?: string,
 *   error?: string
 * }}
 */
function _LEGACY_guardarRegistroPersonal_NO_USAR(payload) {
  try {

    // ── PASO 1: Validación básica del payload (Regla de Oro 6) ───────────
    if (!payload || !payload.usuarioRegistrador || !payload.cedula
        || !payload.nombres || !payload.apellidos) {
      return {
        exito: false,
        error: "Payload inválido. Faltan campos obligatorios (cédula, nombres, apellidos, usuarioRegistrador)."
      };
    }

    // ── PASO 2: Resolver IDs desde datos.json (Regla de Oro 2) ───────────
    var params = obtenerParametrosApp();
    if (!params.exito) {
      return { exito: false, error: "Error de configuración del sistema: " + params.error };
    }

    // ── PASO 3: Re-validar usuario en el Directorio Maestro ──────────────
    // ⚠ NO se confía en el idHojaPlantel del cliente — se resuelve de nuevo.
    var busqueda = _buscarUsuarioEnDirectorio(
      params.directorioMaestroId,
      payload.usuarioRegistrador
    );

    if (!busqueda.exito) {
      registrarHuellaAuditoria(
        payload.usuarioRegistrador, "GUARDADO_ERROR_SISTEMA",
        payload.cedula, "FALLO"
      );
      return { exito: false, error: "Error al verificar el usuario: " + busqueda.error };
    }

    if (!busqueda.encontrado) {
      registrarHuellaAuditoria(
        payload.usuarioRegistrador, "GUARDADO_ACCESO_DENEGADO",
        payload.cedula, "DENEGADO"
      );
      return { exito: false, error: "Usuario no autorizado para registrar datos." };
    }

    if (String(busqueda.estado).trim().toUpperCase() !== "ACTIVO") {
      registrarHuellaAuditoria(
        busqueda.cedula, "GUARDADO_CUENTA_INACTIVA",
        payload.cedula, "DENEGADO"
      );
      return { exito: false, error: "Cuenta inactiva. No se puede registrar información." };
    }

    // ── PASO 4: Resolver idHojaPlantel desde el Directorio (Regla de Oro 2) ─
    var idHojaPlantel = String(busqueda.idHojaPlantel).trim();
    if (!idHojaPlantel || idHojaPlantel === "" || idHojaPlantel === "undefined") {
      return {
        exito: false,
        error: "El usuario no tiene hoja de plantel asignada. Contacte al administrador."
      };
    }

    // ── PASO 5: Abrir la hoja de destino del plantel ─────────────────────
    var ssDestino;
    try {
      ssDestino = SpreadsheetApp.openById(idHojaPlantel);
    } catch (eDrive) {
      registrarHuellaAuditoria(
        busqueda.cedula, "GUARDADO_ERROR_HOJA",
        idHojaPlantel, "FALLO"
      );
      return {
        exito: false,
        error: "No se pudo acceder a la hoja del plantel. Verifique el ID en el Directorio Maestro."
      };
    }

    // ── PASO 6: Auto-provisionar pestaña Registro_Personal ───────────────
    var hojaDestino  = _autoProvisionarHojaPersonal(ssDestino);
    var filaDestino  = hojaDestino.getLastRow() + 1;

    // ── PASO 7: Motor de cálculo — construir bloque 2D en memoria ────────
    //    (Regla de Oro 3: lógica centralizada en servidor)
    //    (Regla de Oro 5: preparación completa antes de cualquier escritura)
    var bloqueDatos  = _construirFilaRegistro(payload, busqueda, filaDestino);
    var idRegistro   = bloqueDatos[0][0]; // Extraer el ID antes de escribir

    // ── PASO 8: Inyección en bloque — UNA SOLA operación setValues() ─────
    //    (Regla de Oro 5: anti-bloqueo, sin escrituras iterativas)
    hojaDestino
      .getRange(filaDestino, 1, 1, NUM_COLS_REGISTRO)
      .setValues(bloqueDatos);

    // ── PASO 9: Registrar huella de auditoría (Regla de Oro 4) ───────────
    registrarHuellaAuditoria(
      busqueda.cedula,
      "REGISTRO_PERSONAL_GUARDADO",
      "Trabajador: " + payload.cedula + " | ID: " + idRegistro + " | Plantel: " + busqueda.plantel,
      "COMPLETADO"
    );

    // ── PASO 10: Retornar resultado plano (Regla de Oro 7) ───────────────
    return {
      exito:      true,
      idRegistro: idRegistro,
      mensaje:    "Registro guardado exitosamente en " + busqueda.plantel + "."
    };

  } catch (e) {
    // Defensa de último recurso — registrar y retornar objeto plano.
    registrarHuellaAuditoria(
      (payload && payload.usuarioRegistrador) || "DESCONOCIDO",
      "GUARDADO_EXCEPCION_CRITICA",
      (payload && payload.cedula) || "",
      "FALLO"
    );
    return {
      exito: false,
      error: "Error crítico al guardar el registro: " + e.message
    };
  }
}

// =============================================================================
// MÓDULO 10: GUARDAR MATRÍCULA Y DATOS DEL PLANTEL
// =============================================================================

/**
 * Actualiza únicamente las vacantes (columna BW) en la hoja PLANTEL.
 * Se llama automáticamente desde el frontend cuando un empleado cubre una vacante.
 *
 * @param {Object} payload { usuarioRegistrador, vacantes }
 * @returns {Object} { exito, error }
 */
function guardarSoloVacantes(payload) {
  try {
    var params = obtenerParametrosApp();
    if (!params.exito) return { exito: false, error: "Error de config." };

    var busqueda;
    try {
      busqueda = _buscarUsuarioEnDirectorio(params.directorioMaestroId, payload.usuarioRegistrador);
    } catch (e) {
      return { exito: false, error: "PERMISO_DENEGADO_MAESTRO: " + e.message };
    }
    if (!busqueda.exito || !busqueda.encontrado) return { exito: false, error: "Usuario no válido: " + (busqueda.error || "") };

    var ssDestino;
    try {
      ssDestino = SpreadsheetApp.openById(busqueda.idHojaPlantel);
    } catch (e) {
      return { exito: false, error: "PERMISO_DENEGADO_PLANTEL (ID: " + busqueda.idHojaPlantel + "): " + e.message };
    }
    var hojaPlantel = ssDestino.getSheetByName("PLANTEL");
    if (!hojaPlantel) return { exito: false, error: "Hoja PLANTEL no encontrada." };

    var vacantesStr = (payload.vacantes && Object.keys(payload.vacantes).length > 0)
      ? JSON.stringify(payload.vacantes) : '';
    hojaPlantel.getRange(2, 75).setValue(vacantesStr);

    // Regla de Oro 4: Toda modificación de datos debe dejar huella de auditoría.
    registrarHuellaAuditoria(
      payload.usuarioRegistrador,
      "ACTUALIZAR_VACANTES",
      payload.usuarioRegistrador,
      "COMPLETADO"
    );
    return { exito: true };
  } catch (e) {
    return { exito: false, error: "Error en guardarSoloVacantes: " + (e.message || "Error desconocido") };
  }
}

/**
 * Retorna las coordenadas de las celdas de secciones por año para un plan específico.
 * @param {string} codPlan Código del plan de estudio
 * @param {boolean} conDolar Si es true, retorna con $ (ej: M$3) para fórmulas.
 * @returns {Array<string>|null} Arreglo con las celdas o null si no se reconoce.
 */
function _obtenerCeldasSeccionesMedia(codPlan, conDolar) {
  var codStr = String(codPlan).trim();
  var arr = null;
  if (codStr.startsWith('4')) {
    arr = ['M3', 'Y3', 'AK3', 'AW3', 'BI3', 'BU3']; // Mismo mapa para todos los 4****
  } else if (codStr === '31059') {
    arr = ['L3', 'U3', 'AD3', 'AO3', 'AZ3'];
  } else if (codStr === '31060') {
    arr = ['L3', 'V3', 'AF3', 'AP3', 'AZ3'];
  }
  
  if (arr && conDolar) {
    return arr.map(function(c) { return c.replace('3', '$3'); });
  }
  return arr;
}

/**
 * Guarda los datos institucionales (metadata y matrícula) en la pestaña "PLANTEL".
 *
 * @param {Object} payload Datos con usuarioRegistrador, idHojaPlantel, datosPlantel y matricula.
 * @returns {Object} { exito, error }
 */
function guardarDatosPlantel(payload) {
  try {
    var params = obtenerParametrosApp();
    if (!params.exito) return { exito: false, error: "Error de config." };

    var busqueda;
    try {
      busqueda = _buscarUsuarioEnDirectorio(params.directorioMaestroId, payload.usuarioRegistrador);
    } catch (e) {
      return { exito: false, error: "PERMISO_DENEGADO_MAESTRO: " + e.message };
    }
    if (!busqueda.exito || !busqueda.encontrado) return { exito: false, error: "Usuario no válido: " + (busqueda.error || "") };

    var ssDestino;
    try {
      ssDestino = SpreadsheetApp.openById(busqueda.idHojaPlantel);
    } catch (e) {
      return { exito: false, error: "PERMISO_DENEGADO_PLANTEL (ID: " + busqueda.idHojaPlantel + "): " + e.message };
    }
    var hojaPlantel = ssDestino.getSheetByName("PLANTEL");
    if (!hojaPlantel) {
      hojaPlantel = ssDestino.insertSheet("PLANTEL");
    }

    var infoPlantel;
    try {
      infoPlantel = _obtenerInfoPlantelBD(params.bdSghId, payload.usuarioRegistrador.toUpperCase());
    } catch (e) {
      return { exito: false, error: "PERMISO_DENEGADO_BD_JSON: " + e.message };
    }
    var dp = infoPlantel.exito ? infoPlantel.plantel : {};
    var estadoPlantel = infoPlantel.exito ? String(infoPlantel.estado) : "";
    var municipioPlantel = infoPlantel.exito ? String(infoPlantel.municipio) : "";
    var parroquiaPlantel = infoPlantel.exito ? String(infoPlantel.parroquia) : "";

    var m = payload.matricula || {};

    var planes = dp.planes_estudio || {};
    var arrPlanes = Object.keys(planes).sort();

    // Arrays para planes.
    // Plan 1 (20000)
    var p1 = arrPlanes.indexOf("20000") >= 0 ? "20000" : "";
    // Plan 2 (21000)
    var p2 = arrPlanes.indexOf("21000") >= 0 ? "21000" : "";
    
    // Planes 3 a 10 (cód > 30000)
    var planesMedia = arrPlanes.filter(function(p) { return p !== "20000" && p !== "21000"; });
    
    var getPlanInfo = function(idx) {
      if (idx < planesMedia.length) {
        var cod = planesMedia[idx];
        var info = planes[cod];
        return [cod, info.especialidad || "", info.mencion || ""];
      }
      return ["", "", ""];
    };

    var pm3 = getPlanInfo(0);
    var pm4 = getPlanInfo(1);
    var pm5 = getPlanInfo(2);
    var pm6 = getPlanInfo(3);
    var pm7 = getPlanInfo(4);
    var pm8 = getPlanInfo(5);
    var pm9 = getPlanInfo(6);
    var pm10 = getPlanInfo(7);

    // Mapeo exacto de las 74 columnas (A-BV)
    var filaData = [
      estadoPlantel,                                // A: ESTADO
      municipioPlantel,                             // B: MUNICIPIO
      parroquiaPlantel,                             // C: PARROQUIA
      dp.denominacion || "",                        // D: DENOMINACIÓN
      p1,                                           // E: PLAN DE ESTUDIO 1
      p2,                                           // F: PLAN DE ESTUDIO 2
      pm3[0], pm3[1], pm3[2],                       // G, H, I: PLAN 3
      pm4[0], pm4[1], pm4[2],                       // J, K, L: PLAN 4
      pm5[0], pm5[1], pm5[2],                       // M, N, O: PLAN 5
      pm6[0], pm6[1], pm6[2],                       // P, Q, R: PLAN 6
      pm7[0], pm7[1], pm7[2],                       // S, T, U: PLAN 7
      pm8[0], pm8[1], pm8[2],                       // V, W, X: PLAN 8
      pm9[0], pm9[1], pm9[2],                       // Y, Z, AA: PLAN 9
      pm10[0], pm10[1], pm10[2],                    // AB, AC, AD: PLAN 10
      dp.nombre_plantel || "",                      // AE: NOMBRE NOMINAL
      dp.nuevo_eponimo || "",                       // AF: NUEVO EPÓNIMO
      busqueda.usuario || "",                       // AG: CÓDIGO PLANTEL (DEA)
      dp.codigo_dependencia || "",                  // AH: COD DEPENDENCIA 1
      dp.codigo_dependencia_2 || "",                // AI: COD DEPENDENCIA 2
      dp.codigo_estadistico || "",                  // AJ: COD ESTADISTICO
      dp.dependencia || "",                         // AK: DEPENDENCIA
      dp.ubicacion || "",                           // AL: UBICACIÓN GEOGRAFICA
      dp.nivel || "",                               // AM: NIVEL
      dp.modalidad || "",                           // AN: MODALIDAD
      dp.turno || "",                               // AO: TURNOS
      dp.metros2 || "",                             // AP: METROS 2

      // MATRÍCULA
      m.matFem, m.matMas, m.matTot,                 // AQ-AS
      m.preFem, m.preMas, m.preTot,                 // AT-AV
      m.iniFem, m.iniMas, m.iniTot,                 // AW-AY
      m.priFem, m.priMas, m.priTot,                 // AZ-BB
      m.mgFem, m.mgMas, m.mgTot,                    // BC-BE
      m.mtFem, m.mtMas, m.mtTot,                    // BF-BH
      m.aduFem, m.aduMas, m.aduTot,                 // BI-BK
      m.espFem, m.espMas, m.espTot,                 // BL-BN
      m.granTot,                                    // BO

      // SECCIONES
      m.secMat, m.secPre, m.secPri, m.secMg, m.secMt, m.secAdu, m.secEsp // BP-BV
    ];

    hojaPlantel.getRange(2, 1, 1, 74).setValues([filaData]);
    // Columna BW (75): Vacantes en JSON
    var vacantesStr = (payload.vacantes && Object.keys(payload.vacantes).length > 0) ? JSON.stringify(payload.vacantes) : '';
    hojaPlantel.getRange(2, 75).setValue(vacantesStr);

    // ==========================================
    // IMPRIMIR EN HOJAS DE CUADRATURA (MEDIA)
    // ==========================================
    var secAnio = m.seccionesPorAnio || {};
    
    var catalogosGlobales = null;
    if (planesMedia.length > 0) {
      catalogosGlobales = obtenerCatalogos();
    }

    planesMedia.forEach(function(codPlan) {
      var sh = ssDestino.getSheetByName(codPlan);
      if (sh) {
        var isMg = String(codPlan).charAt(0) === '3';
        var isMt = String(codPlan).charAt(0) === '4';
        var matPlan = isMg ? (m.mgTot || 0) : (isMt ? (m.mtTot || 0) : 0);
        
        sh.getRange("K2").setValue(busqueda.usuario || "");
        sh.getRange("W2").setValue(dp.nombre_plantel || "");
        sh.getRange("AU2").setValue(matPlan);

        // Imprimir secciones por año
        var cells = _obtenerCeldasSeccionesMedia(codPlan, false);
        if (cells && secAnio[codPlan]) {
          for (var i = 1; i <= cells.length; i++) {
            var val = parseInt(secAnio[codPlan][i], 10);
            if (!isNaN(val) && val > 0) {
              sh.getRange(cells[i-1]).setValue(val);
            }
          }
        }
        
        // Imprimir Asignaturas y Horas en filas 4 y 5 — Acceso O(1)
        var planInfoArr = null;
        var catalogosPE = catalogosGlobales && catalogosGlobales.exito && catalogosGlobales.catalogos
                          ? catalogosGlobales.catalogos.planes_estudio
                          : null;

        if (catalogosPE && !Array.isArray(catalogosPE)) {
          // Nueva arquitectura: diccionario { "31059": {...}, ... }
          var planObj = catalogosPE[String(codPlan)];
          if (planObj) {
            planInfoArr = planObj.grados || [];
          }
        } else if (Array.isArray(catalogosPE)) {
          // Compatibilidad con estructura legacy (arreglo)
          for (var idxCat = 0; idxCat < catalogosPE.length; idxCat++) {
            if (String(catalogosPE[idxCat].codigo) === String(codPlan)) {
              planInfoArr = catalogosPE[idxCat].grados || [];
              break;
            }
          }
        } else {
          // Regla de Oro 6: los errores se registran en el log interno, NUNCA en celdas de datos.
          console.error("[SGH] Plan " + codPlan + ": error al cargar catálogos: " + (catalogosGlobales ? catalogosGlobales.error : "catalogos null"));
        }

        if (Array.isArray(planInfoArr)) {
          var blockSizes = [];
          if (String(codPlan).startsWith('4')) {
            blockSizes = [12, 12, 12, 12, 12, 12];
          } else if (String(codPlan) === '31059') {
            blockSizes = [9, 9, 10, 11, 12];
          } else if (String(codPlan) === '31060') {
            blockSizes = [10, 10, 10, 10, 10];
          }

          if (blockSizes.length > 0) {
            var totalCols = blockSizes.reduce(function(a, b) { return a + b; }, 0);
            var asigNamesFull = [];
            var asigHoursFull = [];

            // Construir lookup de grados por número de año O(1)
            var gradosByAnio = {};
            for (var gi = 0; gi < planInfoArr.length; gi++) {
              gradosByAnio[parseInt(planInfoArr[gi].anio, 10)] = planInfoArr[gi].asignaturas || [];
            }

            for (var a = 0; a < blockSizes.length; a++) {
              var anioNum = a + 1;
              var maxCols = blockSizes[a];
              var asigs = gradosByAnio[anioNum] || [];
              
              for (var i = 0; i < maxCols; i++) {
                if (i < asigs.length) {
                  asigNamesFull.push(asigs[i].nombre || "");
                  asigHoursFull.push(asigs[i].horas || "");
                } else {
                  asigNamesFull.push("");
                  asigHoursFull.push("");
                }
              }
            }
            
            if (asigNamesFull.length === totalCols) {
              try {
                sh.getRange(4, 8, 1, totalCols).setValues([asigNamesFull]);
                sh.getRange(5, 8, 1, totalCols).setValues([asigHoursFull]);
              } catch (errSetValues) {
                // Regla de Oro 6: error al inyectar asignaturas — log interno, no en celda.
                console.error("[SGH] Plan " + codPlan + ": error setValues asignaturas: " + errSetValues.toString());
              }
            }
          }
        } else {
          // Regla de Oro 6: plan sin asignaturas en catálogo — aviso en log interno.
          console.warn("[SGH] planInfoArr no encontrado para plan: " + codPlan);
        }
      }
    });

    // ==========================================
    // FASE 3.2: Generar Matriz en hoja BASICA
    // ==========================================
    var hojaBasica = ssDestino.getSheetByName("BASICA");
    if (!hojaBasica) {
      hojaBasica = ssDestino.insertSheet("BASICA");
    }
    
    // Solo limpiar celdas dinámicas para NO dañar la plantilla, bordes ni celdas combinadas
    hojaBasica.getRange("H2").clearContent();
    hojaBasica.getRange("W2").clearContent();
    hojaBasica.getRange("AX2").clearContent();
    hojaBasica.getRange("BG2").clearContent();
    
    // Limpiar las celdas de "Cantidad de Secciones" en la Fila 3
    var colCantidades = [12, 22, 32, 42, 52, 62, 72, 82]; // L, V, AF, AP, AZ, BJ, BT, CD
    colCantidades.forEach(function(col) {
      hojaBasica.getRange(3, col).clearContent();
    });
    
    // Limpiar los nombres de las secciones en la fila 4 (desde H hasta CI)
    var rangoSecciones = hojaBasica.getRange(4, 8, 1, 80);
    rangoSecciones.clearContent();
    // Forzar orientación vertical para prevenir pérdida de formato si la celda original no lo tenía
    rangoSecciones.setTextRotation(90);
    rangoSecciones.setVerticalAlignment("middle");
    rangoSecciones.setHorizontalAlignment("center");
    
    // Llenar Fila 2: Cabecera principal
    hojaBasica.getRange(2, 8).setValue(busqueda.usuario || ""); // H2
    hojaBasica.getRange(2, 23).setValue(dp.nombre_plantel || ""); // W2
    var codDep = (dp.codigo_dependencia || "") + (dp.codigo_dependencia_2 ? " / " + dp.codigo_dependencia_2 : "");
    hojaBasica.getRange(2, 50).setValue(codDep); // AX2
    var sumaIniPri = (parseInt(m.iniTot, 10) || 0) + (parseInt(m.priTot, 10) || 0);
    hojaBasica.getRange(2, 59).setValue(sumaIniPri); // BG2
    
    // Helpers para distribución
    function _letraSec(s, nTotal) {
      return nTotal === 1 ? 'U' : String.fromCharCode(65 + s);
    }
    function _distribuirSecciones(numSec, numGrados) {
      var base = Math.floor(numSec / numGrados);
      var resto = numSec % numGrados;
      var dist = [];
      for (var g = 0; g < numGrados; g++) {
        dist.push(base + (g < resto ? 1 : 0));
      }
      return dist;
    }
    
    // Dibuja la cuenta y los nombres de las secciones sin tocar la etiqueta fija
    // countCol: columna EXACTA donde se escribe el conteo (1-based). Si se omite, se usa colInicio+4.
    function dibujarBloque(colInicio, countSecciones, nombresArray, countCol) {
      if (!countSecciones) return;
      var colCount = (typeof countCol === 'number') ? countCol : (colInicio + 4);
      hojaBasica.getRange(3, colCount).setValue(countSecciones);
      var limit = Math.min(countSecciones, 10);
      var fila4 = [];
      for(var i=0; i<10; i++) {
        fila4.push(i < limit ? nombresArray[i] : '');
      }
      hojaBasica.getRange(4, colInicio, 1, 10).setValues([fila4]);
    }

    var secMat = parseInt(m.secMat, 10) || 0;
    if (secMat > 0) {
      var arrMat = []; for(var s=0; s<secMat; s++) arrMat.push('SECCIÓN ' + _letraSec(s, secMat));
      dibujarBloque(8, secMat, arrMat, 12);
    }
    
    var secPre = parseInt(m.secPre, 10) || 0;
    if (secPre > 0) {
      var arrPre = []; for(var s=0; s<secPre; s++) arrPre.push('SECCIÓN ' + _letraSec(s, secPre));
      dibujarBloque(18, secPre, arrPre, 22);
    }
    
    var secPri = parseInt(m.secPri, 10) || 0;
    if (secPri > 0) {
      var dist = _distribuirSecciones(secPri, 6);
      var ordinales = ['1ER GRADO', '2DO GRADO', '3ER GRADO', '4TO GRADO', '5TO GRADO', '6TO GRADO'];
      // Columna inicio y columna conteo explícitas para cada grado
      // Cada bloque ocupa 10 columnas; countCol = colInicio+4 salvo que la plantilla lo tenga diferente
      var bloquesPri = [
        { col: 28, countCol: 32 },  // 1ER GRADO: AB, conteo en AF
        { col: 38, countCol: 42 },  // 2DO GRADO: AL, conteo en AP
        { col: 48, countCol: 52 },  // 3ER GRADO: AV, conteo en AZ
        { col: 58, countCol: 62 },  // 4TO GRADO: BF, conteo en BJ
        { col: 68, countCol: 72 },  // 5TO GRADO: BP, conteo en BT
        { col: 78, countCol: 82 }   // 6TO GRADO: BZ, conteo en CD
      ];
      for(var g=0; g<6; g++) {
        if (dist[g] > 0) {
          var arrGrado = [];
          for(var s=0; s<dist[g]; s++) arrGrado.push(ordinales[g] + ' ' + _letraSec(s, dist[g]));
          dibujarBloque(bloquesPri[g].col, dist[g], arrGrado, bloquesPri[g].countCol);
        }
      }
    }

    // ==========================================
    // FASE 3.3: Filas VACANTE en hoja BASICA
    // ==========================================
    var vacObj = {};
    if (payload.vacantes && typeof payload.vacantes === 'object') {
      vacObj = payload.vacantes;
    }
    var headers4Vac = hojaBasica.getRange(4, 1, 1, 87).getValues()[0];
    var uFilaVac = hojaBasica.getLastRow();

    if (uFilaVac >= 6) {
      var dVac = hojaBasica.getRange(6, 1, uFilaVac - 5, 2).getValues();
      for (var bv = dVac.length - 1; bv >= 0; bv--) {
        if (String(dVac[bv][1]).trim() === 'VACANTE') {
          hojaBasica.deleteRow(bv + 6);
        }
      }
    }

    function _insertarVacante(nivelDisplay, seccion, cantidad, colDesde, colHasta) {
      if (!cantidad || cantidad <= 0) return;
      var rowV = new Array(87).fill('');
      rowV[1] = 'VACANTE';
      rowV[2] = 'VACANTE - ' + nivelDisplay + ' ' + seccion;
      var esInicial = (nivelDisplay === 'MATERNAL' || nivelDisplay === 'PREESCOLAR');
      var secLabel = esInicial ? ('SECCIÓN ' + seccion) : (nivelDisplay + ' ' + seccion);
      var buscarDesde = (typeof colDesde === 'number') ? (colDesde - 1) : 7;
      var limiteCol   = (typeof colHasta === 'number') ? colHasta : 87;
      for (var c = buscarDesde; c < limiteCol; c++) {
        if (headers4Vac[c] === secLabel) { rowV[c] = cantidad; break; }
      }
      hojaBasica.getRange(hojaBasica.getLastRow() + 1, 1, 1, 87).setValues([rowV]);
    }

    if (vacObj['maternal'] && typeof vacObj['maternal'] === 'object') {
      var letrasMat = Object.keys(vacObj['maternal']).sort();
      letrasMat.forEach(function(letra) {
        _insertarVacante('MATERNAL', letra, parseInt(vacObj['maternal'][letra], 10) || 0, 8, 17);
      });
    }
    if (vacObj['preescolar'] && typeof vacObj['preescolar'] === 'object') {
      var letrasPre = Object.keys(vacObj['preescolar']).sort();
      letrasPre.forEach(function(letra) {
        _insertarVacante('PREESCOLAR', letra, parseInt(vacObj['preescolar'][letra], 10) || 0, 18, 27);
      });
    }
    if (vacObj.primaria && typeof vacObj.primaria === 'object') {
      var ordinalesVac = ['1ER', '2DO', '3ER', '4TO', '5TO', '6TO'];
      // Ordenar por grado (1-6) y luego por sección (A, B, C...) independiente del orden en el JSON
      var clavesPri = Object.keys(vacObj.primaria).filter(function(c) {
        var g = parseInt(c.charAt(0), 10);
        return !isNaN(g) && g >= 1 && g <= 6 && c.length >= 2;
      }).sort(function(a, b) {
        var ga = parseInt(a.charAt(0), 10);
        var gb = parseInt(b.charAt(0), 10);
        if (ga !== gb) return ga - gb;
        return a.substring(1).localeCompare(b.substring(1));
      });
      clavesPri.forEach(function(clave) {
        var val = parseInt(vacObj.primaria[clave], 10) || 0;
        if (val <= 0) return;
        var gradoIdx = parseInt(clave.charAt(0), 10) - 1;
        var letraVac = clave.substring(1);
        _insertarVacante(ordinalesVac[gradoIdx] + ' GRADO', letraVac, val, 28, 87);
      });
    }

    _renumerarYLimpiarBasica(hojaBasica);

    registrarHuellaAuditoria(payload.usuarioRegistrador, "GUARDADO_PLANTEL", payload.usuarioRegistrador, "COMPLETADO");
    return { exito: true };

  } catch (e) {
    return { exito: false, error: e.message };
  }
}

// =============================================================================
// MÓDULO 10: REGISTRO DE PERSONAL (A-AO)
// =============================================================================

/**
 * Limpia filas residuales en la hoja BASICA y renumera secuencialmente la columna A (CAN).
 * @param {GoogleAppsScript.Spreadsheet.Sheet} hojaBasica
 */
function _renumerarYLimpiarBasica(hojaBasica) {
  if (!hojaBasica) return;
  var uF = hojaBasica.getLastRow();
  if (uF < 6) return;
  
  var rango = hojaBasica.getRange(6, 1, uF - 5, 3);
  var valores = rango.getValues();
  var contador = 1;
  var filasParaBorrar = [];
  
  for (var i = 0; i < valores.length; i++) {
    var cedula = String(valores[i][1]).trim();
    var nombre = String(valores[i][2]).trim();
    
    if (cedula === '' && nombre !== '' && nombre.indexOf('VACANTE') === -1) {
      filasParaBorrar.push(i + 6);
    } else if (cedula !== '' && cedula !== 'VACANTE') {
      valores[i][0] = contador++;
    } else {
      valores[i][0] = '';
    }
  }
  
  hojaBasica.getRange(6, 1, uF - 5, 1).setValues(valores.map(function(r) { return [r[0]]; }));
  
  for (var j = filasParaBorrar.length - 1; j >= 0; j--) {
    hojaBasica.deleteRow(filasParaBorrar[j]);
  }
  // Regla de Oro 5: un único flush al concluir todos los borrados evita
  // recálculos intermedios y reduce el riesgo de timeout en hojas grandes.
  if (filasParaBorrar.length > 0) SpreadsheetApp.flush();
}

function guardarRegistroPersonal(payload) {
  try {
    if (!payload || !payload.idHojaPlantel || !payload.cedula) {
      return { exito: false, error: "Faltan datos obligatorios para el registro." };
    }

    var ssDestino = SpreadsheetApp.openById(payload.idHojaPlantel);
    var hojaPersonal = ssDestino.getSheetByName("PERSONAL");

    if (!hojaPersonal) {
      hojaPersonal = ssDestino.insertSheet("PERSONAL");
      var encabezados = [
        "CANTIDAD", "CEDULA", "NACIONALIDAD", "NOMBRE Y APELLIDO", "LUGAR DE NACIMIENTO", "FECHA DE NACIMIENTO", "EDAD", "GENERO", "TELEFONO HABITACION", "TELEFONO CELULAR", "TELEFONO OFICINA", "CORREO ELECTRONICO", "ESTADO CIVIL", "DIRECCION", "NIVEL DE INSTRUCCIÓN", "PROFESIÓN", "ESTADO", "MUNICIPIO", "PARROQUIA", "UBICACIÓN FÍSICA", "CODIGO DEL PLANTEL", "COD. DEPENDENCIA 1", "COD. DEPENDENCIA 2", "COD ESTADISTICO", "DEPENDENCIA", "UBICACIÓN GEOGRAFICA", "NIVEL", "MODALIDAD", "TURNOS DEL PLANTEL", "UBICACION ADMINISTRATIVA", "DEPENDENCIA LABORAL", "TIPO PERSONAL", "SUB CATEGORIA 1 TP", "CARGO", "CODIGO CARGO", "TITULAR / INTERINO / SUPLENTE", "HORAS ACADEMICAS", "HORAS ADMINISTRATIVAS", "FECHA INGRESO MPPE", "AÑOS SERVICIO EN M.P.P.E.", "TURNOS QUE ATIENDE", "ATIENDE MATRICUAL", "NIVEL O MODALIDAD",
        "ESPECIALIDAD QUE IMPARTE EL DOCENTE", "MATERNAL", "PREESCOLAR", "PRIMARIA",
        "PLAN 31059", "PLAN 31060", "PLAN 41048", "PLAN 41049", "PLAN 41052", "PLAN 41056", "PLAN 42000",
        "PLAN 43291", "PLAN 43292", "PLAN 43293", "PLAN 43295", "PLAN 43298", "PLAN 44001", "PLAN 44004",
        "PLAN 45041", "PLAN 45043", "PLAN 45045", "PLAN 45049", "PLAN 46067", "PLAN 46068", "PLAN 46069",
        "PLAN 46070", "PLAN 46071", "PLAN 48069", "PLAN 49000", "PLAN 49001",
        "SITUACIÓN DEL TRABAJADOR", "OBSERVACIÓN", "TALLA DE CAMISA", "TALLA DE PANTALÓN", "TALLA DE ZAPATO",
        "ACTIVIDAD DEPORTIVA", "ACTIVIDAD CULTURAL", "TIPO DE VIVIENDA", "CONDICIÓN DE VIVIENDA", "TIPO DE MATERIAL",
        "TIPO DE ENFERMEDAD", "MEDICAMENTO", "POSEE DISCAPACIDAD", "UBCH", "CIRCUITO COMUNAL", "CENTRO DE VOTACION"
      ];
      // Encabezados en fila 1; datos comienzan en fila 2
      hojaPersonal.getRange(1, 1, 1, encabezados.length).setValues([encabezados]);
      hojaPersonal.getRange(1, 1, 1, encabezados.length).setFontWeight("bold").setBackground("#4f46e5").setFontColor("white");
      hojaPersonal.setFrozenRows(1);
    }

    var edad = _calcularEdadAnios(payload.fechaNacimiento);
    var antiguedad = _calcularEdadAnios(payload.fechaIngreso);

    var dp = payload.datosPlantel || {};
    var dea = "DESCONOCIDO";
    
    var params = obtenerParametrosApp();
    if (params.exito) {
      // Búsqueda simplificada: el microservicio ya validó, esto es solo para el campo REGISTRADO POR
      dea = payload.usuarioRegistrador || "DESCONOCIDO";
    }

    // Comprobar si es Edición
    var filaExistente = -1;
    var cantidadFila = -1;
    var ultimaFila = hojaPersonal.getLastRow();
    
    if (ultimaFila >= 2) {
      var cedulas = hojaPersonal.getRange(2, 2, ultimaFila - 1, 1).getValues(); // Columna B (Cedula) a partir de fila 2
      var nuevaCedula = String(payload.cedula).trim();
      var esEdicion = payload.idEdicion ? true : false;
      var idEdicion = esEdicion ? String(payload.idEdicion).trim() : "";
      
      for (var i = 0; i < cedulas.length; i++) {
        var cedFila = String(cedulas[i][0]).trim();
        
        // Si estamos registrando o cambiando a una cédula que ya existe en otra fila
        if (cedFila === nuevaCedula) {
          if (!esEdicion || (esEdicion && idEdicion !== nuevaCedula)) {
            return { exito: false, error: "La cédula " + nuevaCedula + " ya se encuentra registrada en el sistema." };
          }
        }
        
        // Buscar la fila a editar
        if (esEdicion && cedFila === idEdicion) {
          filaExistente = i + 2;
          cantidadFila = hojaPersonal.getRange(filaExistente, 1).getValue();
        }
      }
    }

    if (filaExistente === -1) {
      var numFilasData = 0;
      if (ultimaFila >= 2) {
        var valoresCedula = hojaPersonal.getRange(2, 2, ultimaFila - 1, 1).getValues();
        for (var k = 0; k < valoresCedula.length; k++) {
          if (String(valoresCedula[k][0]).trim() !== "") numFilasData++;
        }
      }
      cantidadFila = numFilasData + 1;
      if (ultimaFila < 1) ultimaFila = 1; // Forzar a insertar en fila 2
    }

    var cuad = (typeof payload.cuadratura === 'object' && payload.cuadratura !== null) ? payload.cuadratura : {};
    function _U(val) { return val ? String(val).toUpperCase() : ''; }
    function _c(key) { return cuad[key] !== undefined ? String(cuad[key]) : ''; }

    var filaData = [
      cantidadFila,                                   // A:  CANTIDAD (autonumérico)
      _U(payload.cedula),                             // B:  CEDULA
      _U(payload.nacionalidad),                       // C:  NACIONALIDAD
      _U(payload.nombreApellido),                     // D:  NOMBRE Y APELLIDO
      _U(payload.lugarNacimiento),                    // E:  LUGAR DE NACIMIENTO
      _U(payload.fechaNacimiento),                    // F:  FECHA DE NACIMIENTO
      edad,                                           // G:  EDAD (calculado)
      _U(payload.genero),                             // H:  GENERO
      _U(payload.telHabitacion),                      // I:  TELEFONO HABITACION
      _U(payload.telCelular),                         // J:  TELEFONO CELULAR
      _U(payload.telOficina),                         // K:  TELEFONO OFICINA
      payload.correo || "",                           // L:  CORREO ELECTRONICO (no mayúsculas)
      _U(payload.estadoCivil),                        // M:  ESTADO CIVIL
      _U(payload.direccion),                          // N:  DIRECCION
      _U(payload.instruccion),                        // O:  NIVEL DE INSTRUCCIÓN
      _U(payload.profesion),                          // P:  PROFESIÓN
      _U(payload.estado),                             // Q:  ESTADO
      _U(payload.municipio),                          // R:  MUNICIPIO
      _U(payload.parroquia),                          // S:  PARROQUIA
      _U(dp.nombre_plantel),                          // T:  UBICACIÓN FÍSICA (nombre del plantel)
      _U(payload.codigoPlantel),                      // U:  CODIGO DEL PLANTEL (código DEA)
      _U(dp.codigo_dependencia),                      // V:  COD. DEPENDENCIA 1
      _U(dp.codigo_dependencia_2),                    // W:  COD. DEPENDENCIA 2
      _U(dp.codigo_estadistico),                      // X:  COD ESTADISTICO
      _U(dp.dependencia),                             // Y:  DEPENDENCIA
      _U(dp.ubicacion),                               // Z:  UBICACIÓN GEOGRÁFICA
      _U(dp.nivel),                                   // AA: NIVEL
      _U(dp.modalidad),                               // AB: MODALIDAD
      _U(dp.turno),                                   // AC: TURNOS DEL PLANTEL
      _U(payload.ubicacionAdministrativa),            // AD: UBICACIÓN ADMINISTRATIVA
      _U(payload.dependenciaLaboral),                 // AE: DEPENDENCIA LABORAL
      _U(payload.tipoPersonal),                       // AF: TIPO PERSONAL
      _U(payload.subCategoria),                       // AG: SUB CATEGORIA 1 TP (rango obrero)
      _U(payload.cargo),                              // AH: CARGO
      _U(payload.codigoRac),                          // AI: CODIGO CARGO (RAC)
      _U(payload.titular),                            // AJ: TITULAR / INTERINO / SUPLENTE
      payload.horasAcademicas || 0,                   // AK: HORAS ACADEMICAS
      payload.horasAdministrativas || 0,              // AL: HORAS ADMINISTRATIVAS
      _U(payload.fechaIngreso),                       // AM: FECHA INGRESO MPPE
      antiguedad,                                     // AN: AÑOS SERVICIO EN M.P.P.E.
      _U(payload.turnosAtiende),                      // AO: TURNOS QUE ATIENDE
      _U(payload.atiendeMatricula),                   // AP: ATIENDE MATRICUAL
      _U(payload.nivelModalidad),                     // AQ: NIVEL O MODALIDAD
      _U(payload.especialidadImparte),                // AR: ESPECIALIDAD QUE IMPARTE
      _c('maternal'),                                 // AS: MATERNAL
      _c('preescolar'),                               // AT: PREESCOLAR
      _c('primaria'),                                 // AU: PRIMARIA
      _c('p31059'),                                   // AV: PLAN 31059
      _c('p31060'),                                   // AW: PLAN 31060
      _c('p41048'),                                   // AX: PLAN 41048
      _c('p41049'),                                   // AY: PLAN 41049
      _c('p41052'),                                   // AZ: PLAN 41052
      _c('p41056'),                                   // BA: PLAN 41056
      _c('p42000'),                                   // BB: PLAN 42000
      _c('p43291'),                                   // BC: PLAN 43291
      _c('p43292'),                                   // BD: PLAN 43292
      _c('p43293'),                                   // BE: PLAN 43293
      _c('p43295'),                                   // BF: PLAN 43295
      _c('p43298'),                                   // BG: PLAN 43298
      _c('p44001'),                                   // BH: PLAN 44001
      _c('p44004'),                                   // BI: PLAN 44004
      _c('p45041'),                                   // BJ: PLAN 45041
      _c('p45043'),                                   // BK: PLAN 45043
      _c('p45045'),                                   // BL: PLAN 45045
      _c('p45049'),                                   // BM: PLAN 45049
      _c('p46067'),                                   // BN: PLAN 46067
      _c('p46068'),                                   // BO: PLAN 46068
      _c('p46069'),                                   // BP: PLAN 46069
      _c('p46070'),                                   // BQ: PLAN 46070
      _c('p46071'),                                   // BR: PLAN 46071
      _c('p48069'),                                   // BS: PLAN 48069
      _c('p49000'),                                   // BT: PLAN 49000
      _c('p49001'),                                   // BU: PLAN 49001
      _U(payload.situacionLaboral),                   // BV: SITUACIÓN DEL TRABAJADOR
      _U(payload.observacionEstatus),                 // BW: OBSERVACIÓN
      _U(payload.tallaCamisa),                        // BX: TALLA DE CAMISA
      _U(payload.tallaPantalon),                      // BY: TALLA DE PANTALÓN
      _U(payload.tallaZapato),                        // BZ: TALLA DE ZAPATO
      _U(payload.actividadDeportiva),                 // CA: ACTIVIDAD DEPORTIVA
      _U(payload.actividadCultural),                  // CB: ACTIVIDAD CULTURAL
      _U(payload.tipoVivienda),                       // CC: TIPO DE VIVIENDA
      _U(payload.condicionVivienda),                  // CD: CONDICIÓN DE VIVIENDA
      _U(payload.tipoMaterial),                       // CE: TIPO DE MATERIAL
      _U(payload.tipoEnfermedad),                     // CF: TIPO DE ENFERMEDAD
      _U(payload.medicamento),                        // CG: MEDICAMENTO
      _U(payload.discapacidad),                       // CH: POSEE DISCAPACIDAD
      _U(payload.ubch),                               // CI: UBCH
      _U(payload.circuitoComunal),                    // CJ: CIRCUITO COMUNAL
      _U(payload.centroVotacion)                      // CK: CENTRO DE VOTACION
    ];

    if (filaExistente > -1) {
      hojaPersonal.getRange(filaExistente, 1, 1, filaData.length).setValues([filaData]);
      registrarHuellaAuditoria(payload.usuarioRegistrador, "EDICION_PERSONAL", payload.cedula, "COMPLETADO");
    } else {
      var newFila = ultimaFila + 1;
      hojaPersonal.getRange(newFila, 1, 1, filaData.length).setValues([filaData]);
      if (newFila > 6) {
        hojaPersonal.getRange(newFila - 1, 1, 1, filaData.length).copyTo(hojaPersonal.getRange(newFila, 1, 1, filaData.length), SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
      }
      registrarHuellaAuditoria(payload.usuarioRegistrador, "REGISTRO_PERSONAL", payload.cedula, "COMPLETADO");
    }

    // ==========================================
    // FASE 3.2: Registro en hoja BASICA
    // ==========================================
    var hojaBasica = ssDestino.getSheetByName("BASICA");
    if (hojaBasica) {
      if (payload.atiendeMatricula === "SI" && (payload.nivelModalidad === "INICIAL" || payload.nivelModalidad === "PRIMARIA")) {
        var uFilaBasica = hojaBasica.getLastRow();
        var filaBasicaIdx = -1;
        var maxFila = Math.max(uFilaBasica, 5); // Datos empiezan en 6
        
        var dBasica = maxFila >= 6 ? hojaBasica.getRange(6, 1, maxFila - 5, 88).getValues() : [];
        for (var b = 0; b < dBasica.length; b++) {
          if (String(dBasica[b][1]).trim() === payload.cedula) {
            filaBasicaIdx = b + 6;
            break;
          }
        }
        
        var rowB = new Array(88);
        for(var i=0; i<88; i++) rowB[i] = "";
        
        rowB[0] = ""; // Se asignará dinámicamente con _renumerarYLimpiarBasica
        rowB[1] = payload.cedula;
        rowB[2] = payload.nombreApellido;
        rowB[3] = payload.horasAcademicas || 0;
        rowB[4] = (payload.titular === "TITULAR") ? "T" : "I";
        
        var trn = (payload.turnosAtiende || "").toUpperCase();
        if (trn.indexOf("DOBLE") > -1) rowB[5] = "A";
        else if (trn.indexOf("MAÑANA") > -1 || trn.indexOf("MANANA") > -1) rowB[5] = "M";
        else if (trn.indexOf("TARDE") > -1) rowB[5] = "T";
        else rowB[5] = trn.charAt(0);
        
        var tp = (payload.tipoPersonal || "").toUpperCase();
        rowB[6] = tp.indexOf("DOCENTE") > -1 ? "D" : (tp.indexOf("ADMINISTRATIVO") > -1 ? "A" : (tp.indexOf("OBRERO") > -1 ? "O" : tp.charAt(0)));
        
        var headers4 = hojaBasica.getRange(4, 1, 1, 88).getValues()[0];
        
        function ubicarMatricula(objStr, offsetCol, prefijo) {
          if (!objStr) return;
          try {
            var parsed = typeof objStr === 'string' ? JSON.parse(objStr) : objStr;
            Object.keys(parsed).forEach(function(k) {
              var val = parseInt(parsed[k], 10) || 0;
              if (val > 0) {
                var searchStr = prefijo + k; // ej: "SECCIÓN A"
                for(var c = offsetCol; c < offsetCol + 10; c++) {
                  if (headers4[c] === searchStr) {
                    rowB[c] = val;
                    break;
                  }
                }
              }
            });
          } catch(e){}
        }

        var cuad = payload.cuadratura || {};
        if (payload.nivelModalidad === "INICIAL") {
          ubicarMatricula(cuad['maternal'], 7, "SECCIÓN ");
          ubicarMatricula(cuad['preescolar'], 17, "SECCIÓN ");
        } else if (payload.nivelModalidad === "PRIMARIA") {
          if (cuad['primaria']) {
            try {
              var pObj = typeof cuad['primaria'] === 'string' ? JSON.parse(cuad['primaria']) : cuad['primaria'];
              var ordinales = ["1ER", "2DO", "3ER", "4TO", "5TO", "6TO"];
              var offsets = [27, 37, 47, 57, 67, 77];
              Object.keys(pObj).forEach(function(k) {
                 var val = parseInt(pObj[k], 10) || 0;
                 if (val > 0) {
                   var gradoIdx = parseInt(k.charAt(0), 10) - 1; // "1" -> 0
                   var letra = k.substring(1);
                   if (gradoIdx >= 0 && gradoIdx <= 5) {
                     var searchStr = ordinales[gradoIdx] + " GRADO " + letra;
                     var off = offsets[gradoIdx];
                     for (var c = off; c < off + 10; c++) {
                       if (headers4[c] === searchStr) {
                         rowB[c] = val;
                         break;
                       }
                     }
                   }
                 }
              });
            } catch(e){}
          }
        }
        
        rowB[87] = (cuad['observacion'] || "").toUpperCase(); // Columna CJ (índice 87)

        if (filaBasicaIdx > -1) {
          hojaBasica.getRange(filaBasicaIdx, 1, 1, 88).setValues([rowB]);
        } else {
          var newFilaB = maxFila + 1;
          hojaBasica.getRange(newFilaB, 1, 1, 88).setValues([rowB]);
          if (newFilaB > 6) {
            hojaBasica.getRange(newFilaB - 1, 1, 1, 88).copyTo(hojaBasica.getRange(newFilaB, 1, 1, 88), SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
          }
        }
      } else {
        var uFilaBasica = hojaBasica.getLastRow();
        if (uFilaBasica >= 6) {
          var dBasica = hojaBasica.getRange(6, 1, uFilaBasica - 5, 2).getValues();
          for (var b = 0; b < dBasica.length; b++) {
            if (String(dBasica[b][1]).trim() === payload.cedula) {
              hojaBasica.deleteRow(b + 6);
              break;
            }
          }
        }
      }
      _renumerarYLimpiarBasica(hojaBasica);
    }

    // ==========================================
    // FASE 3.4: Registro en hojas de Media (Planes de estudio)
    // ==========================================
    var cuadMedia = payload.cuadratura || {};
    var esMediaAtiende = (payload.atiendeMatricula === "SI" && (
      payload.nivelModalidad === "MEDIA GENERAL" ||
      payload.nivelModalidad === "MEDIA TECNICA" ||
      payload.nivelModalidad === "MEDIA GENERAL - TECNICA" ||
      (payload.nivelModalidad || "").toUpperCase().indexOf("MEDIA") > -1
    ));
    var planesActivos = [];
    if (esMediaAtiende) {
      planesActivos = Object.keys(cuadMedia)
        .filter(function(k) { return k.startsWith('p') && k !== 'primaria' && k !== 'preescolar' && k !== 'maternal'; })
        .map(function(k) { return k.substring(1); });
    }

    var allSheets = ssDestino.getSheets();
    allSheets.forEach(function(sh) {
      var name = sh.getName();
      // Validar si el nombre es un código numérico de 5 dígitos (plan de estudio)
      if (name.length === 5 && (name.startsWith('3') || name.startsWith('4')) && !isNaN(name)) {
        var uF = sh.getLastRow();
        var maxColP = Math.max(sh.getLastColumn(), 7);
        var maxFilaP = Math.max(uF, 5);
        
        // Buscar la fila de "TOTAL REAL" en las columnas F o G
        var dTodo = sh.getRange(1, 1, maxFilaP, 7).getValues();
        var idxTotal = -1;
        for (var r = 5; r < maxFilaP; r++) {
          if (String(dTodo[r][6]).trim().toUpperCase() === "TOTAL REAL" || String(dTodo[r][5]).trim().toUpperCase() === "TOTAL REAL") {
            idxTotal = r + 1;
            break;
          }
        }
        
        var fIdx = -1;
        var endSearchRow = (idxTotal > -1) ? (idxTotal - 1) : uF;
        if (endSearchRow >= 6) {
          var dPlan = sh.getRange(6, 2, endSearchRow - 5, 1).getValues();
          for (var b = 0; b < dPlan.length; b++) {
            if (String(dPlan[b][0]).trim() === payload.cedula) {
              fIdx = b + 6;
              break;
            }
          }
        }

        var isActivo = planesActivos.indexOf(name) > -1;

        if (isActivo) {
          try {
            var parsedStr = cuadMedia['p' + name];
            var parsed = typeof parsedStr === 'string' ? JSON.parse(parsedStr) : parsedStr;
            var horasAsignadas = 0;
            var horasPlanificacion = parseInt(parsed['0_PLANIFICACION'], 10) || 0;
            Object.keys(parsed).forEach(function(k) { 
              if (k !== '0_PLANIFICACION') {
                horasAsignadas += parseInt(parsed[k], 10) || 0; 
              }
            });
            
            var colPlan = 0, colCert = 0, colRepro = 0, colObs = 0;
            if (name === '31059') {
              colPlan = 59; colCert = 60; colRepro = 61; colObs = 62;
            } else if (name === '31060') {
              colPlan = 58; colCert = 59; colRepro = 60; colObs = 61;
            } else if (name.startsWith('4')) {
              colPlan = 80; colCert = 81; colRepro = 82; colObs = 83;
            }
            
            var maxColP = Math.max(sh.getLastColumn(), colObs > 0 ? colObs : 7);
            var maxFilaP = Math.max(uF, 5);
            
            // Si la hoja tiene menos columnas creadas que maxColP, getRange fallará
            if (sh.getMaxColumns() < maxColP) {
              sh.insertColumnsAfter(sh.getMaxColumns(), maxColP - sh.getMaxColumns());
            }
            
            var hData = sh.getRange(3, 1, 2, maxColP).getValues();
            var r3 = hData[0];
            var r4 = hData[1];
            
            var blockSizes = [];
            if (name.startsWith('4')) {
              blockSizes = [12, 12, 12, 12, 12, 12]; // Media Técnica: 12 columnas por año
            } else if (name === '31059') {
              blockSizes = [9, 9, 10, 11, 12];       // Media General 31059
            } else if (name === '31060') {
              blockSizes = [10, 10, 10, 10, 10];     // Media General 31060
            } else {
              blockSizes = [10, 10, 10, 10, 10];     // Fallback por defecto
            }
            
            var colMap = {};
            for (var c = 7; c < maxColP; c++) {
              var offset = c - 7;
              var currentAnio = 1;
              var sum = 0;
              for (var i = 0; i < blockSizes.length; i++) {
                sum += blockSizes[i];
                if (offset < sum) {
                  currentAnio = i + 1;
                  break;
                }
              }
              // Si la columna excede los bloques definidos, se ignora
              if (offset >= sum) continue;
              
              var mat = String(r4[c]).trim().toUpperCase();
              if (mat !== "" && mat !== "SECCIONES") {
                colMap[currentAnio + "_" + mat] = c;
              }
            }
            
            var rowV;
            var isNew = false;
            if (fIdx > -1) {
              rowV = sh.getRange(fIdx, 1, 1, maxColP).getValues()[0];
              Object.keys(colMap).forEach(function(k) { rowV[colMap[k]] = ""; }); 
            } else {
              isNew = true;
              rowV = new Array(maxColP);
              for(var i=0; i<maxColP; i++) rowV[i] = "";
              
              var firstEmptyRow = -1;
              if (idxTotal > 6) {
                for (var r = 5; r < idxTotal - 2; r++) {
                  if (String(dTodo[r][1]).trim() === "") {
                    firstEmptyRow = r + 1;
                    break;
                  }
                }
              }
              
              if (idxTotal === -1) {
                fIdx = maxFilaP + 1;
              } else if (idxTotal === 6) {
                sh.insertRowsBefore(6, 2);
                fIdx = 6;
                idxTotal += 2;
              } else if (firstEmptyRow !== -1) {
                fIdx = firstEmptyRow;
              } else {
                sh.insertRowBefore(idxTotal - 1);
                fIdx = idxTotal - 1;
                idxTotal += 1;
              }
              rowV[0] = (fIdx - 5);
            }
            
            rowV[1] = payload.cedula;
            rowV[2] = payload.nombreApellido;
            rowV[3] = payload.horasAcademicas || 0;
            rowV[4] = horasAsignadas;
            rowV[5] = (payload.titular === "TITULAR") ? "T" : "I";
            var tp = (payload.tipoPersonal || "").toUpperCase();
            rowV[6] = tp.indexOf("DOCENTE") > -1 ? "D" : (tp.indexOf("ADMINISTRATIVO") > -1 ? "A" : (tp.indexOf("OBRERO") > -1 ? "O" : tp.charAt(0)));
            
            Object.keys(parsed).forEach(function(k) {
               if (k !== '0_PLANIFICACION') {
                 var val = parseInt(parsed[k], 10) || 0;
                 if (val > 0 && colMap[k] !== undefined) {
                   rowV[colMap[k]] = val;
                 }
               }
            });
            
            // Inyectar Horas Planificación, Certificadas y por Reprogramar
            if (colPlan > 0) {
              function _getColNameLocal(n) {
                var s = "";
                while(n >= 0) {
                  s = String.fromCharCode(n % 26 + 65) + s;
                  n = Math.floor(n / 26) - 1;
                }
                return s;
              }
              var letPlan = _getColNameLocal(colPlan - 1);
              var letCert = _getColNameLocal(colCert - 1);
              
              var ch = payload.horasAcademicas || 0;
              rowV[colPlan - 1] = (ch >= 40 && horasPlanificacion > 0) ? horasPlanificacion : "";
              rowV[colCert - 1] = "=E" + fIdx + "+" + letPlan + fIdx;
              rowV[colRepro - 1] = "=D" + fIdx + "-" + letCert + fIdx;
            }
            
            if (colObs > 0) {
              rowV[colObs - 1] = (cuadMedia['observacion'] || "").toUpperCase();
            }
            
            sh.getRange(fIdx, 1, 1, maxColP).setValues([rowV]);
            if (isNew && fIdx > 6) {
              sh.getRange(fIdx - 1, 1, 1, maxColP).copyTo(sh.getRange(fIdx, 1, 1, maxColP), SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
            }
            
            if (idxTotal > -1) {
              function _getColName(n) {
                var s = "";
                while(n >= 0) {
                  s = String.fromCharCode(n % 26 + 65) + s;
                  n = Math.floor(n / 26) - 1;
                }
                return s;
              }
              
              var cells = _obtenerCeldasSeccionesMedia(name, true);
              
              // Acotar el loop a la última columna de asignaturas reales (BF para 31059, BE para 31060, CA para 4****)
              var totalAsigCols = blockSizes.reduce(function(a, b) { return a + b; }, 0);
              var lastAsigCol = 7 + totalAsigCols; // 1-based: columna de la última asignatura

              var fTR = [], fMT = [], fDF = [], fTA = [];
              for (var c = 8; c <= lastAsigCol; c++) {
                var colIdx = c - 1;
                var colLetter = _getColName(colIdx);
                var endR = Math.max(6, idxTotal - 2);

                var yearIdx = -1;
                var currentSum = 0;
                var startCol = 7;
                for (var i = 0; i < blockSizes.length; i++) {
                   if (colIdx - 7 < currentSum + blockSizes[i]) {
                     yearIdx = i;
                     startCol = 7 + currentSum;
                     break;
                   }
                   currentSum += blockSizes[i];
                }

                var secCell = "M$3";
                if (cells && cells[yearIdx]) {
                  secCell = cells[yearIdx];
                } else if (yearIdx > -1) {
                  var midCol = startCol + Math.floor(blockSizes[yearIdx] / 2);
                  secCell = _getColName(midCol) + "$3";
                }

                fTR.push("=SUM(" + colLetter + "6:" + colLetter + endR + ")");
                fMT.push("=" + colLetter + "$5 * " + secCell);
                fDF.push("=" + colLetter + (idxTotal + 1) + " - " + colLetter + idxTotal);

                if (colIdx === startCol) {
                  var endColIdx = startCol + blockSizes[yearIdx] - 1;
                  fTA.push("=SUM(" + _getColName(startCol) + "$5:" + _getColName(endColIdx) + "$5)");
                } else {
                  fTA.push("");
                }
              }

              sh.getRange(idxTotal,     8, 1, fTR.length).setFormulas([fTR]);
              sh.getRange(idxTotal + 1, 8, 1, fMT.length).setFormulas([fMT]);
              sh.getRange(idxTotal + 2, 8, 1, fDF.length).setFormulas([fDF]);
              sh.getRange(idxTotal + 3, 8, 1, fTA.length).setFormulas([fTA]);

              // Inyectar SUM en fila TOTAL REAL para columnas especiales (Planif / Cert / Reprog)
              if (colPlan > 0) {
                var endR2 = Math.max(6, idxTotal - 2);
                sh.getRange(idxTotal, colPlan,  1, 1).setFormula("=SUM(" + _getColName(colPlan  - 1) + "6:" + _getColName(colPlan  - 1) + endR2 + ")");
                sh.getRange(idxTotal, colCert,  1, 1).setFormula("=SUM(" + _getColName(colCert  - 1) + "6:" + _getColName(colCert  - 1) + endR2 + ")");
                sh.getRange(idxTotal, colRepro, 1, 1).setFormula("=SUM(" + _getColName(colRepro - 1) + "6:" + _getColName(colRepro - 1) + endR2 + ")");
              }
            }
          } catch(e) {
            console.error("Error al procesar el plan " + name, e);
          }
        } else {
          // Si no está activo pero la fila existe, la eliminamos (el empleado dejó de impartir en este plan)
          if (fIdx > -1) {
            sh.deleteRow(fIdx);
          }
        }
      }
    });

    if (filaExistente > -1) {
      return { exito: true, idRegistro: payload.cedula, mensaje: "Registro actualizado en la fila " + filaExistente };
    } else {
      return { exito: true, idRegistro: payload.cedula, mensaje: "Registro guardado en la fila " + (ultimaFila + 1) };
    }

  } catch (e) {
    return { exito: false, error: "Error interno al guardar: " + e.message };
  }
}

function obtenerListadoPersonal(idHojaPlantel) {
  try {
    var ssDestino = SpreadsheetApp.openById(idHojaPlantel);
    var hojaPersonal = ssDestino.getSheetByName("PERSONAL");
    if (!hojaPersonal) return { exito: true, empleados: [] };

    var ultimaFila = hojaPersonal.getLastRow();
    if (ultimaFila < 2) return { exito: true, empleados: [] };

    var data = hojaPersonal.getRange(2, 1, ultimaFila - 1, 89).getDisplayValues();
    var empleados = [];

    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      if (!row[1]) continue; // Sin cédula
      empleados.push({
        cantidad: row[0],
        cedula: row[1],
        nacionalidad: row[2],
        nombreApellido: row[3],
        lugarNacimiento: row[4],
        fechaNacimiento: row[5],
        edad: row[6],
        genero: row[7],
        telHabitacion: row[8],
        telCelular: row[9],
        telOficina: row[10],
        correo: row[11],
        estadoCivil: row[12],
        direccion: row[13],
        instruccion: row[14],
        profesion: row[15],
        estado: row[16],
        municipio: row[17],
        parroquia: row[18],
        ubicacionFisica: row[19],
        codigoPlantel: row[20],
        codDependencia1: row[21],
        codDependencia2: row[22],
        codEstadistico: row[23],
        dependenciaPlantel: row[24],
        ubicacionGeografica: row[25],
        nivel: row[26],
        modalidad: row[27],
        turnosPlantel: row[28],
        ubicacionAdministrativa: row[29],
        dependenciaLaboral: row[30],
        tipoPersonal: row[31],
        subCategoria: row[32],
        cargo: row[33],
        codigoRac: row[34],
        titular: row[35],
        horasAcademicas: row[36],
        horasAdministrativas: row[37],
        fechaIngreso: row[38],
        antiguedad: row[39],
        turnosAtiende: row[40],
        atiendeMatricula: row[41],
        nivelModalidad: row[42],
        especialidadImparte: row[43],
        cuadratura: {
          maternal: row[44],
          preescolar: row[45],
          primaria: row[46],
          p31059: row[47],
          p31060: row[48],
          p41048: row[49],
          p41049: row[50],
          p41052: row[51],
          p41056: row[52],
          p42000: row[53],
          p43291: row[54],
          p43292: row[55],
          p43293: row[56],
          p43295: row[57],
          p43298: row[58],
          p44001: row[59],
          p44004: row[60],
          p45041: row[61],
          p45043: row[62],
          p45045: row[63],
          p45049: row[64],
          p46067: row[65],
          p46068: row[66],
          p46069: row[67],
          p46070: row[68],
          p46071: row[69],
          p48069: row[70],
          p49000: row[71],
          p49001: row[72]
        },
        situacionLaboral: row[73],
        observacionEstatus: row[74],
        tallaCamisa: row[75],
        tallaPantalon: row[76],
        tallaZapato: row[77],
        actividadDeportiva: row[78],
        actividadCultural: row[79],
        tipoVivienda: row[80],
        condicionVivienda: row[81],
        tipoMaterial: row[82],
        tipoEnfermedad: row[83],
        medicamento: row[84],
        discapacidad: row[85],
        ubch: row[86],
        circuitoComunal: row[87],
        centroVotacion: row[88]
      });
    }

    return { exito: true, empleados: empleados };
  } catch (e) {
    return { exito: false, error: e.message };
  }
}

function eliminarRegistroPersonal(payload) {
  try {
    var ssDestino = SpreadsheetApp.openById(payload.idHojaPlantel);
    var hojaPersonal = ssDestino.getSheetByName("PERSONAL");
    if (!hojaPersonal) return { exito: false, error: "La hoja PERSONAL no existe." };

    var ultimaFila = hojaPersonal.getLastRow();
    if (ultimaFila < 2) return { exito: false, error: "No hay registros." };

    var cedulas = hojaPersonal.getRange(2, 2, ultimaFila - 1, 1).getValues();
    var filaAEliminar = -1;
    var targetCedula = String(payload.cedulaEmpleado).trim();

    for (var i = 0; i < cedulas.length; i++) {
      if (String(cedulas[i][0]).trim() === targetCedula) {
        filaAEliminar = i + 2;
        break;
      }
    }

    if (filaAEliminar === -1) {
      return { exito: false, error: "El empleado no fue encontrado." };
    }

    // Leer la data de la fila a eliminar
    var rowData = hojaPersonal.getRange(filaAEliminar, 1, 1, 44).getValues()[0];

    // Mover a PERSONAL-historico
    var hojaHistorico = ssDestino.getSheetByName("PERSONAL-historico");
    if (!hojaHistorico) {
      hojaHistorico = ssDestino.insertSheet("PERSONAL-historico");
      var encabezados = ["CANTIDAD", "CEDULA", "NACIONALIDAD", "NOMBRE Y APELLIDO", "LUGAR DE NACIMIENTO", "FECHA DE NACIMIENTO", "EDAD", "GENERO", "TELEFONO HABITACION", "TELEFONO CELULAR", "TELEFONO OFICINA", "CORREO ELECTRONICO", "ESTADO CIVIL", "DIRECCION", "NIVEL DE INSTRUCCIÓN", "PROFESIÓN", "ESTADO", "MUNICIPIO", "PARROQUIA", "UBICACIÓN FÍSICA", "CODIGO DEL PLANTEL", "COD. DEPENDENCIA 1", "COD. DEPENDENCIA 2", "COD ESTADISTICO", "DEPENDENCIA", "UBICACIÓN GEOGRAFICA", "NIVEL", "MODALIDAD", "TURNOS DEL PLANTEL", "UBICACION ADMINISTRATIVA", "DEPENDENCIA LABORAL", "TIPO PERSONAL", "SUB CATEGORIA 1 TP", "CARGO", "CODIGO CARGO", "TITULAR / INTERINO / SUPLENTE", "HORAS ACADEMICAS", "HORAS ADMINISTRATIVAS", "FECHA INGRESO MPPE", "AÑOS SERVICIO EN M.P.P.E.", "TURNOS QUE ATIENDE", "ATIENDE MATRICUAL", "NIVEL O MODALIDAD", "ESPECIALIDAD QUE IMPARTE EL DOCENTE"];
      var rngEncabezados = hojaHistorico.getRange(1, 1, 1, encabezados.length);
      rngEncabezados.setValues([encabezados]);
      rngEncabezados.setFontWeight("bold")
                    .setBackground("#bdbdbd")
                    .setFontColor("black")
                    .setVerticalAlignment("middle")
                    .setHorizontalAlignment("center");
      hojaHistorico.setFrozenRows(1);
    }

    // Regla de Oro 5: setValues() con posición exacta en lugar de appendRow().
    // Más rápido y predecible: le indica al sistema exactamente en qué fila escribir.
    var filaHistorico = hojaHistorico.getLastRow() + 1;
    hojaHistorico.getRange(filaHistorico, 1, 1, rowData.length).setValues([rowData]);
    
    // Asegurar que la hoja PERSONAL no se quede sin filas no inmovilizadas al eliminar
    // (Google Sheets requiere al menos 1 fila no inmovilizada)
    if (hojaPersonal.getMaxRows() <= hojaPersonal.getFrozenRows() + 1) {
      hojaPersonal.insertRowAfter(hojaPersonal.getMaxRows());
    }
    
    // Eliminar la fila de PERSONAL
    hojaPersonal.deleteRow(filaAEliminar);
    
    // Eliminar de BASICA y hojas de Media (Cuadratura)
    var todasLasHojas = ssDestino.getSheets();
    for (var s = 0; s < todasLasHojas.length; s++) {
      var sh = todasLasHojas[s];
      var name = sh.getName();
      if (name === "PERSONAL" || name === "PERSONAL-historico" || name === "PLANTEL") continue;
      
      var uF = sh.getLastRow();
      if (uF >= 6) {
        var rangeVals = sh.getRange(6, 2, uF - 5, 1).getValues();
        
        // Contar cuántos empleados reales hay (cédulas no vacías)
        var numEmpleados = 0;
        for (var i = 0; i < rangeVals.length; i++) {
          if (String(rangeVals[i][0]).trim() !== "") {
            numEmpleados++;
          }
        }
        
        // Recorrer de abajo hacia arriba para evitar desfasajes al eliminar filas
        for (var r = rangeVals.length - 1; r >= 0; r--) {
          if (String(rangeVals[r][0]).trim() === targetCedula) {
            if (numEmpleados === 1) {
              // Si es el único empleado en la hoja, vaciamos la fila en lugar de eliminarla.
              // Esto preserva las fórmulas (como TOTAL REAL) evitando el error #REF!
              sh.getRange(r + 6, 1, 1, sh.getLastColumn()).clearContent();
            } else {
              sh.deleteRow(r + 6);
            }
          }
        }
      }
    }
    
    registrarHuellaAuditoria(payload.usuarioRegistrador, "ELIMINAR_PERSONAL", payload.cedulaEmpleado, "COMPLETADO");

    return { exito: true, mensaje: "Empleado eliminado y respaldado en todas las hojas." };
  } catch (e) {
    return { exito: false, error: e.message };
  }
}

/**
 * Permite a un usuario cambiar su clave de acceso escribiendo directamente
 * en la hoja 'PLANTELES' del documento de origen.
 * @param {string} idHojaPlantel ID del documento (municipio) del usuario.
 * @param {string} usuario Código del plantel o cédula (Columna A).
 * @param {string} claveActual Clave actual ingresada por el usuario.
 * @param {string} nuevaClave Nueva clave a registrar.
 * @return {object} {exito: boolean, mensaje?: string, error?: string}
 */
function cambiarClaveUsuario(idHojaPlantel, usuario, claveActual, nuevaClave) {
  console.log("[SGH-TRACE] Iniciando cambiarClaveUsuario vía Microservicio...");
  try {
    var params = obtenerParametrosApp();
    if (!params.exito || !params.adminUrl) {
      return { exito: false, error: "Servidor central (adminUrl) no configurado." };
    }

    var payloadCambio = {
      tipoPeticion: "CAMBIAR_CLAVE",
      datos: {
        usuario: usuario,
        claveActual: claveActual,
        nuevaClave: nuevaClave,
        maestroId: params.directorioMaestroId
      }
    };

    var respuesta = UrlFetchApp.fetch(params.adminUrl, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payloadCambio),
      muteHttpExceptions: true
    });

    var rawText = respuesta.getContentText();
    console.log("[SGH-TRACE] Respuesta raw cambiarClave: " + rawText.substring(0, 200));

    if (rawText.trim().charAt(0) !== "{" && rawText.trim().charAt(0) !== "[") {
      return { exito: false, error: "El servidor devolvió una respuesta inesperada (posible error de permisos). Revise la implementación de sgh_db_gas." };
    }

    var resCambio = JSON.parse(rawText);

    if (resCambio.exito) {
      return { exito: true, mensaje: "Clave cambiada exitosamente de forma segura." };
    } else {
      return { exito: false, error: resCambio.error || "Error desconocido en servidor remoto." };
    }

  } catch (e) {
    return { exito: false, error: "Error de conexión con el servidor: " + e.message };
  }
}


// =============================================================================
// MÓDULO DE DIAGNÓSTICO — TEMPORAL (eliminar tras resolver el problema)
// Ejecutar esta función DIRECTAMENTE desde el editor de Apps Script
// para identificar qué recurso específico está fallando por permisos.
// =============================================================================

/**
 * Diagnóstico de permisos de acceso a los recursos de Drive/Sheets.
 * EJECUTAR DESDE EL EDITOR: Selecciona esta función en el menú y presiona ▶ Ejecutar.
 * Los resultados aparecen en el Logger (Ver → Registros).
 */
function diagnosticarPermisos() {
  var resultados = [];

  var DIR_ID = CONFIG_GLOBAL.hojas_calculo.directorio_maestro_id;
  var BD_ID  = CONFIG_GLOBAL.bases_datos_locales.bd_sgh_id;

  // --- Test 1: Acceso al Directorio Maestro (Spreadsheet) ---
  try {
    var ss = SpreadsheetApp.openById(DIR_ID);
    var hojas = ss.getSheets().map(function(h) { return h.getName(); });
    resultados.push("✅ Directorio Maestro OK. Hojas: " + hojas.join(", "));
  } catch (e) {
    resultados.push("❌ Directorio Maestro FALLO [" + DIR_ID + "]: " + e.message);
  }

  // --- Test 2: Acceso al archivo BD (Drive) ---
  try {
    var archivo = DriveApp.getFileById(BD_ID);
    resultados.push("✅ bd_sgh (Drive) OK. Nombre: " + archivo.getName());
  } catch (e) {
    resultados.push("❌ bd_sgh (Drive) FALLO [" + BD_ID + "]: " + e.message);
  }

  // --- Test 3: Lectura de la hoja DIRECTORIO ---
  try {
    var ss2 = SpreadsheetApp.openById(DIR_ID);
    var hDir = ss2.getSheetByName("DIRECTORIO");
    if (!hDir) {
      resultados.push("⚠️  Hoja 'DIRECTORIO' no encontrada dentro del Directorio Maestro.");
    } else {
      var nFilas = hDir.getLastRow();
      resultados.push("✅ Hoja DIRECTORIO OK. Filas: " + nFilas);

      // Mostrar encabezados de las primeras 6 columnas para verificar el esquema
      if (nFilas >= 1) {
        var encabezados = hDir.getRange(1, 1, 1, 6).getValues()[0];
        resultados.push("   Columnas (A-F): " + encabezados.join(" | "));
      }
    }
  } catch (e) {
    resultados.push("❌ Lectura DIRECTORIO FALLO: " + e.message);
  }

  // --- Test 4: Intentar abrir idHojaPlantel del primer usuario ---
  try {
    var ss3 = SpreadsheetApp.openById(DIR_ID);
    var hDir3 = ss3.getSheetByName("DIRECTORIO");
    if (hDir3 && hDir3.getLastRow() >= 2) {
      var primeraFila = hDir3.getRange(2, 1, 1, 6).getValues()[0];
      var codigoPlantel = primeraFila[0];
      var idHoja        = primeraFila[2]; // Columna C
      resultados.push("   Primer registro — Código: " + codigoPlantel + " | ID Hoja: " + idHoja);

      if (idHoja && String(idHoja).trim() !== "") {
        try {
          DriveApp.getFileById(String(idHoja).trim());
          var ssHoja = SpreadsheetApp.openById(String(idHoja).trim());
          resultados.push("✅ Hoja de plantel '" + codigoPlantel + "' accesible. Nombre SS: " + ssHoja.getName());
        } catch (e2) {
          resultados.push("❌ Hoja de plantel FALLO [" + idHoja + "]: " + e2.message);
        }
      } else {
        resultados.push("⚠️  ID de hoja de plantel vacío en la primera fila del DIRECTORIO.");
      }
    }
  } catch (e) {
    resultados.push("❌ Test hoja plantel FALLO: " + e.message);
  }

  // --- Test 5: Intentar abrir idHojaPlantel del usuario de prueba (T0715D1406) ---
  try {
    var idHojaPrueba = "16CqKF3ov9oPO6uCYYkoIKpki_PDggt9DENocT1MHH04";
    try {
      DriveApp.getFileById(idHojaPrueba);
      var ssPrueba = SpreadsheetApp.openById(idHojaPrueba);
      resultados.push("✅ Hoja del usuario T0715D1406 accesible. Nombre: " + ssPrueba.getName());
    } catch(e3) {
      resultados.push("❌ Hoja del usuario T0715D1406 FALLO [" + idHojaPrueba + "]: " + e3.message);
    }
  } catch (e) {}

  // Imprimir resultados en el Logger
  Logger.log("=== DIAGNÓSTICO DE PERMISOS SGH ===");
  resultados.forEach(function(r) { Logger.log(r); });
  Logger.log("===================================");

  // También retornar como string por si se llama desde google.script.run
  return resultados.join("\n");
}


/**
 * PRUEBA DIRECTA DE LOGIN — Ejecutar desde el editor de Apps Script.
 * Cambia USUARIO_PRUEBA y CLAVE_PRUEBA por credenciales reales.
 * Resultado en Ver → Registros o en la consola de ejecución.
 */
function testLogin() {
  // ⚠ CAMBIA ESTOS VALORES por un usuario y clave reales del DIRECTORIO
  var USUARIO_PRUEBA = "T0715D1406";  // <-- código de plantel real
  var CLAVE_PRUEBA   = "CLAVE_REAL"; // <-- clave real

  Logger.log("=== TEST LOGIN ===");
  Logger.log("Usuario: " + USUARIO_PRUEBA);

  try {
    var resultado = validarAccesoUsuario({
      usuario: USUARIO_PRUEBA,
      clave:   CLAVE_PRUEBA
    });
    Logger.log("Resultado: " + JSON.stringify(resultado));
  } catch(e) {
    Logger.log("EXCEPCIÓN NO CAPTURADA: " + e.name + " | " + e.message);
    Logger.log("Stack: " + e.stack);
  }

  Logger.log("=== FIN TEST ===");
}

// =============================================================================
// MÓDULO 10: EXPORTACIÓN DE HOJAS
// =============================================================================

/**
 * Prepara un archivo Excel temporal con las hojas solicitadas.
 * @param {string} idHojaPlantel - ID de la hoja del plantel.
 * @param {string} tipoDescarga - 'PERSONAL' o 'CUADRATURA'
 * @param {Object} datosPlantel - Datos del plantel desde el cliente (para saber qué hojas extraer).
 * @returns {{exito: boolean, tempId?: string, error?: string, nombreArchivo?: string}}
 */
function prepararExcelDescarga(idHojaPlantel, tipoDescarga, datosPlantel) {
  try {
    var ssOriginal = SpreadsheetApp.openById(idHojaPlantel);
    var hojasOriginales = ssOriginal.getSheets();
    
    // Crear spreadsheet temporal
    var ssTemp = SpreadsheetApp.create("Descarga_" + tipoDescarga + "_" + new Date().getTime());
    var tempId = ssTemp.getId();
    
    var hojasACopiar = [];
    if (tipoDescarga === 'PERSONAL') {
      var hPersonal = ssOriginal.getSheetByName('PERSONAL');
      if (hPersonal) hojasACopiar.push(hPersonal);
    } else if (tipoDescarga === 'CUADRATURA') {
      var nivel = (datosPlantel && datosPlantel.nivel_modalidad) ? datosPlantel.nivel_modalidad.toUpperCase() : "";
      var planes = (datosPlantel && datosPlantel.planes_estudio) ? Object.keys(datosPlantel.planes_estudio) : [];
      
      var hojasBuscadas = [];
      var tieneBasica = false;
      var planesMedia = [];
      
      // 1. Chequeo por string explícito de nivel
      if (nivel.indexOf('INICIAL') !== -1 || nivel.indexOf('PRIMARIA') !== -1 || nivel.indexOf('BASICA') !== -1 || nivel.indexOf('BÁSICA') !== -1) {
        tieneBasica = true;
      }
      
      // 2. Chequeo por códigos de planes de estudio (20000 = Inicial, 21000 = Primaria)
      planes.forEach(function(p) {
        if (p === '20000' || p === '21000') {
          tieneBasica = true;
        } else if (p.charAt(0) === '3' || p.charAt(0) === '4') {
          planesMedia.push(p);
        }
      });
      
      // Agregar BASICA si corresponde
      if (tieneBasica) {
        hojasBuscadas.push('BASICA');
      }
      
      // Agregar las hojas de los planes de Media
      if (planesMedia.length > 0) {
        hojasBuscadas = hojasBuscadas.concat(planesMedia);
      }
      
      // Si sigue sin detectar nada, tratar de inferir de las hojas existentes basándose en heurísticas muy obvias
      if (hojasBuscadas.length === 0) {
        hojasOriginales.forEach(function(h) {
          var nombre = h.getName();
          if (nombre === 'BASICA' || (nombre.length === 5 && !isNaN(nombre))) {
            hojasACopiar.push(h);
          }
        });
      } else {
        // Copiar estrictamente solo las hojas determinadas por el nivel/modalidad
        hojasBuscadas.forEach(function(nombreHoja) {
          var h = ssOriginal.getSheetByName(nombreHoja);
          if (h) {
            hojasACopiar.push(h);
          }
        });
      }
    }
    
    if (hojasACopiar.length === 0) {
      DriveApp.getFileById(tempId).setTrashed(true);
      return { exito: false, error: "No se encontraron las hojas solicitadas para " + tipoDescarga };
    }
    
    // Copiar hojas al temp
    hojasACopiar.forEach(function(h) {
      h.copyTo(ssTemp).setName(h.getName());
    });
    
    // Eliminar hoja1 por defecto
    var hoja1 = ssTemp.getSheets()[0];
    ssTemp.deleteSheet(hoja1);
    
    // Forzar guardado
    SpreadsheetApp.flush();
    
    var prefijo = tipoDescarga === 'PERSONAL' ? 'Personal' : 'Cuadratura';
    var nombreArchivo = prefijo + "_" + ssOriginal.getName() + ".xlsx";

    // Regla de Oro 4: Toda exportación de datos personales deja huella de
    // auditoría para garantizar trazabilidad y cumplimiento de privacidad.
    registrarHuellaAuditoria(
      "SISTEMA",
      "EXPORTAR_" + tipoDescarga,
      idHojaPlantel + " | " + nombreArchivo,
      "COMPLETADO"
    );

    return { exito: true, tempId: tempId, nombreArchivo: nombreArchivo };
  } catch(e) {
    return { exito: false, error: "Error al preparar Excel: " + e.message };
  }
}

/**
 * Elimina un archivo temporal de Drive.
 * @param {string} tempId - ID del archivo a eliminar.
 */
function eliminarExcelDescarga(tempId) {
  try {
    if (tempId) {
      DriveApp.getFileById(tempId).setTrashed(true);
    }
  } catch(e) {
    console.warn("No se pudo eliminar el archivo temporal: " + tempId);
  }
}

// =============================================================================
// MÓDULO 8: ADMINISTRACIÓN Y SEGURIDAD AVANZADA
// =============================================================================

// Función eliminada: ADMIN_sincronizarBoveda
