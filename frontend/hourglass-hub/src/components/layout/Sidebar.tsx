import { useEffect } from "react";
import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Briefcase,
  Settings,
  Clock,
  User,
  Shield,
  BarChart3,
  Building2,
  Wrench,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/gerencial", icon: BarChart3, roles: ["Manager"] },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["Technician"] },
  { name: "Dashboard", href: "/control-usuarios", icon: Shield, roles: ["Admin"] },

  { name: "Clientes", href: "/clients", icon: Building2, roles: ["Manager", "Admin"] },
  { name: "Proyectos", href: "/projects", icon: FolderKanban, roles: ["Manager", "Admin", "Technician"] },
  { name: "Tareas", href: "/tasks", icon: CheckSquare, roles: ["Manager", "Admin", "Technician"] },
  { name: "Equipo", href: "/team", icon: Users, roles: ["Manager", "Admin"] },
  { name: "Servicios", href: "/services", icon: Wrench, roles: ["Manager", "Admin", "Technician"] },
];

const bottomNavigation: NavItem[] = [
  { name: "Mi Perfil", href: "/profile", icon: User, roles: ["Manager", "Admin", "Technician"] },
  { name: "Configuración", href: "/settings", icon: Settings, roles: ["Manager", "Admin", "Technician"] },
];

const ACTIVE_CLASSES =
  "bg-[#0DA2E7]/10 text-[#0DA2E7] font-semibold hover:bg-[#0DA2E7]/10 hover:text-[#0DA2E7] shadow-[inset_2.5px_0_0_0_#0DA2E7]";

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const { profile } = useAuth();
  const userRole = profile?.role || "Technician";

  const filteredNavigation = navigation.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  });

  const filteredBottomNavigation = bottomNavigation.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseMobile?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCloseMobile]);

  const getRoleDisplay = () => {
    switch (userRole) {
      case "Manager": return "Manager";
      case "Admin": return "Administrador";
      case "Technician": return "Técnico";
      default: return "Usuario";
    }
  };

  const getRoleBadgeColor = () => {
    switch (userRole) {
      case "Manager": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "Admin": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "Technician": return "bg-sky-500/10 text-sky-600 border-sky-500/20";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  const getRoleIcon = () => {
    switch (userRole) {
      case "Manager": return Briefcase;
      case "Admin": return Settings;
      case "Technician": return Wrench;
      default: return User;
    }
  };

  const RoleIcon = getRoleIcon();
  const displayName = profile?.full_name || "Usuario";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const itemClasses = cn(
    "group relative flex items-center rounded-lg py-2.5 text-sm font-medium transition-all duration-200",
    "text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
    collapsed
      ? "gap-3.5 px-3.5 lg:justify-center lg:gap-0 lg:px-2"
      : "gap-3.5 px-3.5 hover:translate-x-0.5",
    "opacity-0 animate-slide-in-left",
  );

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col overflow-hidden bg-sidebar transition-all duration-300 ease-in-out",
          "w-64",
          collapsed && "lg:w-[76px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Logo + acciones */}
        <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-4">
          <div className={cn("flex min-w-0 items-center gap-3", collapsed && "lg:justify-center")}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0DA2E7] shadow-glow">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <span className={cn("truncate text-lg font-bold tracking-tight text-sidebar-accent-foreground", collapsed && "lg:hidden")}>
              Hormiwatch
            </span>
          </div>

          <div className="ml-auto flex items-center gap-1">
            {onCloseMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Cerrar menú"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:hidden"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
                title={collapsed ? "Expandir menú" : "Colapsar menú"}
                className="hidden h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:flex"
              >
                {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Indicador de Rol */}
        <div className={cn("shrink-0 px-3 pt-3", collapsed && "lg:px-2")}>
          <div
            className={cn(
              "flex items-center rounded-lg border py-2 text-xs font-medium",
              getRoleBadgeColor(),
              collapsed ? "gap-2 px-3 lg:w-11 lg:justify-center lg:gap-0 lg:px-0" : "w-full gap-2 px-3",
            )}
          >
            <RoleIcon className="h-4 w-4 shrink-0" />
            <span className={cn("truncate", collapsed && "lg:hidden")}>{getRoleDisplay()}</span>
          </div>
        </div>

        {/* Navegación principal */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3">
          <div className={cn("px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40", collapsed && "lg:hidden")}>
            Principal
          </div>
          <div className="space-y-1">
            {filteredNavigation.map((item, index) => (
              <NavLink
                key={item.name + item.href}
                to={item.href}
                onClick={onCloseMobile}
                className={itemClasses}
                activeClassName={ACTIVE_CLASSES}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <item.icon className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                <span className={cn("truncate", collapsed && "lg:hidden")}>{item.name}</span>
              </NavLink>
            ))}
          </div>

          <div className="my-4 h-px bg-sidebar-border/60" />

          <div className={cn("px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40", collapsed && "lg:hidden")}>
            Cuenta
          </div>
          <div className="space-y-1">
            {filteredBottomNavigation.map((item, index) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={onCloseMobile}
                className={itemClasses}
                activeClassName={ACTIVE_CLASSES}
                style={{ animationDelay: `${(filteredNavigation.length + index) * 50}ms` }}
              >
                <item.icon className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                <span className={cn("truncate", collapsed && "lg:hidden")}>{item.name}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-sidebar-border p-4">
          <div className={cn("flex items-center gap-3 rounded-xl bg-sidebar-accent/50 p-3", collapsed && "lg:justify-center lg:px-2")}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0DA2E7]/15 text-xs font-bold text-[#0DA2E7]">
              {initials}
            </div>
            <div className={cn("min-w-0", collapsed && "lg:hidden")}>
              <p className="truncate text-xs font-semibold text-sidebar-accent-foreground">{displayName}</p>
              <p className="mt-0.5 truncate text-[10px] text-sidebar-muted">© 2026 Hormiwatch</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}