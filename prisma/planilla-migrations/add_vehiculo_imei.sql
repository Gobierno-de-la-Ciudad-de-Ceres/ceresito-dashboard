-- Ejecutar contra la base de planilla de vehículos (PLANILLA_VEHICULOS_DATABASE_URL)
ALTER TABLE "Vehiculo" ADD COLUMN IF NOT EXISTS "imei" TEXT;
