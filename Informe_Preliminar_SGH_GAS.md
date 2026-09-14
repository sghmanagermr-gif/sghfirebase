<!-- INFORME PARA GOOGLE DOCS — Copiar y pegar directamente -->
<!-- Fuente recomendada: Google Docs > Opciones de párrafo > Aplicar estilos de encabezado -->

# INFORME PRELIMINAR
## Sistema de Gestión Humana (SGH — GAS)
### División de Gestión Interna · Zona Educativa Mérida

---

**Para:** Jefa de División de Gestión Interna
**De:** Equipo de Desarrollo y Gestión Tecnológica
**Fecha:** Julio de 2026
**Versión del Sistema:** 1.0.0
**Carácter:** Preliminar — Uso Interno Restringido

---

## 1. RESUMEN EJECUTIVO

### ¿Qué es el Sistema de Gestión Humana (SGH)?

El **Sistema de Gestión Humana (SGH)** es una plataforma de gestión administrativa desarrollada íntegramente sobre la infraestructura institucional de Google Workspace, diseñada específicamente para cubrir las necesidades operativas de la División de Gestión Interna de la Zona Educativa del Estado Mérida.

En términos sencillos, el SGH es un **formulario inteligente y centralizado** que reemplaza el trabajo manual disperso entre correos electrónicos, planillas físicas y hojas de cálculo desconectadas. El sistema permite:

- **Registrar, consultar y actualizar** los expedientes del personal docente, administrativo y obrero de los planteles adscritos a la División.
- **Gestionar los datos administrativos de cada plantel** (matrícula, vacantes, planes de estudio, turnos) desde una interfaz única y segura.
- **Generar un historial automático** de cada modificación realizada al expediente de cualquier funcionario o plantel, sin intervención humana adicional.

### El Problema que Resuelve

Actualmente, la División enfrenta al menos tres brechas operativas críticas:

1. **Fragmentación de la información:** Los datos del personal y los planteles se encuentran dispersos en hojas de cálculo independientes, sin una fuente única de verdad. Esto genera versiones contradictorias de un mismo registro.
2. **Ausencia de trazabilidad:** No existe un mecanismo formal que documente *quién* realizó *qué cambio* y *cuándo* en un expediente. Ante una auditoría o un conflicto laboral, esta carencia constituye una vulnerabilidad institucional y jurídica.
3. **Dependencia del esfuerzo manual:** La actualización de datos requiere comunicación por correo, llamadas telefónicas y transcripción manual, lo que eleva el margen de error y el tiempo de respuesta.

El SGH resuelve estas tres brechas de forma integral, actuando como la **carpeta central digital de la División**, disponible en computadoras de escritorio y dispositivos móviles.

---

## 2. GARANTÍAS DE SEGURIDAD JURÍDICA Y CONFIDENCIALIDAD

*(Sección dirigida al equipo jurídico y a las autoridades de la División)*

### 2.1. Protección de Datos y Restricción de Acceso

El Sistema de Gestión Humana opera bajo un principio de **separación estricta entre el acceso del usuario y la información confidencial**. Este principio funciona de la siguiente manera:

**Cómo accede un usuario al sistema:**

Cuando un responsable de plantel o un funcionario de la División ingresa al SGH con su código y contraseña, el sistema **nunca entrega directamente** las credenciales ni los datos del Directorio al dispositivo del usuario. En su lugar, ocurre lo siguiente:

1. El usuario envía su código y contraseña al sistema.
2. El sistema realiza la verificación **internamente**, en sus propios servidores institucionales (alojados en la infraestructura de Google), sin que la información sensible transite hacia la pantalla.
3. Si las credenciales son correctas, el sistema concede el acceso y entrega únicamente los datos que ese usuario tiene autorización de ver: su plantel asignado, su perfil y los registros correspondientes.
4. Si las credenciales son incorrectas, el acceso es denegado y el intento queda registrado automáticamente en el historial de auditoría (ver sección 2.2).

**Enrutamiento dinámico por plantel:** Cada usuario tiene acceso exclusivamente a la información de su plantel asignado. El sistema determina esta asignación internamente: **un responsable del Plantel A no puede, bajo ninguna circunstancia técnica, visualizar ni modificar los datos del Plantel B**, incluso si intentara hacerlo deliberadamente. Esta restricción no depende de la buena fe del usuario, sino que está impuesta por la arquitectura misma del sistema.

**Resumen de las garantías:**

| Garantía | Descripción |
|:---|:---|
| Verificación interna de identidad | Las contraseñas nunca son visibles desde el exterior del sistema |
| Aislamiento por plantel | Cada usuario solo accede a los datos de su institución asignada |
| Notificación de errores sin exposición | Si el sistema falla, el usuario recibe un mensaje amigable; nunca información técnica confidencial |
| Control de estado del usuario | El sistema verifica que el usuario esté en condición **ACTIVO**; si ha sido dado de baja, el acceso es denegado automáticamente |

---

### 2.2. Transparencia y Rendición de Cuentas: La Huella de Auditoría

El SGH incorpora un mecanismo denominado **"Huella de Auditoría"** (también llamado *Historial de Trazabilidad*). Esta es una de las funciones más relevantes desde el punto de vista jurídico y administrativo.

**¿Qué es la Huella de Auditoría?**

Es un **registro permanente, automático e inalterable** que el sistema genera por sí solo cada vez que se realiza una acción significativa. Funciona de manera análoga al libro de actas de una unidad administrativa: cada modificación queda asentada con todos los datos requeridos para su identificación.

**¿Qué información queda registrada automáticamente?**

Por cada acción realizada en el sistema, la Huella de Auditoría documenta los siguientes cinco campos:

| Campo | Descripción | Ejemplo |
|:---|:---|:---|
| **Fecha y hora exacta** | Momento preciso del evento, con hora y minutos | `2026-07-11 09:15:32` |
| **Usuario responsable** | Código del funcionario o plantel que realizó la acción | `T0715D1406` |
| **Tipo de acción** | Descripción estandarizada del evento ocurrido | `INGRESO_REGISTRO`, `ELIMINACIÓN`, `CAMBIO_CONTRASEÑA` |
| **Registro afectado** | Identificador del dato o expediente involucrado | Cédula del trabajador, código del plantel |
| **Resultado** | Estado final de la operación | `COMPLETADO`, `DENEGADO`, `FALLO` |

**Eventos que quedan registrados:**

- Inicio de sesión exitoso o fallido
- Registro de nuevo personal en un plantel
- Eliminación de un expediente de personal
- Actualización de datos del plantel
- Cambio de contraseña de acceso
- Intentos de acceso con usuario no reconocido

**Valor jurídico de la Huella de Auditoría:**

Este registro proporciona a la institución una base documental sólida para:

- **Responder ante auditorías internas o externas** de la ONAPRE, la Contraloría Estadal o cualquier ente fiscalizador, demostrando quién autorizó cada cambio y en qué momento.
- **Resolver disputas sobre expedientes:** Si un funcionario reclama que su dato fue modificado sin su conocimiento, el historial permite determinar con precisión la fecha, la hora y el responsable del cambio.
- **Establecer responsabilidades administrativas** cuando se detecten modificaciones no autorizadas o inconsistencias en los registros de personal.

> **Nota para el equipo jurídico:** El registro de auditoría se almacena en una pestaña exclusiva e independiente del Directorio Maestro de la Zona Educativa, denominada *Histórico de Auditoría*. Su contenido es acumulativo, no se sobrescribe, y puede ser exportado para su incorporación como medio probatorio en cualquier procedimiento administrativo.

---

## 3. EFICIENCIA OPERATIVA Y OPTIMIZACIÓN DEL TRABAJO

*(Sección dirigida a docentes, administradores y coordinadores de plantel)*

### 3.1. Velocidad y Confiabilidad: Por qué el sistema no se congela

Una de las preocupaciones más frecuentes en el uso de herramientas digitales en entornos con conectividad variable es la **lentitud o el congelamiento de la pantalla** al procesar grandes volúmenes de información.

El SGH fue diseñado con una estrategia específica para evitar este problema, denominada **procesamiento en memoria antes de guardar**.

**¿Cómo funciona en la práctica?**

Cuando un responsable de plantel actualiza los datos de su institución (matrícula, personal, vacantes), el sistema **no guarda cada campo por separado**. En su lugar:

1. **Recopila toda la información** ingresada en el formulario de una sola vez.
2. **La organiza internamente** en el orden exacto que requiere el registro oficial.
3. **La envía a la hoja de cálculo del plantel en una única operación consolidada**, como si entregara un sobre ya cerrado y completo, en lugar de entregar hoja por hoja.

Este mecanismo tiene tres beneficios directos para el usuario:

- **Elimina las pantallas congeladas:** Al reducir el número de operaciones individuales, el sistema completa la tarea en segundos en lugar de minutos.
- **Previene la pérdida parcial de registros:** Si se guardara campo por campo y ocurriera un corte de conexión a mitad del proceso, el registro quedaría incompleto e inconsistente. Con el procesamiento en bloque, o se guarda todo, o el sistema detecta el fallo y notifica al usuario para que vuelva a intentarlo, sin dejar datos a medias.
- **Protege la estabilidad del sistema ante múltiples usuarios simultáneos:** Si varios planteles actualizan su información al mismo tiempo, el sistema gestiona cada solicitud de forma ordenada, evitando conflictos entre registros.

**En resumen:** El sistema está diseñado para que guardar la información de un plantel completo tome aproximadamente el mismo tiempo que enviar un correo electrónico.

---

### 3.2. Orden Institucional: Aislamiento de la información por plantel

La División gestiona la información de **múltiples planteles** distribuidos en los **23 municipios del Estado Mérida**. Uno de los riesgos inherentes a cualquier sistema de gestión centralizada es el "traspapeleo digital": que la información de un plantel se mezcle, sobrescriba o confunda con la de otro.

El SGH resuelve este riesgo mediante una arquitectura de **separación absoluta por institución**.

**¿Cómo está organizada la información?**

El sistema distingue dos niveles de almacenamiento con roles completamente diferentes:

**Nivel 1 — El Directorio Maestro de la Zona Educativa:**
Es el registro central que la División mantiene. Contiene el listado de todos los planteles autorizados, con sus credenciales de acceso y los datos de ubicación institucional. Este nivel es de **acceso exclusivo de la División** y actúa como la "lista oficial de plantel" que determina quién puede entrar al sistema y a qué información.

**Nivel 2 — El Expediente Individual de cada Plantel:**
Cada institución tiene su propio espacio de trabajo aislado dentro del sistema. Allí se registran:

- Los datos administrativos del plantel (matrícula, vacantes, turnos, planes de estudio, nombre del director/a)
- Los expedientes del personal adscrito a esa institución (docentes, administrativos, obreros)

La separación garantiza que:

- ✅ **El responsable del Plantel A accede únicamente al expediente del Plantel A.** No puede ver, buscar ni modificar datos de ningún otro plantel.
- ✅ **La División puede ver el consolidado de todos los planteles** desde el Directorio Maestro, donde los datos se muestran agrupados automáticamente por municipio.
- ✅ **Si se agrega un nuevo plantel al sistema**, su información queda inmediatamente aislada en su propio espacio, sin interferir con los expedientes preexistentes.

**Vista consolidada para la División:**

Adicionalmente, el Directorio Maestro de la División dispone de una **vista de resumen unificada** que agrega automáticamente los datos de los 23 municipios. Esto permite a la jefatura de la División consultar estadísticas globales de personal y matrícula **sin necesidad de abrir 23 documentos separados**, en una sola pantalla de lectura que se actualiza de forma automática.

---

## 4. CONCLUSIÓN Y PRÓXIMOS PASOS

### Viabilidad Técnica y Operativa

El **Sistema de Gestión Humana (SGH)** se encuentra en una fase de desarrollo avanzada, con su arquitectura central operativa y validada. Los módulos de autenticación segura, registro de personal, gestión de datos de plantel y trazabilidad histórica están implementados y funcionando dentro del entorno institucional de Google Workspace.

El sistema ha demostrado ser técnicamente viable para soportar las operaciones diarias de la División de Gestión Interna en los siguientes aspectos:

- ✅ **Capacidad multiplantel:** Diseñado para gestionar simultáneamente los 23 municipios del estado Mérida.
- ✅ **Compatibilidad institucional:** Opera sobre la infraestructura de Google que la institución ya utiliza, sin requerir servidores propios ni licencias adicionales.
- ✅ **Acceso multiplataforma:** Funciona tanto en computadoras de escritorio como en teléfonos móviles, sin necesidad de instalar ninguna aplicación.
- ✅ **Cero costo de implementación de infraestructura:** El sistema se despliega dentro de las herramientas de Google Workspace ya disponibles para la institución.

### Actividades en Curso y Próximos Pasos

| Etapa | Descripción | Estado |
|:---|:---|:---|
| **Fase 1 — Arquitectura base** | Módulos de autenticación, registro y auditoría | ✅ Completada |
| **Fase 2 — Corrección de observaciones técnicas** | Ajustes de robustez identificados en revisión interna | 🔄 En progreso |
| **Fase 3 — Validación con datos reales** | Prueba piloto con un grupo de planteles seleccionados | 📋 Pendiente de autorización |
| **Fase 4 — Capacitación del personal** | Formación de los responsables de plantel en el uso del sistema | 📋 Pendiente |
| **Fase 5 — Despliegue oficial** | Habilitación progresiva para todos los planteles de Mérida | 📋 Pendiente |

### Solicitud a la Jefatura

Se solicita respetuosamente a la ciudadana Jefa de División de Gestión Interna:

1. **Tomar conocimiento** del presente informe y sus alcances.
2. **Designar un grupo de planteles piloto** para la fase de validación con datos reales (se recomienda 3 a 5 instituciones de diferentes municipios).
3. **Autorizar la fase de capacitación** para los coordinadores municipales que fungirán como responsables del sistema en cada dependencia.

---

*Informe elaborado por el Equipo de Desarrollo del SGH — División de Gestión Interna — Zona Educativa Mérida.*
*Versión preliminar. Sujeto a revisión y aprobación de la autoridad competente.*

---
