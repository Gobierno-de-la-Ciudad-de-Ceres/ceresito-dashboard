import { NextResponse } from 'next/server';
import { isValidPodaImageUrl } from '@/lib/podaImageUrl';

export const dynamic = 'force-dynamic';

function extensionFromContentType(contentType: string | null): 'jpeg' | 'png' | 'gif' {
  if (contentType?.includes('png')) return 'png';
  if (contentType?.includes('gif')) return 'gif';
  return 'jpeg';
}

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get('url');

  if (!isValidPodaImageUrl(url)) {
    return NextResponse.json({ error: 'URL de imagen inválida' }, { status: 400 });
  }

  try {
    const response = await fetch(url!, { cache: 'no-store' });
    if (!response.ok) {
      return NextResponse.json({ error: 'No se pudo descargar la imagen' }, { status: 502 });
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const extension = extensionFromContentType(response.headers.get('content-type'));

    return NextResponse.json({
      base64: buffer.toString('base64'),
      extension,
    });
  } catch (error) {
    console.error('[poda/image] Error descargando imagen', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
