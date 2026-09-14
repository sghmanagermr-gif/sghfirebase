# Resumen de Progreso y Contexto: SGH v2.0.0 (Fase 3 en Planificación)

## Decisiones de Arquitectura y Seguridad (Acordadas)

1. **Diseño Visual (Premium):** 
   - Se mantiene estrictamente el esquema de Glassmorphism, paneles translúcidos y tema oscuro para TODO el sistema, incluyendo modales y formularios.

2. **La Declaración Jurada:**
   - Fue programada exactamente igual al texto de `sgh_gas` y conectada para que aparezca **después** del inicio de sesión. Nadie avanza sin pulsar "ACEPTO Y CERTIFICO".

3. **Roles Jerárquicos y Seguridad en Cascada (RBAC):**
   - `admin` (Propietario, aprueba a los zonales).
   - `zonam` (Coordinador Zonal, aprueba a los municipales).
   - `munic` (Coordinador Municipal, aprueba a los planteles).
   - `plant` (Director de Plantel).

4. **Flujo de Autenticación de Doble Vía (Tarjetas Digitales 2FA):**
   - **Los 1300 directores** se crearán mediante un script con clave genérica `123456`.
   - Al entrar con la clave genérica, el sistema los **bloquea** y los obliga a colocar: Nombres, Cédula, Teléfono y Nueva Clave.
   - El sistema genera una **Tarjeta Digital (Imagen PNG)** internamente en el navegador del usuario usando `HTML5 Canvas` (para evitar consumo de base de datos).
   - El usuario debe descargar esa imagen y enviarla por WhatsApp/Telegram a su supervisor inmediato (`munic`).
   - El supervisor entra a su Dashboard, cruza la imagen con los datos del sistema, y presiona **"Aprobar"**. Solo en ese momento el usuario adquiere permiso para llenar matrícula.

5. **El Paso 1 (Candado Dinámico):**
   - Una vez aprobados (y aceptada la Declaración Jurada), el usuario entra a la pantalla de Matrícula.
   - Esta pantalla lee el `bd_sgh.json` para saber qué `planes_estudio` tiene el plantel.
   - Muestra **únicamente** los bloques correspondientes (Inicial, Primaria, Media, etc.) idéntico al comportamiento de `sgh_gas`.

## Instrucciones para Retomar (Mañana)
El plan de implementación ha sido ajustado y la Declaración Jurada está clonada. Al reiniciar la sesión, el usuario solo debe decir:
> *"Hola, por favor lee los archivos `contexto_actual.md`, `task.md` e `implementation_plan.md` para ponerte en contexto. Estoy listo para aprobar el plan y comenzar."*
