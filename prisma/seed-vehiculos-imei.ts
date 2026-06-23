import { PrismaClient } from "../generated/planilla-vehiculos";

/**
 * IMEI DaGPS por patente (flota PM con rastreo).
 * Ejecutar en el VPS o local con PLANILLA_VEHICULOS_DATABASE_URL:
 *   npm run seed:vehiculos-imei
 */
const IMEI_BY_PATENTE: Record<string, string> = {
  // Inspectores
  AF814RE: "352672107311219", // Renault Kangoo
  A137KMV: "358878730156384", // Guerrero Trip 110 roja
  A122PWS: "358878730160238", // Honda Titan 150 roja
  A122PWR: "358878730159404", // Honda Titan 150 negra PM
  // Ojos en Alerta
  A126CJB: "352672107405557", // Honda Titan 150
  MMZ658: "352672107404378", // Volkswagen Vento
  A195WBX: "352672107296915", // Honda XR 150 blanca
  A195WBY: "352672107305815", // Honda XR 150 roja
};

const prisma = new PrismaClient();

async function main() {
  const entries = Object.entries(IMEI_BY_PATENTE);

  if (entries.length === 0) {
    console.log("No hay IMEI configurados en IMEI_BY_PATENTE.");
    return;
  }

  for (const [patente, imei] of entries) {
    const normalizedPatente = patente.trim().toUpperCase();
    const normalizedImei = imei.trim();

    const updated = await prisma.vehiculo.updateMany({
      where: { patente: normalizedPatente },
      data: { imei: normalizedImei },
    });

    if (updated.count === 0) {
      console.warn(`⚠️  No se encontró patente: ${normalizedPatente}`);
      continue;
    }

    console.log(`✓ ${normalizedPatente} → ${normalizedImei}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
