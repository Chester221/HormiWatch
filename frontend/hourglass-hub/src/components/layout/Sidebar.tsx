import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  UserCircle,
  Briefcase,
  Settings,
  Clock,
  User,
  Shield,
  BarChart3,
  Building2,
  Wrench,
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
  // 1. Dashboard (según rol)
  { name: "Dashboard", href: "/gerencial", icon: BarChart3, roles: ["Manager"] },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["Technician"] },
  { name: "Dashboard", href: "/control-usuarios", icon: Shield, roles: ["Admin"] },
  
  // 2. Clientes (Manager y Admin)
  { name: "Clientes", href: "/clients", icon: Building2, roles: ["Manager", "Admin"] },
  
  // 3. Proyectos (Manager, Admin y Technician)
  { name: "Proyectos", href: "/projects", icon: FolderKanban, roles: ["Manager", "Admin", "Technician"] },
  
  // 4. Tareas (todos)
  { name: "Tareas", href: "/tasks", icon: CheckSquare, roles: ["Manager", "Admin", "Technician"] },
  
  // Equipo (Manager y Admin)
  { name: "Equipo", href: "/team", icon: Users, roles: ["Manager", "Admin"] },
  
  // Servicios (Manager, Admin y Technician)
  { name: "Servicios", href: "/services", icon: Wrench, roles: ["Manager", "Admin", "Technician"] },
];

const bottomNavigation: NavItem[] = [
  { name: "Mi Perfil", href: "/profile", icon: User, roles: ["Manager", "Admin", "Technician"] },
  { name: "Configuración", href: "/settings", icon: Settings, roles: ["Manager", "Admin", "Technician"] },
];

export function Sidebar() {
  const { profile } = useAuth();
  const userRole = profile?.role || "Technician";

  const filteredNavigation = navigation.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  });

  const filteredBottomNavigation = bottomNavigation.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  });

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

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0DA2E7]">
            <Clock className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-sidebar-accent-foreground">
            Hormiwatch
          </span>
        </div>

        {/* Indicador de Rol */}
        <div className="px-3 py-3">
          <div className={cn(
            "rounded-lg px-3 py-2 text-xs font-medium flex items-center gap-2 border",
            getRoleBadgeColor()
          )}>
            <RoleIcon className="h-3.5 w-3.5" />
            {getRoleDisplay()}
          </div>
        </div>

        {/* Navigation Principal */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          <p className="px-3 py-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
            Principal
          </p>
          {filteredNavigation.map((item, index) => (
            <NavLink
              key={item.name + item.href}
              to={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-all duration-200",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                "opacity-0 animate-slide-in-left"
              )}
              activeClassName="bg-[#0DA2E7] text-white hover:bg-[#0DA2E7] hover:text-white shadow-md"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <item.icon className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
              {item.name}
            </NavLink>
          ))}

          {/* Separador */}
          <div className="my-4" />

          <p className="px-3 py-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
            Cuenta
          </p>
          {filteredBottomNavigation.map((item, index) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-all duration-200",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                "opacity-0 animate-slide-in-left"
              )}
              activeClassName="bg-[#0DA2E7] text-white hover:bg-[#0DA2E7] hover:text-white shadow-md"
              style={{ animationDelay: `${(filteredNavigation.length + index) * 50}ms` }}
            >
              <item.icon className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          <div className="rounded-xl bg-sidebar-accent/50 p-3">
            <p className="text-xs font-medium text-sidebar-foreground">
              {profile?.full_name || "Usuario"}
            </p>
            <p className="text-[10px] text-sidebar-muted mt-0.5">© 2026 Hormiwatch</p>
          </div>
        </div>
      </div>
    </aside>
  );
}