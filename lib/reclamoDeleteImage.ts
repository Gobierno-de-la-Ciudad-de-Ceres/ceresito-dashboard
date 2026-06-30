import fs from 'fs';
import path from 'path';

import { extractReclamoImageFileName } from '@/lib/reclamoImageUrl';

function getLocalReclamoDirs(): string[] {
  const candidates = [
    process.env.MEDIA_RECLAMOS_PATH,
    '/var/www/ceres-api/media/reclamos',
    '/root/ceres-api/media/reclamos',
    '/root/ceresito/src/media/reclamos',
    '/root/ceresito/base-ts-meta-postgres/src/media/reclamos',
    path.resolve(process.cwd(), '../ceres-api/media/reclamos'),
    path.resolve(process.cwd(), '../../ceres-api/media/reclamos'),
    path.resolve(process.cwd(), '../ceresito/src/media/reclamos'),
    path.resolve(process.cwd(), '../../ceresito/base-ts-meta-postgres/src/media/reclamos'),
  ].filter((value): value is string => Boolean(value));

  return [...new Set(candidates.map((dir) => path.resolve(dir)))];
}

export function tryDeleteReclamoImageFile(imageUrl?: string | null) {
  const fileName = imageUrl ? extractReclamoImageFileName(imageUrl) : null;
  if (!fileName) return false;

  let deleted = false;
  for (const dir of getLocalReclamoDirs()) {
    const filePath = path.join(dir, fileName);
    if (!fs.existsSync(filePath)) continue;
    fs.unlinkSync(filePath);
    deleted = true;
  }

  return deleted;
}
