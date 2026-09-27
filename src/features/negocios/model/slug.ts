/**
 * Convierte un nombre en un slug razonable.
 *
 * Es una sugerencia, no una imposición: el campo queda editable. Se ofrece
 * porque el slug es la dirección pública de la tienda y escribirlo a mano
 * termina en mayúsculas, acentos o espacios que el backend rechaza.
 *
 * Vive en `model/` y no dentro del componente para poder probarlo sin navegador
 * ni Vite: en cuanto un archivo importa `import.meta.env`, deja de correr en un
 * test de lógica.
 */
export function sugerirSlug(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // saca los acentos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}
