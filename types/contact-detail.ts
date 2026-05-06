export interface Reclamo {
  id: number;
  fecha: string;
  nombre: string | null;
  reclamo: string;
  ubicacion: string | null;
  barrio: string | null;
  telefono: string;
  estado: string;
  detalle: string | null;
  prioridad: string | null;
  latitud: string | null;
  longitud: string | null;
  cuadrillaid: number | null;
}

export interface HistoryStats {
  countByContactId: number;
  countByPhone: number;
}

export interface ContactDetail {
  id: number;
  phone: string | null;
  contact_name: string | null;
  createdAt: string;
  updatedIn: string | null;
  lastInteraction: string | null;
  values: Record<string, any> | null;
  reclamos: Reclamo[];
  historyStats: HistoryStats;
}

// Representa un mensaje individual dentro de una conversación detallada
export interface ChatMessage {
  id: string | number; // ID del mensaje
  sender: 'user' | 'bot' | 'human' | 'system';
  text: string;
  timestamp: string; // Fecha del mensaje
  kind?: 'message' | 'event';
  // ... otros campos relevantes del mensaje si los hay (ej. attachments, type)
}

// Representa el resumen de una conversación completa
export interface ConversationSummary {
  id: number; // ID de la tabla de resumen de conversaciones
  fecha_hora: string; // Fecha de la última interacción o fin de la conversación
  nombre: string | null;
  telefono: string;
  duracion_minutos: string;
  conversation_id: string; // ID único de la conversación, para buscar sus mensajes
  contact_id: number;
  razon_fin: string | null;
  ultimo_flujo: string | null;
  fecha_inicio: string;
}

// Representa la respuesta paginada del endpoint de resúmenes de conversación
export interface PaginatedConversationSummaries {
  data: ConversationSummary[];
  total: number;
  pageCount: number;
  currentPage: number;
}

// Placeholder type para el historial antiguo - se mantiene como estaba
export interface HistoryEntry {
  id: string; // O number
  timestamp: string;
  event_type: string;
  details: Record<string, any>;
  // ... otros campos
}

export interface PaginatedHistory {
  items: HistoryEntry[];
  total: number;
  page: number;
  pageSize: number;
  // ... otros metadatos de paginación
} 
