"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ArrowLeft,
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Star,
  Briefcase,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  FileText,
  Edit,
  Instagram,
  Facebook,
  Linkedin,
  Globe,
  FileImage,
  Award,
  AlertCircle,
  CheckCircle2,
  MessageSquare as WhatsApp,
  Loader2,
  Chrome,
  UserPlus
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient, APICertificationResponse } from "../../_lib/api-client";
import { adaptProfessional } from "../../_lib/api-adapters";
import { getUserInitials, resolveServicesMediaSrc } from "../../_lib/media";
import { mockReviews } from "../../_lib/mock-data";
import { Professional } from "../../_types";

interface ProfessionalDetailPageProps {
  params: {
    id: string;
  };
}

export default function ProfessionalDetailPage({ params }: ProfessionalDetailPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [professional, setProfessional] = useState<Professional | undefined>();
  const [certifications, setCertifications] = useState<APICertificationResponse[]>([]);
  const [isLoadingCertifications, setIsLoadingCertifications] = useState(false);
  const [updatingCertificationId, setUpdatingCertificationId] = useState<string | null>(null);
  const [selectedCertification, setSelectedCertification] = useState<APICertificationResponse | null>(null);
  const [certificationAdminNotes, setCertificationAdminNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReviewingCriminalRecord, setIsReviewingCriminalRecord] = useState(false);

  // Cargar datos del profesional
  useEffect(() => {
    async function fetchProfessional() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiClient.getProfessional(params.id);
        
        if (response.success) {
          const adaptedProfessional = adaptProfessional(response.data);
          setProfessional(adaptedProfessional);
        } else {
          setError(response.message || 'Error al cargar el profesional');
        }
      } catch (err) {
        console.error('Error fetching professional:', err);
        setError('Error de conexión al cargar el profesional');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfessional();
  }, [params.id]);

  // Cargar certificaciones del profesional
  useEffect(() => {
    async function fetchCertifications() {
      if (!professional?.id) return;
      
      try {
        setIsLoadingCertifications(true);
        const response = await apiClient.listCertifications({
          professionalId: professional.id,
          limit: 100, // Obtener todas las certificaciones del profesional
        });
        
        if (response.success && 'pagination' in response) {
          setCertifications(response.data);
        }
      } catch (err) {
        console.error('Error fetching certifications:', err);
      } finally {
        setIsLoadingCertifications(false);
      }
    }

    if (professional?.id) {
      fetchCertifications();
    }
  }, [professional?.id]);

  const reloadProfessional = useCallback(async () => {
    const response = await apiClient.getProfessional(params.id);

    if (!response.success) {
      throw new Error(response.message || "Error al recargar el profesional");
    }

    const adaptedProfessional = adaptProfessional(response.data);
    setProfessional(adaptedProfessional);
    return adaptedProfessional;
  }, [params.id]);

  const reloadCertifications = useCallback(async (professionalId: string) => {
    const response = await apiClient.listCertifications({
      professionalId,
      limit: 100,
    });

    if (response.success && "pagination" in response) {
      setCertifications(response.data);
      return response.data;
    }

    throw new Error(
      "message" in response ? response.message || "Error al recargar certificaciones" : "Error al recargar certificaciones"
    );
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Cargando información del profesional...</span>
        </div>
      </div>
    );
  }

  if (error || !professional) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-muted-foreground">
            {error || 'Profesional no encontrado'}
          </h2>
          <p className="text-muted-foreground mt-2">
            El profesional que buscas no existe o ha sido eliminado.
          </p>
          <Link href="/dashboard/servicios/profesionales">
            <Button className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a la lista
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const professionalServices = professional.services || [];
  const documentation = professional.documentation;
  const isCertified = certifications.some((certification) => certification.status === "approved");
  const toProxyDownloadPath = (downloadPath?: string) =>
    downloadPath ? `/api/servicios-externos${downloadPath}` : null;
  const criminalRecordReviewStatus = documentation?.criminalRecordStatus ?? "pending";
  const canReviewCriminalRecord =
    !!documentation?.criminalRecord &&
    (criminalRecordReviewStatus === "pending" || criminalRecordReviewStatus === null);
  
  // TODO: Las reviews aún vienen como mock, pendiente de endpoint en la API
  const professionalReviews = mockReviews.filter(r => r.professionalId === professional.id);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Activo</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pendiente</Badge>;
      case "suspended":
        return <Badge className="bg-red-500">Suspendido</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getVerifiedBadge = (verified: boolean) => {
    return verified ? (
      <Badge variant="outline" className="text-green-600 border-green-600">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Verificado
      </Badge>
    ) : (
      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
        <AlertCircle className="mr-1 h-3 w-3" />
        Sin verificar
      </Badge>
    );
  };

  const getCertifiedBadge = (certified: boolean) => {
    return certified ? (
      <Badge variant="outline" className="text-blue-600 border-blue-600">
        <Award className="mr-1 h-3 w-3" />
        Certificado
      </Badge>
    ) : (
      <Badge variant="outline" className="text-gray-600 border-gray-600">
        <Clock className="mr-1 h-3 w-3" />
        Sin certificar
      </Badge>
    );
  };

  const getEmailVerifiedBadge = (emailVerified: boolean) => {
    return emailVerified ? (
      <Badge variant="outline" className="text-green-600 border-green-600">
        <Mail className="mr-1 h-3 w-3" />
        Email verificado
      </Badge>
    ) : (
      <Badge variant="outline" className="text-red-600 border-red-600">
        <AlertCircle className="mr-1 h-3 w-3" />
        Email sin verificar
      </Badge>
    );
  };

  const getRegistrationTypeBadge = (registrationType?: string) => {
    if (!registrationType) return null;
    
    switch (registrationType) {
      case 'google':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            <Chrome className="mr-1 h-3 w-3" />
            Registrado con Google
          </Badge>
        );
      case 'facebook':
        return (
          <Badge variant="outline" className="text-blue-700 border-blue-700">
            <Facebook className="mr-1 h-3 w-3" />
            Registrado con Facebook
          </Badge>
        );
      case 'email':
      default:
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-600">
            <Mail className="mr-1 h-3 w-3" />
            Registrado con Email
          </Badge>
        );
    }
  };


  const handleApprove = async () => {
    if (!professional) return;
    
    setIsProcessing(true);
    try {
      const response = await apiClient.updateProfessionalStatus(professional.id, 'active', false);
      
      if (response.success) {
        await reloadProfessional();
        toast({
          title: "Profesional aprobado",
          description: "El profesional quedó activo. El tilde azul se habilita al aprobar antecedentes.",
        });
      } else {
        toast({
          title: "No se pudo aprobar",
          description: response.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Error approving professional:', err);
      toast({
        title: "Error al aprobar",
        description: "Ocurrió un problema al aprobar el profesional.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!professional) return;
    
    setIsProcessing(true);
    try {
      const response = await apiClient.updateProfessionalStatus(professional.id, 'pending', false);
      
      if (response.success) {
        await reloadProfessional();
        toast({
          title: "Solicitud actualizada",
          description: "El profesional volvió a estado pendiente.",
        });
      } else {
        toast({
          title: "No se pudo actualizar",
          description: response.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Error rejecting professional:', err);
      toast({
        title: "Error al rechazar",
        description: "Ocurrió un problema al rechazar al profesional.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCertify = async () => {
    if (!professional) return;
    
    setIsProcessing(true);
    try {
      // Nota: certified no está disponible en el endpoint de status, usar update general
      const response = await apiClient.updateProfessional(professional.id, { certified: true });
      
      if (response.success) {
        // Actualizar el estado local
        await reloadProfessional();
        toast({
          title: "Estado actualizado",
          description: "Se actualizó la certificación del profesional.",
        });
      } else {
        toast({
          title: "No se pudo certificar",
          description: response.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Error certifying professional:', err);
      toast({
        title: "Error al certificar",
        description: "Ocurrió un problema al certificar los servicios.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCriminalRecordReview = async (status: "approved" | "rejected") => {
    if (!professional) return;

    try {
      setIsReviewingCriminalRecord(true);
      const response = await apiClient.reviewProfessionalCriminalRecord(professional.id, {
        status,
        adminNotes: approvalNotes || undefined,
      });

      if (response.success) {
        await reloadProfessional();
        toast({
          title:
            status === "approved"
              ? "Antecedentes aprobados"
              : "Antecedentes rechazados",
          description:
            status === "approved"
              ? "Se otorgó el estado verificado al profesional."
              : "El profesional quedó sin verificar hasta nueva revisión.",
        });
      } else {
        toast({
          title: "No se pudo actualizar antecedentes",
          description: response.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error reviewing criminal record:", err);
      toast({
        title: "Error al revisar antecedentes",
        description: "Ocurrió un problema al actualizar la revisión del documento.",
        variant: "destructive",
      });
    } finally {
      setIsReviewingCriminalRecord(false);
    }
  };

  const handleOpenCertificationModal = (cert: APICertificationResponse) => {
    setSelectedCertification(cert);
    setCertificationAdminNotes(cert.adminNotes || "");
  };

  const handleCloseCertificationModal = () => {
    setSelectedCertification(null);
    setCertificationAdminNotes("");
    setUpdatingCertificationId(null);
  };

  const handleUpdateCertification = async (status: 'approved' | 'rejected' | 'suspended') => {
    if (!selectedCertification) return;

    try {
      setUpdatingCertificationId(selectedCertification.id);
      const response = await apiClient.updateCertification(selectedCertification.id, {
        status,
        adminNotes: certificationAdminNotes || undefined,
      });

      if (response.success) {
        setCertifications((prev) =>
          prev.map((c) => (c.id === selectedCertification.id ? response.data : c))
        );
        await reloadProfessional();
        
        const statusMessages = {
          approved: "Certificación aprobada correctamente",
          rejected: "Certificación rechazada",
          suspended: "Certificación suspendida",
        };
        
        toast({
          title: "Certificación actualizada",
          description: statusMessages[status],
        });
        handleCloseCertificationModal();
      } else {
        toast({
          title: "No se pudo actualizar la certificación",
          description:
            response.message ||
            `Error al ${status === 'approved' ? 'aprobar' : status === 'rejected' ? 'rechazar' : 'suspender'} la certificación`,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(`Error updating certification:`, err);
      toast({
        title: "Error al actualizar la certificación",
        description: `No se pudo ${status === 'approved' ? 'aprobar' : status === 'rejected' ? 'rechazar' : 'suspender'} la certificación.`,
        variant: "destructive",
      });
    } finally {
      setUpdatingCertificationId(null);
    }
  };


  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header con botón volver arriba */}
      <div className="space-y-4">
        <Link href="/dashboard/servicios/profesionales">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a la lista
          </Button>
        </Link>
        
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 border border-border/60 shadow-sm md:h-20 md:w-20">
            <AvatarImage
              src={resolveServicesMediaSrc(professional.user?.picture) || undefined}
              alt={`${professional.user?.firstName || ""} ${professional.user?.lastName || ""}`.trim()}
              className="object-cover"
            />
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
              {getUserInitials(professional.user?.firstName, professional.user?.lastName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              {professional.user?.firstName} {professional.user?.lastName}
            </h2>
            <p className="text-muted-foreground">
              Detalles del profesional y solicitud de registro
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          {getStatusBadge(professional.status)}
          {getVerifiedBadge(professional.verified)}
            {getCertifiedBadge(isCertified)}
            {getEmailVerifiedBadge(professional.user?.emailVerified || false)}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Información principal */}
        <div className="md:col-span-2 space-y-6">
          {/* Información personal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Información Personal</span>
                </div>
                
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Nombre completo</p>
                    <p className="text-sm text-muted-foreground">
                      {professional.user?.firstName} {professional.user?.lastName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">
                      {professional.user?.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">DNI</p>
                    <p className="text-sm text-muted-foreground">
                      {professional.user?.dni || "No proporcionado"}
                    </p>
                  </div>
                </div>
                {(professional as any).registrationType && (
                  <div className="flex items-center space-x-3">
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Método de Registro</p>
                      <div className="mt-1">
                        {getRegistrationTypeBadge((professional as any).registrationType)}
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Teléfono</p>
                    <p className="text-sm text-muted-foreground">
                      {professional.user?.phone || "No proporcionado"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Ubicación</p>
                    <p className="text-sm text-muted-foreground">
                      {professional.location || "No especificada"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Ubicación del usuario</p>
                    <p className="text-sm text-muted-foreground">
                      {professional.user?.location || "No especificada"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Fecha de nacimiento</p>
                    <p className="text-sm text-muted-foreground">
                      {professional.user?.birthDate ? 
                        new Date(professional.user.birthDate).toLocaleDateString() : 
                        "No proporcionada"
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Fecha de registro</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(professional.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de contacto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Información de Contacto</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <WhatsApp className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">WhatsApp</p>
                    <p className="text-sm text-muted-foreground">
                      {professional.user?.whatsapp || "No proporcionado"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Instagram className="h-4 w-4 text-pink-600" />
                  <div>
                    <p className="text-sm font-medium">Instagram</p>
                    <p className="text-sm text-muted-foreground">
                      {professional.user?.instagram || "No proporcionado"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Facebook className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Facebook</p>
                    <p className="text-sm text-muted-foreground">
                      {professional.user?.facebook || "No proporcionado"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Linkedin className="h-4 w-4 text-blue-700" />
                  <div>
                    <p className="text-sm font-medium">LinkedIn</p>
                    <p className="text-sm text-muted-foreground">
                      {professional.user?.linkedin || "No proporcionado"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Sitio Web</p>
                    <p className="text-sm text-muted-foreground">
                      {professional.user?.website || "No proporcionado"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <FileImage className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Portfolio</p>
                    <p className="text-sm text-muted-foreground">
                      {professional.user?.portfolio || "No proporcionado"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">CV</p>
                    <p className="text-sm text-muted-foreground">
                      {professional.user?.cv || "No proporcionado"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Documentación</span>
              </CardTitle>
              <CardDescription>
                Estado de antecedentes penales y referencias laborales del profesional.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <Badge variant={professional.documentationRequired ? "default" : "secondary"}>
                  {professional.documentationRequired ? "Documentación requerida" : "No bloquea visibilidad"}
                </Badge>
                <Badge variant={professional.criminalRecordPresent ? "default" : "secondary"}>
                  {professional.criminalRecordPresent ? "Antecedentes cargados" : "Sin antecedentes"}
                </Badge>
                <Badge variant={professional.hasLaborReferences ? "outline" : "secondary"}>
                  {professional.hasLaborReferences ? "Con referencias laborales" : "Sin referencias"}
                </Badge>
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Certificado de antecedentes penales</p>
                    <p className="text-sm text-muted-foreground">
                      {documentation?.criminalRecord?.fileName || "No cargado"}
                    </p>
                    {documentation?.criminalRecord && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Estado revisión:{" "}
                        <span className="font-medium">
                          {documentation.criminalRecordStatus === "approved"
                            ? "Aprobado"
                            : documentation.criminalRecordStatus === "rejected"
                              ? "Rechazado"
                              : "Pendiente"}
                        </span>
                      </p>
                    )}
                  </div>
                  {documentation?.criminalRecord?.downloadPath && (
                    <a
                      href={toProxyDownloadPath(documentation.criminalRecord.downloadPath) || "#"}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button variant="outline" size="sm">Descargar</Button>
                    </a>
                  )}
                </div>
                {canReviewCriminalRecord && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleCriminalRecordReview("approved")}
                      disabled={isReviewingCriminalRecord}
                    >
                      Aprobar antecedentes
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleCriminalRecordReview("rejected")}
                      disabled={isReviewingCriminalRecord}
                    >
                      Rechazar antecedentes
                    </Button>
                    {isReviewingCriminalRecord && (
                      <span className="inline-flex items-center text-xs text-muted-foreground">
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Actualizando estado...
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Referencias laborales</p>
                  <p className="text-sm text-muted-foreground">
                    {(documentation?.laborReferences?.length || 0) > 0
                      ? `${documentation?.laborReferences?.length} referencia(s) cargada(s)`
                      : "No hay referencias laborales cargadas"}
                  </p>
                </div>

                {(documentation?.laborReferences || []).length > 0 && (
                  <div className="space-y-3">
                    {documentation?.laborReferences?.map((reference) => (
                      <div key={reference.id} className="rounded-lg border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="font-medium">{reference.name}</p>
                            <p className="text-sm text-muted-foreground">{reference.company}</p>
                            <p className="text-sm text-muted-foreground">{reference.contact}</p>
                            <p className="text-xs text-muted-foreground">
                              {reference.attachment?.fileName || "Sin adjunto"}
                            </p>
                          </div>
                          {reference.attachment?.downloadPath && (
                            <a
                              href={toProxyDownloadPath(reference.attachment.downloadPath) || "#"}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Button variant="outline" size="sm">Descargar adjunto</Button>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Información profesional */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Briefcase className="h-5 w-5" />
                <span>Información Profesional</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Años de experiencia</p>
                  <p className="text-sm text-muted-foreground">
                    {professional.experienceYears} años
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Grupo profesional</p>
                  <p className="text-sm text-muted-foreground">
                    {professional.professionalGroup === "oficios"
                      ? "Oficios"
                      : professional.professionalGroup === "profesiones"
                        ? "Profesiones"
                        : "No especificado"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Cobertura de servicio</p>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {(professional.serviceLocations && professional.serviceLocations.length > 0)
                      ? professional.serviceLocations.join(", ")
                      : "No especificada"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Biografía profesional</p>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {professional.bio}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Servicios ofrecidos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Briefcase className="h-5 w-5" />
                <span>Servicios Ofrecidos</span>
              </CardTitle>
              <CardDescription>
                Servicios que este profesional ofrece en la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {professionalServices.map((service) => (
                  <div key={service.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h4 className="font-medium">{service.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {service.description}
                        </p>
                        <div className="flex items-center space-x-4">
                          <Badge variant="outline">
                            {service.categoryGroup === "oficios" ? "Oficios" : "Profesiones"}
                          </Badge>
                          <span className="text-sm font-medium text-green-600">
                            {service.priceRange}
                          </span>
                          <Badge 
                            variant={service.available ? "default" : "secondary"}
                            className={service.available ? "bg-green-500" : ""}
                          >
                            {service.available ? "Disponible" : "No disponible"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {professionalServices.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Este profesional no ha registrado servicios aún.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel lateral de acciones */}
        <div className="space-y-6">
          {/* Estadísticas rápidas */}
          <Link href={`/dashboard/servicios/profesionales/${professional.id}/edit`} className="w-full">
                  <Button variant="default" size="sm" className="w-full">
                    <Edit className="mr-2 h-4 w-4" />
                    Editar Información
                  </Button>
                </Link>
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Calificación</span>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="text-sm">
                    {professional.rating > 0 ? professional.rating.toFixed(1) : "Sin calificar"}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Evaluaciones</span>
                <span className="text-sm text-muted-foreground">
                  {professional.reviewCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Servicios</span>
                <span className="text-sm text-muted-foreground">
                  {professionalServices.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Solicitudes de contacto</span>
                <span className="text-sm text-muted-foreground">
                  {professional.contactRequestsCount ?? 0}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Datos Sensibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">DNI</span>
                <span className="text-sm text-muted-foreground">
                  {professional.user?.dni || "No proporcionado"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Acciones de aprobación */}
          {professional.status === "pending" && (
            <Card>
              <CardHeader>
                <CardTitle>Acciones de Aprobación</CardTitle>
                <CardDescription>
                  Revisa la información y decide si aprobar o rechazar al profesional
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Notas sobre la decisión
                  </label>
                  <Textarea
                    placeholder="Agrega comentarios sobre tu decisión..."
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={handleApprove}
                    disabled={isProcessing}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Aprobar Profesional
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={handleReject}
                    disabled={isProcessing}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Rechazar Solicitud
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Acciones de certificación */}
          <Card>
            <CardHeader>
              <CardTitle>Certificación de Servicios</CardTitle>
              <CardDescription>
                {certifications.length > 0 
                  ? "Certificaciones enviadas por el profesional"
                  : "Certifica los servicios del profesional después de verificar su calidad"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingCertifications ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Cargando certificaciones...</span>
                </div>
              ) : certifications.length > 0 ? (
                <div className="space-y-3">
                  {certifications.map((cert) => {
                    const getCertStatusBadge = (status: string) => {
                      switch (status) {
                        case "approved":
                          return <Badge className="bg-green-500">Aprobada</Badge>;
                        case "pending":
                          return <Badge className="bg-yellow-500">Pendiente</Badge>;
                        case "rejected":
                          return <Badge className="bg-red-500">Rechazada</Badge>;
                        case "suspended":
                          return <Badge className="bg-orange-500">Suspendida</Badge>;
                        default:
                          return <Badge variant="secondary">{status}</Badge>;
                      }
                    };

                    return (
                      <div key={cert.id} className="p-3 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{cert.certificationType}</p>
                            {cert.issuingOrganization && (
                              <p className="text-xs text-muted-foreground">
                                {cert.issuingOrganization}
                              </p>
                            )}
                            {cert.certificationNumber && (
                              <p className="text-xs text-muted-foreground font-mono">
                                N° {cert.certificationNumber}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {getCertStatusBadge(cert.status)}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-3"
                              onClick={() => handleOpenCertificationModal(cert)}
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              Revisar
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          {cert.issuedAt && (
                            <div>
                              <span className="font-medium">Emitida:</span>{" "}
                              {new Date(cert.issuedAt).toLocaleDateString('es-AR')}
                            </div>
                          )}
                          {cert.expiresAt && (
                            <div>
                              <span className="font-medium">Vence:</span>{" "}
                              {new Date(cert.expiresAt).toLocaleDateString('es-AR')}
                            </div>
                          )}
                        </div>
                        {cert.adminNotes && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium">Notas:</span> {cert.adminNotes}
                            </p>
                          </div>
                        )}
                        {cert.category && (
                          <div className="pt-1">
                            <Badge variant="outline" className="text-xs">
                              {cert.category.name}
                            </Badge>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push(`/dashboard/servicios/certificaciones?professionalId=${professional.id}`)}
                  >
                    Ver todas las certificaciones
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Estado de certificación</span>
                    {getCertifiedBadge(isCertified)}
                  </div>
                  {!isCertified && (
                    <p className="text-sm text-muted-foreground">
                      Este profesional todavía no tiene certificaciones aprobadas.
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Información adicional */}
          <Card>
            <CardHeader>
              <CardTitle>Información Adicional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">ID del profesional</span>
                <span className="text-xs text-muted-foreground font-mono">
                  {professional.id}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">ID del usuario</span>
                <span className="text-xs text-muted-foreground font-mono">
                  {professional.userId}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Última actualización</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(professional.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de revisión de certificación */}
      <Dialog open={!!selectedCertification} onOpenChange={(open) => !open && handleCloseCertificationModal()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Revisar Certificación</DialogTitle>
            <DialogDescription>
              Detalles completos de la certificación enviada por el profesional
            </DialogDescription>
          </DialogHeader>
          
          {selectedCertification && (
            <div className="space-y-4">
              {/* Información básica */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tipo de Certificación</p>
                  <p className="text-sm font-semibold">{selectedCertification.certificationType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estado</p>
                  <div className="mt-1">
                    {(() => {
                      switch (selectedCertification.status) {
                        case "approved":
                          return <Badge className="bg-green-500">Aprobada</Badge>;
                        case "pending":
                          return <Badge className="bg-yellow-500">Pendiente</Badge>;
                        case "rejected":
                          return <Badge className="bg-red-500">Rechazada</Badge>;
                        case "suspended":
                          return <Badge className="bg-orange-500">Suspendida</Badge>;
                        default:
                          return <Badge variant="secondary">{selectedCertification.status}</Badge>;
                      }
                    })()}
                  </div>
                </div>
              </div>

              {selectedCertification.certificationNumber && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Número de Certificación</p>
                  <p className="text-sm font-mono">{selectedCertification.certificationNumber}</p>
                </div>
              )}

              {selectedCertification.issuingOrganization && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Organización Emisora</p>
                  <p className="text-sm">{selectedCertification.issuingOrganization}</p>
                </div>
              )}

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-4">
                {selectedCertification.issuedAt && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Fecha de Emisión</p>
                    <p className="text-sm">
                      {new Date(selectedCertification.issuedAt).toLocaleDateString('es-AR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
                {selectedCertification.expiresAt && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Fecha de Vencimiento</p>
                    <p className="text-sm">
                      {new Date(selectedCertification.expiresAt).toLocaleDateString('es-AR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Categoría */}
              {selectedCertification.category && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Categoría</p>
                  <Badge variant="outline">{selectedCertification.category.name}</Badge>
                </div>
              )}

              {/* Información del profesional */}
              {selectedCertification.professional && (
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Profesional</p>
                  <p className="text-sm">
                    {selectedCertification.professional.user.firstName}{' '}
                    {selectedCertification.professional.user.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedCertification.professional.user.email}
                  </p>
                </div>
              )}

              {/* Fechas del sistema */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fecha de Creación</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(selectedCertification.createdAt).toLocaleDateString('es-AR', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                {selectedCertification.reviewedAt && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Última Revisión</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(selectedCertification.reviewedAt).toLocaleDateString('es-AR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Notas del administrador */}
              <div>
                <label className="text-sm font-medium">Notas del Administrador</label>
                <Textarea
                  value={certificationAdminNotes}
                  onChange={(e) => setCertificationAdminNotes(e.target.value)}
                  placeholder="Agregar notas sobre esta certificación..."
                  className="mt-1 min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Estas notas serán visibles para el administrador y pueden incluir razones de aprobación, rechazo o suspensión.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleCloseCertificationModal}
              disabled={updatingCertificationId !== null}
            >
              Cancelar
            </Button>
            {selectedCertification?.status !== 'rejected' && (
              <Button
                variant="destructive"
                onClick={() => handleUpdateCertification('rejected')}
                disabled={updatingCertificationId !== null}
              >
                {updatingCertificationId === selectedCertification?.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Rechazar
                  </>
                )}
              </Button>
            )}
            {selectedCertification?.status !== 'suspended' && (
              <Button
                variant="outline"
                className="border-orange-500 text-orange-600 hover:bg-orange-50"
                onClick={() => handleUpdateCertification('suspended')}
                disabled={updatingCertificationId !== null}
              >
                {updatingCertificationId === selectedCertification?.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Suspender
                  </>
                )}
              </Button>
            )}
            {selectedCertification?.status !== 'approved' && (
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleUpdateCertification('approved')}
                disabled={updatingCertificationId !== null}
              >
                {updatingCertificationId === selectedCertification?.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Aprobar
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
