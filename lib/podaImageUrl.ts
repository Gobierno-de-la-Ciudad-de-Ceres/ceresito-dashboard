export function isValidPodaImageUrl(url?: string | null): url is string {
  if (!url || typeof url !== 'string') return false;
  if (!url.startsWith('http')) return false;
  if (url.includes('/ERROR') || url.endsWith('/ERROR')) return false;
  if (url === 'No') return false;
  return (
    /\/media\/poda\/file-\d+\.[a-z0-9]+/i.test(url) ||
    /\.(jpe?g|png|webp|gif)(\?.*)?$/i.test(url)
  );
}
