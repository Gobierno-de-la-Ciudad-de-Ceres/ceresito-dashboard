import { unlink } from "fs/promises";
import path from "path";

import { getTableroPhotoFilename } from "@/lib/planilla-vehiculos/tablero-photo";

export function getTableroUploadDir() {
  const configured = process.env.PLANILLA_VEHICULOS_UPLOAD_DIR?.trim();
  if (configured) {
    return configured;
  }

  return path.join(
    process.cwd(),
    "..",
    "..",
    "planilla-vehiculos-policia",
    "public",
    "uploads",
    "tableros",
  );
}

export async function deleteTableroPhotoFile(
  storedPath: string | null | undefined,
) {
  const filename = getTableroPhotoFilename(storedPath);
  if (!filename) return;

  try {
    await unlink(path.join(getTableroUploadDir(), filename));
  } catch {
    // El archivo puede no existir si ya fue borrado manualmente.
  }
}
