import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  EQUIPAMIENTO_ITEMS,
  type EquipamientoMap,
} from "@/lib/planilla-vehiculos/constants";
import { formatDateTime } from "@/lib/planilla-vehiculos/format";
import { getVehiculosPhotoUrl } from "@/lib/planilla-vehiculos/tablero-photo";

export type EntregaExportRow = {
  id: number;
  estado: string;
  createdAt: string;
  inspectorNombre: string | null;
  inspectorApellido: string | null;
  vehiculo: {
    patente: string;
    tipo: string;
  };
};

export type EntregaExportDetalle = EntregaExportRow & {
  inicioFechaHora: string | null;
  inicioKilometros: number | null;
  inicioCombustible: string | null;
  inicioLimpieza: string | null;
  inicioLuces: string | null;
  inicioNeumaticos: string | null;
  inicioFotoTablero: string | null;
  finalFechaHora: string | null;
  finalKilometros: number | null;
  finalCombustible: string | null;
  finalLimpieza: string | null;
  finalLuces: string | null;
  finalNeumaticos: string | null;
  finalFotoTablero: string | null;
  observaciones: string | null;
  equipamiento: EquipamientoMap | null;
  cantidadMultas: number;
  cantidadRetenciones: number;
};

type PdfImage = {
  dataUrl: string;
  width: number;
  height: number;
};

function downloadPdf(doc: jsPDF, filename: string) {
  doc.save(filename);
}

function getLastTableY(doc: jsPDF, fallback: number) {
  return (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
    ?.finalY ?? fallback;
}

async function loadPdfImage(url: string): Promise<PdfImage | null> {
  try {
    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) return null;

    const blob = await response.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    return await new Promise((resolve) => {
      const img = new Image();
      img.onload = () =>
        resolve({ dataUrl, width: img.width, height: img.height });
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  } catch {
    return null;
  }
}

function fitImageDimensions(
  image: PdfImage,
  maxWidth: number,
  maxHeight: number,
) {
  const ratio = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
  return {
    width: image.width * ratio,
    height: image.height * ratio,
  };
}

async function appendTableroPhotos(
  doc: jsPDF,
  entrega: EntregaExportDetalle,
  startY: number,
) {
  const photos = [
    { label: "INICIO", url: getVehiculosPhotoUrl(entrega.inicioFotoTablero) },
    { label: "FINAL", url: getVehiculosPhotoUrl(entrega.finalFotoTablero) },
  ].filter((photo): photo is { label: string; url: string } => Boolean(photo.url));

  if (photos.length === 0) return startY;

  let y = startY + 10;
  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(11);
  doc.text("Fotos del tablero", 14, y);
  y += 8;

  for (const photo of photos) {
    const image = await loadPdfImage(photo.url);
    if (!image) continue;

    const { width, height } = fitImageDimensions(image, 170, 70);

    if (y + height + 12 > 285) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(9);
    doc.text(`Tablero — ${photo.label}`, 14, y);
    y += 4;
    doc.addImage(image.dataUrl, "JPEG", 14, y, width, height);
    y += height + 10;
  }

  return y;
}

async function renderEntregaDetalleContent(
  doc: jsPDF,
  entrega: EntregaExportDetalle,
) {
  doc.setFontSize(14);
  doc.text("Planilla de vehículo — Policía Municipal", 14, 16);
  doc.setFontSize(11);
  doc.text(
    `${entrega.vehiculo.patente} — ${entrega.vehiculo.tipo}`,
    14,
    24,
  );
  doc.text(
    `Inspector: ${entrega.inspectorNombre ?? ""} ${entrega.inspectorApellido ?? ""}`.trim(),
    14,
    31,
  );
  doc.setFontSize(9);
  doc.text(
    `Registrada: ${formatDateTime(entrega.createdAt)} · Estado: ${
      entrega.estado === "COMPLETADA" ? "Completada" : "En curso"
    }`,
    14,
    37,
  );

  autoTable(doc, {
    startY: 44,
    head: [["Turno", "Fecha", "Km", "Combustible", "Limpieza", "Luces", "Neumáticos"]],
    body: [
      [
        "INICIO",
        formatDateTime(entrega.inicioFechaHora),
        String(entrega.inicioKilometros ?? "—"),
        entrega.inicioCombustible ?? "—",
        entrega.inicioLimpieza ?? "—",
        entrega.inicioLuces ?? "—",
        entrega.inicioNeumaticos ?? "—",
      ],
      [
        "FINAL",
        formatDateTime(entrega.finalFechaHora),
        String(entrega.finalKilometros ?? "—"),
        entrega.finalCombustible ?? "—",
        entrega.finalLimpieza ?? "—",
        entrega.finalLuces ?? "—",
        entrega.finalNeumaticos ?? "—",
      ],
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [0, 156, 105] },
  });

  let y = getLastTableY(doc, 86);

  if (entrega.equipamiento) {
    y += 8;
    doc.setFontSize(11);
    doc.text("Equipamiento", 14, y);
    y += 4;
    const equipRows = EQUIPAMIENTO_ITEMS.map((item) => {
      const data = entrega.equipamiento?.[item.key];
      if (!data?.estado && !data?.cantidad) return null;
      return [item.label, data.estado || "—", data.cantidad || "—"];
    }).filter(Boolean) as string[][];

    if (equipRows.length > 0) {
      autoTable(doc, {
        startY: y + 2,
        head: [["Ítem", "Estado", "Cantidad / detalle"]],
        body: equipRows,
        styles: { fontSize: 9 },
      });
      y = getLastTableY(doc, y + 20);
    }
  }

  y += 10;
  doc.setFontSize(10);
  doc.text(`Observaciones: ${entrega.observaciones || "Sin observaciones."}`, 14, y);
  doc.text(`Multas del turno: ${entrega.cantidadMultas}`, 14, y + 7);
  doc.text(`Retenciones del turno: ${entrega.cantidadRetenciones}`, 14, y + 14);

  await appendTableroPhotos(doc, entrega, y + 14);
}

export async function exportHistorialToPdf(
  entregas: EntregaExportDetalle[],
  filename = "historial_vehiculos_policia",
) {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text("Historial — Vehículos Policía Municipal", 14, 16);
  doc.setFontSize(10);
  doc.text(`Generado: ${formatDateTime(new Date())}`, 14, 23);
  doc.text(`Total de planillas: ${entregas.length}`, 14, 29);

  autoTable(doc, {
    startY: 34,
    head: [["Patente", "Vehículo", "Fecha", "Inspector", "Estado"]],
    body: entregas.map((e) => [
      e.vehiculo.patente,
      e.vehiculo.tipo,
      formatDateTime(e.createdAt),
      `${e.inspectorNombre ?? ""} ${e.inspectorApellido ?? ""}`.trim(),
      e.estado === "COMPLETADA" ? "Completada" : "En curso",
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [0, 156, 105] },
  });

  for (const entrega of entregas) {
    doc.addPage("a4", "portrait");
    await renderEntregaDetalleContent(doc, entrega);
  }

  downloadPdf(doc, `${filename}.pdf`);
}

export async function exportEntregaDetalleToPdf(
  entrega: EntregaExportDetalle,
  filename?: string,
) {
  const doc = new jsPDF();
  const name =
    filename ??
    `planilla_${entrega.vehiculo.patente}_${entrega.id}`.replace(/\s+/g, "_");

  await renderEntregaDetalleContent(doc, entrega);
  downloadPdf(doc, `${name}.pdf`);
}
