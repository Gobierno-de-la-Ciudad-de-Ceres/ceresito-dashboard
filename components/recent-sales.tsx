import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ConversationView, ConversationViewProps } from "@/components/conversation/conversation-view";

// Interfaz para los datos de interacción que vienen de la API de last-interactions
interface InteractionFromAPI {
  id: number; // Este es el contactId
  phone: string;
  contact_name: string | null;
  lastInteraction: string; // Fecha como string ISO de la última interacción en general
  lastMessage: { // Detalles del último mensaje DENTRO de una conversación estructurada
    answer: string;
    createdAt: string; // Fecha del último mensaje, podría usarse para el timestamp si es necesario
    conversation_id: string; // ID de la conversación a la que pertenece este mensaje
  } | null; // lastMessage puede ser nulo si no hay una conversación estructurada reciente
}

// No debe haber una definición local de ConversationViewProps aquí.

export function RecentSales() {
  const PAGE_SIZE = 6;
  const [interactions, setInteractions] = useState<InteractionFromAPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Este estado debe coincidir exactamente con la prop 'details' de ConversationView
  const [conversationDetailsForModal, setConversationDetailsForModal] = useState<ConversationViewProps['details']>(null);
  const [displayNameForModal, setDisplayNameForModal] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetch('/api/core/contacts/last-interactions', { cache: 'no-store' })
      .then(response => {
        if (!response.ok) {
          throw new Error('Error al obtener las últimas interacciones');
        }
        return response.json();
      })
      .then((data: InteractionFromAPI[]) => {
         setInteractions(data);
         setCurrentPage(1);
      })
      .catch(fetchError => {
        console.error(fetchError);
        setError(fetchError.message || "Error desconocido");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const getInitials = (name: string | null): string => {
    if (name) {
      const words = name.split(' ');
      if (words.length > 1) {
        return (words[0][0] + words[1][0]).toUpperCase();
      }
      return words[0][0].toUpperCase();
    }
    return "#";
  };

  const truncateMessage = (message: string | undefined | null, maxLength = 45): string => {
    if (!message) return "";
    if (message.length <= maxLength) {
      return message;
    }
    return message.substring(0, maxLength) + "...";
  };

  const totalPages = Math.max(1, Math.ceil(interactions.length / PAGE_SIZE));
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageInteractions = interactions.slice(pageStart, pageStart + PAGE_SIZE);

  const handleInteractionClick = (interaction: InteractionFromAPI) => {
    // Solo abrir el modal si hay un lastMessage y un conversation_id válidos
    if (interaction.lastMessage && interaction.lastMessage.conversation_id) {
      setConversationDetailsForModal({
        contactId: interaction.id, // interaction.id es el contactId
        conversationId: interaction.lastMessage.conversation_id, // Usar el conversation_id del mensaje
      });
      setDisplayNameForModal(interaction.contact_name || interaction.phone);
      setIsModalOpen(true);
    } else {
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Ultimas Conversaciones</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto">
        <Dialog open={isModalOpen} onOpenChange={(open) => { 
          setIsModalOpen(open);
          if (!open) setConversationDetailsForModal(null); // Limpiar detalles al cerrar
        }}>
          <div className="space-y-1">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-3 p-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-grow">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))
            ) : error ? (
              <p className="text-sm text-destructive p-2">Error: {error}</p>
            ) : interactions.length === 0 ? (
              <p className="text-sm text-muted-foreground p-2">No hay interacciones recientes.</p>
            ) : (
              pageInteractions.map((interaction) => {
                const isClickable = !!(interaction.lastMessage && interaction.lastMessage.conversation_id);

                return (
                <div
                  key={interaction.id}
                  className={`flex items-center p-2 rounded-lg space-x-3 ${
                    isClickable
                      ? 'cursor-pointer hover:bg-accent hover:text-accent-foreground'
                      : 'opacity-75' // Estilo para no clickeables
                  }`}
                  onClick={isClickable ? () => handleInteractionClick(interaction) : undefined}
                  title={isClickable ? `Ver conversación con ${interaction.contact_name || interaction.phone}` : "No hay detalle de conversación disponible"}
                >
                  <Avatar className="h-10 w-10 text-sm">
                    <AvatarFallback>{getInitials(interaction.contact_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-grow overflow-hidden">
                    <p className="text-sm font-medium leading-tight truncate">
                      {interaction.contact_name || interaction.phone}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {truncateMessage(interaction.lastMessage?.answer)}
                    </p>
                  </div>
                  {interaction.lastMessage?.createdAt && (
                     <p className="text-xs text-muted-foreground self-start flex-shrink-0 whitespace-nowrap">
                       {formatDistanceToNow(new Date(interaction.lastMessage.createdAt), { addSuffix: true, locale: es })}
                     </p>
                  )}
                </div>
               );
             })
            )}
          </div>
          {!isLoading && !error && interactions.length > PAGE_SIZE ? (
            <div className="mt-3 flex items-center justify-between border-t pt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage <= 1}
              >
                Anterior
              </Button>
              <span className="text-xs text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage >= totalPages}
              >
                Siguiente
              </Button>
            </div>
          ) : null}

          {conversationDetailsForModal && (
            <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh] flex flex-col p-0">
              <DialogHeader className="p-4 pb-2 border-b">
                <DialogTitle className="text-lg">Conversación con {displayNameForModal || 'Desconocido'}</DialogTitle>
                 {/* <DialogDescription>ID Conversación: {conversationDetailsForModal.conversationId}</DialogDescription> */}
              </DialogHeader>
              <div className="flex-grow overflow-y-hidden p-1 pb-2 pr-0 mr-0">
                <ConversationView details={conversationDetailsForModal} />
              </div>
            </DialogContent>
          )}
        </Dialog>
      </CardContent>
    </Card>
  );
}
