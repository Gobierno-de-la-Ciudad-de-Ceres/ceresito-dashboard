import { type Table } from "@tanstack/react-table";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

type ExportColumnId = string;

const COLUMN_LABELS: Record<string, string> = {
  imagen: "Imagen",
  fecha: "Fecha",
  nombre: "Nombre",
  ubicacion: "Ubicación",
  barrio: "Barrio",
  telefono: "Teléfono",
  detalle: "Detalle",
  reclamo: "Reclamo",
  estado: "Estado",
};

export function formatDate(
  date: Date | string | number,
  opts: Intl.DateTimeFormatOptions = {}
) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return String(date);
  }

  return new Intl.DateTimeFormat("es-ES", {
    month: opts.month ?? "long",
    day: opts.day ?? "numeric",
    ...opts,
  }).format(parsed);
}

function sanitizeCellValue(value: string): string {
  return value.replace(/[\r\n\u2028\u2029]+/g, " ").replace(/\s+/g, " ").trim();
}

function formatCellForExport(header: ExportColumnId, cellValue: unknown): string {
  if (cellValue === null || cellValue === undefined) return "";

  if (header === "fecha") {
    return sanitizeCellValue(formatDate(cellValue as string | number | Date));
  }

  if (typeof cellValue === "object") {
    return sanitizeCellValue(JSON.stringify(cellValue));
  }

  return sanitizeCellValue(String(cellValue));
}

function getExportHeaders<TData>(
  table: Table<TData>,
  excludeColumns: ExportColumnId[],
) {
  return table
    .getAllLeafColumns()
    .map((column) => column.id)
    .filter((id) => !excludeColumns.includes(id) || id === "detalle");
}

function resolveExportRows<TData>(
  table: Table<TData>,
  onlySelected = false,
) {
  const hasSelectedRows = table.getFilteredSelectedRowModel().rows.length > 0;

  if (onlySelected || hasSelectedRows) {
    return table.getFilteredSelectedRowModel().rows;
  }

  return table.getPrePaginationRowModel().rows;
}

function buildExportMatrix<TData>(
  table: Table<TData>,
  opts: {
    excludeColumns?: (keyof TData | "select" | "actions")[];
    onlySelected?: boolean;
  } = {},
) {
  const {
    excludeColumns = ["select", "actions", "estado"],
    onlySelected = false,
  } = opts;

  const headers = getExportHeaders(table, excludeColumns as ExportColumnId[]);
  const rows = resolveExportRows(table, onlySelected);

  if (rows.length === 0) {
    throw new Error("No hay filas para exportar.");
  }

  const headerLabels = headers.map(
    (header) => COLUMN_LABELS[header] ?? header,
  );

  const body = rows.map((row) =>
    headers.map((header) => formatCellForExport(header, row.getValue(header))),
  );

  return { headers, headerLabels, body, rows };
}

export function exportTableToCSV<TData>(
  table: Table<TData>,
  opts: {
    filename?: string;
    excludeColumns?: (keyof TData | "select" | "actions")[];
    onlySelected?: boolean;
  } = {}
): void {
  const { filename = "reclamos", ...matrixOpts } = opts;
  const { headerLabels, body } = buildExportMatrix(table, matrixOpts);

  const csvContent = [
    headerLabels.join(";"),
    ...body.map((row) =>
      row
        .map((value) => `"${value.replace(/"/g, '""')}"`)
        .join(";"),
    ),
  ].join("\r\n");

  const blob = new Blob(["\uFEFF", csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportTableToExcel<TData>(
  table: Table<TData>,
  opts: {
    filename?: string;
    sheetName?: string;
    excludeColumns?: (keyof TData | "select" | "actions")[];
    onlySelected?: boolean;
  } = {}
): void {
  const {
    filename = "reclamos",
    sheetName = "Reclamos",
    ...matrixOpts
  } = opts;

  const { headerLabels, body } = buildExportMatrix(table, matrixOpts);
  const rowsAsObjects = body.map((row) =>
    Object.fromEntries(
      headerLabels.map((label, index) => [label, row[index] ?? ""]),
    ),
  );

  const worksheet = XLSX.utils.json_to_sheet(rowsAsObjects);
  worksheet["!cols"] = headerLabels.map((label) => ({
    wch: Math.max(label.length, 18),
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportToPDF<TData>(table: Table<TData>) {
  exportTableToPDF(table, { filename: "reclamos" });
}

export function exportTableToPDF<TData>(
  table: Table<TData>,
  opts: {
    filename?: string;
    excludeColumns?: (keyof TData | "select" | "actions")[];
    onlySelected?: boolean;
  } = {}
): void {
  const { filename = "reclamos", ...matrixOpts } = opts;
  const { headerLabels, body } = buildExportMatrix(table, matrixOpts);

  const doc = new jsPDF({
    orientation: headerLabels.length > 4 ? "landscape" : "portrait",
  });

  autoTable(doc, {
    head: [headerLabels],
    body,
    styles: { fontSize: 8, cellWidth: "wrap" },
    headStyles: { fillColor: [22, 101, 52] },
  });

  doc.save(`${filename}.pdf`);
}
