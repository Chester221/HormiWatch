import type React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  X, Pencil, Trash2, Calendar, UserRound, FolderKanban,
} from "lucide-react";
import type { Service } from "@/hooks/useServices";
import { cn } from "@/lib/utils";
import { getServiceIconVisual, pickServiceColor } from "./serviceIcons";
import { ServiceStatusBadge } from "./ServiceCard";

interface ServiceDetailModalProps {
  open: boolean;
  service: Service | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0DA2E7]/10 text-[#0DA2E7]">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{label}</p>
        <div className="mt-0.5 text-sm font-medium text-foreground">{children}</div>
      </div>
    </div>
  );
}

export function ServiceDetailModal({
  open, service, onOpenChange, onEdit, onDelete,
}: ServiceDetailModalProps) {
  if (!service) return null;

  const serviceIcon = getServiceIconVisual(service.icon);
  const visual = serviceIcon || { icon: Wrench, color: "#0DA2E7" };
  const Icon = visual.icon;
  const color = service.color ?? pickServiceColor(service.name);
  const categoryName = service.categories?.name || service.category?.name || "Sin categoría";

  const createdAt = service.created_at_iso || service.created_at || service.createdAt
    ? new Date(service.created_at_iso || service.created_at || service.createdAt || "").toLocaleDateString("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Fecha no disponible";

  const creatorName = service.createdBy?.name || service.createdBy?.email || "Desconocido";
  const hourlyRateValue = Number(service.hourlyRate ?? service.default_hourly_rate ?? 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideCloseButton className="max-w-md gap-0 overflow-hidden rounded-2xl border-border/60 bg-card p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Detalle del servicio</DialogTitle>
          <DialogDescription>Información del servicio seleccionado</DialogDescription>
        </DialogHeader>

        {/* Cabecera */}
        <div className="bg-gradient-to-r from-[#0DA2E7]/10 via-[#0DA2E7]/5 to-transparent px-6 pb-5 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
                style={{ backgroundColor: `${color}1A`, color, boxShadow: `0 0 0 4px ${color}10` }}
              >
                <Icon className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <h2 className="text-lg font-bold leading-tight text-foreground">{service.name}</h2>
                <span
                  className="mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{ backgroundColor: `${color}14`, color: `${color}CC` }}
                >
                  {categoryName}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <ServiceStatusBadge active={service.is_active !== false} />
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                title="Cerrar"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-card/70 text-muted-foreground shadow-sm transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Cuerpo */}
        <div className="px-6 py-5">
          {/* Tarifa destacada */}
          <div className="rounded-xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 to-transparent p-4 dark:border-emerald-500/20">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700/70">
              Tarifa por hora
            </p>
            <p className="mt-1 flex items-baseline gap-1 text-3xl font-bold text-emerald-600">
              ${hourlyRateValue.toLocaleString("es-MX")}
              <span className="text-sm font-medium text-emerald-500">/h</span>
            </p>
          </div>

          {/* Categoría */}
          <div className="mt-4 flex items-center justify-between gap-3 border-b border-border/40 pb-4">
            <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              <FolderKanban className="h-3.5 w-3.5 text-[#0DA2E7]" />
              Categoría
            </span>
            <span
              className="inline-flex max-w-[60%] items-center truncate rounded-full px-3 py-1 text-xs font-medium"
              style={{ backgroundColor: `${color}14`, color: `${color}CC` }}
            >
              {categoryName}
            </span>
          </div>

          {/* Descripción */}
          <div className="mt-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Descripción
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {service.description || "Sin descripción registrada."}
            </p>
          </div>

          {/* Creador */}
          <div className="mt-4 border-t border-border/40 pt-4">
            <InfoRow icon={UserRound} label="Registrado por">
              <span className="text-sm">{creatorName}</span>
            </InfoRow>
          </div>

          {/* Fecha de creación */}
          <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3.5 py-3">
            <span className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground/70" />
              Fecha de creación
            </span>
            <span className="text-xs font-medium capitalize text-foreground">{createdAt}</span>
          </div>
        </div>

        {/* Pie */}
        <div
          className={cn(
            "flex items-center justify-between gap-2 border-t border-border/50 bg-muted/20 px-6 py-4"
          )}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(service)}
            className="h-9 gap-1.5 rounded-lg px-3 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" /> Eliminar
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-9 rounded-lg border-border/60 px-3 text-xs font-medium"
            >
              Cerrar
            </Button>
            <Button
              size="sm"
              onClick={() => onEdit(service)}
              className="h-9 gap-1.5 rounded-lg bg-[#0DA2E7] px-3 text-xs font-semibold text-white hover:bg-[#0B91D2]"
            >
              <Pencil className="h-3.5 w-3.5" /> Editar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}