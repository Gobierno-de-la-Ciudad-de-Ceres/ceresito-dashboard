import fs from 'fs';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

import { getPodaSheet } from '@/lib/podaSheet';

const CREDENTIALS = JSON.parse(fs.readFileSync('./credenciales.json', 'utf-8'));

const serviceAccountAuth = new JWT({
  email: CREDENTIALS.client_email,
  key: CREDENTIALS.private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const doc = new GoogleSpreadsheet(
  '1eqgDBQtHqHmZcBF7IzK7-GgOQBSMBlmI9ZR667v4UF8',
  serviceAccountAuth,
);

export type PodaSheetRowData = {
  rowNumber: number;
  fecha: string | undefined;
  seccion: string | undefined;
  nombre: string | undefined;
  telefono: string | undefined;
  ubicacion: string | undefined;
  barrio: string | undefined;
  imagenURL: string | undefined;
  estado: string | undefined;
};

export async function loadPodaSheetRows(): Promise<PodaSheetRowData[]> {
  await doc.loadInfo();
  const sheet = getPodaSheet(doc);
  await sheet.loadHeaderRow();
  const rows = await sheet.getRows();

  return rows.map((row) => ({
    rowNumber: row.rowNumber,
    fecha: row.get('Fecha'),
    seccion: row.get('seccion'),
    nombre: row.get('Nombre'),
    telefono: row.get('Telefono'),
    ubicacion: row.get('Ubicacion'),
    barrio: row.get('Barrio'),
    imagenURL: row.get('Imagen'),
    estado: row.get('Estado'),
  }));
}

export async function deletePodaSheetRows(rowNumbers: number[]) {
  await doc.loadInfo();
  const sheet = getPodaSheet(doc);
  await sheet.loadHeaderRow();
  const rows = await sheet.getRows();

  const uniqueRowNumbers = [...new Set(rowNumbers)].sort((a, b) => b - a);

  for (const rowNumber of uniqueRowNumbers) {
    const row = rows.find((item) => item.rowNumber === rowNumber);
    if (!row) {
      throw new Error(`No se encontró la fila ${rowNumber} en la planilla de poda`);
    }
    await row.delete();
  }
}
