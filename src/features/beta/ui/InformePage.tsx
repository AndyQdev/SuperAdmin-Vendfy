import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download, Printer } from "lucide-react";

import { useReportes, useTablero } from "@/entities/beta/api";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

import { aCsv, archivo, descargar, seudonimos } from "../model/exportar";
import { ESTADO_ACTIVACION, ESTADO_INCIDENCIA, SEVERIDAD, fechaCorta, fechaDia, nombreModulo } from "../model/textos";
import { Embudo, Incidencias, Kpis, Metas, Retencion, Satisfaccion } from "./Secciones";

/**
 * El informe de cierre de una beta: la evidencia del emprendimiento, en una
 * página que se imprime (o guarda como PDF) para el documento y el tribunal.
 *
 * Los negocios van anonimizados por defecto (Negocio A, B…), como se les
 * prometió en el consentimiento; los nombres reales se pueden mostrar para
 * uso interno. Las tablas también se bajan en CSV para los anexos.
 */
export function InformePage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error } = useTablero(id);
  const reportes = useReportes({ cohorteId: id, estado: "todas" });
  const [nombresReales, setNombresReales] = useState(false);

  const alias = useMemo(() => seudonimos((data?.participantes ?? []).map((p) => p.storeId)), [data]);
  const nombre = (storeId: string, real: string) => (nombresReales ? real : alias.get(storeId) ?? "Otro negocio");

  if (isError) return <p className="p-6 text-sm text-destructive">{(error as Error)?.message ?? "No se pudo cargar el informe"}</p>;
  if (isLoading || !data) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const { cohorte, participantes, metas } = data;
  const base = archivo(cohorte.nombre);
  const cumplidas = metas.filter((m) => m.cumple === true).length;
  const evaluadas = metas.filter((m) => m.cumple !== null).length;

  const csvNegocios = () =>
    descargar(
      `${base}-negocios.csv`,
      aCsv(
        participantes.map((p) => ({
          negocio: nombre(p.storeId, p.nombre),
          inscrito: p.hitos.inscrito.slice(0, 10),
          acepto_participar: p.hitos.consentimiento?.slice(0, 10) ?? "",
          activacion: ESTADO_ACTIVACION[p.activacion.estado].texto,
          dias_hasta_activarse: p.activacion.dias,
          tienda_configurada: p.hitos.configurada ? "sí" : "no",
          primer_producto: p.hitos.primerProducto?.slice(0, 10) ?? "",
          catalogo_cargado: p.hitos.catalogoCargado?.slice(0, 10) ?? "",
          primera_venta: p.hitos.primeraVenta?.slice(0, 10) ?? "",
          primera_venta_en_linea: p.hitos.primeraVentaEnLinea?.slice(0, 10) ?? "",
          productos: p.productos,
          ventas: p.ventas,
          dias_activos_ultimos_7: p.diasActivos7,
          sus: p.sus,
          nps: p.nps,
          incidencias_abiertas: p.incidenciasAbiertas,
          ...Object.fromEntries(Object.entries(p.modulos).map(([m, d]) => [`dias_${m}`, d])),
        })),
      ),
    );

  const csvIncidencias = () =>
    descargar(
      `${base}-incidencias.csv`,
      aCsv(
        (reportes.data?.incidencias ?? []).map((i) => ({
          negocio: nombre(i.storeId, i.negocio),
          titulo: i.titulo,
          descripcion: i.descripcion,
          severidad: SEVERIDAD[i.severidad].texto,
          estado: ESTADO_INCIDENCIA[i.estado],
          origen: i.origen,
          modulo: i.modulo ? nombreModulo(i.modulo) : "",
          creada: i.creada?.slice(0, 10),
          resuelta: i.resuelta?.slice(0, 10) ?? "",
          dias_hasta_resolver: i.resuelta ? Math.round((Date.parse(i.resuelta) - Date.parse(i.creada)) / 86_400_000) : "",
        })),
      ),
    );

  const csvOpiniones = () =>
    descargar(
      `${base}-opiniones.csv`,
      aCsv([
        ...data.satisfaccion.comentarios.map((c) => ({
          negocio: nombre(c.storeId, participantes.find((p) => p.storeId === c.storeId)?.nombre ?? ""),
          tipo: "Encuesta (qué cambiaría)",
          nps: c.nps,
          momento: c.momento,
          texto: c.comentario,
          fecha: c.creada?.slice(0, 10),
        })),
        ...(reportes.data?.sugerencias ?? [])
          .filter((s) => s.tipo === "comentario")
          .map((s) => ({
            negocio: nombre(s.storeId, s.negocio),
            tipo: "Sugerencia",
            nps: "",
            momento: "",
            texto: s.comentario,
            fecha: s.creada?.slice(0, 10),
          })),
      ]),
    );

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 print:max-w-none print:p-0">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Button variant="ghost" size="sm" asChild className="-ml-2 gap-1.5 text-muted-foreground">
          <Link to={`/beta/${cohorte.id}`}>
            <ArrowLeft className="h-4 w-4" /> Volver al tablero
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={nombresReales} onChange={(e) => setNombresReales(e.target.checked)} />
            Mostrar nombres reales (uso interno)
          </label>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={csvNegocios}>
            <Download className="h-4 w-4" /> Negocios CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={csvIncidencias} disabled={!reportes.data}>
            <Download className="h-4 w-4" /> Incidencias CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={csvOpiniones} disabled={!reportes.data}>
            <Download className="h-4 w-4" /> Opiniones CSV
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Imprimir / PDF
          </Button>
        </div>
      </div>

      <header className="space-y-1 border-b pb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vendfy · Informe de beta</p>
        <h1 className="text-3xl font-bold" data-testid="informe-titulo">
          {cohorte.nombre}
        </h1>
        <p className="text-sm text-muted-foreground">
          {fechaDia(cohorte.fechaInicio)}
          {cohorte.fechaFin ? ` al ${fechaDia(cohorte.fechaFin)}` : " · en curso"} · {participantes.length}{" "}
          {participantes.length === 1 ? "negocio" : "negocios"} · generado el {fechaCorta(new Date().toISOString())}
        </p>
        {cohorte.descripcion && (
          <p className="pt-2 text-sm">
            <b>Objetivo:</b> {cohorte.descripcion}
          </p>
        )}
        <p className="pt-2 text-sm" data-testid="informe-veredicto">
          <b>Resultado:</b>{" "}
          {evaluadas === 0
            ? "todavía no hay datos suficientes para evaluar las metas."
            : `cumple ${cumplidas} de ${evaluadas} ${evaluadas === 1 ? "meta evaluada" : "metas evaluadas"}${evaluadas < metas.length ? ` (${metas.length - evaluadas} sin datos todavía)` : ""}.`}
        </p>
      </header>

      <Metas metas={metas} />
      <Kpis kpis={data.kpis} />
      <div className="grid gap-4 md:grid-cols-2 print:grid-cols-2">
        <Embudo pasos={data.embudo} />
        <Retencion semanas={data.retencion} />
      </div>
      <Satisfaccion datos={data.satisfaccion} nombreDe={(sid) => nombre(sid, participantes.find((p) => p.storeId === sid)?.nombre ?? "")} />
      <Incidencias datos={data.incidencias} />

      <section className="break-inside-avoid space-y-2">
        <h2 className="font-semibold">Detalle por negocio</h2>
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="p-2 font-medium">Negocio</th>
                <th className="p-2 font-medium">Activación</th>
                <th className="p-2 text-right font-medium">Productos</th>
                <th className="p-2 text-right font-medium">Ventas</th>
                <th className="p-2 text-right font-medium">Uso 7 d</th>
                <th className="p-2 text-right font-medium">SUS</th>
                <th className="p-2 text-right font-medium">NPS</th>
              </tr>
            </thead>
            <tbody>
              {participantes.map((p) => (
                <tr key={p.storeId} className="border-b last:border-0" data-testid="informe-negocio">
                  <td className="p-2 font-medium">{nombre(p.storeId, p.nombre)}</td>
                  <td className="p-2">
                    {ESTADO_ACTIVACION[p.activacion.estado].texto}
                    {p.activacion.dias !== null ? ` (${p.activacion.dias} d)` : ""}
                  </td>
                  <td className="p-2 text-right tabular-nums">{p.productos}</td>
                  <td className="p-2 text-right tabular-nums">{p.ventas}</td>
                  <td className="p-2 text-right tabular-nums">{p.diasActivos7}/7</td>
                  <td className="p-2 text-right tabular-nums">{p.sus ?? "—"}</td>
                  <td className="p-2 text-right tabular-nums">{p.nps ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="break-inside-avoid space-y-2 rounded-xl border bg-muted/30 p-5 text-sm">
        <h2 className="font-semibold">Cómo se mide</h2>
        <dl className="grid gap-x-6 gap-y-2 md:grid-cols-2">
          <Definicion termino="Activado">
            Terminó el onboarding, publicó al menos {cohorte.metas.productosMinimos} productos y registró una venta, dentro de los{" "}
            {cohorte.metas.diasActivacion} días desde que entró a la beta (o desde que creó su tienda, si fue después).
          </Definicion>
          <Definicion termino="Retención (semana N)">
            De los negocios que ya completaron su semana N desde la inscripción, el % que usó el panel al menos un día en ella.
          </Definicion>
          <Definicion termino="SUS">
            System Usability Scale (Brooke, 1996): 10 afirmaciones de 1 a 5; puntaje de 0 a 100. 68 es el promedio de la industria.
          </Definicion>
          <Definicion termino="NPS">
            Net Promoter Score (Reichheld, 2003): recomendación de 0 a 10. % de promotores (9-10) menos % de detractores (0-6).
          </Definicion>
          <Definicion termino="Uso">
            Se registra un día por usuario con los módulos del panel que usó; no se guarda qué hizo dentro de cada uno.
          </Definicion>
          <Definicion termino="Datos">
            Tomados del sistema en producción. Los negocios aceptaron participar y que sus datos se usen anonimizados.
          </Definicion>
        </dl>
      </section>
    </div>
  );
}

function Definicion({ termino, children }: { termino: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-medium">{termino}</dt>
      <dd className="text-muted-foreground">{children}</dd>
    </div>
  );
}
