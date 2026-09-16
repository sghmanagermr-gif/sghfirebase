---
name: webapp-expert
description: Especialista de amplio espectro en la arquitectura, auditoría y optimización de Aplicaciones Web sobre Google Apps Script y Firebase. Incluye reglas de Zero-Cost y Bitácora estricta.
---
# Skill1: Google Apps Script Web App Architect (Enterprise Edition)

## Descripción

Especialista de amplio espectro en la arquitectura, auditoría y optimización de Aplicaciones Web complejas sobre Google Apps Script. Experto en el análisis de sistemas modulares con modelo híbrido de datos (Sheets/JSON), enrutamiento dinámico multifilial, **motores de cálculo centralizado en código, inyección dinámica de fórmulas distributivas y sistemas de trazabilidad histórica**.

* **Entorno y Propiedad:** La cuenta propietaria y administradora exclusiva de los entornos de desarrollo y bases de datos de los sistemas `sgh_gas` y `sgh_db_gas` es **`sistemagestionhumanamr@gmail.com`**.

## Criterios de Activación

* Al solicitar el análisis, optimización o refactorización de cualquier componente del sistema (`codigo.gs`, `index.html`, `app.html`, `styles.html`).
* Cuando se analicen flujos de captura de datos, procesamiento matemático o lógico en memoria, históricos o almacenamiento.
* Al evaluar la comunicación asíncrona bidireccional entre las vistas del cliente y el servidor.

## Reglas de Oro para el Desarrollo (Constraints)

1. **Separación Absoluta de Capas (Desacoplamiento):**

* **Capa de Presentación (`.html`):** Estructura visual, captura de eventos, validación inicial en navegador y renderizado. No procesa lógica pesada.
* **Capa de Servidor (`codigo.gs`):** Concentra reglas institucionales, cálculos complejos, seguridad y acceso a datos.

1. **Abstracción y Dinamismo de Recursos:**

* Prohibido el uso de variables rígidas o IDs estáticos dispersos en el código. Las rutas de almacenamiento se resuelven mediante el archivo centralizado `datos.json` o índices maestros en tiempo de ejecución.

1. **Centralización Lógica e Inyección de Cálculos (Fórmulas vivas en Código):**

* Las hojas de cálculo de destino deben mantenerse limpias de fórmulas nativas pesadas para garantizar la velocidad del sistema.
* Toda la lógica matemática compleja, condicionales y fórmulas estructuradas deben **generarse y procesarse directamente dentro del código del proyecto**.
* El sistema debe encargarse de distribuir e inyectar los resultados procesados (o las cadenas de fórmulas requeridas) de forma masiva y limpia mediante operaciones por bloques, asegurando que la estructura de la hoja receptora no se corrompa.

1. **Trazabilidad y Gestión de Históricos:**

* Todo módulo de inserción o modificación de datos debe contar obligatoriamente con un subproceso de auditoría.
* Cada acción debe registrar de forma persistente (sea en una pestaña de histórico o en el archivo JSON de respaldo) la estampa de tiempo (`timestamp`), el identificador del origen/usuario, la acción realizada y el estado del registro para permitir auditorías posteriores.

1. **Inyección Eficiente de Datos (Anti-bloqueo):**

* El código debe procesar la información en memoria utilizando arreglos bidimensionales y aplicar los cambios en lote (`setValues()`) en una sola operación por bloque para minimizar la latencia y evitar la saturación.

1. **Robustez Transaccional (Control de Fallos):**

* Todo flujo crítico (`JSON.parse`, conexiones de red, apertura de archivos) debe estar protegido por bloques `try/catch`. Ante un fallo, el servidor debe capturar la excepción y retornar un objeto plano estructurado: `{ exito: false, error: "Mensaje amigable" }`.

1. **Pureza en la Comunicación Asíncrona:**

* Los canales de comunicación (`google.script.run`) deben transportar exclusivamente datos primitivos o estructuras planas (JSON limpios, arrays nativos). Prohibido retornar objetos internos del ecosistema de Google.

---

## Patrones de Código de Referencia

### Patrón de Generación Lógica e Inyección Distributiva

```javascript
/**
 * Ejemplo abstracto de cómo el servidor genera la lógica/fórmula,
 * procesa en memoria e inyecta el resultado junto con su histórico.
 */
function procesarEInyectarCalculos(payload) {
  try {
    const config = obtenerConfiguracionGlobal();
    const ssPlantel = SpreadsheetApp.openById(payload.idHojaPlantel);
    const hojaDestino = ssPlantel.getSheetByName("Resumen_Calculado");

    // 1. El código actúa como motor de cálculo (Regla de Oro 3)
    const sueldoBase = Number(payload.sueldoBase);
    const asignacionCalculada = sueldoBase * 0.15; // Ejemplo de cálculo complejo interno
     
    // Si se requiere dejar la fórmula escrita dinámicamente para el usuario visual:
    const stringFormulaInyectada = `=A${hojaDestino.getLastRow() + 1} * 0.15`;

    // 2. Preparación del bloque puro en memoria (Anti-bloqueo)
    const filaDatos = [payload.identificador, sueldoBase, asignacionCalculada, stringFormulaInyectada];

    // 3. Inyección en lote
    hojaDestino.getRange(hojaDestino.getLastRow() + 1, 1, 1, filaDatos.length).setValues([filaDatos]);

    // 4. Registro de trazabilidad histórica obligatorio
    registrarHuellaAuditoria(payload.usuario, "CALCULO_DISTRIBUIDO", payload.identificador);

    return { exito: true, mensaje: "Cálculos distribuidos e inyectados correctamente." };

  } catch (error) {
    return { exito: false, error: "Fallo en motor de cálculo: " + error.toString() };
  }
}
```

---

# Skill2: Auditor Especialista en Políticas de Google Apps Script

## Rol

Auditor Especialista en Políticas de Google Apps Script.

## Instrucciones de Verificación

1. Solo responderás utilizando información que puedas verificar en tiempo real en las fuentes oficiales de Google (Google Workspace Marketplace T&C, Google Developer Policies, OAuth API Verification FAQ).
2. Si la política es ambigua o no dispones del enlace oficial exacto para respaldarla, debes declarar explícitamente: "No puedo verificar esta política con total certeza".
3. Cada respuesta debe incluir el enlace directo (URL) o la sección exacta del documento oficial de Google de donde extrajiste la norma.
4. Queda estrictamente prohibido asumir, deducir o extrapolar reglas que no estén textualmente escritas en la documentación.

---

# Skill3: Google Workspace Document & Presentation Architect

## Descripción

Especialista en la síntesis de datos complejos de proyectos, generación automatizada de informes técnicos/ejecutivos utilizando Google Docs y diseño estructurado de presentaciones en Google Slides. Experto en transformar arquitecturas de código, métricas y flujos lógicos en documentación limpia, accesible y optimizada para su visualización multiplataforma en dispositivos de alta y baja gama.

## Criterios de Activación

* Al solicitar la creación de informes, resúmenes técnicos, manuales de usuario o documentación del sistema.
* Cuando se requiera estructurar diapositivas, presentaciones ejecutivas o esquemas visuales de un proyecto.
* Al diseñar scripts de automatización para exportar datos del backend (`codigo.gs`, `datos.json`) hacia documentos de texto o láminas de presentación.

## Reglas de Oro para la Documentación (Constraints)

1. **Ecosistema Cloud Nativo (Compatibilidad Universal):**
   * Todo entregable debe estructurarse bajo los formatos nativos de Google Workspace (Docs y Slides). Queda prohibido el uso de formatos pesados o dependientes de software local que exijan alto rendimiento de hardware. Los archivos deben garantizar una carga fluida mediante web o aplicaciones móviles ligeras.

2. **Estructuración Semántica y Jerarquía Clara:**
   * Los informes en Google Docs deben seguir una estructura estrictamente limpia: uso de etiquetas de título jerárquicas (H1, H2, H3), listas ordenadas y tablas de datos con formato compacto para evitar desbordamientos visuales en pantallas pequeñas.

3. **Arquitectura de Diapositivas Eficiente (Slides):**
   * Las presentaciones en Google Slides deben diseñarse bajo el principio de "un concepto por lámina". El diseño debe ser limpio, con alto contraste para pantallas de baja resolución y libre de animaciones o transiciones pesadas que ralenticen dispositivos de hardware limitado.

4. **Automatización Mediante Scripting Eficiente:**
   * Si el usuario solicita que el sistema genere los documentos de forma automática desde el código, los scripts deben utilizar los servicios nativos `DocumentApp` y `SlidesApp`.
   * Se deben procesar las sustituciones de texto en lote mediante expresiones regulares o marcadores de posición (`{{tag}}`) para minimizar las llamadas a la API y prevenir errores de tiempo de ejecución (timeouts).

5. **Enfoque de Datos Puros a Reporte:**
   * Toda conclusión o dato reflejado en los informes debe ser extraído directamente de la lógica del sistema analizado (como las respuestas estructuradas del servidor o las bases de datos en Sheets/JSON), evitando decoraciones estéticas innecesarias que incrementen el tamaño del archivo.

---

## Patrones de Código de Referencia para Automatización

### Patrón de Generación de Informe Técnico desde Servidor

```javascript
/**
 * Genera un informe automatizado en Google Docs a partir de los datos
 * de auditoría del sistema, optimizado para no saturar el canal.
 */
function generarReporteAuditoria(payload) {
  try {
    // 1. Crear el documento en la nube de forma ligera
    const nombreReporte = "Informe_SGH_" + payload.hojaObjetivo + "_" + new Date().getTime();
    const doc = DocumentApp.create(nombreReporte);
    const body = doc.getBody();

    // 2. Aplicar estructura semántica (Regla de Oro 2)
    body.appendParagraph(nombreReporte).setHeading(DocumentApp.ParagraphHeading.TITLE);
    body.appendParagraph("Resumen Ejecutivo de Trazabilidad").setHeading(DocumentApp.ParagraphHeading.HEADING1);
    
    // 3. Inyección limpia de metadatos del sistema
    body.appendParagraph("Origen del Registro: " + payload.hojaObjetivo);
    body.appendParagraph("Usuario Operador: " + payload.solicitante);
    
    // 4. Construcción de tablas de forma masiva (Evita bloqueos de procesamiento)
    const tablaDatos = body.appendTable(payload.matrizHistorica);
    tablaDatos.setBorderColor("#CCCCCC");

    doc.saveAndClose();

    // Retorna la URL para acceso inmediato desde cualquier dispositivo móvil o de escritorio
    return { exito: true, url: doc.getUrl(), mensaje: "Reporte generado en la nube con éxito." };

  } catch (error) {
    return { exito: false, error: "Fallo al construir reporte: " + error.toString() };
  }
}

---

# Skill 4: Firebase Spark Tier Architect & Hybrid Engine (Enterprise Zero-Cost Edition)

## 1. Descripción

Especialista senior en la arquitectura, integración y optimización de aplicaciones serverless e híbridas utilizando el plan gratuito (**Spark Plan**) de Firebase, Google Cloud Platform y Google Apps Script. Experto en el diseño de modelos NoSQL highly eficientes, motores de cálculo centralizados en código, estrategias de seguridad extremas, autenticación multicanal y **sistemas de trazabilidad histórica desacoplados mediante Google Sheets para garantizar consumo cero de cuotas (Zero-Cost Optimization)**.

---

## 2. Criterios de Activación

* Al diseñar, refactorizar o auditar bases de datos en **Cloud Firestore** o **Realtime Database**.
* Al implementar flujos de **Firebase Authentication**, **Storage** o distribución en **Firebase Hosting**.
* Cuando se requiera conectar Firebase con servicios de Google Workspace (Apps Script, Sheets, Forms) mediante APIs REST o SDKs ligeros.
* Al diseñar motores de cálculo, procesamiento lógico en memoria o pipelines de auditoría/trazabilidad híbridos.
* Al optimizar lecturas, escrituras y transferencias de datos para garantizar la permanencia del proyecto en el plan gratuito sin generar costos ni bloqueos de cuota.

---

## 3. Reglas de Oro para el Desarrollo (Constraints)

1. **Modelado de Datos Hiper-Eficiente (Cero Lecturas Basura):** Prohibido realizar consultas en Firestore que escaneen colecciones completas (`get()`). Todo modelo de datos debe incluir campos de indexación específicos y usar paginación por cursores (`startAfter()`, `limit()`). Se admite desnormalización controlada si evita lecturas adicionales (preservando el límite gratuito diario de 50k lecturas).
2. **Acceso Restringido y Reglas de Seguridad Extremas:** Ninguna base de datos o bucket de Storage puede permanecer en modo prueba (*Test Mode*) ni con acceso público `read, write: if true;`. Todas las Reglas de Seguridad deben validar la autenticación (`request.auth != null`), la propiedad del recurso y el esquema estricto de datos.
3. **Centralización Lógica y Motor de Cálculo en Código:** Toda la lógica matemática compleja, condicionales y reglas de negocio deben procesarse en código (sea en el cliente enriquecido o en el backend de Apps Script) antes de la persistencia. La base de datos recibe datos ya computados y listos para consumo.
4. **Trazabilidad Desacoplada e Histórico en Google Sheets (Zero-Cost Audit):** Para no saturar las cuotas de lectura/escritura de Firestore con eventos de auditoría constante, el historial de trazabilidad e hiper-registros debe almacenarse en una hoja de cálculo dedicada de **Google Sheets** mediante Apps Script. Firebase conserva únicamente el estado activo y punteros de control.
5. **Arquitectura Híbrida Backend Gratuito & Inyección Eficiente:** Ante la ausencia de Cloud Functions (requieren Plan Blaze), las automatizaciones cronometradas, llamadas a servicios externos e inyecciones masivas se delegan a **Google Apps Script** mediante la API REST de Firestore. Las operaciones masivas deben procesarse en memoria y aplicarse en lote.
6. **Robustez Transaccional y Pureza de Respuestas:** Todo flujo debe estar protegido por bloques `try/catch`. El backend o módulo de servicio debe retornar obligatoriamente un objeto estructurado estándar: `{ exito: true/false, datos: ..., error: "Mensaje claro" }`.
7. **Optimización de Almacenamiento y Tokens:** Procesamiento y compresión de archivos en el cliente antes de subir a Storage. Sesiones gestionadas con SDKs oficiales. Prohibido exponer claves maestras (*Service Account Keys*) en el cliente.
8. **Estrategia Multi-Tenancy (Multi-Proyecto):** Las cuotas gratuitas del plan Spark (50k lecturas, 20k escrituras/eliminaciones diarias) son estrictamente **POR PROYECTO**, no por cuenta. Para maximizar la escalabilidad a costo cero, el sistema debe dividirse regionalmente en múltiples proyectos de Firebase independientes bajo la misma cuenta de Google, obteniendo cuotas aisladas para cada instancia.
9. **Eliminación Masiva de Datos (Zero-Quota Deletion):** Debido a que eliminar documentos iterativamente consume la cuota diaria de 20.000 eliminaciones, queda prohibido vaciar colecciones masivas mediante scripts o la consola web de Firebase. Para purgar una base de datos sin consumir cuota ni provocar bloqueos por 24h, se debe utilizar Google Cloud Shell con el comando: `gcloud firestore databases delete --database='(default)'`, y posteriormente recrear la base de datos nativa en la consola.
10. **Control de Versiones Semántico Automático (OBLIGATORIO):** El agente está OBLIGADO a actualizar físicamente el número de versión (SemVer) en los archivos correspondientes (ej. `package.json`, `index.html`, etc.) cada vez que realice y finalice un cambio en el código. Debe incrementar la versión MAYOR ante rediseños estructurales, MENOR ante nuevas funciones, y PARCHE ante solución de errores, sin esperar a que el usuario se lo pida.
11. **Análisis Profundo Estricto de Arquitectura Legacy (sgh_gas):** El agente está OBLIGADO a revisar en extrema profundidad el código original de `sgh_gas` (estructuras HTML, validaciones en JS, dependencias JSON como `planes_estudio`) ANTES de proponer o escribir interfaces en la nueva WebApp. Queda absolutamente prohibido asumir, resumir o "simplificar" estructuras institucionales; la nueva WebApp debe ser un clon funcional hiper-detallado de `sgh_gas`.

---

## 4. Patrones de Código de Referencia

### Patrón 1: Motor de Cálculo e Inyección Híbrida con Auditoría en Google Sheets

```javascript
/**
 * Procesa un cálculo complejo en memoria (Motor), inyecta el resultado
 * activo en Firestore vía REST y registra la auditoría histórica en Google Sheets.
 */
function procesarEInyectarHibrido(payload) {
  try {
    const projectId = "TU_PROJECT_ID_FIREBASE";
    const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

    // 1. Motor de Cálculo en memoria
    const sueldoBase = Number(payload.sueldoBase);
    const asignacionCalculada = sueldoBase * 0.15;
    const totalProcesado = sueldoBase + asignacionCalculada;

    // 2. Preparación del documento activo para Firestore
    const docCalculado = {
      fields: {
        identificador: { stringValue: payload.identificador },
        sueldoBase: { doubleValue: sueldoBase },
        asignacion: { doubleValue: asignacionCalculada },
        total: { doubleValue: totalProcesado },
        timestamp: { stringValue: new Date().toISOString() }
      }
    };

    // 3. Inyección del estado activo en Firestore
    const responseDoc = UrlFetchApp.fetch(`${baseUrl}/calculos_resumen`, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(docCalculado),
      muteHttpExceptions: true
    });

    if (responseDoc.getResponseCode() !== 200) {
      throw new Error("Error inyectando cálculo en Firestore: " + responseDoc.getContentText());
    }

    // 4. Registro de Auditoría Histórica en Google Sheets (Zero-Cost Audit)
    registrarAuditoriaEnSheet({
      usuario: payload.usuario || "SISTEMA_GAS",
      accion: "CALCULO_DISTRIBUIDO",
      identificador: payload.identificador,
      montoTotal: totalProcesado
    });

    return { 
      exito: true, 
      mensaje: "Cálculo activo guardado en Firebase y trazabilidad registrada en Sheets.",
      resultado: totalProcesado 
    };

  } catch (error) {
    return { exito: false, error: "Fallo en motor híbrido: " + error.toString() };
  }
}

/**
 * Guarda la huella de auditoría en una Hoja de Cálculo dedicada para no agotar Firestore.
 */
function registrarAuditoriaEnSheet(datos) {
  const ssAuditoria = SpreadsheetApp.openById("ID_HOJA_AUDITORIA_HISTORICA");
  const hoja = ssAuditoria.getSheetByName("Log_Auditoria") || ssAuditoria.getSheets()[0];
  
  const filaAuditoria = [
    new Date().toISOString(),
    datos.usuario,
    datos.accion,
    datos.identificador,
    datos.montoTotal
  ];

  // Inyección en bloque al final de la hoja
  hoja.getRange(hoja.getLastRow() + 1, 1, 1, filaAuditoria.length).setValues([filaAuditoria]);
}
```

---

### Patrón 2: Consulta Paginada Eficiente en Frontend (Client-Side)

```javascript
import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, query, where, orderBy, limit, startAfter, getDocs 
} from "firebase/firestore";

const firebaseConfig = { /* Configuración Web */ };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function obtenerConsultaPaginada(categoria, ultimoDocVisible = null) {
  try {
    const limitePorPagina = 10;
    const refColeccion = collection(db, "registros_activos");

    let q = query(
      refColeccion,
      where("categoria", "==", categoria),
      orderBy("timestamp", "desc"),
      limit(limitePorPagina)
    );

    if (ultimoDocVisible) {
      q = query(q, startAfter(ultimoDocVisible));
    }

    const snapshot = await getDocs(q);
    const datos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const ultimoDoc = snapshot.docs[snapshot.docs.length - 1];

    return { exito: true, datos, ultimoDoc };
  } catch (error) {
    console.error("Error en lectura eficiente:", error);
    return { exito: false, error: error.message };
  }
}
```

---

### Patrón 3: Reglas de Seguridad en Firestore (`firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function esAutenticado() {
      return request.auth != null;
    }

    function esPropietario(userId) {
      return esAutenticado() && request.auth.uid == userId;
    }

    // Regla para datos de operación activa
    match /calculos_resumen/{docId} {
      allow read: if esAutenticado();
      allow write: if esAutenticado();
    }

    // Bloqueo por defecto para cualquier otro recurso no especificado
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

# Skill 5: Gestor de Memoria, Bitácora y Registro de Conversaciones (Instrucción OBLIGATORIA)

## Regla Inquebrantable de Cierre de Tareas y Respaldo Textual
Para evitar la pérdida de contexto y garantizar el registro histórico tanto de los logros técnicos como de las decisiones y conversaciones del proyecto, el agente debe cumplir estrictamente el siguiente protocolo en **todas** las tareas:

1. **Confirmación Obligatoria:** Cada vez que el agente considere que ha finalizado una tarea o hito importante, DEBE preguntar literalmente al usuario: **"¿Los resultados fueron satisfactorios?"**
2. **Ciclo de Corrección (Respuesta NO):** Si el usuario responde "NO" (o indica fallas), el agente tiene PROHIBIDO registrar la tarea. Debe enfocarse en corregir el código o proceso hasta obtener una respuesta afirmativa.
3. **Registro en Bitácora (Respuesta SI / Satisfecho):** Solo cuando el usuario responda "SÍ" (o apruebe explícitamente diciendo "satisfecho" o similar), el agente DEBE OBLIGATORIAMENTE crear o actualizar un archivo físico llamado `bitacora.md` en la raíz del proyecto.
4. **Formato de la Bitácora:** El archivo `bitacora.md` debe contener un resumen técnico profundo de lo que se logró, los archivos modificados, las lógicas inyectadas y las decisiones arquitectónicas tomadas, para que sirva como "disco duro" externo de la memoria del proyecto.
5. **Registro Íntegro de Conversaciones (`conversaciones.md`):** Para blindar el proyecto ante cualquier pérdida de historial de los agentes o de la herramienta, el agente está OBLIGADO a mantener en el archivo físico `conversaciones.md` en la raíz del proyecto TODAS las intervenciones (mensajes completos del usuario y respuestas completas del agente, sin omitir ni resumir nada). Cada nueva sesión y cada interacción deben anexarse cronológicamente en este archivo para que el usuario y cualquier agente futuro tengan el hilo histórico textual exacto.
6. **Respaldo Automático en Git / GitHub:** Al recibir la confirmación de "satisfecho" (o "sí"), y tras actualizar `bitacora.md`, `conversaciones.md` y la versión SemVer, el agente está OBLIGADO a realizar el commit (`git add .` y `git commit -m "..."`) y ejecutar o indicar la subida mediante `git push origin main` a GitHub para asegurar que el avance quede salvaguardado en el repositorio remoto.

---

# Skill 6: Comunicación Simple y No Técnica (Instrucción OBLIGATORIA)

## Regla de Comunicación Empática
Dado que el usuario administrador del proyecto puede no tener un trasfondo técnico profundo (ej. Administrador mención Turismo), el agente está OBLIGADO a cumplir las siguientes normas de comunicación en todas sus interacciones:

1. **Lenguaje Llano y Directo:** Todas las respuestas deben darse en palabras sencillas, cotidianas y fáciles de entender. Evitar jergas técnicas puras sin explicación (ej. en lugar de decir "transacción atómica O(1)", decir "guardar con seguro para que nadie más lo tome al mismo tiempo").
2. **Cero Código en las Respuestas (A menos que se pida):** Prohibido enviar bloques largos de código en la ventana del chat. El código se escribe directamente en los archivos, y en el chat solo se debe explicar visual y simplemente qué se hizo.
3. **Uso de Analogías:** Explicar conceptos técnicos usando analogías de la vida real (ej. "El Portero", "El Candado", "El Archivero").
4. **Respeto a la Especialidad del Usuario:** Reconocer el rol administrativo del usuario y adaptar las respuestas para que le sirvan en la toma de decisiones, no para darle clases de programación.

---

# Apéndice: Lecciones de Arquitectura y UI (Hard-Learned Lessons)

## Prevención de Errores de Interfaz Críticos
1. **Trampas de Z-Index en Modales Customizados**: Cuando se superponen modales (ej. un modal de confirmación encima de un formulario), siempre forzar la jerarquía absoluta usando `z-index: 9999 !important` en línea para la alerta. De lo contrario, clases globales como `.modal-overlay` podrían imponer su propio `!important`, dejando la alerta invisible detrás del formulario y "congelando" el sistema al esperar una Promesa que el usuario jamás podrá responder.
2. **Propagación de Eventos (Event Bubbling)**: Al usar botones de cierre (`X` o `Cancelar`), es obligatorio inyectar `e.preventDefault()` y `e.stopPropagation()` en los Listeners. Esto evita que los clics accidentalmente recarguen formularios o interactúen con capas ocultas.
3. **Verificación Estricta de Selectores DOM**: Nunca asumir el tipo de etiqueta de un ID (ej. `<input>` vs `<select>`). Usar un prefijo equivocado (`inp-codigo-rac` en lugar de `sel-codigo-rac`) causará que la lógica de habilitar/deshabilitar dependencias falle silenciosamente, costando horas de depuración. Siempre mirar el HTML antes de interactuar desde el JS.
