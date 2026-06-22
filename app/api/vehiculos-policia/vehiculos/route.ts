import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { planillaVehiculosPrisma } from "@/lib/planilla-vehiculos/prisma";
import { requireMenuAccess } from "@/lib/route-access";

export const dynamic = "force-dynamic";

const createVehiculoSchema = z.object({
  patente: z.string().min(4).max(12),
  tipo: z.string().min(3).max(200),
  imei: z.string().min(10).max(20).optional().nullable(),
});

export async function GET() {
  const access = await requireMenuAccess("vehiculos");
  if (!access.ok) return access.response;

  try {
    const vehiculos = await planillaVehiculosPrisma.vehiculo.findMany({
      orderBy: [{ activo: "desc" }, { patente: "asc" }],
    });

    return NextResponse.json(vehiculos);
  } catch (error) {
    console.error("[vehiculos-policia/vehiculos GET]", error);
    return NextResponse.json(
      { error: "No se pudieron obtener los vehículos" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const access = await requireMenuAccess("vehiculos");
  if (!access.ok) return access.response;

  try {
    const body = await request.json();
    const parsed = createVehiculoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const patente = parsed.data.patente.trim().toUpperCase();
    const tipo = parsed.data.tipo.trim();
    const imei = parsed.data.imei?.trim() || null;

    const vehiculo = await planillaVehiculosPrisma.vehiculo.upsert({
      where: { patente },
      update: { tipo, imei, activo: true },
      create: { patente, tipo, imei, activo: true },
    });

    return NextResponse.json(vehiculo, { status: 201 });
  } catch (error) {
    console.error("[vehiculos-policia/vehiculos POST]", error);
    return NextResponse.json(
      { error: "No se pudo crear el vehículo" },
      { status: 500 },
    );
  }
}
