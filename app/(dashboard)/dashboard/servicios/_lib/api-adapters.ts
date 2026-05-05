/**
 * Adaptadores para transformar datos de la API al formato local
 * Convierte respuestas de la API en los tipos definidos en _types/index.ts
 */

import { Professional, ProfessionalDocumentation, Service, User } from '../_types';
import { APIProfessionalResponse, APIStatsResponse } from './api-client';

/**
 * Convierte una fecha string a objeto Date
 */
function parseDate(dateString: string | undefined): Date {
  if (!dateString) return new Date();
  return new Date(dateString);
}

/**
 * Adapta el usuario de la respuesta de la API
 */
export function adaptUser(apiUser: APIProfessionalResponse['user'], apiProfessional?: APIProfessionalResponse): User | undefined {
  if (!apiUser) {
    // Si no hay user anidado, intentar construir desde los datos del profesional
    if (!apiProfessional) return undefined;
    
    return {
      id: apiProfessional.userId,
      email: apiProfessional.email || '',
      firstName: apiProfessional.name?.split(' ')[0] || '',
      lastName: apiProfessional.name?.split(' ').slice(1).join(' ') || '',
      dni: undefined,
      phone: apiProfessional.phone,
      location: apiProfessional.location,
      role: 'professional',
      verified: apiProfessional.verified,
      whatsapp: apiProfessional.whatsapp,
      instagram: apiProfessional.instagram,
      facebook: apiProfessional.facebook,
      linkedin: apiProfessional.linkedin,
      website: apiProfessional.website,
      portfolio: apiProfessional.portfolio,
      cv: apiProfessional.CV,
      picture: apiProfessional.ProfilePicture,
      createdAt: parseDate(apiProfessional.createdAt),
      emailVerified: apiProfessional.verified,
    };
  }

  return {
    id: apiUser.id,
    email: apiUser.email,
    firstName: apiUser.firstName,
    lastName: apiUser.lastName,
    dni: apiUser.dni,
    phone: apiUser.phone,
    birthDate: apiUser.birthDate ? parseDate(apiUser.birthDate) : undefined,
    location: apiUser.location,
    role: 'professional',
    createdAt: apiUser.createdAt ? parseDate(apiUser.createdAt) : undefined,
    verified: apiUser.verified,
    // Información adicional de contacto desde el profesional
    whatsapp: apiProfessional?.whatsapp,
    instagram: apiProfessional?.instagram,
    facebook: apiProfessional?.facebook,
    linkedin: apiProfessional?.linkedin,
    website: apiProfessional?.website,
    portfolio: apiProfessional?.portfolio,
    cv: apiProfessional?.CV,
    picture: apiProfessional?.ProfilePicture,
    emailVerified: apiUser.verified,
  };
}

/**
 * Adapta un servicio de la respuesta de la API
 */
export function adaptService(apiService: APIProfessionalResponse['services'][0], professionalId: string): Service {
  return {
    id: apiService.id,
    professionalId: professionalId,
    categoryId: apiService.categoryId || '',
    categoryGroup: apiService.categoryGroup,
    title: apiService.title,
    description: apiService.description || '',
    priceRange: apiService.priceRange || 'A consultar',
    available: apiService.available !== undefined ? apiService.available : true,
    createdAt: apiService.createdAt ? parseDate(apiService.createdAt) : new Date(),
    updatedAt: apiService.updatedAt ? parseDate(apiService.updatedAt) : new Date(),
  };
}

/**
 * Adapta un profesional de la respuesta de la API
 */
export function adaptProfessional(apiProfessional: APIProfessionalResponse): Professional {
  const user = adaptUser(apiProfessional.user, apiProfessional);
  const documentation: ProfessionalDocumentation | undefined = apiProfessional.documentation
    ? {
        required: apiProfessional.documentation.required,
        criminalRecordPresent: apiProfessional.documentation.criminalRecordPresent,
        criminalRecordStatus: apiProfessional.documentation.criminalRecordStatus ?? null,
        criminalRecordReviewedAt: apiProfessional.documentation.criminalRecordReviewedAt ?? null,
        criminalRecordAdminNotes: apiProfessional.documentation.criminalRecordAdminNotes ?? null,
        hasLaborReferences: apiProfessional.documentation.hasLaborReferences,
        criminalRecord: apiProfessional.documentation.criminalRecord
          ? {
              objectKey: apiProfessional.documentation.criminalRecord.objectKey,
              fileName: apiProfessional.documentation.criminalRecord.fileName,
              downloadPath: apiProfessional.documentation.criminalRecord.downloadPath,
            }
          : null,
        laborReferences: (apiProfessional.documentation.laborReferences || []).map((reference) => ({
          id: reference.id,
          name: reference.name,
          company: reference.company,
          contact: reference.contact,
          attachment: reference.attachment
            ? {
                objectKey: reference.attachment.objectKey,
                fileName: reference.attachment.fileName,
                downloadPath: reference.attachment.downloadPath,
              }
            : null,
        })),
      }
    : undefined;
  
  const services = apiProfessional.services?.map(service => 
    adaptService(service, apiProfessional.id)
  ) || [];

  return {
    id: apiProfessional.id,
    userId: apiProfessional.userId,
    user: user,
    professionalGroup: apiProfessional.professionalGroup,
    location: apiProfessional.location || apiProfessional.serviceLocations?.[0],
    serviceLocations: apiProfessional.serviceLocations || [],
    bio: apiProfessional.bio || '',
    experienceYears: apiProfessional.experienceYears || 0,
    verified: apiProfessional.verified,
    certified: Boolean(apiProfessional.certified),
    status: apiProfessional.status,
    documentationRequired: apiProfessional.documentationRequired,
    criminalRecordPresent: apiProfessional.criminalRecordPresent,
    hasLaborReferences: apiProfessional.hasLaborReferences,
    rating: apiProfessional.rating || 0,
    reviewCount: apiProfessional.reviewCount || apiProfessional._count?.reviews || 0,
    contactRequestsCount: apiProfessional._count?.contactRequests || 0,
    createdAt: parseDate(apiProfessional.createdAt),
    updatedAt: parseDate(apiProfessional.updatedAt),
    documentation,
    services: services,
    registrationType: apiProfessional.registrationType, // Preservar el tipo de registro
  };
}

/**
 * Adapta una lista de profesionales
 */
export function adaptProfessionals(apiProfessionals: APIProfessionalResponse[]): Professional[] {
  return apiProfessionals.map(adaptProfessional);
}

/**
 * Adapta las estadísticas del dashboard
 */
export function adaptDashboardStats(apiStats: APIStatsResponse) {
  const topCategories = (apiStats.topCategories || []).map((item) => {
    const rawCount = (item as any).count;
    const countValue =
      typeof rawCount === "number"
        ? rawCount
        : typeof rawCount === "object" && rawCount !== null
          ? Number((rawCount as Record<string, unknown>).categoryId || 0)
          : 0;

    return {
      category: item.category?.name || "Sin categoria",
      count: Number.isFinite(countValue) ? countValue : 0,
    };
  });

  return {
    totalProfessionals: apiStats.overview.totalProfessionals,
    activeProfessionals: apiStats.overview.activeProfessionals,
    pendingProfessionals: apiStats.overview.pendingProfessionals,
    suspendedProfessionals: apiStats.overview.suspendedProfessionals,
    totalServices: apiStats.overview.totalServices,
    totalUsers: apiStats.overview.totalUsers,
    totalContactRequests: apiStats.overview.totalContactRequests,
    totalReviews: apiStats.overview.totalReviews,
    totalBugReports: apiStats.overview.totalBugReports,
    openBugReports: apiStats.overview.openBugReports,
    activeLocations: apiStats.overview.activeLocations,
    growth: {
      newProfessionalsThisWeek: apiStats.growth.newProfessionalsThisWeek,
      newProfessionalsThisMonth: apiStats.growth.newProfessionalsThisMonth,
      newUsersThisWeek: apiStats.growth.newUsersThisWeek,
      newUsersThisMonth: apiStats.growth.newUsersThisMonth,
      newServicesThisMonth: apiStats.growth.newServicesThisMonth,
    },
    professionalsByCategory: apiStats.categoryDistribution.map(item => ({
      category: item.category === 'oficios' ? 'Oficios' : 'Profesiones',
      count: item.count,
    })),
    professionalsByLocation: apiStats.geographicDistribution.map(item => ({
      location: item.location,
      count: item.count,
    })),
    topCategories,
    bugReportsBySeverity: apiStats.bugReportsBySeverity || [],
    contactRequestsByStatus: apiStats.contactRequestsByStatus || [],
    monthlyRegistrations: [],
  };
}

/**
 * Prepara los datos de un profesional para enviar a la API
 * Transforma del formato local al formato esperado por la API
 */
export function prepareUpdateProfessionalData(formData: any) {
  const data: any = {};

  // Datos del usuario
  if (formData.firstName || formData.lastName || formData.email || formData.phone || formData.birthDate || formData.location) {
    data.user = {};
    if (formData.firstName) data.user.firstName = formData.firstName;
    if (formData.lastName) data.user.lastName = formData.lastName;
    if (formData.email) data.user.email = formData.email;
    if (formData.phone) data.user.phone = formData.phone;
    if (formData.birthDate) data.user.birthDate = formData.birthDate;
    if (formData.location) data.user.location = formData.location;
  }

  // Datos del profesional
  if (formData.bio !== undefined) data.bio = formData.bio;
  if (formData.experienceYears !== undefined) data.experienceYears = formData.experienceYears;
  if (formData.professionalGroup) data.professionalGroup = formData.professionalGroup;
  if (formData.whatsapp) data.whatsapp = formData.whatsapp;
  if (formData.instagram) data.instagram = formData.instagram;
  if (formData.facebook) data.facebook = formData.facebook;
  if (formData.linkedin) data.linkedin = formData.linkedin;
  if (formData.website) data.website = formData.website;
  if (formData.portfolio) data.portfolio = formData.portfolio;
  if (formData.location) data.location = formData.location;
  if (formData.serviceLocations) data.serviceLocations = formData.serviceLocations;
  if (formData.verified !== undefined) data.verified = formData.verified;
  if (formData.certified !== undefined) data.certified = formData.certified;

  return data;
}
