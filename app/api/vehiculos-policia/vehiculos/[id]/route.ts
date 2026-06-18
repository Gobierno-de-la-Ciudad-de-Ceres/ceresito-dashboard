import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { planillaVehiculosPrisma } from "@/lib/planilla-vehiculos/prisma";
import { requireMenuAccess } from "@/lib/route-access";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const patchSchema = z.object({
  activo: z.boolean().optional(),
  tipo: z.string().min(3).max(200).optional(),
});

export async function PATCH(request: NextRequest, context: RouteContext) {
  const access = await requireMenuAccess("vehiculos");
  if (!access.ok) return access.response;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const vehiculo = await planillaVehiculosPrisma.vehiculo.update({
      where: { id: Number(id) },
      data: parsed.data,
    });

    return NextResponse.json(vehiculo);
  } catch (error) {
    console.error("[vehiculos-policia/vehiculos/[id] PATCH]", error);
    return NextResponse.json(
      { error: "No se pudo actualizar el vehículo" },
      { status: 500 },
    );
  }
}
