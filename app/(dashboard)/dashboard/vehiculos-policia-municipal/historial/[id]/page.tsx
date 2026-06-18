"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileDown, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import {
  EQUIPAMIENTO_ITEMS,
  type EquipamientoMap,
} from "@/lib/planilla-vehiculos/constants";
import {
  exportEntregaDetalleToPdf,
  type EntregaExportDetalle,
} from "@/lib/planilla-vehiculos/export-pdf";
import {
  formatDateTime,
  getVehiculosPhotoUrl,
} from "@/lib/planilla-vehiculos/format";

function TurnoBlock({
  title,
  fecha,
  km,
  combustible,
  limpieza,
  luces,
  neumaticos,
}: {
  title: string;
  fecha: string | null;
  km: number | null;
  combustible: string | null;
  limpieza: string | null;
  luces: string | null;
  neumaticos: string | null;
}) {
  return (
    <div className="rounded-xl border bg-muted/40 p-4">
      <h3 className="mb-3 font-semibold">{title}</h3>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Fecha y hora</dt>
          <dd>{formatDateTime(fecha)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Kilómetros</dt>
          <dd>{km ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Combustible</dt>
          <dd>{combustible ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Limpieza</dt>
          <dd>{limpieza ?? "—"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">Luces</dt>
          <dd>{luces ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Neumáticos</dt>
          <dd>{neumaticos ?? "—"}</dd>
        </div>
      </dl>
    </div>
  );
}

export default function HistorialDetallePage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [entrega, setEntrega] = useState<EntregaExportDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/vehiculos-policia/entregas/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("No encontrada");
        return res.json();
      })
      .then(setEntrega)
      .catch(() => toast.error("Planilla no encontrada"))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-8 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando...
      </div>
    );
  }

  if (!entrega) {
    return (
      <div className="p-8">
        <p className="text-destructive">Planilla no encontrada.</p>
        <Link href="/dashboard/vehiculos-policia-municipal/historial">
          <Button variant="link" className="px-0">
            Volver al historial
          </Button>
        </Link>
      </div>
    );
  }

  const inicioFoto = getVehiculosPhotoUrl(entrega.inicioFotoTablero);
  const finalFoto = getVehiculosPhotoUrl(entrega.finalFotoTablero);
  const equipamiento = entrega.equipamiento as EquipamientoMap | null;

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      await exportEntregaDetalleToPdf(entrega);
      toast.success("PDF generado");
    } catch {
      toast.error("No se pudo generar el PDF");
    } finally {
      setExportingPdf(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/vehiculos-policia/entregas/${entrega.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("No se pudo eliminar");
      }

      toast.success("Planilla eliminada");
      router.push("/dashboard/vehiculos-policia-municipal/historial");
    } catch {
      toast.error("No se pudo eliminar la planilla");
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/dashboard/vehiculos-policia-municipal/historial">
            <Button variant="ghost" size="sm" className="mb-2 -ml-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
          <Heading
            title="Detalle de planilla"
            description={`${entrega.vehiculo.patente} — ${entrega.vehiculo.tipo}`}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={exportingPdf}
            onClick={() => void handleExportPdf()}
          >
            {exportingPdf ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            Exportar PDF
          </Button>
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            disabled={deleting}
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </div>
      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Inspector</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {entrega.inspectorNombre} {entrega.inspectorApellido}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <TurnoBlock
          title="INICIO"
          fecha={entrega.inicioFechaHora}
          km={entrega.inicioKilometros}
          combustible={entrega.inicioCombustible}
          limpieza={entrega.inicioLimpieza}
          luces={entrega.inicioLuces}
          neumaticos={entrega.inicioNeumaticos}
        />
        <TurnoBlock
          title="FINAL"
          fecha={entrega.finalFechaHora}
          km={entrega.finalKilometros}
          combustible={entrega.finalCombustible}
          limpieza={entrega.finalLimpieza}
          luces={entrega.finalLuces}
          neumaticos={entrega.finalNeumaticos}
        />
      </div>

      {(inicioFoto || finalFoto) && (
        <Card>
          <CardHeader>
            <CardTitle>Fotos del tablero</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            {inicioFoto && (
              <div>
                <p className="mb-2 text-sm font-medium">Tablero — INICIO</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={inicioFoto}
                  alt="Tablero inicio"
                  className="max-h-64 rounded-lg border object-contain"
                />
              </div>
            )}
            {finalFoto && (
              <div>
                <p className="mb-2 text-sm font-medium">Tablero — FINAL</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={finalFoto}
                  alt="Tablero final"
                  className="max-h-64 rounded-lg border object-contain"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {equipamiento && (
        <Card>
          <CardHeader>
            <CardTitle>Equipamiento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {EQUIPAMIENTO_ITEMS.map((item) => {
              const data = equipamiento[item.key];
              if (!data?.estado && !data?.cantidad) return null;
              return (
                <div key={item.key} className="rounded-lg border p-3 text-sm">
                  <p className="font-medium">{item.label}</p>
                  <p>Estado: {data.estado || "—"}</p>
                  <p>Cantidad / detalle: {data.cantidad || "—"}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Observaciones y turno</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>{entrega.observaciones || "Sin observaciones."}</p>
          <p>Multas del turno: {entrega.cantidadMultas}</p>
          <p>Retenciones del turno: {entrega.cantidadRetenciones}</p>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta planilla?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borrará la planilla de <strong>{entrega.vehiculo.patente}</strong>{" "}
              junto con sus fotos del tablero. Esta acción no se puede deshacer.
              {entrega.estado === "EN_CURSO" ? (
                <>
                  {" "}
                  <strong>Atención:</strong> el turno figura como en curso.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
            >
              {deleting ? "Eliminando..." : "Eliminar planilla"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
