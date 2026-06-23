'use client'

import { useState } from 'react'
import { DownloadIcon, TrashIcon } from '@radix-ui/react-icons'
import { type Table } from '@tanstack/react-table'

import { exportPodaToExcel, exportPodaToPDF } from '@/lib/podaExport'
import { Button } from '@/components/ui/button'
import { DataTableViewOptions } from '@/components/data-table/data-table-view-options'

import type { PodaReclamo } from './poda-types'

interface PodaTableToolbarProps {
  table: Table<PodaReclamo>
  onDeleteSelected?: (reclamos: PodaReclamo[]) => void
  deleting?: boolean
}

export function PodaTableToolbar({
  table,
  onDeleteSelected,
  deleting = false,
}: PodaTableToolbarProps) {
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedRowCount = selectedRows.length
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null)

  const handleExportExcel = async () => {
    setExporting('excel')
    try {
      await exportPodaToExcel(table, {
        filename: 'reclamos_poda',
        onlySelected: selectedRowCount > 0,
      })
    } catch (error) {
      console.error('[PodaTableToolbar] Error exportando Excel', error)
      window.alert(error instanceof Error ? error.message : 'No se pudo exportar a Excel.')
    } finally {
      setExporting(null)
    }
  }

  const handleExportPdf = async () => {
    setExporting('pdf')
    try {
      await exportPodaToPDF(table, {
        filename: 'reclamos_poda',
        onlySelected: selectedRowCount > 0,
      })
    } catch (error) {
      console.error('[PodaTableToolbar] Error exportando PDF', error)
      window.alert(error instanceof Error ? error.message : 'No se pudo exportar a PDF.')
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2" />
      <div className="flex items-center space-x-2">
        {selectedRowCount > 0 && onDeleteSelected ? (
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            disabled={deleting || exporting !== null}
            onClick={() =>
              onDeleteSelected(selectedRows.map((row) => row.original))
            }
          >
            <TrashIcon className="mr-2 size-4" aria-hidden="true" />
            {deleting ? 'Eliminando...' : `Eliminar (${selectedRowCount})`}
          </Button>
        ) : null}
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportExcel}
          disabled={deleting || exporting !== null}
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
          disabled={deleting || exporting !== null}
        >
          <DownloadIcon className="mr-2 size-4" aria-hidden="true" />
          {exporting === 'pdf'
            ? 'Exportando...'
            : `Exportar a PDF ${selectedRowCount > 0 ? `(${selectedRowCount})` : ''}`}
        </Button>
        <DataTableViewOptions table={table} />
      </div>
    </div>
  )
}
