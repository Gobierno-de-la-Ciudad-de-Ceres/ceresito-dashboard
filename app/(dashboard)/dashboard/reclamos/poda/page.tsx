"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  File,
  Home,
  LineChart,
  ListFilter,
  MoreHorizontal,
  Package,
  Package2,
  PanelLeft,
  PlusCircle,
  ShoppingCart,
  Users2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
} from "@/components/ui/tabs";
import Link from "next/link";
import { DetallesReclamoDialog } from "./components/detalles-reclamo-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Reclamo } from "@/types";
import { PodaTable } from "./_components/poda-table";
import { getPodaColumns } from "./_components/poda-table-columns";
import { Shell } from "@/components/shell";

function parsePodaFecha(fecha: string | undefined): number {
  if (!fecha) return 0;
  const [datePart, timePart = "0:0:0"] = fecha.split(" - ");
  const [day, month, year] = datePart.split("/").map((value) => parseInt(value, 10));
  const [hours, minutes, seconds] = timePart.split(":").map((value) => parseInt(value, 10));
  if (!day || !month || !year) return 0;
  return new Date(year, month - 1, day, hours || 0, minutes || 0, seconds || 0).getTime();
}

export default function PodaPage() {
  const [reclamos, setReclamos] = useState<Reclamo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReclamo, setSelectedReclamo] = useState<Reclamo | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchReclamos() {
      setLoading(true);
      try {
        const response = await fetch('/api/reclamo/poda', { cache: 'no-store' });
        const dataFromApi = await response.json();

        if (Array.isArray(dataFromApi) && dataFromApi.length > 0) {
          console.log("Primer elemento de dataFromApi (después de cambiar API a row.get()):", dataFromApi[0]);
        }

        if (Array.isArray(dataFromApi)) {
          const mappedData: Reclamo[] = dataFromApi.map((apiItem: any, index: number) => {
            let id_reclamo;
            if (apiItem.seccion !== undefined && apiItem.seccion !== null && String(apiItem.seccion).trim() !== "") {
              id_reclamo = String(apiItem.seccion);
            } else if (apiItem.fecha) {
              id_reclamo = `${new Date(apiItem.fecha).getTime()}-${index}`;
            } else {
              id_reclamo = `${Date.now()}-${index}`;
            }

            return {
              id: id_reclamo,
              fecha: apiItem.fecha || new Date().toISOString(),
              nombre: apiItem.nombre || 'N/A',
              telefono: apiItem.telefono || 'N/A',
              ubicacion: apiItem.ubicacion || 'N/A',
              barrio: apiItem.barrio || 'N/A',
              imagen: apiItem.imagenURL || apiItem.imagen || undefined,
              estado: apiItem.estado || 'pendiente',
              reclamo: 'Reclamo de Poda',
              detalle: apiItem.detalle || '',
              prioridad: apiItem.prioridad || null,
              latitud: String(apiItem.latitud || ''),
              longitud: String(apiItem.longitud || ''),
              cuadrillaId: apiItem.cuadrillaId || null,
            };
          });
          
          mappedData.sort((a, b) => parsePodaFecha(b.fecha) - parsePodaFecha(a.fecha));
          
          setReclamos(mappedData);
        } else {
          console.error('Formato de datos inesperado de /api/reclamo/poda (después de cambiar API):', dataFromApi);
          setReclamos([]);
        }
      } catch (error) {
        console.error('Error obteniendo reclamos de Poda (después de cambiar API):', error);
        setReclamos([]);
      } finally {
        setLoading(false);
      }
    }

    fetchReclamos();
  }, []);

  const handleViewDetails = (reclamo: Reclamo) => {
    setSelectedReclamo(reclamo);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedReclamo(null);
  };

  const columns = useMemo(() => getPodaColumns({ onViewDetails: handleViewDetails }), [handleViewDetails]);

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
            <PodaTable columns={columns} data={reclamos} />
          )}
        </CardContent>
      </Card>

      {selectedReclamo && (
        <DetallesReclamoDialog
          reclamo={selectedReclamo}
          open={dialogOpen}
          onClose={handleDialogClose}
        />
      )}
    </Shell>
  );
}