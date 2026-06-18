import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const JEFE_ROLE_NAME = "Jefe Inspectores Vehículos";
const JEFE_EMAIL = "gobierno@ceres.gob.ar";
const JEFE_USERNAME = "federico.uberti";
const TEMP_PASSWORD = "CeresVehiculos2026!";

async function main() {
  console.log("Creando rol y usuario jefe de inspectores...");

  const jefeRole = await prisma.role.upsert({
    where: { name: JEFE_ROLE_NAME },
    update: {
      menuPermissions: ["vehiculos", "salir"],
    },
    create: {
      name: JEFE_ROLE_NAME,
      menuPermissions: ["vehiculos", "salir"],
    },
  });

  const hashedPassword = await bcrypt.hash(TEMP_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: JEFE_EMAIL },
    update: {
      username: JEFE_USERNAME,
      roleId: jefeRole.id,
      password: hashedPassword,
    },
    create: {
      email: JEFE_EMAIL,
      username: JEFE_USERNAME,
      password: hashedPassword,
      roleId: jefeRole.id,
    },
  });

  const adminRole = await prisma.role.findUnique({ where: { name: "Admin" } });
  if (adminRole && !adminRole.menuPermissions.includes("vehiculos")) {
    await prisma.role.update({
      where: { id: adminRole.id },
      data: {
        menuPermissions: [...adminRole.menuPermissions, "vehiculos"],
      },
    });
    console.log("Permiso vehiculos agregado al rol Admin");
  }

  console.log("Listo:");
  console.log(`  Rol: ${jefeRole.name} (id ${jefeRole.id})`);
  console.log(`  Usuario: ${user.email} / ${JEFE_USERNAME}`);
  console.log(`  Contraseña temporal: ${TEMP_PASSWORD}`);
  console.log("  (Pedile a Federico que la cambie cuando tenga acceso a Ajustes o reseteala vos)");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
