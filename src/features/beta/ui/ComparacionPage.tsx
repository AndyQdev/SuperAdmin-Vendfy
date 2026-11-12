import { Link } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";

import { useComparacion } from "@/entities/beta/api";
import type { FilaComparacion } from "@/entities/beta/model/types";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { cn } from "@/shared/lib/cn";

import { aCsv, descargar } from "../model/exportar";
import { ESTADO_COHORTE, fechaDia } from "../model/textos";

/**
 * Las betas una al lado de la otra. La pregunta que responde: lo que se
 * corrigió después de la beta cerrada, ¿se nota en la abierta?
 */
export function ComparacionPage() {
  const { data, isLoading, isError, error } = useComparacion();
  const filas = data ?? [];

  const metricas: Array<{ titulo: string; valor: (f: FilaComparacion) => number | null; formato?: (n: number) => string; mejorAlto?: boolean }> = [
    { titulo: "Negocios", valor: (f) => f.participantes },
    { titulo: "Activación", valor: (f) => f.tasaActivacion, formato: (n) => `${n}%`, mejorAlto: true },
    { titulo: "Días hasta activarse (mediana)", valor: (f) => f.medianaDiasActivacion, formato: (n) => `${n} d`, mejorAlto: false },
    ...[0, 1, 2, 3].map((i) => ({
      titulo: `Uso en la semana ${i + 1}`,
      valor: (f: FilaComparacion) => f.retencion[i] ?? null,
      formato: (n: number) => `${n}%`,
      mejorAlto: true,
    })),
    { titulo: "SUS (usabilidad)", valor: (f) => f.sus, mejorAlto: true },
    { titulo: "NPS (recomendación)", valor: (f) => f.nps, formato: (n) => (n > 0 ? `+${n}` : String(n)), mejorAlto: true },
    { titulo: "Incidencias reportadas", valor: (f) => f.incidencias },
    { titulo: "Días para resolver (promedio)", valor: (f) => f.diasPromedioResolucion, formato: (n) => `${n} d`, mejorAlto: false },
    { titulo: "Metas cumplidas", valor: (f) => (f.metasEvaluadas ? f.metasCumplidas : null), formato: (n) => String(n) },
  ];

  const csv = () =>
    descargar(
      "comparacion-de-betas.csv",
      aCsv(metricas.map((m) => ({ metrica: m.titulo, ...Object.fromEntries(filas.map((f) => [f.cohorte.nombre, m.valor(f)])) }))),
    );

  return (
    <div className="space-y-6 p-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2 gap-1.5 text-muted-foreground">
        <Link to="/beta">
          <ArrowLeft className="h-4 w-4" /> Programa beta
        </Link>
      </Button>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Comparar betas</h1>
          <p className="text-sm text-muted-foreground">Cada beta en su columna, de la primera a la última. En verde, la mejor de cada fila.</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={csv} disabled={filas.length === 0}>
          <Download className="h-4 w-4" /> Descargar CSV
        </Button>
      </header>

      {isError && <p className="text-sm text-destructive">{(error as Error)?.message}</p>}
      {isLoading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : filas.length === 0 ? (
        <p className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">Todavía no hay betas para comparar.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm" data-testid="comparacion">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left font-medium text-muted-foreground">Métrica</th>
                {filas.map((f) => (
                  <th key={f.cohorte.id} className="min-w-40 p-3 text-right">
                    <Link to={`/beta/${f.cohorte.id}`} className="font-semibold hover:underline">
                      {f.cohorte.nombre}
                    </Link>
                    <div className="mt-1 flex items-center justify-end gap-1.5 text-xs font-normal text-muted-foreground">
                      {fechaDia(f.cohorte.fechaInicio)}
                      <Badge className={cn("border-transparent px-1.5 py-0 text-[10px] hover:opacity-100", ESTADO_COHORTE[f.cohorte.estado].clase)}>
                        {ESTADO_COHORTE[f.cohorte.estado].texto}
                      </Badge>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metricas.map((m) => {
                const valores = filas.map(m.valor);
                const conDato = valores.filter((v): v is number => v !== null);
                // Con un empate no hay mejor: un 0% en verde confunde.
                const todosIguales = conDato.every((v) => v === conDato[0]);
                const mejor =
                  m.mejorAlto === undefined || conDato.length < 2 || todosIguales ? null : m.mejorAlto ? Math.max(...conDato) : Math.min(...conDato);
                return (
                  <tr key={m.titulo} className="border-b last:border-0">
                    <td className="p-3 text-muted-foreground">{m.titulo}</td>
                    {valores.map((v, i) => (
                      <td
                        key={filas[i].cohorte.id}
                        className={cn("p-3 text-right font-medium tabular-nums", v !== null && v === mejor && "text-success")}
                      >
                        {v === null ? "—" : m.formato ? m.formato(v) : v}
                        {m.titulo === "Metas cumplidas" && v !== null ? ` de ${filas[i].metasEvaluadas}` : ""}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
