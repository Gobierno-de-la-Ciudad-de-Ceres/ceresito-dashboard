import { NextResponse } from 'next/server';

import {
  contentTypeForExtension,
  loadReclamoImage,
} from '@/lib/reclamoImageLoader';
import { isValidReclamoImageUrl } from '@/lib/reclamoImageUrl';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const imageUrl = requestUrl.searchParams.get('url');
  const inline = requestUrl.searchParams.get('inline') === '1';

  if (!isValidReclamoImageUrl(imageUrl)) {
    return NextResponse.json({ error: 'URL de imagen inválida' }, { status: 400 });
  }

  try {
    const image = await loadReclamoImage(imageUrl);
    if (!image) {
      return NextResponse.json({ error: 'No se pudo cargar la imagen' }, { status: 404 });
    }

    if (inline) {
      return new NextResponse(image.buffer, {
        headers: {
          'Content-Type': contentTypeForExtension(image.extension),
          'Cache-Control': 'private, max-age=300',
        },
      });
    }

    return NextResponse.json({
      base64: image.buffer.toString('base64'),
      extension: image.extension === 'webp' ? 'jpeg' : image.extension,
    });
  } catch (error) {
    console.error('[reclamo/image] Error cargando imagen', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
