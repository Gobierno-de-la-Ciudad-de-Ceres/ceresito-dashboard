import fs from 'fs';
import path from 'path';

import {
  extractPodaImageFileName,
  normalizePodaImageUrl,
} from '@/lib/podaImageUrl';

export type PodaImagePayload = {
  buffer: Buffer;
  extension: 'jpeg' | 'png' | 'gif' | 'webp';
};

function extensionFromFileName(fileName: string): PodaImagePayload['extension'] {
  const ext = path.extname(fileName).slice(1).toLowerCase();
  if (ext === 'png') return 'png';
  if (ext === 'gif') return 'gif';
  if (ext === 'webp') return 'webp';
  return 'jpeg';
}

function extensionFromContentType(contentType: string | null): PodaImagePayload['extension'] {
  if (contentType?.includes('png')) return 'png';
  if (contentType?.includes('gif')) return 'gif';
  if (contentType?.includes('webp')) return 'webp';
  return 'jpeg';
}

function getLocalPodaDirs(): string[] {
  const candidates = [
    process.env.MEDIA_PODA_PATH,
    '/root/ceres-api/media/poda',
    '/root/ceresito/src/media/poda',
    '/root/ceresito/base-ts-meta-postgres/src/media/poda',
    path.resolve(process.cwd(), '../ceres-api/media/poda'),
    path.resolve(process.cwd(), '../../ceres-api/media/poda'),
    path.resolve(process.cwd(), '../ceresito/src/media/poda'),
    path.resolve(process.cwd(), '../../ceresito/src/media/poda'),
  ].filter((value): value is string => Boolean(value));

  return [...new Set(candidates.map((dir) => path.resolve(dir)))];
}

function tryReadLocalImage(url: string): PodaImagePayload | null {
  const fileName = extractPodaImageFileName(url);
  if (!fileName) return null;

  for (const dir of getLocalPodaDirs()) {
    const filePath = path.join(dir, fileName);
    if (!fs.existsSync(filePath)) continue;
    return {
      buffer: fs.readFileSync(filePath),
      extension: extensionFromFileName(fileName),
    };
  }

  return null;
}

async function tryFetchRemoteImage(url: string): Promise<PodaImagePayload | null> {
  const candidates = [url];
  const alt = url.replace('/media/poda/', '/api/media/poda/');
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

export async function loadPodaImage(url: string): Promise<PodaImagePayload | null> {
  const normalized = normalizePodaImageUrl(url);
  if (!normalized) return null;

  return tryReadLocalImage(normalized) ?? (await tryFetchRemoteImage(normalized));
}

export function contentTypeForExtension(extension: PodaImagePayload['extension']): string {
  if (extension === 'png') return 'image/png';
  if (extension === 'gif') return 'image/gif';
  if (extension === 'webp') return 'image/webp';
  return 'image/jpeg';
}
