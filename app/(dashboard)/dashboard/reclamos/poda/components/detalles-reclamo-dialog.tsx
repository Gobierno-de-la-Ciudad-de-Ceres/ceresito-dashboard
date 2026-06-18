import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin  } from "lucide-react";
import { Reclamo } from "@/types"; // Importar Reclamo global
import { PodaImage } from "../_components/poda-image";

interface ReclamoDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  reclamo: Reclamo | null; // Usar Reclamo global
}

export const DetallesReclamoDialog: React.FC<ReclamoDetailsDialogProps> = ({
  open,
  onClose,
  reclamo,
}) => {
  if (!reclamo) return null;

  const getGoogleMapsLink = (lat: number, lng: number) => {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  };

  // Parsear latitud y longitud si existen y son válidas
  const lat = parseFloat(reclamo.latitud);
  const lng = parseFloat(reclamo.longitud);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detalles del Reclamo de Poda</DialogTitle>
          <DialogDescription>
            Información detallada del reclamo de poda seleccionado
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <div>
            <strong>Fecha:</strong> {reclamo.fecha}
          </div>
          <div>
            <strong>Nombre:</strong> {reclamo.nombre}
          </div>
          <div>
            <strong>Teléfono:</strong> {reclamo.telefono}
          </div>
          <div>
            <strong>Ubicación:</strong> {reclamo.ubicacion}
            {/* Usar lat y lng parseadas y verificar que no sean NaN */}
            {!isNaN(lat) && !isNaN(lng) && (
              <a
                href={getGoogleMapsLink(lat, lng)}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2"
              >
                <Button variant="outline" size="sm">
                  <MapPin className="mr-1 h-4 w-4" /> Ver en Mapa
                </Button>
              </a>
            )}
          </div>
          <div>
            <strong>Barrio:</strong> {reclamo.barrio}
          </div>
          <div>
            <strong>Imagen:</strong>
            <div className="mt-2">
              <PodaImage
                url={reclamo.imagen}
                alt="Imagen del reclamo de poda"
                width={128}
                height={128}
                className="h-32 w-32 rounded-md object-cover"
                emptyLabel="Sin imagen"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={onClose}>Cerrar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};