import { NavLink, Outlet } from "react-router-dom";
import { Building2, GitBranch, LineChart, LogOut, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useAuth } from "@/app/providers/auth";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";

interface Seccion {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Todavía no construida: se muestra apagada en vez de esconderse. */
  pendiente?: boolean;
}

/**
 * Las secciones pendientes se muestran deshabilitadas y no se ocultan: quien
 * abre el panel ve hacia dónde va, y no hay que tocar el menú en cada fase.
 */
const SECCIONES: Seccion[] = [
  { to: "/negocios", label: "Negocios", icon: Building2 },
  { to: "/ganancias", label: "Ganancias", icon: LineChart, pendiente: true },
  { to: "/usuarios", label: "Usuarios", icon: Users, pendiente: true },
  { to: "/workflow-ia", label: "Workflow IA", icon: GitBranch, pendiente: true },
];

export function LayoutShell() {
  const { usuario, salir } = useAuth();

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-background md:flex">
        <div className="flex h-16 items-center gap-2 border-b px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            V
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Vendfy</p>
            <p className="text-[11px] text-muted-foreground">Plataforma</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {SECCIONES.map(({ to, label, icon: Icon, pendiente }) =>
            pendiente ? (
              <span
                key={to}
                aria-disabled="true"
                className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground/50"
              >
                <Icon className="h-4 w-4" />
                {label}
                <span className="ml-auto text-[10px] uppercase tracking-wide">
                  pronto
                </span>
              </span>
            ) : (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ),
          )}
        </nav>

        <div className="border-t p-3">
          <p className="truncate px-2 text-xs font-medium">{usuario?.name}</p>
          <p className="truncate px-2 text-[11px] text-muted-foreground">
            {usuario?.email}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={salir}
            className="mt-2 w-full justify-start gap-2 text-muted-foreground"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
