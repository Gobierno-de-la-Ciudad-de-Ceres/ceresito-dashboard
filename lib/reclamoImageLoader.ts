import fs from 'fs';
import path from 'path';

import {
  extractReclamoImageFileName,
  normalizeReclamoImageUrl,
} from '@/lib/reclamoImageUrl';

export type ReclamoImagePayload = {
  buffer: Buffer;
  extension: 'jpeg' | 'png' | 'gif' | 'webp';
};

function extensionFromFileName(fileName: string): ReclamoImagePayload['extension'] {
  const ext = path.extname(fileName).slice(1).toLowerCase();
  if (ext === 'png') return 'png';
  if (ext === 'gif') return 'gif';
  if (ext === 'webp') return 'webp';
  return 'jpeg';
}

function extensionFromContentType(contentType: string | null): ReclamoImagePayload['extension'] {
  if (contentType?.includes('png')) return 'png';
  if (contentType?.includes('gif')) return 'gif';
  if (contentType?.includes('webp')) return 'webp';
  return 'jpeg';
}

function getLocalReclamoDirs(): string[] {
  const candidates = [
    process.env.MEDIA_RECLAMOS_PATH,
    '/var/www/ceres-api/media/reclamos',
    '/root/ceres-api/media/reclamos',
    '/root/ceresito/src/media/reclamos',
    '/root/ceresito/media/reclamos',
    '/root/ceresito/base-ts-meta-postgres/src/media/reclamos',
    path.resolve(process.cwd(), '../ceres-api/media/reclamos'),
    path.resolve(process.cwd(), '../../ceres-api/media/reclamos'),
    path.resolve(process.cwd(), '../ceresito/src/media/reclamos'),
    path.resolve(process.cwd(), '../../ceresito/base-ts-meta-postgres/src/media/reclamos'),
  ].filter((value): value is string => Boolean(value));

  return [...new Set(candidates.map((dir) => path.resolve(dir)))];
}

function tryReadLocalImage(url: string): ReclamoImagePayload | null {
  const fileName = extractReclamoImageFileName(url);
  if (!fileName) return null;

  for (const dir of getLocalReclamoDirs()) {
    const filePath = path.join(dir, fileName);
    if (!fs.existsSync(filePath)) continue;
    return {
      buffer: fs.readFileSync(filePath),
      extension: extensionFromFileName(fileName),
    };
  }

  return null;
}

async function tryFetchRemoteImage(url: string): Promise<ReclamoImagePayload | null> {
  const candidates = [url];
  const alt = url.replace('/media/reclamos/', '/api/media/reclamos/');
  if (alt !== url) candidates.push(alt);

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate, { cache: 'no-store' });
      if (!response.ok) continue;
      return {
        buffer: Buffer.from(await response.arrayBuffer()),
        extension: extensionFromContentType(response.headers.get('content-type')),
      };
    } catch {
      // probar siguiente URL
    }
  }

  return null;
}

export async function loadReclamoImage(url: string): Promise<ReclamoImagePayload | null> {
  const normalized = normalizeReclamoImageUrl(url);
  if (!normalized) return null;

  return tryReadLocalImage(normalized) ?? (await tryFetchRemoteImage(normalized));
}

export function contentTypeForExtension(extension: ReclamoImagePayload['extension']): string {
  if (extension === 'png') return 'image/png';
  if (extension === 'gif') return 'image/gif';
  if (extension === 'webp') return 'image/webp';
  return 'image/jpeg';
}
