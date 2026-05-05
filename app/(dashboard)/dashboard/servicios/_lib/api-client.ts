/**
 * Cliente para la API de Servicios
 */

// Configuración de la API
// En el cliente siempre usamos el proxy de Next.js para evitar problemas de CORS
// En el servidor podemos usar directamente la URL externa
const USE_PROXY = typeof window !== 'undefined'; // Solo usar proxy en el cliente
const API_BASE_URL = USE_PROXY 
  ? '/api/servicios-externos' // Ruta del proxy en Next.js (ruta API real)
  : process.env.NEXT_PUBLIC_SERVICES_API_URL || process.env.SERVICES_API_URL || 'https://ceresenred.ceres.gob.ar';
const API_KEY = USE_PROXY 
  ? undefined
  : process.env.ADMIN_API_KEY;
const CENTRAL_API_BASE_URL = USE_PROXY
  ? '/api/ceres-api'
  : process.env.CORE_API_V1_BASE_URL ||
    process.env.CERES_API_URL ||
    process.env.NEXT_PUBLIC_CERES_API_URL ||
    '';
const CENTRAL_API_KEY = USE_PROXY
  ? undefined
  : process.env.CORE_API_ADMIN_KEY ||
    process.env.OPS_API_KEY ||
    process.env.ADMIN_API_KEY;

const OBS_SOURCE_SERVICES = "plataforma-servicios-ceres";
const OBS_SOURCE_BOT = "bot";

export interface APIError {
  success: false;
  error: string;
  message: string;
}

export interface APIResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface PaginatedAPIResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Tipos de respuesta de la API (formato crudo de la API)
export interface APIStatsResponse {
  overview: {
    totalProfessionals: number;
    activeProfessionals: number;
    pendingProfessionals: number;
    suspendedProfessionals: number;
    totalServices: number;
    activeLocations: number;
  };
  categoryDistribution: Array<{
    category: string;
    count: number;
  }>;
  geographicDistribution: Array<{
    location: string;
    count: number;
  }>;
}

export interface APIProfessionalResponse {
  id: string;
  userId: string;
  name?: string;
  email?: string;
  phone?: string;
  bio: string;
  status: 'pending' | 'active' | 'suspended';
  verified: boolean;
  certified?: boolean;
  professionalGroup?: 'oficios' | 'profesiones';
  experienceYears?: number;
  rating?: number;
  reviewCount?: number;
  serviceCount?: number;
  location?: string;
  serviceLocations?: string[];
  ProfilePicture?: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  website?: string;
  portfolio?: string;
  CV?: string;
  registrationType?: 'email' | 'google' | 'facebook';
  documentationRequired?: boolean;
  criminalRecordPresent?: boolean;
  hasLaborReferences?: boolean;
  documentation?: {
    required?: boolean;
    criminalRecordPresent?: boolean;
    criminalRecordStatus?: 'pending' | 'approved' | 'rejected' | null;
    criminalRecordReviewedAt?: string | null;
    criminalRecordAdminNotes?: string | null;
    hasLaborReferences?: boolean;
    criminalRecord?: {
      objectKey?: string;
      fileName: string;
      downloadPath?: string;
    } | null;
    laborReferences?: Array<{
      id: string;
      name: string;
      company: string;
      contact: string;
      attachment?: {
        objectKey?: string;
        fileName: string;
        downloadPath?: string;
      } | null;
    }>;
  };
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    dni?: string;
    phone?: string;
    birthDate?: string;
    location?: string;
    verified?: boolean;
    createdAt?: string;
    updatedAt?: string;
  };
  services?: Array<{
    id: string;
    title: string;
    category?: string;
    description?: string;
    priceRange?: string;
    available?: boolean;
    categoryId?: string;
    categoryGroup?: 'oficios' | 'profesiones';
    createdAt?: string;
    updatedAt?: string;
  }>;
  _count?: {
    services?: number;
    reviews?: number;
    contactRequests?: number;
  };
}

export interface APIServiceResponse {
  id: string;
  professionalId: string;
  categoryId: string;
  title: string;
  description: string;
  priceRange: string;
  available: boolean;
  categoryGroup?: 'oficios' | 'profesiones';
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    birthDate?: string;
    location?: string;
    verified?: boolean;
    createdAt?: string;
    updatedAt?: string;
  };
  reviews?: Array<{
    id: string;
    professionalId: string;
    userId: string;
    rating: number;
    comment: string;
    createdAt: string;
    user?: {
      firstName: string;
      lastName: string;
    };
  }>;
  _count?: {
    services: number;
    reviews: number;
    contactRequests: number;
  };
}

export interface ListProfessionalsParams {
  page?: number;
  limit?: number;
  status?: 'active' | 'pending' | 'suspended';
  grupo?: 'oficios' | 'profesiones';
  search?: string;
}

export interface UpdateProfessionalData {
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    birthDate?: string;
    location?: string;
  };
  bio?: string;
  experienceYears?: number;
  professionalGroup?: 'oficios' | 'profesiones';
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  website?: string;
  portfolio?: string;
  location?: string;
  serviceLocations?: string[];
  specialties?: string[];
  schedule?: Record<string, { start: string; end: string }>;
  verified?: boolean;
  certified?: boolean;
}

// Tipos para Usuarios
export interface APIUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  dni?: string;
  phone?: string;
  birthDate?: string;
  location?: string;
  role: 'citizen' | 'professional' | 'admin';
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  professional?: {
    id: string;
    status: 'pending' | 'active' | 'suspended';
    verified: boolean;
  };
  stats?: {
    contactRequests: number;
    reviews: number;
    hasProfessional: boolean;
  };
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  role?: 'citizen' | 'professional' | 'admin';
  verified?: boolean;
  search?: string;
}

export interface UpdateUserData {
  role?: 'citizen' | 'professional' | 'admin';
  verified?: boolean;
  suspended?: boolean; // Suspender/reactivar usuario (si tiene Professional, actualiza su status)
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  location?: string;
  birthDate?: string;
}

// Tipos para Categorías
export type CategoryType = 'area' | 'subcategory';
export type CategoryGroup = 'oficios' | 'profesiones';

export interface APICategoryProfessionalResponse {
  id: string;
  rating?: number | null;
  verified?: boolean;
  user?: {
    firstName: string;
    lastName: string;
  };
}

export interface APICategoryChildResponse {
  id: string;
  name: string;
  slug: string;
  professionalCount?: number;
}

export interface APICategoryResponse {
  id: string;
  type: CategoryType;
  name: string;
  slug: string;
  group: CategoryGroup;
  areaId?: string | null;
  areaSlug?: string | null;
  parentId?: string | null;
  parentSlug?: string | null;
  icon?: string | null;
  image?: string | null;
  description?: string | null;
  active: boolean;
  showOnHome?: boolean;
  subcategoryCount?: number;
  professionalCount?: number;
  subcategories?: APICategoryChildResponse[];
  area?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  parent?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  professionals?: APICategoryProfessionalResponse[];
  _count?: {
    children?: number;
    subcategories?: number;
    professionals?: number;
    services?: number;
  };
}

export interface CategoriesListResponse {
  areas: APICategoryResponse[];
  subcategoriesOficios: APICategoryResponse[];
  subcategoriesProfesiones: APICategoryResponse[];
  stats: {
    totalAreas: number;
    totalSubcategoriesOficios: number;
    totalSubcategoriesProfesiones: number;
    totalCategories: number;
  };
}

export interface ListCategoriesParams {
  type?: CategoryType;
  group?: CategoryGroup;
  search?: string;
}

export interface CreateCategoryData {
  type: CategoryType;
  name: string;
  slug: string;
  group: CategoryGroup;
  parentId?: string | null;
  description?: string;
  icon?: string | null;
  image?: string;
  active?: boolean;
  showOnHome?: boolean;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  icon?: string | null;
  image?: string | null;
  active?: boolean;
  showOnHome?: boolean;
  parentId?: string | null;
}

export interface APIUploadGrantResponse {
  token: string;
  expiresAt: string;
}

export interface APIUploadedFileResponse {
  filename: string;
  originalName: string;
  path: string;
  url: string;
  value: string;
  storage: 'r2' | 'local';
}

type V1EnvelopeSuccess<T> = {
  success: true;
  data: T;
  meta?: {
    requestId?: string;
  };
};

type V1EnvelopeError = {
  success: false;
  error?:
    | string
    | {
        code?: string;
        message?: string;
      };
  message?: string;
  meta?: {
    requestId?: string;
  };
};

// Tipos para Bug Reports
export interface APIBugReportResponse {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userEmail?: string;
  context?: {
    browser?: string;
    os?: string;
    url?: string;
    [key: string]: any;
  };
  adminNotes?: string;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListBugReportsParams {
  page?: number;
  limit?: number;
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  search?: string;
}

export interface UpdateBugReportData {
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  adminNotes?: string;
}

// Tipos para Certificaciones
export interface APICertificationResponse {
  id: string;
  professionalId: string;
  certificationType: string;
  certificationNumber?: string | null;
  issuingOrganization?: string | null;
  issuedAt?: string | null;
  expiresAt?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  adminNotes?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  professional?: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface ListCertificationsParams {
  page?: number;
  limit?: number;
  status?: 'pending' | 'approved' | 'rejected' | 'suspended';
  professionalId?: string; // Filtrar por profesional específico
}

export interface UpdateCertificationData {
  status: 'approved' | 'rejected' | 'suspended';
  adminNotes?: string;
}

export interface APICriminalRecordReviewResponse {
  id: string;
  professionalId: string;
  criminalRecordObjectKey: string | null;
  criminalRecordFileName: string | null;
  criminalRecordStatus: 'pending' | 'approved' | 'rejected' | null;
  criminalRecordReviewedAt: string | null;
  criminalRecordAdminNotes: string | null;
  updatedAt: string;
  professional: {
    id: string;
    verified: boolean;
    status: 'pending' | 'active' | 'suspended';
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

export interface ListCriminalRecordReviewsParams {
  page?: number;
  limit?: number;
  status?: 'pending' | 'approved' | 'rejected';
  professionalId?: string;
}

export interface APIObservabilityEvent {
  id: string;
  source?: string;
  kind: 'audit' | 'workflow' | 'request';
  domain: string;
  eventName: string;
  entityType?: string | null;
  entityId?: string | null;
  actorType: 'admin_user' | 'end_user' | 'system';
  actorId?: string | null;
  actorLabel?: string | null;
  requestId?: string | null;
  route?: string | null;
  method?: string | null;
  status: 'success' | 'failure' | 'warning' | 'skipped';
  durationMs?: number | null;
  summary: string;
  changes?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
}

export interface ObservabilityEventsParams {
  source?: string;
  from?: string;
  to?: string;
  domain?: string;
  actorId?: string;
  kind?: 'audit' | 'workflow' | 'request';
  status?: 'success' | 'failure' | 'warning' | 'skipped';
  entityType?: string;
  entityId?: string;
  requestId?: string;
  query?: string;
  page?: number;
  limit?: number;
}

export interface APIObservabilitySummaryResponse {
  totals: {
    totalEvents: number;
    events24h: number;
    errorEvents24h: number;
    adminActions24h: number;
    emailEvents24h: number;
    requestFailures24h: number;
    slowRequests24h: number;
  };
  statusBreakdown: Array<{
    status: APIObservabilityEvent['status'];
    count: number;
  }>;
  domainBreakdown: Array<{
    domain: string;
    count: number;
  }>;
  recentFailures: APIObservabilityEvent[];
}

export interface APIPlatformObservabilitySummaryResponse {
  totals: APIObservabilitySummaryResponse["totals"];
  statusBreakdown: APIObservabilitySummaryResponse["statusBreakdown"];
  domainBreakdown: APIObservabilitySummaryResponse["domainBreakdown"];
  recentFailures: APIObservabilityEvent[];
}

export interface APIObservabilityEventDetailResponse {
  event: APIObservabilityEvent;
  timeline: APIObservabilityEvent[];
}

export interface APIObservabilityEventsResponse {
  success: true;
  data: APIObservabilityEvent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters?: ObservabilityEventsParams & {
    query?: string | null;
  };
}

export interface APIPlatformObservabilityEventsResponse {
  success: true;
  data: APIObservabilityEvent[];
  pagination: APIObservabilityEventsResponse["pagination"];
  filters?: Record<string, unknown>;
}

type RawCategoryPayload = {
  id: string;
  type?: CategoryType;
  name: string;
  slug: string;
  group?: CategoryGroup;
  groupId?: CategoryGroup;
  areaId?: string | null;
  areaSlug?: string | null;
  parentId?: string | null;
  parentSlug?: string | null;
  parentCategoryId?: string | null;
  icon?: string | null;
  image?: string | null;
  backgroundUrl?: string | null;
  description?: string | null;
  active: boolean;
  showOnHome?: boolean;
  subcategoryCount?: number;
  professionalCount?: number;
  parent?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  subcategories?: Array<{
    id: string;
    name: string;
    slug: string;
    professionalCount?: number;
  }>;
  professionals?: APICategoryProfessionalResponse[];
  _count?: {
    children?: number;
    subcategories?: number;
    professionals?: number;
    services?: number;
  };
};

type RawCategoriesListResponse = {
  areas: RawCategoryPayload[];
  subcategoriesOficios: RawCategoryPayload[];
  subcategoriesProfesiones: RawCategoryPayload[];
  stats: CategoriesListResponse['stats'];
};

function normalizeCategory(
  category: RawCategoryPayload,
  fallbackType?: CategoryType
): APICategoryResponse {
  const parentId =
    category.parentId ?? category.parentCategoryId ?? category.parent?.id ?? category.areaId ?? null;
  const parentSlug = category.parentSlug ?? category.parent?.slug ?? category.areaSlug ?? null;
  const group = (category.group ?? category.groupId) as CategoryGroup;
  const childCount = category.subcategoryCount ?? category._count?.children ?? category._count?.subcategories;
  const professionalCount =
    category.professionalCount ?? category._count?.services ?? category._count?.professionals;

  return {
    id: category.id,
    type: category.type ?? fallbackType ?? (parentId ? 'subcategory' : 'area'),
    name: category.name,
    slug: category.slug,
    group,
    areaId: parentId,
    areaSlug: parentSlug,
    parentId,
    parentSlug,
    icon: category.icon ?? null,
    image: category.image ?? category.backgroundUrl ?? null,
    description: category.description ?? null,
    active: category.active,
    showOnHome: category.showOnHome ?? false,
    subcategoryCount: childCount,
    professionalCount,
    subcategories: category.subcategories?.map((subcategory) => ({
      id: subcategory.id,
      name: subcategory.name,
      slug: subcategory.slug,
      professionalCount: subcategory.professionalCount,
    })),
    area: category.parent ?? null,
    parent: category.parent ?? null,
    professionals: category.professionals,
    _count:
      childCount !== undefined || professionalCount !== undefined
        ? {
            children: childCount,
            subcategories: childCount,
            professionals: professionalCount,
            services: professionalCount,
          }
        : category._count,
  };
}

function normalizeCategoriesList(data: RawCategoriesListResponse): CategoriesListResponse {
  return {
    areas: data.areas.map((area) => normalizeCategory(area, 'area')),
    subcategoriesOficios: data.subcategoriesOficios.map((subcategory) =>
      normalizeCategory(subcategory, 'subcategory')
    ),
    subcategoriesProfesiones: data.subcategoriesProfesiones.map((subcategory) =>
      normalizeCategory(subcategory, 'subcategory')
    ),
    stats: data.stats,
  };
}

/**
 * Cliente de API de Servicios
 */
class ServicesAPIClient {
  private baseURL: string;
  private apiKey: string | undefined;

  constructor(baseURL: string = API_BASE_URL, apiKey: string | undefined = API_KEY) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
  }

  private buildHeaders(options: RequestInit = {}): Headers {
    const headers = new Headers(options.headers);

    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    if (this.apiKey && !headers.has('x-admin-api-key')) {
      headers.set('x-admin-api-key', this.apiKey);
    }

    return headers;
  }

  private async requestTo<T>(
    baseURL: string,
    apiKey: string | undefined,
    endpoint: string,
    options: RequestInit = {},
    apiKeyHeader: 'x-admin-api-key' | 'x-api-key' = 'x-admin-api-key',
  ): Promise<APIResponse<T> | PaginatedAPIResponse<T> | APIError> {
    try {
      const url = `${baseURL}${endpoint}`;
      const headers = new Headers(options.headers);

      if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }

      if (apiKey && !headers.has(apiKeyHeader)) {
        headers.set(apiKeyHeader, apiKey);
      }

      if (!apiKey && !USE_PROXY) {
        return {
          success: false,
          error: 'configuration_error',
          message: 'API Key no configurada en las variables de entorno del servidor.',
        };
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || 'unknown_error',
          message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return await response.json();
    } catch (error) {
      console.error('API Request Error:', error);
      return {
        success: false,
        error: 'network_error',
        message: error instanceof Error ? error.message : 'Error de conexión con la API',
      };
    }
  }

  private normalizeApiError(response: Response, payload: unknown): APIError {
    const errorObject =
      payload && typeof payload === 'object' && 'error' in payload
        ? (payload as V1EnvelopeError).error
        : undefined;

    const errorCode =
      typeof errorObject === 'string'
        ? errorObject
        : errorObject?.code || 'unknown_error';

    const errorMessage =
      (typeof errorObject === 'object' && errorObject?.message) ||
      (payload && typeof payload === 'object' && 'message' in payload
        ? String((payload as { message?: unknown }).message || '')
        : '') ||
      `HTTP ${response.status}: ${response.statusText}`;

    return {
      success: false,
      error: errorCode,
      message: errorMessage,
    };
  }

  private unwrapUploadGrantPayload(payload: unknown): APIUploadGrantResponse | null {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const source =
      'data' in payload &&
      payload.data &&
      typeof payload.data === 'object'
        ? (payload as V1EnvelopeSuccess<APIUploadGrantResponse>).data
        : payload;

    if (
      !source ||
      typeof source !== 'object' ||
      typeof (source as APIUploadGrantResponse).token !== 'string' ||
      typeof (source as APIUploadGrantResponse).expiresAt !== 'string'
    ) {
      return null;
    }

    return {
      token: (source as APIUploadGrantResponse).token,
      expiresAt: (source as APIUploadGrantResponse).expiresAt,
    };
  }

  private unwrapUploadedFilePayload(payload: unknown): APIUploadedFileResponse | null {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const source =
      'data' in payload &&
      payload.data &&
      typeof payload.data === 'object'
        ? (payload as V1EnvelopeSuccess<APIUploadedFileResponse>).data
        : payload;

    if (
      !source ||
      typeof source !== 'object' ||
      typeof (source as APIUploadedFileResponse).filename !== 'string' ||
      typeof (source as APIUploadedFileResponse).originalName !== 'string' ||
      typeof (source as APIUploadedFileResponse).path !== 'string' ||
      typeof (source as APIUploadedFileResponse).url !== 'string' ||
      typeof (source as APIUploadedFileResponse).value !== 'string' ||
      typeof (source as APIUploadedFileResponse).storage !== 'string'
    ) {
      return null;
    }

    return {
      filename: (source as APIUploadedFileResponse).filename,
      originalName: (source as APIUploadedFileResponse).originalName,
      path: (source as APIUploadedFileResponse).path,
      url: (source as APIUploadedFileResponse).url,
      value: (source as APIUploadedFileResponse).value,
      storage: (source as APIUploadedFileResponse).storage,
    };
  }

  /**
   * Realiza una petición HTTP a la API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T> | PaginatedAPIResponse<T> | APIError> {
    return this.requestTo(this.baseURL, this.apiKey, endpoint, {
      ...options,
      headers: this.buildHeaders(options),
    });
  }

  /**
   * Obtiene las estadísticas del dashboard
   */
  async getStats(): Promise<APIResponse<APIStatsResponse> | APIError> {
    const result = await this.request<APIStatsResponse>('/api/admin/stats');
    // Asegurar que retornamos solo APIResponse o APIError, no PaginatedAPIResponse
    if ('pagination' in result) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta simple, se recibió una respuesta paginada'
      };
    }
    return result as APIResponse<APIStatsResponse> | APIError;
  }

  /**
   * Lista todos los profesionales con filtros y paginación
   */
  async listProfessionals(
    params?: ListProfessionalsParams
  ): Promise<PaginatedAPIResponse<APIProfessionalResponse> | APIError> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.status) queryParams.set('status', params.status);
    if (params?.grupo) queryParams.set('grupo', params.grupo);
    if (params?.search) queryParams.set('search', params.search);

    const query = queryParams.toString();
    const endpoint = `/api/admin/professionals${query ? `?${query}` : ''}`;

    const result = await this.request<APIProfessionalResponse>(endpoint);
    // Verificar que sea una respuesta paginada
    if (result.success && !('pagination' in result)) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta paginada'
      };
    }
    return result as PaginatedAPIResponse<APIProfessionalResponse> | APIError;
  }

  /**
   * Obtiene el detalle completo de un profesional
   */
  async getProfessional(id: string): Promise<APIResponse<APIProfessionalResponse> | APIError> {
    const result = await this.request<APIProfessionalResponse>(`/api/admin/professionals/${id}`);
    if ('pagination' in result) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta simple, se recibió una respuesta paginada'
      };
    }
    return result as APIResponse<APIProfessionalResponse> | APIError;
  }

  /**
   * Actualiza la información de un profesional
   */
  async updateProfessional(
    id: string,
    data: UpdateProfessionalData
  ): Promise<APIResponse<APIProfessionalResponse> | APIError> {
    const result = await this.request<APIProfessionalResponse>(`/api/admin/professionals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if ('pagination' in result) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta simple, se recibió una respuesta paginada'
      };
    }
    return result as APIResponse<APIProfessionalResponse> | APIError;
  }

  /**
   * Actualiza el estado de un profesional (aprobar/rechazar/suspender)
   */
  async updateProfessionalStatus(
    id: string,
    status: 'active' | 'pending' | 'suspended',
    verified?: boolean
  ): Promise<APIResponse<APIProfessionalResponse> | APIError> {
    const result = await this.request<APIProfessionalResponse>(`/api/admin/professionals/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, verified }),
    });
    if ('pagination' in result) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta simple, se recibió una respuesta paginada'
      };
    }
    return result as APIResponse<APIProfessionalResponse> | APIError;
  }

  /**
   * Carga masiva de profesionales desde CSV
   * Envía un array de profesionales para crear en lote
   */
  async bulkCreateProfessionals(
    professionals: Array<{
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      bio?: string;
      professionalGroup?: 'oficios' | 'profesiones';
      location?: string;
      experienceYears?: number;
    }>
  ): Promise<APIResponse<{
    created: number;
    failed: number;
    errors: Array<{
      email: string;
      error: string;
    }>;
  }> | APIError> {
    const result = await this.request<{
      created: number;
      failed: number;
      errors: Array<{
        email: string;
        error: string;
      }>;
    }>('/api/admin/professionals/bulk', {
      method: 'POST',
      body: JSON.stringify({ professionals }),
    });
    if ('pagination' in result) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta simple, se recibió una respuesta paginada'
      };
    }
    return result as APIResponse<{
      created: number;
      failed: number;
      errors: Array<{
        email: string;
        error: string;
      }>;
    }> | APIError;
  }

  // ==================== USUARIOS ====================

  /**
   * Lista todos los usuarios con filtros y paginación
   */
  async listUsers(
    params?: ListUsersParams
  ): Promise<PaginatedAPIResponse<APIUserResponse> | APIError> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.role) queryParams.set('role', params.role);
    if (params?.verified !== undefined) queryParams.set('verified', params.verified.toString());
    if (params?.search) queryParams.set('search', params.search);

    const query = queryParams.toString();
    const endpoint = `/api/admin/users${query ? `?${query}` : ''}`;

    const result = await this.request<APIUserResponse>(endpoint);
    if (result.success && !('pagination' in result)) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta paginada'
      };
    }
    return result as PaginatedAPIResponse<APIUserResponse> | APIError;
  }

  /**
   * Obtiene el detalle completo de un usuario
   */
  async getUser(id: string): Promise<APIResponse<APIUserResponse> | APIError> {
    const result = await this.request<APIUserResponse>(`/api/admin/users/${id}`);
    if ('pagination' in result) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta simple, se recibió una respuesta paginada'
      };
    }
    return result as APIResponse<APIUserResponse> | APIError;
  }

  /**
   * Actualiza la información de un usuario
   * Incluye soporte para suspender usuarios (suspended: true/false)
   * Si el usuario tiene un Professional, se actualiza su status a 'suspended' o 'active'
   */
  async updateUser(
    id: string,
    data: UpdateUserData
  ): Promise<APIResponse<APIUserResponse> | APIError> {
    const result = await this.request<APIUserResponse>(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if ('pagination' in result) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta simple, se recibió una respuesta paginada'
      };
    }
    return result as APIResponse<APIUserResponse> | APIError;
  }

  /**
   * Elimina un usuario permanentemente
   * Elimina en cascada: Professional, servicios, reviews, contactRequests, etc.
   * Retorna información sobre lo que se eliminó para auditoría
   */
  async deleteUser(
    id: string
  ): Promise<APIResponse<{ id: string; deleted?: { services?: number; reviews?: number; contactRequests?: number } }> | APIError> {
    const result = await this.request<{ id: string; deleted?: { services?: number; reviews?: number; contactRequests?: number } }>(
      `/api/admin/users/${id}`,
      {
        method: 'DELETE',
      }
    );
    if ('pagination' in result) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta simple, se recibió una respuesta paginada'
      };
    }
    return result as APIResponse<{ id: string; deleted?: { services?: number; reviews?: number; contactRequests?: number } }> | APIError;
  }

  // ==================== CATEGORÍAS ====================

  /**
   * Lista todas las categorías (áreas y subcategorías)
   */
  async listCategories(): Promise<APIResponse<CategoriesListResponse> | APIError> {
    const result = await this.request<RawCategoriesListResponse>('/api/admin/categories');
    if ('pagination' in result) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta simple, se recibió una respuesta paginada'
      };
    }
    if (!result.success) {
      return result;
    }
    return {
      ...result,
      data: normalizeCategoriesList(result.data),
    };
  }

  /**
   * Obtiene el detalle completo de una categoría
   */
  async searchCategories(
    params: ListCategoriesParams
  ): Promise<APIResponse<APICategoryResponse[]> | APIError> {
    const queryParams = new URLSearchParams();

    if (params.type) queryParams.set('type', params.type);
    if (params.group) queryParams.set('group', params.group);
    if (params.search) queryParams.set('search', params.search);

    const query = queryParams.toString();
    const endpoint = `/api/admin/categories${query ? `?${query}` : ''}`;

    const result = await this.request<RawCategoryPayload[]>(endpoint);
    if ('pagination' in result) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta simple, se recibio una respuesta paginada'
      };
    }
    if (!result.success) {
      return result;
    }
    return {
      ...result,
      data: result.data.map((category) => normalizeCategory(category)),
    };
  }

  async getCategory(id: string): Promise<APIResponse<APICategoryResponse> | APIError> {
    const result = await this.request<RawCategoryPayload>(`/api/admin/categories/${id}`);
    if ('pagination' in result) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta simple, se recibió una respuesta paginada'
      };
    }
    if (!result.success) {
      return result;
    }
    return {
      ...result,
      data: normalizeCategory(result.data),
    };
  }

  /**
   * Crea una nueva categoría o área
   */
  async createCategory(
    data: CreateCategoryData
  ): Promise<APIResponse<APICategoryResponse> | APIError> {
    const result = await this.request<RawCategoryPayload>('/api/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if ('pagination' in result) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta simple, se recibió una respuesta paginada'
      };
    }
    if (!result.success) {
      return result;
    }
    return {
      ...result,
      data: normalizeCategory(result.data, data.type),
    };
  }

  /**
   * Actualiza una categoría
   */
  async updateCategory(
    id: string,
    data: UpdateCategoryData
  ): Promise<APIResponse<APICategoryResponse> | APIError> {
    const result = await this.request<RawCategoryPayload>(`/api/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if ('pagination' in result) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta simple, se recibió una respuesta paginada'
      };
    }
    if (!result.success) {
      return result;
    }
    return {
      ...result,
      data: normalizeCategory(result.data),
    };
  }

  /**
   * Elimina o desactiva una categoría
   */
  async deleteCategory(
    id: string,
    options?: { force?: boolean; deactivate?: boolean }
  ): Promise<APIResponse<{ id: string; active?: boolean }> | APIError> {
    const queryParams = new URLSearchParams();
    if (options?.force) queryParams.set('force', 'true');
    if (options?.deactivate) queryParams.set('deactivate', 'true');

    const query = queryParams.toString();
    const endpoint = `/api/admin/categories/${id}${query ? `?${query}` : ''}`;

    const result = await this.request<{ id: string; active?: boolean }>(endpoint, {
      method: 'DELETE',
    });
    if ('pagination' in result) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta simple, se recibió una respuesta paginada'
      };
    }
    return result as APIResponse<{ id: string; active?: boolean }> | APIError;
  }

  async createUploadGrant(
    input: { context?: 'register'; type?: 'image' | 'cv' } = { context: 'register', type: 'image' }
  ): Promise<APIResponse<APIUploadGrantResponse> | APIError> {
    try {
      const payload = {
        context: input.context ?? 'register',
        type: input.type ?? 'image',
      };

      const response = await fetch(`${this.baseURL}/api/v1/upload/grant`, {
        method: 'POST',
        headers: this.buildHeaders({ body: JSON.stringify(payload) }),
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        return this.normalizeApiError(response, data);
      }

      const grant = this.unwrapUploadGrantPayload(data);
      if (!grant) {
        return {
          success: false,
          error: 'unexpected_response',
          message: 'La API de upload grant devolvio un formato inesperado',
        };
      }

      return {
        success: true,
        data: grant,
      };
    } catch (error) {
      console.error('Upload grant request error:', error);
      return {
        success: false,
        error: 'network_error',
        message: error instanceof Error ? error.message : 'Error al solicitar el token de upload',
      };
    }
  }

  async uploadFile(
    file: File,
    input: { type?: 'image' | 'cv'; token?: string | null } = {}
  ): Promise<APIResponse<APIUploadedFileResponse> | APIError> {
    try {
      const body = new FormData();
      body.set('file', file);
      body.set('type', input.type ?? 'image');

      const headers = this.buildHeaders({ body });
      if (input.token) {
        headers.set('x-upload-token', input.token);
      }

      const response = await fetch(`${this.baseURL}/api/v1/upload`, {
        method: 'POST',
        headers,
        body,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        return this.normalizeApiError(response, data);
      }

      const upload = this.unwrapUploadedFilePayload(data);
      if (!upload) {
        return {
          success: false,
          error: 'unexpected_response',
          message: 'La API de upload devolvio un formato inesperado',
        };
      }

      return {
        success: true,
        data: upload,
      };
    } catch (error) {
      console.error('File upload request error:', error);
      return {
        success: false,
        error: 'network_error',
        message: error instanceof Error ? error.message : 'Error al subir el archivo',
      };
    }
  }

  // ==================== BUG REPORTS ====================

  /**
   * Lista todos los bug reports con filtros y paginación
   */
  async listBugReports(
    params?: ListBugReportsParams
  ): Promise<PaginatedAPIResponse<APIBugReportResponse> | APIError> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.status) queryParams.set('status', params.status);
    if (params?.severity) queryParams.set('severity', params.severity);
    if (params?.search) queryParams.set('search', params.search);

    const query = queryParams.toString();
    const endpoint = `/api/admin/bug-reports${query ? `?${query}` : ''}`;

    const result = await this.request<APIBugReportResponse>(endpoint);
    if (result.success && !('pagination' in result)) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta paginada'
      };
    }
    return result as PaginatedAPIResponse<APIBugReportResponse> | APIError;
  }

  /**
   * Obtiene el detalle completo de un bug report
   */
  async getBugReport(id: string): Promise<APIResponse<APIBugReportResponse> | APIError> {
    const result = await this.request<APIBugReportResponse>(`/api/admin/bug-reports/${id}`);
    if ('pagination' in result) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta simple, se recibió una respuesta paginada'
      };
    }
    return result as APIResponse<APIBugReportResponse> | APIError;
  }

  // ==================== CERTIFICACIONES ====================

  /**
   * Lista todas las certificaciones con filtros y paginación
   */
  async listCertifications(
    params?: ListCertificationsParams
  ): Promise<PaginatedAPIResponse<APICertificationResponse> | APIError> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.status) queryParams.set('status', params.status);
    if (params?.professionalId) queryParams.set('professionalId', params.professionalId);

    const query = queryParams.toString();
    const endpoint = `/api/admin/certifications${query ? `?${query}` : ''}`;

    const result = await this.request<APICertificationResponse>(endpoint);
    if (result.success && !('pagination' in result)) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta paginada'
      };
    }
    return result as PaginatedAPIResponse<APICertificationResponse> | APIError;
  }

  /**
   * Actualiza el estado de una certificación (aprobar / rechazar / suspender)
   */
  async updateCertification(
    id: string,
    data: UpdateCertificationData
  ): Promise<APIResponse<APICertificationResponse> | APIError> {
    const result = await this.request<APICertificationResponse>(`/api/admin/certifications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if ('pagination' in result) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta simple, se recibió una respuesta paginada'
      };
    }
    return result as APIResponse<APICertificationResponse> | APIError;
  }

  /**
   * Elimina una certificación (casos excepcionales)
   */
  async deleteCertification(
    id: string
  ): Promise<APIResponse<{ id: string }> | APIError> {
    const result = await this.request<{ id: string }>(`/api/admin/certifications/${id}`, {
      method: 'DELETE',
    });
    if ('pagination' in result) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta simple, se recibió una respuesta paginada'
      };
    }
    return result as APIResponse<{ id: string }> | APIError;
  }

  async listCriminalRecordReviews(
    params?: ListCriminalRecordReviewsParams
  ): Promise<PaginatedAPIResponse<APICriminalRecordReviewResponse> | APIError> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.status) queryParams.set('status', params.status);
    if (params?.professionalId) queryParams.set('professionalId', params.professionalId);

    const query = queryParams.toString();
    const endpoint = `/api/admin/criminal-records${query ? `?${query}` : ''}`;

    const result = await this.request<APICriminalRecordReviewResponse>(endpoint);
    if (result.success && !('pagination' in result)) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta paginada',
      };
    }
    return result as PaginatedAPIResponse<APICriminalRecordReviewResponse> | APIError;
  }

  async reviewProfessionalCriminalRecord(
    professionalId: string,
    data: { status: 'approved' | 'rejected'; adminNotes?: string }
  ): Promise<APIResponse<APICriminalRecordReviewResponse> | APIError> {
    const result = await this.request<APICriminalRecordReviewResponse>(
      `/api/admin/professionals/${professionalId}/criminal-record`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );

    if ('pagination' in result) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta simple, se recibió una respuesta paginada',
      };
    }
    return result as APIResponse<APICriminalRecordReviewResponse> | APIError;
  }

  // ==================== OBSERVABILIDAD ====================

  async getObservabilitySummary(
    source: string = OBS_SOURCE_SERVICES
  ): Promise<APIResponse<APIObservabilitySummaryResponse> | APIError> {
    const queryParams = new URLSearchParams();
    if (source) queryParams.set('source', source);
    const endpoint = `/api/v1/ops/summary${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const result = await this.requestTo<APIObservabilitySummaryResponse>(
      CENTRAL_API_BASE_URL,
      CENTRAL_API_KEY,
      endpoint,
      {},
      'x-api-key'
    );
    if ('pagination' in result) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta simple, se recibio una respuesta paginada'
      };
    }
    return result as APIResponse<APIObservabilitySummaryResponse> | APIError;
  }

  async listObservabilityEvents(
    params?: ObservabilityEventsParams
  ): Promise<APIObservabilityEventsResponse | APIError> {
    const queryParams = new URLSearchParams();

    queryParams.set('source', params?.source || OBS_SOURCE_SERVICES);
    if (params?.from) queryParams.set('from', params.from);
    if (params?.to) queryParams.set('to', params.to);
    if (params?.domain) queryParams.set('domain', params.domain);
    if (params?.actorId) queryParams.set('actorId', params.actorId);
    if (params?.kind) queryParams.set('kind', params.kind);
    if (params?.status) queryParams.set('status', params.status);
    if (params?.entityType) queryParams.set('entityType', params.entityType);
    if (params?.entityId) queryParams.set('entityId', params.entityId);
    if (params?.requestId) queryParams.set('requestId', params.requestId);
    if (params?.query) queryParams.set('query', params.query);
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.limit) queryParams.set('limit', String(params.limit));

    const query = queryParams.toString();
    const result = await this.requestTo<any>(
      CENTRAL_API_BASE_URL,
      CENTRAL_API_KEY,
      `/api/v1/ops/events${query ? `?${query}` : ''}`,
      {},
      'x-api-key'
    );

    if (!result.success) {
      return result as APIError;
    }

    if (!('pagination' in result) && Array.isArray((result as any).data) && (result as any).pagination) {
      return result as APIObservabilityEventsResponse;
    }

    return result as APIObservabilityEventsResponse;
  }

  async getObservabilityEvent(
    id: string
  ): Promise<APIResponse<APIObservabilityEventDetailResponse> | APIError> {
    const result = await this.requestTo<APIObservabilityEventDetailResponse>(
      CENTRAL_API_BASE_URL,
      CENTRAL_API_KEY,
      `/api/v1/ops/events/${id}`,
      {},
      'x-api-key'
    );
    if ('pagination' in result) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta simple, se recibio una respuesta paginada'
      };
    }
    return result as APIResponse<APIObservabilityEventDetailResponse> | APIError;
  }

  async getBotObservabilitySummary(): Promise<
    APIResponse<APIObservabilitySummaryResponse> | APIError
  > {
    return this.getObservabilitySummary(OBS_SOURCE_BOT);
  }

  async listBotObservabilityEvents(
    params?: Omit<ObservabilityEventsParams, "source">,
  ): Promise<APIObservabilityEventsResponse | APIError> {
    return this.listObservabilityEvents({
      ...(params || {}),
      source: OBS_SOURCE_BOT,
    });
  }

  async getBotObservabilityEvent(
    id: string,
  ): Promise<APIResponse<APIObservabilityEventDetailResponse> | APIError> {
    const result = await this.getObservabilityEvent(id);
    if (!result.success) {
      return result;
    }

    const hasNonBotInTimeline = result.data.timeline.some(
      (event) => event.source !== OBS_SOURCE_BOT,
    );

    if (result.data.event.source !== OBS_SOURCE_BOT || hasNonBotInTimeline) {
      return {
        success: false,
        error: "invalid_observability_source",
        message: "El evento solicitado no pertenece a la observabilidad del bot",
      };
    }

    return result;
  }

  async getPlatformObservabilitySummary(): Promise<
    APIResponse<APIPlatformObservabilitySummaryResponse> | APIError
  > {
    const result = await this.request<APIPlatformObservabilitySummaryResponse>(
      "/api/admin/observability/summary",
    );
    if ("pagination" in result) {
      return {
        success: false,
        error: "unexpected_response",
        message: "Se esperaba una respuesta simple, se recibio una respuesta paginada",
      };
    }
    return result as APIResponse<APIPlatformObservabilitySummaryResponse> | APIError;
  }

  async listPlatformObservabilityEvents(
    params?: Omit<ObservabilityEventsParams, "source">,
  ): Promise<APIPlatformObservabilityEventsResponse | APIError> {
    const queryParams = new URLSearchParams();

    if (params?.from) queryParams.set("from", params.from);
    if (params?.to) queryParams.set("to", params.to);
    if (params?.domain) queryParams.set("domain", params.domain);
    if (params?.actorId) queryParams.set("actorId", params.actorId);
    if (params?.kind) queryParams.set("kind", params.kind);
    if (params?.status) queryParams.set("status", params.status);
    if (params?.entityType) queryParams.set("entityType", params.entityType);
    if (params?.entityId) queryParams.set("entityId", params.entityId);
    if (params?.requestId) queryParams.set("requestId", params.requestId);
    if (params?.query) queryParams.set("query", params.query);
    if (params?.page) queryParams.set("page", String(params.page));
    if (params?.limit) queryParams.set("limit", String(params.limit));

    const endpoint = `/api/admin/observability/events${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    const result = await this.request<APIObservabilityEvent>(endpoint);
    if (!result.success) {
      return result as APIError;
    }
    if (!("pagination" in result)) {
      return {
        success: false,
        error: "unexpected_response",
        message: "Se esperaba una respuesta paginada",
      };
    }
    return result as APIPlatformObservabilityEventsResponse;
  }

  /**
   * Actualiza un bug report (cambiar estado, agregar notas, etc.)
   */
  async updateBugReport(
    id: string,
    data: UpdateBugReportData
  ): Promise<APIResponse<APIBugReportResponse> | APIError> {
    const result = await this.request<APIBugReportResponse>(`/api/admin/bug-reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if ('pagination' in result) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta simple, se recibió una respuesta paginada'
      };
    }
    return result as APIResponse<APIBugReportResponse> | APIError;
  }

  // ==================== SERVICIOS ====================

  /**
   * Crea un nuevo servicio para un profesional
   */
  async createService(
    professionalId: string,
    data: {
      categoryId: string;
      title: string;
      description: string;
      priceRange?: string;
      available?: boolean;
    }
  ): Promise<APIResponse<APIServiceResponse> | APIError> {
    const result = await this.request<APIServiceResponse>(
      `/api/admin/professionals/${professionalId}/services`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    if ('pagination' in result) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta simple, se recibió una respuesta paginada'
      };
    }
    return result as APIResponse<APIServiceResponse> | APIError;
  }

  /**
   * Actualiza un servicio existente
   */
  async updateService(
    professionalId: string,
    serviceId: string,
    data: {
      categoryId?: string;
      title?: string;
      description?: string;
      priceRange?: string;
      available?: boolean;
    }
  ): Promise<APIResponse<APIServiceResponse> | APIError> {
    const result = await this.request<APIServiceResponse>(
      `/api/admin/professionals/${professionalId}/services/${serviceId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
    if ('pagination' in result) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta simple, se recibió una respuesta paginada'
      };
    }
    return result as APIResponse<APIServiceResponse> | APIError;
  }

  /**
   * Elimina un servicio
   */
  async deleteService(
    professionalId: string,
    serviceId: string
  ): Promise<APIResponse<{ id: string }> | APIError> {
    const result = await this.request<{ id: string }>(
      `/api/admin/professionals/${professionalId}/services/${serviceId}`,
      {
        method: 'DELETE',
      }
    );
    if ('pagination' in result) {
      return {
        success: false,
        error: 'unexpected_response',
        message: 'Se esperaba una respuesta simple, se recibió una respuesta paginada'
      };
    }
    return result as APIResponse<{ id: string }> | APIError;
  }
}

// Exportar instancia singleton
export const apiClient = new ServicesAPIClient();

// Exportar clase para testing o instancias personalizadas
export default ServicesAPIClient;
