import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import fs from 'fs';
import { getPodaSheet } from '@/lib/podaSheet';

const CREDENTIALS = JSON.parse(fs.readFileSync('./credenciales.json', 'utf-8'));


const serviceAccountAuth = new JWT({
    email: CREDENTIALS.client_email,
    key: CREDENTIALS.private_key,
    scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
    ],
});

const doc = new GoogleSpreadsheet('1eqgDBQtHqHmZcBF7IzK7-GgOQBSMBlmI9ZR667v4UF8', serviceAccountAuth);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    await doc.loadInfo();
    const sheet = getPodaSheet(doc);
    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();
    const data = rows.map(row => ({
        fecha: row.get('Fecha'),
        seccion: row.get('seccion'),
        nombre: row.get('Nombre'),
        telefono: row.get('Telefono'),
        ubicacion: row.get('Ubicacion'),
        barrio: row.get('Barrio'),
        imagenURL: row.get('Imagen'),
        estado: row.get('Estado'),
      }));
      return NextResponse.json(data, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      });
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
