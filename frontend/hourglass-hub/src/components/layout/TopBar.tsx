import { useState, useEffect } from "react";
import { Search, ChevronDown, LogOut, User, Settings, CheckSquare, FolderKanban, Users, Briefcase, Wrench } from "lucide-react";
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
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function TopBar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: tasks = [] } = useTasks();
  const { data: projects = [] } = useProjects();
  const { data: members = [] } = useTeamMembers();
  const { data: clients = [] } = useClientsWithContacts();
  const { data: services = [] } = useServices();

  const userName = profile?.full_name || user?.email?.split('@')[0] || 'Usuario';
  const userEmail = user?.email || '';
  const userRole = profile?.role || 'Technician';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const getRoleLabel = (role: string) => {
    switch (role) { case 'Admin': return 'Administrador'; case 'Manager': return 'Líder'; case 'Technician': return 'Técnico'; default: return role; }
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

  const q = searchQuery.toLowerCase().trim();

  // 🔒 Definir qué puede ver cada rol
  const isAdminOrManager = userRole === 'Admin' || userRole === 'Manager';
  const isTechnician = userRole === 'Technician';

  // 🔍 Detectar si es una búsqueda por categoría
  const isSearchingForTasks = q === 'tarea' || q === 'tareas';
  const isSearchingForServices = q === 'servicio' || q === 'servicios';
  const isSearchingForProjects = q === 'proyecto' || q === 'proyectos';
  const isSearchingForClients = q === 'cliente' || q === 'clientes';
  const isSearchingForMembers = q === 'miembro' || q === 'miembros' || q === 'equipo';

  const results: any[] = [];

  // 📋 TAREAS
  if (isSearchingForTasks) {
    // Si busca "tarea/s", muestra TODAS sus tareas (sin filtro de palabra)
    const filteredTasks = tasks.filter((t: any) => {
      if (isTechnician) return t.technician_id === user?.id;
      return true;
    });
    results.push(...filteredTasks.slice(0, 5).map((t: any) => ({
      type: 'Tarea',
      icon: <CheckSquare className="h-4 w-4 text-green-500" />,
      label: t.description || 'Sin descripción',
      sub: t.projects?.name,
      path: '/tasks'
    })));
  } else if (q) {
    // Búsqueda normal por palabra específica
    results.push(...tasks
      .filter((t: any) => {
        const matchesSearch = (t.description || '').toLowerCase().includes(q);
        if (isTechnician) return matchesSearch && t.technician_id === user?.id;
        return matchesSearch;
      })
      .slice(0, 5)
      .map((t: any) => ({
        type: 'Tarea',
        icon: <CheckSquare className="h-4 w-4 text-green-500" />,
        label: t.description || 'Sin descripción',
        sub: t.projects?.name,
        path: '/tasks'
      })));
  }

  // 🔧 SERVICIOS
  if (isSearchingForServices) {
    // Si busca "servicio/s", muestra TODOS los servicios
    results.push(...services.slice(0, 5).map((s: any) => ({
      type: 'Servicio',
      icon: <Wrench className="h-4 w-4 text-purple-500" />,
      label: s.name,
      sub: `$${s.default_hourly_rate}/h`,
      path: '/services'
    })));
  } else if (q && !isSearchingForTasks) {
    // Búsqueda normal por palabra específica (evita duplicados)
    results.push(...services
      .filter((s: any) => (s.name || '').toLowerCase().includes(q))
      .slice(0, 5)
      .map((s: any) => ({
        type: 'Servicio',
        icon: <Wrench className="h-4 w-4 text-purple-500" />,
        label: s.name,
        sub: `$${s.default_hourly_rate}/h`,
        path: '/services'
      })));
  }

  // 🚫 SOLO Admin/Manager pueden ver lo siguiente:
  if (isAdminOrManager) {
    // PROYECTOS
    if (isSearchingForProjects) {
      const filteredProjects = projects.slice(0, 5).map((p: any) => ({
        type: 'Proyecto',
        icon: <FolderKanban className="h-4 w-4 text-blue-500" />,
        label: p.name,
        sub: p.description,
        path: '/projects'
      }));
      results.push(...filteredProjects);
    } else if (q && !isSearchingForTasks && !isSearchingForServices) {
      results.push(...projects
        .filter((p: any) => (p.name || '').toLowerCase().includes(q))
        .slice(0, 5)
        .map((p: any) => ({
          type: 'Proyecto',
          icon: <FolderKanban className="h-4 w-4 text-blue-500" />,
          label: p.name,
          sub: p.description,
          path: '/projects'
        })));
    }

    // CLIENTES
    if (isSearchingForClients) {
      const filteredClients = clients.slice(0, 5).map((c: any) => ({
        type: 'Cliente',
        icon: <Briefcase className="h-4 w-4 text-orange-500" />,
        label: c.name,
        sub: c.ruc || c.address,
        path: '/clients'
      }));
      results.push(...filteredClients);
    } else if (q && !isSearchingForTasks && !isSearchingForServices && !isSearchingForProjects) {
      results.push(...clients
        .filter((c: any) => (c.name || '').toLowerCase().includes(q))
        .slice(0, 5)
        .map((c: any) => ({
          type: 'Cliente',
          icon: <Briefcase className="h-4 w-4 text-orange-500" />,
          label: c.name,
          sub: c.ruc || c.address,
          path: '/clients'
        })));
    }

    // MIEMBROS
    if (isSearchingForMembers) {
      const filteredMembers = members.slice(0, 5).map((m: any) => ({
        type: 'Miembro',
        icon: <Users className="h-4 w-4 text-cyan-500" />,
        label: m.full_name || m.email,
        sub: m.role,
        path: '/team'
      }));
      results.push(...filteredMembers);
    } else if (q && !isSearchingForTasks && !isSearchingForServices && !isSearchingForProjects && !isSearchingForClients) {
      results.push(...members
        .filter((m: any) => (m.full_name || '').toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q))
        .slice(0, 5)
        .map((m: any) => ({
          type: 'Miembro',
          icon: <Users className="h-4 w-4 text-cyan-500" />,
          label: m.full_name || m.email,
          sub: m.role,
          path: '/team'
        })));
    }
  }

  // Eliminar duplicados por si acaso
  const uniqueResults = results.filter((item, index, self) => 
    index === self.findIndex((t) => t.label === item.label && t.type === item.type)
  );

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 px-6 backdrop-blur-sm">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setSearchOpen(true)}
          className="w-full flex items-center pl-10 pr-4 py-2 text-sm text-muted-foreground bg-muted/50 border border-transparent rounded-md hover:border-primary hover:bg-card transition-all text-left"
        >
          Buscar en todo el sistema...
          <kbd className="ml-auto inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">⌘K</kbd>
        </motion.button>
      </div>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-lg p-0 gap-0 bg-card border-border">
          <div className="flex items-center border-b border-border px-3">
            <Search className="h-4 w-4 text-muted-foreground mr-2" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Escribe para buscar..."
              className="flex-1 h-12 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
              autoFocus
            />
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
                <motion.div key="no-results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-10 text-center">
                  <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-30" />
                  <p className="text-sm font-medium">No se encontraron resultados</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    No hay nada relacionado con <strong>"{searchQuery}"</strong>
                  </p>
                </motion.div>
              )}
              {uniqueResults.length > 0 && (
                <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className="text-xs text-muted-foreground px-2 py-1">Resultados ({uniqueResults.length})</p>
                  {uniqueResults.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => { navigate(item.path); setSearchOpen(false); setSearchQuery(""); }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                    >
                      {item.icon}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.label}</p>
                        {item.sub && <p className="text-xs text-muted-foreground truncate">{item.sub}</p>}
                      </div>
                      <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{item.type}</span>
                    </motion.div>
                  ))}
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