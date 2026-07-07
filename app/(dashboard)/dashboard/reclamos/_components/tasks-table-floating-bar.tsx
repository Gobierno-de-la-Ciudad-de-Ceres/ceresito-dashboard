import * as React from "react"
import { type Task, statusEnum, priorityEnum } from "@/db/schema"
import {
  ArrowUpIcon,
  CheckCircledIcon,
  Cross2Icon,
  ReloadIcon,
  TrashIcon,
  FileIcon,
  TableIcon
} from "@radix-ui/react-icons"
import { SelectTrigger } from "@radix-ui/react-select"
import { type Table } from "@tanstack/react-table"
import { toast } from "sonner"

import { exportTableToCSV, exportTableToPDF } from "@/lib/export"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Kbd } from "@/components/kbd"

import { updateTasks } from "../_lib/actions"
import { DeleteTasksDialog } from "./delete-tasks-dialog"
import { TooltipProvider } from "@radix-ui/react-tooltip"

interface TasksTableFloatingBarProps {
  table: Table<Task>
}

export function TasksTableFloatingBar({ table }: TasksTableFloatingBarProps) {
  const rows = table.getFilteredSelectedRowModel().rows

  const [isPending, startTransition] = React.useTransition()
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const [method, setMethod] = React.useState<
    "update-status" | "update-priority" | "export" | "delete"
  >()

  // Clear selection on Escape key press
  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        table.toggleAllRowsSelected(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [table])

  return (
    <>
      <DeleteTasksDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        tasks={rows.map((row) => row.original)}
        showTrigger={false}
        onSuccess={() => table.toggleAllRowsSelected(false)}
      />
    <div className="fixed inset-x-0 bottom-4 z-50 mx-auto w-fit px-4">
      <div className="w-full overflow-x-auto">
        <div className="mx-auto flex w-fit items-center gap-2 rounded-md border bg-card p-2 shadow-2xl">
          <div className="flex h-7 items-center rounded-md border border-dashed pl-2.5 pr-1">
            <span className="whitespace-nowrap text-xs">
              {rows.length} seleccionados
            </span>
            <Separator orientation="vertical" className="ml-2 mr-1" />
           <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-5 hover:border"
                  onClick={() => table.toggleAllRowsSelected(false)}
                >
                  <Cross2Icon
                    className="size-3.5 shrink-0"
                    aria-hidden="true"
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="flex items-center border bg-accent px-2 py-1 font-semibold text-foreground dark:bg-zinc-900">
                <p className="mr-2">Limpiar</p>
                <Kbd abbrTitle="Escape" variant="outline">
                  Esc
                </Kbd>
              </TooltipContent>
            </Tooltip>
            </TooltipProvider>
          </div>
          <Separator orientation="vertical" className="hidden h-5 sm:block" />
          <div className="flex items-center gap-1.5">
            <Select
              onValueChange={(value: Task["estado"]) => {
                setMethod("update-status");

                startTransition(async () => {
                  const { error } = await updateTasks({
                    ids: rows.map((row) => row.original.id),
                    estado: value,
                  });

                  if (error) {
                    toast.error(error);
                    return;
                  }

                  toast.success("Estado de reclamos actualizado");
                });
              }}
            >
           <TooltipProvider>
                <Tooltip delayDuration={250}>
                  <SelectTrigger asChild>
                    <TooltipTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="size-7 border data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
                        disabled={isPending}
                      >
                        {isPending && method === "update-status" ? (
                          <ReloadIcon className="size-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                          <CheckCircledIcon className="size-3.5" aria-hidden="true" />
                        )}
                      </Button>
                    </TooltipTrigger>
                  </SelectTrigger>
                  <TooltipContent className="border bg-accent font-semibold text-foreground dark:bg-zinc-900">
                    <p>Actualizar Estado</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <SelectContent align="center">
                <SelectGroup>
                  {statusEnum.map((status) => (
                    <SelectItem key={status} value={status} className="capitalize">
                      {status}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select
              onValueChange={(value: Task["prioridad"]) => {
                setMethod("update-priority");

                startTransition(async () => {
                  const { error } = await updateTasks({
                    ids: rows.map((row) => row.original.id),
                    priority: value,
                  });

                  if (error) {
                    toast.error(error);
                    return;
                  }

                  toast.success("Tasks updated");
                });
              }}
            >
              <TooltipProvider>
                <Tooltip delayDuration={250}>
                  <SelectTrigger asChild>
                    <TooltipTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="size-7 border data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
                        disabled={isPending}
                      >
                        {isPending && method === "update-priority" ? (
                          <ReloadIcon className="size-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                          <ArrowUpIcon className="size-3.5" aria-hidden="true" />
                        )}
                      </Button>
                    </TooltipTrigger>
                  </SelectTrigger>
                  <TooltipContent className="border bg-accent font-semibold text-foreground dark:bg-zinc-900">
                    <p>Actualizar Prioridad</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <SelectContent align="center">
                <SelectGroup>
                  {priorityEnum.map((priority) => (
                    <SelectItem key={priority} value={priority} className="capitalize">
                      {priority}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <TooltipProvider>
              <Tooltip delayDuration={250}>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="size-7 border"
                    onClick={() => {
                      setMethod("export");

                      startTransition(() => {
                        exportTableToCSV(table, {
                          excludeColumns: ["select", "actions"],
                          onlySelected: true,
                        });
                      });
                    }}
                    disabled={isPending}
                  >
                    {isPending && method === "export" ? (
                      <ReloadIcon className="size-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <TableIcon className="size-3.5" aria-hidden="true" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="border bg-accent font-semibold text-foreground dark:bg-zinc-900">
                  <p>Exportar Reclamo(s) a Excel</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip delayDuration={250}>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="size-7 border"
                    onClick={() => {
                      setMethod("export-pdf");

                      startTransition(() => {
                        exportTableToPDF(table, {
                          excludeColumns: ["select", "actions"],
                          onlySelected: true,
                        });
                      });
                    }}
                    disabled={isPending}
                  >
                    {isPending && method === "export-pdf" ? (
                      <ReloadIcon className="size-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <FileIcon className="size-3.5" aria-hidden="true" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="border bg-accent font-semibold text-foreground dark:bg-zinc-900">
                  <p>Exportar Reclamo(s) a PDF</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip delayDuration={250}>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="size-7 border"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={isPending}
                  >
                    {isPending && method === "delete" ? (
                      <ReloadIcon className="size-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <TrashIcon className="size-3.5" aria-hidden="true" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="border bg-accent font-semibold text-foreground dark:bg-zinc-900">
                  <p>Eliminar Reclamo</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
