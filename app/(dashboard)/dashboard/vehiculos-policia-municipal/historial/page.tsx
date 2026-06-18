"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileDown, Loader2, Trash2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import {
  exportHistorialToPdf,
  type EntregaExportDetalle,
} from "@/lib/planilla-vehiculos/export-pdf";
import { formatDateTime } from "@/lib/planilla-vehiculos/format";

export default function HistorialVehiculosPage() {
  const [entregas, setEntregas] = useState<EntregaExportDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [entregaToDelete, setEntregaToDelete] = useState<EntregaExportDetalle | null>(
    null,
  );

  const loadEntregas = () => {
    setLoading(true);
    fetch("/api/vehiculos-policia/entregas")
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar historial");
        return res.json();
      })
      .then(setEntregas)
      .catch(() => toast.error("No se pudo cargar el historial"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEntregas();
  }, []);

  const handleDelete = async () => {
    if (!entregaToDelete) return;

    setDeletingId(entregaToDelete.id);
    try {
      const response = await fetch(
        `/api/vehiculos-policia/entregas/${entregaToDelete.id}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        throw new Error("No se pudo eliminar");
      }

      setEntregas((current) =>
        current.filter((item) => item.id !== entregaToDelete.id),
      );
      toast.success("Planilla eliminada");
      setEntregaToDelete(null);
    } catch {
      toast.error("No se pudo eliminar la planilla");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <Heading
          title="Historial"
          description="Planillas de entrega y recepción de vehículos"
        />
        <Button
          variant="outline"
          disabled={loading || exportingPdf || entregas.length === 0}
          onClick={async () => {
            setExportingPdf(true);
            try {
              await exportHistorialToPdf(entregas);
              toast.success("PDF generado");
            } catch {
              toast.error("No se pudo generar el PDF");
            } finally {
              setExportingPdf(false);
            }
          }}
        >
          {exportingPdf ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="mr-2 h-4 w-4" />
          )}
          Exportar PDF
        </Button>
      </div>
      <Separator />

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando historial...
        </div>
      ) : entregas.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Todavía no hay planillas registradas.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entregas.map((entrega) => (
            <Card key={entrega.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">
                    {entrega.vehiculo.patente} — {entrega.vehiculo.tipo}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(entrega.createdAt)} · {entrega.inspectorNombre}{" "}
                    {entrega.inspectorApellido}
                  </p>
                  <Badge
                    variant={
                      entrega.estado === "COMPLETADA" ? "default" : "secondary"
                    }
                    className="mt-2"
                  >
                    {entrega.estado === "COMPLETADA" ? "Completada" : "En curso"}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/dashboard/vehiculos-policia-municipal/historial/${entrega.id}`}
                  >
                    <Button variant="outline">Ver detalle</Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    disabled={deletingId === entrega.id}
                    onClick={() => setEntregaToDelete(entrega)}
                  >
                    {deletingId === entrega.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog
        open={Boolean(entregaToDelete)}
        onOpenChange={(open) => {
          if (!open) setEntregaToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta planilla?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borrará la planilla de{" "}
              <strong>{entregaToDelete?.vehiculo.patente}</strong> del{" "}
              {formatDateTime(entregaToDelete?.createdAt)} junto con sus fotos del
              tablero. Esta acción no se puede deshacer.
              {entregaToDelete?.estado === "EN_CURSO" ? (
                <>
                  {" "}
                  <strong>Atención:</strong> el turno figura como en curso.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingId !== null}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletingId !== null}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
            >
              Eliminar planilla
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
