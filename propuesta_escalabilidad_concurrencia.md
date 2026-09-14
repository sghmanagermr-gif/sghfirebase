# Plan de Implementación: Arquitectura de Alta Concurrencia y Seguridad

Este plan resuelve el conflicto de mantener la aplicación bajo la modalidad **"Ejecutar como: Usuario que accede a la aplicación web"** (para soportar más de 500 directores sin consumir la cuota de tu cuenta principal) sin comprometer la seguridad de las contraseñas ni causar errores de permisos de escritura.

## ⚠️ User Review Required
Por favor revisa el concepto de la **Bóveda (ScriptProperties)** y el **API de Auditoría**. 
Estas son técnicas avanzadas de Google Apps Script que nos permiten saltarnos las limitaciones de permisos de Drive de forma segura.

## 💡 Conceptos Clave (Explicación para tu tranquilidad)

1. **¿Qué es la Bóveda (ScriptProperties)?**
   Es una base de datos diminuta (de texto) que vive *dentro del código fuente* de Google Apps Script, no en Google Drive. Ningún usuario puede verla, descargarla ni acceder a ella mediante enlaces. Solo el código del servidor puede leerla. Allí guardaremos la tabla de `Usuario -> Contraseña -> ID Hoja`, sacándola del Excel para que ningún director necesite permisos para validarse.
   
2. **¿Qué es el API de Auditoría?**
   Como los directores no tendrán permiso para escribir en tu Excel, convertiremos tu proyecto **sgh_db_gas** (que sí tiene permisos porque es tuyo) en un "Receptor de mensajes". Cuando un director haga login, **sgh_gas** le enviará un mensaje invisible por internet a **sgh_db_gas**, y este último escribirá la auditoría en el Excel.

## 🛠️ Proposed Changes

### Componente 1: sgh_gas (El cliente de los Directores)

- **[NEW] Función `ADMIN_sincronizarBoveda()`**: 
  Crearemos esta función que **solo tú ejecutarás manualmente desde el editor** cuando agregues planteles nuevos al Directorio Maestro. Esta función leerá el Excel y meterá todas las claves en la Bóveda oculta del script, separando cada escuela para lectura ultra rápida.
- **[MODIFY] Función `_buscarUsuarioEnDirectorio()`**: 
  Ya no leerá el Excel. Ahora simplemente le preguntará a la Bóveda interna si la contraseña ingresada coincide. Esto elimina el 100% del riesgo de seguridad.
- **[MODIFY] Función `registrarHuellaAuditoria()`**: 
  Se modificará para que utilice `UrlFetchApp`. Enviará los datos del login (Usuario, Acción, Estado) a la URL oficial de tu otro proyecto (`sgh_db_gas`).
- **[MODIFY] Función `validarAccesoUsuario()`**: 
  Restauraremos el "Paso 5.5" (Bloqueo de Municipio) que habíamos quitado, ya que ahora la auditoría no hará colapsar el sistema.

### Componente 2: sgh_db_gas (El Panel Administrador)

- **[NEW] Función `doPost(e)`**: 
  Agregaremos el recibidor oficial de mensajes web. Cuando escuche un mensaje proveniente de `sgh_gas`, tomará los datos de auditoría y los escribirá en la pestaña `Histórico_Auditoría` de tu Directorio Maestro, utilizando tus permisos de Administrador de forma segura.

## 🧪 Verification Plan

1. **Sincronización:** Ejecutaremos `ADMIN_sincronizarBoveda()` como administrador y verificaremos que la bóveda guarde las claves.
2. **Prueba Incógnito (Cero Permisos):** Intentaremos hacer login desde una ventana de Incógnito asegurándonos de que no tenemos ningún permiso sobre el Directorio Maestro.
3. **Auditoría:** Verificaremos que el registro de éxito/fallo aparezca mágicamente en la pestaña `Histórico_Auditoría` a pesar de haber ingresado desde Incógnito.
4. **Despliegue:** Confirmaremos que el mensaje rojo de "Municipio inactivo" vuelve a funcionar sin colapsar el navegador.
