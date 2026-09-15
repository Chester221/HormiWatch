import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, AlertTriangle, FolderKanban, X } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface TaskDeleteModalProps {
  task: {
    id?: string;
    title?: string;
    projectName?: string;
    date?: Date | string | null;
    status?: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (task: { id?: string }) => Promise<void> | void;
}

const STATUS_SPANISH: Record<string, string> = {
  PENDING: "Pendiente",
  INPROGRESS: "En progreso",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

const getStatusSpanish = (status?: string) => {
  const norm = String(status || "").toUpperCase().replace(/[^A-Z]/g, "");
  return STATUS_SPANISH[norm] || (status ? status : "—");
};

export function TaskDeleteModal({ task, open, onOpenChange, onConfirm }: TaskDeleteModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!task) return;
    setIsSubmitting(true);
    try {
      await onConfirm(task);
    } finally {
      setIsSubmitting(false);
    }
  };

  const date = task?.date ? new Date(task.date) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border p-0 rounded-2xl overflow-hidden shadow-2xl">
        {/* HEADER */}
        <div className="relative p-5 pb-4 bg-gradient-to-r from-red-500/15 via-red-500/5 to-transparent border-b border-border">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-red-500/5 blur-3xl" />
          <div className="flex items-center gap-3 relative">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500 shadow-lg shadow-red-500/25">
              <Trash2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Eliminar Tarea
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Esta acción no se puede deshacer
              </p>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-xl border border-red-200/60 bg-red-50/50">
            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-100">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {task?.title || "Sin título"}
              </p>
              <p className="text-xs text-foreground/80 mt-0.5 flex items-center gap-1">
                <FolderKanban className="h-3 w-3" />
                {task?.projectName || "Sin proyecto"}
              </p>
              {date && (
                <p className="text-xs text-foreground/70 mt-1">
                  {format(date, "EEEE, dd MMM yyyy", { locale: es })}
                </p>
              )}
            </div>
          </div>

          <p className="text-sm text-foreground/80 leading-relaxed">
            ¿Seguro que deseas eliminar esta tarea? Se liberarán las horas de
            pool del proyecto y no podrás recuperarla.
          </p>

          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/20 border border-border/30">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Estado actual</span>
            <Badge className="text-[10px] px-2 py-0.5 bg-muted/40 text-foreground border border-border/60 font-semibold">
              {getStatusSpanish(task?.status)}
            </Badge>
          </div>
        </div>

        {/* FOOTER */}
        <DialogFooter className="px-5 pb-5 pt-4 gap-2 border-t border-border/50">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="h-10 px-6 text-sm rounded-xl flex-1 hover:bg-muted/50 transition-all"
          >
            <X className="h-4 w-4 mr-1.5" />
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="h-10 px-6 gap-2 text-white text-sm rounded-xl flex-1 shadow-md hover:shadow-lg transition-all bg-red-500 hover:bg-red-600"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {isSubmitting ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}