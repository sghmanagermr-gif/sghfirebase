# ¿Qué ocurre al guardar en el sistema? (Guía Simplificada)

A continuación se explica paso a paso y en palabras sencillas qué hace el sistema cuando el usuario presiona los botones de guardar, tanto para los datos de la escuela como para los datos del trabajador (cuadratura).

---

## 1. Cuando se hace clic en "Guardar Datos y Continuar" (Plantel)

Cuando haces clic en el botón para guardar los datos del plantel y la matrícula general, ocurre lo siguiente de forma totalmente automática:

### A. El sistema busca el archivo de tu escuela
Primero, el sistema verifica quién eres y busca en su archivo central cuál es la Hoja de Cálculo exacta que le corresponde a tu plantel. 

### B. Actualiza la hoja principal ("PLANTEL")
Una vez que abre (invisiblemente) la hoja de tu escuela, busca una pestaña llamada **"PLANTEL"**. Allí, en una sola línea larga (la fila 2), guarda de golpe toda la información:
* **Datos básicos:** Estado, municipio, nombre de la escuela, dependencias, si es inicial, primaria, liceo, etc.
* **La Matrícula General:** Cuántas hembras, varones y totales hay separados por niveles (preescolar, primaria, especial, etc.), y cuántas secciones hay en total.

### C. Prepara las hojas de los Liceos (Media / Técnica)
Si resulta que la escuela da clases de liceo o escuelas técnicas (planes de estudio como *31059*, *41048*, etc.), el sistema hace un trabajo extra muy inteligente:
* Busca las pestañas específicas de esos planes de estudio dentro del mismo archivo.
* Les estampa el nombre de tu escuela y la cantidad de secciones que hay por cada año (1er año, 2do año, etc.).
* **Lo más importante:** El sistema consulta su "libro central" (catálogo) para saber cuáles son las materias oficiales y cuántas horas lleva cada materia para ese plan de estudio específico, y se encarga de escribirlas en la parte superior de la hoja. Así, todo queda formateado y listo sin que nadie tenga que escribir las materias a mano.

> **Resumen:** El sistema toma todos los totales de alumnos que escribiste, rellena la ficha principal de la escuela y deja las hojas de los liceos completamente pre-configuradas con sus materias oficiales para recibir después a los profesores.

---

## 2. Cuando se hace clic en "Confirmar" en la Cuadratura (Personal)

Cuando estás registrando a un trabajador, abres la ventana de Cuadratura, llenas los números y le das al botón de "Confirmar", sucede esto:

### A. El sistema recolecta lo que el usuario escribió
El sistema "lee" todos los recuadros donde el usuario anotó números (ya sean cantidades de alumnos u horas de clases). 

### B. Los agrupa y organiza según el nivel
El sistema ordena esos números dependiendo de en qué nivel da clases el trabajador:
* **Si es Inicial (Maternal/Preescolar):** Agrupa cuántos niños hay por cada letra de sección (Ejemplo: *Maternal Sección A = 10 niños*).
* **Si es Primaria:** Une el grado y la sección y anota el total (Ejemplo: *1er Grado A = 25 niños*).
* **Si es Media (Liceo):** Agrupa cuántas horas da el profesor según el año y la materia (Ejemplo: *1er Año Castellano = 4 horas*).

### C. Les añade la "Observación" y empaqueta todo
Si el usuario escribió algo en el cuadro de "Observaciones" (ejemplo: *"El docente está de reposo"*), el sistema toma ese texto y lo mete dentro de los grupitos de números que armó en el paso anterior. 
Luego, para que la información viaje rápido y sin errores por internet, el sistema "empaqueta" todo ese grupito en una sola línea de texto.

### D. Muestra un resumen en la pantalla y guarda los datos temporalmente
El sistema suma todos los números que encontró para mostrarle un mensaje amigable al usuario en el formulario principal (ejemplo: *"Primaria: 40 alumnos en 2 secciones"*). 
Luego de mostrar ese texto, cierra la ventana de Cuadratura, pero **guarda el paquete de datos escondido en la memoria del navegador**.

### E. El viaje final hacia la base de datos
Todo ese paquete de datos organizado se queda esperando en la computadora del usuario. No es sino hasta que la persona hace clic en el botón azul grande de **"Guardar Registro"** (o "Actualizar") al final del formulario principal, que el sistema toma todos los datos personales del trabajador y le "pega" ese paquete de la cuadratura para enviarlo todo junto a la Hoja de Cálculo central.

> **Resumen:** La computadora del usuario hace todo el trabajo pesado de organizar y sumar la carga de horas/alumnos del trabajador, y la base de datos de Google Sheets solo se encarga de recibir la información lista y ordenarla en las columnas.
