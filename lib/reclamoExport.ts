import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { type Table } from '@tanstack/react-table';

import { isValidReclamoImageUrl } from '@/lib/reclamoImageUrl';
import {
  fetchReclamoImageForExport,
  toJsPdfImageFormat,
  type ReclamoExportImage,
} from '@/lib/reclamoExportImages';
import type { Reclamo } from '@/types';

const RECLAMO_HEADERS = [
  'Imagen',
  'Fecha',
  'Nombre',
  'Tipo',
  'Ubicación',
  'Barrio',
  'Estado',
  'Detalle',
] as const;

function sanitize(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[\r\n\u2028\u2029]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function getReclamoExportRows(table: Table<Reclamo>, onlySelected: boolean) {
  const selected = table.getFilteredSelectedRowModel().rows;
  if (onlySelected || selected.length > 0) {
    return selected;
  }
  return table.getPrePaginationRowModel().rows;
}

async function loadRowImages(reclamos: Reclamo[]): Promise<(ReclamoExportImage | null)[]> {
  return Promise.all(
    reclamos.map(async (reclamo) => {
      if (!isValidReclamoImageUrl(reclamo.imagen)) {
        return null;
      }
      return fetchReclamoImageForExport(reclamo.imagen);
    }),
  );
}

function downloadBlob(buffer: ArrayBuffer, filename: string, mimeType: string) {
  const blob = new Blob([buffer], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function exportReclamosToExcel(
  table: Table<Reclamo>,
  opts: { filename?: string; onlySelected?: boolean } = {},
): Promise<void> {
  const { filename = 'reclamos', onlySelected = false } = opts;
  const rows = getReclamoExportRows(table, onlySelected);

  if (rows.length === 0) {
    throw new Error('No hay filas para exportar.');
  }

  const reclamos = rows.map((row) => row.original);
  const images = await loadRowImages(reclamos);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Reclamos');

  worksheet.columns = [
    { header: 'Imagen', key: 'imagen', width: 14 },
    { header: 'Fecha', key: 'fecha', width: 22 },
    { header: 'Nombre', key: 'nombre', width: 28 },
    { header: 'Tipo', key: 'reclamo', width: 24 },
    { header: 'Ubicación', key: 'ubicacion', width: 28 },
    { header: 'Barrio', key: 'barrio', width: 22 },
    { header: 'Estado', key: 'estado', width: 16 },
    { header: 'Detalle', key: 'detalle', width: 36 },
  ];

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).height = 22;

  for (let index = 0; index < reclamos.length; index++) {
    const reclamo = reclamos[index];
    const image = images[index];
    const excelRowNumber = index + 2;

    worksheet.addRow({
      imagen: image ? '' : isValidReclamoImageUrl(reclamo.imagen) ? 'Sin vista previa' : 'Sin imagen',
      fecha: sanitize(reclamo.fecha),
      nombre: sanitize(reclamo.nombre),
      reclamo: sanitize(reclamo.reclamo),
      ubicacion: sanitize(reclamo.ubicacion),
      barrio: sanitize(reclamo.barrio),
      estado: sanitize(reclamo.estado),
      detalle: sanitize(reclamo.detalle),
    });

    const row = worksheet.getRow(excelRowNumber);
    row.height = image ? 78 : 20;
    row.alignment = { vertical: 'middle', wrapText: true };

    if (image) {
      const imageId = workbook.addImage({
        base64: image.base64,
        extension: image.extension,
      });

      worksheet.addImage(imageId, {
        tl: { col: 0, row: excelRowNumber - 1 + 0.08 },
        ext: { width: 72, height: 72 },
      });
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    buffer,
    `${filename}.xlsx`,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
}

export async function exportReclamosToPDF(
  table: Table<Reclamo>,
  opts: { filename?: string; onlySelected?: boolean } = {},
): Promise<void> {
  const { filename = 'reclamos', onlySelected = false } = opts;
  const rows = getReclamoExportRows(table, onlySelected);

  if (rows.length === 0) {
    throw new Error('No hay filas para exportar.');
  }

  const reclamos = rows.map((row) => row.original);
  const images = await loadRowImages(reclamos);

  const body = reclamos.map((reclamo, index) => [
    images[index] ? '' : isValidReclamoImageUrl(reclamo.imagen) ? 'Sin vista previa' : 'Sin imagen',
    sanitize(reclamo.fecha),
    sanitize(reclamo.nombre),
    sanitize(reclamo.reclamo),
    sanitize(reclamo.ubicacion),
    sanitize(reclamo.barrio),
    sanitize(reclamo.estado),
    sanitize(reclamo.detalle),
  ]);

  const doc = new jsPDF({ orientation: 'landscape' });

  autoTable(doc, {
    head: [Array.from(RECLAMO_HEADERS)],
    body,
    styles: { fontSize: 7, cellWidth: 'wrap', valign: 'middle' },
    headStyles: { fillColor: [22, 101, 52] },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 28 },
      2: { cellWidth: 30 },
      3: { cellWidth: 28 },
      4: { cellWidth: 34 },
      5: { cellWidth: 28 },
      6: { cellWidth: 20 },
      7: { cellWidth: 42 },
    },
    bodyStyles: {
      minCellHeight: 22,
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 0 && images[data.row.index]) {
        data.cell.text = [''];
        data.row.height = 24;
      }
    },
    didDrawCell: (data) => {
      if (data.section !== 'body' || data.column.index !== 0) {
        return;
      }

      const image = images[data.row.index];
      if (!image) {
        return;
      }

      const size = 18;
      doc.addImage(
        image.base64,
        toJsPdfImageFormat(image.extension),
        data.cell.x + (data.cell.width - size) / 2,
        data.cell.y + (data.cell.height - size) / 2,
        size,
        size,
      );
    },
  });

  doc.save(`${filename}.pdf`);
}
