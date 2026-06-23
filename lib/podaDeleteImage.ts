import fs from 'fs';
import path from 'path';

import { extractPodaImageFileName } from '@/lib/podaImageUrl';

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

export function tryDeletePodaImageFile(imageUrl?: string | null) {
  const fileName = imageUrl ? extractPodaImageFileName(imageUrl) : null;
  if (!fileName) return false;

  for (const dir of getLocalPodaDirs()) {
    const filePath = path.join(dir, fileName);
    if (!fs.existsSync(filePath)) continue;
    fs.unlinkSync(filePath);
    return true;
  }

  return false;
}
