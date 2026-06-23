import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { tryDeletePodaImageFile } from '@/lib/podaDeleteImage';
import {
  deletePodaSheetRows,
  loadPodaSheetRows,
} from '@/lib/podaGoogleSheet';
import { requireMenuAccess } from '@/lib/route-access';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const deleteSchema = z.object({
  rowNumbers: z.array(z.number().int().positive()).min(1),
});

export async function GET() {
  try {
    const data = await loadPodaSheetRows();
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

export async function DELETE(request: NextRequest) {
  const access = await requireMenuAccess('obras');
  if (!access.ok) return access.response;

  try {
    const body = await request.json();
    const parsed = deleteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const rows = await loadPodaSheetRows();
    const rowsToDelete = rows.filter((row) =>
      parsed.data.rowNumbers.includes(row.rowNumber),
    );

    if (rowsToDelete.length !== parsed.data.rowNumbers.length) {
      return NextResponse.json(
        { error: 'Uno o más reclamos ya no existen en la planilla' },
        { status: 404 },
      );
    }

    for (const row of rowsToDelete) {
      tryDeletePodaImageFile(row.imagenURL);
    }

    await deletePodaSheetRows(parsed.data.rowNumbers);

    return NextResponse.json({
      success: true,
      deleted: parsed.data.rowNumbers.length,
    });
  } catch (error) {
    console.error('[reclamo/poda DELETE]', error);
    return NextResponse.json(
      { error: 'No se pudieron eliminar los reclamos de poda' },
      { status: 500 },
    );
  }
}
