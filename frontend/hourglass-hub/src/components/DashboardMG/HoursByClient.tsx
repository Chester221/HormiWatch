import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Building2, FolderKanban, ArrowRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface HoursByClientProps {
  tasks: any[];
  projects: any[];
  clients: any[];
}

const COLORS = ["#0DA2E7", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444"];

export function HoursByClient({ tasks, projects, clients }: HoursByClientProps) {
  const navigate = useNavigate();

  // ============================================
  // CÁLCULO DE DATOS
  // ============================================

  const clientMap: Record<string, { id: string; name: string; hours: number; projects: Set<string> }> = {};

  tasks.forEach((task: any) => {
    if (task.status !== "Completed") return;

    const project = projects.find((p: any) => p.id === task.project_id);
    if (!project?.client_id) return;
    const client = clients.find((c: any) => c.id === project.client_id);
    if (!client) return;

    if (!clientMap[client.id]) {
      clientMap[client.id] = {
        id: client.id,
        name: client.name,
        hours: 0,
        projects: new Set(),
      };
    }
    const hours = task.duration_in_minutes ? task.duration_in_minutes / 60 : 0;
    clientMap[client.id].hours += hours;
    clientMap[client.id].projects.add(project.id);
  });

  const clientData = Object.values(clientMap)
    .map((c) => ({ ...c, projectCount: c.projects.size }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 5);

  const totalHours = clientData.reduce((acc, c) => acc + c.hours, 0);
  const avgHours = clientData.length > 0 ? totalHours / clientData.length : 0;

  // ============================================
  // ESTADO VACÍO
  // ============================================

  if (clientData.length === 0) {
    return (
      <div className="rounded-xl border border-border/40 bg-white dark:bg-card p-6 shadow-sm text-center">
        <div className="flex flex-col items-center justify-center py-6">
          <div className="h-14 w-14 rounded-full bg-muted/30 flex items-center justify-center mb-4">
            <Building2 className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <p className="text-base font-medium text-foreground">Sin datos de clientes</p>
          <p className="text-sm text-muted-foreground mt-1">
            No hay tareas completadas asociadas a clientes
          </p>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER PRINCIPAL
  // ============================================

  return (
    <div className="rounded-xl border border-border/40 bg-white dark:bg-card p-4 shadow-sm hover:shadow-md transition-all duration-300">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#0DA2E7]/10">
            <Building2 className="h-4 w-4 text-[#0DA2E7]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Horas por Cliente
            </h3>
            {/* 🔥 CORREGIDO: text-[10px] → text-xs */}
            <p className="text-xs text-muted-foreground">
              {clientData.length} clientes · {totalHours.toFixed(1)}h totales
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* 🔥 CORREGIDO: text-[10px] → text-xs */}
          <Badge variant="outline" className="text-xs border-border/40 bg-muted/10">
            <Clock className="h-3 w-3 mr-1" />
            Prom. {avgHours.toFixed(1)}h
          </Badge>
        </div>
      </div>

      {/* ═══ LISTA DE CLIENTES ═══ */}
      <div className="space-y-2">
        {clientData.map((client: any, idx: number) => {
          const percentage = totalHours > 0 ? Math.round((client.hours / totalHours) * 100) : 0;
          const color = COLORS[idx % COLORS.length];

          return (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => navigate("/clients")}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/10 transition-all duration-200 cursor-pointer group"
            >
              {/* Posición */}
              <div
                className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white flex-shrink-0"
                style={{ backgroundColor: color }}
              >
                {idx + 1}
              </div>

              {/* Nombre */}
              <span className="text-sm font-medium text-foreground truncate flex-1">
                {client.name}
              </span>

              {/* Proyectos */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                <FolderKanban className="h-3 w-3" />
                {client.projectCount}
              </div>

              {/* Horas */}
              <div className="text-right flex-shrink-0 min-w-[60px]">
                <span className="text-sm font-bold text-foreground">
                  {client.hours.toFixed(1)}h
                </span>
              </div>

              {/* Porcentaje con barra */}
              <div className="flex items-center gap-2 flex-shrink-0 min-w-[80px]">
                <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
                {/* 🔥 CORREGIDO: text-[10px] → text-xs */}
                <span className="text-xs font-medium text-muted-foreground">
                  {percentage}%
                </span>
              </div>

              {/* Flecha en hover */}
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/20 group-hover:text-[#0DA2E7] group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0" />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}