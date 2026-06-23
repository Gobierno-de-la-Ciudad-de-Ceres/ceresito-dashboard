"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shell } from "@/components/shell";

import { DetallesReclamoDialog } from "./components/detalles-reclamo-dialog";
import { getPodaColumns } from "./_components/poda-table-columns";
import { PodaTable } from "./_components/poda-table";
import type { PodaReclamo } from "./_components/poda-types";

function parsePodaFecha(fecha: string | undefined): number {
  if (!fecha) return 0;
  const [datePart, timePart = "0:0:0"] = fecha.split(" - ");
  const [day, month, year] = datePart.split("/").map((value) => parseInt(value, 10));
  const [hours, minutes, seconds] = timePart
    .split(":")
    .map((value) => parseInt(value, 10));
  if (!day || !month || !year) return 0;
  return new Date(
    year,
    month - 1,
    day,
    hours || 0,
    minutes || 0,
    seconds || 0,
  ).getTime();
}

export default function PodaPage() {
  const [reclamos, setReclamos] = useState<PodaReclamo[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [selectedReclamo, setSelectedReclamo] = useState<PodaReclamo | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reclamosToDelete, setReclamosToDelete] = useState<PodaReclamo[]>([]);

  const fetchReclamos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/reclamo/poda", { cache: "no-store" });
      const dataFromApi = await response.json();

      if (!Array.isArray(dataFromApi)) {
        console.error("Formato de datos inesperado de /api/reclamo/poda:", dataFromApi);
        setReclamos([]);
        return;
      }

      const mappedData: PodaReclamo[] = dataFromApi.map((apiItem: any, index: number) => {
        let idReclamo: string | number;
        if (
          apiItem.seccion !== undefined &&
          apiItem.seccion !== null &&
          String(apiItem.seccion).trim() !== ""
        ) {
          idReclamo = String(apiItem.seccion);
        } else if (apiItem.fecha) {
          idReclamo = `${parsePodaFecha(apiItem.fecha) || Date.now()}-${index}`;
        } else {
          idReclamo = `${Date.now()}-${index}`;
        }

        return {
          id: idReclamo,
          sheetRowNumber: Number(apiItem.rowNumber),
          fecha: apiItem.fecha || new Date().toISOString(),
          nombre: apiItem.nombre || "N/A",
          telefono: apiItem.telefono || "N/A",
          ubicacion: apiItem.ubicacion || "N/A",
          barrio: apiItem.barrio || "N/A",
          imagen: apiItem.imagenURL || apiItem.imagen || undefined,
          estado: apiItem.estado || "pendiente",
          reclamo: "Reclamo de Poda",
          detalle: apiItem.detalle || "",
          prioridad: apiItem.prioridad || null,
          latitud: String(apiItem.latitud || ""),
          longitud: String(apiItem.longitud || ""),
          cuadrillaId: apiItem.cuadrillaId || null,
        };
      });

      mappedData.sort((a, b) => parsePodaFecha(b.fecha) - parsePodaFecha(a.fecha));
      setReclamos(mappedData.filter((item) => Number.isFinite(item.sheetRowNumber)));
    } catch (error) {
      console.error("Error obteniendo reclamos de Poda:", error);
      setReclamos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchReclamos();
  }, [fetchReclamos]);

  const handleViewDetails = useCallback((reclamo: PodaReclamo) => {
    setSelectedReclamo(reclamo);
    setDialogOpen(true);
  }, []);

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedReclamo(null);
  };

  const handleRequestDelete = useCallback((reclamosSeleccionados: PodaReclamo[]) => {
    if (reclamosSeleccionados.length === 0) return;
    setReclamosToDelete(reclamosSeleccionados);
  }, []);

  const handleConfirmDelete = async () => {
    if (reclamosToDelete.length === 0) return;

    setDeleting(true);
    try {
      const response = await fetch("/api/reclamo/poda", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rowNumbers: reclamosToDelete.map((reclamo) => reclamo.sheetRowNumber),
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "No se pudieron eliminar los reclamos");
      }

      toast.success(
        reclamosToDelete.length === 1
          ? "Reclamo de poda eliminado"
          : `${reclamosToDelete.length} reclamos de poda eliminados`,
      );
      setReclamosToDelete([]);
      await fetchReclamos();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudieron eliminar los reclamos",
      );
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo(
    () =>
      getPodaColumns({
        onViewDetails: handleViewDetails,
        onDelete: handleRequestDelete,
      }),
    [handleViewDetails, handleRequestDelete],
  );

  const deleteDescription =
    reclamosToDelete.length === 1 ? (
      <>
        Se borrará el reclamo de <strong>{reclamosToDelete[0]?.nombre}</strong> (
        {reclamosToDelete[0]?.ubicacion}) de la planilla de Google Sheets. La foto
        asociada también se intentará eliminar del servidor. Esta acción no se puede
        deshacer.
      </>
    ) : (
      <>
        Se borrarán <strong>{reclamosToDelete.length} reclamos</strong> de la planilla
        de Google Sheets. Las fotos asociadas también se intentarán eliminar del
        servidor. Esta acción no se puede deshacer.
      </>
    );

  return (
    <Shell className="gap-2">
      <Card>
        <CardHeader>
          <CardTitle>Reclamos de Poda</CardTitle>
          <CardDescription>
            Listado de reclamos de poda de árboles recibidos desde Google Sheets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Cargando reclamos de poda...</p>
          ) : (
            <PodaTable
              columns={columns}
              data={reclamos}
              deleting={deleting}
              onDeleteSelected={handleRequestDelete}
            />
          )}
        </CardContent>
      </Card>

      {selectedReclamo ? (
        <DetallesReclamoDialog
          reclamo={selectedReclamo}
          open={dialogOpen}
          onClose={handleDialogClose}
        />
      ) : null}

      <AlertDialog
        open={reclamosToDelete.length > 0}
        onOpenChange={(open) => {
          if (!open && !deleting) setReclamosToDelete([]);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {reclamosToDelete.length === 1
                ? "¿Eliminar este reclamo de poda?"
                : `¿Eliminar ${reclamosToDelete.length} reclamos de poda?`}
            </AlertDialogTitle>
            <AlertDialogDescription>{deleteDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmDelete();
              }}
            >
              {deleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Shell>
  );
}
