# Tareas de Implementación: Fase 3 (SGH v2.0.0)

- `[/]` **Sprint 1: Control de Versión y Declaración Jurada**
  - `[x]` Actualizar versión a `v2.0.0` en `package.json` e `index.html` (Regla #10).
  - `[x]` Diseñar e integrar el Modal de Declaración Jurada (UI/CSS).
  - `[x]` Conectar lógica en `main.js`: Interceptar el login exitoso, mostrar modal y exigir aceptación.
- `[ ]` **Sprint 2: El Candado Dinámico (Paso 1)**
  - `[ ]` Reestructurar HTML del `lock-screen` para incluir todos los bloques (Inicial, Primaria, Media, Técnica).
  - `[ ]` Implementar lógica de lectura de `planes_estudio` desde `bd_sgh.json` para mostrar/ocultar bloques.
  - `[ ]` Programar cálculos automáticos (sumatorias) para los campos de matrícula.
  - `[ ]` Implementar Modal de Registro de Vacantes.
  - `[ ]` Validar y guardar la estructura de datos compleja en la colección `planteles` de Firestore.
- `[ ]` **Sprint 3: Formulario de Personal (Dashboard)**
  - `[ ]` Diseñar UI de los 4 Tabs (Personales, Contacto, Institucionales, Adicionales).
  - `[ ]` Cargar catálogos dinámicos (Cargos, Títulos) en los selectores.
  - `[ ]` Programar reglas de negocio: Cálculo de edad (mínimo 18) y tiempo de servicio.
  - `[ ]` Conectar CRUD contra la colección `cargos_personal` en Firestore.
