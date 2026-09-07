import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useCreateProject } from '@/hooks/useProjects';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { toast } from 'sonner';
import { 
  FolderKanban, 
  FileText, 
  Users, 
  Loader2,
  Briefcase,
  UserCircle
} from 'lucide-react';

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateProjectModal({ open, onOpenChange, onSuccess }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [leaderId, setLeaderId] = useState('');
  const createProject = useCreateProject();
  const { data: members = [] } = useTeamMembers();

  // 🔒 Filtrar solo MANAGER y ADMIN para líder de proyecto
  const eligibleLeaders = members.filter((m: any) => 
    m.role === 'Manager' || m.role === 'Admin'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    createProject.mutate(
      { name, description: description || null, status: 'In Progress', project_leader_id: leaderId || null },
      {
        onSuccess: () => {
          toast.success('Proyecto creado correctamente');
          setName('');
          setDescription('');
          setLeaderId('');
          onOpenChange(false);
          onSuccess();
        },
        onError: (error: any) => {
          toast.error(`Error: ${error.message}`);
        },
      }
    );
  };

  // Función para obtener iniciales
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border p-0 rounded-2xl overflow-hidden">
        {/* Header con gradiente y icono de proyecto */}
        <div className="p-6 pb-4 bg-gradient-to-r from-indigo-500/10 via-indigo-500/5 to-transparent border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20">
              <FolderKanban className="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">
                Nuevo Proyecto
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Completa los detalles para crear un nuevo proyecto
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 pt-4">
          <div className="space-y-5">
            {/* Nombre del Proyecto */}
            <div className="space-y-2">
              <Label className="text-foreground flex items-center gap-2">
                <FolderKanban className="h-3.5 w-3.5 text-muted-foreground" />
                Nombre del Proyecto <span className="text-destructive">*</span>
              </Label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Ej: Treeala Web, Bancamiga Seguridad..." 
                className="bg-muted/50 border-border focus:border-indigo-500 transition-colors"
                required 
              />
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label className="text-foreground flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                Descripción
              </Label>
              <Textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Describe el objetivo y alcance del proyecto..." 
                rows={3} 
                className="bg-muted/50 border-border focus:border-indigo-500 transition-colors resize-none"
              />
            </div>

            {/* Líder de Proyecto - Solo Managers y Admins */}
            <div className="space-y-2">
              <Label className="text-foreground flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                Líder de Proyecto
              </Label>
              <Select value={leaderId} onValueChange={setLeaderId}>
                <SelectTrigger className="bg-muted/50 border-border">
                  <SelectValue placeholder="Selecciona un líder (Manager o Admin)" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border max-h-[280px]">
                  {eligibleLeaders.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No hay Managers o Admins disponibles
                    </div>
                  ) : (
                    eligibleLeaders.map((m: any) => (
                      <SelectItem key={m.id} value={m.id}>
                        <span className="flex items-center gap-2">
                          {/* Avatar con foto o iniciales */}
                          {m.avatar_url ? (
                            <img 
                              src={m.avatar_url} 
                              alt={m.full_name || m.email}
                              className="h-6 w-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-medium">
                              {getInitials(m.full_name || m.email)}
                            </div>
                          )}
                          <span className="flex-1">{m.full_name || m.email}</span>
                          {m.role === 'Admin' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600">
                              Admin
                            </span>
                          )}
                          {m.role === 'Manager' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600">
                              Manager
                            </span>
                          )}
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                Opcional. Solo Managers y Admins pueden ser líderes de proyecto.
              </p>
            </div>

            {/* Info adicional */}
            <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center gap-2">
                <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  El proyecto se creará con estado "En progreso"
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="hover:bg-muted"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createProject.isPending}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              {createProject.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {createProject.isPending ? 'Creando...' : 'Crear Proyecto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}