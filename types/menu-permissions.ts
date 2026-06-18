export interface MenuSection {
  id: string;
  title: string;
  url: string;
}

export interface RolePermissions {
  roleId: number;
  roleName: string;
  menuPermissions: string[];
}

export const MENU_SECTIONS: MenuSection[] = [
  { id: "panel", title: "Panel", url: "/dashboard" },
  { id: "qr", title: "QR", url: "/dashboard/qr" },
  { id: "obras", title: "Obras", url: "/dashboard/obras" },
  { id: "encuestas", title: "Encuestas", url: "/dashboard/encuestas" },
  {
    id: "servicios",
    title: "Plataforma de Servicios",
    url: "/dashboard/servicios",
  },
  {
    id: "vehiculos",
    title: "Vehículos Policía Municipal",
    url: "/dashboard/vehiculos-policia-municipal/historial",
  },
  { id: "ceresito", title: "Ceresito", url: "/dashboard/ceresito" },
  { id: "ajustes", title: "Ajustes", url: "/dashboard/settings" },
  { id: "salir", title: "Salir", url: "/" },
];

export const DEFAULT_MENU_PERMISSIONS = ["panel", "salir"] as const;

export const MENU_SECTION_IDS = MENU_SECTIONS.map((section) => section.id);

const ROUTE_PERMISSION_MATCHERS: Array<{ prefix: string; permission: string }> =
  [
    { prefix: "/dashboard/settings", permission: "ajustes" },
    { prefix: "/dashboard/qr", permission: "qr" },
    { prefix: "/dashboard/obras", permission: "obras" },
    { prefix: "/dashboard/reclamos", permission: "obras" },
    { prefix: "/dashboard/reclamosold", permission: "obras" },
    { prefix: "/dashboard/cuadrillas", permission: "obras" },
    { prefix: "/dashboard/mapa", permission: "obras" },
    { prefix: "/cuadrillas", permission: "obras" },
    { prefix: "/dashboard/encuestas", permission: "encuestas" },
    { prefix: "/dashboard/servicios", permission: "servicios" },
    {
      prefix: "/dashboard/vehiculos-policia-municipal",
      permission: "vehiculos",
    },
    { prefix: "/dashboard/ceresito", permission: "ceresito" },
    { prefix: "/dashboard/contacts", permission: "ceresito" },
    { prefix: "/dashboard", permission: "panel" },
  ];

export function normalizeMenuPermissions(
  permissions?: string[] | null,
): string[] {
  const source =
    permissions && permissions.length > 0
      ? permissions
      : Array.from(DEFAULT_MENU_PERMISSIONS);

  return Array.from(
    new Set(
      source.filter((permission) => MENU_SECTION_IDS.includes(permission)),
    ),
  );
}

export function resolveMenuPermissionFromPath(pathname: string): string | null {
  const match = ROUTE_PERMISSION_MATCHERS.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  return match?.permission ?? null;
}

export function resolveDefaultDashboardPath(permissions?: string[] | null): string {
  const normalized = normalizeMenuPermissions(permissions);
  if (normalized.includes("panel")) return "/dashboard";

  const section = MENU_SECTIONS.find(
    (item) =>
      item.id !== "salir" &&
      item.id !== "ajustes" &&
      normalized.includes(item.id),
  );

  return section?.url ?? "/dashboard";
}
