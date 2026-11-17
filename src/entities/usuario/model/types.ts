export interface UsuarioPlataforma {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  rol: string | null;
  negocios: number;
  creado: string;
  activo: boolean;
  /** Si es empleado: el dueño del negocio para el que trabaja. */
  negocioDe?: { id: string; nombre: string } | null;
}

export interface ListadoUsuarios {
  items: UsuarioPlataforma[];
  total: number;
  pagina: number;
  tam: number;
}

/** Ver la nota de FILTROS_NEGOCIOS_POR_DEFECTO: sin anotar, para que el hook infiera. */
export const FILTROS_USUARIOS_POR_DEFECTO = {
  q: "",
  rol: "todos",
  pagina: 1,
  tam: 20,
};
