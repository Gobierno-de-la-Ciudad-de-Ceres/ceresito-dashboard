export function normalizePodaImageUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed || trimmed === 'No') return null;

  // ceres-api sirve en /media/poda; el bot guardaba /api/media/poda por error
  return trimmed.replace('/api/media/poda/', '/media/poda/');
}

export function extractPodaImageFileName(url: string): string | null {
  const normalized = normalizePodaImageUrl(url) ?? url;
  const match = normalized.match(/\/media\/poda\/(file-\d+\.[a-z0-9]+)/i);
  return match?.[1] ?? null;
}

export function isValidPodaImageUrl(url?: string | null): url is string {
  const normalized = normalizePodaImageUrl(url);
  if (!normalized) return false;
  if (!normalized.startsWith('http')) return false;
  if (normalized.includes('/ERROR') || normalized.endsWith('/ERROR')) return false;
  return (
    /\/media\/poda\/file-\d+\.[a-z0-9]+/i.test(normalized) ||
    /\.(jpe?g|png|webp|gif)(\?.*)?$/i.test(normalized)
  );
}
