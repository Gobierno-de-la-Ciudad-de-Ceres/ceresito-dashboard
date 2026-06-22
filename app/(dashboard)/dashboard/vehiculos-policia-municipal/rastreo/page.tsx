"use client";

import { useEffect, useState } from "react";
import { Copy, ExternalLink, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { DAGPS_LOGIN_URL } from "@/lib/planilla-vehiculos/dagps";

type VehiculoRastreo = {
  id: number;
  patente: string;
  tipo: string;
  imei: string | null;
  activo: boolean;
};

async function copyImei(imei: string) {
  try {
    await navigator.clipboard.writeText(imei);
    toast.success("IMEI copiado al portapapeles");
  } catch {
    toast.error("No se pudo copiar el IMEI");
  }
}

function openDagps(imei?: string | null) {
  if (imei) {
    void copyImei(imei);
  }
  window.open(DAGPS_LOGIN_URL, "_blank", "noopener,noreferrer");
}

export default function RastreoVehiculosPage() {
  const [vehiculos, setVehiculos] = useState<VehiculoRastreo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vehiculos-policia/vehiculos")
      .then(async (res) => {
        if (!res.ok) throw new Error();
        return res.json() as Promise<VehiculoRastreo[]>;
      })
      .then(setVehiculos)
      .catch(() => toast.error("No se pudieron cargar los vehículos"))
      .finally(() => setLoading(false));
  }, []);

  const activos = vehiculos.filter((vehiculo) => vehiculo.activo);
  const conImei = activos.filter((vehiculo) => vehiculo.imei);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Heading
        title="Rastreo GPS"
        description="Acceso a DaGPS por vehículo de la flota municipal"
      />
      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5" />
            Cómo rastrear un móvil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <ol className="list-decimal space-y-2 pl-5">
            <li>Elegí el vehículo en la tabla de abajo.</li>
            <li>
              Tocá <strong className="text-foreground">Abrir DaGPS</strong>: se
              abre la web de rastreo y se copia el IMEI automáticamente.
            </li>
            <li>
              En DaGPS, pestaña <strong className="text-foreground">Plate
              NO./IMEI</strong>, pegá el IMEI e ingresá la contraseña del
              móvil.
            </li>
          </ol>
          <Button onClick={() => openDagps()} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Abrir DaGPS (sin copiar IMEI)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Flota con IMEI ({conImei.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando...
            </div>
          ) : conImei.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no hay vehículos con IMEI cargado. Los IMEI se configuran
              una sola vez desde administración; los inspectores no los cargan.
            </p>
          ) : (
            <div className="space-y-3">
              {conImei.map((vehiculo) => (
                <div
                  key={vehiculo.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{vehiculo.patente}</p>
                      <Badge variant="outline">Activo</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {vehiculo.tipo}
                    </p>
                    <p className="font-mono text-sm">IMEI: {vehiculo.imei}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => vehiculo.imei && void copyImei(vehiculo.imei)}
                    >
                      <Copy className="h-4 w-4" />
                      Copiar IMEI
                    </Button>
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={() => openDagps(vehiculo.imei)}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Abrir DaGPS
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {!loading && activos.some((vehiculo) => !vehiculo.imei) ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sin IMEI asignado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              {activos
                .filter((vehiculo) => !vehiculo.imei)
                .map((vehiculo) => (
                  <p key={vehiculo.id}>
                    {vehiculo.patente} — {vehiculo.tipo}
                  </p>
                ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
