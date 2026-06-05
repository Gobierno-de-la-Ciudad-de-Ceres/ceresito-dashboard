import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import fs from 'fs';
import { getPodaSheet } from '@/lib/podaSheet';

const RESPONSES_SHEET_ID = process.env.RESPONSES_SHEET_ID ?? process.env.RESPONSE_SHEET_ID!;
const CREDENTIALS = JSON.parse(fs.readFileSync('./credentials.json', 'utf-8'));

const serviceAccountAuth = new JWT({
    email: CREDENTIALS.client_email,
    key: CREDENTIALS.private_key,
    scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
    ],
});

const doc = new GoogleSpreadsheet(RESPONSES_SHEET_ID, serviceAccountAuth);

export const getPodaData = async () => {
    try {
      await doc.loadInfo();
      const sheet = getPodaSheet(doc);
      await sheet.loadHeaderRow();
      const rows = await sheet.getRows();
      const data = rows.map(row => ({
        fecha: row.get('Fecha'),
        nombre: row.get('Nombre'),
        telefono: row.get('Telefono'),
        ubicacion: row.get('Ubicacion'),
        barrio: row.get('Barrio'),
        imagen: row.get('Imagen'),
      }));
      return data;
    } catch (err) {
      console.error('Error al obtener los reclamos', err);
      throw err;
    }
  };
