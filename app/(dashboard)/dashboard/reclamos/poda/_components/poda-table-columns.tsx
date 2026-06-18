'use client'

import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { type ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { Reclamo } from '@/types' // Usamos la interfaz global
import { PodaImage } from './poda-image'

// Definimos un tipo para las acciones de fila, si es necesario más adelante
export interface PodaTableRowAction {
  label: string
  action: (reclamo: Reclamo) => void
}

interface GetPodaColumnsProps {
  onViewDetails: (reclamo: Reclamo) => void
  // Puedes añadir más acciones aquí si es necesario, ej: onDelete, onEdit
}

export function getPodaColumns({
  onViewDetails,
}: GetPodaColumnsProps): ColumnDef<Reclamo>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'imagen',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Imagen" />
      ),
      cell: ({ row }) => (
        <PodaImage
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
      accessorKey: 'fecha',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Fecha" />
      ),
      cell: ({ row }) => {
        // Formatear la fecha si es necesario, ej: new Date(row.original.fecha).toLocaleDateString('es-ES')
        return <div className="w-[100px]">{row.original.fecha}</div>
      },
    },
    {
      accessorKey: 'nombre',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Nombre" />
      ),
      cell: ({ row }) => <div className="w-[150px]">{row.getValue('nombre')}</div>,
    },
    {
      accessorKey: 'ubicacion',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Ubicación" />
      ),
      cell: ({ row }) => <div>{row.getValue('ubicacion')}</div>,
    },
    {
      accessorKey: 'barrio',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Barrio" />
      ),
      cell: ({ row }) => <div>{row.getValue('barrio')}</div>,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label="Open menu"
              variant="ghost"
              className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
            >
              <DotsHorizontalIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuItem onClick={() => onViewDetails(row.original)}>
              Ver Detalles
            </DropdownMenuItem>
            {/* 
            // Ejemplo de más acciones:
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                // Lógica para editar
                console.log('Edit:', row.original.id)
              }}
            >
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                // Lógica para eliminar
                console.log('Delete:', row.original.id)
              }}
              className="text-red-600"
            >
              Eliminar
            </DropdownMenuItem> 
            */}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
} 