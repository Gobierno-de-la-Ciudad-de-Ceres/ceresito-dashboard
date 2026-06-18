import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed de roles y usuario admin...");

  // 1. Crear roles con permisos
  console.log("📝 Creando roles con permisos...");

  // Rol Admin - Todos los permisos
  const adminRole = await prisma.role.upsert({
    where: { name: "Admin" },
    update: {
      menuPermissions: [
        "panel",
        "qr",
        "obras",
        "encuestas",
        "servicios",
        "vehiculos",
        "ceresito",
        "ajustes",
        "salir",
      ],
    },
    create: {
      name: "Admin",
      menuPermissions: [
        "panel",
        "qr",
        "obras",
        "encuestas",
        "servicios",
        "vehiculos",
        "ceresito",
        "ajustes",
        "salir",
      ],
    },
  });
  console.log("✅ Rol Admin creado/actualizado:", adminRole);

  // Rol Moderador - Acceso a la mayoría de secciones excepto ajustes
  const moderadorRole = await prisma.role.upsert({
    where: { name: "Moderador" },
    update: {
      menuPermissions: [
        "panel",
        "obras",
        "encuestas",
        "servicios",
        "ceresito",
        "salir",
      ],
    },
    create: {
      name: "Moderador",
      menuPermissions: [
        "panel",
        "obras",
        "encuestas",
        "servicios",
        "ceresito",
        "salir",
      ],
    },
  });
  console.log("✅ Rol Moderador creado/actualizado:", moderadorRole);

  // Rol Operador - Solo acceso a operaciones básicas
  const operadorRole = await prisma.role.upsert({
    where: { name: "Operador" },
    update: {
      menuPermissions: ["panel", "obras", "salir"],
    },
    create: {
      name: "Operador",
      menuPermissions: ["panel", "obras", "salir"],
    },
  });
  console.log("✅ Rol Operador creado/actualizado:", operadorRole);

  // Rol Visualizador - Solo lectura de dashboard
  const visualizadorRole = await prisma.role.upsert({
    where: { name: "Visualizador" },
    update: {
      menuPermissions: ["panel", "salir"],
    },
    create: {
      name: "Visualizador",
      menuPermissions: ["panel", "salir"],
    },
  });
  console.log("✅ Rol Visualizador creado/actualizado:", visualizadorRole);

  // 2. Asignar rol Admin al usuario comunicacion@ceres.gob.ar
  console.log(
    "\n👤 Asignando rol Admin al usuario comunicacion@ceres.gob.ar...",
  );

  const comunicacionEmail = "comunicacion@ceres.gob.ar";

  const comunicacionUser = await prisma.user.findUnique({
    where: { email: comunicacionEmail },
    include: { role: true },
  });

  if (comunicacionUser) {
    const updatedUser = await prisma.user.update({
      where: { id: comunicacionUser.id },
      data: {
        roleId: adminRole.id,
      },
      include: { role: true },
    });

    console.log("✅ Rol Admin asignado a comunicacion@ceres.gob.ar:", {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      rolAnterior: comunicacionUser.role.name,
      rolNuevo: updatedUser.role.name,
    });
  } else {
    console.log("⚠️  Usuario comunicacion@ceres.gob.ar no encontrado.");
    console.log(
      "   Por favor, crea este usuario primero o usa otro email existente.",
    );
  }

  // 3. Actualizar roles existentes sin menuPermissions
  console.log("\n🔄 Actualizando roles existentes sin permisos...");

  const allRoles = await prisma.role.findMany();
  const rolesWithoutPermissions = allRoles.filter(
    (role) => !role.menuPermissions || role.menuPermissions.length === 0,
  );

  for (const role of rolesWithoutPermissions) {
    // Asignar permisos básicos a roles sin permisos
    await prisma.role.update({
      where: { id: role.id },
      data: {
        menuPermissions: ["panel", "salir"], // Permisos mínimos
      },
    });
    console.log(`✅ Permisos básicos asignados al rol: ${role.name}`);
  }

  console.log("\n✨ Seed completado exitosamente!");
  console.log("\n📋 Resumen:");
  console.log(
    `   - Roles creados/actualizados: 4 (Admin, Moderador, Operador, Visualizador)`,
  );
  console.log(
    `   - Usuario comunicacion@ceres.gob.ar: ${
      comunicacionUser ? "actualizado con rol Admin" : "no encontrado"
    }`,
  );
  console.log(
    `   - Roles sin permisos actualizados: ${rolesWithoutPermissions.length}`,
  );
}

main()
  .catch((e) => {
    console.error("❌ Error ejecutando seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
