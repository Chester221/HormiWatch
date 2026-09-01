import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Building2, FolderKanban, Clock, CheckSquare, Activity,
  Mail, Phone, Briefcase, User, MapPin, Hash, X,
  Users, Calendar, TrendingUp, Sparkles, Crown, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const HORMI_BLUE = '#0DA2E7';
const HORMI_GRADIENT = "linear-gradient(135deg, #0DA2E7 0%, #0B8BC7 100%)";

// 🔥 Función para formatear números
const formatNumber = (num: number): string => {
  if (num === 0) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// 🔥 Función para obtener iniciales
const getInitials = (name: string) => {
  if (!name) return '?';
  return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
};

// 🔥 Formatear progreso
const formatProgress = (value: number): string => {
  if (value >= 10) return Math.round(value).toString();
  if (value === 0) return '0';
  return value.toFixed(1);
};

interface ClientDetailsModalProps {
  client: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: any[];
  projects: any[];
  tasks: any[];
}

export default function ClientDetailsModal({
  client,
  open,
  onOpenChange,
  clients,
  projects,
  tasks,
}: ClientDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'projects' | 'contacts'>('info');

  const clientData = clients.find((c: any) => c.name === client?.name) || client || {};
  const clientColor = clientData.color || HORMI_BLUE;

  const clientProjects = useMemo(() => {
    if (!clientData?.id) return [];
    return projects
      .filter((p: any) => p.client_id === clientData.id)
      .map((p: any) => {
        const projectTasks = tasks.filter((t: any) => t.project_id === p.id);
        const completed = projectTasks.filter((t: any) => t.status === "Completed").length;
        const total = projectTasks.length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        const projectHours = projectTasks.reduce(
          (acc: number, t: any) =>
            acc +
            (t.duration_in_minutes
              ? t.duration_in_minutes / 60
              : (t.normal_hours || 0) + (t.overtime_hours || 0)),
          0
        );
        return { ...p, progress, completed, total, projectHours };
      });
  }, [clientData, projects, tasks]);

  const totalHours = useMemo(() => {
    return clientProjects.reduce((acc, p) => acc + p.projectHours, 0);
  }, [clientProjects]);

  const contacts = (clientData as any)?.contacts || [];

  // ✅ Estadísticas
  const stats = {
    projects: clientProjects.length,
    hours: totalHours,
    contacts: contacts.length,
    completed: clientProjects.filter(p => p.progress >= 100).length,
    inProgress: clientProjects.filter(p => p.progress > 0 && p.progress < 100).length,
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[92vh] overflow-hidden flex flex-col bg-card border-border p-0 rounded-2xl shadow-2xl">
        
        {/* ═══════════ HEADER PREMIUM ═══════════ */}
        <div className="relative p-6 bg-gradient-to-r from-[#0DA2E7]/15 via-[#0DA2E7]/5 to-transparent border-b border-border flex-shrink-0">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#0DA2E7]/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#0DA2E7]/5 blur-3xl" />
          
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="relative"
              >
                <div 
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `${clientColor}15` }}
                >
                  <Building2 
                    className="h-7 w-7"
                    style={{ color: clientColor }}
                  />
                </div>
              </motion.div>
              <div className="min-w-0">
                <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-3 flex-wrap">
                  {clientData.name || client.name}
                  {clientData.is_active === false && (
                    <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-[10px] px-2 py-0">
                      Inactivo
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant="outline" className="gap-1 text-[10px] px-2 py-0">
                    <FolderKanban className="h-3 w-3" />
                    {stats.projects} {stats.projects === 1 ? "proyecto" : "proyectos"}
                  </Badge>
                  <Badge variant="outline" className="gap-1 text-[10px] px-2 py-0">
                    <Clock className="h-3 w-3" />
                    {formatNumber(Math.round(totalHours))}h totales
                  </Badge>
                  <Badge variant="outline" className="gap-1 text-[10px] px-2 py-0">
                    <Users className="h-3 w-3" />
                    {stats.contacts} {stats.contacts === 1 ? "contacto" : "contactos"}
                  </Badge>
                  {stats.completed > 0 && (
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] px-2 py-0">
                      {stats.completed} completados
                    </Badge>
                  )}
                </DialogDescription>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg hover:bg-muted/50 shrink-0"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ═══════════ TABS ═══════════ */}
        <div className="px-6 pt-3 border-b border-border/50 flex-shrink-0">
          <div className="flex items-center gap-1 bg-muted/20 p-0.5 rounded-lg w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('info')}
              className={cn(
                "flex-1 sm:flex-none text-xs rounded-md px-4 py-1.5 transition-all cursor-pointer",
                "flex items-center justify-center gap-1.5",
                activeTab === 'info'
                  ? 'bg-white text-[#0DA2E7] shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <Building2 className="h-3.5 w-3.5" />
              Información
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={cn(
                "flex-1 sm:flex-none text-xs rounded-md px-4 py-1.5 transition-all cursor-pointer",
                "flex items-center justify-center gap-1.5",
                activeTab === 'projects'
                  ? 'bg-white text-[#0DA2E7] shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <FolderKanban className="h-3.5 w-3.5" />
              Proyectos
              {stats.projects > 0 && (
                <Badge className="ml-0.5 bg-[#0DA2E7]/10 text-[#0DA2E7] text-[9px] px-1.5 py-0 border-none">
                  {stats.projects}
                </Badge>
              )}
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={cn(
                "flex-1 sm:flex-none text-xs rounded-md px-4 py-1.5 transition-all cursor-pointer",
                "flex items-center justify-center gap-1.5",
                activeTab === 'contacts'
                  ? 'bg-white text-[#0DA2E7] shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <Users className="h-3.5 w-3.5" />
              Contactos
              {stats.contacts > 0 && (
                <Badge className="ml-0.5 bg-[#0DA2E7]/10 text-[#0DA2E7] text-[9px] px-1.5 py-0 border-none">
                  {stats.contacts}
                </Badge>
              )}
            </button>
          </div>
        </div>

        {/* ═══════════ CONTENIDO ═══════════ */}
        <div className="flex-1 overflow-y-auto p-6 pt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* TAB: INFORMACIÓN */}
              {activeTab === 'info' && (
                <div className="space-y-5">
                  {/* Info General */}
                  {(clientData.ruc || clientData.code || clientData.address || clientData.department) && (
                    <div>
                      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-[#0DA2E7]" />
                        Información General
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {(clientData.ruc || clientData.code) && (
                          <div className="p-3 rounded-lg border border-border/40 bg-muted/5">
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 mb-0.5">
                              <Hash className="h-3 w-3" />
                              RIF / Código
                            </p>
                            <p className="text-sm font-medium text-foreground">
                              {clientData.ruc || clientData.code}
                            </p>
                          </div>
                        )}
                        {clientData.department && (
                          <div className="p-3 rounded-lg border border-border/40 bg-muted/5">
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 mb-0.5">
                              <Briefcase className="h-3 w-3" />
                              Departamento
                            </p>
                            <p className="text-sm font-medium text-foreground">
                              {clientData.department}
                            </p>
                          </div>
                        )}
                        {clientData.address && (
                          <div className="p-3 rounded-lg border border-border/40 bg-muted/5 col-span-2">
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 mb-0.5">
                              <MapPin className="h-3 w-3" />
                              Dirección
                            </p>
                            <p className="text-sm font-medium text-foreground">
                              {clientData.address}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Stats rápidos */}
                  <div>
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                      <TrendingUp className="h-3.5 w-3.5 text-[#0DA2E7]" />
                      Resumen
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-lg border border-border/40 bg-muted/5 text-center">
                        <p className="text-2xl font-bold text-foreground">{stats.projects}</p>
                        <p className="text-[10px] text-muted-foreground">Proyectos</p>
                      </div>
                      <div className="p-3 rounded-lg border border-border/40 bg-muted/5 text-center">
                        <p className="text-2xl font-bold text-foreground">{formatNumber(Math.round(stats.hours))}h</p>
                        <p className="text-[10px] text-muted-foreground">Horas totales</p>
                      </div>
                      <div className="p-3 rounded-lg border border-border/40 bg-muted/5 text-center">
                        <p className="text-2xl font-bold text-emerald-500">{stats.completed}</p>
                        <p className="text-[10px] text-muted-foreground">Completados</p>
                      </div>
                      <div className="p-3 rounded-lg border border-border/40 bg-muted/5 text-center">
                        <p className="text-2xl font-bold text-blue-500">{stats.inProgress}</p>
                        <p className="text-[10px] text-muted-foreground">En progreso</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: PROYECTOS */}
              {activeTab === 'projects' && (
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FolderKanban className="h-3.5 w-3.5 text-[#0DA2E7]" />
                    Proyectos ({stats.projects})
                  </h3>
                  {clientProjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <FolderKanban className="h-12 w-12 text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">No hay proyectos para este cliente</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {clientProjects.map((project: any, idx: number) => (
                        <motion.div
                          key={project.id}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.04, duration: 0.2 }}
                          className="p-3 rounded-lg border border-border/40 bg-muted/5 hover:border-[#0DA2E7]/20 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm text-foreground">
                              {project.name}
                            </h4>
                            <Badge variant="outline" className="text-[10px] gap-1">
                              <CheckSquare className="h-3 w-3" />
                              {project.completed}/{project.total}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Progress
                              value={project.progress}
                              className="h-1.5 flex-1 bg-muted/30"
                            />
                            <span className="text-[10px] font-medium text-muted-foreground">
                              {formatProgress(project.progress)}%
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {project.projectHours.toFixed(1)}h
                            </span>
                            <span className="flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              {project.progress >= 100
                                ? "Completado"
                                : project.progress > 0
                                ? "En progreso"
                                : "Pendiente"}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: CONTACTOS */}
              {activeTab === 'contacts' && (
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-[#0DA2E7]" />
                    Contactos ({stats.contacts})
                  </h3>
                  {contacts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Users className="h-12 w-12 text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">No hay contactos registrados</p>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {contacts.map((contact: any, idx: number) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.04, duration: 0.2 }}
                          className="p-3 rounded-lg border border-border/40 bg-muted/5 hover:border-[#0DA2E7]/20 transition-colors"
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-[10px] bg-[#0DA2E7]/10 text-[#0DA2E7]">
                                {getInitials(contact.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm text-foreground">
                                {contact.name}
                              </p>
                              {contact.position && (
                                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Briefcase className="h-3 w-3" />
                                  {contact.position}
                                  {contact.department && (
                                    <span>· {contact.department}</span>
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-0.5 ml-10">
                            {contact.email && (
                              <a 
                                href={`mailto:${contact.email}`} 
                                className="text-[11px] text-muted-foreground hover:text-[#0DA2E7] transition-colors flex items-center gap-1.5"
                              >
                                <Mail className="h-3 w-3" />
                                {contact.email}
                              </a>
                            )}
                            {contact.phone && (
                              <a 
                                href={`tel:${contact.phone}`} 
                                className="text-[11px] text-muted-foreground hover:text-[#0DA2E7] transition-colors flex items-center gap-1.5"
                              >
                                <Phone className="h-3 w-3" />
                                {contact.phone}
                              </a>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}