import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Wrench, Plus, Check, Eye, EyeOff, Settings, Code, Database, Bug, Headphones, Briefcase, Users, PenTool, Server, Shield } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

// Iconos disponibles para categorías
const SERVICE_ICONS: Record<string, any> = {
  "Desarrollo Frontend": Code,
  "Desarrollo Backend": Database,
  "Testing QA": Bug,
  "Soporte Técnico": Headphones,
  "Consultoría": Briefcase,
  "Reunión": Users,
  "Diseño": PenTool,
  "Infraestructura": Server,
  "Seguridad": Shield,
};

// Categorías predefinidas
const DEFAULT_CATEGORIES = [
  { name: "Desarrollo Frontend", icon: "Code", rate: 25, description: "Desarrollo de interfaces y componentes", active: true },
  { name: "Desarrollo Backend", icon: "Database", rate: 25, description: "API, bases de datos y lógica de negocio", active: true },
  { name: "Testing QA", icon: "Bug", rate: 20, description: "Pruebas y control de calidad", active: true },
  { name: "Soporte Técnico", icon: "Headphones", rate: 18, description: "Soporte a usuarios", active: true },
  { name: "Consultoría", icon: "Briefcase", rate: 30, description: "Asesoría técnica y estratégica", active: true },
  { name: "Reunión", icon: "Users", rate: 15, description: "Reuniones con clientes o equipo", active: true },
  { name: "Diseño", icon: "PenTool", rate: 22, description: "Diseño UX/UI y prototipos", active: false },
  { name: "Infraestructura", icon: "Server", rate: 28, description: "Configuración de servidores y cloud", active: false },
];

interface Category {
  name: string;
  icon: string;
  rate: number;
  description: string;
  active: boolean;
}

interface CreateServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateServiceModal({ open, onOpenChange, onSuccess }: CreateServiceModalProps) {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", rate: "", description: "", icon: "Code" });

  const iconOptions = [
    { name: "Code", icon: Code },
    { name: "Database", icon: Database },
    { name: "Bug", icon: Bug },
    { name: "Headphones", icon: Headphones },
    { name: "Briefcase", icon: Briefcase },
    { name: "Users", icon: Users },
    { name: "PenTool", icon: PenTool },
    { name: "Server", icon: Server },
    { name: "Shield", icon: Shield },
  ];

  const getIconComponent = (iconName: string) => {
    return SERVICE_ICONS[iconName] || Wrench;
  };

  const handleSelectCategory = (category: Category) => {
    setSelectedCategory(category);
  };

  const handleSubmit = async () => {
    if (!selectedCategory) {
      toast.error("Selecciona una categoría");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("services")
        .insert({
          name: selectedCategory.name,
          default_hourly_rate: selectedCategory.rate,
          description: selectedCategory.description,
        });

      if (error) throw error;

      toast.success(`Servicio "${selectedCategory.name}" creado correctamente`);
      setSelectedCategory(null);
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) {
      toast.error("Ingresa el nombre de la categoría");
      return;
    }
    if (!newCategory.rate) {
      toast.error("Ingresa la tarifa por hora");
      return;
    }

    const rateNum = parseFloat(newCategory.rate);
    if (isNaN(rateNum)) {
      toast.error("La tarifa debe ser un número válido");
      return;
    }

    const newCat: Category = {
      name: newCategory.name.trim(),
      icon: newCategory.icon,
      rate: rateNum,
      description: newCategory.description,
      active: true,
    };

    setCategories([...categories, newCat]);
    setNewCategory({ name: "", rate: "", description: "", icon: "Code" });
    setShowAddModal(false);
    toast.success("Categoría agregada");
  };

  const handleToggleCategory = (categoryName: string) => {
    setCategories(categories.map(cat =>
      cat.name === categoryName ? { ...cat, active: !cat.active } : cat
    ));
  };

  const activeCategories = categories.filter(c => c.active);
  const inactiveCategories = categories.filter(c => !c.active);

  const resetForm = () => {
    setSelectedCategory(null);
  };

  return (
    <>
      {/* Modal principal */}
      <Dialog open={open} onOpenChange={(newOpen) => {
        if (!newOpen) resetForm();
        onOpenChange(newOpen);
      }}>
        <DialogContent className="max-w-md bg-card border-border p-0 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-emerald-500/10 to-transparent border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20">
                  <Wrench className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-foreground">
                    Nuevo Servicio
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    Selecciona una categoría
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowManageModal(true)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                title="Gestionar categorías"
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          <div className="p-5 max-h-[55vh] overflow-y-auto">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-foreground">Categorías disponibles</Label>
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  Agregar categoría
                </button>
              </div>

              {activeCategories.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No hay categorías disponibles</p>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="text-xs text-emerald-600 mt-2"
                  >
                    + Agregar una
                  </button>
                </div>
              ) : (
                <div className="grid gap-2">
                  {activeCategories.map((category) => {
                    const Icon = getIconComponent(category.icon);
                    const isSelected = selectedCategory?.name === category.name;
                    return (
                      <div
                        key={category.name}
                        onClick={() => handleSelectCategory(category)}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-500/5"
                            : "border-border hover:border-emerald-500/50 hover:bg-muted/20"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isSelected ? "bg-emerald-500/20" : "bg-muted"}`}>
                            <Icon className={`h-4 w-4 ${isSelected ? "text-emerald-500" : "text-muted-foreground"}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground">{category.name}</p>
                              {isSelected && <Check className="h-3.5 w-3.5 text-emerald-500" />}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{category.description}</p>
                            <p className="text-xs font-semibold text-emerald-600 mt-1">${category.rate}/hora</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="p-5 pt-0 gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-lg">
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedCategory}
              className="rounded-lg gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? "Creando..." : "Crear Servicio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para agregar nueva categoría */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md bg-card border-border p-0 rounded-2xl overflow-hidden">
          <div className="p-5 bg-gradient-to-r from-emerald-500/10 to-transparent border-b border-border">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20">
                <Plus className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-foreground">
                  Agregar Categoría
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Crea una nueva categoría de servicio
                </p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <Label className="text-sm font-medium text-foreground">Nombre</Label>
              <Input
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="Ej: Desarrollo Mobile"
                className="mt-1.5 bg-muted/30 border-border"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-foreground">Tarifa por hora ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={newCategory.rate}
                onChange={(e) => setNewCategory({ ...newCategory, rate: e.target.value })}
                placeholder="25.00"
                className="mt-1.5 bg-muted/30 border-border"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-foreground">Icono</Label>
              <div className="grid grid-cols-6 gap-2 mt-1.5">
                {iconOptions.map((icon) => {
                  const IconComp = icon.icon;
                  return (
                    <button
                      key={icon.name}
                      type="button"
                      onClick={() => setNewCategory({ ...newCategory, icon: icon.name })}
                      className={`p-2 rounded-lg transition-all ${
                        newCategory.icon === icon.name
                          ? "bg-emerald-500/20 text-emerald-500"
                          : "bg-muted/30 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <IconComp className="h-4 w-4 mx-auto" />
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-foreground">Descripción (opcional)</Label>
              <textarea
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="Describe el servicio..."
                rows={2}
                className="mt-1.5 w-full px-3 py-2 text-sm bg-muted/30 border border-border rounded-lg resize-none focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <DialogFooter className="p-5 pt-0 gap-2">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancelar</Button>
            <Button onClick={handleAddCategory} className="bg-emerald-600 hover:bg-emerald-700">Agregar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para gestionar categorías (ocultar/mostrar) */}
      <Dialog open={showManageModal} onOpenChange={setShowManageModal}>
        <DialogContent className="max-w-md bg-card border-border p-0 rounded-2xl overflow-hidden">
          <div className="p-5 bg-gradient-to-r from-emerald-500/10 to-transparent border-b border-border">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20">
                <Settings className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-foreground">
                  Gestionar Categorías
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Muestra u oculta categorías
                </p>
              </div>
            </div>
          </div>
          <div className="p-5 max-h-[50vh] overflow-y-auto space-y-4">
            <div>
              <Label className="text-sm font-medium text-foreground mb-2 block">Categorías visibles</Label>
              <div className="space-y-2">
                {activeCategories.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
                    <span className="text-sm text-foreground">{cat.name}</span>
                    <button
                      onClick={() => handleToggleCategory(cat.name)}
                      className="p-1 rounded hover:bg-muted transition-colors"
                    >
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                ))}
                {activeCategories.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No hay categorías visibles</p>
                )}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-foreground mb-2 block">Categorías ocultas</Label>
              <div className="space-y-2">
                {inactiveCategories.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
                    <span className="text-sm text-muted-foreground">{cat.name}</span>
                    <button
                      onClick={() => handleToggleCategory(cat.name)}
                      className="p-1 rounded hover:bg-muted transition-colors"
                    >
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                ))}
                {inactiveCategories.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No hay categorías ocultas</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="p-5 pt-0">
            <Button onClick={() => setShowManageModal(false)} className="w-full">Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}