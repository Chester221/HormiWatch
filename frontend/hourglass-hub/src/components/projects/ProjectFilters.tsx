import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SlidersHorizontal, ChevronDown, LayoutGrid, Activity, CheckCircle2, Clock,
  PauseCircle, CheckCheck, Ban, Archive, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, type ReactNode } from "react";

interface StatusOption {
  value: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  { value: "all", label: "Todos", icon: LayoutGrid, color: "text-muted-foreground" },
  { value: "In Progress", label: "En Progreso", icon: Activity, color: "text-[#0DA2E7]" },
  { value: "active", label: "Activos", icon: CheckCircle2, color: "text-emerald-500" },
  { value: "Not Started", label: "Sin Empezar", icon: Clock, color: "text-slate-500" },
  { value: "on-hold", label: "En Pausa", icon: PauseCircle, color: "text-amber-500" },
  { value: "completed", label: "Cerrados", icon: CheckCheck, color: "text-gray-500" },
  { value: "Cancelled", label: "Cancelados", icon: Ban, color: "text-rose-500" },
  { value: "inactive", label: "Inactivos", icon: Archive, color: "text-amber-600" },
];

interface ProjectFiltersProps {
  statusFilter: string;
  onStatusChange: (value: string) => void;
  clients: { id: string; name: string }[];
  clientFilter: string;
  onClientChange: (value: string) => void;
  resultCount: number;
  activeCount: number;
  onClear: () => void;
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
      {children}
    </p>
  );
}

export default function ProjectFilters({
  statusFilter,
  onStatusChange,
  clients,
  clientFilter,
  onClientChange,
  resultCount,
  activeCount,
  onClear,
}: ProjectFiltersProps) {
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
        sideOffset={6}
        collisionPadding={16}
        className="w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl border-border/60 bg-card p-0 shadow-2xl"
      >
        {/* Cabecera */}
        <div className="flex items-center gap-2 border-b border-border/40 px-3 py-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0DA2E7]/10">
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#0DA2E7]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground">Filtrar proyectos</p>
            <p className="text-[10px] text-muted-foreground">
              {resultCount} proyecto{resultCount !== 1 ? "s" : ""} — {activeCount} filtro
              {activeCount !== 1 ? "s" : ""} activo{activeCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Estado */}
        <div className="p-3">
          <SectionLabel>Estado</SectionLabel>
          <div className="grid grid-cols-2 gap-1.5">
            {STATUS_OPTIONS.map((o) => {
              const isSelected = statusFilter === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => onStatusChange(o.value)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors",
                    isSelected
                      ? "border-[#0DA2E7]/60 bg-[#0DA2E7]/10 text-[#0DA2E7]"
                      : "border-border/60 bg-background text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground"
                  )}
                >
                  <o.icon className={cn("h-3.5 w-3.5 shrink-0", o.color)} />
                  <span className="truncate">{o.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cliente */}
        <div className="border-t border-border/40 p-3">
          <SectionLabel>Cliente</SectionLabel>
          <Select value={clientFilter === "all" ? "all" : clientFilter} onValueChange={onClientChange}>
            <SelectTrigger className="h-8 w-full border-border/60 px-2.5 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Todos</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Pie */}
        <div className="flex items-center justify-between border-t border-border/40 bg-card px-3 py-2">
          {activeCount > 0 ? (
            <button
              type="button"
              onClick={onClear}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <X className="h-3.5 w-3.5" /> Limpiar filtros
            </button>
          ) : (
            <span className="text-[11px] text-muted-foreground">Sin filtros activos</span>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}