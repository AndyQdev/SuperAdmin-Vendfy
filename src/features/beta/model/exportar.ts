/**
 * Exportar a CSV para los anexos de la tesis.
 *
 * Separado por punto y coma y con BOM: así Excel en español lo abre en
 * columnas y con los acentos bien, con doble clic, sin pasar por "Importar".
 */
export function aCsv(filas: Array<Record<string, unknown>>): string {
  if (filas.length === 0) return "﻿";
  // Todas las columnas de todas las filas: los días por módulo cambian de un negocio a otro.
  const columnas = [...new Set(filas.flatMap((f) => Object.keys(f)))];
  const celda = (v: unknown) => {
    if (v === null || v === undefined) return "";
    // Decimales con coma, como los espera Excel en español.
    const t = typeof v === "number" ? String(v).replace(".", ",") : String(v);
    return /[;"\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  return "﻿" + [columnas.join(";"), ...filas.map((f) => columnas.map((c) => celda(f[c])).join(";"))].join("\r\n");
}

export function descargar(nombre: string, contenido: string) {
  const url = URL.createObjectURL(new Blob([contenido], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * "Negocio A", "Negocio B"… en el orden en que entraron. Lo que va a la tesis
 * no lleva nombres: así se le prometió a cada comercio en el consentimiento.
 */
export function seudonimos(ids: string[]): Map<string, string> {
  const letra = (i: number): string => (i < 26 ? String.fromCharCode(65 + i) : letra(Math.floor(i / 26) - 1) + letra(i % 26));
  return new Map(ids.map((id, i) => [id, `Negocio ${letra(i)}`]));
}

/** "Beta cerrada (prueba)" → "beta-cerrada-prueba", para el nombre del archivo. */
export const archivo = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
