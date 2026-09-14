# Validación de Cédulas Global (Plan B: Microservicio)

Implementaremos una arquitectura segura donde el sistema principal se comunicará con un pequeño "Mini-Script" auxiliar que tiene los permisos necesarios para consultar la base de datos de todo el estado. Esto evita que los usuarios finales tengan acceso directo a la nómina estatal.

> [!IMPORTANT]
> **Aprobación Requerida:** Para llevar a cabo este plan, necesitarás crear un proyecto de Google Apps Script completamente nuevo y por separado. Revisa el plan a continuación e indícame si estás de acuerdo para comenzar.

## Open Questions

Para que el Mini-Script funcione correctamente, necesito que me confirmes los siguientes datos sobre tu archivo de base de datos Global (Estatal):

1. **¿Cuál es el ID del archivo de Google Sheets Global?** (El código largo en la URL del archivo).
2. **¿Cuál es el nombre exacto de la pestaña (Hoja)** donde están registradas todas las personas del estado?
3. **¿En qué letra de columna** se encuentran registradas las cédulas en ese archivo global? (Por ejemplo: Columna A, Columna B, etc.)

## Proposed Changes

La implementación se divide en dos fases principales:

### Fase 1: El Microservicio (API) [Tú crearás esto]

Tendrás que ir a Google Drive y crear un nuevo proyecto de Google Apps Script. Yo te entregaré un código corto (`api_global.gs`) que deberás pegar allí.

Ese código hará lo siguiente:
- Recibirá peticiones HTTP (mediante la función `doGet(e)`).
- Extraerá la cédula consultada.
- Abrirá tu archivo Global usando sus propios permisos de lectura.
- Retornará una respuesta limpia en formato JSON: `{"existe": true}` o `{"existe": false}`.

Luego, **desplegarás ese mini-script** asegurándote de usar:
* **Ejecutar como:** *Yo (tu correo)*
* **Quién tiene acceso:** *Cualquier usuario*

Finalmente, me entregarás la URL (Web App URL) que te arroje Google.

---

### Fase 2: Integración en el Sistema Principal (`codigo.gs`)

Una vez tengamos la URL de tu nuevo Microservicio, yo modificaré el código de tu sistema actual.

#### [MODIFY] [codigo.gs](file:///c:/Users/Luis/Proyectos/sgh-mr%20-%20copia/sgh_gas/codigo.gs)
1. **Configuración:** Agregaré la variable constante `URL_API_GLOBAL = "LA_URL_QUE_ME_DES"`.
2. **Validación:** En la función `guardarRegistroPersonal()`, justo después de verificar que la cédula no esté duplicada en la hoja del propio plantel, agregaré una llamada `UrlFetchApp.fetch(URL_API_GLOBAL + "?cedula=" + nuevaCedula)`.
3. **Bloqueo:** Si la respuesta de la API es que la cédula ya existe a nivel estatal (y no estamos en una operación de edición válida), el sistema abortará el guardado y devolverá el error: *"La cédula XXX ya se encuentra registrada en otro plantel del estado."*

## Verification Plan

### Manual Verification
1. Intentar registrar un trabajador con una cédula que ya exista en el archivo global pero NO en el archivo del plantel local. El sistema debe bloquearlo.
2. Intentar registrar una cédula completamente nueva. El sistema debe permitirlo.
3. Intentar editar un trabajador existente (misma cédula). El sistema no debe chocar consigo mismo ni con la validación global.
