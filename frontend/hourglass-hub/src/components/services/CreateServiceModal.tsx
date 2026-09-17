import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Check, X, DollarSign, Wrench, FolderKanban } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getCategoryIconKey } from "./serviceIcons";
import {
  useServiceCategories,
  useCreateService,
  useCreateServiceCategory,
  useDeleteServiceCategory,
} from "@/hooks/useServices";

interface CreateServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateServiceModal({ open, onOpenChange, onSuccess }: CreateServiceModalProps) {
  const { data: categories = [], isLoading: categoriesLoading } = useServiceCategories();
  const createService = useCreateService();
  const createCategory = useCreateServiceCategory();
  const deleteCategory = useDeleteServiceCategory();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [hourlyRate, setHourlyRate] = useState("");

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) || null;
  const isSubmitting = createService.isPending || createCategory.isPending;

  const handleSubmit = () => {
    if (!selectedCategory) return;
    const rate = Number(hourlyRate);
    if (!hourlyRate || isNaN(rate) || rate <= 0) {
      toast.error("La tarifa por hora es obligatoria");
      return;
    }
    createService.mutate(
      {
        name: selectedCategory.name,
        description: selectedCategory.description || null,
        categoryId: selectedCategory.id,
        hourlyRate: rate,
        icon: getCategoryIconKey(selectedCategory.name),
      },
      {
        onSuccess: () => {
          setSelectedCategoryId("");
          setHourlyRate("");
          onSuccess?.();
          onOpenChange(false);
        },
      }
    );
  };

  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (!name || createCategory.isPending) return;
    createCategory.mutate(
      { name },
      {
        onSuccess: (created) => {
          setNewCategoryName("");
          const createdRecord = created as { id?: string; data?: { id?: string } };
          const createdId = createdRecord?.id || createdRecord?.data?.id;
          if (createdId) {
            setSelectedCategoryId(createdId);
          }
        },
      }
    );
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (deletingCategoryId) return;
    setDeletingCategoryId(categoryId);
    deleteCategory.mutate(categoryId, {
      onSuccess: () => {
        if (selectedCategoryId === categoryId) setSelectedCategoryId("");
      },
      onSettled: () => setDeletingCategoryId(null),
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedCategoryId("");
      setNewCategoryName("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden rounded-2xl border-border/60 bg-card p-0">
        <DialogHeader className="border-b border-border/40 bg-gradient-to-r from-[#0DA2E7]/10 via-[#0DA2E7]/5 to-transparent p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0DA2E7]/10 text-[#0DA2E7] ring-4 ring-[#0DA2E7]/10">
              <Wrench className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">Nuevo Servicio</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Selecciona una categoría para crear el servicio
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[55vh] space-y-4 overflow-y-auto p-5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <FolderKanban className="h-3.5 w-3.5 text-[#0DA2E7]" />
              Categorías disponibles
            </span>
            <span className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px] text-muted-foreground">
              {categories.length}
            </span>
          </div>

          {categories.length === 0 && !categoriesLoading ? (
            <div className="rounded-xl border border-dashed border-border/60 p-6 text-center">
              <p className="text-sm text-muted-foreground">No hay categorías registradas.</p>
              <p className="mt-1 text-xs text-muted-foreground/70">Crea la primera con el formulario de abajo.</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {categories.map((category) => {
                const isSelected = selectedCategoryId === category.id;
                return (
                  <div
                    key={category.id}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl border p-3 transition-all",
                      isSelected
                        ? "border-[#0DA2E7] bg-[#0DA2E7]/5"
                        : "border-border hover:border-[#0DA2E7]/40 hover:bg-muted/20"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryId(category.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                          {category.name}
                          {isSelected && <Check className="h-3.5 w-3.5 text-[#0DA2E7]" />}
                        </span>
                        {category.description && (
                          <span className="block truncate text-xs text-muted-foreground">{category.description}</span>
                        )}
                      </span>
                    </button>
                    <button
                      type="button"
                      title="Eliminar categoría"
                      onClick={() => handleDeleteCategory(category.id)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      {deletingCategoryId === category.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="rounded-xl border border-border/40 bg-muted/20 p-2.5">
            <div className="flex items-center gap-1.5">
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
                placeholder="Nueva categoría…"
                className="h-8 rounded-lg border-border/60 bg-background px-2.5 text-xs focus-visible:ring-[#0DA2E7]/40"
              />
              <Button
                type="button"
                size="icon"
                title="Agregar categoría"
                disabled={createCategory.isPending || !newCategoryName.trim()}
                onClick={handleAddCategory}
                className="h-8 w-8 shrink-0 rounded-lg bg-[#0DA2E7] text-white hover:bg-[#0B91D2]"
              >
                {createCategory.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-semibold text-foreground">Tarifa por hora</span>
            <div className="relative">
              <DollarSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="number"
                step="0.5"
                min="0"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="h-10 rounded-lg border-border/60 bg-background pl-9 pr-3 text-sm focus-visible:ring-[#0DA2E7]/40"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 border-t border-border/40 p-5 pt-3">
          <Button variant="outline" onClick={() => handleOpenChange(false)} className="h-9 rounded-lg border-border/60 px-3 text-xs font-medium">
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedCategory}
            className="h-9 gap-1.5 rounded-lg bg-[#0DA2E7] px-4 text-xs font-semibold text-white hover:bg-[#0B91D2]"
          >
            {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isSubmitting ? "Creando…" : "Crear Servicio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}