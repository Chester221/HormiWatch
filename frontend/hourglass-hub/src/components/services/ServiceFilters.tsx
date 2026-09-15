import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  SlidersHorizontal, Check, ChevronDown, LayoutGrid, CheckCircle2, Ban, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ServiceCategoryOption {
  id: string;
  name: string;
}

interface StatusOption {
  value: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  { value: "all", label: "Todos", icon: LayoutGrid, color: "text-muted-foreground" },
  { value: "active", label: "Activos", icon: CheckCircle2, color: "text-emerald-500" },
  { value: "inactive", label: "Inactivos", icon: Ban, color: "text-rose-500" },
];

interface ServiceFiltersProps {
  categories: ServiceCategoryOption[];
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  resultCount: number;
  activeCount: number;
  onClear: () => void;
}

interface FilterRowProps {
  icon?: LucideIcon;
  color?: string;
  label: string;
  isSelected: boolean;
  onSelect: () => void;
}

function FilterRow({ icon: Icon, color, label, isSelected, onSelect }: FilterRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors",
        isSelected
          ? "bg-[#0DA2E7]/10 text-[#0DA2E7]"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        {Icon && (
          <span
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-md",
              isSelected ? "bg-[#0DA2E7]/15" : "bg-muted/40"
            )}
          >
            <Icon className={cn("h-3 w-3", color)} />
          </span>
        )}
        <span className="truncate font-medium">{label}</span>
      </span>
      {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-[#0DA2E7]" />}
    </button>
  );
}

export function ServiceFilters({
  categories, categoryFilter, onCategoryChange,
  statusFilter, onStatusChange, resultCount, activeCount, onClear,
}: ServiceFiltersProps) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-9 shrink-0 gap-2 rounded-lg border-border/60 bg-card px-3 text-xs font-medium text-foreground shadow-sm"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-[#0DA2E7]" />
          Filtros
          {activeCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0DA2E7] px-1 text-[9px] font-bold text-white">
              {activeCount}
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        side="bottom"
        sideOffset={4}
        collisionPadding={12}
        className="w-[240px] max-w-[calc(100vw-1.5rem)] rounded-2xl border-border/60 bg-card p-0 shadow-2xl"
      >
        {/* Cabecera */}
        <div className="flex items-center gap-2.5 border-b border-border/40 px-3 py-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0DA2E7]/10">
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#0DA2E7]" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground">Filtrar servicios</p>
            <p className="text-[10px] text-muted-foreground">
              {resultCount} servicio{resultCount !== 1 ? "s" : ""} encontrados
            </p>
          </div>
        </div>

        {/* Categoría */}
        <div className="p-1.5">
          <p className="px-2 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Categoría
          </p>
          <div className="max-h-36 space-y-0.5 overflow-y-auto px-0.5">
            <FilterRow
              label="Todas las categorías"
              isSelected={categoryFilter === ""}
              onSelect={() => onCategoryChange("")}
            />
            {categories.map((category) => (
              <FilterRow
                key={category.id}
                label={category.name}
                isSelected={categoryFilter === category.id}
                onSelect={() => onCategoryChange(category.id)}
              />
            ))}
          </div>
        </div>

        <div className="border-t border-border/40 p-1.5">
          <p className="px-2 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Estado
          </p>
          <div className="space-y-0.5 px-0.5">
            {STATUS_OPTIONS.map((o) => (
              <FilterRow
                key={o.value}
                icon={o.icon}
                color={o.color}
                label={o.label}
                isSelected={statusFilter === o.value}
                onSelect={() => onStatusChange(o.value)}
              />
            ))}
          </div>
        </div>

        {/* Limpiar filtros */}
        {activeCount > 0 && (
          <div className="flex items-center justify-center border-t border-border/40 p-1.5">
            <button
              type="button"
              onClick={onClear}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <X className="h-3.5 w-3.5" /> Limpiar filtros
            </button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}