import { Plus, FolderPlus, UserPlus, Wrench, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface QuickActionsProps {
  onNewTask: () => void;
  onNewProject?: () => void;
  onAddUser?: () => void;        // Solo Admin
  onManageMember?: () => void;   // Solo Manager
  onNewService?: () => void;
}

export function QuickActions({ 
  onNewTask, 
  onNewProject, 
  onAddUser, 
  onManageMember, 
  onNewService 
}: QuickActionsProps) {
  const { profile } = useAuth();
  
  const userRole = profile?.role || 'Technician';
  const isAdmin = userRole === 'Admin';
  const isManager = userRole === 'Manager';
  const isTechnician = userRole === 'Technician';

  // 🔒 Configuración de botones según rol (ERS: Matriz de Control de Acceso)
  const getActions = () => {
    if (isAdmin) {
      // Administrador: Nueva Tarea, Agregar Usuario
      return [
        { label: "Nueva Tarea", icon: Plus, primary: true, action: "newTask", show: true },
        { label: "Agregar Usuario", icon: UserPlus, primary: false, action: "addUser", show: true },
      ];
    }
    
    if (isManager) {
      // Manager: Nueva Tarea, Nuevo Proyecto, Gestionar Miembro
      return [
        { label: "Nueva Tarea", icon: Plus, primary: true, action: "newTask", show: true },
        { label: "Nuevo Proyecto", icon: FolderPlus, primary: false, action: "newProject", show: true },
        { label: "Gestionar Miembro", icon: Users, primary: false, action: "manageMember", show: true },
      ];
    }
    
    if (isTechnician) {
      // Técnico: Nueva Tarea, Nuevo Servicio
      return [
        { label: "Nueva Tarea", icon: Plus, primary: true, action: "newTask", show: true },
        { label: "Nuevo Servicio", icon: Wrench, primary: false, action: "newService", show: true },
      ];
    }
    
    return [];
  };

  const actions = getActions().filter(a => a.show);

  const handleClick = (action: string) => {
    switch (action) {
      case "newTask": onNewTask(); break;
      case "newProject": onNewProject?.(); break;
      case "addUser": onAddUser?.(); break;
      case "manageMember": onManageMember?.(); break;
      case "newService": onNewService?.(); break;
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card opacity-0 animate-fade-in" style={{ animationDelay: "300ms" }}>
      <h3 className="mb-4 text-lg font-semibold text-foreground">Acciones Rápidas</h3>
      <div className={`grid gap-3 ${actions.length === 4 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {actions.map((action, index) => (
          <Button
            key={action.label}
            variant={action.primary ? "default" : "outline"}
            className={cn(
              "h-auto flex-col gap-2 py-4 transition-all duration-200",
              action.primary ? "bg-primary hover:bg-primary/90 shadow-glow" : "hover:bg-accent hover:border-primary/30",
              "opacity-0 animate-fade-in"
            )}
            style={{ animationDelay: `${350 + index * 50}ms` }}
            onClick={() => handleClick(action.action)}
          >
            <action.icon className="h-5 w-5" />
            <span className="text-xs font-medium">{action.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}