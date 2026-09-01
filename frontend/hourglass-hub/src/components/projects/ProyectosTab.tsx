import { useState, useMemo } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  FolderKanban, Search, X, CalendarDays, Building2,
  Clock, CheckSquare, Users, Eye, AlertTriangle,
  CheckCircle, Activity, Clock as ClockIcon, ArrowUpDown,
  ExternalLink, User, ChevronRight,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getProjectStatusBadge = (status: string, isDelayed: boolean) => {
  if (isDelayed) return { label: "Atrasado", icon: AlertTriangle, color: "text-destructive" };
  switch (status) {
    case "completed": return { label: "Completado", icon: CheckCircle, color: "text-primary" };
    case "in_progress": return { label: "En Progreso", icon: Activity, color: "text-foreground" };
    case "delayed": return { label: "Atrasado", icon: AlertTriangle, color: "text-destructive" };
    default: return { label: "Sin Iniciar", icon: ClockIcon, color: "text-muted-foreground" };
  }
};

const getTaskStatusBadge = (status: string) => {
  switch (status) {
    case "Completed": return { label: "Completada", icon: CheckCircle, className: "bg-muted text-foreground" };
    case "InProgress": return { label: "En Progreso", icon: Activity, className: "bg-muted text-foreground" };
    case "Pending": return { label: "Pendiente", icon: ClockIcon, className: "bg-muted text-muted-foreground" };
    default: return { label: status, icon: ClockIcon, className: "bg-muted text-muted-foreground" };
  }
};

// ---------------------------------------------------------------------------
// Modal de Detalle del Proyecto (COMPLETO)
// ---------------------------------------------------------------------------

const ProjectDetailModal = ({ 
  project, 
  open, 
  onOpenChange,
  projectTasks,
  members,
  leader,
  onViewClient,
  clients,
}: { 
  project: any; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  projectTasks: any[];
  members: any[];
  leader: any;
  onViewClient: (client: any) => void;
  clients: any[];
}) => {
  if (!project) return null;

  const sBadge = getProjectStatusBadge(project.status, project.isDelayed);
  const StatusIcon = sBadge.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-shrink-0"
        >
          <DialogHeader>
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="p-3 rounded-xl bg-muted relative"
              >
                <FolderKanban className="h-6 w-6 text-foreground" />
                {project.isDelayed && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive/50 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive" />
                  </span>
                )}
              </motion.div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl font-bold text-foreground">{project.name}</DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <Badge variant="outline" className={`gap-1 text-[11px] ${sBadge.color}`}>
                    <StatusIcon className="h-3 w-3" />
                    {project.isDelayed ? `+${project.daysDelayed}d` : sBadge.label}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className="gap-1 text-[11px] cursor-pointer hover:bg-muted transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      const clientData = clients.find((c: any) => c.name === project.client);
                      if (clientData) onViewClient(clientData);
                    }}
                  >
                    <Building2 className="h-3 w-3" />
                    {project.client}
                    <ChevronRight className="h-3 w-3" />
                  </Badge>
                  <Badge variant="outline" className="gap-1 text-[11px]">
                    <Clock className="h-3 w-3" />
                    {project.hours.toFixed(1)}h
                  </Badge>
                  <Badge variant="outline" className="gap-1 text-[11px]">
                    <Users className="h-3 w-3" />
                    {project.teamSize} técnicos
                  </Badge>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </motion.div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto pr-2 mt-5">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="space-y-5"
          >
            {/* Progreso + Indicador visual */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Progreso</h3>
              <div className="flex items-center gap-3 mb-2">
                <Progress value={project.progress} className="h-2.5 flex-1" />
                <span className="text-lg font-bold text-foreground">{project.progress}%</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><CheckSquare className="h-3 w-3" />{project.completed}/{project.total} tareas completadas</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{project.hours.toFixed(1)}h registradas</span>
              </div>
            </div>

            <Separator />

            {/* Fechas */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                Fechas del Proyecto
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-border bg-muted/20">
                  <p className="text-xs text-muted-foreground">Fecha de Inicio</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">
                    {format(new Date(project.startDate), "dd 'de' MMMM 'de' yyyy")}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-muted/20">
                  <p className="text-xs text-muted-foreground">Fecha de Fin</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">
                    {format(new Date(project.endDate), "dd 'de' MMMM 'de' yyyy")}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className={`flex-1 h-1.5 rounded-full ${project.isDelayed ? 'bg-destructive/30' : project.progress === 100 ? 'bg-primary/30' : 'bg-primary/30'}`}>
                  <div 
                    className={`h-full rounded-full transition-all ${project.isDelayed ? 'bg-destructive' : project.progress === 100 ? 'bg-primary' : 'bg-primary'}`}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
                <span className={`text-xs font-semibold ${project.isDelayed ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {project.isDelayed 
                    ? `${project.daysDelayed} días de retraso` 
                    : project.progress === 100 
                      ? 'Completado' 
                      : `${project.daysRemaining} días restantes`}
                </span>
              </div>
            </div>

            <Separator />

            {/* Líder + Equipo */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Equipo del Proyecto
              </h3>

              {/* Líder */}
              {leader && (
                <div className="mb-3 p-3 rounded-lg border border-border bg-muted/20 flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-border">
                    <AvatarFallback className="text-xs bg-muted text-foreground font-semibold">
                      {leader.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{leader.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Líder del Proyecto
                    </p>
                  </div>
                </div>
              )}

              {/* Miembros */}
              {members.length > 0 && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {members.map((member, idx) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + idx * 0.04, duration: 0.2 }}
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-muted/20"
                    >
                      <Avatar className="h-8 w-8 ring-2 ring-border">
                        <AvatarFallback className="text-[10px] bg-muted text-foreground font-semibold">
                          {member.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {member.completedTasks}/{member.tasks} tareas · {member.hours.toFixed(1)}h
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Tareas del Proyecto */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
                Tareas ({projectTasks.length})
              </h3>
              {projectTasks.length === 0 ? (
                <div className="text-center py-6">
                  <CheckSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No hay tareas registradas</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {projectTasks.slice(0, 20).map((task, idx) => {
                    const tBadge = getTaskStatusBadge(task.status);
                    const TIcon = tBadge.icon;
                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + idx * 0.03, duration: 0.2 }}
                        className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-muted/20"
                      >
                        <div className={`p-1.5 rounded-md ${tBadge.className}`}>
                          <TIcon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{task.description || "Sin descripción"}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {format(new Date(task.created_at), "dd/MM/yyyy")}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {(task.duration_in_minutes ? task.duration_in_minutes / 60 : (task.normal_hours || 0) + (task.overtime_hours || 0)).toFixed(1)}h
                        </Badge>
                      </motion.div>
                    );
                  })}
                  {projectTasks.length > 20 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      +{projectTasks.length - 20} tareas más
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

interface ProyectosTabProps {
  projectStatus: any[];
  tasks: any[];
  clients: any[];
  onViewClient: (client: any) => void;
}

export default function ProyectosTab({ projectStatus, tasks, clients, onViewClient }: ProyectosTabProps) {
  const [projectFilter, setProjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [sortField, setSortField] = useState<string>("name");

  const clientList = useMemo(() => {
    const clientsSet = new Set(projectStatus.map(p => p.client).filter(Boolean));
    return Array.from(clientsSet).sort();
  }, [projectStatus]);

  const filteredProjects = useMemo(() => {
    return projectStatus
      .filter(p => {
        const matchesSearch = !projectFilter || 
          p.name.toLowerCase().includes(projectFilter.toLowerCase()) ||
          p.client.toLowerCase().includes(projectFilter.toLowerCase());
        const matchesStatus = statusFilter === "all" || p.status === statusFilter;
        const matchesClient = clientFilter === "all" || p.client === clientFilter;
        return matchesSearch && matchesStatus && matchesClient;
      })
      .sort((a, b) => {
        if (sortField === "progress") return b.progress - a.progress;
        if (sortField === "hours") return b.hours - a.hours;
        if (sortField === "team") return b.teamSize - a.teamSize;
        return a.name.localeCompare(b.name);
      });
  }, [projectStatus, projectFilter, statusFilter, clientFilter, sortField]);

  const handleViewProject = (project: any) => {
    setSelectedProject(project);
    setDetailModalOpen(true);
  };

  // Datos para el modal
  const selectedProjectTasks = useMemo(() => {
    if (!selectedProject) return [];
    return tasks.filter((t: any) => t.project_id === selectedProject.id);
  }, [selectedProject, tasks]);

  const selectedProjectMembers = useMemo(() => {
    if (!selectedProject) return [];
    const membersMap = new Map();
    selectedProjectTasks.forEach((task: any) => {
      const techId = task.technician_id;
      if (!membersMap.has(techId)) {
        membersMap.set(techId, { 
          id: techId, 
          name: task.technician_name || task.profiles?.full_name || `Técnico ${techId?.slice(0, 8)}`,
          tasks: 0, 
          completedTasks: 0, 
          hours: 0 
        });
      }
      const m = membersMap.get(techId);
      m.tasks += 1;
      if (task.status === "Completed") m.completedTasks += 1;
      m.hours += task.duration_in_minutes ? task.duration_in_minutes / 60 : (task.normal_hours || 0) + (task.overtime_hours || 0);
    });
    return Array.from(membersMap.values());
  }, [selectedProjectTasks]);

  const selectedProjectLeader = useMemo(() => {
    if (!selectedProject) return null;
    const leaderId = selectedProject.project_leader_id;
    if (!leaderId) return null;
    const leaderTask = selectedProjectTasks.find((t: any) => t.technician_id === leaderId);
    return {
      id: leaderId,
      name: leaderTask?.technician_name || leaderTask?.profiles?.full_name || `Técnico ${leaderId?.slice(0, 8)}`,
    };
  }, [selectedProject, selectedProjectTasks]);

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
              Portafolio de Proyectos
            </CardTitle>
            <CardDescription className="text-xs">
              {projectStatus.length} proyectos · {filteredProjects.length} mostrados
            </CardDescription>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar proyecto..."
              className="pl-8 h-9 text-sm"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
            />
            {projectFilter && (
              <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-9 w-9" onClick={() => setProjectFilter("")}>
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[140px] text-xs">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="in_progress">En Progreso</SelectItem>
              <SelectItem value="completed">Completados</SelectItem>
              <SelectItem value="delayed">Atrasados</SelectItem>
              <SelectItem value="not_started">Sin Iniciar</SelectItem>
            </SelectContent>
          </Select>

          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="h-9 w-[150px] text-xs">
              <SelectValue placeholder="Cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los clientes</SelectItem>
              {clientList.map(client => (
                <SelectItem key={client} value={client}>{client}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FolderKanban className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">No se encontraron proyectos</p>
            <p className="text-xs text-muted-foreground">
              {projectFilter || statusFilter !== "all" || clientFilter !== "all"
                ? "Intenta con otros filtros"
                : "No hay proyectos registrados"}
            </p>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer hover:text-foreground transition-colors" onClick={() => setSortField("name")}>
                    <div className="flex items-center gap-1">Proyecto{sortField === "name" && <ArrowUpDown className="h-3 w-3" />}</div>
                  </TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-center cursor-pointer hover:text-foreground transition-colors" onClick={() => setSortField("progress")}>
                    <div className="flex items-center justify-center gap-1">Progreso{sortField === "progress" && <ArrowUpDown className="h-3 w-3" />}</div>
                  </TableHead>
                  <TableHead className="text-center">Tareas</TableHead>
                  <TableHead className="text-center cursor-pointer hover:text-foreground transition-colors" onClick={() => setSortField("hours")}>
                    <div className="flex items-center justify-center gap-1">Horas{sortField === "hours" && <ArrowUpDown className="h-3 w-3" />}</div>
                  </TableHead>
                  <TableHead className="text-center cursor-pointer hover:text-foreground transition-colors" onClick={() => setSortField("team")}>
                    <div className="flex items-center justify-center gap-1">Equipo{sortField === "team" && <ArrowUpDown className="h-3 w-3" />}</div>
                  </TableHead>
                  <TableHead>Fechas</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-center w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filteredProjects.map((project, idx) => {
                    const sBadge = getProjectStatusBadge(project.status, project.isDelayed);
                    const StatusIcon = sBadge.icon;

                    return (
                      <motion.tr
                        key={project.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ delay: idx * 0.02, duration: 0.2 }}
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => handleViewProject(project)}
                      >
                        <TableCell className="font-medium text-sm">
                          <div className="flex items-center gap-2">
                            <FolderKanban className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="truncate max-w-[180px]">{project.name}</span>
                            {project.isDelayed && (
                              <span className="relative flex h-2 w-2 flex-shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive/50 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate max-w-[120px]">{project.client}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Progress value={project.progress} className="h-1.5 w-20" />
                            <span className="text-xs font-medium">{project.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          <span className="font-medium">{project.completed}</span>
                          <span className="text-muted-foreground">/{project.total}</span>
                        </TableCell>
                        <TableCell className="text-center text-sm font-medium">{project.hours.toFixed(1)}h</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center">
                            <div className="flex items-center -space-x-2">
                              {Array.from({ length: Math.min(project.teamSize, 3) }).map((_, i) => (
                                <Avatar key={i} className="h-6 w-6 ring-2 ring-background">
                                  <AvatarFallback className="text-[8px] bg-muted text-foreground font-semibold">T{i + 1}</AvatarFallback>
                                </Avatar>
                              ))}
                              {project.teamSize > 3 && (
                                <div className="h-6 w-6 rounded-full bg-muted ring-2 ring-background flex items-center justify-center">
                                  <span className="text-[8px] text-muted-foreground font-semibold">+{project.teamSize - 3}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3 flex-shrink-0" />
                            <span>{format(new Date(project.startDate), "dd/MM")}</span>
                            <span className="mx-0.5">→</span>
                            <span>{format(new Date(project.endDate), "dd/MM")}</span>
                          </div>
                          <p className="text-[10px] mt-0.5">
                            {project.isDelayed ? <span className="text-destructive">+{project.daysDelayed}d</span> : <span>{project.daysRemaining}d rest.</span>}
                          </p>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={`text-[10px] px-1.5 gap-0.5 ${sBadge.color}`}>
                            <StatusIcon className="h-2.5 w-2.5" />
                            {project.isDelayed ? `+${project.daysDelayed}d` : sBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

              <ProjectDetailModal 
        project={selectedProject ? {
          id: selectedProject.id,
          name: selectedProject.name,
          client: selectedProject.client,
          status: selectedProject.status,
          progress: selectedProject.progress,
          hoursConsumed: selectedProject.hours || 0,
          hoursPool: selectedProject.hoursPool || selectedProject.total_hours || 100,
          endDate: selectedProject.endDate,
          startDate: selectedProject.startDate,
          rate: selectedProject.hourly_rate || 50,
          teamLead: { name: "Sin líder", avatar: "" },
          team: [],
        } : null}
        open={projectModalOpen}
        onOpenChange={setProjectModalOpen}
      />
    </Card>
  );
}