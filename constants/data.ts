import {
  LayoutDashboard,
  Bot,
  LogOut,
  Building,
  QrCode,
  Settings,
  ClipboardList,
  Briefcase,
  Car,
} from "lucide-react";

export const navItems = {
  NavMain: [
    {
      id: "panel",
      title: "Panel",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "qr",
      title: "QR",
      url: "/dashboard/qr",
      icon: QrCode,
    },
    {
      id: "obras",
      title: "Obras",
      url: "/dashboard/obras",
      icon: Building,
      items: [
        {
          title: "Reclamos",
          url: "/dashboard/reclamos",
        },
        {
          title: "Cuadrillas",
          url: "/dashboard/cuadrillas",
        },
        {
          title: "Mapa",
          url: "/dashboard/mapa",
        },
        {
          title: "Poda",
          url: "/dashboard/reclamos/poda",
        },
      ],
    },
    {
      id: "encuestas",
      title: "Encuestas",
      url: "/dashboard/encuestas",
      icon: ClipboardList,
      items: [
        {
          title: "Estadisticas",
          url: "/dashboard/encuestas",
        },
        {
          title: "Todas las encuestas",
          url: "/dashboard/encuestas",
        },
      ],
    },
    {
      id: "servicios",
      title: "Plataforma de Servicios",
      url: "/dashboard/servicios",
      icon: Briefcase,
      items: [
        {
          title: "Dashboard",
          url: "/dashboard/servicios",
        },
        {
          title: "Profesionales",
          url: "/dashboard/servicios/profesionales",
        },
        {
          title: "Certificaciones",
          url: "/dashboard/servicios/certificaciones",
        },
        {
          title: "Usuarios",
          url: "/dashboard/servicios/usuarios",
        },
        {
          title: "Categorias",
          url: "/dashboard/servicios/categorias",
        },
        {
          title: "Logs",
          url: "/dashboard/servicios/logs",
        },
        {
          title: "Bug Reports",
          url: "/dashboard/servicios/bug-reports",
        },
        {
          title: "Soporte",
          url: "/dashboard/servicios/solicitudes",
        },
      ],
    },
    {
      id: "vehiculos",
      title: "Vehículos Policía Municipal",
      url: "/dashboard/vehiculos-policia-municipal/historial",
      icon: Car,
      items: [
        {
          title: "Historial",
          url: "/dashboard/vehiculos-policia-municipal/historial",
        },
        {
          title: "Patentes",
          url: "/dashboard/vehiculos-policia-municipal/patentes",
        },
      ],
    },
    {
      id: "ceresito",
      title: "Ceresito",
      url: "/dashboard/ceresito",
      icon: Bot,
      items: [
        {
          title: "Estadisticas",
          url: "/dashboard/ceresito",
        },
        {
          title: "Mensajes de bienvenida",
          url: "/dashboard/ceresito/mensajes-bienvenida",
        },
        {
          title: "Farmacias de turno",
          url: "/dashboard/ceresito/farmacias-turno",
        },
        {
          title: "Flujos No-Code",
          url: "/dashboard/ceresito/flows",
        },
        {
          title: "Contactos",
          url: "/dashboard/contacts",
        },
        {
          title: "Bot Observabilidad",
          url: "/dashboard/ceresito/observabilidad",
        },
      ],
    },
    {
      id: "ajustes",
      title: "Ajustes",
      url: "/dashboard/settings",
      icon: Settings,
    },
    {
      id: "salir",
      title: "Salir",
      url: "/",
      icon: LogOut,
    },
  ],
};
