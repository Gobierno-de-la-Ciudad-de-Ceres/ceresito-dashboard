import { NextResponse } from "next/server";

import { planillaVehiculosPrisma } from "@/lib/planilla-vehiculos/prisma";
import { deleteTableroPhotoFile } from "@/lib/planilla-vehiculos/tablero-photo-server";
import { requireMenuAccess } from "@/lib/route-access";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const access = await requireMenuAccess("vehiculos");
  if (!access.ok) return access.response;

  try {
    const { id } = await context.params;
    const entrega = await planillaVehiculosPrisma.entregaVehiculo.findUnique({
      where: { id: Number(id) },
      include: { vehiculo: true },
    });

    if (!entrega) {
      return NextResponse.json({ error: "Planilla no encontrada" }, { status: 404 });
    }

    return NextResponse.json(entrega);
  } catch (error) {
    console.error("[vehiculos-policia/entregas/[id] GET]", error);
    return NextResponse.json(
      { error: "No se pudo obtener la planilla" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const access = await requireMenuAccess("vehiculos");
  if (!access.ok) return access.response;

  try {
    const { id } = await context.params;
    const entregaId = Number(id);

    if (!Number.isFinite(entregaId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const entrega = await planillaVehiculosPrisma.entregaVehiculo.findUnique({
      where: { id: entregaId },
    });

    if (!entrega) {
      return NextResponse.json({ error: "Planilla no encontrada" }, { status: 404 });
    }

    await Promise.all([
      deleteTableroPhotoFile(entrega.inicioFotoTablero),
      deleteTableroPhotoFile(entrega.finalFotoTablero),
    ]);

    await planillaVehiculosPrisma.entregaVehiculo.delete({
      where: { id: entregaId },
    });

    return NextResponse.json({ success: true, id: entregaId });
  } catch (error) {
    console.error("[vehiculos-policia/entregas/[id] DELETE]", error);
    return NextResponse.json(
      { error: "No se pudo eliminar la planilla" },
      { status: 500 },
    );
  }
}
