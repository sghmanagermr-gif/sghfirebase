const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType
} = require('docx');

// Definición de Estilos y Colores Institucionales
const COLOR_PRIMARY = "1E3A8A";    // Azul Marino Institucional
const COLOR_SECONDARY = "0284C7";  // Azul Cielo / Acento
const COLOR_DARK = "1F2937";       // Gris Oscuro para Texto
const COLOR_LIGHT_BG = "F3F4F6";   // Gris Claro para Fondos
const COLOR_HIGHLIGHT = "FEF3C7";  // Amarillo Suave para Avisos/Destacados
const COLOR_BORDER = "D1D5DB";     // Gris Borde

function createHeading1(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 180 },
    run: {
      color: COLOR_PRIMARY,
      bold: true,
      size: 28, // 14pt
      font: "Calibri"
    }
  });
}

function createHeading2(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    run: {
      color: COLOR_SECONDARY,
      bold: true,
      size: 24, // 12pt
      font: "Calibri"
    }
  });
}

function createParagraph(text, bold = false, italic = false) {
  return new Paragraph({
    spacing: { before: 80, after: 120, line: 276 },
    children: [
      new TextRun({
        text: text,
        bold: bold,
        italics: italic,
        color: COLOR_DARK,
        size: 22, // 11pt
        font: "Calibri"
      })
    ]
  });
}

function createBullet(title, text) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 60, after: 80, line: 260 },
    children: [
      new TextRun({
        text: title + " ",
        bold: true,
        color: COLOR_PRIMARY,
        size: 22,
        font: "Calibri"
      }),
      new TextRun({
        text: text,
        color: COLOR_DARK,
        size: 22,
        font: "Calibri"
      })
    ]
  });
}

function createBox(title, description, isAlert = false) {
  const bg = isAlert ? "FEF3C7" : "EFF6FF";
  const borderColor = isAlert ? "D97706" : "3B82F6";
  const titleColor = isAlert ? "92400E" : "1E40AF";

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: bg, type: ShadingType.CLEAR },
            margins: { top: 140, bottom: 140, left: 200, right: 200 },
            borders: {
              left: { style: BorderStyle.SINGLE, size: 24, color: borderColor },
              top: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE }
            },
            children: [
              new Paragraph({
                spacing: { before: 40, after: 60 },
                children: [
                  new TextRun({
                    text: title,
                    bold: true,
                    color: titleColor,
                    size: 22,
                    font: "Calibri"
                  })
                ]
              }),
              new Paragraph({
                spacing: { before: 0, after: 40, line: 260 },
                children: [
                  new TextRun({
                    text: description,
                    color: COLOR_DARK,
                    size: 21,
                    font: "Calibri"
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}

const doc = new Document({
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: 1440,    // 1 pulgada
            bottom: 1440,
            left: 1440,
            right: 1440
          }
        }
      },
      children: [
        // Encabezado Principal
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 60 },
          children: [
            new TextRun({
              text: "REPÚBLICA BOLIVARIANA DE VENEZUELA",
              bold: true,
              size: 20,
              color: "4B5563",
              font: "Calibri"
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 60 },
          children: [
            new TextRun({
              text: "GOBERNACIÓN DEL ESTADO BOLIVARIANO DE MÉRIDA",
              bold: true,
              size: 20,
              color: "4B5563",
              font: "Calibri"
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 180 },
          children: [
            new TextRun({
              text: "SISTEMA DE GESTIÓN HUMANA (SGH — MÉRIDA 2.0)",
              bold: true,
              size: 22,
              color: COLOR_PRIMARY,
              font: "Calibri"
            })
          ]
        }),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 180, after: 120 },
          children: [
            new TextRun({
              text: "INFORME DE VIABILIDAD TÉCNICO-ADMINISTRATIVO",
              bold: true,
              size: 32, // 16pt
              color: COLOR_PRIMARY,
              font: "Calibri"
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 300 },
          children: [
            new TextRun({
              text: "Módulo de Cuadratura: Cálculo de Necesidades y Excedentes de Personal en Básica y Media\n(Nivel Plantel, Nivel Municipio y Nivel Estado)",
              italics: true,
              size: 24, // 12pt
              color: "4B5563",
              font: "Calibri"
            })
          ]
        }),

        // Cuadro de Resumen Ejecutivo
        createBox(
          "DICTAMEN EJECUTIVO PARA LA ALTA DIRECCIÓN",
          "VIABILIDAD TOTAL (100% FACTIBLE Y OPERATIVO). El sistema cuenta con toda la base de datos necesaria para realizar el balance exacto entre el personal en nómina y la matrícula estudiantil. Esta herramienta permite determinar con precisión si en una escuela, en un liceo, en un municipio o en todo el estado Mérida faltan docentes, obreros o administrativos (déficit) o si sobran (excedente), aplicando estrictamente la normativa educativa nacional.",
          false
        ),

        new Paragraph({ spacing: { before: 200, after: 100 } }),

        // Sección 1: Subsistema de Básica
        createHeading1("1. Subsistema de Educación Básica: Inicial y Primaria"),
        createParagraph(
          "En Educación Básica, el cálculo del personal requerido se sustenta en la tradicional 'Fórmula 20/30' establecida en las normas de organización escolar del Ministerio del Poder Popular para la Educación, complementada con las realidades operativas de aula."
        ),

        createHeading2("Aclaratoria Institucional: ¿Qué significa exactamente la Fórmula 20/30?"),
        createParagraph(
          "Para evitar confusiones con símbolos matemáticos o fórmulas abstractas, el principio se desglosa en dos reglas administrativas directas:"
        ),

        createBullet(
          "El Factor '20' (Para Docentes de Aula):",
          "Representa que por cada 20 estudiantes inscritos debe existir la atención de un docente de aula."
        ),
        createBullet(
          "El Factor '30' (Para Administrativos y Obreros):",
          "Representa que por cada 30 estudiantes que tenga la institución educativa se justifica normativamente un cargo de apoyo (personal administrativo u obrero)."
        ),

        new Paragraph({ spacing: { before: 100, after: 100 } }),

        createBox(
          "CÓMO CALCULA EL SISTEMA EN EDUCACIÓN INICIAL (MATERNAL Y PREESCOLAR)",
          "Explicación en palabras sencillas: Por tratarse de la primera infancia, la norma exige atención dual: se requieren DOS (2) docentes por cada grupo de 20 niños (una maestra titular y una maestra auxiliar o de acompañamiento).\n\nEjemplo práctico: Si un centro de educación inicial tiene 40 niños inscritos, se forman 2 grupos de 20. Al multiplicar esos 2 grupos por 2 maestras que requiere cada uno, el sistema determina que la escuela necesita exactamente 4 docentes en total. Si en nómina solo hay 3 maestras registradas, el sistema alerta un DÉFICIT de 1 docente; si hay 5 maestras, alerta un EXCEDENTE de 1 docente disponible.",
          false
        ),

        new Paragraph({ spacing: { before: 100, after: 100 } }),

        createBox(
          "CÓMO CALCULA EL SISTEMA EN EDUCACIÓN PRIMARIA (1° A 6° GRADO)",
          "Explicación en palabras sencillas: En primaria, la atención es regular de un (1) maestro por cada 20 estudiantes.\n\nEjemplo práctico: Si una escuela tiene 100 estudiantes en primaria, al dividir 100 entre 20, el sistema determina que se requieren 5 maestros de aula (uno por cada sección). Si la escuela cuenta con 5 maestros activos atendiendo matrícula, hay Cuadratura Perfecta. Si solo tiene 4 maestros, el sistema reporta que falta 1 maestro y las vacantes declaradas señalan exactamente cuál grado está desatendido.",
          false
        ),

        new Paragraph({ spacing: { before: 100, after: 100 } }),

        createBox(
          "CASO ESPECIAL: ESCUELAS RURALES Y CASERÍOS REMOTOS (SECCIÓN ÚNICA / MULTIGRADO)",
          "Explicación en palabras sencillas: En poblaciones pequeñas o zonas rurales apartadas donde la matrícula total de toda la escuela es muy reducida (por ejemplo, 15 a 25 niños sumando desde primer grado hasta sexto grado), no se exige la presencia de seis maestros separados.\n\nEn este escenario, el sistema aplica la modalidad de 'Sección Única Multigrado', reconociendo que un solo docente atiende de forma integrada a ese grupo de estudiantes, evitando generar falsos déficits de personal.",
          false
        ),

        new Paragraph({ spacing: { before: 100, after: 100 } }),

        createBox(
          "AUDITORÍA DE PERSONAL ADMINISTRATIVO Y OBRERO EN BÁSICA (EL FACTOR 30)",
          "Explicación en palabras sencillas: Al ingresar la matrícula total de la escuela, el sistema la divide entre 30 para conocer la cantidad de personal de apoyo que debería tener la institución.\n\nEjemplo práctico: Una escuela con 120 estudiantes debería contar normativamente con 4 trabajadores de apoyo (120 dividido entre 30 = 4 cargos, distribuidos entre secretaría, aseo y mantenimiento). Si en esa escuela figuran 8 obreros registrados, el sistema detecta de inmediato un EXCEDENTE de 4 trabajadores, permitiendo a la Coordinación Municipal reubicarlos en escuelas que carezcan de personal de limpieza.",
          true
        ),

        // Sección 2: Subsistema de Media
        createHeading1("2. Subsistema de Educación Media: Media General y Media Técnica"),
        createParagraph(
          "En los liceos y escuelas técnicas operan dos dimensiones de cálculo claramente diferenciadas: para los DOCENTES se calcula por Horas Académicas de clase, y para los ADMINISTRATIVOS Y OBREROS se aplica también la norma universal de 30 estudiantes por cargo."
        ),

        createHeading2("Aclaratoria Institucional: El Recibo de Pago como Ancla Presupuestaria del Docente"),
        createParagraph(
          "Cuando se registra un profesor en el sistema, se capturan dos datos fundamentales tomados directamente de su recibo de nómina oficial:"
        ),
        createBullet(
          "Horas Académicas Reconocidas (id='wp-horas-academicas'):",
          "Es el número exacto de horas semanales que el Ministerio o la Gobernación le paga al docente en su recibo (por ejemplo: 20, 36, 40 o 53 horas)."
        ),
        createBullet(
          "Nivel o Modalidad que Atiende:",
          "Se define si el profesor ejerce en Media General (Planes 31059 / 31060), en Media Técnica (Planes 41048, 42000, 43291, etc., amparados en la Gaceta Oficial 42.739) o en modalidad mixta."
        ),

        new Paragraph({ spacing: { before: 100, after: 100 } }),

        createBox(
          "CÓMO FUNCIONA EL CÁLCULO DE CUADRATURA DOCENTE EN EL LICEO (SECCIONES × MALLA CURRICULAR)",
          "Paso 1 (La Necesidad del Liceo): Cada plan de estudio oficial establece cuántas horas de clase tiene cada materia a la semana. Por ejemplo, en 1er año la materia Matemática tiene 4 horas semanales. Si el liceo tiene 3 secciones de 1er año (A, B y C), el liceo necesita obligatoriamente 12 horas semanales de clase de Matemática (4 horas multiplicadas por 3 secciones = 12 horas).\n\nPaso 2 (Lo que dan los Profesores): El sistema suma cuántas horas de clase de Matemática están impartiendo en la realidad los profesores de esa materia en el liceo.\n\nPaso 3 (La Balanza de Horas):\n• Si el liceo necesita 48 horas de Matemática en total y los profesores activos solo cubren 32 horas, el sistema reporta un DÉFICIT de 16 horas (faltan horas por asignar a un docente).\n• Si un profesor cobra 36 horas semanales en su recibo pero solo tiene 24 horas de clase frente a los alumnos, el sistema reporta 12 HORAS POR REPROGRAMAR. Esto evita las llamadas 'horas fantasma' y garantiza que cada hora pagada por el Estado se traduzca en enseñanza efectiva.",
          false
        ),

        new Paragraph({ spacing: { before: 100, after: 100 } }),

        createBox(
          "AUDITORÍA DE PERSONAL ADMINISTRATIVO Y OBRERO EN LICEOS (LA REGLA DEL 30 EN MEDIA)",
          "Aclaratoria Institucional de Alta Relevancia: En los liceos (Media General y Media Técnica) TAMBIÉN APLICA LA REGLA DE 30 ESTUDIANTES POR ADMINISTRATIVO U OBRERO.\n\nExplicación en palabras sencillas: La norma ministerial de dotación de personal de soporte no distingue nivel: tanto en la escuela básica como en el liceo, por cada 30 estudiantes inscritos corresponde justificar un cargo de apoyo.\n\nEjemplo práctico en un Liceo: Si un liceo cuenta con una matrícula total de 600 estudiantes, al dividir 600 entre 30, el sistema determina que el plantel requiere 20 cargos de apoyo en total (distribuidos entre personal de secretaría, control de estudios, biblioteca, portería y mantenimiento). Si en el liceo figuran 28 trabajadores entre administrativos y obreros, el sistema alerta un EXCEDENTE de 8 trabajadores, permitiendo a la autoridad educativa transferirlos a liceos o escuelas vecinas que carezcan de personal de oficina o de limpieza.",
          true
        ),

        // Sección 3: Impacto en los Tres Niveles
        createHeading1("3. La Consolidación en los Tres Niveles: Plantel, Municipio y Estado"),
        createParagraph(
          "El mayor beneficio para los directores, coordinadores municipales y la Dirección de Educación es que la información se consolida en cascada en tres niveles:"
        ),

        // Tabla Resumen
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  shading: { fill: COLOR_PRIMARY, type: ShadingType.CLEAR },
                  margins: { top: 120, bottom: 120, left: 140, right: 140 },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: "Nivel Administrativo", bold: true, color: "FFFFFF", size: 20, font: "Calibri" })
                      ]
                    })
                  ]
                }),
                new TableCell({
                  shading: { fill: COLOR_PRIMARY, type: ShadingType.CLEAR },
                  margins: { top: 120, bottom: 120, left: 140, right: 140 },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: "En Educación Básica (Inicial y Primaria)", bold: true, color: "FFFFFF", size: 20, font: "Calibri" })
                      ]
                    })
                  ]
                }),
                new TableCell({
                  shading: { fill: COLOR_PRIMARY, type: ShadingType.CLEAR },
                  margins: { top: 120, bottom: 120, left: 140, right: 140 },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: "En Educación Media (General y Técnica)", bold: true, color: "FFFFFF", size: 20, font: "Calibri" })
                      ]
                    })
                  ]
                })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({
                  margins: { top: 100, bottom: 100, left: 120, right: 120 },
                  borders: {
                    bottom: { style: BorderStyle.SINGLE, size: 8, color: COLOR_BORDER },
                    right: { style: BorderStyle.SINGLE, size: 8, color: COLOR_BORDER }
                  },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: "1. EL PLANTEL\n(La Escuela o Liceo)", bold: true, color: COLOR_PRIMARY, size: 19, font: "Calibri" })
                      ]
                    })
                  ]
                }),
                new TableCell({
                  margins: { top: 100, bottom: 100, left: 120, right: 120 },
                  borders: {
                    bottom: { style: BorderStyle.SINGLE, size: 8, color: COLOR_BORDER },
                    right: { style: BorderStyle.SINGLE, size: 8, color: COLOR_BORDER }
                  },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: "• Secciones cubiertas vs. aulas vacantes.\n• Docentes faltantes o sobrantes.\n• Auditoría de obreros y secretarias según el factor 30.", size: 18, font: "Calibri" })
                      ]
                    })
                  ]
                }),
                new TableCell({
                  margins: { top: 100, bottom: 100, left: 120, right: 120 },
                  borders: {
                    bottom: { style: BorderStyle.SINGLE, size: 8, color: COLOR_BORDER }
                  },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: "• Horas de clase cubiertas vs. horas huérfanas por materia.\n• Profesores con horas pagadas sin carga de clase (horas por reprogramar).\n• Auditoría de obreros y administrativos del liceo según el factor 30.", size: 18, font: "Calibri" })
                      ]
                    })
                  ]
                })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({
                  shading: { fill: COLOR_LIGHT_BG, type: ShadingType.CLEAR },
                  margins: { top: 100, bottom: 100, left: 120, right: 120 },
                  borders: {
                    bottom: { style: BorderStyle.SINGLE, size: 8, color: COLOR_BORDER },
                    right: { style: BorderStyle.SINGLE, size: 8, color: COLOR_BORDER }
                  },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: "2. EL MUNICIPIO\n(Coordinación Municipal)", bold: true, color: COLOR_PRIMARY, size: 19, font: "Calibri" })
                      ]
                    })
                  ]
                }),
                new TableCell({
                  shading: { fill: COLOR_LIGHT_BG, type: ShadingType.CLEAR },
                  margins: { top: 100, bottom: 100, left: 120, right: 120 },
                  borders: {
                    bottom: { style: BorderStyle.SINGLE, size: 8, color: COLOR_BORDER },
                    right: { style: BorderStyle.SINGLE, size: 8, color: COLOR_BORDER }
                  },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: "• Permite reubicar personal sin gastar dinero nuevo: Si en la escuela 'A' sobran maestros u obreros y en la escuela 'B' faltan, se realiza el traslado interno en el mismo municipio.", size: 18, font: "Calibri" })
                      ]
                    })
                  ]
                }),
                new TableCell({
                  shading: { fill: COLOR_LIGHT_BG, type: ShadingType.CLEAR },
                  margins: { top: 100, bottom: 100, left: 120, right: 120 },
                  borders: {
                    bottom: { style: BorderStyle.SINGLE, size: 8, color: COLOR_BORDER }
                  },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: "• Mapa municipal de materias críticas: Muestra el déficit total de horas en asignaturas como Física, Química o Inglés en todos los liceos.\n• Redistribución de obreros y administrativos entre liceos.", size: 18, font: "Calibri" })
                      ]
                    })
                  ]
                })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({
                  margins: { top: 100, bottom: 100, left: 120, right: 120 },
                  borders: {
                    bottom: { style: BorderStyle.SINGLE, size: 8, color: COLOR_BORDER },
                    right: { style: BorderStyle.SINGLE, size: 8, color: COLOR_BORDER }
                  },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: "3. EL ESTADO\n(Zona Educativa / Dirección General)", bold: true, color: COLOR_PRIMARY, size: 19, font: "Calibri" })
                      ]
                    })
                  ]
                }),
                new TableCell({
                  margins: { top: 100, bottom: 100, left: 120, right: 120 },
                  borders: {
                    bottom: { style: BorderStyle.SINGLE, size: 8, color: COLOR_BORDER },
                    right: { style: BorderStyle.SINGLE, size: 8, color: COLOR_BORDER }
                  },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: "• Radiografía consolidada de los 23 municipios de Mérida.\n• Total de aulas sin maestro para la solicitud formal de cargos al Ministerio.\n• Balance global de obreros y secretarias de Básica.", size: 18, font: "Calibri" })
                      ]
                    })
                  ]
                }),
                new TableCell({
                  margins: { top: 100, bottom: 100, left: 120, right: 120 },
                  borders: {
                    bottom: { style: BorderStyle.SINGLE, size: 8, color: COLOR_BORDER }
                  },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: "• Control financiero y de auditoría: Detección global de horas presupuestadas en nómina que no están justificadas en los horarios de clase del estado.\n• Balance global de personal administrativo y obrero de Media.", size: 18, font: "Calibri" })
                      ]
                    })
                  ]
                })
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { before: 200, after: 100 } }),

        // Sección 4: Viabilidad de Costo Cero
        createHeading1("4. Viabilidad Tecnológica: Costo Cero (Zero-Cost) y Máxima Velocidad"),
        createParagraph(
          "Desde la perspectiva técnica y presupuestaria del sistema informático:"
        ),
        createBullet(
          "Cero Gasto de Servidores:",
          "El sistema está construido bajo la arquitectura gratuita de Google Firebase (Plan Spark). No genera facturación mensual ni requiere compras de licencias costosas."
        ),
        createBullet(
          "Consultas Instantáneas:",
          "En lugar de calcular escuela por escuela cada vez que un jefe abre el sistema, la aplicación guarda resúmenes consolidados por municipio y estado. Esto hace que un informe de los 23 municipios cargue en menos de un segundo sin colapsar la base de datos."
        ),

        new Paragraph({ spacing: { before: 200, after: 100 } }),

        // Conclusión Final
        createBox(
          "CONCLUSIÓN FINAL",
          "El proyecto de Cuadratura en el Sistema de Gestión Humana (SGH Mérida 2.0) es 100% VIABLE, SEGURO Y NECESARIO. Proporciona a las autoridades educativas una herramienta transparente, basada en datos reales de nómina y matrícula, eliminando las suposiciones y permitiendo una administración impecable del talento humano tanto en docentes como en administrativos y obreros de Básica y Media.",
          false
        ),

        new Paragraph({ spacing: { before: 300, after: 0 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "Documento emitido por el Equipo de Arquitectura de Sistemas — SGH Mérida 2.0\nFecha de Emisión: Septiembre 2026",
              italics: true,
              size: 18,
              color: "6B7280",
              font: "Calibri"
            })
          ]
        })
      ]
    }
  ]
});

// Guardar archivo
const outputPath = path.join("c:", "Proyectos", "sgh-mr - firebase", "INFORME_VIABILIDAD_CUADRATURA_SGH.docx");

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outputPath, buffer);
  console.log("Documento DOCX regenerado con éxito en:", outputPath);
  console.log("Tamaño del archivo:", buffer.length, "bytes");
}).catch((err) => {
  console.error("Error al generar el documento DOCX:", err);
  process.exit(1);
});
