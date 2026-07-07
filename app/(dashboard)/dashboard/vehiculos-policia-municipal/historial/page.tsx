"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
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
  const [deletingBulk, setDeletingBulk] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [entregaToDelete, setEntregaToDelete] = useState<EntregaExportDetalle | null>(
    null,
  );
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const selectedEntregas = useMemo(
    () => entregas.filter((entrega) => selectedIds.includes(entrega.id)),
    [entregas, selectedIds],
  );

  const allSelected =
    entregas.length > 0 && selectedIds.length === entregas.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const loadEntregas = () => {
    setLoading(true);
    fetch("/api/vehiculos-policia/entregas")
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar historial");
        return res.json();
      })
      .then((data: EntregaExportDetalle[]) => {
        setEntregas(data);
        setSelectedIds((current) =>
          current.filter((id) => data.some((item) => item.id === id)),
        );
      })
      .catch(() => toast.error("No se pudo cargar el historial"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEntregas();
  }, []);

  const toggleSelection = (id: number, checked: boolean) => {
    setSelectedIds((current) =>
      checked ? [...new Set([...current, id])] : current.filter((item) => item !== id),
    );
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? entregas.map((entrega) => entrega.id) : []);
  };

  const deleteEntregaById = async (id: number) => {
    const response = await fetch(`/api/vehiculos-policia/entregas/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("No se pudo eliminar");
    }
  };

  const handleDelete = async () => {
    if (!entregaToDelete) return;

    setDeletingId(entregaToDelete.id);
    try {
      await deleteEntregaById(entregaToDelete.id);

      setEntregas((current) =>
        current.filter((item) => item.id !== entregaToDelete.id),
      );
      setSelectedIds((current) =>
        current.filter((id) => id !== entregaToDelete.id),
      );
      toast.success("Planilla eliminada");
      setEntregaToDelete(null);
    } catch {
      toast.error("No se pudo eliminar la planilla");
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    setDeletingBulk(true);
    const idsToDelete = [...selectedIds];
    const results = await Promise.allSettled(
      idsToDelete.map((id) => deleteEntregaById(id)),
    );

    const deletedIds = idsToDelete.filter(
      (_, index) => results[index].status === "fulfilled",
    );
    const failedCount = idsToDelete.length - deletedIds.length;

    if (deletedIds.length > 0) {
      setEntregas((current) =>
        current.filter((item) => !deletedIds.includes(item.id)),
      );
      setSelectedIds((current) => current.filter((id) => !deletedIds.includes(id)));
    }

    if (failedCount === 0) {
      toast.success(
        deletedIds.length === 1
          ? "Planilla eliminada"
          : `${deletedIds.length} planillas eliminadas`,
      );
    } else if (deletedIds.length > 0) {
      toast.warning(
        `Se eliminaron ${deletedIds.length} planillas. ${failedCount} no se pudieron borrar.`,
      );
    } else {
      toast.error("No se pudieron eliminar las planillas seleccionadas");
    }

    setBulkDeleteOpen(false);
    setDeletingBulk(false);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <Heading
          title="Historial"
          description="Planillas de entrega y recepción de vehículos"
        />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            disabled={
              loading ||
              deletingBulk ||
              deletingId !== null ||
              selectedIds.length === 0
            }
            onClick={() => setBulkDeleteOpen(true)}
          >
            {deletingBulk ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Eliminar seleccionadas
            {selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}
          </Button>
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
          <div className="flex items-center gap-3 rounded-md border bg-muted/30 px-3 py-2">
            <Checkbox
              id="select-all-planillas"
              checked={allSelected ? true : someSelected ? "indeterminate" : false}
              onCheckedChange={(checked) => toggleSelectAll(checked === true)}
              disabled={deletingBulk || deletingId !== null}
            />
            <label
              htmlFor="select-all-planillas"
              className="text-sm font-medium leading-none"
            >
              Seleccionar todas
            </label>
            {selectedIds.length > 0 ? (
              <span className="text-sm text-muted-foreground">
                {selectedIds.length} seleccionada
                {selectedIds.length === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>

          {entregas.map((entrega) => (
            <Card key={entrega.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedIds.includes(entrega.id)}
                    onCheckedChange={(checked) =>
                      toggleSelection(entrega.id, checked === true)
                    }
                    disabled={deletingBulk || deletingId !== null}
                    aria-label={`Seleccionar planilla ${entrega.vehiculo.patente}`}
                    className="mt-1"
                  />
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
                </div>
                <div className="flex flex-wrap gap-2 sm:pl-0 pl-7">
                  <Link
                    href={`/dashboard/vehiculos-policia-municipal/historial/${entrega.id}`}
                  >
                    <Button variant="outline">Ver detalle</Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    disabled={deletingId === entrega.id || deletingBulk}
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

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Eliminar {selectedIds.length} planilla
              {selectedIds.length === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Se borrarán las planillas seleccionadas junto con sus fotos del tablero.
              Esta acción no se puede deshacer.
              {selectedEntregas.some((entrega) => entrega.estado === "EN_CURSO") ? (
                <>
                  {" "}
                  <strong>Atención:</strong> hay al menos una planilla en curso.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingBulk}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletingBulk}
              onClick={(event) => {
                event.preventDefault();
                void handleBulkDelete();
              }}
            >
              {deletingBulk ? "Eliminando..." : "Eliminar seleccionadas"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
