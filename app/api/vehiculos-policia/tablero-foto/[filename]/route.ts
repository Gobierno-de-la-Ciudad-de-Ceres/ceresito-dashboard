import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

import { requireMenuAccess } from "@/lib/route-access";
import {
  getTableroPhotoFilename,
} from "@/lib/planilla-vehiculos/tablero-photo";
import { getTableroUploadDir } from "@/lib/planilla-vehiculos/tablero-photo-server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ filename: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const access = await requireMenuAccess("vehiculos");
  if (!access.ok) return access.response;

  try {
    const { filename: rawFilename } = await context.params;
    const filename = getTableroPhotoFilename(decodeURIComponent(rawFilename));

    if (!filename) {
      return NextResponse.json({ error: "Archivo inválido" }, { status: 400 });
    }

    const filePath = path.join(getTableroUploadDir(), filename);
    const buffer = await readFile(filePath);

    const jpegBuffer = await sharp(buffer, { failOn: "none" })
      .rotate()
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();

    return new NextResponse(new Uint8Array(jpegBuffer), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[vehiculos-policia/tablero-foto GET]", error);
    return NextResponse.json({ error: "Foto no encontrada" }, { status: 404 });
  }
}
