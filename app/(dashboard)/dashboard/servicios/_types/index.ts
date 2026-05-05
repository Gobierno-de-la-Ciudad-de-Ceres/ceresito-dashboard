import { CategoryGroup } from "@/types";

export type Area = {
  id: string;
  name: string;
  slug: string;
  group: CategoryGroup;
  image?: string;
};

export type Subcategory = {
  id: string;
  name: string;
  slug: string;
  group: CategoryGroup;
  areaSlug?: string; 
  image?: string;
};

export type Location = {
  id: string;
  name: string;
};

export const GROUPS: { id: CategoryGroup; name: string }[] = [
  { id: "oficios", name: "Oficios" },
  { id: "profesiones", name: "Profesiones" },
];

export type Gender = {
  id: string;
  name: string;
};

// Áreas (solo aplican a Oficios)
export const AREAS_OFICIOS: Area[] = [
  { id: "area-construccion-mantenimiento", name: "Construcción y mantenimiento", slug: "construccion-mantenimiento", group: "oficios", image: "/images/servicios/construccion.jpg" },
  { id: "area-climatizacion", name: "Climatización", slug: "climatizacion", group: "oficios", image: "/images/servicios/climatizacion.jpg" },
  { id: "area-servicios-electronicos", name: "Servicios técnicos electrónicos", slug: "servicios-electronicos", group: "oficios", image: "/images/servicios/electricista.webp" },
  { id: "area-automotores", name: "Automotores", slug: "automotores", group: "oficios", image: "/images/servicios/automotores.jpg" },
  { id: "area-jardineria", name: "Jardinería", slug: "jardineria", group: "oficios", image: "/images/servicios/jardineria.jpg" },
  { id: "area-cocina", name: "Cocina", slug: "cocina", group: "oficios", image: "/images/servicios/cocina.jpg" },
  { id: "area-cuidados", name: "Cuidados", slug: "cuidados", group: "oficios", image: "/images/servicios/cuidados.jpg" },
  { id: "area-fletes-mudanzas", name: "Fletes y mudanzas", slug: "fletes-mudanzas", group: "oficios", image: "/images/servicios/fletes-mudanzas.jpg" },
  { id: "area-limpieza", name: "Limpieza", slug: "limpieza", group: "oficios", image: "/images/servicios/limpieza.jpg" },
  { id: "area-cerrajeria", name: "Cerrajería", slug: "cerrajeria", group: "oficios", image: "/images/servicios/cerrajeria.jpg" },
  { id: "area-costura", name: "Costura", slug: "costura", group: "oficios", image: "/images/servicios/costura.jpg" },
];

// Subcategorías de Oficios
export const SUBCATEGORIES_OFICIOS: Subcategory[] = [
  // Construcción y mantenimiento
  { id: "plomero", name: "Plomero/a", slug: "plomero", group: "oficios", areaSlug: "construccion-mantenimiento" },
  { id: "electricista", name: "Electricista", slug: "electricista", group: "oficios", areaSlug: "construccion-mantenimiento" },
  { id: "albanil", name: "Albañil", slug: "albanil", group: "oficios", areaSlug: "construccion-mantenimiento" },
  { id: "gasista", name: "Gasista", slug: "gasista", group: "oficios", areaSlug: "construccion-mantenimiento" },
  { id: "pintor-obra", name: "Pintor de obra", slug: "pintor-obra", group: "oficios", areaSlug: "construccion-mantenimiento" },
  { id: "carpintero", name: "Carpintero/a", slug: "carpintero", group: "oficios", areaSlug: "construccion-mantenimiento" },
  { id: "herrero", name: "Herrero/a", slug: "herrero", group: "oficios", areaSlug: "construccion-mantenimiento" },
  { id: "yesero", name: "Yesero", slug: "yesero", group: "oficios", areaSlug: "construccion-mantenimiento" },
  { id: "techista", name: "Techista", slug: "techista", group: "oficios", areaSlug: "construccion-mantenimiento" },

  // Climatización
  { id: "tecnico-aires", name: "Técnico en aires acondicionados", slug: "tecnico-aires", group: "oficios", areaSlug: "climatizacion" },
  { id: "refrigeracion", name: "Refrigeración comercial y hogareña", slug: "refrigeracion", group: "oficios", areaSlug: "climatizacion" },

  // Servicios técnicos electrónicos
  { id: "reparador-electrodomesticos", name: "Reparador de electrodomésticos", slug: "reparador-electrodomesticos", group: "oficios", areaSlug: "servicios-electronicos" },
  { id: "tecnico-celulares", name: "Técnico en celulares y tablets", slug: "tecnico-celulares", group: "oficios", areaSlug: "servicios-electronicos" },

  // Automotores
  { id: "mecanico-automotriz", name: "Mecánico automotriz", slug: "mecanico-automotriz", group: "oficios", areaSlug: "automotores" },
  { id: "mecanico-motos", name: "Mecánico de motos", slug: "mecanico-motos", group: "oficios", areaSlug: "automotores" },
  { id: "chapista", name: "Chapista", slug: "chapista", group: "oficios", areaSlug: "automotores" },
  { id: "gomero", name: "Gomería", slug: "gomero", group: "oficios", areaSlug: "automotores" },

  // Jardinería
  { id: "jardinero", name: "Jardinero/a", slug: "jardinero", group: "oficios", areaSlug: "jardineria" },
  { id: "paisajista", name: "Paisajista", slug: "paisajista", group: "oficios", areaSlug: "jardineria" },

  // Cocina
  { id: "pasteleria", name: "Pastelería", slug: "pasteleria", group: "oficios", areaSlug: "cocina" },
  { id: "panificados", name: "Panificados", slug: "panificados", group: "oficios", areaSlug: "cocina" },

  // Cuidados
  { id: "promotores-gerontologicos", name: "Promotores gerontológicos", slug: "promotores-gerontologicos", group: "oficios", areaSlug: "cuidados" },
  { id: "ninera", name: "Niñera", slug: "ninera", group: "oficios", areaSlug: "cuidados" },

  // Fletes y mudanzas (área sin subcategorías adicionales)
  { id: "fletes-mudanzas", name: "Fletes y mudanzas", slug: "fletes-mudanzas", group: "oficios", areaSlug: "fletes-mudanzas" },

  // Limpieza
  { id: "limpieza", name: "Limpieza", slug: "limpieza", group: "oficios", areaSlug: "limpieza" },

  // Cerrajería
  { id: "cerrajero", name: "Cerrajeros", slug: "cerrajero", group: "oficios", areaSlug: "cerrajeria" },

  // Costura
  { id: "costurera", name: "Costurera", slug: "costurera", group: "oficios", areaSlug: "costura" },
];

// Subcategorías de Profesiones
export const SUBCATEGORIES_PROFESIONES: Subcategory[] = [
  { id: "enfermeria", name: "Enfermería", slug: "enfermeria", group: "profesiones", image: "/images/profesionales/enfermeria.jpg" },
  { id: "arquitectura", name: "Arquitectura", slug: "arquitectura", group: "profesiones", image: "/images/profesionales/arquitectura.jpg" },
  { id: "marketing", name: "Marketing", slug: "marketing", group: "profesiones", image: "/images/profesionales/marketing.png" },
  { id: "abogacia", name: "Abogacía", slug: "abogacia", group: "profesiones", image: "/images/profesionales/abogacia.jpg" },
  { id: "contaduria", name: "Contaduría", slug: "contaduria", group: "profesiones", image: "/images/profesionales/contaduria.jpg" },
  { id: "entrenadores-fisicos", name: "Entrenadores físicos", slug: "entrenadores-fisicos", group: "profesiones", image: "/images/profesionales/entrenadores-fisicos.jpg" },
];

export const LOCATIONS: Location[] = [
  { id: "ceres", name: "Ceres, Santa Fe, Argentina" },
  { id: "hersilia", name: "Hersilia, Santa Fe, Argentina" },
  { id: "ambrosetti", name: "Ambrosetti, Santa Fe, Argentina" },
  { id: "larubia", name: "La Rubia, Santa Fe, Argentina" },
  { id: "arrufo", name: "Arrufó, Santa Fe, Argentina", },
  { id: "san-cristobal", name: "San Cristóbal, Santa Fe, Argentina" },
  { id: "san-guillermo", name: "San Guillermo, Santa Fe, Argentina" },
  { id: "suardi", name: "Suardi, Santa Fe, Argentina" },   
  { id: "otra", name: "Otra" },
];

export const GENDERS: Gender[] = [
  { id: "male", name: "Masculino" },
  { id: "female", name: "Femenino" },
  { id: "other", name: "Otro" },
];

export function getAreasByGroup(group: CategoryGroup): Area[] {
  return group === "oficios" ? AREAS_OFICIOS : [];
}

export function getSubcategories(group: CategoryGroup, areaSlug?: string): Subcategory[] {
  if (group === "oficios") {
    return SUBCATEGORIES_OFICIOS.filter((s) => !areaSlug || s.areaSlug === areaSlug);
  }
  return SUBCATEGORIES_PROFESIONES;
}

export function getLocations(): Location[] {
  return LOCATIONS;
}

export function getGenders(): Gender[] {
  return GENDERS;
}

// Tipos principales para la plataforma de servicios

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name?: string; // Para compatibilidad con NextAuth
  dni?: string;
  phone?: string;
  birthDate?: Date;
  location?: string;
  role?: 'citizen' | 'professional' | 'admin';
  createdAt?: Date;
  verified?: boolean;
  // Información adicional de contacto
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  website?: string;
  portfolio?: string;
  cv?: string;
  picture?: string;
  emailVerified?: boolean;
}

export interface PrivateDocumentFile {
  objectKey?: string;
  fileName: string;
  downloadPath?: string;
}

export interface LaborReference {
  id: string;
  name: string;
  company: string;
  contact: string;
  attachment?: PrivateDocumentFile | null;
}

export interface ProfessionalDocumentation {
  required?: boolean;
  criminalRecordPresent?: boolean;
  criminalRecordStatus?: 'pending' | 'approved' | 'rejected' | null;
  criminalRecordReviewedAt?: string | null;
  criminalRecordAdminNotes?: string | null;
  hasLaborReferences?: boolean;
  criminalRecord?: PrivateDocumentFile | null;
  laborReferences?: LaborReference[];
}

// Jerarquía de categorías: grupos principales y subcategorías
export type CategoryGroup = 'oficios' | 'profesiones';

export interface CategoryGroupMeta {
  id: CategoryGroup;
  name: string; // Ej: "Oficios", "Profesiones"
  slug: CategoryGroup; // para rutas: /oficios, /profesiones
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  slug: string;
  active: boolean;
  backgroundUrl?: string;
  // Nuevo: a qué grupo pertenece esta categoría (oficios o profesiones)
  group: CategoryGroup;
  // Opcional: subcategoría padre si modelamos niveles adicionales (p.ej. Construcción y mantenimiento)
  parentCategoryId?: string;
}

export interface Professional {
  id: string;
  userId: string;
  user?: User;
  professionalGroup?: CategoryGroup;
  location?: string; // ubicación textual (ej: "Ceres")
  serviceLocations?: string[];
  bio: string;
  experienceYears: number;
  verified: boolean;
  certified: boolean; // Nuevo: si sus servicios están certificados
  status: 'pending' | 'active' | 'suspended';
  documentationRequired?: boolean;
  criminalRecordPresent?: boolean;
  hasLaborReferences?: boolean;
  rating: number;
  reviewCount: number;
  contactRequestsCount?: number;
  registrationType?: 'email' | 'google' | 'facebook'; // Cómo se registró el profesional
  createdAt: Date;
  updatedAt: Date;
  documentation?: ProfessionalDocumentation;
  services?: Service[]; // para vistas que incluyen servicios
}

export interface Service {
  id: string;
  professionalId: string;
  professional?: Professional;
  // Soporta subcategorías: mantener categoryId como hoja
  categoryId: string;
  category?: Category;
  // Redundante/denormalizado para facilitar filtros rápidos por grupo
  categoryGroup?: CategoryGroup;
  title: string;
  description: string;
  priceRange: string;
  available: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  professionalId: string;
  professional?: Professional;
  userId: string;
  user?: User;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface ContactRequest {
  id: string;
  professionalId: string;
  professional?: Professional;
  userId: string;
  user?: User;
  serviceId?: string;
  service?: Service;
  message: string;
  status: 'pending' | 'contacted' | 'closed';
  createdAt: Date;
}

// Tipos para formularios
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword?: string;
  phone?: string;
  birthDate?: string;
  location?: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  website?: string;
  portfolio?: string;
  cv?: string;
  picture?: string;
  role?: 'citizen' | 'professional';
  // Datos profesionales
  bio?: string;
  experienceYears?: number;
  professionalGroup?: CategoryGroup;
  services?: ServiceFormData[];
}

export interface ProfessionalFormData {
  bio: string;
  experienceYears: number;
  services: ServiceFormData[];
}

export interface ServiceFormData {
  categoryId: string;
  title: string;
  description: string;
}

export interface ContactFormData {
  message: string;
  serviceId?: string;
}

// Tipos para filtros y búsqueda
export interface ServiceFilters {
  categoryId?: string; // subcategoría concreta
  parentCategoryId?: string; // para agrupar bajo una subcategoría padre
  categoryGroup?: CategoryGroup; // 'oficios' | 'profesiones'
  search?: string;
  rating?: number;
  sortBy?: 'name' | 'rating' | 'recent';
}

// Tipos para respuestas de API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Capacitación / Formación
export interface Training {
  id: string;
  title: string;
  description: string;
  modality: 'presencial' | 'virtual' | 'mixta';
  startDate: Date;
  location: string;
  registrationUrl?: string;
  imageUrl?: string;
  tags?: string[];
}

// Soporte técnico
export interface SupportTicket {
  id: string;
  userId?: string;
  user?: User;
  type: 'bug' | 'feature' | 'support' | 'complaint' | 'suggestion';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedTo?: string;
  response?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

// Certificaciones de profesionales
export interface Certification {
  id: string;
  professionalId: string;
  professional?: Professional;
  certificationType: string;
  certificationNumber?: string | null;
  issuingOrganization?: string | null;
  issuedAt?: Date | null;
  expiresAt?: Date | null;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  adminNotes?: string | null;
  reviewedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  category?: Category | null;
}

export const SUPPORT_TYPES = [
  { id: 'bug', name: 'Error/Bug' },
  { id: 'feature', name: 'Nueva funcionalidad' },
  { id: 'support', name: 'Soporte técnico' },
  { id: 'complaint', name: 'Queja' },
  { id: 'suggestion', name: 'Sugerencia' },
];

export const SUPPORT_PRIORITIES = [
  { id: 'low', name: 'Baja', color: 'bg-gray-500' },
  { id: 'medium', name: 'Media', color: 'bg-blue-500' },
  { id: 'high', name: 'Alta', color: 'bg-orange-500' },
  { id: 'urgent', name: 'Urgente', color: 'bg-red-500' },
];
