export type PodaExportImage = {
  base64: string;
  extension: 'jpeg' | 'png' | 'gif';
};

export async function fetchPodaImageForExport(
  url: string,
): Promise<PodaExportImage | null> {
  try {
    const response = await fetch(
      `/api/reclamo/poda/image?url=${encodeURIComponent(url)}`,
      { cache: 'no-store' },
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as PodaExportImage;
    if (!data?.base64 || !data?.extension) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export function toJsPdfImageFormat(
  extension: PodaExportImage['extension'],
): 'JPEG' | 'PNG' | 'GIF' {
  if (extension === 'png') return 'PNG';
  if (extension === 'gif') return 'GIF';
  return 'JPEG';
}
