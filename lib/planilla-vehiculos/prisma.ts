import { PrismaClient } from "@/generated/planilla-vehiculos";

const globalForPlanilla = globalThis as unknown as {
  planillaVehiculosPrisma: PrismaClient | undefined;
};

export const planillaVehiculosPrisma =
  globalForPlanilla.planillaVehiculosPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPlanilla.planillaVehiculosPrisma = planillaVehiculosPrisma;
}
