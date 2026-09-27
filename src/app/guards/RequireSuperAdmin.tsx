import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { ROL_PLATAFORMA, useAuth } from "@/app/providers/auth";

/**
 * Deja entrar solo al rol de plataforma.
 *
 * Verifica el ROL, no solo que haya sesión. Un comerciante con token válido no
 * pasa de acá.
 *
 * Importante para no confundirse: esto NO es una medida de seguridad. Cualquiera
 * puede editar `localStorage` desde la consola del navegador y saltárselo. Lo
 * que protege de verdad es `SuperAdminGuard` en el backend, que devuelve 403.
 * Este guard existe para que la aplicación no muestre pantallas rotas llenas de
 * errores a quien no corresponde.
 */
export function RequireSuperAdmin({ children }: PropsWithChildren) {
  const { usuario, cargando } = useAuth();
  const ubicacion = useLocation();

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!usuario || usuario.role?.name !== ROL_PLATAFORMA) {
    // `state` guarda a dónde quería ir, para volver ahí después del login en
    // vez de dejarlo siempre en la portada.
    return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />;
  }

  return <>{children}</>;
}
