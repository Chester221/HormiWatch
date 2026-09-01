import { useState, useMemo } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Users, Award, Search, LayoutDashboard, ListTodo,
  Clock, CheckSquare, TrendingUp, TrendingDown, Eye,
  Briefcase, FolderKanban, Activity, CheckCircle, Clock as ClockIcon,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Subcomponentes
// ---------------------------------------------------------------------------

const TechnicianGridCard = ({ tech, index, onClick }: { tech: any; index: number; onClick: () => void }) => {
  const efficiencyColor =
    tech.trend > 0
      ? "text-primary"
      : tech.trend < 0
      ? "text-destructive"
      : "text-muted-foreground";
  const TrendIcon = tech.trend > 0 ? TrendingUp : tech.trend < 0 ? TrendingDown : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ y: -2 }}
      className="cursor-pointer"
      onClick={onClick}
    >
      <Card className="hover:shadow-sm transition-shadow border-border overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              <Avatar className="h-10 w-10 ring-2 ring-offset-1 ring-offset-background ring-border">
                <AvatarFallback className="bg-muted text-foreground font-bold text-sm">
                  {tech.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold shadow-sm"
              >
                {index + 1}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm text-foreground truncate">
                {tech.name}
              </h4>
              <p className="text-xs text-muted-foreground">
                {tech.projectCount} proyectos
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="p-2 rounded-md bg-muted/30">
              <div className="flex items-center gap-1 mb-0.5">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground font-medium">HORAS</span>
              </div>
              <p className="text-base font-bold text-foreground">
                {tech.hours.toFixed(1)}h
              </p>
            </div>
            <div className="p-2 rounded-md bg-muted/30">
              <div className="flex items-center gap-1 mb-0.5">
                <CheckSquare className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground font-medium">TAREAS</span>
              </div>
              <p className="text-base font-bold text-foreground">
                {tech.completedTasks}
                <span className="text-muted-foreground text-sm">/{tech.tasks}</span>
              </p>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Eficiencia</span>
              <div className={`flex items-center gap-0.5 font-semibold ${efficiencyColor}`}>
                {TrendIcon && <TrendIcon className="h-3 w-3" />}
                <span>
                  {tech.trend > 0 ? "+" : ""}
                  {tech.trend}%
                </span>
              </div>
            </div>
            <Progress
              value={
                tech.tasks > 0 ? (tech.completedTasks / tech.tasks) * 100 : 0
              }
              className="h-1.5"
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const TechnicianTableRow = ({ tech, index, onClick }: { tech: any; index: number; onClick: () => void }) => {
  const efficiency = tech.tasks > 0 ? (tech.completedTasks / tech.tasks) * 100 : 0;
  const trendColor =
    tech.trend > 0
      ? "text-primary"
      : tech.trend < 0
      ? "text-destructive"
      : "text-muted-foreground";

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/30 transition-colors"
      onClick={onClick}
    >
      <TableCell className="text-center font-bold text-sm text-muted-foreground w-8">
        {index + 1}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[9px] bg-muted text-foreground">
              {tech.name
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{tech.name}</span>
        </div>
      </TableCell>
      <TableCell className="text-center text-sm font-semibold">
        {tech.hours.toFixed(1)}h
      </TableCell>
      <TableCell className="text-center text-sm">
        {tech.completedTasks}/{tech.tasks}
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-1.5">
          <Progress value={efficiency} className="h-1.5 w-12" />
          <span className="text-xs">{Math.round(efficiency)}%</span>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <span className={`text-xs font-semibold ${trendColor}`}>
          {tech.trend > 0 ? "+" : ""}
          {tech.trend}%
        </span>
      </TableCell>
      <TableCell className="text-center text-sm">
        {tech.projectCount}
      </TableCell>
    </TableRow>
  );
};

const TechnicianDetailsModal = ({
  tech,
  open,
  onOpenChange,
  tasks,
  projects,
  clients,
}: {
  tech: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: any[];
  projects: any[];
  clients: any[];
}) => {
  const techTasks = useMemo(() => {
    return tasks
      .filter((t: any) => t.technician_id === tech?.id)
      .sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }, [tasks, tech]);

  const techProjects = useMemo(() => {
    const projectIds = new Set(techTasks.map((t: any) => t.project_id));
    return projects
      .filter((p: any) => projectIds.has(p.id))
      .map((p: any) => {
        const projectTasks = techTasks.filter(
          (t: any) => t.project_id === p.id
        );
        const client = clients.find((c: any) => c.id === p.client_id);
        return {
          ...p,
          clientName: client?.name || "Sin cliente",
          taskCount: projectTasks.length,
          completedTasks: projectTasks.filter(
            (t: any) => t.status === "Completed"
          ).length,
        };
      });
  }, [techTasks, projects, clients]);

  if (!tech) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 ring-4 ring-border">
              <AvatarFallback className="bg-muted text-foreground text-xl font-bold">
                {tech.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-xl">{tech.name}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="gap-1 text-[11px]">
                  <Briefcase className="h-3 w-3" />
                  {tech.projectCount} proyectos
                </Badge>
                <Badge variant="outline" className="gap-1 text-[11px]">
                  <CheckSquare className="h-3 w-3" />
                  {tech.completedTasks}/{tech.tasks} tareas
                </Badge>
                <Badge variant="outline" className="gap-1 text-[11px]">
                  <Clock className="h-3 w-3" />
                  {tech.hours.toFixed(1)}h
                </Badge>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold mb-2.5 flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
                Proyectos Asignados
              </h3>
              <div className="grid gap-2">
                {techProjects.map((project: any) => (
                  <div
                    key={project.id}
                    className="p-3 rounded-lg border bg-muted/20"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <h4 className="font-medium text-sm">{project.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {project.clientName}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {project.completedTasks}/{project.taskCount} tareas
                      </Badge>
                    </div>
                    <Progress
                      value={
                        project.taskCount > 0
                          ? (project.completedTasks / project.taskCount) * 100
                          : 0
                      }
                      className="h-1.5"
                    />
                  </div>
                ))}
              </div>
            </div>
            <Separator />
            <div>
              <h3 className="text-sm font-semibold mb-2.5 flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                Actividad Reciente
              </h3>
              <div className="space-y-1.5">
                {techTasks.slice(0, 10).map((task: any) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20"
                  >
                    <div className="p-1.5 rounded-md bg-muted">
                      {task.status === "Completed" ? (
                        <CheckCircle className="h-3.5 w-3.5 text-foreground" />
                      ) : (
                        <ClockIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {task.description || "Sin descripción"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(
                          new Date(task.created_at),
                          "dd/MM/yyyy HH:mm"
                        )}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[11px]">
                      {(
                        task.duration_in_minutes
                          ? task.duration_in_minutes / 60
                          : (task.normal_hours || 0) +
                            (task.overtime_hours || 0)
                      ).toFixed(1)}
                      h
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

interface EquipoTabProps {
  technicianPerformance: any[];
  tasks: any[];
  projects: any[];
  clients: any[];
}

export default function EquipoTab({
  technicianPerformance,
  tasks,
  projects,
  clients,
}: EquipoTabProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [equipoFilter, setEquipoFilter] = useState("");
  const [selectedTechnician, setSelectedTechnician] = useState<any>(null);
  const [techModalOpen, setTechModalOpen] = useState(false);

  const filteredTechnicians = equipoFilter
    ? technicianPerformance.filter((t: any) =>
        t.name.toLowerCase().includes(equipoFilter.toLowerCase())
      )
    : technicianPerformance;

  const handleViewTechnician = (tech: any) => {
    setSelectedTechnician(tech);
    setTechModalOpen(true);
  };

  return (
    <>
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Award className="h-4 w-4 text-muted-foreground" />
                Rendimiento del Equipo
              </CardTitle>
              <CardDescription className="text-xs">
                {technicianPerformance.length} técnicos · Ranking por horas trabajadas
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar técnico..."
                  className="pl-7 h-8 w-36 text-xs"
                  value={equipoFilter}
                  onChange={(e) => setEquipoFilter(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-0.5 p-0.5 bg-muted rounded-lg">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setViewMode("list")}
                >
                  <ListTodo className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTechnicians.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">No se encontraron técnicos</p>
              <p className="text-xs text-muted-foreground">
                {equipoFilter
                  ? "Intenta con otro filtro"
                  : "No hay técnicos con horas registradas"}
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-[550px] overflow-y-auto pr-2">
              {filteredTechnicians.map((tech: any, idx: number) => (
                <TechnicianGridCard
                  key={tech.id}
                  tech={tech}
                  index={idx}
                  onClick={() => handleViewTechnician(tech)}
                />
              ))}
            </div>
          ) : (
            <div className="max-h-[550px] overflow-y-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8 text-center">#</TableHead>
                    <TableHead>Técnico</TableHead>
                    <TableHead className="text-center">Horas</TableHead>
                    <TableHead className="text-center">Tareas</TableHead>
                    <TableHead className="text-center">Eficiencia</TableHead>
                    <TableHead className="text-center">Tendencia</TableHead>
                    <TableHead className="text-center">Proyectos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTechnicians.map((tech: any, idx: number) => (
                    <TechnicianTableRow
                      key={tech.id}
                      tech={tech}
                      index={idx}
                      onClick={() => handleViewTechnician(tech)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <TechnicianDetailsModal
        tech={selectedTechnician}
        open={techModalOpen}
        onOpenChange={setTechModalOpen}
        tasks={tasks}
        projects={projects}
        clients={clients}
      />
    </>
  );
}