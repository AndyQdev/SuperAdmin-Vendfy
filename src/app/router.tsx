import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { RequireSuperAdmin } from "@/app/guards/RequireSuperAdmin";
import { GananciasPage } from "@/features/ganancias/ui/GananciasPage";
import { LoginPage } from "@/features/login/ui/LoginPage";
import { NegocioDetallePage } from "@/features/negocios/ui/NegocioDetallePage";
import { NegociosPage } from "@/features/negocios/ui/NegociosPage";
import { UsuariosPage } from "@/features/usuarios/ui/UsuariosPage";
import { WorkflowStudio } from "@/features/workflow-ia/ui/WorkflowStudio";
import { LayoutShell } from "@/widgets/layout/LayoutShell";

/**
 * Todo lo que no sea /login cuelga del guard. No hay ruta pública dentro del
 * panel: el valor por defecto es cerrado, así que una pantalla nueva nace
 * protegida sin que nadie tenga que acordarse.
 */
export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          element={
            <RequireSuperAdmin>
              <LayoutShell />
            </RequireSuperAdmin>
          }
        >
          <Route path="/negocios" element={<NegociosPage />} />
          <Route path="/negocios/:id" element={<NegocioDetallePage />} />
          <Route path="/ganancias" element={<GananciasPage />} />
          <Route path="/usuarios" element={<UsuariosPage />} />
          <Route path="/workflow-ia" element={<WorkflowStudio />} />
        </Route>

        <Route path="*" element={<Navigate to="/negocios" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
