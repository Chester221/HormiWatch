import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Pencil, Clock, FileText, Save, X, Lock, ClipboardList, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

const HORMI_BLUE = '#0DA2E7';

interface TaskEditModalProps {
  task: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updatedData: any) => void;
}

const STATUS_OPTS = [
  { value: 'Pending', label: 'Pendiente', color: '#f59e0b' },
  { value: 'In Progress', label: 'En progreso', color: '#0DA2E7' },
  { value: 'Completed', label: 'Completada', color: '#10b981' },
  { value: 'Cancelled', label: 'Cancelada', color: '#ef4444' },
];

const getStatusColor = (status: string) => {
  const norm = String(status || "").toUpperCase().replace(/[^A-Z]/g, "");
  switch (norm) {
    case 'CANCELLED': return '#ef4444';
    case 'COMPLETED': return '#10b981';
    case 'INPROGRESS': return '#0DA2E7';
    case 'PENDING': return '#f59e0b';
    default: return '#6b7280';
  }
};

const getStatusLabel = (status: string) => {
  const norm = String(status || "").toUpperCase().replace(/[^A-Z]/g, "");
  switch (norm) {
    case 'CANCELLED': return 'Cancelada';
    case 'COMPLETED': return 'Completada';
    case 'INPROGRESS': return 'En progreso';
    case 'PENDING': return 'Pendiente';
    default: return status;
  }
};

const toOptionStatus = (status?: string) => {
  const norm = String(status || "").toUpperCase().replace(/[^A-Z]/g, "");
  if (norm === 'COMPLETED') return 'Completed';
  if (norm === 'CANCELLED') return 'Cancelled';
  if (norm === 'INPROGRESS') return 'In Progress';
  return 'Pending';
};

export function TaskEditModal({ task, open, onOpenChange, onSuccess }: TaskEditModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Pending");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCompleted = task?.completed === true ||
    (task?.status && String(task.status).toUpperCase().replace(/[^A-Z]/g, "") === "COMPLETED") || false;
  const isCancelled = task?.status &&
    String(task.status).toUpperCase().replace(/[^A-Z]/g, "") === "CANCELLED" || false;

  // ✅ BLOQUEADA = completada O cancelada (solo se puede eliminar)
  const isLocked = isCompleted || isCancelled;
  const lockLabel = isCancelled ? "cancelada" : "completada";

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setStatus(toOptionStatus(task.status));
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    if (isLocked) {
      toast.warning(`No puedes editar una tarea ${lockLabel}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedData = { title, description, status };
      await onSuccess(updatedData);
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border p-0 rounded-2xl overflow-hidden shadow-2xl">
        {/* HEADER */}
        <div className="flex items-center gap-3 p-5 pb-4 bg-muted/5 border-b border-border">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted/40">
            <Pencil className="h-5 w-5 text-muted-foreground/70" />
          </div>
          <div>
            <DialogTitle className="text-lg font-bold text-foreground">
              Editar Tarea
            </DialogTitle>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className="text-[10px] px-2 py-0 bg-muted/30">
                {task.title || "Sin título"}
              </Badge>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: getStatusColor(status) }} />
                <span className="text-[10px] text-muted-foreground">{getStatusLabel(status)}</span>
              </div>
              {isLocked && (
                <Badge className="bg-red-500/10 text-red-600 border-red-200 text-[9px] px-1.5 py-0 gap-1">
                  <Lock className="h-2.5 w-2.5" />
                  Bloqueada
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0DA2E7]/10">
              <SlidersHorizontal className="h-3.5 w-3.5 text-[#0DA2E7]" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-foreground uppercase tracking-widest">Detalles</p>
            </div>
          </div>
          <Separator className="bg-border/60" />

          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0DA2E7]/10">
                <ClipboardList className="h-3.5 w-3.5 text-[#0DA2E7]" />
              </div>
              <Label className="text-[11px] font-bold text-foreground uppercase tracking-widest">Título</Label>
            </div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título de la tarea..."
              disabled={isLocked}
              className="mt-1.5 h-9 text-sm bg-background border-border rounded-lg focus:ring-2 focus:ring-[#0DA2E7]/20 focus:border-[#0DA2E7] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0DA2E7]/10">
                <FileText className="h-3.5 w-3.5 text-[#0DA2E7]" />
              </div>
              <Label className="text-[11px] font-bold text-foreground uppercase tracking-widest">Descripción</Label>
            </div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe la tarea..."
              disabled={isLocked}
              className="mt-1.5 text-sm bg-background border-border rounded-lg resize-none focus:ring-2 focus:ring-[#0DA2E7]/20 focus:border-[#0DA2E7] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0DA2E7]/10">
                <Clock className="h-3.5 w-3.5 text-[#0DA2E7]" />
              </div>
              <Label className="text-[11px] font-bold text-foreground uppercase tracking-widest">Estado</Label>
            </div>
            <Select
              value={status}
              onValueChange={setStatus}
              disabled={isLocked}
            >
              <SelectTrigger className="mt-1.5 h-10 text-sm bg-background border-border rounded-lg focus:ring-2 focus:ring-[#0DA2E7]/20 focus:border-[#0DA2E7] disabled:opacity-50 disabled:cursor-not-allowed">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {STATUS_OPTS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: option.color }} />
                      {option.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isLocked && (
              <p className="text-[10px] text-muted-foreground/60 mt-1 flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Esta tarea está {lockLabel} y no se puede modificar
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-10 px-6 text-sm rounded-xl flex-1 hover:bg-muted/50 transition-all"
            >
              <X className="h-4 w-4 mr-1.5" />
              Cancelar            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isLocked}
              className={`h-10 px-6 gap-2 text-white text-sm rounded-xl flex-1 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isLocked ? 'bg-gray-400' : 'bg-[#0DA2E7] hover:bg-[#0B8BC7]'}`}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isLocked ? (
                <Lock className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSubmitting ? "Guardando..." : isLocked ? "Bloqueada" : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}