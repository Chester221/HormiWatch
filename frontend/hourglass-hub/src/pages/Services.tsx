import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Package, Layers, DollarSign, TrendingUp,
  ChevronLeft, ChevronRight, Grid3x3, Table, Eye, SearchX, Wrench,
} from "lucide-react";
import { motion } from "framer-motion";
import { ServiceFormModal } from "@/components/services/ServiceFormModal";
import { ServiceCard, ServiceActionsMenu, ServiceStatusBadge } from "@/components/services/ServiceCard";
import { ServiceFilters } from "@/components/services/ServiceFilters";
import { ServiceDetailModal } from "@/components/services/ServiceDetailModal";
import { ServiceDeleteDialog } from "@/components/services/ServiceDeleteDialog";
import { getServiceIconVisual, pickServiceColor } from "@/components/services/serviceIcons";
import { useServices, useServiceCategories, useDeleteService, type Service } from "@/hooks/useServices";
import { useAuth } from "@/hooks/useAuth";

export default function Services() {
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">(() => {
    const saved = localStorage.getItem("servicesViewMode");
    return (saved === "grid" || saved === "table") ? saved : "grid";
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [formModal, setFormModal] = useState<{ open: boolean; service: Service | null }>({
    open: false,
    service: null,
  });
  const [detailService, setDetailService] = useState<Service | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();

  const { profile } = useAuth();
  const userRole = profile?.role;
  const isManager = userRole === "Manager" || userRole === "Admin";
  const canEdit = isManager;
  const canCreate = isManager;

  const { data: services = [], isLoading } = useServices(undefined, true);
  const { data: categories = [] } = useServiceCategories();
  const deleteServiceMutation = useDeleteService();

  const activeFilterCount =
    (categoryFilter !== "" ? 1 : 0) + (statusFilter !== "all" ? 1 : 0);

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const categoryId = s.categories?.id || s.category?.id || "";
      const categoryName = s.categories?.name || s.category?.name || "Sin categoría";
      const matchesCategory =
        categoryFilter === "" ||
        categoryId === categoryFilter ||
        categoryName === (categories.find((c) => c.id === categoryFilter)?.name ?? "");
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && s.is_active !== false) ||
        (statusFilter === "inactive" && s.is_active === false);
      return matchesCategory && matchesStatus;
    });
  }, [services, categories, categoryFilter, statusFilter]);

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentServices = filteredServices.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.max(1, Math.ceil(filteredServices.length / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const stats = {
    total: services.length,
    categories: new Set(services.map((s) => s.categories?.name || s.category?.name || "Sin categoría")).size,
    avgRate:
      services.length > 0
        ? Math.round(
            services.reduce((sum, s) => sum + (Number(s.hourlyRate) || Number(s.default_hourly_rate) || 0), 0) / services.length
          )
        : 0,
    active: services.filter((s) => s.is_active !== false).length,
  };

  const handleAdd = () => {
    if (!canCreate) return;
    setFormModal({ open: true, service: null });
  };

  const handleEdit = (service: Service) => {
    if (!canEdit) return;
    setDetailService(null);
    setFormModal({ open: true, service });
  };

  const handleView = (service: Service) => setDetailService(service);

  // Abrir el detalle de un servicio desde la búsqueda global (?service=id)
  useEffect(() => {
    const serviceId = searchParams.get("service");
    if (!serviceId) return;
    const target = services.find((s: Service) => String(s.id) === serviceId);
    if (target) setDetailService(target);
    setSearchParams({}, { replace: true });
  }, [searchParams, services]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeleteRequest = (service: Service) => {
    setDetailService(null);
    setServiceToDelete(service);
  };

  const handleDeleteConfirm = (service: Service) => {
    deleteServiceMutation.mutate(service.id, {
      onSuccess: () => setServiceToDelete(null),
    });
  };

  const handleModalClose = (open: boolean) => {
    setFormModal((prev) => ({ ...prev, open }));
  };

  const clearFilters = () => {
    setCategoryFilter("");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const switchView = (mode: "grid" | "table") => {
    setViewMode(mode);
    localStorage.setItem("servicesViewMode", mode);
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
                    {stats.total} servicio{stats.total !== 1 ? "s" : ""}
                  </Badge>
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0DA2E7]" />
                  Aquí podrás gestionar los servicios que ofreces a tus clientes
                </p>
              </div>
            </div>
            {canCreate && (
<Button
                 onClick={handleAdd}
                 className="gap-2 self-start sm:self-auto text-white shadow-md hover:shadow-lg transition-all bg-[#0DA2E7] hover:bg-[#0B8BC7]"
               >
                 <Plus className="h-4 w-4" /> Nuevo Servicio
              </Button>
            )}
          </div>
        </div>

        {/* ========== KPI CARDS ========== */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Package, label: "Total Servicios", value: stats.total, sub: `${stats.categories} categorías` },
            { icon: Layers, label: "Categorías", value: stats.categories, sub: "tipos de servicio" },
            { icon: DollarSign, label: "Tarifa Promedio", value: `$${stats.avgRate}`, sub: "por hora" },
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
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <ServiceFilters
              categories={categories}
              categoryFilter={categoryFilter}
              onCategoryChange={(v) => { setCategoryFilter(v); setCurrentPage(1); }}
              statusFilter={statusFilter}
              onStatusChange={(v) => { setStatusFilter(v as "all" | "active" | "inactive"); setCurrentPage(1); }}
              resultCount={filteredServices.length}
              activeCount={activeFilterCount}
              onClear={clearFilters}
            />
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {filteredServices.length} de {services.length} servicios
            </span>
          </div>

          {/* Toggle de vista */}
          <div className="flex shrink-0 items-center gap-0.5 self-start rounded-lg border border-border/30 bg-card/50 p-0.5 shadow-sm md:self-auto">
            <button
              type="button"
              onClick={() => switchView("grid")}
              title="Vista de tarjetas"
              className={`flex h-8 w-8 items-center justify-center rounded-md transition-all duration-200 ${
                viewMode === "grid"
                  ? "bg-[#0DA2E7]/10 text-[#0DA2E7] shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => switchView("table")}
              title="Vista de tabla"
              className={`flex h-8 w-8 items-center justify-center rounded-md transition-all duration-200 ${
                viewMode === "table"
                  ? "bg-[#0DA2E7]/10 text-[#0DA2E7] shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <Table className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ========== LISTA DE SERVICIOS ========== */}
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          {services.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/50 bg-card/50 py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0DA2E7]/10">
                <Package className="h-7 w-7 text-[#0DA2E7]" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Todavía no hay servicios</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Crea tu primer servicio para comenzar a gestionar tu catálogo.
                </p>
              </div>
              {canCreate && (
                <Button
                  onClick={handleAdd}
                  className="mt-1 gap-2 rounded-lg bg-[#0DA2E7] px-4 text-xs font-semibold text-white hover:bg-[#0B91D2]"
                >
                  <Plus className="h-4 w-4" /> Crear servicio
                </Button>
              )}
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/50 bg-card/50 py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60">
                <SearchX className="h-7 w-7 text-muted-foreground" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Sin resultados</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Ningún servicio coincide con los filtros seleccionados.
                </p>
              </div>
              <Button
                onClick={clearFilters}
                className="mt-1 rounded-lg border border-border/60 px-4 text-xs font-medium"
                variant="outline"
              >
                Limpiar filtros
              </Button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {currentServices.map((service, idx) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.22, ease: "easeOut" }}
                >
                  <ServiceCard
                    service={service}
                    canEdit={canEdit}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDeleteRequest}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border/30 bg-card/50 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border/30 bg-muted/20">
                    <tr>
                      <th className="p-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Servicio</th>
                      <th className="p-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Categoría</th>
                      <th className="p-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Tarifa</th>
                      <th className="p-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Estado</th>
                      <th className="p-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentServices.map((service) => {
                      const serviceIcon = getServiceIconVisual(service.icon);
                      const visual = serviceIcon || { icon: Wrench, color: "#0DA2E7" };
                      const Icon = visual.icon;
                      const color = service.color ?? pickServiceColor(service.name);
                      const categoryName = service.categories?.name || service.category?.name || "Sin categoría";

                      return (
                        <tr
                          key={service.id}
                          onClick={() => handleView(service)}
                          className="group cursor-pointer border-b border-border/20 transition-colors hover:bg-[#0DA2E7]/[0.03]"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <span
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                                style={{ backgroundColor: `${color}15`, color }}
                              >
                                <Icon className="h-4 w-4" />
                              </span>
                              <div className="min-w-0">
                                <p className="truncate font-medium text-foreground">{service.name}</p>
                                <p className="line-clamp-1 max-w-[200px] text-[10px] text-muted-foreground">
                                  {service.description || "Sin descripción"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span
                              className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium"
                              style={{ backgroundColor: `${color}14`, color: `${color}CC` }}
                            >
                              {categoryName}
                            </span>
                          </td>
                          <td className="p-4 text-center font-semibold text-emerald-600">
                            ${Number(service.hourlyRate ?? service.default_hourly_rate ?? 0).toFixed(2)}
                            <span className="ml-0.5 text-[9px] font-normal text-muted-foreground">/h</span>
                          </td>
                          <td className="p-4 text-center">
                            <ServiceStatusBadge active={service.is_active !== false} />
                          </td>
                          <td className="p-4 text-right">
                            {canEdit ? (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  title="Ver detalle"
                                  onClick={(e) => { e.stopPropagation(); handleView(service); }}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-[#0DA2E7]/10 hover:text-[#0DA2E7]"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                                <ServiceActionsMenu service={service} onEdit={handleEdit} onDelete={handleDeleteRequest} />
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleView(service); }}
                                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-[#0DA2E7] transition-colors hover:bg-[#0DA2E7]/10"
                              >
                                <Eye className="h-3.5 w-3.5" /> Ver
                              </button>
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
        {totalPages > 1 && filteredServices.length > 0 && (
          <div className="mt-2 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[60px] text-center text-xs text-muted-foreground">
              Pág. {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* ========== MODALES ========== */}
      <ServiceFormModal open={formModal.open} onOpenChange={handleModalClose} service={formModal.service} />

      <ServiceDetailModal
        open={Boolean(detailService)}
        service={detailService}
        onOpenChange={(open) => { if (!open) setDetailService(null); }}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
      />

      <ServiceDeleteDialog
        open={Boolean(serviceToDelete)}
        service={serviceToDelete}
        onOpenChange={(open) => { if (!open) setServiceToDelete(null); }}
        onConfirm={handleDeleteConfirm}
        isPending={deleteServiceMutation.isPending}
      />
    </DashboardLayout>
  );
}