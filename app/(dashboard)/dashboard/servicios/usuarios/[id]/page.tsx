"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
  Shield,
  Loader2,
  AlertCircle,
  Edit,
  FileText
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient, APIUserResponse } from "../../_lib/api-client";

interface UserDetailPageProps {
  params: {
    id: string;
  };
}

export default function UserDetailPage({ params }: UserDetailPageProps) {
  const router = useRouter();
  const [user, setUser] = useState<APIUserResponse | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos del usuario
  useEffect(() => {
    async function fetchUser() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiClient.getUser(params.id);
        
        if (response.success) {
          setUser(response.data);
        } else {
          setError(response.message || 'Error al cargar el usuario');
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Error de conexión al cargar el usuario');
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Cargando información del usuario...</span>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-600 font-medium">{error || 'Usuario no encontrado'}</p>
            </div>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => router.push('/dashboard/servicios/usuarios')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Usuarios
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-purple-500">Admin</Badge>;
      case "professional":
        return <Badge className="bg-blue-500">Profesional</Badge>;
      case "citizen":
        return <Badge className="bg-green-500">Ciudadano</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push('/dashboard/servicios/usuarios')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-muted-foreground">
              Detalles del usuario
            </p>
          </div>
        </div>
        <Button 
          variant="outline"
          onClick={() => router.push(`/dashboard/servicios/usuarios/${params.id}/edit`)}
        >
          <Edit className="mr-2 h-4 w-4" />
          Editar Usuario
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Información Principal */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Información Personal</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nombre Completo</p>
                <p className="text-base font-semibold">{user.firstName} {user.lastName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="text-base">{user.email}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">DNI</p>
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <p className="text-base">{user.dni || "No proporcionado"}</p>
                </div>
              </div>
              {user.phone && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p className="text-base">{user.phone}</p>
                  </div>
                </div>
              )}
              {user.location && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ubicación</p>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="text-base">{user.location}</p>
                  </div>
                </div>
              )}
              {user.birthDate && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fecha de Nacimiento</p>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-base">{formatDate(user.birthDate)}</p>
                  </div>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fecha de Registro</p>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-base">{formatDate(user.createdAt)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estado y Verificación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Estado</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Rol</p>
              {getRoleBadge(user.role)}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Verificación</p>
              {user.verified ? (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Verificado
                </Badge>
              ) : (
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                  <Clock className="mr-1 h-3 w-3" />
                  Sin verificar
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Información Profesional */}
        {user.professional && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Briefcase className="h-5 w-5" />
                <span>Información Profesional</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estado del Profesional</p>
                  {user.professional.status === 'active' && (
                    <Badge className="bg-green-500 mt-1">Activo</Badge>
                  )}
                  {user.professional.status === 'pending' && (
                    <Badge className="bg-yellow-500 mt-1">Pendiente</Badge>
                  )}
                  {user.professional.status === 'suspended' && (
                    <Badge className="bg-red-500 mt-1">Suspendido</Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Verificación Profesional</p>
                  {user.professional.verified ? (
                    <Badge variant="outline" className="text-green-600 border-green-600 mt-1">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Verificado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600 mt-1">
                      <Clock className="mr-1 h-3 w-3" />
                      Sin verificar
                    </Badge>
                  )}
                </div>
                {user.professional.id && (
                  <div className="col-span-2">
                    <Button 
                      variant="outline"
                      onClick={() => router.push(`/dashboard/servicios/profesionales/${user.professional!.id}`)}
                    >
                      Ver Perfil Profesional Completo
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estadísticas */}
        {user.stats && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle>Estadísticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {user.stats.hasProfessional && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Solicitudes de Contacto</p>
                    <p className="text-2xl font-bold">{user.stats.contactRequests || 0}</p>
                  </div>
                )}
                {user.stats.reviews > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Reseñas</p>
                    <p className="text-2xl font-bold">{user.stats.reviews}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Es Profesional</p>
                  <p className="text-2xl font-bold">
                    {user.stats.hasProfessional ? (
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    ) : (
                      <XCircle className="h-8 w-8 text-gray-400" />
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
