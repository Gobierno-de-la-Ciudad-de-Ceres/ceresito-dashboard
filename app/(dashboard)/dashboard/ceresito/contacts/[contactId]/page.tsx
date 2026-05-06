"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import BreadCrumb from "@/components/breadcrumb";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { 
  ContactDetail, 
  ConversationSummary,
  PaginatedConversationSummaries,
  HistoryEntry,
  PaginatedHistory
} from "@/types/contact-detail";
// Importaremos componentes específicos más adelante
// import { ContactInfoCard } from "./components/contact-info-card";
// import { ReclamosTable } from "./components/reclamos-table";
// import { ConversationsList } from "./components/conversations-list";
// import { HistoryList } from "./components/history-list";

// Importar los nuevos componentes de UI
import { ContactInfoCard } from "./_components/contact-info-card";
import { ReclamosTable } from "./_components/reclamos-table";
import { ConversationsList } from "./_components/conversations-list";
import { HistoryList } from "./_components/history-list";

const CONVERSATIONS_PAGE_SIZE = 10;
const HISTORY_PAGE_SIZE = 20;

export default function ContactDetailPage() {
  const params = useParams();
  const contactId = params.contactId as string;

  const [contactDetail, setContactDetail] = useState<ContactDetail | null>(null);
  const [conversationSummaries, setConversationSummaries] = useState<ConversationSummary[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  
  const [convCurrentPage, setConvCurrentPage] = useState(1);
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const [convTotalPages, setConvTotalPages] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  
  const [totalConvCount, setTotalConvCount] = useState(0);
  const [totalHistoryCount, setTotalHistoryCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [loadingConv, setLoadingConv] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const breadcrumbItems = [
    { title: "Contactos", link: "/dashboard/ceresito/contacts" },
    { title: "Detalles del contacto", link: `/dashboard/ceresito/contacts/${contactId}` },
  ];

  // Fetch contact details (includes reclamos)
  useEffect(() => {
    if (!contactId) return;
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/core/contacts/${contactId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: ContactDetail = await response.json();
        setContactDetail(data);
        setTotalConvCount(data.historyStats.countByContactId);
        setTotalHistoryCount(data.historyStats.countByPhone);
        setError(null);
      } catch (e: any) {
        setError(e.message);
        console.error("Failed to fetch contact details:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [contactId]);

  // Fetch conversations
  const fetchConversations = useCallback(async (pageToFetch: number) => {
    if (!contactId) return;
    if (pageToFetch < 1) return;
    setLoadingConv(true);
    try {
      const response = await fetch(`/api/core/contacts/${contactId}/conversations?page=${pageToFetch}&limit=${CONVERSATIONS_PAGE_SIZE}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const apiResponse: PaginatedConversationSummaries = await response.json();

      setConversationSummaries(apiResponse.data);
      setConvCurrentPage(apiResponse.currentPage);
      setConvTotalPages(apiResponse.pageCount);
      setTotalConvCount(apiResponse.total);
    } catch (e: any) {
      console.error("Failed to fetch conversation summaries:", e);
    } finally {
      setLoadingConv(false);
    }
  }, [contactId]);

  // Fetch history
  const fetchHistory = useCallback(async (pageToFetch: number) => {
    if (!contactDetail?.phone || (pageToFetch > historyCurrentPage && pageToFetch > historyTotalPages && pageToFetch !== 1)) return;
    setLoadingHistory(true);
    try {
      const response = await fetch(`/api/core/history?phone=${contactDetail.phone}&page=${pageToFetch}&limit=${HISTORY_PAGE_SIZE}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const apiResponse: PaginatedHistory = await response.json();
      
      setHistory((prev: HistoryEntry[]) => 
        pageToFetch === 1 ? apiResponse.items : [...prev, ...apiResponse.items]
      );
      setHistoryCurrentPage(apiResponse.page);
      setHistoryTotalPages(Math.ceil(apiResponse.total / apiResponse.pageSize));
      if(pageToFetch === 1 || !totalHistoryCount) setTotalHistoryCount(apiResponse.total);
    } catch (e: any) {
      console.error("Failed to fetch history:", e);
    } finally {
      setLoadingHistory(false);
    }
  }, [contactDetail?.phone, historyCurrentPage, historyTotalPages, totalHistoryCount]);

  // Carga inicial de conversaciones e historial
  useEffect(() => {
    if (contactId) {
      fetchConversations(1); // Carga la primera página
    }
  }, [contactId, fetchConversations]);

  useEffect(() => {
    if (contactDetail?.phone) {
      fetchHistory(1); // Carga la primera página
    }
  }, [contactDetail?.phone, fetchHistory]);

  if (loading && !contactDetail) {
    return <div className="p-8"><p>Loading contact details...</p></div>;
  }

  if (error) {
    return <div className="p-8"><p>Error loading contact details: {error}</p></div>;
  }

  if (!contactDetail) {
    return <div className="p-8"><p>Contact not found.</p></div>;
  }

  const hasMoreHist = historyCurrentPage < historyTotalPages;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <BreadCrumb items={breadcrumbItems} />
      <div className="flex items-start justify-between">
        <Heading title={`Contacto: ${contactDetail.contact_name || contactDetail.phone || 'N/A'}`} description={`Detalles del contacto ID: ${contactDetail.id}`} />
      </div>
      <Separator />

      <ContactInfoCard contact={contactDetail} />
      
      <Separator />

      <ReclamosTable reclamos={contactDetail.reclamos} />

      <Separator />

      <ConversationsList 
        conversationSummaries={conversationSummaries} 
        loading={loadingConv} 
        onPageChange={fetchConversations}
        currentPage={convCurrentPage}
        totalPages={convTotalPages}
        totalConversations={totalConvCount} 
        contactId={parseInt(contactId)}
      />

      <Separator />

      <HistoryList 
        historyEntries={history} 
        loading={loadingHistory} 
        onLoadMore={() => fetchHistory(historyCurrentPage + 1)} 
        hasMore={hasMoreHist}
        totalHistory={totalHistoryCount}
      />
    </div>
  );
} 
