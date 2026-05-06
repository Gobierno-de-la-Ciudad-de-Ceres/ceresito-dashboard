"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { ChatMessage } from "@/types/contact-detail"; // Usamos el tipo ChatMessage
import { Skeleton } from "@/components/ui/skeleton"; // Podría ser útil para un estado de carga de mensajes individuales
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// Interfaz para la respuesta de la API de detalles de conversación (mensajes)
interface ConversationMessagesApiResponse {
  messages: any[]; // Mantener any[] por ahora, ya que la estructura interna no está completamente definida aquí
  totalMessages: number;
  currentPage: number;
  totalPages: number;
  // Podrías tener más campos como contact_name, etc., si la API los devuelve.
}

// Interfaz para las props de ConversationView
export interface ConversationViewProps {
  details: {
    contactId?: number | null;
    conversationId: string | null; // Puede ser nulo si se cargan los más recientes por contactId
    // timestamp: string; // Ya no es estrictamente necesario para la lógica actual de este componente
  } | null;
  // Opcional: un nombre para mostrar en el encabezado, si se pasa.
  // displayName?: string; 
}

export const ConversationView = ({ details }: ConversationViewProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUpdatingHandoff, setIsUpdatingHandoff] = useState(false);
  const [isHumanMode, setIsHumanMode] = useState(false);
  const [outgoingMessage, setOutgoingMessage] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const scrollHeightBeforeLoad = useRef<number>(0);
  const pollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const normalizeString = useCallback((value: unknown): string => {
    return typeof value === 'string' ? value.trim() : '';
  }, []);

  const isHumanHandoffEvent = useCallback((msg: any, text: string): boolean => {
    const ref = normalizeString(msg?.ref).toLowerCase();
    const keyword = normalizeString(msg?.keyword).toLowerCase();
    const answer = text.toLowerCase();
    return (
      ref.includes('handoff') ||
      ref.includes('_event_') ||
      keyword.includes('handoff') ||
      keyword.includes('human_handoff') ||
      answer.includes('conversación tomada por humano') ||
      answer.includes('conversacion tomada por humano') ||
      answer.includes('conversación devuelta al bot') ||
      answer.includes('conversacion devuelta al bot')
    );
  }, [normalizeString]);

  const formatMessages = useCallback((apiMessages: any[]): ChatMessage[] => {
    return apiMessages
      .map(msg => {
        let sender: ChatMessage['sender'] = 'bot';
        let kind: ChatMessage['kind'] = 'message';
        const ref = normalizeString(msg?.ref).toLowerCase();
        const keyword = normalizeString(msg?.keyword).toLowerCase();
        const answer = normalizeString(msg?.answer);

        if (!answer || answer.startsWith('__')) {
          return null;
        }

        if (isHumanHandoffEvent(msg, answer)) {
          sender = 'system';
          kind = 'event';
        } else if (
          ref.startsWith('human') ||
          keyword.includes('human_message') ||
          keyword.includes('agente_humano') ||
          keyword.includes('asesor_humano')
        ) {
          sender = 'human';
        } else if (ref.startsWith('cc')) {
          sender = 'user';
        } else if (ref.startsWith('ans')) {
          sender = 'bot';
        } else if (keyword && !ref.startsWith('ans')) {
          sender = 'user';
        }

        return {
          id: msg.id, // Asegúrate que este id sea único para la key de React
          sender: sender,
          kind,
          text: answer,
          timestamp: msg.createdAt
        };
      })
      .filter((msg): msg is ChatMessage => msg !== null && msg.text !== ''); // Type guard
  }, [isHumanHandoffEvent, normalizeString]);

  const inferHumanMode = useCallback((items: ChatMessage[]) => {
    const handoffEvents = items
      .filter((msg) => msg.sender === 'system' && msg.kind === 'event')
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const lastHandoff = handoffEvents.at(-1);
    if (!lastHandoff) return false;

    const eventText = lastHandoff.text.toLowerCase();
    if (eventText.includes('tomada por humano')) return true;
    if (eventText.includes('devuelta al bot')) return false;
    return false;
  }, []);

  const fetchConversationMessages = useCallback(
    async (page: number, contactId: number | null | undefined, convId: string | null) => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10', // O el límite que prefieras
      });

      if (typeof contactId === 'number' && Number.isFinite(contactId)) {
        params.append('contactId', contactId.toString());
      }

      if (convId) {
        params.append('conversationId', convId);
      }

      if (!params.has('contactId') && !params.has('conversationId')) {
        throw new Error('No se recibió un identificador válido de conversación.');
      }

      const API_ENDPOINT = `/api/core/history/conversation-details?${params.toString()}`;
      // console.log(`Fetching messages from: ${API_ENDPOINT}`);

      const response = await fetch(API_ENDPOINT);
      if (!response.ok) {
        throw new Error(`Error cargando mensajes (status: ${response.status})`);
      }

      const rawPayload = await response.text();
      if (!rawPayload) {
        return {
          messages: [],
          totalMessages: 0,
          currentPage: 1,
          totalPages: 1,
        } satisfies ConversationMessagesApiResponse;
      }

      let parsedPayload: unknown;
      try {
        parsedPayload = JSON.parse(rawPayload);
      } catch {
        throw new Error('La API devolvió una respuesta inválida para la conversación.');
      }

      if (!parsedPayload) {
        return {
          messages: [],
          totalMessages: 0,
          currentPage: 1,
          totalPages: 1,
        } satisfies ConversationMessagesApiResponse;
      }

      if (Array.isArray(parsedPayload)) {
        return {
          messages: parsedPayload,
          totalMessages: parsedPayload.length,
          currentPage: 1,
          totalPages: 1,
        } satisfies ConversationMessagesApiResponse;
      }

      const payload = parsedPayload as Partial<ConversationMessagesApiResponse>;
      return {
        messages: Array.isArray(payload.messages) ? payload.messages : [],
        totalMessages:
          typeof payload.totalMessages === 'number'
            ? payload.totalMessages
            : Array.isArray(payload.messages)
              ? payload.messages.length
              : 0,
        currentPage: typeof payload.currentPage === 'number' ? payload.currentPage : 1,
        totalPages: typeof payload.totalPages === 'number' ? payload.totalPages : 1,
      } satisfies ConversationMessagesApiResponse;
    },
    []
  );

  const clearPolling = useCallback(() => {
    if (pollingTimerRef.current) {
      clearTimeout(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  }, []);

  const mergeUniqueMessages = useCallback((current: ChatMessage[], incoming: ChatMessage[]) => {
    const byId = new Map<string | number, ChatMessage>();

    for (const msg of current) {
      byId.set(msg.id, msg);
    }

    for (const msg of incoming) {
      byId.set(msg.id, msg);
    }

    return Array.from(byId.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, []);

  const refreshMessages = useCallback(
    async (opts?: { merge?: boolean }) => {
      if (!details) return;
      const data = await fetchConversationMessages(1, details.contactId, details.conversationId);
      const formatted = formatMessages(data.messages);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);

      if (opts?.merge) {
        setMessages((prev) => {
          const merged = mergeUniqueMessages(prev, formatted);
          setIsHumanMode(inferHumanMode(merged));
          return merged;
        });
      } else {
        setMessages(formatted);
        setIsHumanMode(inferHumanMode(formatted));
      }
    },
    [details, fetchConversationMessages, formatMessages, inferHumanMode, mergeUniqueMessages]
  );

  const startShortPolling = useCallback(() => {
    clearPolling();
    const startedAt = Date.now();
    const maxDurationMs = 25000;
    const intervalMs = 2500;

    const tick = async () => {
      const elapsed = Date.now() - startedAt;
      if (elapsed > maxDurationMs) {
        clearPolling();
        return;
      }

      try {
        await refreshMessages({ merge: true });
      } catch {
        // evitar romper UX por errores intermitentes durante polling
      }

      pollingTimerRef.current = setTimeout(tick, intervalMs);
    };

    pollingTimerRef.current = setTimeout(tick, intervalMs);
  }, [clearPolling, refreshMessages]);

  const handleSendMessage = useCallback(async () => {
    if (!details?.contactId || isSending || !isHumanMode) return;
    const message = outgoingMessage.trim();
    if (!message) return;

    setIsSending(true);
    setSendError(null);
    setSendSuccess(null);
    clearPolling();

    try {
      const response = await fetch('/api/core/history/human-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactId: details.contactId,
          conversationId: details.conversationId,
          message,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;

      if (!response.ok) {
        const errorMessage =
          payload?.message || payload?.error || 'No se pudo enviar el mensaje.';
        throw new Error(errorMessage);
      }

      setOutgoingMessage('');
      setSendSuccess(payload?.message || 'Mensaje enviado correctamente.');
      setMessages((prev) =>
        mergeUniqueMessages(prev, [
          {
            id: `human-local-${Date.now()}`,
            sender: 'human',
            kind: 'message',
            text: message,
            timestamp: new Date().toISOString(),
          },
        ]),
      );
      await refreshMessages();
      startShortPolling();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Error al enviar mensaje.');
    } finally {
      setIsSending(false);
    }
  }, [clearPolling, details, isHumanMode, isSending, mergeUniqueMessages, outgoingMessage, refreshMessages, startShortPolling]);

  const handleToggleHandoff = useCallback(async () => {
    if (!details?.contactId || isUpdatingHandoff) return;

    setIsUpdatingHandoff(true);
    setSendError(null);
    setSendSuccess(null);

    try {
      const targetAction = isHumanMode ? 'release' : 'take';
      const response = await fetch('/api/core/history/human-handoff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactId: details.contactId,
          conversationId: details.conversationId,
          action: targetAction,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.message || payload?.error || 'No se pudo actualizar el handoff.');
      }

      setIsHumanMode(!isHumanMode);
      setMessages((prev) =>
        mergeUniqueMessages(prev, [
          {
            id: `handoff-local-${Date.now()}`,
            sender: 'system',
            kind: 'event',
            text:
              targetAction === 'take'
                ? 'Conversación tomada por humano'
                : 'Conversación devuelta al bot',
            timestamp: new Date().toISOString(),
          },
        ]),
      );
      setSendSuccess(
        payload?.message ||
          (!isHumanMode ? 'Conversación tomada por humano.' : 'Conversación devuelta al bot.'),
      );
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Error al actualizar handoff.');
    } finally {
      setIsUpdatingHandoff(false);
    }
  }, [details, isHumanMode, isUpdatingHandoff, mergeUniqueMessages]);

  const loadMoreMessages = useCallback(async () => {
    if (!details || isLoadingMore || currentPage >= totalPages) {
      return;
    }
    setIsLoadingMore(true);
    if (chatContainerRef.current) {
      scrollHeightBeforeLoad.current = chatContainerRef.current.scrollHeight;
    }
    try {
      const data = await fetchConversationMessages(
        currentPage + 1,
        details.contactId,
        details.conversationId
      );
      const newFormattedMessages = formatMessages(data.messages);
      setMessages(prevMessages => [...newFormattedMessages, ...prevMessages]); // Nuevos mensajes arriba
      setCurrentPage(data.currentPage);
      // totalPages se setea en la carga inicial o si la API lo devuelve aquí también
    } catch (err: any) {
      console.error("Error fetching more messages:", err);
      // Considerar mostrar un error específico para la carga de más mensajes
    } finally {
      setIsLoadingMore(false);
      requestAnimationFrame(() => {
        if (chatContainerRef.current) {
            const newScrollHeight = chatContainerRef.current.scrollHeight;
            chatContainerRef.current.scrollTop += newScrollHeight - scrollHeightBeforeLoad.current;
        }
      });
    }
  }, [details, isLoadingMore, currentPage, totalPages, formatMessages, fetchConversationMessages]);

  useEffect(() => {
    if (!details) {
      setMessages([]);
      return;
    }

    const { contactId, conversationId } = details;
    if (!conversationId && (contactId === null || contactId === undefined)) {
      setError('No se pudo identificar la conversación relacionada.');
      setMessages([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSendError(null);
    setSendSuccess(null);
    setOutgoingMessage('');
    setIsHumanMode(false);
    clearPolling();
    setMessages([]);
    setCurrentPage(1);
    setTotalPages(1);

    fetchConversationMessages(1, contactId, conversationId)
      .then(data => {
        const formatted = formatMessages(data.messages);
        setMessages(formatted);
        setIsHumanMode(inferHumanMode(formatted));
        setCurrentPage(data.currentPage);
        setTotalPages(data.totalPages);
      })
      .catch(err => {
        console.error("Error fetching initial conversation:", err);
        setError(err.message || 'Error desconocido');
      })
      .finally(() => {
        setIsLoading(false);
        requestAnimationFrame(() => {
            if (chatContainerRef.current) {
                chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
            }
        });
      });
  }, [clearPolling, details, fetchConversationMessages, formatMessages, inferHumanMode]);

  useEffect(() => {
    const container = chatContainerRef.current;
    const handleScroll = () => {
      if (container && container.scrollTop < 50 && !isLoadingMore && currentPage < totalPages) {
           loadMoreMessages();
      }
    };
    if (container) container.addEventListener('scroll', handleScroll);
    return () => {
      if (container) container.removeEventListener('scroll', handleScroll);
    };
  }, [isLoadingMore, currentPage, totalPages, loadMoreMessages]);

  useEffect(() => {
    return () => {
      clearPolling();
    };
  }, [clearPolling]);

  if (!details && !isLoading) {
    return <div className="p-4 text-center text-muted-foreground">Seleccione una conversación para ver los detalles.</div>;
  }

  return (
    <div className="flex h-full flex-col gap-3 p-1">
      <div ref={chatContainerRef} className="mt-1 p-1 border rounded-md max-h-[500px] h-[500px] overflow-y-auto flex flex-col-reverse bg-muted/20">
        <div className="space-y-3 p-3">
        {isLoading && messages.length === 0 && (
            Array.from({ length: 5 }).map((_, index) => (
                <div key={`skel-${index}`} className={`flex ${index % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                    <Skeleton className={`h-8 w-3/5 rounded-lg ${index % 2 === 0 ? 'bg-blue-200' : 'bg-gray-300'}`} />
                </div>
            ))
        )}

        {!isLoading && error && <p className="text-red-500 text-center">Error: {error}</p>}
        
        {!isLoading && !error && messages.length === 0 && (
            <p className="text-center text-muted-foreground">No se encontraron mensajes para esta conversación.</p>
        )}

        {messages.map((msg) => (
           <div
              key={msg.id} 
              className={`flex flex-col ${
                msg.sender === 'system'
                  ? 'items-center'
                  : msg.sender === 'user' || msg.sender === 'human'
                    ? 'items-end'
                    : 'items-start'
              }`}
            >
              {msg.sender === 'system' ? (
                <p className="text-xs text-center text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  {msg.text}
                </p>
              ) : (
                <div
                  className={`p-2 px-3 rounded-lg max-w-[75%] break-words shadow-sm ${ 
                    msg.sender === 'user'
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : msg.sender === 'human'
                        ? 'bg-amber-500 text-white rounded-br-none'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                </div>
              )}
              <p className={`text-xs mt-1 ${
                msg.sender === 'user' || msg.sender === 'human' ? 'text-right' : 'text-left'
              } text-gray-500 dark:text-gray-400`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))}
        </div>

        {isLoadingMore && (
          <div className="text-center py-3 sticky top-0 bg-muted/80 w-full backdrop-blur-sm">
            <p className="text-sm">Cargando mensajes anteriores...</p> 
          </div>
          )}
      </div>

      {details?.contactId ? (
        <div className="border rounded-md p-3 space-y-2 bg-background">
          <Textarea
            value={outgoingMessage}
            onChange={(event) => setOutgoingMessage(event.target.value)}
            placeholder="Escribí un mensaje para este contacto..."
            rows={3}
            disabled={isSending}
          />
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs">
              {sendError ? <span className="text-red-500">{sendError}</span> : null}
              {!sendError && sendSuccess ? (
                <span className="text-emerald-600">{sendSuccess}</span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={isHumanMode ? 'secondary' : 'outline'}
                onClick={handleToggleHandoff}
                disabled={isUpdatingHandoff}
              >
                {isUpdatingHandoff
                  ? 'Actualizando...'
                  : isHumanMode
                    ? 'Devolver al bot'
                    : 'Tomar conversación'}
              </Button>
              <Button
                type="button"
                onClick={handleSendMessage}
                disabled={
                  isSending || outgoingMessage.trim().length === 0 || !isHumanMode
                }
              >
                {isSending ? 'Enviando...' : 'Enviar'}
              </Button>
            </div>
          </div>
          {!isHumanMode ? (
            <p className="text-xs text-muted-foreground">
              Tomá la conversación para pausar flujos del bot antes de responder.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}; 
