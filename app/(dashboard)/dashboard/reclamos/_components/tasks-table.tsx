"use client"

import * as React from "react"
import { 
  ColumnFiltersState,
  SortingState, 
  VisibilityState,
  getCoreRowModel, 
  getPaginationRowModel, 
  getSortedRowModel,
  useReactTable,
  ColumnDef,
  flexRender
} from "@tanstack/react-table"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"
import type { getTasks } from "../_lib/queries"
import { getColumns, type Reclamo, type DataTableRowAction } from "./tasks-table-columns"
import { TasksTableFloatingBar } from "./tasks-table-floating-bar"
import { useTasksTable } from "./tasks-table-provider"
import { TasksTableToolbarActions } from "./tasks-table-toolbar-actions"
import { getStatusIcon } from "../_lib/utils"
import { statusEnum } from "@/db/schema"
import { UpdateTaskSheet } from "./update-task-sheet"
import { DeleteTasksDialog } from "./delete-tasks-dialog"
import { TasksTableMutationsProvider } from "./tasks-table-mutations"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableFacetedFilter } from "@/components/data-table/data-table-faceted-filter"
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"

interface TasksTableProps {
  tasksPromise: ReturnType<typeof getTasks>
}

// Función para convertir texto a formato de oración
const toSentenceCase = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Componente principal de la tabla
export function TasksTable({ tasksPromise }: TasksTableProps) {
  // Feature flags para características adicionales
  const { featureFlags } = useTasksTable()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Obtener datos de la API
  const { data: serverData, pageCount } = React.use(tasksPromise)
  const [data, setData] = React.useState(serverData)

  React.useEffect(() => {
    setData(serverData)
  }, [serverData])

  const removeTasksFromTable = React.useCallback((ids: string[]) => {
    setData((current) => current.filter((task) => !ids.includes(task.id)))
  }, [])

  // Estado para manejar acciones de fila
  const [rowAction, setRowAction] = React.useState<DataTableRowAction<Reclamo> | null>(null)

  // Obtener parámetros actuales de la URL
  const page = Number(searchParams.get("page") || "1")
  const per_page = Number(searchParams.get("per_page") || "10")
  const estadoFilter = searchParams.get("estado") || ""

  // Estados para la tabla
  const [sorting, setSorting] = React.useState<SortingState>([
    {
      id: "id",
      desc: true // Ordenamos por id descendente por defecto
    },
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  // Función para actualizar la URL
  const createQueryString = React.useCallback(
    (params: Record<string, string | number | null>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString())
      
      Object.entries(params).forEach(([key, value]) => {
        if (value === null) {
          newSearchParams.delete(key)
        } else {
          newSearchParams.set(key, String(value))
        }
      })
      
      return newSearchParams.toString()
    },
    [searchParams]
  )

  // Inicializar filtros desde URL
  React.useEffect(() => {
    const filters: ColumnFiltersState = []
    
    if (estadoFilter) {
      filters.push({ id: "estado", value: [estadoFilter] })
    }
    
    setColumnFilters(filters)
  }, [estadoFilter])

  // Memoize columns para evitar re-renderizados
  const columns = React.useMemo(() => getColumns({ setRowAction }), [])

  // Función para reiniciar filtros
  const handleResetFilters = React.useCallback(() => {
    router.push(`${pathname}?${createQueryString({ page: 1, per_page })}`)
  }, [router, pathname, createQueryString, per_page])

  // Manejar cambios en el filtro de estado
  React.useEffect(() => {
    const estadoFilter = columnFilters.find(filter => filter.id === "estado")
    if (estadoFilter) {
      const value = estadoFilter.value
      if (Array.isArray(value) && value.length > 0) {
        const estado = value[0]
        router.push(
          `${pathname}?${createQueryString({
            estado: estado as string,
            page: 1,
            per_page
          })}`
        )
      } else if (Array.isArray(value) && value.length === 0) {
        router.push(
          `${pathname}?${createQueryString({
            estado: null,
            page: 1,
            per_page
          })}`
        )
      }
    }
  }, [columnFilters, router, pathname, createQueryString, per_page])

  // Crear la tabla
  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: {
        pageIndex: page - 1,
        pageSize: per_page,
      },
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      // @ts-ignore - La typing está un poco rota para onPaginationChange
      const newPagination = updater(table.getState().pagination)
      router.push(
        `${pathname}?${createQueryString({
          page: newPagination.pageIndex + 1,
          per_page: newPagination.pageSize,
          estado: estadoFilter || null
        })}`
      )
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSorting: true,
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
  })

  // Memoizar el componente de barra flotante
  const floatingBar = React.useMemo(() => {
    if (featureFlags.includes("floatingBar")) {
      return <TasksTableFloatingBar table={table} />
    }
    return null
  }, [featureFlags, table])

  return (
    <TasksTableMutationsProvider onRemoveTasks={removeTasksFromTable}>
    <div className="space-y-4">
      {/* Barra de filtros */}
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          {/* Filtro facetado para estado */}
          {table.getColumn("estado") && (
            <DataTableFacetedFilter
              column={table.getColumn("estado")}
              title="Estado"
              options={statusEnum.map((estado: string) => {
                const Icon = getStatusIcon(estado);
                return {
                  label: toSentenceCase(estado),
                  value: estado,
                  icon: Icon,
                };
              })}
            />
          )}
          
          {/* Botón para resetear filtros */}
          {estadoFilter && (
            <Button
              variant="ghost"
              onClick={handleResetFilters}
              className="h-8 px-2 lg:px-3"
            >
              Resetear filtros
            </Button>
          )}
        </div>
        
        <TasksTableToolbarActions table={table} />
        <DataTableViewOptions table={table} />
      </div>

      {/* Tabla */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No se encontraron resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Paginación */}
      <DataTablePagination table={table} />
      
      {/* Componentes para manejar acciones de fila */}
      <UpdateTaskSheet
        open={rowAction?.type === "update"}
        onOpenChange={() => setRowAction(null)}
        task={rowAction?.row.original ?? null}
      />
      <DeleteTasksDialog
        open={rowAction?.type === "delete"}
        onOpenChange={() => setRowAction(null)}
        tasks={rowAction?.row.original ? [rowAction?.row.original] : []}
        showTrigger={false}
        onSuccess={() => {
          rowAction?.row.toggleSelected(false)
        }}
      />
    </div>
    </TasksTableMutationsProvider>
  )
}
