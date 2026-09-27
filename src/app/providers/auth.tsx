import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { apiFetch, ApiError } from "@/shared/api/client";

/** Nombre exacto del rol en el backend (`ROLE.SUPER_ADMIN`). */
export const ROL_PLATAFORMA = "Super Administrador";

export interface Usuario {
  id: string;
  name: string;
  email: string;
  role?: { id: string; name: string };
}

interface RespuestaLogin {
  accessToken: string;
  User: Usuario;
}

interface AuthCtx {
  usuario: Usuario | null;
  cargando: boolean;
  entrar: (email: string, password: string) => Promise<void>;
  salir: () => void;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

const CLAVE_TOKEN = "vendfyAdminToken";
const CLAVE_USUARIO = "vendfyAdminUser";

/**
 * Sesión del panel de plataforma.
 *
 * Usa claves de almacenamiento propias (`vendfyAdmin*`) y no las del panel de
 * comercios. No es paranoia: los dos proyectos corren en `localhost` durante el
 * desarrollo, que para el navegador es el MISMO origen. Con las claves
 * compartidas, entrar acá cerraría la sesión del otro y viceversa, y terminarías
 * depurando un bug que no existe.
 *
 * El rechazo por rol también se hace acá, no solo en el guard de ruta: si un
 * comerciante entra con sus credenciales, es mejor decirle "esta cuenta no tiene
 * acceso" en el login que dejarlo pasar a una pantalla que va a devolver 403 en
 * cada consulta. El backend igual lo rechaza —esto es comodidad, no seguridad—.
 */
export function AuthProvider({ children }: PropsWithChildren) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(CLAVE_TOKEN);
    const guardado = localStorage.getItem(CLAVE_USUARIO);
    if (token && guardado) {
      try {
        setUsuario(JSON.parse(guardado));
      } catch {
        localStorage.removeItem(CLAVE_TOKEN);
        localStorage.removeItem(CLAVE_USUARIO);
      }
    }
    setCargando(false);
  }, []);

  async function entrar(email: string, password: string) {
    const respuesta = await apiFetch<RespuestaLogin>("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });

    const datos = respuesta.data;
    if (!datos?.accessToken) {
      throw new ApiError("La respuesta del servidor no trae sesión", 500);
    }

    if (datos.User.role?.name !== ROL_PLATAFORMA) {
      throw new ApiError(
        "Esta cuenta no tiene acceso al panel de plataforma",
        403,
      );
    }

    localStorage.setItem(CLAVE_TOKEN, datos.accessToken);
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(datos.User));
    setUsuario(datos.User);
  }

  function salir() {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
    setUsuario(null);
  }

  return (
    <Ctx.Provider value={{ usuario, cargando, entrar, salir }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth se usa dentro de AuthProvider");
  return ctx;
}
