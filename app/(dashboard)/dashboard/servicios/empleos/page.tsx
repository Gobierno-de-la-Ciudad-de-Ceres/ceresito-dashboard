"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  Briefcase,
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Search,
  Trash2,
  Ban,
} from "lucide-react";
import {
  apiClient,
  APIAdminEmployerResponse,
  APIAdminJobPostResponse,
} from "../_lib/api-client";

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusBadge(status: APIAdminJobPostResponse["status"]) {
  if (status === "active") return <Badge className="bg-green-500">Activa</Badge>;
  if (status === "closed") return <Badge variant="secondary">Cerrada</Badge>;
  return <Badge className="bg-red-500">Dada de baja</Badge>;
}

export default function EmpleosAdminPage() {
  const [tab, setTab] = useState("vacantes");
  const [jobs, setJobs] = useState<APIAdminJobPostResponse[]>([]);
  const [employers, setEmployers] = useState<APIAdminEmployerResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"take-down" | "delete" | "employer-take-down">(
    "take-down",
  );
  const [selectedJob, setSelectedJob] = useState<APIAdminJobPostResponse | null>(null);
  const [selectedEmployer, setSelectedEmployer] = useState<APIAdminEmployerResponse | null>(null);
  const [reason, setReason] = useState("Dada de baja por administración");

  const loadJobs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.listJobPosts({
        page: currentPage,
        limit: 20,
        search: searchTerm || undefined,
        status:
          statusFilter === "all"
            ? undefined
            : (statusFilter as "active" | "closed" | "taken_down"),
      });
      if (response.success && "pagination" in response) {
        setJobs(response.data);
        setPagination(response.pagination);
      } else {
        setError((response as { message?: string }).message || "Error al cargar vacantes");
      }
    } catch (err) {
      console.error(err);
      setError("Error de conexión al cargar vacantes");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter]);

  const loadEmployers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.listEmployers({
        page: currentPage,
        limit: 20,
        search: searchTerm || undefined,
      });
      if (response.success && "pagination" in response) {
        setEmployers(response.data);
        setPagination(response.pagination);
      } else {
        setError((response as { message?: string }).message || "Error al cargar empresas");
      }
    } catch (err) {
      console.error(err);
      setError("Error de conexión al cargar empresas");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    if (tab === "vacantes") {
      void loadJobs();
    } else {
      void loadEmployers();
    }
  }, [tab, loadJobs, loadEmployers]);

  function openTakeDown(job: APIAdminJobPostResponse) {
    setSelectedJob(job);
    setSelectedEmployer(null);
    setDialogMode("take-down");
    setReason("Dada de baja por administración");
    setDialogOpen(true);
  }

  function openDelete(job: APIAdminJobPostResponse) {
    setSelectedJob(job);
    setSelectedEmployer(null);
    setDialogMode("delete");
    setReason("");
    setDialogOpen(true);
  }

  function openEmployerTakeDown(employer: APIAdminEmployerResponse) {
    setSelectedEmployer(employer);
    setSelectedJob(null);
    setDialogMode("employer-take-down");
    setReason("Vacantes dadas de baja por administración");
    setDialogOpen(true);
  }

  async function confirmAction() {
    setActionLoading(true);
    try {
      if (dialogMode === "take-down" && selectedJob) {
        const response = await apiClient.takeDownJobPost(selectedJob.id, reason);
        if (!response.success) throw new Error(response.message);
      } else if (dialogMode === "delete" && selectedJob) {
        const response = await apiClient.deleteJobPost(selectedJob.id);
        if (!response.success) throw new Error(response.message);
      } else if (dialogMode === "employer-take-down" && selectedEmployer) {
        const response = await apiClient.takeDownEmployerJobs(selectedEmployer.id, reason);
        if (!response.success) throw new Error(response.message);
      }
      setDialogOpen(false);
      if (tab === "vacantes") await loadJobs();
      else await loadEmployers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo completar la acción");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Empleos</h2>
        <p className="text-muted-foreground">
          Administrá vacantes publicadas y empresas registradas en Ceres en Red.
        </p>
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => {
          setTab(value);
          setCurrentPage(1);
          setSearchTerm("");
          setStatusFilter("all");
        }}
      >
        <TabsList>
          <TabsTrigger value="vacantes" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Vacantes
          </TabsTrigger>
          <TabsTrigger value="empresas" className="gap-2">
            <Building2 className="h-4 w-4" />
            Empresas
          </TabsTrigger>
        </TabsList>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={
                tab === "vacantes"
                  ? "Buscar por título, empresa, ubicación..."
                  : "Buscar por empresa, email, CUIT..."
              }
              value={searchTerm}
              onChange={(e) => {
                setCurrentPage(1);
                setSearchTerm(e.target.value);
              }}
            />
          </div>
          {tab === "vacantes" ? (
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setCurrentPage(1);
                setStatusFilter(value);
              }}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activas</SelectItem>
                <SelectItem value="closed">Cerradas</SelectItem>
                <SelectItem value="taken_down">Dadas de baja</SelectItem>
              </SelectContent>
            </Select>
          ) : null}
        </div>

        {error ? (
          <Card className="mt-4 border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-2 pt-6 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </CardContent>
          </Card>
        ) : null}

        <TabsContent value="vacantes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Vacantes</CardTitle>
              <CardDescription>
                Podés dar de baja (dejar de mostrar en público) o eliminar definitivamente una
                publicación.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : jobs.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No hay vacantes con esos filtros.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vacante</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Ubicación</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobs.map((job) => (
                        <TableRow key={job.id}>
                          <TableCell>
                            <div className="font-medium">{job.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {job.positionsCount}{" "}
                              {job.positionsCount === 1 ? "puesto" : "puestos"}
                            </div>
                          </TableCell>
                          <TableCell>{job.companyName}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1 text-sm">
                              <MapPin className="h-3.5 w-3.5" />
                              {job.location || "-"}
                            </span>
                          </TableCell>
                          <TableCell>{statusBadge(job.status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(job.searchStartsAt)} — {formatDate(job.searchEndsAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {job.status === "active" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openTakeDown(job)}
                                >
                                  <Ban className="mr-1 h-4 w-4" />
                                  Dar de baja
                                </Button>
                              ) : null}
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => openDelete(job)}
                              >
                                <Trash2 className="mr-1 h-4 w-4" />
                                Eliminar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="empresas" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Empresas</CardTitle>
              <CardDescription>
                Empresas registradas. Podés dar de baja todas sus vacantes activas de una vez.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : employers.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No hay empresas con esos filtros.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Contacto</TableHead>
                        <TableHead>CUIT/DNI</TableHead>
                        <TableHead>Vacantes</TableHead>
                        <TableHead>Alta</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employers.map((employer) => (
                        <TableRow key={employer.id}>
                          <TableCell>
                            <div className="font-medium">{employer.companyName}</div>
                            <div className="text-xs text-muted-foreground">{employer.phone}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{employer.user?.email || "-"}</div>
                            <div className="text-xs text-muted-foreground">
                              {[employer.user?.firstName, employer.user?.lastName]
                                .filter(Boolean)
                                .join(" ") || "-"}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {employer.taxIdType?.toUpperCase()} {employer.taxId}
                          </TableCell>
                          <TableCell className="text-sm">
                            {employer.activeJobPostsCount} activas / {employer.jobPostsCount} total
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(employer.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={employer.activeJobPostsCount === 0}
                              onClick={() => openEmployerTakeDown(employer)}
                            >
                              <Ban className="mr-1 h-4 w-4" />
                              Baja vacantes
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {pagination.totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {pagination.page} de {pagination.totalPages} · {pagination.total} resultados
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= pagination.totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "delete"
                ? "Eliminar vacante"
                : dialogMode === "employer-take-down"
                  ? "Dar de baja vacantes de la empresa"
                  : "Dar de baja vacante"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "delete"
                ? `Se eliminará definitivamente "${selectedJob?.title}". Esta acción no se puede deshacer.`
                : dialogMode === "employer-take-down"
                  ? `Se darán de baja todas las vacantes activas de "${selectedEmployer?.companyName}".`
                  : `La vacante "${selectedJob?.title}" dejará de mostrarse en la bolsa pública.`}
            </DialogDescription>
          </DialogHeader>
          {dialogMode !== "delete" ? (
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={actionLoading}>
              Cancelar
            </Button>
            <Button
              variant={dialogMode === "delete" ? "destructive" : "default"}
              onClick={() => void confirmAction()}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
