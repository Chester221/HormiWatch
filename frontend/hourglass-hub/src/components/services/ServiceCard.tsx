import type React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ArrowRight, MoreHorizontal, Pencil, Trash2, DollarSign, Wrench } from "lucide-react";
import type { Service } from "@/hooks/useServices";
import { cn } from "@/lib/utils";
import { getServiceIconVisual, formatRate, pickServiceColor } from "./serviceIcons";

export function ServiceStatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
        active
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
          : "bg-muted text-muted-foreground ring-border"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-emerald-500" : "bg-muted-foreground")} />
      {active ? "Activo" : "Inactivo"}
    </span>
  );
}

interface ServiceActionsMenuProps {
  service: Service;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
}

export function ServiceActionsMenu({ service, onEdit, onDelete }: ServiceActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        onClick={(e) => e.stopPropagation()}
        className="w-40 rounded-xl border-border/60 bg-card p-1 shadow-xl"
      >
        <DropdownMenuItem
          onSelect={() => onEdit(service)}
          onClick={(e) => e.stopPropagation()}
          className="rounded-lg text-xs"
        >
          <Pencil className="h-3.5 w-3.5 text-[#0DA2E7]" /> Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => onDelete(service)}
          onClick={(e) => e.stopPropagation()}
          className="rounded-lg text-xs text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5" /> Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface ServiceCardProps {
  service: Service;
  onView: (service: Service) => void;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
  canEdit?: boolean;
}

export function ServiceCard({ service, onView, onEdit, onDelete, canEdit = false }: ServiceCardProps) {
  const serviceIcon = getServiceIconVisual(service.icon);
  const visual = serviceIcon || { icon: Wrench, color: "#0DA2E7" };
  const Icon = visual.icon;
  const color = service.color ?? pickServiceColor(service.name);
  const categoryName = service.categories?.name || service.category?.name || "Sin categoría";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onView(service)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onView(service);
        }
      }}
      className={cn(
        "group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#0DA2E7]/10 bg-card transition-all duration-300",
        "hover:-translate-y-1 hover:border-[#0DA2E7]/40 hover:shadow-lg hover:shadow-[#0DA2E7]/10"
      )}
    >
      {/* Círculo decorativo */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#0DA2E7] opacity-[0.06] transition-transform duration-500 group-hover:scale-150" />

      {/* Línea superior de acento */}
      <span
        className="absolute inset-x-0 top-0 h-0.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ backgroundColor: `${color}66` }}
      />

      <div className="flex flex-1 flex-col gap-3 p-5">
        {/* Cabecera */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${color}1A`, color }}
            >
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-[#0DA2E7]">
                {service.name}
              </h3>
              <span
                className="mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{ backgroundColor: `${color}14`, color: `${color}CC` }}
              >
                {categoryName}
              </span>
            </div>
          </div>
          <ServiceStatusBadge active={service.is_active !== false} />
        </div>

        {/* Descripción */}
        <p className="line-clamp-2 flex-1 text-xs leading-relaxed text-muted-foreground">
          {service.description || "Sin descripción."}
        </p>

        {/* Pie */}
        <div className="flex items-center justify-between border-t border-border/50 pt-3">
          <div className="flex items-baseline gap-1">
            <DollarSign className="h-3.5 w-3.5 translate-y-[1px] text-emerald-500" />
            <span className="text-sm font-bold text-emerald-600">
              {formatRate(service.hourlyRate ?? service.default_hourly_rate)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors group-hover:text-[#0DA2E7]">
              Ver detalle
              <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
            </span>
            {canEdit && <ServiceActionsMenu service={service} onEdit={onEdit} onDelete={onDelete} />}
          </div>
        </div>
      </div>

      {/* Barra inferior */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#0DA2E7]/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </div>
  );
}