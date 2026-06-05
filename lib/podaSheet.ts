import type { GoogleSpreadsheet } from 'google-spreadsheet';

const PODA_SHEET_TITLE_CANDIDATES = [
  'Plan de Poda 2026',
  'Plan de Poda 2025',
  'Plan de Poda 2024',
];

export function getPodaSheet(doc: GoogleSpreadsheet) {
  for (const title of PODA_SHEET_TITLE_CANDIDATES) {
    const sheet = doc.sheetsByTitle[title];
    if (sheet) return sheet;
  }

  throw new Error(
    `No se encontró hoja de poda. Buscadas: ${PODA_SHEET_TITLE_CANDIDATES.join(', ')}`,
  );
}
