import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { useMetricas } from "@/entities/metrica/api";
import {
  ETIQUETA_PERIODO,
  NOMBRE_CANAL,
  PERIODOS,
  type Periodo,
} from "@/entities/metrica/model/types";
import { useFiltrosUrl } from "@/shared/hooks/use-filtros-url";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { cn } from "@/shared/lib/cn";

const bs = new Intl.NumberFormat("es-BO", {
  style: "currency",
  currency: "BOB",
  maximumFractionDigits: 0,
});
const bsExacto = new Intl.NumberFormat("es-BO", {
  style: "currency",
  currency: "BOB",
  minimumFractionDigits: 2,
});
const numero = new Intl.NumberFormat("es-BO");

/** "2026-09-27" a "27 sep", sin pasar por Date para no correr un día por UTC. */
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
function diaCorto(iso: string) {
  const [, m, d] = iso.split("-");
  return `${Number(d)} ${MESES[Number(m) - 1]}`;
}

export function GananciasPage() {
  const { filtros, setFiltro } = useFiltrosUrl({ dias: 30 }, {});
  const dias = filtros.dias as Periodo;

  const { data, isLoading } = useMetricas(dias);
  const k = data?.kpis;

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Ganancias</h1>
          <p className="text-sm text-muted-foreground">
            Lo que facturan los comercios de la plataforma
          </p>
        </div>

        <Select
          value={String(dias)}
          onValueChange={(v) => setFiltro("dias", Number(v))}
        >
          <SelectTrigger className="w-[170px]" aria-label="Período">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODOS.map((p) => (
              <SelectItem key={p} value={String(p)}>
                {ETIQUETA_PERIODO[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>

      {/* --- KPIs: números héroe, no gráficos --- */}
      <div
        data-testid="kpis"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <Kpi
          titulo="Facturado"
          valor={k ? bs.format(k.facturado) : null}
          variacion={k?.variacionFacturado ?? null}
          cargando={isLoading}
        />
        <Kpi
          titulo="Pedidos"
          valor={k ? numero.format(k.pedidos) : null}
          variacion={k?.variacionPedidos ?? null}
          cargando={isLoading}
        />
        <Kpi
          titulo="Ticket promedio"
          valor={k ? bsExacto.format(k.ticketPromedio) : null}
          cargando={isLoading}
        />
        <Kpi
          titulo="Negocios con ventas"
          valor={k ? `${k.negociosConVentas} de ${k.negociosTotales}` : null}
          cargando={isLoading}
        />
      </div>

      {/* --- serie diaria --- */}
      <section className="rounded-lg border bg-background p-5">
        <h2 className="text-sm font-semibold">Facturación por día</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          {data
            ? `${diaCorto(data.periodo.desde)} — ${diaCorto(data.periodo.hasta)}, hora de Bolivia`
            : "…"}
        </p>

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="h-64" data-testid="grafico-facturacion">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data?.serie ?? []}
                margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
              >
                <defs>
                  <linearGradient id="relleno" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-3))" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                  </linearGradient>
                </defs>

                {/* Rejilla discreta: sirve para leer alturas, no para mirarla */}
                <CartesianGrid
                  vertical={false}
                  stroke="hsl(var(--border))"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="fecha"
                  tickFormatter={diaCorto}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={28}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  tickFormatter={(v) => bs.format(v)}
                  tickLine={false}
                  axisLine={false}
                  width={72}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload as {
                      facturado: number;
                      pedidos: number;
                    };
                    return (
                      <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-md">
                        <p className="font-medium">{diaCorto(String(label))}</p>
                        <p className="mt-1 text-muted-foreground">
                          {bsExacto.format(p.facturado)}
                        </p>
                        <p className="text-muted-foreground">
                          {p.pedidos} {p.pedidos === 1 ? "pedido" : "pedidos"}
                        </p>
                      </div>
                    );
                  }}
                />
                {/* Una sola serie: no hace falta leyenda, el título la nombra.
                    El tono es --chart-3 y no el cian de marca porque es el
                    único que pasa 3:1 de contraste en los DOS temas. */}
                <Area
                  type="monotone"
                  dataKey="facturado"
                  stroke="hsl(var(--chart-3))"
                  strokeWidth={2}
                  fill="url(#relleno)"
                  activeDot={{ r: 4, strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* --- por canal --- */}
        <section className="rounded-lg border bg-background p-5">
          <h2 className="mb-3 text-sm font-semibold">Por canal de venta</h2>
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : data?.porCanal.length ? (
            <ul className="space-y-3">
              {data.porCanal.map((c) => {
                const mayor = data.porCanal[0].facturado || 1;
                return (
                  <li key={c.canal}>
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span>{NOMBRE_CANAL[c.canal] ?? c.canal}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {bs.format(c.facturado)}
                        <span className="ml-2 text-xs">({c.pedidos})</span>
                      </span>
                    </div>
                    {/* Barras en un solo tono: los canales se distinguen por su
                        etiqueta, no por color. Siete colores acá serían siete
                        colores que no significan nada. */}
                    <div className="mt-1 h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-[hsl(var(--chart-3))]"
                        style={{ width: `${(c.facturado / mayor) * 100}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Sin ventas en este período
            </p>
          )}
        </section>

        {/* --- por negocio --- */}
        <section className="rounded-lg border bg-background p-5">
          <h2 className="mb-3 text-sm font-semibold">Por negocio</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Negocio</TableHead>
                  <TableHead className="text-right">Pedidos</TableHead>
                  <TableHead className="text-right">Facturado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={3}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    </TableRow>
                  ))}
                {!isLoading &&
                  data?.porNegocio.map((n) => (
                    <TableRow key={n.id} data-testid="ganancia-fila">
                      <TableCell className="font-medium">{n.nombre}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {n.pedidos}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {bs.format(n.facturado)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </div>
  );
}

function Kpi({
  titulo,
  valor,
  variacion,
  cargando,
}: {
  titulo: string;
  valor: string | null;
  variacion?: number | null;
  cargando: boolean;
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-xs text-muted-foreground">{titulo}</p>
      {cargando ? (
        <Skeleton className="mt-2 h-7 w-28" />
      ) : (
        <p className="mt-1 text-2xl font-bold tabular-nums">{valor ?? "—"}</p>
      )}
      {variacion !== undefined && !cargando && (
        <Variacion valor={variacion} />
      )}
    </div>
  );
}

/**
 * La variación va con flecha Y signo, no solo con color: el verde y el rojo a
 * secas dejan afuera a quien no los distingue.
 */
function Variacion({ valor }: { valor: number | null }) {
  if (valor === null) {
    return (
      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
        Sin período anterior con qué comparar
      </p>
    );
  }

  const sube = valor >= 0;
  const Icono = sube ? ArrowUpRight : ArrowDownRight;
  return (
    <p
      className={cn(
        "mt-1 flex items-center gap-1 text-xs font-medium",
        sube
          ? "text-emerald-700 dark:text-emerald-400"
          : "text-red-700 dark:text-red-400",
      )}
    >
      <Icono className="h-3 w-3" />
      {sube ? "+" : ""}
      {valor.toFixed(1)}% vs. período anterior
    </p>
  );
}
