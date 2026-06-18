"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type VehiculoRow = {
  id: number;
  patente: string;
  tipo: string;
  activo: boolean;
};

export default function PatentesVehiculosPage() {
  const [vehiculos, setVehiculos] = useState<VehiculoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patente, setPatente] = useState("");
  const [tipo, setTipo] = useState("");

  async function loadVehiculos() {
    setLoading(true);
    try {
      const res = await fetch("/api/vehiculos-policia/vehiculos");
      if (!res.ok) throw new Error();
      setVehiculos(await res.json());
    } catch {
      toast.error("No se pudieron cargar las patentes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVehiculos();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/vehiculos-policia/vehiculos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patente, tipo }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "No se pudo agregar la patente");
        return;
      }
      toast.success("Patente agregada");
      setPatente("");
      setTipo("");
      await loadVehiculos();
    } catch {
      toast.error("Error al agregar patente");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActivo(vehiculo: VehiculoRow) {
    try {
      const res = await fetch(`/api/vehiculos-policia/vehiculos/${vehiculo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !vehiculo.activo }),
      });
      if (!res.ok) throw new Error();
      toast.success(
        vehiculo.activo ? "Patente desactivada" : "Patente reactivada",
      );
      await loadVehiculos();
    } catch {
      toast.error("No se pudo actualizar la patente");
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Heading
        title="Patentes"
        description="Alta y baja de vehículos disponibles en la planilla de campo"
      />
      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Agregar vehículo</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="grid gap-4 sm:grid-cols-[1fr_2fr_auto]"
          >
            <div className="space-y-2">
              <Label htmlFor="patente">Patente</Label>
              <Input
                id="patente"
                value={patente}
                onChange={(e) => setPatente(e.target.value.toUpperCase())}
                placeholder="AB123CD"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo / descripción</Label>
              <Input
                id="tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                placeholder="Motocicleta - Honda XR 150"
                required
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Agregar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando...
            </div>
          ) : (
            <div className="space-y-3">
              {vehiculos.map((vehiculo) => (
                <div
                  key={vehiculo.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{vehiculo.patente}</p>
                    <p className="text-sm text-muted-foreground">{vehiculo.tipo}</p>
                    <Badge
                      variant={vehiculo.activo ? "default" : "secondary"}
                      className="mt-2"
                    >
                      {vehiculo.activo ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>
                  <Button
                    variant={vehiculo.activo ? "outline" : "default"}
                    onClick={() => toggleActivo(vehiculo)}
                  >
                    {vehiculo.activo ? "Desactivar" : "Reactivar"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
