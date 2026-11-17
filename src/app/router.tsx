import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { RequireSuperAdmin } from "@/app/guards/RequireSuperAdmin";
import { CohortePage } from "@/features/beta/ui/CohortePage";
import { CohortesPage } from "@/features/beta/ui/CohortesPage";
import { ComparacionPage } from "@/features/beta/ui/ComparacionPage";
import { InformePage } from "@/features/beta/ui/InformePage";
import { ReportesPage } from "@/features/beta/ui/ReportesPage";
import { CatalogoPage } from "@/features/catalogo/ui/CatalogoPage";
import { GananciasPage } from "@/features/ganancias/ui/GananciasPage";
import { LoginPage } from "@/features/login/ui/LoginPage";
import { NegocioDetallePage } from "@/features/negocios/ui/NegocioDetallePage";
import { NegociosPage } from "@/features/negocios/ui/NegociosPage";
import { PlanesPage } from "@/features/planes/ui/PlanesPage";
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
          <Route path="/planes" element={<PlanesPage />} />
          <Route path="/usuarios" element={<UsuariosPage />} />
          <Route path="/workflow-ia" element={<WorkflowStudio />} />
          <Route path="/catalogo" element={<CatalogoPage />} />
          <Route path="/beta" element={<CohortesPage />} />
          <Route path="/beta/comparar" element={<ComparacionPage />} />
          <Route path="/beta/:id" element={<CohortePage />} />
          <Route path="/beta/:id/informe" element={<InformePage />} />
          <Route path="/reportes" element={<ReportesPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/negocios" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
