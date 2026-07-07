"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { type Task } from "@/db/schema"
import { ReloadIcon, TrashIcon } from "@radix-ui/react-icons"
import { type Row } from "@tanstack/react-table"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { deleteTasks } from "../_lib/actions"
import { useRemoveTasksFromTable } from "./tasks-table-mutations"

interface DeleteTasksDialogProps
  extends React.ComponentPropsWithoutRef<typeof Dialog> {
  tasks: Row<Task>["original"][]
  showTrigger?: boolean
  onSuccess?: (deletedIds: string[]) => void
}

export function DeleteTasksDialog({
  tasks,
  showTrigger = true,
  onSuccess,
  ...props
}: DeleteTasksDialogProps) {
  const router = useRouter()
  const removeTasksFromTable = useRemoveTasksFromTable()
  const [isDeletePending, startDeleteTransition] = React.useTransition()

  return (
    <Dialog {...props}>
      {showTrigger ? (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
            <TrashIcon className="mr-2 size-4" aria-hidden="true" />
            Eliminar ({tasks.length})
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Estás absolutamente seguro?</DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. Estas a punto de eliminar {" "}
            <span className="font-medium">{tasks.length}</span>
            {tasks.length === 1 ? " reclamo" : " reclamos"} de nuestra base de datos.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:space-x-0">
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            aria-label="Delete selected rows"
            variant="destructive"
            onClick={() => {
              startDeleteTransition(async () => {
                const deletedIds = tasks.map((task) => task.id)
                const { error } = await deleteTasks({ ids: deletedIds })

                if (error) {
                  toast.error(error)
                  return
                }

                props.onOpenChange?.(false)
                removeTasksFromTable?.(deletedIds)
                toast.success(
                  tasks.length === 1
                    ? "Reclamo eliminado"
                    : `${tasks.length} reclamos eliminados`,
                )
                onSuccess?.(deletedIds)
                router.refresh()
              })
            }}
            disabled={isDeletePending}
          >
            {isDeletePending && (
              <ReloadIcon
                className="mr-2 size-4 animate-spin"
                aria-hidden="true"
              />
            )}
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
