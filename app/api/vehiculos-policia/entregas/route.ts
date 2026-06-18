import { NextResponse } from "next/server";

import { planillaVehiculosPrisma } from "@/lib/planilla-vehiculos/prisma";
import { requireMenuAccess } from "@/lib/route-access";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await requireMenuAccess("vehiculos");
  if (!access.ok) return access.response;

  try {
    const entregas = await planillaVehiculosPrisma.entregaVehiculo.findMany({
      include: { vehiculo: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json(entregas);
  } catch (error) {
    console.error("[vehiculos-policia/entregas GET]", error);
    return NextResponse.json(
      { error: "No se pudieron obtener las entregas" },
      { status: 500 },
    );
  }
}
