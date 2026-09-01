import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  User, 
  Building2, 
  FolderKanban, 
  Clock, 
  Calendar, 
  DollarSign, 
  CheckCircle,
  Activity,
  AlertCircle,
  Wrench
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface TaskDetailModalProps {
  task: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  getTechName?: (id: string) => string;
  getProjectName?: (id: string) => string;
  getClientName?: (id: string) => string;
  getServiceName?: (id: string) => string;
  getTechInitials?: (id: string) => string;
}

const getStatusInfo = (status: string) => {
  switch (status) {
    case "Completed":
      return { label: "Completada", icon: CheckCircle, color: "#10b981", bg: "#10b98110" };
    case "InProgress":
      return { label: "En Progreso", icon: Activity, color: "#3b82f6", bg: "#3b82f610" };
    case "Pending":
      return { label: "Pendiente", icon: AlertCircle, color: "#f59e0b", bg: "#f59e0b10" };
    default:
      return { label: "Desconocido", icon: AlertCircle, color: "#6b7280", bg: "#6b728010" };
  }
};

export function TaskDetailModal({
  task,
  open,
  onOpenChange,
  getTechName = () => "Sin técnico",
  getProjectName = () => "Sin proyecto",
  getClientName = () => "Sin cliente",
  getServiceName = () => "Sin servicio",
  getTechInitials = () => "??",
}: TaskDetailModalProps) {
  if (!task) return null;

  const statusInfo = getStatusInfo(task.status);
  const StatusIcon = statusInfo.icon;
  const hours = task.duration_in_minutes ? (task.duration_in_minutes / 60).toFixed(1) : "0";
  const rate = task.applied_hourly_rate || 0;
  const totalPay = (rate * parseFloat(hours)).toFixed(2);

  const startDate = task.start_time ? new Date(task.start_time) : null;
  const endDate = task.end_time ? new Date(task.end_time) : null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/30"
            onClick={() => onOpenChange(false)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-4 sm:inset-[10%] lg:inset-[12%] z-50 overflow-hidden rounded-xl bg-white shadow-2xl border border-border/30 flex flex-col max-w-2xl mx-auto"
          >
            {/* ═══ HEADER ═══ */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-border/30">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${statusInfo.bg}`}>
                    <StatusIcon className="h-4 w-4" style={{ color: statusInfo.color }} />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">
                      {task.description || "Sin descripción"}
                    </h2>
                    <Badge 
                      className="text-[10px] font-medium px-2 py-0 border-0 mt-0.5"
                      style={{ backgroundColor: statusInfo.bg, color: statusInfo.color }}
                    >
                      {statusInfo.label}
                    </Badge>
                  </div>
                </div>
                <button
                  onClick={() => onOpenChange(false)}
                  className="p-1 rounded-md hover:bg-muted/30 transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* ═══ CONTENIDO ═══ */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Responsable */}
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs font-medium bg-muted/20 text-foreground">
                    {getTechInitials(task.technician_id)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {getTechName(task.technician_id)}
                  </p>
                  <p className="text-xs text-muted-foreground/60">Técnico asignado</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Proyecto</p>
                  <p className="text-sm text-foreground mt-0.5">{getProjectName(task.project_id)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Cliente</p>
                  <p className="text-sm text-foreground mt-0.5">{getClientName(task.project_id)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Servicio</p>
                  <p className="text-sm text-foreground mt-0.5">{getServiceName(task.service_id)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Fecha</p>
                  <p className="text-sm text-foreground mt-0.5">
                    {startDate ? format(startDate, "dd/MM/yyyy", { locale: es }) : "Sin fecha"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-border/20">
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Horario</p>
                  <p className="text-sm text-foreground mt-0.5">
                    {startDate && endDate ? (
                      `${format(startDate, "HH:mm", { locale: es })} - ${format(endDate, "HH:mm", { locale: es })}`
                    ) : (
                      "Sin horario definido"
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Horas</p>
                  <p className="text-base font-semibold text-foreground mt-0.5">{hours}h</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/20">
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Tarifa por hora</p>
                  <p className="text-base font-semibold text-foreground mt-0.5">${rate.toFixed(2)}/h</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Total</p>
                  <p className="text-base font-semibold text-foreground mt-0.5">${totalPay}</p>
                </div>
              </div>
            </div>

            {/* ═══ FOOTER ═══ */}
            <div className="flex-shrink-0 px-6 py-3 border-t border-border/30 bg-muted/5 flex justify-end">
              <button
                onClick={() => onOpenChange(false)}
                className="px-4 py-1.5 text-sm font-medium rounded-lg bg-[#0DA2E7] text-white hover:bg-[#0B8BC7] transition-colors"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}