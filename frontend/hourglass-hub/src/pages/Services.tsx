import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Pencil,
  Trash2,
  Layers,
  Wrench,
  DollarSign,
  Loader2,
  FileText,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Package,
  TrendingUp,
  Table,
  Grid3x3,
} from "lucide-react";
import { ServiceFormModal } from "@/components/services/ServiceFormModal";
import { useServices, useDeleteService, type Service } from "@/hooks/useServices";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

const HORMI_BLUE = "#0DA2E7";

// ============================================
// MAPA DE ICONOS Y COLORES POR CATEGORÍA
// ============================================
const categoryIcons: Record<string, any> = {
  "Desarrollo": Layers,
  "Evaluación": FileText,
  "Mantenimiento": Wrench,
  "Integración Bancaria": DollarSign,
  "Análisis de Datos": TrendingUp,
  "Infraestructura": Package,
  "Diseño": Grid3x3,
  "Consultoría": Filter,
  "Consulta": ChevronRight,
  "Sin categoría": Package,
};

const categoryColors: Record<string, string> = {
  "Desarrollo": "#3B82F6",
  "Evaluación": "#8B5CF6",
  "Mantenimiento": "#F59E0B",
  "Integración Bancaria": "#10B981",
  "Análisis de Datos": "#06B6D4",
  "Infraestructura": "#6366F1",
  "Diseño": "#EC4899",
  "Consultoría": "#F97316",
  "Consulta": "#14B8A6",
  "Sin categoría": "#6B7280",
};

export default function Services() {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">(() => {
    const saved = localStorage.getItem("servicesViewMode");
    return (saved === "grid" || saved === "table") ? saved : "grid";
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [formModal, setFormModal] = useState<{
    open: boolean;
    service: Service | null;
  }>({
    open: false,
    service: null,
  });

  const { profile } = useAuth();
  const userRole = profile?.role;
  const isManager = userRole === "Manager" || userRole === "Admin";
  const canEdit = isManager;
  const canCreate = isManager;

  const { data: services = [], isLoading, refetch } = useServices();
  const deleteServiceMutation = useDeleteService();

  const uniqueCategories = [
    ...new Set(services.map((s) => s.categories?.name || "Sin categoría")),
  ];

  const filteredServices = services.filter((s) => {
    const matchesCategory =
      categoryFilter === "all" ||
      (s.categories?.name || "Sin categoría") === categoryFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && s.is_active === true) ||
      (statusFilter === "inactive" && s.is_active === false);
    return matchesCategory && matchesStatus;
  });

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentServices = filteredServices.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);

  const stats = {
    total: services.length,
    categories: uniqueCategories.length,
    avgRate:
      services.length > 0
        ? Math.round(
            services.reduce((sum, s) => sum + (s.default_hourly_rate || 0), 0) /
              services.length
          )
        : 0,
    active: services.filter((s) => s.is_active === true).length,
  };

  const handleEdit = (service: Service) => {
    if (!canEdit) return;
    setFormModal({ open: true, service });
  };
  const handleAdd = () => {
    if (!canCreate) return;
    setFormModal({ open: true, service: null });
  };

  const handleDelete = async (service: Service) => {
    if (!service) return;
    if (!confirm(`¿Eliminar "${service.name}"?`)) return;
    try {
      await deleteServiceMutation.mutateAsync(service.id);
      toast.success(`"${service.name}" eliminado`);
      refetch();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  const handleModalClose = (open: boolean) => {
    setFormModal((prev) => ({ ...prev, open }));
    if (!open) refetch();
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
            <div className="h-9 w-36 bg-muted rounded-lg animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ========== HEADER ========== */}
        <div className="relative overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-br from-card via-card to-[#0DA2E7]/3 p-6 shadow-sm">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#0DA2E7]/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#0DA2E7]/5 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0DA2E7] to-[#0B8BC7] shadow-lg shadow-[#0DA2E7]/20">
                <Package className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                  <span className="bg-gradient-to-r from-[#0DA2E7] to-[#0B8BC7] bg-clip-text text-transparent">
                    Servicios
                  </span>
                  <Badge className="bg-[#0DA2E7]/20 text-[#0DA2E7] border-none text-xs font-medium px-3 py-0.5 rounded-full">
                    {stats.total} servicios
                  </Badge>
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0DA2E7]" />
                  Gestiona los servicios que ofreces a tus clientes
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {canCreate && (
                <Button
                  onClick={handleAdd}
                  className="gap-2 text-white shadow-md hover:shadow-lg transition-all bg-gradient-to-r from-[#0DA2E7] to-[#0B8BC7] hover:from-[#0B8BC7] hover:to-[#0DA2E7]"
                >
                  <Plus className="h-4 w-4" /> Nuevo Servicio
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ========== KPI CARDS ========== */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Package, label: "Total Servicios", value: stats.total, sub: `${stats.categories} categorías` },
            { icon: Layers, label: "Categorías", value: stats.categories, sub: "tipos de servicio" },
            { icon: DollarSign, label: "Tarifa Promedio", value: `$${stats.avgRate}/hr`, sub: "por hora" },
            { icon: TrendingUp, label: "Servicios Activos", value: stats.active, sub: `${services.length - stats.active} inactivos` },
          ].map((metric, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group relative overflow-hidden rounded-xl border border-border/30 bg-card/80 p-5 shadow-sm hover:shadow-md hover:border-[#0DA2E7]/20 transition-all duration-300"
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#0DA2E7] opacity-[0.04] transition-transform duration-500 group-hover:scale-150" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{metric.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1.5">{metric.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{metric.sub}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0DA2E7]/10 transition-transform duration-300 group-hover:scale-105">
                  <metric.icon className="h-5 w-5 text-[#0DA2E7]" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ========== BARRA DE HERRAMIENTAS ========== */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1" />
          <div className="flex items-center gap-1 rounded-lg border border-border/30 bg-card/50 p-1 shadow-sm backdrop-blur-sm">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="relative h-8 w-8 p-0 rounded-md hover:bg-[#0DA2E7]/10 hover:text-[#0DA2E7] transition-all duration-200"
                >
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  {(statusFilter !== "all" || categoryFilter !== "all") && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#0DA2E7] ring-2 ring-background" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-card border-border shadow-xl rounded-xl p-3">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Categoría
                    </label>
                    <Select
                      value={categoryFilter}
                      onValueChange={(v) => { setCategoryFilter(v); setCurrentPage(1); }}
                    >
                      <SelectTrigger className="h-8 text-xs bg-muted/20 border-border/50 w-full">
                        <SelectValue placeholder="Todas las categorías" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las categorías</SelectItem>
                        {uniqueCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Estado
                    </label>
                    <div className="flex gap-1 bg-muted/20 rounded-lg p-0.5">
                      <button
                        onClick={() => { setStatusFilter("all"); setCurrentPage(1); }}
                        className={`flex-1 h-7 text-xs rounded-md transition-all duration-200 ${
                          statusFilter === "all" 
                            ? "bg-[#0DA2E7] text-white shadow-sm shadow-[#0DA2E7]/20" 
                            : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Todos
                      </button>
                      <button
                        onClick={() => { setStatusFilter("active"); setCurrentPage(1); }}
                        className={`flex-1 h-7 text-xs rounded-md transition-all duration-200 flex items-center justify-center gap-1 ${
                          statusFilter === "active" 
                            ? "bg-[#0DA2E7] text-white shadow-sm shadow-[#0DA2E7]/20" 
                            : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${statusFilter === "active" ? "bg-white" : "bg-emerald-500"}`} />
                        Activos
                      </button>
                      <button
                        onClick={() => { setStatusFilter("inactive"); setCurrentPage(1); }}
                        className={`flex-1 h-7 text-xs rounded-md transition-all duration-200 flex items-center justify-center gap-1 ${
                          statusFilter === "inactive" 
                            ? "bg-[#0DA2E7] text-white shadow-sm shadow-[#0DA2E7]/20" 
                            : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${statusFilter === "inactive" ? "bg-white" : "bg-red-400"}`} />
                        Inactivos
                      </button>
                    </div>
                  </div>

                  {(statusFilter !== "all" || categoryFilter !== "all") && (
                    <div className="pt-1 border-t border-border/30">
                      <button
                        onClick={() => { setStatusFilter("all"); setCategoryFilter("all"); setCurrentPage(1); }}
                        className="text-[10px] text-muted-foreground hover:text-[#0DA2E7] transition-colors w-full text-center"
                      >
                        Limpiar filtros
                      </button>
                    </div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="h-6 w-px bg-border/50" />
            <span className="text-xs text-muted-foreground whitespace-nowrap px-1.5">
              {filteredServices.length}
            </span>
            <div className="h-6 w-px bg-border/50" />

            <button
              onClick={() => {
                const newMode = viewMode === "grid" ? "table" : "grid";
                setViewMode(newMode);
                localStorage.setItem("servicesViewMode", newMode);
              }}
              className="relative h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-[#0DA2E7]/10 transition-all duration-200"
            >
              <motion.div
                key={viewMode}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                {viewMode === "grid" ? (
                  <Table className="h-4 w-4" />
                ) : (
                  <Grid3x3 className="h-4 w-4" />
                )}
              </motion.div>
            </button>
          </div>
        </div>

        {/* ========== LISTA DE SERVICIOS ========== */}
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {currentServices.length === 0 ? (
            <div className="text-center py-16 rounded-xl border border-dashed border-border/50 bg-card/50">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-sm text-muted-foreground">No se encontraron servicios</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="wait">
                {currentServices.map((service, idx) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    idx={idx}
                    canEdit={canEdit}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="rounded-xl border border-border/30 bg-card/50 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/20 border-b border-border/30">
                    <tr>
                      <th className="text-left p-4 font-medium text-xs text-muted-foreground uppercase tracking-wider">Servicio</th>
                      <th className="text-left p-4 font-medium text-xs text-muted-foreground uppercase tracking-wider">Categoría</th>
                      <th className="text-center p-4 font-medium text-xs text-muted-foreground uppercase tracking-wider">Tarifa</th>
                      <th className="text-center p-4 font-medium text-xs text-muted-foreground uppercase tracking-wider">Estado</th>
                      <th className="text-right p-4 font-medium text-xs text-muted-foreground uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentServices.map((service) => {
                      const categoryName = service.categories?.name || "Sin categoría";
                      const Icon = categoryIcons[categoryName] || Package;
                      const color = categoryColors[categoryName] || "#6B7280";

                      return (
                        <tr key={service.id} className="border-b border-border/20 hover:bg-muted/5 transition-colors group">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: `${color}15` }}
                              >
                                <Icon className="h-4 w-4" style={{ color }} />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{service.name}</p>
                                <p className="text-[10px] text-muted-foreground line-clamp-1 max-w-[200px]">
                                  {service.description || "Sin descripción"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge
                              variant="outline"
                              className="text-[10px] px-2 py-0 bg-muted/30 border-border/50"
                            >
                              {categoryName}
                            </Badge>
                          </td>
                          <td className="p-4 text-center font-semibold text-emerald-600">
                            ${service.default_hourly_rate?.toFixed(2) || "0.00"}
                            <span className="text-[9px] text-muted-foreground font-normal ml-0.5">/hr</span>
                          </td>
                          <td className="p-4 text-center">
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-2 py-0 ${
                                service.is_active
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                                  : "bg-red-500/10 text-red-600 border-red-200"
                              }`}
                            >
                              {service.is_active ? "Activo" : "Inactivo"}
                            </Badge>
                          </td>
                          <td className="p-4 text-right">
                            {canEdit && (
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 hover:bg-[#0DA2E7]/10 hover:text-[#0DA2E7] rounded-lg"
                                  onClick={() => handleEdit(service)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-500 rounded-lg"
                                  onClick={() => handleDelete(service)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>

        {/* ========== PAGINACIÓN ========== */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground min-w-[60px] text-center">Pág. {currentPage} de {totalPages}</span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <ServiceFormModal open={formModal.open} onOpenChange={handleModalClose} service={formModal.service} />
    </DashboardLayout>
  );
}

// ============================================
// COMPONENTE ServiceCard
// ============================================
function ServiceCard({
  service,
  idx,
  canEdit,
  onEdit,
  onDelete,
}: {
  service: Service;
  idx: number;
  canEdit: boolean;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
}) {
  const categoryName = service.categories?.name || "Sin categoría";
  const Icon = categoryIcons[categoryName] || Package;
  const color = categoryColors[categoryName] || "#6B7280";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ delay: idx * 0.03, duration: 0.2 }}
      whileHover={{ y: -3 }}
      className="group relative rounded-xl border border-border/30 bg-card p-4 shadow-sm hover:shadow-md hover:border-[#0DA2E7]/30 transition-all duration-300"
    >
      <div className="flex items-start gap-3">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-105"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground group-hover:text-[#0DA2E7] transition-colors truncate">
            {service.name}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-muted-foreground truncate">{categoryName}</span>
            <Badge
              variant="outline"
              className={`text-[8px] px-1.5 py-0 h-4 ${
                service.is_active
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                  : "bg-red-500/10 text-red-600 border-red-200"
              }`}
            >
              {service.is_active ? "Activo" : "Inactivo"}
            </Badge>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground/70 line-clamp-2 mt-2 min-h-[32px]">
        {service.description || "Sin descripción"}
      </p>

      <div className="flex items-center justify-between pt-2 mt-2 border-t border-border/20">
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-bold text-emerald-600">
            ${service.default_hourly_rate?.toFixed(2) || "0.00"}
          </span>
          <span className="text-[9px] text-muted-foreground">/hr</span>
        </div>

        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 rounded-full hover:bg-[#0DA2E7]/10 hover:text-[#0DA2E7] transition-all duration-200"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32 bg-card border-border shadow-lg rounded-lg p-1">
              <DropdownMenuItem
                className="flex items-center gap-2 text-[11px] cursor-pointer hover:bg-[#0DA2E7]/10 hover:text-[#0DA2E7] rounded-md px-2 py-1.5 transition-all duration-200"
                onClick={() => onEdit(service)}
              >
                <Pencil className="h-3 w-3" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2 text-[11px] cursor-pointer hover:bg-red-50 hover:text-red-500 rounded-md px-2 py-1.5 transition-all duration-200"
                onClick={() => onDelete(service)}
              >
                <Trash2 className="h-3 w-3" /> Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </motion.div>
  );
}