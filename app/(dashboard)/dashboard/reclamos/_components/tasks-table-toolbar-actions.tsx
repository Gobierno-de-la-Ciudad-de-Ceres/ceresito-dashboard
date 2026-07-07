"use client"

import { useState } from "react"
import { type Task } from "@/db/schema"
import { DownloadIcon } from "@radix-ui/react-icons"
import { type Table } from "@tanstack/react-table"

import { exportReclamosToExcel, exportReclamosToPDF } from "@/lib/reclamoExport"
import { Button } from "@/components/ui/button"

import { CreateTaskDialog } from "./create-task-dialog"
import { DeleteTasksDialog } from "./delete-tasks-dialog"

interface TasksTableToolbarActionsProps {
  table: Table<Task>
}

export function TasksTableToolbarActions({
  table,
}: TasksTableToolbarActionsProps) {
  const selectedRowCount = table.getFilteredSelectedRowModel().rows.length;
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null)

  const handleExportExcel = async () => {
    setExporting('excel')
    try {
      await exportReclamosToExcel(table as never, {
        filename: 'reclamos',
        onlySelected: selectedRowCount > 0,
      })
    } catch (error) {
      console.error('[TasksTableToolbarActions] Error exportando Excel', error)
      window.alert(error instanceof Error ? error.message : 'No se pudo exportar a Excel.')
    } finally {
      setExporting(null)
    }
  }

  const handleExportPdf = async () => {
    setExporting('pdf')
    try {
      await exportReclamosToPDF(table as never, {
        filename: 'reclamos',
        onlySelected: selectedRowCount > 0,
      })
    } catch (error) {
      console.error('[TasksTableToolbarActions] Error exportando PDF', error)
      window.alert(error instanceof Error ? error.message : 'No se pudo exportar a PDF.')
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {selectedRowCount > 0 ? (
        <DeleteTasksDialog
          tasks={table
            .getFilteredSelectedRowModel()
            .rows.map((row) => row.original)}
          onSuccess={() => {
            table.toggleAllRowsSelected(false)
          }}
        />
      ) : null}
      <CreateTaskDialog />
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportExcel}
        disabled={exporting !== null}
      >
        <DownloadIcon className="mr-2 size-4" aria-hidden="true" />
        {exporting === 'excel'
          ? 'Exportando...'
          : `Exportar a Excel ${selectedRowCount > 0 ? `(${selectedRowCount})` : ''}`}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleExportPdf}
        disabled={exporting !== null}
      >
        <DownloadIcon className="mr-2 size-4" aria-hidden="true" />
        {exporting === 'pdf'
          ? 'Exportando...'
          : `Exportar a PDF ${selectedRowCount > 0 ? `(${selectedRowCount})` : ''}`}
      </Button>
      {/**
       * Other actions can be added here.
       * For example, import, view, etc.
       */}
    </div>
  )
}
