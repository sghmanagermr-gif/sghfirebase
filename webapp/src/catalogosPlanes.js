/**
 * Catálogo Maestro de Planes de Estudio (SGH - CDCE Mérida)
 */
export const CATALOGO_PLANES_ESTUDIO = {
  "20000": { codigo: 20000, nivel: "INICIAL", nombre: "EDUCACIÓN INICIAL", especialidad: null, mencion: null },
  "21000": { codigo: 21000, nivel: "PRIMARIA", nombre: "EDUCACIÓN PRIMARIA", especialidad: null, mencion: null },
  "31059": { codigo: 31059, nivel: "MEDIA GENERAL", nombre: "CIENCIAS", especialidad: "MEDIA GENERAL", mencion: "CIENCIAS" },
  "31060": { codigo: 31060, nivel: "MEDIA GENERAL", nombre: "CIENCIAS Y TECNOLOGÍA", especialidad: "MEDIA GENERAL", mencion: "CIENCIAS Y TECNOLOGIA" },
  "41048": { codigo: 41048, nivel: "MEDIA TECNICA", especialidad: "AGROPECUARIA", mencion: "ECOTURISMO" },
  "41049": { codigo: 41049, nivel: "MEDIA TECNICA", especialidad: "AGROPECUARIA", mencion: "CIENCIAS AGRÍCOLAS Y PECUARIAS" },
  "41052": { codigo: 41052, nivel: "MEDIA TECNICA", especialidad: "AGROPECUARIA", mencion: "TECNOLOGÍA DE LOS ALIMENTOS" },
  "41056": { codigo: 41056, nivel: "MEDIA TECNICA", especialidad: "AGROPECUARIA", mencion: "CIENCIAS AGRÍCOLAS, OPCIÓN CACAO" },
  "42000": { codigo: 42000, nivel: "MEDIA TECNICA", especialidad: "HIDROCARBUROS", mencion: "PETRÓLEO Y GAS NATURAL" },
  "43291": { codigo: 43291, nivel: "MEDIA TECNICA", especialidad: "INDUSTRIAL", mencion: "ELECTRÓNICA" },
  "43292": { codigo: 43292, nivel: "MEDIA TECNICA", especialidad: "INDUSTRIAL", mencion: "CONSTRUCCIÓN CIVIL" },
  "43293": { codigo: 43293, nivel: "MEDIA TECNICA", especialidad: "INDUSTRIAL", mencion: "MECÁNICA TÉRMICA" },
  "43294": { codigo: 43294, nivel: "MEDIA TECNICA", especialidad: "INDUSTRIAL", mencion: "MECATRÓNICA" },
  "43295": { codigo: 43295, nivel: "MEDIA TECNICA", especialidad: "INDUSTRIAL", mencion: "METALMECÁNICA" },
  "43298": { codigo: 43298, nivel: "MEDIA TECNICA", especialidad: "INDUSTRIAL", mencion: "TELEMÁTICA" },
  "44001": { codigo: 44001, nivel: "MEDIA TECNICA", especialidad: "TRANSPORTE MULTIMODAL", mencion: "TRANSPORTE TERRESTRE" },
  "44004": { codigo: 44004, nivel: "MEDIA TECNICA", especialidad: "TRANSPORTE MULTIMODAL", mencion: "AERONÁUTICAS, OPCIÓN SERVICIOS AÉREOS" },
  "45041": { codigo: 45041, nivel: "MEDIA TECNICA", especialidad: "SALUD", mencion: "ENFERMERÍA" },
  "45043": { codigo: 45043, nivel: "MEDIA TECNICA", especialidad: "SALUD", mencion: "FARMACIA" },
  "45045": { codigo: 45045, nivel: "MEDIA TECNICA", especialidad: "SALUD", mencion: "LABORATORIO CLÍNICO" },
  "45049": { codigo: 45049, nivel: "MEDIA TECNICA", especialidad: "SALUD", mencion: "REGISTRO Y ESTADÍSTICA DE SALUD" },
  "46067": { codigo: 46067, nivel: "MEDIA TECNICA", especialidad: "ECONOMÍA SOCIAL", mencion: "ADMINISTRACIÓN" },
  "46068": { codigo: 46068, nivel: "MEDIA TECNICA", especialidad: "ECONOMÍA SOCIAL", mencion: "ADUANA" },
  "46069": { codigo: 46069, nivel: "MEDIA TECNICA", especialidad: "ECONOMÍA SOCIAL", mencion: "ECONOMÍA DIGITAL" },
  "46070": { codigo: 46070, nivel: "MEDIA TECNICA", especialidad: "ECONOMÍA SOCIAL", mencion: "CONTABILIDAD" },
  "46071": { codigo: 46071, nivel: "MEDIA TECNICA", especialidad: "ECONOMÍA SOCIAL", mencion: "TURISMO" },
  "48069": { codigo: 48069, nivel: "MEDIA TECNICA", especialidad: "ARTE", mencion: "ARTES AUDIOVISUALES" },
  "49000": { codigo: 49000, nivel: "MEDIA TECNICA", especialidad: "EDUCACIÓN FÍSICA", mencion: "PROMOCIÓN DEL ENTRENAMIENTO DEPORTIVO" },
  "49001": { codigo: 49001, nivel: "MEDIA TECNICA", especialidad: "EDUCACIÓN FÍSICA", mencion: "PROMOCIÓN DE LA ACTIVIDAD FÍSICA Y RECREACIÓN" }
};

export function obtenerCatalogoPlanesCompleto() {
  let planes = { ...CATALOGO_PLANES_ESTUDIO };
  try {
    const raw = localStorage.getItem('sgh_catalogos');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.planes_estudio && Object.keys(parsed.planes_estudio).length > 0) {
        planes = { ...planes, ...parsed.planes_estudio };
      }
    }
  } catch(e) {}
  return planes;
}

