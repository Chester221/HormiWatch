import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  FolderKanban,
  ArrowRight,
  Clock,
  Crown,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { taskHours } from "@/lib/dashboardUtils";
import type { Task } from "@/hooks/useTasks";

const CLIENT_COLORS = ["#0DA2E7", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];

interface ClientRow {
  id: string;
  name: string;
  hours: number;
  projectCount: number;
}

interface HoursByClientProps {
  tasks: Task[];
  projects: { id?: string; client_id?: string; name?: string }[];
  clients: { id?: string; name?: string }[];
}

export function HoursByClient({ tasks, projects, clients }: HoursByClientProps) {
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const clientData = useMemo(() => {
    const map: Record<string, { id: string; name: string; hours: number; projects: Set<string> }> = {};

    tasks.forEach((task) => {
      if (task.status !== "Completed") return;
      const project = projects.find((p) => p.id === task.project_id);
      if (!project?.client_id) return;
      const client = clients.find((c) => c.id === project.client_id);
      if (!client?.id) return;

      if (!map[client.id]) {
        map[client.id] = { id: client.id, name: client.name ?? "Sin nombre", hours: 0, projects: new Set() };
      }
      map[client.id].hours += taskHours(task);
      map[client.id].projects.add(project.id);
    });

    return Object.values(map)
      .map((c): ClientRow => ({ id: c.id, name: c.name, hours: c.hours, projectCount: c.projects.size }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5);
  }, [tasks, projects, clients]);

  const totalHours = useMemo(() => clientData.reduce((acc, c) => acc + c.hours, 0), [clientData]);
  const avgHours = clientData.length > 0 ? totalHours / clientData.length : 0;
  const topClient = clientData[0] ?? null;

  const clientColors = useMemo(
    () => clientData.map((_, i) => CLIENT_COLORS[i % CLIENT_COLORS.length]),
    [clientData],
  );

  if (clientData.length === 0) {
    return (
      <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm dark:bg-card">
        <div className="flex flex-col items-center justify-center py-6">
          <div className="bg-gradient-to-br from-[#0DA2E7] to-[#0B8BC7] mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm shadow-[#0DA2E7]/30">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <p className="text-base font-semibold text-foreground">Sin datos de clientes</p>
          <p className="mt-1 text-sm text-muted-foreground">
            No hay tareas completadas asociadas a clientes
          </p>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/40 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg dark:bg-card">
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#0DA2E7] opacity-[0.05] blur-2xl" />

      {/* HEADER */}
      <div className="relative mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-[#0DA2E7] to-[#0B8BC7] rounded-xl p-2 shadow-sm shadow-[#0DA2E7]/30">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              Horas por Cliente
            </h3>
            <p className="text-xs text-muted-foreground">
              {clientData.length} clientes · {totalHours.toFixed(1)}h totales
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="cursor-pointer border-border/40 text-xs transition-colors hover:bg-muted/50"
          onClick={() => navigate("/clients")}
        >
          Ver todos
          <ArrowRight className="ml-1 h-3 w-3" />
        </Badge>
      </div>

      {/* KPIs */}
      <div className="relative mb-4 flex flex-wrap items-center gap-2">
        <KpiChip icon={Clock} label="Total" value={`${totalHours.toFixed(1)}h`} />
        <KpiChip icon={Users} label="Promedio/cliente" value={`${avgHours.toFixed(1)}h`} />
        {topClient && (
          <KpiChip
            icon={Crown}
            label="Líder"
            value={topClient.name}
            accent
          />
        )}
      </div>

      {/* LISTA */}
      <div className="relative space-y-2">
        {clientData.map((client, idx) => {
          const pct = totalHours > 0 ? Math.round((client.hours / totalHours) * 100) : 0;
          const color = clientColors[idx];
          const isHovered = hoveredId === client.id;
          const isFirst = idx === 0;

          return (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.35 }}
              onMouseEnter={() => setHoveredId(client.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => navigate("/clients")}
              className="group relative cursor-pointer overflow-hidden rounded-xl border border-transparent p-3 transition-all duration-200 hover:border-border/50 hover:bg-muted/10 hover:shadow-sm"
            >
              {/* Barra de fondo animada */}
              <motion.div
                className="absolute inset-y-0 left-0 rounded-xl"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ delay: idx * 0.06 + 0.1, duration: 0.7, ease: "easeOut" }}
                style={{ backgroundColor: `${color}12` }}
              />

              <div className="relative flex items-center gap-3">
                {/* Ranking / Avatar */}
                {isFirst ? (
                  <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0DA2E7] to-[#0B8BC7] shadow-md shadow-[#0DA2E7]/20 transition-transform duration-200 group-hover:scale-105">
                    <Crown className="h-5 w-5 text-white" />
                  </div>
                ) : (
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-transform duration-200 group-hover:scale-105"
                    style={{ backgroundColor: `${color}18`, color }}
                  >
                    {getInitials(client.name)}
                  </div>
                )}

                {/* Nombre + proyectos */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{client.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {client.projectCount} {client.projectCount === 1 ? "proyecto" : "proyectos"}
                  </p>
                </div>

                {/* Horas + % */}
                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-base font-bold text-foreground tabular-nums">
                    {client.hours.toFixed(1)}h
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-14 h-1.5 overflow-hidden rounded-full bg-muted/50">
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: idx * 0.06 + 0.2, duration: 0.6, ease: "easeOut" }}
                        style={{ backgroundColor: color }}
                      />
                    </div>
                    <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                      {pct}%
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/30 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-[#0DA2E7]" />
              </div>

              {/* Tooltip flotante */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute -top-11 right-3 z-20 rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-lg"
                  >
                    {client.hours.toFixed(1)}h · {client.projectCount} {client.projectCount === 1 ? "proyecto" : "proyectos"}
                    <span className="ml-1 text-muted-foreground">{pct}%</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function KpiChip({
  icon: Icon,
  label,
  value,
  accent = false,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
        accent
          ? "border-[#0DA2E7]/20 bg-[#0DA2E7]/10 text-[#0DA2E7]"
          : "border-border/30 bg-muted/30 text-muted-foreground"
      }`}
    >
      <Icon className={`h-3.5 w-3.5 ${accent ? "text-[#0DA2E7]" : ""}`} />
      <span className="text-foreground font-medium">{value}</span>
      <span className="hidden text-muted-foreground sm:inline">{label}</span>
    </div>
  );
}
