import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";

import { ROL_PLATAFORMA, useAuth } from "@/app/providers/auth";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export function LoginPage() {
  const { usuario, entrar } = useAuth();
  const navegar = useNavigate();
  const ubicacion = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Ya autenticado: no tiene sentido mostrarle el formulario otra vez.
  if (usuario?.role?.name === ROL_PLATAFORMA) {
    return <Navigate to="/negocios" replace />;
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await entrar(email, password);
      const desde = (ubicacion.state as { desde?: string } | null)?.desde;
      navegar(desde ?? "/negocios", { replace: true });
    } catch (err: any) {
      // El mensaje del backend, si lo hay. Distinguir "credenciales mal" de
      // "esta cuenta no es de plataforma" ahorra un rato de confusión.
      setError(err?.message || "No se pudo iniciar sesión");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <form
        onSubmit={enviar}
        className="w-full max-w-sm space-y-5 rounded-xl bg-background p-8 shadow-2xl"
      >
        <div className="space-y-1 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h1 className="pt-2 text-xl font-bold">Vendfy Plataforma</h1>
          <p className="text-sm text-muted-foreground">
            Panel de super administración
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Correo</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={enviando}>
          {enviando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {enviando ? "Entrando…" : "Entrar"}
        </Button>
      </form>
    </div>
  );
}
