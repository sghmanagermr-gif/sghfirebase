# 🚀 ESTADO DE MIGRACIÓN A FIREBASE: SISTEMA SGH MÉRIDA

**Fecha de la última actualización:** 29 de Julio de 2026
**Estado Actual:** Pausado a la espera del cierre de jornada de carga (para evitar pérdida de registros en tiempo real).

---

## ✅ LO QUE HEMOS LOGRADO HASTA AHORA (PASO 1 COMPLETADO)

1. **Estrategia Arquitectónica Definida:**
   - Validamos que el límite de Google Sheets (14 copias del proyecto y `IMPORTRANGE` masivos) se soluciona centralizando todo en una única colección en **Firestore**.
   - Se acordó usar **Firebase Authentication** para eliminar la necesidad de autorizaciones de Google Apps Script y superar el límite de 100 usuarios por proyecto.
   - Definimos que las complejas "Hojas de Cuadratura" se generarán dinámicamente en la web leyendo los datos anidados en Firebase.

2. **La Casa en la Nube Construida:**
   - Se creó una cuenta de correo maestro y aislada (`sgh.manager.mr@gmail.com`) para evitar límites de la cuenta anterior.
   - Se creó el proyecto en la consola de Firebase (`sgh-merida`).
   - Se registraron y guardaron las **Llaves Maestras (firebaseConfig)**.

3. **Motores de Firebase Encendidos:**
   - **Firestore Database:** Activada en Edición Standard (Gratuita) y en Modo de Prueba.
   - **Authentication:** Activado el acceso por Correo/Contraseña (Límite de 50.000 usuarios mensuales gratis).
   - **Storage (Cancelado):** Se determinó estratégicamente NO activar el Storage para evitar que Google exija tarjeta de crédito, ya que el sistema `sgh_gas` maneja puro texto/datos y no requiere alojar archivos físicos (PDFs/Imágenes).

---

## ⏳ LO QUE FALTA (PRÓXIMOS PASOS)

### PASO 2: La Mudanza de Datos (En Espera)
*Acción requerida por el Administrador:*
- [ ] Esperar a que cierre el sistema actual para que nadie ingrese más datos.
- [ ] Abrir el Documento Maestro de Google Sheets (`1_GuF2...`).
- [ ] Descargar la pestaña **PERSONAL** como archivo CSV (`Archivo > Descargar > Valores separados por comas`).
- [ ] Descargar la pestaña **PLANTELES** como archivo CSV.
- [ ] Guardar ambos archivos en la carpeta local `C:\Proyectos\sgh-mr - copia`.

*Acción requerida por Antigravity (IA):*
- [ ] Escribir un script local en Node.js que lea esos dos archivos CSV.
- [ ] Transformar los datos planos a estructura tridimensional (incluyendo la Cuadratura dentro del perfil del docente).
- [ ] Subir los ~22.000 registros a Firestore a ultra-velocidad para evitar los bloqueos de 6 minutos de Google Apps Script.

### PASO 3 y 4: Reconexión y Seguridad
- [ ] Modificar el código frontend (`index.html`) para que lea y escriba directamente en Firebase en lugar de usar `google.script.run`.
- [ ] Configurar las Reglas de Seguridad en Firebase ("La Llave Digital") para que cada director solo pueda ver su municipio/plantel.

### PASO 5: Despliegue Final
- [ ] Subir la aplicación web terminada a Firebase Hosting para obtener un único enlace público seguro (`sgh-merida.web.app`) para los 1.300+ usuarios.
- [ ] Desechar las 14 copias antiguas de Google Apps Script.
