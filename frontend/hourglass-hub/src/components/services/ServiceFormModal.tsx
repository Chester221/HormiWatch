import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  X, DollarSign, FolderKanban, Loader2, Check, ChevronDown, Plus,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ICON_OPTIONS, pickServiceColor } from "./serviceIcons";
import {
  useServiceCategories,
  useCreateService,
  useUpdateService,
  useCreateServiceCategory,
  useDeleteServiceCategory,
  type Service,
} from "@/hooks/useServices";

// ============================================
// ESQUEMA DE VALIDACIÓN
// ============================================
const serviceSchema = z.object({
  name: z.string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede superar los 100 caracteres"),
  category_id: z.string().min(1, "Selecciona una categoría"),
  hourlyRate: z.coerce.number().min(0, "La tarifa no puede ser negativa"),
  description: z.string().optional(),
  icon: z.string().min(1, "Selecciona un icono"),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

interface ServiceFormModalProps {
  open: boolean;
  service: Service | null;
  onOpenChange: (open: boolean) => void;
}

const TRIGGER_CLASS =
  "flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-border/60 bg-background px-3 text-sm transition-colors hover:border-[#0DA2E7]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0DA2E7]/40";

export function ServiceFormModal({ open, service, onOpenChange }: ServiceFormModalProps) {
  const editing = Boolean(service);
  const [error, setError] = useState<string | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [iconPage, setIconPage] = useState(0);

  const { data: categories = [], isLoading: categoriesLoading } = useServiceCategories();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const createCategory = useCreateServiceCategory();
  const deleteCategory = useDeleteServiceCategory();
  const isPending = createService.isPending || updateService.isPending;

  const ICONS_PER_PAGE = 12;
  const iconTotalPages = Math.ceil(ICON_OPTIONS.length / ICONS_PER_PAGE);
  const visibleIcons = ICON_OPTIONS.slice(
    iconPage * ICONS_PER_PAGE,
    iconPage * ICONS_PER_PAGE + ICONS_PER_PAGE
  );

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      category_id: "",
      hourlyRate: 0,
      description: "",
      icon: "",
    },
  });

  const selectedIconName = form.watch("icon");
  const selectedIcon = ICON_OPTIONS.find((o) => o.name === selectedIconName) || ICON_OPTIONS[0];
  const selectedColor = pickServiceColor(form.watch("name") || service?.name);
  const selectedCategory = categories.find((c) => c.id === form.watch("category_id")) || null;

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (service) {
      const iconIndex = ICON_OPTIONS.findIndex((o) => o.name === service.icon);
      form.reset({
        name: service.name,
        category_id: service.category?.id || service.category_id || "",
        hourlyRate: service.hourlyRate ?? service.default_hourly_rate ?? 0,
        description: service.description ?? "",
        icon: service.icon ?? "",
      });
      setIconPage(iconIndex >= ICONS_PER_PAGE ? 1 : 0);
    } else {
      form.reset({
        name: "",
        category_id: "",
        hourlyRate: 0,
        description: "",
        icon: "",
      });
      setIconPage(0);
    }
  }, [open, service, form]);

  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (!name || createCategory.isPending) return;
    createCategory.mutate(
      { name },
      {
        onSuccess: (created) => {
          setNewCategoryName("");
          setCategoryOpen(true);
          const createdRecord = created as { id?: string; data?: { id?: string } };
          const createdId = createdRecord?.id || createdRecord?.data?.id;
          if (createdId) {
            form.setValue("category_id", createdId, { shouldDirty: true });
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
        if (form.getValues("category_id") === categoryId) {
          form.setValue("category_id", "");
        }
      },
      onSettled: () => setDeletingCategoryId(null),
    });
  };

  const onSubmit = (data: ServiceFormValues) => {
    const payload = {
      name: data.name,
      description: data.description || null,
      categoryId: data.category_id,
      hourlyRate: Number(data.hourlyRate),
      icon: data.icon,
    };

    if (service) {
      updateService.mutate(
        { id: service.id, data: payload },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createService.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden rounded-2xl border-border/60 bg-card p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{editing ? "Editar servicio" : "Nuevo servicio"}</DialogTitle>
          <DialogDescription>
            {editing ? "Modifica la información del servicio" : "Completa los datos para registrar un nuevo servicio"}
          </DialogDescription>
        </DialogHeader>

        {/* Cabecera */}
        <div className="bg-gradient-to-r from-[#0DA2E7]/10 via-[#0DA2E7]/5 to-transparent px-6 pb-5 pt-6">
          <div className="flex items-center gap-4">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-colors duration-300"
              style={{ backgroundColor: `${selectedColor}1A`, color: selectedColor, boxShadow: `0 0 0 4px ${selectedColor}14` }}
            >
              <selectedIcon.icon className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold leading-tight text-foreground">
                {editing ? "Editar servicio" : "Nuevo servicio"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {editing
                  ? `Modificando: ${service?.name}`
                  : "Completa los datos para registrar un nuevo servicio en el catálogo"}
              </p>
            </div>
          </div>
        </div>

        {/* Cuerpo */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="max-h-[calc(100vh-12rem)] space-y-4 overflow-y-auto px-6 py-5">
            {/* Nombre */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-foreground">Nombre del servicio</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ej. Desarrollo de aplicaciones web"
                      className="h-10 rounded-lg border-border/60 bg-background text-sm focus-visible:ring-[#0DA2E7]/40"
                    />
                  </FormControl>
                  <FormMessage className="text-[11px]" />
                </FormItem>
              )}
            />

            {/* Categoría y tarifa */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-foreground">Categoría</FormLabel>
                    <DropdownMenu open={categoryOpen} onOpenChange={setCategoryOpen}>
                      <DropdownMenuTrigger asChild>
                        <button type="button" className={TRIGGER_CLASS}>
                          {selectedCategory ? (
                            <span className="truncate font-medium text-foreground">{selectedCategory.name}</span>
                          ) : (
                            <span className="text-muted-foreground">
                              {categoriesLoading ? "Cargando categorías…" : "Selecciona una categoría"}
                            </span>
                          )}
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                              categoryOpen && "rotate-180"
                            )}
                          />
                        </button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent
                        align="start"
                        sideOffset={6}
                        collisionPadding={12}
                        className="max-h-80 w-[min(280px,calc(100vw-2rem))] rounded-2xl border-border/60 bg-card p-0 shadow-2xl"
                      >
                        {/* Cabecera */}
                        <div className="flex items-center justify-between border-b border-border/40 px-3 py-2.5">
                          <span className="flex items-center gap-2 text-xs font-semibold text-foreground">
                            <FolderKanban className="h-3.5 w-3.5 text-[#0DA2E7]" />
                            Categorías
                          </span>
                          <span className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                            {categories.length}
                          </span>
                        </div>

                        {/* Lista */}
                        <div className="max-h-44 space-y-0.5 overflow-y-auto p-1.5">
                          {categories.length === 0 && !categoriesLoading && (
                            <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                              No hay categorías registradas. Crea la primera abajo.
                            </p>
                          )}
                          {categories.map((category) => {
                            const active = field.value === category.id;
                            return (
                              <div
                                key={category.id}
                                className={cn(
                                  "group flex items-center rounded-lg transition-colors",
                                  active ? "bg-[#0DA2E7]/10" : "hover:bg-muted/50"
                                )}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    field.onChange(category.id);
                                    setCategoryOpen(false);
                                  }}
                                  className="flex min-w-0 flex-1 items-center gap-2.5 px-2.5 py-2 text-left"
                                >
                                  <span className="truncate text-xs font-medium text-foreground">{category.name}</span>
                                  {active && <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-[#0DA2E7]" />}
                                </button>
                                <button
                                  type="button"
                                  title="Eliminar categoría"
                                  onClick={() => handleDeleteCategory(category.id)}
                                  className="mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-red-50 hover:text-red-500"
                                >
                                  {deletingCategoryId === category.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <X className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        {/* Agregar categoría */}
                        <div className="border-t border-border/40 p-2">
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
                          <p className="mt-1.5 px-1 text-[10px] text-muted-foreground/70">
                            La categoría se guarda y queda disponible en todo el sistema.
                          </p>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hourlyRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-foreground">Tarifa por hora</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          {...field}
                          className="h-10 rounded-lg border-border/60 bg-background pl-9 pr-3 text-sm focus-visible:ring-[#0DA2E7]/40"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />
            </div>

            {/* Icono */}
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                      <div className="mb-2.5 flex items-center justify-between gap-3">
                        <FormLabel className="text-xs font-semibold text-foreground">
                          Icono representativo
                        </FormLabel>
                        {selectedIconName ? (
                          <span className="inline-flex max-w-[60%] items-center gap-1.5 truncate rounded-full border border-[#0DA2E7]/30 bg-[#0DA2E7]/10 px-2 py-0.5 text-[10px] font-medium text-[#0DA2E7]">
                            {(() => {
                              const option = ICON_OPTIONS.find((o) => o.name === selectedIconName);
                              return option ? <option.icon className="h-3 w-3 shrink-0" /> : null;
                            })()}
                            <span className="truncate">{field.value}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/70">
                            Haz clic en un icono…
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-6 gap-1.5">
                        {visibleIcons.map((option) => {
                          const active = selectedIconName === option.name;
                          return (
                            <button
                              key={option.name}
                              type="button"
                              title={option.name}
                              onClick={() => field.onChange(option.name)}
                              className={cn(
                                "flex aspect-square items-center justify-center rounded-xl border transition-all duration-200",
                                "hover:scale-105 hover:border-[#0DA2E7]/40",
                                active
                                  ? "border-[#0DA2E7] bg-[#0DA2E7]/10 text-[#0DA2E7] shadow-[0_4px_14px_-6px_rgba(13,162,231,0.55)] ring-2 ring-[#0DA2E7]/20"
                                  : "border-border/50 bg-background text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                              )}
                            >
                              <option.icon className="h-5 w-5" style={{ color: active ? "#0DA2E7" : "currentColor" }} />
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border/40 pt-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            title="Iconos anteriores"
                            disabled={iconPage === 0}
                            onClick={() => setIconPage((p) => Math.max(0, p - 1))}
                            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-[#0DA2E7]/10 hover:text-[#0DA2E7] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                          >
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </button>
                          <span className="min-w-[28px] text-center text-[10px] font-medium text-muted-foreground">
                            {iconPage + 1}/{iconTotalPages}
                          </span>
                          <button
                            type="button"
                            title="Más iconos"
                            disabled={iconPage >= iconTotalPages - 1}
                            onClick={() => setIconPage((p) => Math.min(iconTotalPages - 1, p + 1))}
                            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-[#0DA2E7]/10 hover:text-[#0DA2E7] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="text-[10px] text-muted-foreground/70">
                          {ICON_OPTIONS.length} iconos disponibles
                        </span>
                      </div>
                    </div>
                  </FormControl>
                  <p className="mt-1.5 px-1 text-[10px] text-muted-foreground/70">
                    Este icono identifica al servicio en catálogos y vistas.
                  </p>
                  <FormMessage className="text-[11px]" />
                </FormItem>
              )}
            />

            {/* Descripción */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-foreground">Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe en qué consiste este servicio…"
                      className="min-h-[80px] resize-none rounded-lg border-border/60 bg-background text-sm focus-visible:ring-[#0DA2E7]/40"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-[11px] font-medium text-red-600">{error}</p>
            )}

            {/* Pie */}
            <div className="flex items-center justify-end gap-2 border-t border-border/40 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-9 rounded-lg border-border/60 px-3 text-xs font-medium"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="h-9 gap-1.5 rounded-lg bg-[#0DA2E7] px-4 text-xs font-semibold text-white hover:bg-[#0B91D2]"
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {editing ? "Guardar cambios" : "Crear servicio"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}