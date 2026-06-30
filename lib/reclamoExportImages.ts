export type ReclamoExportImage = {
  base64: string;
  extension: 'jpeg' | 'png' | 'gif';
};

export async function fetchReclamoImageForExport(
  url: string,
): Promise<ReclamoExportImage | null> {
  try {
    const response = await fetch(
      `/api/reclamo/image?url=${encodeURIComponent(url)}`,
      { cache: 'no-store' },
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as ReclamoExportImage;
    if (!data?.base64 || !data?.extension) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export function toJsPdfImageFormat(
  extension: ReclamoExportImage['extension'],
): 'JPEG' | 'PNG' | 'GIF' {
  if (extension === 'png') return 'PNG';
  if (extension === 'gif') return 'GIF';
  return 'JPEG';
}
