import { type Table } from "@tanstack/react-table";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type ExportColumnId = string;

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

function formatCellForExport(header: ExportColumnId, cellValue: unknown): string {
  if (cellValue === null || cellValue === undefined) return "";

  if (header === "fecha") {
    return formatDate(cellValue as string | number | Date);
  }

  if (typeof cellValue === "object") {
    return JSON.stringify(cellValue);
  }

  return String(cellValue);
}

function getExportRows<TData>(
  table: Table<TData>,
  onlySelected: boolean,
) {
  if (onlySelected) {
    return table.getFilteredSelectedRowModel().rows;
  }

  return table.getPrePaginationRowModel().rows;
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

export function exportTableToCSV<TData>(
  table: Table<TData>,
  opts: {
    filename?: string;
    excludeColumns?: (keyof TData | "select" | "actions")[];
    onlySelected?: boolean;
  } = {}
): void {
  const {
    filename = "reclamos",
    excludeColumns = ["select", "actions", "estado"],
    onlySelected = false,
  } = opts;

  const headers = getExportHeaders(table, excludeColumns as ExportColumnId[]);
  const rows = getExportRows(table, onlySelected);

  if (rows.length === 0) {
    throw new Error("No hay filas para exportar.");
  }

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const formattedValue = formatCellForExport(header, row.getValue(header));
          return `"${formattedValue.replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob(["\uFEFF", csvContent], { type: "text/csv;charset=utf-8;" });
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
  const {
    filename = "reclamos",
    excludeColumns = ["select", "actions", "estado"],
    onlySelected = false,
  } = opts;

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const hasSelectedRows = selectedRows.length > 0;
  const rows = getExportRows(table, onlySelected || hasSelectedRows);

  if (rows.length === 0) {
    throw new Error("No hay filas para exportar.");
  }

  const headers = getExportHeaders(table, excludeColumns as ExportColumnId[]);
  const body = rows.map((row) =>
    headers.map((header) => formatCellForExport(header, row.getValue(header))),
  );

  const doc = new jsPDF({ orientation: headers.length > 4 ? "landscape" : "portrait" });
  autoTable(doc, {
    head: [headers],
    body,
    styles: { fontSize: 8, cellWidth: "wrap" },
    headStyles: { fillColor: [22, 101, 52] },
  });

  doc.save(`${filename}.pdf`);
}
