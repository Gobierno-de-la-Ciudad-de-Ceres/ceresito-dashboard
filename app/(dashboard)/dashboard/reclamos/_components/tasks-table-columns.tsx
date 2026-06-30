"use client";

import * as React from "react";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import Link from "next/link";
import { Edit2, Eye, Trash } from "lucide-react";

import { getErrorMessage } from "@/lib/handle-error";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

import { updateReclamoEstado } from "../_lib/actions";
import { DeleteTasksDialog } from "./delete-tasks-dialog";
import { UpdateTaskSheet } from "./update-task-sheet";
import { ReclamoImage } from "./reclamo-image";
import { labelEnum, statusEnum } from "@/db/schema";
import { getStatusIcon } from "../_lib/utils";

// Función para convertir texto a formato de oración
const toSentenceCase = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Definición de tipo para acciones de fila
export type DataTableRowAction<TData> = {
  type: "update" | "delete";
  row: {
    original: TData;
    toggleSelected: (selected: boolean) => void;
  };
} | null;

export interface Reclamo {
  id: number;
  fecha: string;
  nombre: string | null;
  reclamo: string | null;
  ubicacion: string | null;
  barrio: string | null;
  telefono: string | null;
  estado: string | null;
  detalle: string | null;
  prioridad: string | null;
  imagen?: string | null;
  latitud: string | null;
  longitud: string | null;
  cuadrillaid: number | null;
}

interface GetColumnsOptions {
  setRowAction?: React.Dispatch<React.SetStateAction<DataTableRowAction<Reclamo>>>;
}

export function getColumns({
  setRowAction,
}: {
  setRowAction: React.Dispatch<React.SetStateAction<DataTableRowAction<Reclamo> | null>>
}): ColumnDef<Reclamo, unknown>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Seleccionar todos"
          className="translate-y-0.5"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Seleccionar fila"
          className="translate-y-0.5"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "imagen",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Imagen" />
      ),
      cell: ({ row }) => (
        <ReclamoImage
          url={row.original.imagen}
          alt={`Imagen reclamo ${row.original.id}`}
          width={64}
          height={64}
          className="aspect-square h-16 w-16 rounded-md object-cover"
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "fecha",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Fecha" />
      ),
      cell: ({ row }) => formatDate(new Date(row.getValue("fecha"))),
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "detalle",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Reclamo" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex max-w-[500px] items-center">
            <span className="truncate font-medium">{row.getValue("detalle")}</span>
          </div>
        )
      },
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
    },
    {
      accessorKey: "ubicacion",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Ubicación" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center">
            <span>{row.getValue("ubicacion")}</span>
          </div>
        )
      },
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
    },
    {
      accessorKey: "barrio",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Barrio" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center">
            <span>{row.getValue("barrio")}</span>
          </div>
        )
      },
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
    },
    {
      accessorKey: "estado",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Estado" />
      ),
      cell: ({ row }) => {
        const estado = row.getValue("estado") as string
        const Icon = getStatusIcon(estado)

        return (
          <div className="flex w-[100px] items-center">
            {Icon && (
              <span className="mr-2 h-2 w-2">
                <Icon className="h-4 w-4" />
              </span>
            )}
            <span>{toSentenceCase(estado)}</span>
          </div>
        )
      },
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
      filterFn: "equals",
    },
    {
      id: "actions",
      cell: function Cell({ row }) {
        // Mover la declaración de Hooks fuera de la condición
        const [isUpdatePending, startUpdateTransition] = React.useTransition();
        const [showUpdateTaskSheet, setShowUpdateTaskSheet] = React.useState(false);
        const [showDeleteTaskDialog, setShowDeleteTaskDialog] = React.useState(false);
        
        // Si estamos usando el sistema centralizado de acciones
        if (setRowAction) {
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label="Abrir menú"
                  variant="ghost"
                  className="flex size-8 p-0 data-[state=open]:bg-muted"
                >
                  <DotsHorizontalIcon className="size-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem 
                  onSelect={() => 
                    setRowAction({
                      type: "update",
                      row: {
                        original: row.original,
                        toggleSelected: row.toggleSelected
                      }
                    })
                  }
                >
                  <Edit2 className="mr-2 h-4 w-4" aria-hidden="true" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/reclamos/${row.original.id}`} className="flex items-center">
                    <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
                    Ver detalles
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Cambiar Estado</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                      value={row.original.estado || ""}
                      onValueChange={(value) => {
                        const id = row.original.id.toString();
                        updateReclamoEstado(id, value)
                          .then(({ error }) => {
                            if (error) {
                              toast.error(getErrorMessage(error));
                            } else {
                              toast.success("Estado del Reclamo Actualizado");
                            }
                          });
                      }}
                    >
                      {statusEnum.map((label) => (
                        <DropdownMenuRadioItem
                          key={label}
                          value={label}
                          className="capitalize"
                        >
                          {label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() =>
                    setRowAction({
                      type: "delete",
                      row: {
                        original: row.original,
                        toggleSelected: row.toggleSelected
                      }
                    })
                  }
                >
                  <Trash className="mr-2 h-4 w-4" aria-hidden="true" />
                  Eliminar
                  <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }
        
        // Implementación anterior (ahora los Hooks ya están declarados)
        return (
          <>
            <UpdateTaskSheet
              open={showUpdateTaskSheet}
              onOpenChange={setShowUpdateTaskSheet}
              task={row.original}
            />
            <DeleteTasksDialog
              open={showDeleteTaskDialog}
              onOpenChange={setShowDeleteTaskDialog}
              tasks={[row.original]}
              showTrigger={false}
              onSuccess={() => row.toggleSelected(false)}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label="Open menu"
                  variant="ghost"
                  className="flex size-8 p-0 data-[state=open]:bg-muted"
                >
                  <DotsHorizontalIcon className="size-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onSelect={() => setShowUpdateTaskSheet(true)}>
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Cambiar Estado</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                      value={row.original.estado || ""}
                      onValueChange={(value) => {
                        const id = row.original.id.toString();
                        updateReclamoEstado(id, value)
                          .then(({ error }) => {
                            if (error) {
                              toast.error(getErrorMessage(error));
                            } else {
                              toast.success("Estado del Reclamo Actualizado");
                            }
                          });
                      }}
                    >
                      {statusEnum.map((label) => (
                        <DropdownMenuRadioItem
                          key={label}
                          value={label}
                          className="capitalize"
                        >
                          {label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => setShowDeleteTaskDialog(true)}
              className="text-red-600 focus:text-red-600"
            >
                  Eliminar Reclamo
                  <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        );
      },
    },
  ];
}