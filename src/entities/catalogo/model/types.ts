/** Un producto del catálogo de referencia (una fila por código de barras). */
export interface ProductoCatalogo {
  /** Puesto en el ranking de popularidad: 1 = el más escaneado. */
  ranking: number;
  gtin: string;
  nombre: string;
  marca: string | null;
  cantidad_texto: string | null;
  contenido: number | null;
  unidad: "g" | "ml" | null;
  categoria: string | null;
  /** Países donde alguien lo vio a la venta (no dónde se fabrica). */
  paises: string[];
  /** País GS1 según el prefijo del código. */
  pais: string | null;
  imagen_url: string | null;
  imagen_chica_url: string | null;
  popularidad: number;
  fuente_principal: string;
  n_fuentes: number;
  completitud: number | null;
  estado: EstadoCatalogo;
  actualizado: number | null;
  prefijo: string | null;
}

export type EstadoCatalogo = "importado" | "aportado" | "verificado" | "en_disputa";

export interface ListadoCatalogo {
  items: ProductoCatalogo[];
  siguiente: string | null;
  total: { n: number; exacto: boolean };
}

/** Lo que dijo UNA fuente sobre un código. */
export interface FuenteProducto {
  gtin: string;
  fuente: string;
  nombre: string | null;
  marca: string | null;
  cantidad: string | null;
  categoria: string | null;
  imagen_url: string | null;
  url_ficha: string | null;
  licencia: string | null;
  popularidad: number | null;
  /** Texto plano en las fuentes abiertas; listas y pares en la ficha de la IA. */
  datos: Record<string, string | string[] | Record<string, string>>;
  modificado: number | null;
}

export interface DetalleCatalogo {
  producto: ProductoCatalogo;
  fuentes: FuenteProducto[];
  /** Campos en los que las fuentes no coinciden. */
  discrepancias: string[];
}

export interface ResumenFuente {
  id: string;
  nombre: string;
  descargado: boolean;
  bytes: number;
  lastModified?: string;
  aviso?: string;
  leidas: number;
  validas: number;
  sinNombre: number;
  repetidasEnLaFuente: number;
  descartes: Record<string, number>;
  principalDe: number;
}

export interface ResumenArmado {
  estado: "ok" | "con_avisos" | "error";
  construidoEn: string;
  duracionSeg: number;
  fuentesIds: string[];
  total: number;
  conImagen: number;
  enDisputa: number;
  cambios: {
    nuevos: number;
    actualizados: number;
    eliminados: number;
    sinCambios: number;
    hayAnterior: boolean;
  };
  fuentes: ResumenFuente[];
  bytes: number;
}

export interface EstadisticasCatalogo {
  resumen: ResumenArmado | null;
  archivo: { ruta: string; bytes: number; modificado: string };
  porPais: Array<{ prefijo: string; pais: string | null; n: number }>;
  porEstado: Array<{ estado: EstadoCatalogo; n: number }>;
}

/** Una corrida del trabajo diario, registrada en Postgres. */
export interface ConstruccionCatalogo {
  id: string;
  iniciado_en: string;
  terminado_en: string | null;
  estado: "ok" | "con_avisos" | "error";
  total: number | null;
  con_imagen: number | null;
  nuevos: number | null;
  actualizados: number | null;
  eliminados: number | null;
  bytes: string | null;
  fuentes: ResumenFuente[];
  error: string | null;
  commit_sha: string | null;
  ejecucion_url: string | null;
}

export interface ConstruccionesCatalogo {
  items: ConstruccionCatalogo[];
  alerta: string | null;
  horasDesdeBuena: number | null;
}

/** Nombres legibles de las fuentes. */
export const NOMBRE_FUENTE: Record<string, string> = {
  off: "Open Food Facts",
  obf: "Open Beauty Facts",
  opf: "Open Products Facts",
  opff: "Open Pet Food Facts",
  icecat: "Open Icecat",
  nudger: "Nudger",
  upcitemdb: "UPCitemdb",
  aporte: "Aporte de comercios",
  ia: "Mejorado con IA",
};

/** Por qué se descartó un código al importar, dicho para una persona. */
export const MOTIVO_DESCARTE: Record<string, string> = {
  vacio: "Sin código",
  longitud: "Largo inválido",
  verificador: "Dígito verificador incorrecto",
  uso_interno: "Uso interno de tienda (balanza, etiqueta propia)",
  cupon: "Cupón o recibo",
  publicacion: "Revista (ISSN)",
};

/** Ver la nota de FILTROS_NEGOCIOS_POR_DEFECTO: sin anotar, para que el hook infiera. */
export const FILTROS_CATALOGO_POR_DEFECTO = {
  q: "",
  fuente: "todas",
  prefijo: "todos",
  conImagen: "todas",
  estado: "todos",
  orden: "popularidad",
  vista: "productos",
  codigo: "",
};
