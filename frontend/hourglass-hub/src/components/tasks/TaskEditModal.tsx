import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Pencil, Clock, FileText, Save, X, AlertCircle, Lock } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const HORMI_BLUE = '#0DA2E7';
const HORMI_GRADIENT = 'linear-gradient(135deg, #0DA2E7 0%, #0B8BC7 100%)';

interface TaskEditModalProps {
  task: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updatedData: any) => void;
}

// Función para obtener el color del estado
const getStatusColor = (status: string) => {
  switch (status) {
    case 'Pending': return 'bg-amber-500';
    case 'In Progress': return 'bg-blue-500';
    case 'Completed': return 'bg-emerald-500';
    default: return 'bg-gray-500';
  }
};

// Función para obtener el estado en español
const getStatusLabel = (status: string) => {
  switch (status) {
    case 'Pending': return 'Pendiente';
    case 'In Progress': return 'En progreso';
    case 'Completed': return 'Completada';
    default: return status;
  }
};

export function TaskEditModal({ task, open, onOpenChange, onSuccess }: TaskEditModalProps) {
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Pending");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔥 Verificar si la tarea está completada
  const isCompleted = task?.status === 'Completed' || task?.completed === true;

  useEffect(() => {
    if (task) {
      setDescription(task.description || "");
      setStatus(task.status || "Pending");
      setNotes(task.notes || "");
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    
    // 🔥 Bloquear si está completada
    if (isCompleted) {
      toast.warning("No puedes editar una tarea completada");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const updatedData = { description, status, notes };
      await onSuccess(updatedData);
      toast.success("Tarea actualizada correctamente");
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
        {/* Header con gradiente */}
        <div className="relative p-5 pb-4 bg-gradient-to-r from-[#0DA2E7]/15 via-[#0DA2E7]/5 to-transparent border-b border-border">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#0DA2E7]/5 blur-3xl" />
          <div className="flex items-center gap-3 relative">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0DA2E7] shadow-lg shadow-[#0DA2E7]/25">
  <Pencil className="h-5 w-5 text-white" />
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
                  <span className={`h-2 w-2 rounded-full ${getStatusColor(status)}`} />
                  <span className="text-[10px] text-muted-foreground">{getStatusLabel(status)}</span>
                </div>
                {/* 🔥 Badge de bloqueo si está completada */}
                {isCompleted && (
                  <Badge className="bg-red-500/10 text-red-600 border-red-200 text-[9px] px-1.5 py-0 gap-1">
                    <Lock className="h-2.5 w-2.5" />
                    Bloqueada
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Descripción */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Descripción
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe la tarea..."
              disabled={isCompleted}
              className="mt-1.5 text-sm bg-background border-border rounded-lg resize-none focus:ring-2 focus:ring-[#0DA2E7]/20 focus:border-[#0DA2E7] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Estado */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Estado
            </Label>
            <Select 
              value={status} 
              onValueChange={setStatus}
              disabled={isCompleted}
            >
              <SelectTrigger className="mt-1.5 h-10 text-sm bg-background border-border rounded-lg focus:ring-2 focus:ring-[#0DA2E7]/20 focus:border-[#0DA2E7] disabled:opacity-50 disabled:cursor-not-allowed">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {[
                  { value: 'Pending', label: 'Pendiente', color: 'bg-amber-500' },
                  { value: 'In Progress', label: 'En progreso', color: 'bg-blue-500' },
                  { value: 'Completed', label: 'Completada', color: 'bg-emerald-500' },
                ].map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${option.color}`} />
                      {option.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isCompleted && (
              <p className="text-[10px] text-muted-foreground/60 mt-1 flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Esta tarea está completada y no se puede modificar
              </p>
            )}
          </div>

          {/* Observaciones */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              Observaciones
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Notas adicionales..."
              disabled={isCompleted}
              className="mt-1.5 text-sm bg-background border-border rounded-lg resize-none focus:ring-2 focus:ring-[#0DA2E7]/20 focus:border-[#0DA2E7] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Info de la tarea */}
          {task.project && (
            <div className="p-3 rounded-lg bg-muted/10 border border-border/50 text-xs text-muted-foreground">
              <span className="font-medium">Proyecto:</span> {task.project}
              {task.serviceType && (
                <>
                  <span className="mx-2">·</span>
                  <span className="font-medium">Servicio:</span> {task.serviceType}
                </>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 pt-2 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-10 px-6 text-sm rounded-xl flex-1 hover:bg-muted/50 transition-all"
            >
              <X className="h-4 w-4 mr-1.5" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isCompleted}
              className="h-10 px-6 gap-2 text-white text-sm rounded-xl flex-1 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: isCompleted ? '#94A3B8' : '#0DA2E7' }}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isCompleted ? (
                <Lock className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSubmitting ? "Guardando..." : isCompleted ? "Bloqueada" : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}