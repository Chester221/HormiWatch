import { useMemo } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Briefcase, CheckSquare, Clock, FolderKanban, Activity, CheckCircle, Clock as ClockIcon,
} from "lucide-react";

interface TechnicianDetailsModalProps {
  tech: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: any[];
  projects: any[];
  clients: any[];
  profiles?: any[];
}

export default function TechnicianDetailsModal({
  tech,
  open,
  onOpenChange,
  tasks,
  projects,
  clients,
  profiles = [],
}: TechnicianDetailsModalProps) {
  const techProfile = profiles.find((p: any) => p.id === tech?.id);
  const techName = techProfile?.full_name || techProfile?.name || tech?.name || "Técnico";
  const techAvatar = techProfile?.avatar_url || null;
  const techInitials = techName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const techTasks = useMemo(() => {
    return tasks
      .filter((t: any) => t.technician_id === tech?.id)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [tasks, tech]);

  const techProjects = useMemo(() => {
    const projectIds = new Set(techTasks.map((t: any) => t.project_id));
    return projects
      .filter((p: any) => projectIds.has(p.id))
      .map((p: any) => {
        const projectTasks = techTasks.filter((t: any) => t.project_id === p.id);
        const client = clients.find((c: any) => c.id === p.client_id);
        return {
          ...p,
          clientName: client?.name || "Sin cliente",
          taskCount: projectTasks.length,
          completedTasks: projectTasks.filter((t: any) => t.status === "Completed").length,
        };
      });
  }, [techTasks, projects, clients]);

  if (!tech) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <DialogHeader>
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              >
                <Avatar className="h-16 w-16 ring-4 ring-border shadow-lg">
                  {techAvatar && <AvatarImage src={techAvatar} alt={techName} />}
                  <AvatarFallback className="bg-muted text-foreground text-xl font-bold">
                    {techInitials}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <DialogTitle className="text-2xl">{techName}</DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-1.5">
                  <Badge variant="outline" className="gap-1 text-[11px]">
                    <Briefcase className="h-3 w-3" />
                    {tech.projectCount} {tech.projectCount === 1 ? "proyecto" : "proyectos"}
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
              </motion.div>
            </div>
          </DialogHeader>
        </motion.div>

        <ScrollArea className="flex-1 pr-4 mt-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="space-y-5"
          >
            <div>
              <h3 className="text-sm font-semibold mb-2.5 flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
                Proyectos Asignados
              </h3>
              <div className="grid gap-2">
                {techProjects.map((project: any, idx: number) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + idx * 0.05, duration: 0.2 }}
                    className="p-3 rounded-lg border bg-muted/20"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <h4 className="font-medium text-sm">{project.name}</h4>
                        <p className="text-xs text-muted-foreground">{project.clientName}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {project.completedTasks}/{project.taskCount} tareas
                      </Badge>
                    </div>
                    <Progress
                      value={project.taskCount > 0 ? (project.completedTasks / project.taskCount) * 100 : 0}
                      className="h-1.5"
                    />
                  </motion.div>
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
                {techTasks.slice(0, 10).map((task: any, idx: number) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + idx * 0.03, duration: 0.2 }}
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
                        {format(new Date(task.created_at), "dd/MM/yyyy HH:mm")}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[11px]">
                      {(
                        task.duration_in_minutes
                          ? task.duration_in_minutes / 60
                          : (task.normal_hours || 0) + (task.overtime_hours || 0)
                      ).toFixed(1)}
                      h
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}