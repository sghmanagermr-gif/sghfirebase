# Diccionario de Datos y Estructura de Claves de Cloud Firestore
## Sistema de Gestión Humana (SGH Mérida)

Este documento define la estructura técnica oficial, exclusiva y real de las tres colecciones de Cloud Firestore en el proyecto `sgh-merida`:
1. `cargos_personal`
2. `planteles`
3. `usuarios`

> **Criterio Técnico Estricto:** Este diccionario describe única y exclusivamente los datos almacenados físicamente en la base de datos viva de Firestore. No hace referencia a archivos externos obsoletos.
> Para el desarrollo de nuevas versiones, módulos o migraciones, **solo se deben utilizar las Claves Canónicas Oficiales**. Las claves redundantes señaladas al final de cada sección representan campos duplicados almacenados en los documentos existentes que no deben ser perpetuados en el código nuevo.

---

## 1. Colección: `cargos_personal`

* **Descripción:** Registro individualizado de los cargos del personal adscrito a las instituciones educativas y dependencias del estado Mérida (Docentes, Administrativos y Obreros).
* **Identificador del Documento (Document ID):** Formato simétrico compuesto `{codigoDEA}_{cedula}` (ejemplo: `OD00021401_11223904`). En documentos antiguos que no han sido reeditados puede encontrarse únicamente el número de cédula (`11223904`).

### 1.1. Claves Canónicas Oficiales (Estándar de Producción)

#### Datos Personales e Identificación
| Clave Canónica | Tipo de Dato | Descripción y Valores Permitidos |
| :--- | :--- | :--- |
| `cedula` | String | Número de cédula de identidad sin puntos ni letras (ej: `"11223904"`). |
| `nombre-apellido` | String | Nombres y apellidos completos del funcionario en una sola cadena (ej: `"SARA ELENA LOPEZ DE FALCO"`). |
| `nombres` | String | Campo equivalente generado por el asistente de personal en ediciones recientes. |
| `nacionalidad` | String | `"V"` (Venezolano) o `"E"` (Extranjero). |
| `genero` | String | `"FEMENINO"` o `"MASCULINO"`. |
| `fecha-nacimiento` | String | Fecha de nacimiento en formato `"AAAA-MM-DD"`. |
| `edad` | Number | Edad en años enteros cumplidos (ej: `55`). |
| `estado-civil` | String | `"SOLTERO(A)"`, `"CASADO(A)"`, `"DIVORCIADO(A)"`, `"VIUDO(A)"`, `"CONCUBINATO"`. |
| `lugar-nacimiento` | String | Ciudad, parroquia o estado de nacimiento. |

#### Contacto y Habitación
| Clave Canónica | Tipo de Dato | Descripción y Valores Permitidos |
| :--- | :--- | :--- |
| `tel-celular` | String | Número de teléfono celular con código de área (ej: `"4127528466"`). |
| `tel-habitacion` | String | Número de teléfono residencial con código de área. |
| `tel-oficina` | String | Número telefónico del lugar de trabajo. |
| `correo` | String | Dirección de correo electrónico del funcionario. |
| `direccion` | String | Dirección de domicilio completa. |

#### Formación Académica
| Clave Canónica | Tipo de Dato | Descripción y Valores Permitidos |
| :--- | :--- | :--- |
| `instruccion` | String | Nivel educativo: `"PRIMARIA"`, `"BACHILLER"`, `"TSU"`, `"SUPERIOR"`, `"POSTGRADO"`, `"DOCTORADO"`. |
| `profesion` | String | Título o carrera universitaria obtenida. |

#### Ubicación Institucional
| Clave Canónica | Tipo de Dato | Descripción y Valores Permitidos |
| :--- | :--- | :--- |
| `codigo-plantel` | String | Código DEA oficial de la institución adscrita (ej: `"OD00021401"`). |
| `codigoDEA` | String | Clave idéntica a `codigo-plantel` mantenida por convención. |
| `plantel` | String | Nombre oficial del plantel educativo o sede física de trabajo. |
| `ubicacion-fisica` | String | Clave idéntica a `plantel`. |
| `municipio` | String | Municipio del estado Mérida (en mayúsculas sin tilde). |
| `parroquia` | String | Parroquia donde se localiza la institución. |
| `estado` | String | Entidad federal (`"MÉRIDA"`). |
| `ubicacion-administrativa` | String | Código numérico ministerial de nómina (ej: `"8253"`). |
| `oficina` | String | Nombre del departamento o división (para personal en Planta Central). |

#### Relación Laboral y Cargo
| Clave Canónica | Tipo de Dato | Descripción y Valores Permitidos |
| :--- | :--- | :--- |
| `tipo-personal` | String | Clasificación básica: `"DOCENTE"`, `"ADMINISTRATIVO"`, `"OBRERO"`. |
| `cargo` | String | Denominación del cargo oficial (ej: `"DOCENTE CONTRATADO"`, `"DOCENTE IV"`, `"PROFESIONAL UNIV. III"`, `"COCINERO II"`). |
| `codigo-rac` | String | Identificador numérico del clasificador de cargos (ej: `"1"`, `"310100"`). |
| `dependencia` | String | Ente que financia el cargo: `"NACIONAL"`, `"ESTADAL"`, `"MUNICIPAL"`, `"AUTONOMA"`, `"SUBVENCIONADA"`, `"PRIVADA"`. |
| `titular` | String | Condición de estabilidad: `"SI"` (Titular / Ordinario) o `"NO"` (Interino / Contratado). |
| `situacion-laboral` | String | Estado operativo: `"ACTIVO"`, `"REPOSO MEDICO"`, `"EN PROCESO DE JUBILACIÓN"`, `"APOYO INSTITUCIONAL"`, `"VACACIONES"`, `"SINCERACIÓN DE NÓMINA"`, `"LICENCIA SINDICAL"`, `"PERMISO POR CUIDO"`, `"ADECUACIÓN LABORAL"`, etc. |
| `descripcion-situacion` | String | Justificación textual o número de expediente de la condición. |
| `fecha-ingreso` | String | Fecha de inicio de labores en la administración pública (`"AAAA-MM-DD"`). |
| `antiguedad` | String / Number | Años de servicio cumplidos (ej: `"1"`, `17`). |
| `subcategoria` | String | Subcategoría de especialidad laboral. |
| `cargo-planta` | String | Cargo ejercido en sede central (si aplica). |
| `pertenece-estructura-municipal` | String | `"SI"` o `"NO"`. |
| `cargo-estructura-municipal` | String | Función desempeñada en el equipo del CDCE Municipal. |

#### Carga Horaria y Pedagógica (Docentes)
| Clave Canónica | Tipo de Dato | Descripción y Valores Permitidos |
| :--- | :--- | :--- |
| `horas-recibo` | String / Number | Total de horas pagadas según comprobante oficial (ej: `"40"`). |
| `horas-academicas` | String / Number | Horas presenciales impartidas en aula con estudiantes. |
| `horas-administrativas` | String / Number | Horas complementarias o de apoyo escolar. |
| `horas-por-programar` | String / Number | Horas pendientes por asignar. |
| `turnos-atiende` | String | `"MAÑANA"`, `"TARDE"`, `"DOBLE TURNO"`, `"INTEGRAL"`. |
| `atiende-matricula` | String | `"SI"` o `"NO"`. |
| `nivel-modalidad` | String | Nivel escolar atendido (`"INICIAL"`, `"PRIMARIA"`, `"MEDIA GENERAL"`, `"MEDIA TECNICA"`, etc.). |
| `especialidad-imparte` | String | Asignatura dictada (ej: `"EDUCACION FISICA"`, `"MATEMATICA"`, `"CASTELLANO"`). |

#### Bienestar Social, Dotación y Salud
| Clave Canónica | Tipo de Dato | Descripción y Valores Permitidos |
| :--- | :--- | :--- |
| `talla-camisa` | String | Medida de dotación: `"SS"`, `"S"`, `"M"`, `"L"`, `"XL"`, etc. |
| `talla-pantalon` | String | Medida de pantalón (ej: `"12"`, `"32"`, `"36"`). |
| `talla-zapato` | String | Medida de calzado (ej: `"37"`, `"39"`, `"42"`). |
| `tipo-vivienda` | String | `"CASA"`, `"APARTAMENTO"`, `"HABITACION"`, `"RANCHO"`. |
| `condicion-vivienda` | String | `"PROPIA"`, `"ALQUILADA"`, `"DE UN FAMILIAR"`, `"PRESTADA"`. |
| `tipo-material` | String | Material constructivo (`"BLOQUE"`, `"BAHAREQUE"`, `"TABLA"`, `"ZINC"`). |
| `actividad-deportiva` | String | Disciplina o `"NINGUNA"`. |
| `actividad-cultural` | String | Actividad cultural o `"NINGUNA"`. |
| `tipo-enfermedad` | String | Condición médica diagnosticada o `"NINGUNA"`. |
| `medicamento` | String | Tratamiento continuo o `"NINGUNO"`. |
| `discapacidad` | String | `"SI"` o `"NO"`. |

#### Organización Comunal y Control
| Clave Canónica | Tipo de Dato | Descripción y Valores Permitidos |
| :--- | :--- | :--- |
| `ubch` | String | Nombre de la UBCH de su comunidad. |
| `circuito-comunal` | String | Nombre del circuito comunal correspondiente. |
| `centro-votacion` | String | Nombre del centro electoral asignado en CNE. |
| `ultima_actualizacion` | String | Marca de tiempo ISO 8601 de la última edición. |
| `simetria_homologada` | Boolean | `true` si el registro cuenta con el ID compuesto `{DEA}_{Cédula}`. |
| `observaciones` | String | Anotaciones de auditoría o seguimiento del trabajador. |

### 1.2. Claves Redundantes Existentes en Firestore (A Descartar en Nuevas Versiones)
Los siguientes campos existen actualmente dentro de los documentos de Firestore como duplicados directos de las claves canónicas. **No deben ser creados ni actualizados en versiones futuras**:
* `CEDULA` (Duplicado de `cedula`).
* `NOMBRE` y `apellidos-nombres` (Duplicados de `nombre-apellido`).
* `CARGO` (Duplicado de `cargo`).
* `DEPENDENCIA` (Duplicado de `dependencia`).
* `MUNICIPIO` (Duplicado de `municipio`).
* `PARROQUIA` (Duplicado de `parroquia`).
* `CODIGO DEL PLANTEL` y `codigoPlantel` (Duplicados de `codigo-plantel`).
* `UBICACIÓN FÍSICA` (Duplicado de `ubicacion-fisica` / `plantel`).
* `TIPO PERSONAL` y `tipoPersonal` (Duplicados de `tipo-personal`).
* `SITUACIÓN DEL TRABAJADOR` (Duplicado de `situacion-laboral`).
* `CODIGO RAC` y `codigo-cargo` (Duplicados de `codigo-rac`).
* `TITULAR` (Duplicado de `titular`).
* `GENERO` (Duplicado de `genero`).
* `FECHA DE NACIMIENTO` (Duplicado de `fecha-nacimiento`).
* `DIRECCION` (Duplicado de `direccion`).
* `UBICACIÓN ADMINISTRATIVA` (Duplicado de `ubicacion-administrativa`).

---

## 2. Colección: `planteles`

* **Descripción:** Inventario maestro de los 1.185 planteles educativos, divisiones administrativas y despachos centrales del estado Mérida.
* **Identificador del Documento (Document ID):** Código DEA oficial de la institución en mayúsculas (ej: `"OD00021401"`, `"OD01021410"`, `"001200330"`).

### 2.1. Claves Canónicas Oficiales (Estándar de Producción)

| Clave Canónica | Tipo de Dato | Descripción y Valores Permitidos |
| :--- | :--- | :--- |
| `id` | String | Código DEA del plantel, idéntico al ID del documento. |
| `codigos` | Object | Mapa que contiene: `plantel` (Código DEA), `estadistico` (Código estadístico ministerial) y `dependencia` (Código numérico patronal o `null`). |
| `nombre-plantel` | Object | Mapa con los nombres del plantel: `nominal` (nombre formal MPPE), `eponimo` (nombre tradicional) y `nuevo-eponimo` (nombre homologado oficial). |
| `denominacion` | String | Tipo de institución: `"CENTRO DE EDUCACION INICIAL"`, `"ESCUELA BASICA"`, `"LICEO"`, `"ESCUELA TECNICA"`, `"SEDE ADMINISTRATIVA"`, etc. |
| `den_abr` | String | Abreviatura oficial (ej: `"LIC."`, `"E.B."`, `"C.E.I."`). |
| `municipio` | String | Municipio del estado Mérida en mayúsculas (ej: `"ALBERTO ADRIANI"`). Presente en 1.184 de 1.185 planteles. |
| `parroquia` | String | Parroquia donde se asienta la institución. |
| `estado` | String | Entidad federal (`"MÉRIDA"`). |
| `dependencia` | String | Fuente de financiamiento: `"NACIONAL"`, `"ESTADAL"`, `"MUNICIPAL"`, `"AUTONOMA"`, `"SUBVENCIONADA"`, `"PRIVADA"`. |
| `ubicacion-geografica` | String | Tipología territorial: `"URBANO"`, `"RURAL"`, `"INDIGENA"`, `"FRONTERIZO"`. |
| `nivel` | String | Nivel escolar atendido (`"INICIAL"`, `"PRIMARIA"`, `"MEDIA GENERAL"`, `"MEDIA TECNICA"`, etc.). |
| `modalidad` | String | Modalidad pedagógica de la institución. |
| `turno-plantel` | String | Horario escolar: `"MAÑANA"`, `"TARDE"`, `"DOBLE TURNO"`, `"INTEGRAL"`, `"NOCTURNO"`. |
| `planes-estudio` | Object | Objeto con los planes de estudio aprobados por el MPPE (claves `"31059"`, `"31060"`, etc.), conteniendo mención y especialidad. |
| `secciones-planes` | Object | Cantidad de secciones abiertas por cada plan y grado. |
| `datos_completados` | Boolean | `true` si la institución ya completó el registro de su matrícula y personal. |
| `matricula-total` | Number / String | Total de estudiantes matriculados en la institución (ej: `577`). |
| `matricula` | Object | Desglose estudiantil: `total-gen` (total alumnos), `total-gen-mas` (varones), `total-gen-fem` (hembras), `total-vac-gen` (vacantes), desglose por grados y niveles. |
| `personal_resumen` | Array | Lista compacta del personal adscrito (con `cedula`, `nombre`, `cargo`, `tipo_personal`, `cod_rac`, `oficina`). Permite mostrar la nómina del plantel con 0 lecturas adicionales a `cargos_personal`. |
| `total_personal` | Number | Número total de trabajadores adscritos. |
| `es_sede_administrativa` | Boolean | `true` exclusivamente para los 9 despachos centrales del CDCE Mérida en Libertador. |
| `es_planta` | Boolean | Indicador equivalente de sede administrativa central. |
| `es_demo` | Boolean | `true` para instituciones de prueba (deben ser excluidas de consolidados oficiales). |
| `modificado_por` | String | Correo del último usuario que guardó cambios en el plantel. |
| `fecha_modificacion_datos`| String | Timestamp ISO 8601 de la última edición de datos institucionales. |
| `ultima_actualizacion` | String | Timestamp ISO 8601 del último cambio registrado. |
| `observaciones` | String | Notas de control y supervisión del plantel. |

### 2.2. Claves Redundantes Residuales en `planteles`
Campos aislados encontrados en un número marginal de planteles (menos del 1% del total) resultantes de cargas previas:
* `MUNICIPIO` y `PARROQUIA` (presentes solo en 9 planteles; usar `municipio` y `parroquia`).
* `codigoDEA`, `codigo-plantel`, `codigoPlantel` (presentes solo en una minoría; usar `id` o `codigos.plantel`).
* `nombre_plantel` y `nuevo_eponimo` (usar `nombre-plantel.nominal` y `nombre-plantel.nuevo-eponimo`).

---

## 3. Colección: `usuarios`

* **Descripción:** Gestión de credenciales de acceso, niveles jerárquicos territoriales y control de acceso basado en roles (RBAC) de 4 niveles.
* **Identificador del Documento (Document ID):** UID de autenticación asignado por Firebase Auth (ej: `"r8J2kLm9Pq..."`).

### 3.1. Claves Canónicas Oficiales (Estándar de Producción)

| Clave Canónica | Tipo de Dato | Descripción y Valores Permitidos |
| :--- | :--- | :--- |
| `uid` | String | Identificador único de usuario generado por Firebase Auth (coincide con el ID del documento). |
| `email` | String | Correo electrónico registrado para el inicio de sesión. |
| `nombre` | String | Nombre y apellido del usuario o funcionario titular de la cuenta. |
| `cedula` | String | Número de cédula de identidad del titular (sin puntos). |
| `telefono` | String | Número telefónico de contacto del titular. |
| `rol` | String | Rol institucional en el sistema: |
| | | • `"superadmin"`: Administrador Supremo (acceso total a funciones de mantenimiento, corte y configuración). |
| | | • `"zonadmin"`: Coordinador Zonal / Nivel Estadal (auditoría de los 23 municipios, consolidados y descargas). |
| | | • `"plantadmin"`: Jefe de División / Planta Central (gestión de las dependencias centrales de la Zona Educativa). |
| | | • `"munadmin"`: Coordinador Municipal (gestión y validación de planteles de su municipio específico). |
| | | • `"plaadmin"`: Director de Plantel (carga de personal y matrícula de su código DEA institucional). |
| `jerarquia` | Object | Delimitación institucional del usuario: |
| | | • `estado`: `"MERIDA"`. |
| | | • `municipio`: Municipio asignado (`munadmin`, `plaadmin` y `plantadmin`). |
| | | • `plantel_codigo`: Código DEA asignado al director (`plaadmin`) o código de dependencia (`plantadmin`). |
| | | • `plantel_nombre`: Nombre institucional asignado (`plantadmin`). |
| | | • `parroquia`: Parroquia de la sede institucional (`plantadmin`). |
| `estado_aprobacion` | String | Estado de la cuenta: |
| | | • `"PENDIENTE"`: En espera de validación por su coordinador municipal o superior. Sin acceso operativo. |
| | | • `"APROBADO"`: Cuenta activa con acceso inmediato a los módulos de su rol. |
| | | • `"RECHAZADO"`: Cuenta inhabilitada o bloqueada por duplicidad o titularidad no autorizada. |
| `permisos` | Object | Competencias modulares otorgadas (utilizado para coordinadores zonales `zonadmin`): |
| | | • `validacion`: Boolean (gestión de usuarios). |
| | | • `planteles`: Boolean (edición de inventario de escuelas). |
| | | • `planes`: Boolean (planes de estudio). |
| | | • `estadisticas`: Boolean (tableros y pizarras analíticas). |
| | | • `mantenimiento`: Boolean (herramientas de base de datos). |
| | | • `auditoria`: Boolean (escáner de alertas rojas). |
| | | • `descargas`: Boolean (exportación de nóminas a hojas de cálculo). |
| `creado_el` | String | Marca de tiempo ISO 8601 del registro de la cuenta en el sistema. |
| `doc_original_id` | String | ID previo en caso de que la cuenta haya sido auto-revinculada desde un registro legado. |
| `revinculado_el` | String | Timestamp ISO 8601 de la revinculación con Firebase Auth. |
