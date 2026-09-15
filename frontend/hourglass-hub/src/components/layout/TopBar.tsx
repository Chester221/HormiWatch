import { useState, useEffect, useMemo } from "react";
import { Search, ChevronDown, LogOut, User, Settings, CheckSquare, FolderKanban, Users, Briefcase, Wrench, Menu, X, ArrowRight } from "lucide-react";
import { projectStatusInfo } from "@/lib/dashboardUtils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useClientsWithContacts } from "@/hooks/useClientes";
import { useServices } from "@/hooks/useServices";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,  // ✅ AGREGADO
  DialogTitle,   // ✅ AGREGADO
} from "@/components/ui/dialog";

export function TopBar({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const { data: tasks = [] } = useTasks();
  const { data: projects = [] } = useProjects();
  const { data: members = [] } = useTeamMembers();
  const { data: clients = [] } = useClientsWithContacts();
  const { data: services = [] } = useServices();

  const userName = profile?.full_name || user?.email?.split('@')[0] || 'Usuario';
  const userEmail = user?.email || '';

  // ✅ CORREGIDO: Obtener el nombre del rol (objeto o string)
  const roleName = typeof profile?.role === 'string' 
    ? profile.role 
    : profile?.role?.name || 'Technician';
  const userRole = roleName;

  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // ✅ Debounce real de 250ms para la búsqueda
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const getRoleLabel = (role: string) => {
    switch (role) { 
      case 'Admin': return 'Administrador'; 
      case 'Manager': return 'Líder'; 
      case 'Technician': return 'Técnico'; 
      default: return role; 
    }
  };

  const handleLogout = async () => {
    try { await signOut(); toast.success("Sesión cerrada"); navigate("/auth"); } catch { toast.error("Error"); }
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setSearchOpen(o => !o); }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // ✅ Permisos por rol
  const isAdmin = userRole === 'Admin';
  const isManager = userRole === 'Manager';
  const isTechnician = userRole === 'Technician';
  const canSearchUsers = isAdmin || isManager;
  const canSearchClients = isAdmin || isManager;

  const q = debouncedQuery.toLowerCase();

  // ✅ Etiqueta legible de estado de tarea
  const taskStatusLabel = (status?: any): string => {
    const s = String(status || '').toUpperCase();
    if (s.includes('COMPLET')) return 'Completada';
    if (s.includes('INPROGRESS') || s.includes('IN PROGRESS')) return 'En progreso';
    if (s.includes('CANCELL')) return 'Cancelada';
    return 'Pendiente';
  };

  // ✅ Un técnico solo ve tareas/proyectos/servicios que le corresponden.
  const visibleTasks = isTechnician ? tasks.filter((t: any) => t.technician_id === user?.id) : tasks;
  const visibleProjects = isTechnician
    ? projects.filter((p: any) =>
        p.technicians?.some((m: any) => m.id === user?.id) ||
        p.technician_id === user?.id ||
        p.project_leader_id === user?.id
      )
    : projects;

  const results = useMemo(() => {
    if (!q) return [];

    const out: any[] = [];

    // ---------- TAREAS ----------
    visibleTasks.forEach((t: any) => {
      const title = t.description || t.title || 'Sin descripción';
      if (!title.toLowerCase().includes(q) && !t.projects?.name?.toLowerCase().includes(q)) return;
      out.push({
        type: 'Tarea',
        icon: <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0DA2E7]/10"><CheckSquare className="h-4 w-4 text-[#0DA2E7]" /></span>,
        label: title,
        sub: [t.projects?.name || t.projectName, taskStatusLabel(t.status)].filter(Boolean).join(' · ') || 'Sin proyecto',
        path: `/tasks?task=${t.id}`
      });
    });

    // ---------- PROYECTOS ----------
    visibleProjects.forEach((p: any) => {
      if (!p.name?.toLowerCase().includes(q) && !p.clients?.name?.toLowerCase().includes(q) && !(p.customer_name || '').toLowerCase().includes(q)) return;
      out.push({
        type: 'Proyecto',
        icon: <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0DA2E7]/10"><FolderKanban className="h-4 w-4 text-[#0DA2E7]" /></span>,
        label: p.name,
        sub: `${p.clients?.name || p.customer_name || 'Sin cliente'} · ${projectStatusInfo(p.status).label}`,
        path: `/projects?project=${p.id}`
      });
    });

    // ---------- CLIENTES (solo Admin/Manager) ----------
    if (canSearchClients) {
      clients.forEach((c: any) => {
        if (!c.name?.toLowerCase().includes(q) && !c.ruc?.toLowerCase().includes(q)) return;
        out.push({
          type: 'Cliente',
          icon: <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0DA2E7]/10"><Briefcase className="h-4 w-4 text-[#0DA2E7]" /></span>,
          label: c.name,
          sub: ['RIF:', c.ruc].filter(Boolean).join(' '),
          path: `/clients?client=${c.id}`
        });
      });
    }

    // ---------- SERVICIOS ----------
    services.forEach((s: any) => {
      const categoryName = s.categories?.name || s.category?.name || 'Sin categoría';
      if (!s.name?.toLowerCase().includes(q) && !categoryName.toLowerCase().includes(q)) return;
      out.push({
        type: 'Servicio',
        icon: <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0DA2E7]/10"><Wrench className="h-4 w-4 text-[#0DA2E7]" /></span>,
        label: s.name,
        sub: categoryName,
        path: `/services?service=${s.id}`
      });
    });

    // ---------- USUARIOS (solo Admin/Manager) ----------
    if (canSearchUsers) {
      members.forEach((m: any) => {
        const name = m.full_name || m.email || 'Sin nombre';
        const role = typeof m.role === 'string' ? m.role : m.role?.name;
        // Manager no ve administradores
        if (isManager && role === 'Admin') return;
        if (!name.toLowerCase().includes(q) && !(m.email || '').toLowerCase().includes(q)) return;
        out.push({
          type: 'Usuario',
          icon: <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0DA2E7]/10"><Users className="h-4 w-4 text-[#0DA2E7]" /></span>,
          label: name,
          sub: getRoleLabel(role || 'Technician'),
          path: `/team?member=${m.id}`
        });
      });
    }

    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, visibleTasks, visibleProjects, clients, services, members, isTechnician, canSearchClients, canSearchUsers]);

  const uniqueResults = results.filter((item, index, self) => 
    index === self.findIndex((t) => t.label === item.label && t.type === item.type)
  );

  const MAX_PER_GROUP = 5;
  // item.type es singular ("Tarea"), el label del grupo es plural ("Tareas")
  const grouped = ["Proyectos", "Tareas", "Clientes", "Servicios", "Usuarios"]
    .map((label) => ({
      label,
      items: uniqueResults.filter((item) => `${item.type}s` === label).slice(0, MAX_PER_GROUP),
    }))
    .filter((g) => g.items.length > 0);

  const suggestionText = isTechnician
    ? 'Prueba con el nombre de una tarea, proyecto o servicio según tus permisos.'
    : isManager
      ? 'Prueba con el nombre de una tarea, proyecto, cliente, servicio o usuario.'
      : 'Prueba con el nombre de una tarea, proyecto, cliente, servicio o usuario.';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-card/80 px-4 backdrop-blur-sm lg:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
        {onOpenSidebar && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Abrir menú"
            onClick={onOpenSidebar}
            className="shrink-0 text-muted-foreground lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div className="relative w-full max-w-md min-w-0">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setSearchOpen(true)}
          className="flex w-full items-center pl-10 pr-3 py-2 text-sm text-muted-foreground bg-muted/50 border border-transparent rounded-lg hover:border-primary hover:bg-card hover:shadow-sm hover:text-foreground transition-all text-left"
        >
          <span className="truncate">Buscar en todo el sistema...</span>
          <kbd className="ml-auto hidden h-5 shrink-0 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground sm:inline-flex">Ctrl K</kbd>
        </motion.button>
      </div>
      </div>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent hideCloseButton className="w-full max-w-[calc(100vw-2rem)] gap-0 border-border bg-card p-0 sm:max-w-lg">
          {/* ✅ AGREGADO: DialogHeader con sr-only para accesibilidad */}
          <DialogHeader className="sr-only">
            <DialogTitle>Buscador de HormiWatch</DialogTitle>
          </DialogHeader>
          
          <div className="relative flex items-center border-b border-border px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Escribe para buscar..."
              aria-label="Buscar"
              className="h-12 w-full flex-1 bg-transparent pl-2.5 pr-9 text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="max-h-[300px] overflow-y-auto p-2">
            <AnimatePresence mode="wait">
              {!q && (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-10 text-center text-sm text-muted-foreground">
                  <Search className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">Buscar en HormiWatch</p>
                  <p className="text-xs mt-1">Escribe cualquier letra para ver resultados</p>
                </motion.div>
              )}
              {q && uniqueResults.length === 0 && (
                <motion.div key="no-results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-10 text-center">
                  <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-30" />
                  <p className="text-sm font-medium">No se encontraron resultados para <strong>"{searchQuery}"</strong></p>
                  <p className="text-xs text-muted-foreground mt-1">{suggestionText}</p>
                </motion.div>
              )}
              {uniqueResults.length > 0 && (
                <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className="px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Resultados ({uniqueResults.length})
                  </p>
                  <div className="max-h-[300px] overflow-y-auto p-1.5 pt-0.5">
                    {grouped.map((group, gi) => (
                      <div key={group.label} className={gi > 0 ? "mt-1.5 border-t border-border/60 pt-1.5" : ""}>
                        <p className="px-2 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                          {group.label}
                        </p>
                        {group.items.map((item, i) => (
                          <motion.div
                            key={item.label + item.type}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            onClick={() => { navigate(item.path); setSearchOpen(false); setSearchQuery(""); }}
                            className="group flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted"
                          >
                            {item.icon}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">{item.label}</p>
                              {item.sub && <p className="truncate text-xs text-muted-foreground">{item.sub}</p>}
                            </div>
                            <ArrowRight className="h-3.5 w-3.5 shrink-0 -translate-x-0.5 text-[#0DA2E7] opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
                          </motion.div>
                        ))}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-3 hover:bg-accent">
              <Avatar className="h-8 w-8"><AvatarImage src={profile?.avatar_url || undefined} /><AvatarFallback className="bg-primary text-primary-foreground text-sm">{userInitials}</AvatarFallback></Avatar>
              <div className="hidden md:block text-left"><p className="text-sm font-medium text-foreground">{userName}</p><p className="text-xs text-muted-foreground">{getRoleLabel(userRole)}</p></div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-card border-border">
            <DropdownMenuLabel className="font-normal"><div className="flex flex-col space-y-1"><p className="text-sm font-medium">{userName}</p><p className="text-xs text-muted-foreground">{userEmail}</p></div></DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")}><User className="h-4 w-4 mr-2" />Mi Perfil</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}><Settings className="h-4 w-4 mr-2" />Configuración</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive"><LogOut className="h-4 w-4 mr-2" />Cerrar Sesión</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}