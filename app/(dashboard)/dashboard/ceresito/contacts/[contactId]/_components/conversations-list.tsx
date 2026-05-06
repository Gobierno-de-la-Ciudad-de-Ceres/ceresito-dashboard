"use client";

import { useState } from "react";
import { ConversationSummary } from "@/types/contact-detail";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ConversationView, ConversationViewProps } from "@/components/conversation/conversation-view";
import { ScrollArea } from "@/components/ui/scroll-area"; // Para la lista si es muy larga
import { Eye } from "lucide-react"; // Icono para el botón de ver

interface ConversationsListProps {
  conversationSummaries: ConversationSummary[];
  loading: boolean;
  onPageChange: (page: number) => void;
  currentPage: number;
  totalPages: number;
  totalConversations: number;
  contactId: number; // Necesario para pasar a ConversationView
}

export function ConversationsList({ 
  conversationSummaries, 
  loading, 
  onPageChange,
  currentPage,
  totalPages,
  totalConversations,
  contactId
}: ConversationsListProps) {

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConversationDetails, setSelectedConversationDetails] = useState<ConversationViewProps['details']>(null);
  const [selectedConvDisplayName, setSelectedConvDisplayName] = useState<string>("");
  const effectiveTotalPages = Math.max(totalPages, 1);
  const showPagination = totalConversations > conversationSummaries.length || effectiveTotalPages > 1;

  const handleSummaryClick = (summary: ConversationSummary) => {
    setSelectedConversationDetails({
      contactId: contactId, // El contactId general de la página de detalles
      conversationId: summary.conversation_id,
    });
    setSelectedConvDisplayName(summary.nombre || summary.telefono || `Conversación ID: ${summary.conversation_id}`);
    setIsModalOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Conversaciones ({totalConversations})</CardTitle>
        </CardHeader>
        <CardContent>
          {conversationSummaries.length === 0 && !loading && (
            <p className="text-muted-foreground">No se encontraron conversaciones para este contacto.</p>
          )}
          {conversationSummaries.length > 0 && (
            <ScrollArea className="h-[300px] pr-3">
              <div className="space-y-3">
                {conversationSummaries.map((summary) => (
                  <div 
                    key={summary.id} 
                    className="p-3 border rounded-md shadow-sm hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                    onClick={() => handleSummaryClick(summary)}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-medium">
                        {summary.nombre || summary.telefono} - <span className="text-xs text-muted-foreground">ID: {summary.conversation_id}</span>
                      </p>
                      <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); handleSummaryClick(summary);}} title="View Conversation Details">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground grid grid-cols-2 gap-x-2">
                      <p>Inicio: {new Date(summary.fecha_inicio).toLocaleString()}</p>
                      <p>Fin: {new Date(summary.fecha_hora).toLocaleString()}</p>
                      <p>Duración: {summary.duracion_minutos}</p>
                      <p>Razón Fin: {summary.razon_fin || 'N/A'}</p>
                      {summary.ultimo_flujo && <p>Último Flujo: {summary.ultimo_flujo}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
          {loading && <p className="text-center py-4 text-muted-foreground">Loading conversation summaries...</p>}
        </CardContent>
        {showPagination && !loading && (
          <CardFooter>
            <div className="flex w-full items-center justify-between gap-2">
              <Button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                variant="outline"
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {currentPage} de {effectiveTotalPages}
              </span>
              <Button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= effectiveTotalPages}
                variant="outline"
              >
                Siguiente
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {selectedConversationDetails && (
        <Dialog open={isModalOpen} onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) setSelectedConversationDetails(null); // Limpiar al cerrar
        }}>
          <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh] flex flex-col p-0">
            <DialogHeader className="p-4 pb-2 border-b">
              <DialogTitle className="text-lg">Conversación con {selectedConvDisplayName}</DialogTitle>
              <DialogDescription>
                Contact ID: {selectedConversationDetails.contactId} | Conversation ID: {selectedConversationDetails.conversationId}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-y-hidden p-1 pb-2 pr-0 mr-0">
               <ConversationView details={selectedConversationDetails} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
} 
