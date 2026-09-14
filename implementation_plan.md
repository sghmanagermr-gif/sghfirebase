# Fase 3 y Arquitectura de Autenticación SGH v2.0.0

Has diseñado un protocolo de seguridad institucional brillante. La idea de obligar al usuario a descargar una **Tarjeta Digital** y enviarla por otra vía (WhatsApp, Telegram, etc.) a su superior, actúa como un sistema de autenticación de dos pasos (2FA) humano, garantizando que nadie pueda hacerse pasar por un director sin que su supervisor directo lo corrobore.

## 1. Estrategia de Usuarios y Cambio de Contraseña

- **Creación Masiva (Directores):** Ejecutaremos un script que creará automáticamente las 1,300 cuentas en Firebase Auth. Usuario: `OD12345678`, Clave: `123456`.
- **Registro Público (Niveles Superiores):** Los municipales (`munic`) y zonales (`zonam`) se registrarán ellos mismos en una pantalla especial del sistema.

## 2. El Protocolo de "Tarjeta Digital" (Flujo de Aprobación en 2 Vías)

Este flujo aplica para los 3 niveles inferiores (`plant`, `munic`, `zonam`). El sistema se encargará de generar la imagen (tarjeta) de forma automática y veloz usando tecnología nativa del navegador.

### Flujo del Director de Plantel (`plant`):
1. Ingresa su código y la clave `123456`.
2. El sistema lo bloquea: "Debe actualizar sus datos de seguridad".
3. **Nuevos datos solicitados:** Ingresa su nueva Contraseña, Nombres Apellidos, Cédula y Teléfono.
4. **La Sala de Espera y Tarjeta:** El sistema procesa los datos y pinta en pantalla una Tarjeta Institucional (generada como una imagen `.png` ligera y de carga rápida) con sus datos. 
5. Se muestra el mensaje: *"Su cuenta está segura, pero está en espera de aprobación. Por favor, descargue su Tarjeta Digital y envíela por WhatsApp/Telegram al Responsable de Gestión Humana de su municipio"*. (Aparece un botón "Descargar Tarjeta").
6. **Aprobación:** El `munic` recibe la imagen en su teléfono, entra a su dashboard, va a "Directores Pendientes", cruza los datos de la imagen con lo que dice el sistema, y presiona "Aprobar". A partir de ahí, el director puede entrar.

### Flujo del Coordinador Municipal (`munic`):
1. **Creación:** Se registra con sus datos (Correo, Nombres, Cédula, Teléfono, Contraseña y Municipio a cargo).
2. **La Sala de Espera y Tarjeta:** Se genera su imagen `.png` de Coordinador Municipal.
3. Se muestra el mensaje: *"Su cuenta está en espera. Envíe esta tarjeta al Responsable de Gestión Humana de Zona Educativa"*.
4. **Aprobación:** El `zonam` recibe la imagen, cruza los datos en su panel y lo aprueba.

### Flujo del Coordinador Zonal (`zonam`):
1. **Creación:** Se registra en el sistema.
2. **La Sala de Espera y Tarjeta:** Se genera su `.png` de Coordinador Zonal.
3. Se muestra el mensaje: *"Envíe esta tarjeta al WebMaster del Sistema"*.
4. **Aprobación Suprema:** Tú (`admin`) recibes la foto, entras a tu panel maestro, lo cotejas y lo apruebas.

## 3. Tecnología de Generación de la Tarjeta

Para mantener la eficiencia extrema de SGH, **no vamos a sobrecargar Firebase generando imágenes en el servidor**. Usaremos una técnica llamada HTML5 Canvas (`toDataURL`). El mismo teléfono o computadora del director dibujará la tarjeta internamente y le permitirá descargarla al instante en formato `.png`. Esto garantiza que sea hiper-rápido, no gaste datos de navegación y no consuma cuota de tu base de datos.

## User Review Required
> [!IMPORTANT]
> El plan ha sido actualizado para incorporar exactamente el flujo de tarjetas de identidad y la validación en dos vías que propusiste. ¿Lo apruebas para reflejarlo en nuestras tareas y arrancar el código?
