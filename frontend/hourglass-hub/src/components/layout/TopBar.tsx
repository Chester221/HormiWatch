import { useState, useEffect, useRef } from "react";
import {
  Search, ChevronDown, LogOut, User, Settings, CheckSquare, FolderKanban,
  Users, Briefcase, Wrench, Menu, X, ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { NotificationsBell } from "@/components/notifications/NotificationsBell";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";

export function TopBar({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: searchData, isFetching, isError, hasMinLength } =
    useGlobalSearch(searchQuery, searchOpen);

  const userName = profile?.full_name || user?.email?.split('@')[0] || 'Usuario';
  const userEmail = user?.email || '';

  const roleName = typeof profile?.role === 'string'
    ? profile.role
    : profile?.role?.name || 'Technician';
  const normalizedRole = roleName.toLowerCase();
  const isTechnician = normalizedRole === 'technician' || normalizedRole === 'employee';
  const canSearchClients = ['admin', 'manager', 'leader'].includes(normalizedRole);
  const canSearchUsers = canSearchClients;

  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const getRoleLabel = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'Administrador';
      case 'manager': return 'Líder';
      case 'leader': return 'Líder';
      case 'technician': return 'Técnico';
      case 'employee': return 'Empleado';
      default: return role;
    }
  };

  const handleLogout = async () => {
    try { await signOut(); toast.success("Sesión cerrada"); navigate("/auth"); } catch { toast.error("Error"); }
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const groups: {
    key: string;
    label: string;
    icon: LucideIcon;
    items: typeof searchData.projects;
    to: (id: string) => string;
  }[] = [
    {
      key: 'projects',
      label: 'Proyectos',
      icon: FolderKanban,
      items: searchData.projects,
      to: (id) => `/projects?project=${id}`,
    },
    {
      key: 'tasks',
      label: 'Tareas',
      icon: CheckSquare,
      items: searchData.tasks,
      to: (id) => `/tasks?task=${id}`,
    },
    {
      key: 'customers',
      label: 'Clientes',
      icon: Briefcase,
      items: searchData.customers,
      to: (id) => `/clients?client=${id}`,
    },
    {
      key: 'services',
      label: 'Servicios',
      icon: Wrench,
      items: searchData.services,
      to: (id) => `/services?service=${id}`,
    },
    {
      key: 'users',
      label: 'Usuarios',
      icon: Users,
      items: searchData.users,
      to: (id) => `/team?member=${id}`,
    },
  ];

  const visibleGroups = groups.filter((group) => group.items.length > 0);
  const totalResults = visibleGroups.reduce((sum, group) => sum + group.items.length, 0);

  const suggestionText = isTechnician
    ? 'Prueba con el nombre de una tarea, proyecto o servicio según tus permisos.'
    : canSearchClients && canSearchUsers
      ? 'Prueba con el nombre de una tarea, proyecto, cliente, servicio o usuario.'
      : 'Prueba con el nombre de una tarea, proyecto o servicio según tus permisos.';

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
  };

  const handleSelect = (path: string) => {
    navigate(path);
    closeSearch();
  };

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
          <Popover open={searchOpen} onOpenChange={(open) => { if (!open) setSearchQuery(''); setSearchOpen(open); }}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Buscar en todo el sistema"
                className="flex w-full items-center rounded-lg border border-transparent bg-muted/50 py-2 pl-10 pr-3 text-left text-sm text-muted-foreground transition-all hover:border-primary hover:bg-card hover:text-foreground hover:shadow-sm"
              >
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <span className="truncate">Buscar en todo el sistema...</span>
                <kbd className="ml-auto hidden h-5 shrink-0 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground sm:inline-flex">Ctrl K</kbd>
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              onOpenAutoFocus={(event) => {
                event.preventDefault();
                searchInputRef.current?.focus();
              }}
              className="w-[calc(100vw-2rem)] max-w-lg gap-0 border-border bg-card p-0 shadow-lg"
            >
              <div className="relative">
                <Command shouldFilter={false} className="bg-card text-foreground">
                  <CommandInput
                    ref={searchInputRef}
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                    placeholder="Escribe para buscar en todo el sistema..."
                    aria-label="Buscar"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      aria-label="Limpiar búsqueda"
                      onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }}
                      className="absolute right-2.5 top-2.5 z-10 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <CommandList className="max-h-[340px]">
                    {!hasMinLength && (
                      <div className="py-10 text-center text-sm text-muted-foreground">
                        <Search className="mx-auto mb-3 h-10 w-10 opacity-20" />
                        <p className="font-medium">Buscar en HormiWatch</p>
                        <p className="mt-1 text-xs">Escribe al menos 2 caracteres para ver resultados</p>
                      </div>
                    )}

                    {hasMinLength && isFetching && totalResults === 0 && (
                      <div className="py-10 text-center text-sm text-muted-foreground">
                        <Search className="mx-auto mb-3 h-8 w-8 animate-pulse opacity-40" />
                        <p>Buscando...</p>
                      </div>
                    )}

                    {hasMinLength && isError && !isFetching && (
                      <div className="px-4 py-10 text-center">
                        <p className="text-sm font-medium">No se pudo completar la búsqueda</p>
                        <p className="mt-1 text-xs text-muted-foreground">Intenta de nuevo en unos segundos.</p>
                      </div>
                    )}

                    {hasMinLength && !isFetching && !isError && totalResults === 0 && (
                      <div className="px-4 py-10 text-center">
                        <Search className="mx-auto mb-2 h-8 w-8 text-muted-foreground opacity-30" />
                        <p className="text-sm font-medium">No se encontraron resultados para <strong>"{searchQuery}"</strong></p>
                        <p className="mt-1 text-xs text-muted-foreground">{suggestionText}</p>
                      </div>
                    )}

                    {visibleGroups.map((group) => {
                      const Icon = group.icon;
                      return (
                        <CommandGroup key={group.key} heading={group.label}>
                          {group.items.map((item) => (
                            <CommandItem
                              key={`${group.key}-${item.id}`}
                              value={`${group.key}-${item.id}`}
                              onSelect={() => handleSelect(group.to(item.id))}
                              className="group flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2"
                            >
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0DA2E7]/10">
                                <Icon className="h-4 w-4 text-[#0DA2E7]" />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                                {(item.subtitle || item.meta) && (
                                  <p className="truncate text-xs text-muted-foreground">
                                    {[item.subtitle, item.meta].filter(Boolean).join(' · ')}
                                  </p>
                                )}
                              </div>
                              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#0DA2E7] opacity-0 transition-opacity group-hover:opacity-100" />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      );
                    })}
                  </CommandList>
                </Command>
              </div>
              <div className="flex items-center justify-between border-t border-border px-3 py-1.5 text-[10px] text-muted-foreground">
                <span>{hasMinLength && totalResults > 0 ? `${totalResults} resultado(s)` : 'Búsqueda global'}</span>
                {isFetching && <span>Buscando…</span>}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <NotificationsBell />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-3 hover:bg-accent">
              <Avatar className="h-8 w-8"><AvatarImage src={profile?.avatar_url || undefined} /><AvatarFallback className="bg-primary text-primary-foreground text-sm">{userInitials}</AvatarFallback></Avatar>
              <div className="hidden md:block text-left"><p className="text-sm font-medium text-foreground">{userName}</p><p className="text-xs text-muted-foreground">{getRoleLabel(roleName)}</p></div>
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
