import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileSpreadsheet, Search, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProjectExport } from "@/hooks/useProjectExport";
import { toast } from "sonner";

interface ProjectExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: any[];
}

export function ProjectExportDialog({
  open,
  onOpenChange,
  projects,
}: ProjectExportDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const { exportProjectReport } = useProjectExport();

  // Filtrar proyectos
  const filteredProjects = projects.filter(p => {
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.client.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Seleccionar uno
  const selectProject = (id: string) => {
    setSelectedProjectId(id);
  };

  // Exportar seleccionado
  const handleExport = () => {
    if (!selectedProjectId) {
      toast.error("Selecciona un proyecto");
      return;
    }
    
    const projectToExport = projects.find(p => p.id === selectedProjectId);
    if (projectToExport) {
      exportProjectReport(projectToExport);
      setSelectedProjectId(null);
      onOpenChange(false);
    }
  };

  // Limpiar selección al cerrar
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedProjectId(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md bg-card border-border p-0 rounded-2xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col [&>button]:hidden">
        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar proyectos..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="pl-9 h-9 text-sm bg-background border-border/60 rounded-lg focus:border-[#0DA2E7]/50 transition-colors" 
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Lista de proyectos */}
          <div className="space-y-2">
            <div className="border-t border-border/30" />

            <div className="max-h-[350px] overflow-y-auto space-y-1 pr-1">
              {filteredProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No se encontraron proyectos
                </p>
              ) : (
                filteredProjects.map((p) => (
                  <div 
                    key={p.id} 
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all",
                      selectedProjectId === p.id 
                        ? "bg-[#0DA2E7]/10 border border-[#0DA2E7]/30" 
                        : "hover:bg-muted/50 border border-transparent"
                    )}
                    onClick={() => selectProject(p.id)}
                  >
                    <div className={cn(
                      "h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                      selectedProjectId === p.id
                        ? "bg-[#0DA2E7] border-[#0DA2E7]"
                        : "border-border/60"
                    )}>
                      {selectedProjectId === p.id && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.client}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 pt-0 border-t border-border/30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="flex-1 rounded-lg h-9 text-sm border-border/60 hover:border-[#0DA2E7]/30"
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleExport}
              disabled={!selectedProjectId}
              className="flex-1 rounded-lg h-9 gap-2 text-white"
              style={{ 
                background: selectedProjectId 
                  ? "linear-gradient(135deg, #0DA2E7 0%, #0B8BC7 100%)" 
                  : "#6b7280" 
              }}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}