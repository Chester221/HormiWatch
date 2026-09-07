import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  LayoutDashboard, Clock, FolderKanban, Building2, CheckSquare,
  Award, AlertTriangle, CheckCircle, Activity, Clock as ClockIcon,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers locales
// ---------------------------------------------------------------------------

const getProjectStatusBadge = (status: string, isDelayed: boolean) => {
  if (isDelayed) return { label: "Atrasado", icon: AlertTriangle, className: "bg-destructive/10 text-destructive border-destructive/30" };
  switch (status) {
    case "completed": return { label: "Completado", icon: CheckCircle, className: "bg-muted text-foreground border-border" };
    case "in_progress": return { label: "En Progreso", icon: Activity, className: "bg-muted text-foreground border-border" };
    case "delayed": return { label: "Atrasado", icon: AlertTriangle, className: "bg-destructive/10 text-destructive border-destructive/30" };
    default: return { label: "Sin Iniciar", icon: ClockIcon, className: "bg-muted text-muted-foreground border-border" };
  }
};

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

interface AnalisisCompletoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metrics: {
    horas: { total: number };
    proyectos: { activos: number };
    clientes: { atendidos: number };
    tareas: { completed: number };
  };
  hoursByClient: { name: string; hours: number; color: string }[];
  projectStatus: any[];
  technicianPerformance: any[];
}

export default function AnalisisCompletoModal({
  open,
  onOpenChange,
  metrics,
  hoursByClient,
  projectStatus,
  technicianPerformance,
}: AnalisisCompletoModalProps) {
  const maxClientHours = hoursByClient[0]?.hours || 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <LayoutDashboard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg">Análisis Completo</DialogTitle>
              <DialogDescription className="text-xs">
                Métricas detalladas del negocio
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-5">
            {/* KPIs rápidos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-muted border border-border text-center">
                <Clock className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">
                  {metrics.horas.total.toFixed(1)}h
                </p>
                <p className="text-[10px] text-muted-foreground">Horas Totales</p>
              </div>
              <div className="p-3 rounded-xl bg-muted border border-border text-center">
                <FolderKanban className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">
                  {metrics.proyectos.activos}
                </p>
                <p className="text-[10px] text-muted-foreground">Proyectos</p>
              </div>
              <div className="p-3 rounded-xl bg-muted border border-border text-center">
                <Building2 className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">
                  {metrics.clientes.atendidos}
                </p>
                <p className="text-[10px] text-muted-foreground">Clientes</p>
              </div>
              <div className="p-3 rounded-xl bg-muted border border-border text-center">
                <CheckSquare className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">
                  {metrics.tareas.completed}
                </p>
                <p className="text-[10px] text-muted-foreground">Tareas</p>
              </div>
            </div>

            <Separator />

            {/* Top Clientes */}
            <div>
              <h3 className="text-sm font-semibold mb-2.5 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Top Clientes por Horas
              </h3>
              {hoursByClient.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No hay datos de clientes
                </p>
              ) : (
                <div className="space-y-2.5">
                  {hoursByClient.slice(0, 8).map((client) => (
                    <div key={client.name} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-5 h-5 rounded-md flex items-center justify-center text-primary-foreground text-[10px] font-bold bg-primary"
                          >
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-foreground text-xs">
                            {client.name}
                          </span>
                        </div>
                        <span className="font-semibold text-xs">
                          {client.hours.toFixed(1)}h
                        </span>
                      </div>
                      <Progress
                        value={(client.hours / maxClientHours) * 100}
                        className="h-1"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Estado de Proyectos */}
            <div>
              <h3 className="text-sm font-semibold mb-2.5 flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
                Estado de Proyectos
              </h3>
              {projectStatus.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No hay proyectos registrados
                </p>
              ) : (
                <div className="space-y-2">
                  {projectStatus.slice(0, 8).map((project) => {
                    const sBadge = getProjectStatusBadge(
                      project.status,
                      project.isDelayed
                    );
                    const SIcon = sBadge.icon;
                    return (
                      <div
                        key={project.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">
                              {project.name}
                            </p>
                            <Badge
                              variant="outline"
                              className={`${sBadge.className} text-[9px] px-1.5 gap-0.5`}
                            >
                              <SIcon className="h-2.5 w-2.5" />
                              {sBadge.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {project.client}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold">
                            {project.progress}%
                          </p>
                          <p className="text-[9px] text-muted-foreground">
                            {project.completed}/{project.total}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Separator />

            {/* Ranking de Técnicos */}
            <div>
              <h3 className="text-sm font-semibold mb-2.5 flex items-center gap-2">
                <Award className="h-4 w-4 text-muted-foreground" />
                Ranking de Técnicos
              </h3>
              {technicianPerformance.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No hay técnicos registrados
                </p>
              ) : (
                <div className="space-y-1.5">
                  {technicianPerformance.map((tech: any, idx: number) => {
                    const efficiency =
                      tech.tasks > 0
                        ? (tech.completedTasks / tech.tasks) * 100
                        : 0;
                    return (
                      <div
                        key={tech.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/20 transition-colors"
                      >
                        <div
                          className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold flex-shrink-0"
                        >
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between">
                            <p className="text-sm font-medium">{tech.name}</p>
                            <p className="text-sm font-semibold">
                              {tech.hours.toFixed(1)}h
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${efficiency}%` }}
                              />
                            </div>
                            <span className="text-[9px] text-muted-foreground">
                              {Math.round(efficiency)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}