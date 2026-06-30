export function normalizeReclamoImageUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed || trimmed === 'No') return null;

  if (trimmed.startsWith('/media/reclamos/')) {
    const base = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.ceres.gob.ar')
      .replace(/\/$/, '')
      .replace(/\/api$/, '');
    return `${base}${trimmed}`;
  }

  return trimmed.replace('/api/media/reclamos/', '/media/reclamos/');
}

export function extractReclamoImageFileName(url: string): string | null {
  const normalized = normalizeReclamoImageUrl(url) ?? url;
  const match = normalized.match(/\/media\/reclamos\/(file-\d+\.[a-z0-9]+)/i);
  return match?.[1] ?? null;
}

export function isValidReclamoImageUrl(url?: string | null): url is string {
  const normalized = normalizeReclamoImageUrl(url);
  if (!normalized) return false;
  if (!normalized.startsWith('http')) return false;
  if (normalized.includes('/ERROR') || normalized.endsWith('/ERROR')) return false;
  return (
    /\/media\/reclamos\/file-\d+\.[a-z0-9]+/i.test(normalized) ||
    /\.(jpe?g|png|webp|gif)(\?.*)?$/i.test(normalized)
  );
}
