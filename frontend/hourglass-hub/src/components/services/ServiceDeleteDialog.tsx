import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Trash2, AlertTriangle } from "lucide-react";
import type { Service } from "@/hooks/useServices";

interface ServiceDeleteDialogProps {
  open: boolean;
  service: Service | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (service: Service) => void;
  isPending?: boolean;
}

export function ServiceDeleteDialog({
  open, service, onOpenChange, onConfirm, isPending = false,
}: ServiceDeleteDialogProps) {
  if (!service) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm rounded-2xl border-border/60 bg-card p-6 shadow-2xl">
        <AlertDialogHeader>
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <Trash2 className="h-5 w-5 text-red-600" />
            </span>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              ¿Eliminar este servicio?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed text-muted-foreground">
              Vas a eliminar el servicio{" "}
              <span className="font-semibold text-foreground">"{service.name}"</span>.
              Esta acción no se puede deshacer y puede afectar a las tareas asociadas.
              <span className="mt-2 flex items-center justify-center gap-1.5 text-amber-600">
                <AlertTriangle className="h-3.5 w-3.5" /> Revísalo antes de continuar.
              </span>
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-5 flex-row-reverse gap-2 sm:flex-row-reverse">
          <AlertDialogAction
            onClick={() => onConfirm(service)}
            className="h-9 flex-1 gap-1.5 rounded-lg bg-red-600 px-3 text-xs font-semibold text-white hover:bg-red-700"
          >
            <Trash2 className="h-3.5 w-3.5" /> {isPending ? "Eliminando..." : "Sí, eliminar"}
          </AlertDialogAction>
          <AlertDialogCancel className="h-9 flex-1 rounded-lg border-border/60 px-3 text-xs font-medium">
            Cancelar
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}