import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Wrench,
  ArrowRight,
  Clock,
  Layers,
  Code,
  Shield,
  Database,
  Cloud,
  Settings,
  Zap,
  BarChart3,
  Mail,
  Users,
  FileText,
  Briefcase,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ServicesUsageProps {
  tasks: any[];
  services: any[];
  projects: any[];
}

// ============================================
// MAPA DE ICONOS POR CATEGORÍA
// ============================================

const categoryIcons: Record<string, any> = {
  "Desarrollo": Code,
  "Desarrollo de software": Code,
  "Evaluación": Shield,
  "Mantenimiento": Settings,
  "Integración": Cloud,
  "Datos": Database,
  "Análisis": BarChart3,
  "Consultoría": Briefcase,
  "Diseño": FileText,
  "Seguridad": Shield,
  "Infraestructura": Cloud,
  "Comunicación": Mail,
  "Gestión": Users,
  "Inteligencia": Zap,
  "Inteligencia Artificial": Zap,
  "IA": Zap,
  "Ciberseguridad": Shield,
  "Testing": Shield,
  "Implementación": Cloud,
};

const getServiceIcon = (serviceName: string, categoryName?: string) => {
  if (categoryName && categoryIcons[categoryName]) {
    return categoryIcons[categoryName];
  }
  for (const [key, icon] of Object.entries(categoryIcons)) {
    if (serviceName.toLowerCase().includes(key.toLowerCase())) {
      return icon;
    }
  }
  return Wrench;
};

// ============================================
// PALETA DE COLORES MEJORADA
// ============================================

const SERVICE_COLORS = [
  { main: "#8B5CF6", light: "#8B5CF610", border: "#8B5CF630", bg: "#8B5CF608" },
  { main: "#0DA2E7", light: "#0DA2E710", border: "#0DA2E730", bg: "#0DA2E708" },
  { main: "#10B981", light: "#10B98110", border: "#10B98130", bg: "#10B98108" },
  { main: "#F59E0B", light: "#F59E0B10", border: "#F59E0B30", bg: "#F59E0B08" },
  { main: "#EF4444", light: "#EF444410", border: "#EF444430", bg: "#EF444408" },
  { main: "#EC4899", light: "#EC489910", border: "#EC489930", bg: "#EC489908" },
];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function ServicesUsage({ tasks = [], services = [], projects = [] }: ServicesUsageProps) {
  const navigate = useNavigate();

  // ============================================
  // CÁLCULO DE DATOS
  // ============================================

  const serviceMap: Record<
    string,
    { name: string; count: number; hours: number; categoryName?: string }
  > = {};

  tasks.forEach((task: any) => {
    const service = services.find((s: any) => s.id === task.service_id);
    if (!service) return;
    if (!serviceMap[service.id]) {
      serviceMap[service.id] = {
        name: service.name,
        count: 0,
        hours: 0,
        categoryName: service.categories?.name,
      };
    }
    serviceMap[service.id].count += 1;
    const h = task.duration_in_minutes ? task.duration_in_minutes / 60 : 0;
    serviceMap[service.id].hours += h;
  });

  const data = Object.values(serviceMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const totalTasks = data.reduce((acc, d) => acc + d.count, 0);
  const totalHours = data.reduce((acc, d) => acc + d.hours, 0);

  // ============================================
  // ESTADO VACÍO
  // ============================================

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border/40 bg-white dark:bg-card p-6 shadow-sm text-center">
        <div className="flex flex-col items-center justify-center py-6">
          <div className="h-14 w-14 rounded-full bg-muted/30 flex items-center justify-center mb-4">
            <Wrench className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <p className="text-base font-medium text-foreground">Sin servicios registrados</p>
          <p className="text-sm text-muted-foreground mt-1">
            No hay tareas asociadas a servicios
          </p>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER PRINCIPAL - GRID DE TARJETAS MEJORADO
  // ============================================

  return (
    <div
      className="rounded-xl border border-border/40 bg-white dark:bg-card p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
      onClick={() => navigate("/services")}
    >
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#8B5CF6]/10">
            <Wrench className="h-4 w-4 text-[#8B5CF6]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Servicios Más Usados
            </h3>
            <p className="text-[10px] text-muted-foreground">
              {totalTasks} tareas · {totalHours.toFixed(1)}h totales
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] border-border/40">
            Top {data.length}
          </Badge>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-[#8B5CF6] group-hover:translate-x-0.5 transition-all duration-200" />
        </div>
      </div>

      {/* ═══ GRID DE TARJETAS MEJORADO ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {data.map((item, idx) => {
          const color = SERVICE_COLORS[idx % SERVICE_COLORS.length];
          const Icon = getServiceIcon(item.name, item.categoryName);
          const usagePercentage = totalTasks > 0 ? Math.round((item.count / totalTasks) * 100) : 0;

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.04 }}
              className="group/card relative p-3.5 rounded-xl border-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              style={{
                backgroundColor: color.bg,
                borderColor: color.border,
              }}
            >
              {/* Icono y nombre */}
              <div className="flex items-center gap-2.5 mb-2">
                <div 
                  className="p-1.5 rounded-lg transition-all duration-200 group-hover/card:scale-110"
                  style={{ backgroundColor: color.light }}
                >
                  <Icon className="h-4 w-4" style={{ color: color.main }} />
                </div>
                <span className="text-xs font-semibold text-foreground truncate flex-1">
                  {item.name}
                </span>
              </div>

              {/* Métricas principales */}
              <div className="flex items-end justify-between">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-foreground">
                      {item.count}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      tareas
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {item.hours.toFixed(1)}h
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] px-2 py-0.5 font-semibold border-2"
                  style={{
                    backgroundColor: color.light,
                    borderColor: color.border,
                    color: color.main,
                  }}
                >
                  {usagePercentage}%
                </Badge>
              </div>

              {/* Barra decorativa con gradiente */}
              <div className="mt-2.5 h-1 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out group-hover/card:opacity-100"
                  style={{
                    width: `${Math.max(usagePercentage, 2)}%`,
                    background: `linear-gradient(90deg, ${color.main}80, ${color.main})`,
                    opacity: 0.7,
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}