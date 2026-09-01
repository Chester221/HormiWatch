import { useState, useMemo, useEffect } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useServices } from "@/hooks/useServices";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/lib/supabase/client";
import { 
  FolderKanban, 
  Clock, 
  Download,
  CheckSquare,
  Users,
  UserPlus,
  UserMinus,
  Pencil,
  Maximize2,
  Activity,
  Calendar,
  Wrench,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

type ActivityType = "all" | "tasks" | "projects" | "services" | "exports" | "project_events";

interface ProjectEvent {
  id: string;
  type: "project_event";
  action: "assigned" | "removed" | "member_added" | "member_removed" | "updated";
  title: string;
  description: string;
  projectName: string;
  projectId: string;
  user: string;
  time: string;
}

interface Activity {
  id: string;
  type: "task" | "project" | "service" | "export" | "project_event";
  title: string;
  description: string;
  user: string;
  time: string;
  action?: string;
  projectId?: string;
  projectName?: string;
  eventType?: string;
  serviceName?: string;
}

const ActivityList = ({ 
  tasks, projects, services, user, profile, isTechnician, isManagerOrAdmin, selectedType 
}: {
  tasks: any[]; projects: any[]; services: any[]; user: any; profile: any;
  isTechnician: boolean; isManagerOrAdmin: boolean; selectedType: ActivityType;
}) => {
  const navigate = useNavigate();
  const [projectEvents, setProjectEvents] = useState<ProjectEvent[]>([]);

  useEffect(() => {
    const fetchProjectEvents = async () => {
      if (!user?.id) return;
      let query = supabase.from('project_activities').select('*, projects(name)').order('created_at', { ascending: false }).limit(30);
      if (isTechnician) query = query.eq('user_id', user.id);
      const { data, error } = await query;
      if (!error && data) {
        setProjectEvents(data.map((event: any) => {
          let actionText = "";
          switch (event.action_type) {
            case 'assigned': actionText = "Fuiste asignado al proyecto"; break;
            case 'removed': actionText = "Fuiste eliminado del proyecto"; break;
            case 'member_added': actionText = "Nuevo miembro en el proyecto"; break;
            case 'member_removed': actionText = "Miembro eliminado del proyecto"; break;
            case 'updated': actionText = "Proyecto actualizado"; break;
            default: actionText = "Actividad en el proyecto";
          }
          return { id: event.id, type: "project_event", action: event.action_type, title: event.projects?.name || "Proyecto", description: actionText, projectName: event.projects?.name || "Proyecto", projectId: event.project_id, user: profile?.full_name || "Usuario", time: event.created_at };
        }));
      }
    };
    fetchProjectEvents();
  }, [user, isTechnician, profile]);

  const userTasks = useMemo(() => {
    if (isTechnician) return tasks.filter((t: any) => t.technician_id === user?.id || t.created_by === user?.id);
    return tasks;
  }, [tasks, isTechnician, user]);

  const userProjects = useMemo(() => {
    if (isTechnician) {
      const projectIds = new Set(userTasks.map((t: any) => t.project_id).filter(Boolean));
      return projects.filter((p: any) => projectIds.has(p.id));
    }
    return projects;
  }, [projects, userTasks, isTechnician]);

  const userServices = useMemo(() => {
    const serviceIds = new Set(userTasks.map((t: any) => t.service_id).filter(Boolean));
    return services.filter((s: any) => serviceIds.has(s.id));
  }, [services, userTasks]);

  const activities: Activity[] = useMemo(() => {
    const all: Activity[] = [];

    projectEvents.forEach(event => all.push({ ...event, type: "project_event" }));

    userTasks.forEach(task => {
      const isCreator = task.created_by === user?.id;
      let actionText = isCreator ? "Creada por ti" : "Asignada a ti";
      if (task.status === 'Completed') actionText = isCreator ? "Completada (creada por ti)" : "Completada";
      else if (task.status === 'In Progress') actionText = isCreator ? "En progreso (creada por ti)" : "En progreso";

      all.push({
        id: `task-${task.id}`, type: "task", title: task.description || "Tarea registrada",
        description: task.projects?.name || "Proyecto General", user: profile?.full_name || "Tú",
        time: task.created_at, action: actionText, projectId: task.project_id, projectName: task.projects?.name,
      });
    });

    userProjects.forEach(project => {
      const projectTasks = userTasks.filter((t: any) => String(t.project_id) === String(project.id));
      all.push({
        id: `project-${project.id}`, type: "project", title: project.name,
        description: `${projectTasks.length} tareas · ${projectTasks.filter(t => t.status === 'Completed').length} completadas`,
        user: profile?.full_name || "Tú", time: project.created_at, projectId: project.id, projectName: project.name,
      });
    });

    userServices.forEach(service => {
      const serviceTasks = userTasks.filter((t: any) => t.service_id === service.id);
      all.push({
        id: `service-${service.id}`, type: "service", title: service.name,
        description: `${serviceTasks.length} tareas · $${service.default_hourly_rate}/h`,
        user: profile?.full_name || "Tú", time: service.created_at || new Date().toISOString(), serviceName: service.name,
      });
    });

    userTasks.filter(t => t.status === 'Completed').slice(0, 5).forEach(t => {
      all.push({
        id: `export-${t.id}`, type: "export", title: "Exportación de tareas",
        description: t.description || "Sin descripción", user: profile?.full_name || "Tú", time: t.updated_at || t.created_at,
      });
    });

    return all.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [userTasks, userProjects, userServices, projectEvents, profile]);

  const filteredActivities = activities.filter(a => {
    if (selectedType === "all") return true;
    if (selectedType === "tasks") return a.type === "task";
    if (selectedType === "projects") return a.type === "project";
    if (selectedType === "services") return a.type === "service";
    if (selectedType === "exports") return a.type === "export";
    if (selectedType === "project_events") return a.type === "project_event";
    return true;
  });

  const groupedActivities = useMemo(() => {
    const groups: { [key: string]: Activity[] } = {};
    filteredActivities.forEach(activity => {
      const date = new Date(activity.time);
      const today = new Date(); const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
      let key = "";
      if (date.toDateString() === today.toDateString()) key = "HOY";
      else if (date.toDateString() === yesterday.toDateString()) key = "AYER";
      else key = formatDistanceToNow(date, { addSuffix: true, locale: es }).toUpperCase();
      if (!groups[key]) groups[key] = [];
      groups[key].push(activity);
    });
    return groups;
  }, [filteredActivities]);

  const getTimeAgo = (time: string) => { try { return formatDistanceToNow(new Date(time), { addSuffix: true, locale: es }); } catch { return "hace un momento"; } };
  
  const getIcon = (a: Activity) => {
    if (a.type === "task") return <CheckSquare className="h-4 w-4" />;
    if (a.type === "project_event") { if (a.eventType === 'assigned' || a.eventType === 'member_added') return <UserPlus className="h-4 w-4" />; if (a.eventType === 'removed' || a.eventType === 'member_removed') return <UserMinus className="h-4 w-4" />; if (a.eventType === 'updated') return <Pencil className="h-4 w-4" />; return <FolderKanban className="h-4 w-4" />; }
    if (a.type === "project") return <FolderKanban className="h-4 w-4" />;
    if (a.type === "service") return <Wrench className="h-4 w-4" />;
    if (a.type === "export") return <Download className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };
  
  const getIconBg = (a: Activity) => {
    if (a.type === "task") return "bg-blue-50 text-blue-500";
    if (a.type === "project") return "bg-indigo-50 text-indigo-500";
    if (a.type === "service") return "bg-purple-50 text-purple-500";
    if (a.type === "export") return "bg-cyan-50 text-cyan-500";
    if (a.type === "project_event") return "bg-amber-50 text-amber-500";
    return "bg-muted text-muted-foreground";
  };
  
  const isClickable = (a: Activity) => a.type === "task" || a.type === "project" || a.type === "service";
  const handleClick = (a: Activity) => { if (a.type === "task") navigate("/tasks"); if (a.type === "project") navigate("/projects"); if (a.type === "service") navigate("/services"); };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6">
      {Object.entries(groupedActivities).length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center text-muted-foreground h-full">
          <Activity className="h-12 w-12 opacity-30 mb-3" />
          <p className="text-sm font-medium">No hay actividad reciente</p>
          <p className="text-xs mt-1">Las actividades aparecerán aquí</p>
        </motion.div>
      ) : (
        Object.entries(groupedActivities).map(([date, items], groupIdx) => (
          <motion.div key={date} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: groupIdx * 0.05, duration: 0.25 }}>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-3 w-3 text-primary" />
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider">{date}</h4>
              <div className="flex-1 h-px bg-gradient-to-r from-primary/20 to-transparent" />
            </div>
            <div className="space-y-2 pl-2">
              <AnimatePresence>
                {items.map((activity, idx) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.2 }}
                    whileHover={{ scale: 1.01, x: 4 }}
                    onClick={() => isClickable(activity) && handleClick(activity)}
                    className={`group p-3 rounded-xl transition-all duration-200 ${isClickable(activity) ? "hover:bg-muted/50 hover:shadow-sm cursor-pointer" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <motion.div whileHover={{ scale: 1.1 }} className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${getIconBg(activity)}`}>
                        {getIcon(activity)}
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-sm font-semibold text-foreground">{activity.title}</p>
                          {activity.action && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              activity.action.includes("Completada") ? "bg-emerald-50 text-emerald-600" :
                              activity.action.includes("progreso") ? "bg-amber-50 text-amber-600" :
                              activity.action.includes("Creada") ? "bg-blue-50 text-blue-600" :
                              activity.action.includes("Asignada") ? "bg-purple-50 text-purple-600" :
                              "bg-muted text-muted-foreground"
                            }`}>{activity.action}</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{activity.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1"><Users className="h-3 w-3" />{activity.user}</span>
                          <span className="text-[10px] text-muted-foreground/60">•</span>
                          <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1"><Clock className="h-3 w-3" />{getTimeAgo(activity.time)}</span>
                        </div>
                      </div>
                      {isClickable(activity) && (
                        <motion.div whileHover={{ x: 3 }}><ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all flex-shrink-0" /></motion.div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
};

export function ActivityFeed() {
  const { data: tasks = [] } = useTasks();
  const { data: projects = [] } = useProjects();
  const { data: services = [] } = useServices();
  const { user, profile } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ActivityType>("all");
  const userRole = profile?.role || 'Technician';
  const isTechnician = userRole === 'Technician';
  const isManagerOrAdmin = userRole === 'Admin' || userRole === 'Manager';

  const typeButtons: { value: ActivityType; label: string; icon: any }[] = [
    { value: "all", label: "Todo", icon: Activity },
    { value: "tasks", label: "Tareas", icon: CheckSquare },
    { value: "projects", label: "Proyectos", icon: FolderKanban },
    { value: "services", label: "Servicios", icon: Wrench },
    { value: "exports", label: "Exportaciones", icon: Download },
    { value: "project_events", label: "Eventos", icon: Calendar },
  ];

  const listProps = { tasks, projects, services, user, profile, isTechnician, isManagerOrAdmin, selectedType };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col" style={{ height: "420px" }}>
        <div className="p-4 border-b border-border shrink-0 bg-gradient-to-r from-card to-muted/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /><h3 className="text-lg font-semibold text-foreground">Actividad Reciente</h3></div>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setIsModalOpen(true)} className="p-1.5 rounded-md hover:bg-muted transition-colors"><Maximize2 className="h-4 w-4 text-muted-foreground" /></motion.button>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {typeButtons.map((btn) => (
              <motion.button key={btn.value} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedType(btn.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${selectedType === btn.value ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted/50"}`}>
                <btn.icon className="h-3 w-3" />{btn.label}
              </motion.button>
            ))}
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <ActivityList {...listProps} />
        </div>
      </motion.div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl w-[90vw] h-[85vh] bg-card border-border flex flex-col p-0 rounded-2xl shadow-2xl overflow-hidden">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex flex-col h-full">
            <div className="p-5 border-b border-border shrink-0 bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Activity className="h-6 w-6 text-primary" /><h2 className="text-2xl font-bold text-foreground">Actividad Reciente</h2></div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap mt-4">
                {typeButtons.map((btn) => (
                  <motion.button key={btn.value} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedType(btn.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${selectedType === btn.value ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted/50"}`}>
                    <btn.icon className="h-3 w-3" />{btn.label}
                  </motion.button>
                ))}
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <ActivityList {...listProps} />
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  );
}