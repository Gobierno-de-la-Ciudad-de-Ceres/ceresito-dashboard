export function getTableroPhotoFilename(storedPath: string | null | undefined) {
  if (!storedPath) return null;

  const filename = storedPath.split("/").pop()?.trim();
  if (!filename || filename.includes("..")) return null;

  return filename;
}

/** URL del proxy del panel (vehiculos.ceres.gob.ar tiene Basic Auth). */
export function getVehiculosPhotoUrl(storedPath: string | null | undefined) {
  const filename = getTableroPhotoFilename(storedPath);
  if (!filename) return null;

  return `/api/vehiculos-policia/tablero-foto/${encodeURIComponent(filename)}`;
}
