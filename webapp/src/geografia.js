// Catálogo geográfico oficial del Estado Mérida (extraído de bd_sgh.json)
// Zero-Cost: Procesamiento 100% en cliente sin llamadas a Firestore

export const MUNICIPIOS_PARROQUIAS = {
  "ALBERTO ADRIANI": [
    "GABRIEL PICON GONZALEZ",
    "HECTOR AMABLE MORA",
    "JOSE NUCETE SARDI",
    "PRESIDENTE PAEZ",
    "PRESIDENTE ROMULO BETANCOURT",
    "PRESIDENTE ROMULO GALLEGOS",
    "PULIDO MENDEZ"
  ],
  "ANDRES BELLO": [
    "LA AZULITA"
  ],
  "ANTONIO PINTO SALINA": [
    "MESA BOLIVAR",
    "MESA DE LAS PALMAS",
    "SANTA CRUZ DE MORA"
  ],
  "ARICAGUA": [
    "ARICAGUA"
  ],
  "ARZOBISPO CHACON": [
    "CANAGUA",
    "CAPURI",
    "CHACANTA",
    "EL MOLINO",
    "GUAIMARAL",
    "MUCUCHACHI",
    "MUCUTUY"
  ],
  "CAMPO ELIAS": [
    "ACEQUIAS",
    "IGNACIO FERNANDEZ PEÑA",
    "JAJI",
    "LA MESA",
    "MATRIZ",
    "MONTALBAN",
    "SAN JOSE"
  ],
  "CARACCIOLO PARRA": [
    "FLORENCIO RAMIREZ",
    "TUCANI"
  ],
  "CARDENAL QUINTERO": [
    "LAS PIEDRAS",
    "SANTO DOMINGO"
  ],
  "GUARAQUE": [
    "GUARAQUE",
    "MESA QUINTERO",
    "RIO NEGRO"
  ],
  "JULIO CESAR": [
    "ARAPUEY",
    "PALMIRA"
  ],
  "JUSTO BRICEÑO": [
    "SAN CRISTOBAL",
    "TORONDOY"
  ],
  "LIBERTADOR": [
    "ANTONIO SPINETTI DINI",
    "ARIAS",
    "CARACCIOLO PARRA PEREZ",
    "DOMINGO PEÑA",
    "EL LLANO",
    "EL MORRO",
    "GONZALO PICÓN FEBRES",
    "JACINTO PLAZA",
    "JUAN RODRIGUEZ SUAREZ",
    "LASSO DE LA VEGA",
    "LOS NEVADOS",
    "MARIANO PICON SALAS",
    "MILLA",
    "OSUNA RODRIGUEZ",
    "SAGRARIO"
  ],
  "MIRANDA": [
    "ANDRES ELOY BLANCO",
    "LA VENTA",
    "PIÑANGO",
    "TIMOTES"
  ],
  "OBISPO RAMOS DE LORA": [
    "ELOY PAREDES",
    "SAN RAFAEL DE ALCAZAR",
    "SANTA ELENA DE ARENALES"
  ],
  "PADRE NOGUERA": [
    "SANTA MARIA DE CAPARO"
  ],
  "PUEBLO LLANO": [
    "PUEBLO LLANO"
  ],
  "RANGEL": [
    "CACUTE",
    "LA TOMA",
    "MUCUCHIES",
    "MUCURUBA",
    "SAN RAFAEL"
  ],
  "RIVAS DAVILA": [
    "BAILADORES",
    "GERÓNIMO MALDONADO"
  ],
  "SANTOS MARQUINA": [
    "TABAY"
  ],
  "SUCRE": [
    "CHIGUARA",
    "ESTANQUES",
    "LA TRAMPA",
    "LAGUNILLAS",
    "PUEBLO NUEVO",
    "SAN JUAN"
  ],
  "TOVAR": [
    "EL AMPARO",
    "EL LLANO",
    "SAN FRANCISCO",
    "TOVAR"
  ],
  "TULIO FEBRES": [
    "INDEPENDENCIA",
    "MARÍA CONCEPCION PALACIOS Y BLANCO",
    "NUEVA BOLIVIA",
    "SANTA APOLONIA"
  ],
  "ZEA": [
    "CAÑO TIGRE",
    "ZEA"
  ]
};

// Aliases y variantes habituales (con tildes o nombres extendidos)
const ALIASES_MUNICIPIOS = {
  "ANDRÉS BELLO": "ANDRES BELLO",
  "ANTONIO PINTO SALINAS": "ANTONIO PINTO SALINA",
  "ARZOBISPO CHACÓN": "ARZOBISPO CHACON",
  "CAMPO ELÍAS": "CAMPO ELIAS",
  "CARACCIOLO PARRA OLMEDO": "CARACCIOLO PARRA",
  "JULIO CÉSAR": "JULIO CESAR",
  "JULIO CÉSAR SALAS": "JULIO CESAR",
  "JULIO CESAR SALAS": "JULIO CESAR",
  "JUSTO BRICENO": "JUSTO BRICEÑO",
  "RIVAS DÁVILA": "RIVAS DAVILA",
  "TULIO FEBRES CORDERO": "TULIO FEBRES"
};

/**
 * Normaliza cualquier variante de nombre de municipio al canónico de la BD
 */
export function normalizarMunicipio(mun) {
  if (!mun || typeof mun !== 'string') return '';
  const clean = mun.trim().toUpperCase();
  if (MUNICIPIOS_PARROQUIAS[clean]) return clean;
  if (ALIASES_MUNICIPIOS[clean]) return ALIASES_MUNICIPIOS[clean];

  // Búsqueda sin acentos
  const sinAcentos = clean.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const k of Object.keys(MUNICIPIOS_PARROQUIAS)) {
    const kSin = k.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (kSin === sinAcentos) return k;
  }
  // Coincidencia parcial por prefijo (ej. "JULIO CÉSAR SALAS" -> "JULIO CESAR")
  for (const k of Object.keys(MUNICIPIOS_PARROQUIAS)) {
    if (clean.startsWith(k) || k.startsWith(clean)) return k;
  }

  return clean;
}

/**
 * Obtiene la lista ordenada de los 23 municipios
 */
export function getMunicipios() {
  return Object.keys(MUNICIPIOS_PARROQUIAS).sort((a, b) => a.localeCompare(b, 'es'));
}

/**
 * Obtiene las parroquias asociadas a un municipio
 */
export function getParroquias(municipio) {
  const norm = normalizarMunicipio(municipio);
  const parroquias = MUNICIPIOS_PARROQUIAS[norm];
  if (!parroquias || !Array.isArray(parroquias)) return [];
  return [...parroquias].sort((a, b) => a.localeCompare(b, 'es'));
}
