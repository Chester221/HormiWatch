import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, Users, Calendar, Lock, Pencil, Trash2, FolderKanban,
  Crown
} from "lucide-react";

const HORMI_BLUE = '#0DA2E7';

interface ProjectCardProps {
  project: any;
  idx: number;
  statusColor: string;
  statusInfo: { label: string; class: string; color: string };
  clientData: any;
  canEdit: boolean;
  handleProjectClick: (project: any) => void;
  handleEditProject: (project: any, e?: React.MouseEvent) => void;
  handleDeleteClick: (id: string, name: string, e: React.MouseEvent) => void;
  handleMemberClick: (memberId: string, e: React.MouseEvent) => void;
  compact?: boolean;
}

export function ProjectCard({
  project,
  idx,
  statusColor,
  statusInfo,
  clientData,
  canEdit,
  handleProjectClick,
  handleEditProject,
  handleDeleteClick,
  handleMemberClick,
  compact = false,
}: ProjectCardProps) {
  // ✅ VALIDACIONES DE SEGURIDAD
  const hasLeader = project?.teamLead?.id ? true : false;
  const team = Array.isArray(project?.team) ? project.team : [];
  const teamCount = team.length;
  const totalMembers = teamCount + (hasLeader ? 1 : 0);
  const progress = project?.progress || 0;
  const hoursConsumed = project?.hoursConsumed || 0;
  const hoursPool = project?.hoursPool || 0;

  // 🔥 Formatear progreso
  const formatProgress = (value: number): string => {
    if (value >= 10) return Math.round(value).toString();
    if (value < 1 && value > 0) return value.toFixed(1);
    if (value === 0) return '0';
    return value.toFixed(1);
  };

  // 🔥 Formatear números con separador de miles
  const formatNumber = (num: number): string => {
    if (num === 0) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // 🔥 Obtener iniciales
  const getInitials = (name: string) => {
    if (!name) return '?';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
  };

  // 🔥 Truncar nombre largo
  const truncateName = (name: string, maxLength: number = 18) => {
    if (!name) return '';
    return name.length > maxLength ? name.substring(0, maxLength) + '...' : name;
  };

  // 🔥 LÍMITE DE TÉCNICOS A MOSTRAR
  const MAX_TECHNICIANS = compact ? 2 : 3;
  const displayedTeam = team.slice(0, MAX_TECHNICIANS);
  const remainingTeam = team.length - MAX_TECHNICIANS;

  // ✅ Obtener datos del líder de forma segura
  const leaderName = project?.teamLead?.name || "Sin líder";
  const leaderAvatar = project?.teamLead?.avatar || "";
  const leaderId = project?.teamLead?.id || "";

  return (
    <motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ 
    delay: idx * 0.03, 
    duration: 0.25,
    ease: "easeOut"
  }}
  whileHover={{ 
    y: -2,
    transition: { duration: 0.15, ease: "easeOut" }
  }}
  onClick={() => handleProjectClick(project)}
  className={cn(
    "group relative rounded-xl border border-[#0DA2E7]/10 bg-card shadow-sm hover:shadow-md hover:border-[#0DA2E7]/20 transition-all duration-150 cursor-pointer overflow-hidden",
    project?.isClosed && "opacity-60 hover:opacity-80",
    compact ? "p-3" : "p-4"
  )}
>
      {/* Barra superior animada */}
      <motion.div 
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ backgroundColor: statusColor || HORMI_BLUE }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      />

      {/* Círculo decorativo */}
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#0DA2E7] opacity-[0.03] transition-transform duration-500 group-hover:scale-150" />

      <motion.div 
        className={cn("relative space-y-3", compact && "space-y-2")}
        layout
        transition={{ duration: 0.25, ease: "easeInOut" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <motion.div 
              className={cn(
                "flex shrink-0 items-center justify-center rounded-lg bg-[#0DA2E7]/10",
                compact ? "h-7 w-7" : "h-9 w-9"
              )}
              layout
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              {clientData?.logo_url ? (
                <img 
                  src={clientData.logo_url} 
                  alt="" 
                  className={cn("rounded object-cover", compact ? "h-5 w-5" : "h-6 w-6")} 
                />
              ) : (
                <FolderKanban className={cn("text-[#0DA2E7]", compact ? "h-4 w-4" : "h-4.5 w-4.5")} />
              )}
            </motion.div>
            <div className="min-w-0 flex-1">
              <p className={cn(
                "font-medium uppercase tracking-wider text-muted-foreground/60 truncate",
                compact ? "text-[10px]" : "text-[10px]"
              )}>
                {project?.client || "Sin cliente"}
              </p>
              <h3 className={cn(
                "font-semibold text-foreground group-hover:text-[#0DA2E7] transition-colors truncate",
                compact ? "text-sm" : "text-base"
              )}>
                {project?.name || "Proyecto sin nombre"}
              </h3>
            </div>
          </div>
          
          <Badge 
            variant="outline" 
            className={cn(
              "font-medium shrink-0",
              compact ? "text-[8px] px-1.5 py-0.5" : "text-[10px] px-2 py-0.5",
              statusInfo?.class || "bg-gray-50 text-gray-600 border-gray-200"
            )}
          >
            {statusInfo?.label || "Activo"}
          </Badge>
        </div>

        {/* Barra de progreso - OCULTA EN MODO COMPACTO */}
        <AnimatePresence mode="wait">
          {!compact ? (
            <motion.div
              key="progress-full"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-muted-foreground/60">Progreso</span>
                <span className="font-semibold" style={{ color: HORMI_BLUE }}>
                  {formatProgress(progress)}%
                </span>
              </div>
              <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(progress, 100)}%` }}
                  transition={{ duration: 0.6, delay: idx * 0.03, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: HORMI_BLUE }}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="progress-compact"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="flex items-center justify-between"
            >
              <span className="text-[11px] text-muted-foreground/60">Progreso</span>
              <span className="text-sm font-semibold" style={{ color: HORMI_BLUE }}>
                {formatProgress(progress)}%
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Información - MEJORADA CON FECHAS COMPLETAS */}
        <motion.div 
          className={cn(
            "flex items-center gap-2 text-muted-foreground/60",
            compact ? "text-[11px] gap-1.5" : "text-xs gap-2.5"
          )}
          layout
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          {/* Horas */}
          <span className="flex items-center gap-1 whitespace-nowrap">
            <Clock className={cn("text-muted-foreground/40", compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
            <span className="font-medium">{hoursConsumed.toFixed(0)}h</span>
            <span className="text-muted-foreground/30">/</span>
            <span>{formatNumber(hoursPool)}h</span>
          </span>

          <span className="text-muted-foreground/20">•</span>

          {/* Miembros */}
          <span className="flex items-center gap-1 whitespace-nowrap">
            <Users className={cn("text-muted-foreground/40", compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
            <span className="font-medium">{totalMembers}</span>
          </span>

          <span className="text-muted-foreground/20">•</span>

          {/* Fechas - RANGO COMPLETO */}
          <span className="flex items-center gap-1 whitespace-nowrap">
            <Calendar className={cn("text-muted-foreground/40", compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
            <span className="font-medium">
              {project?.startDate ? new Date(project.startDate).toLocaleDateString("es-ES", { 
                day: "numeric", 
                month: "short" 
              }) : "..."}
            </span>
            <span className="text-muted-foreground/30">→</span>
            <span className="font-medium">
              {project?.endDate ? new Date(project.endDate).toLocaleDateString("es-ES", { 
                day: "numeric", 
                month: "short" 
              }) : "..."}
            </span>
          </span>
        </motion.div>

        {/* 🔥 LÍDER + MIEMBROS */}
        {(hasLeader || teamCount > 0) && (
          <motion.div 
            className={cn(
              "flex items-center gap-2 pt-2.5 border-t border-border/10 min-h-[32px] flex-wrap",
              compact && "pt-2 min-h-[28px]"
            )}
            layout
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {/* LÍDER */}
            {hasLeader && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className="relative cursor-pointer flex items-center gap-1.5 shrink-0"
                      onClick={(e) => leaderId && handleMemberClick(leaderId, e)}
                    >
                      <div className="relative">
                        <Avatar className={cn(
                          "ring-2 ring-amber-400/40 hover:ring-amber-400 transition-all",
                          compact ? "h-5 w-5" : "h-6 w-6"
                        )}>
                          <AvatarImage src={leaderAvatar} />
                          <AvatarFallback className={cn(
                            "font-bold bg-amber-100 text-amber-700",
                            compact ? "text-[8px]" : "text-[10px]"
                          )}>
                            {getInitials(leaderName)}
                          </AvatarFallback>
                        </Avatar>
                        <Crown className={cn(
                          "absolute -top-1 -right-1 text-amber-400 drop-shadow-sm",
                          compact ? "h-2.5 w-2.5" : "h-3 w-3"
                        )} />
                      </div>
                      {!compact && (
                        <span className="text-[11px] text-muted-foreground/60 max-w-[70px] truncate font-medium">
                          {truncateName(leaderName, 12)}
                        </span>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="top" 
                    sideOffset={5}
                    className="text-[11px] bg-card border-border shadow-lg rounded-lg px-3 py-1.5 animate-in fade-in-0 zoom-in-95 max-w-[200px]"
                  >
                    <p className="flex items-center gap-1.5">
                      <Crown className="h-3 w-3 text-amber-400" />
                      <span className="font-medium">{leaderName}</span>
                      <span className="text-muted-foreground/60">(Líder)</span>
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* SEPARADOR */}
            {hasLeader && teamCount > 0 && (
              <span className="text-[11px] text-muted-foreground/20">|</span>
            )}

            {/* MIEMBROS */}
            {teamCount > 0 && (
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <div className="flex -space-x-1.5 flex-wrap">
                  {displayedTeam.map((member: any, i: number) => (
                    <TooltipProvider key={i}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Avatar 
                            className={cn(
                              "ring-1 ring-border hover:ring-[#0DA2E7]/40 cursor-pointer transition-all hover:scale-105",
                              compact ? "h-5 w-5" : "h-6 w-6"
                            )}
                            onClick={(e) => member?.id && handleMemberClick(member.id, e)}
                          >
                            <AvatarImage src={member?.avatar} />
                            <AvatarFallback className={cn(
                              "bg-muted/50 font-medium",
                              compact ? "text-[8px]" : "text-[10px]"
                            )}>
                              {member?.name?.charAt(0).toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent 
                          side="top" 
                          sideOffset={5}
                          className="text-[11px] bg-card border-border shadow-lg rounded-lg px-3 py-1.5 animate-in fade-in-0 zoom-in-95 max-w-[200px]"
                        >
                          <p className="font-medium">{member?.name || "Sin nombre"}</p>
                          {member?.role && (
                            <span className="text-muted-foreground/60 ml-1">({member.role})</span>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                  {remainingTeam > 0 && (
                    <div className={cn(
                      "rounded-full bg-muted/50 ring-1 ring-border flex items-center justify-center font-medium text-muted-foreground",
                      compact ? "h-5 w-5 text-[9px]" : "h-6 w-6 text-[10px]"
                    )}>
                      +{remainingTeam}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Acciones - SOLO EDITAR Y ELIMINAR */}
        {canEdit && !project?.isClosed && (
          <motion.div 
            className={cn(
              "flex items-center justify-end gap-1 border-t border-border/10 opacity-0 group-hover:opacity-100 transition-all duration-300",
              compact ? "pt-1.5 -mt-0.5" : "pt-2 -mt-0.5"
            )}
            layout
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                "p-0 hover:bg-[#0DA2E7]/10 hover:text-[#0DA2E7] rounded-lg transition-all",
                compact ? "h-6 w-6" : "h-7 w-7"
              )} 
              onClick={(e) => handleEditProject(project, e)}
            >
              <Pencil className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                "p-0 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all",
                compact ? "h-6 w-6" : "h-7 w-7"
              )} 
              onClick={(e) => handleDeleteClick(project?.id, project?.name, e)}
            >
              <Trash2 className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
            </Button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}