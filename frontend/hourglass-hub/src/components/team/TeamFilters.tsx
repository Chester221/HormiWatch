import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  SlidersHorizontal, Check, ChevronDown, Users, CheckCircle, Ban, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TeamFilterOption {
  value: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

interface TeamFiltersProps {
  roleOptions: TeamFilterOption[];
  roleFilter: string;
  onRoleChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  resultCount: number;
  activeCount: number;
  onClear: () => void;
  title?: string;
  resultLabel?: string;
}

const STATUS_OPTIONS: TeamFilterOption[] = [
  { value: "all", label: "Todos", icon: Users, color: "text-muted-foreground" },
  { value: "active", label: "Activos", icon: CheckCircle, color: "text-emerald-500" },
  { value: "suspended", label: "Suspendidos", icon: Ban, color: "text-rose-500" },
];

interface FilterRowProps {
  option: TeamFilterOption;
  isSelected: boolean;
  onSelect: () => void;
}

function FilterRow({ option: o, isSelected, onSelect }: FilterRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors",
        isSelected ? "bg-[#0DA2E7]/10 text-[#0DA2E7]" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      )}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md", isSelected ? "bg-[#0DA2E7]/15" : "bg-muted/40")}>
          <o.icon className={cn("h-3.5 w-3.5", o.color)} />
        </span>
        <span className="truncate font-medium">{o.label}</span>
      </span>
      {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-[#0DA2E7]" />}
    </button>
  );
}

export function TeamFilters({
  roleOptions, roleFilter, onRoleChange, statusFilter, onStatusChange,
  resultCount, activeCount, onClear, title = "Filtrar miembros", resultLabel = "en el equipo",
}: TeamFiltersProps) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-9 gap-2 rounded-lg border-border/60 bg-card px-3 text-xs font-medium text-foreground shadow-sm"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-[#0DA2E7]" />
          Filtros
          {activeCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0DA2E7] px-1 text-[9px] font-bold text-white">
              {activeCount}
            </span>
          )}
          <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-[300px] rounded-2xl border-border/60 bg-card p-0 shadow-2xl">
        {/* Cabecera */}
        <div className="flex items-center gap-3 border-b border-border/40 px-4 py-3.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0DA2E7]/10">
            <SlidersHorizontal className="h-4 w-4 text-[#0DA2E7]" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-[10px] text-muted-foreground">
              {resultCount} resultado{resultCount !== 1 ? "s" : ""} {resultLabel}
            </p>
          </div>
        </div>

        {/* Opciones (se aplican automáticamente al seleccionar) */}
        <div className="grid grid-cols-2 divide-x divide-border/40">
          <div className="p-2">
            <p className="px-2 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Rol
            </p>
            <div className="space-y-0.5">
              {roleOptions.map((o) => (
                <FilterRow
                  key={o.value}
                  option={o}
                  isSelected={roleFilter === o.value}
                  onSelect={() => onRoleChange(o.value)}
                />
              ))}
            </div>
          </div>
          <div className="p-2">
            <p className="px-2 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Estado
            </p>
            <div className="space-y-0.5">
              {STATUS_OPTIONS.map((o) => (
                <FilterRow
                  key={o.value}
                  option={o}
                  isSelected={statusFilter === o.value}
                  onSelect={() => onStatusChange(o.value)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Limpiar filtros */}
        {activeCount > 0 && (
          <div className="flex items-center justify-center border-t border-border/40 p-2">
            <button
              type="button"
              onClick={onClear}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <X className="h-3.5 w-3.5" /> Limpiar filtros
            </button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}