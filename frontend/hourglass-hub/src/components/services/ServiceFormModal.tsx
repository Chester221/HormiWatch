import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Loader2,
  Wrench,
  DollarSign,
  FolderKanban,
  Plus,
  Tag,
  Code,
  BarChart3,
  Palette,
  Briefcase,
  Server,
  Landmark,
  ClipboardCheck,
  Search,
  Pencil,
  Save,
  X,
  Eye,
  Calendar,
  Check,
  Settings,
  Grid3x3,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
// ✅ IMPORT CORREGIDO
import { useServiceCategories } from "@/hooks/useServices";

// ============================================
// CONSTANTES Y MAPEOS
// ============================================

const HORMI_BLUE = '#0DA2E7';

// ICONOS DISPONIBLES PARA SELECCIONAR
const AVAILABLE_ICONS = [
  { name: "Wrench", icon: Wrench },
  { name: "Code", icon: Code },
  { name: "BarChart3", icon: BarChart3 },
  { name: "Palette", icon: Palette },
  { name: "Briefcase", icon: Briefcase },
  { name: "Server", icon: Server },
  { name: "Landmark", icon: Landmark },
  { name: "ClipboardCheck", icon: ClipboardCheck },
  { name: "Search", icon: Search },
  { name: "Tag", icon: Tag },
];

const categoryIcons: Record<string, any> = {
  "Desarrollo": Code,
  "Evaluación": Search,
  "Mantenimiento": Wrench,
  "Integración Bancaria": Landmark,
  "Análisis de Datos": BarChart3,
  "Infraestructura": Server,
  "Diseño": Palette,
  "Consultoría": Briefcase,
  "Consulta": ClipboardCheck,
};

const categoryColors: Record<string, string> = {
  "Desarrollo": "bg-blue-500/10 text-blue-600 border-blue-200",
  "Evaluación": "bg-purple-500/10 text-purple-600 border-purple-200",
  "Mantenimiento": "bg-orange-500/10 text-orange-600 border-orange-200",
  "Integración Bancaria": "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  "Análisis de Datos": "bg-cyan-500/10 text-cyan-600 border-cyan-200",
  "Infraestructura": "bg-indigo-500/10 text-indigo-600 border-indigo-200",
  "Diseño": "bg-pink-500/10 text-pink-600 border-pink-200",
  "Consultoría": "bg-amber-500/10 text-amber-600 border-amber-200",
  "Consulta": "bg-teal-500/10 text-teal-600 border-teal-200",
};

// ============================================
// ESQUEMA DE VALIDACIÓN
// ============================================

const serviceSchema = z.object({
  name: z.string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  category_id: z.string().min(1, "Selecciona una categoría"),
  description: z.string()
    .max(500, "La descripción no puede exceder 500 caracteres")
    .optional()
    .nullable(),
  default_hourly_rate: z.number()
    .min(0, "La tarifa no puede ser negativa")
    .max(9999, "La tarifa no puede exceder $9,999"),
  is_active: z.boolean().default(true),
  icon: z.string().optional().nullable(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

interface ServiceFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Service | null;
}

export function ServiceFormModal({
  open,
  onOpenChange,
  service,
}: ServiceFormModalProps) {
  const isEditing = !!service;
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const queryClient = useQueryClient();

  // ✅ USAR EL HOOK CORRECTAMENTE
  const { data: categoriesData, isLoading: categoriesLoading } = useServiceCategories();

  // ESTADOS SIMPLIFICADOS
  const [selectedIconName, setSelectedIconName] = useState<string | null>(null);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [configDialog, setConfigDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfigComplete, setIsConfigComplete] = useState(false);

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      category_id: "",
      description: "",
      default_hourly_rate: 0,
      is_active: true,
      icon: null,
    },
  });

  // Cargar categorías desde el hook
  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      // Usar el hook en lugar de supabase directamente
      // Pero para mantener la compatibilidad, usamos supabase directamente
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .order('name');
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      toast.error('Error al cargar categorías');
    } finally {
      setLoadingCategories(false);
    }
  };

  // Resetear estado al abrir/cerrar modal
  useEffect(() => {
    if (open) {
      fetchCategories();
      
      if (service) {
        // Edición
        const active = service.is_active !== undefined ? service.is_active : true;
        form.reset({
          name: service.name || "",
          category_id: service.category_id || "",
          description: service.description || "",
          default_hourly_rate: service.default_hourly_rate || 0,
          is_active: active,
          icon: service.icon || null,
        });
        setSelectedIconName(service.icon || null);
        setIsConfigComplete(!!service.icon);
      } else {
        // Nuevo servicio
        form.reset({
          name: "",
          category_id: "",
          description: "",
          default_hourly_rate: 0,
          is_active: true,
          icon: null,
        });
        setSelectedIconName(null);
        setIsConfigComplete(false);
      }
    }
  }, [open, service, form]);

  // ============================================
  // HANDLERS
  // ============================================

  // Handler para crear categoría desde el modal "+"
  const handleCategoryCreate = async () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      toast.error("El nombre de la categoría es obligatorio");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('service_categories')
        .insert({
          name: trimmedName,
          description: newCategoryDesc.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchCategories();

      if (data) {
        form.setValue('category_id', data.id);
        toast.success(`Categoría "${trimmedName}" creada`);
      }

      setCategoryDialog(false);
      setNewCategoryName("");
      setNewCategoryDesc("");
      
      // Abrir config automáticamente después de crear categoría
      setConfigDialog(true);
    } catch (error: any) {
      toast.error(`Error al crear categoría: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler para seleccionar icono
  const handleIconSelect = (iconName: string) => {
    setSelectedIconName(iconName);
    form.setValue('icon', iconName);
    setIsConfigComplete(true);
  };

  // Handler para guardar configuración
  const handleSaveConfig = () => {
    if (!selectedIconName) {
      toast.error("Selecciona un icono");
      return;
    }
    setConfigDialog(false);
    toast.success("✅ Configuración guardada");
  };

  // Handler para crear/editar servicio
  const handleSubmit = async (data: ServiceFormData) => {
    if (!selectedIconName && !isEditing) {
      toast.error("Configura el icono del servicio");
      setConfigDialog(true);
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && service) {
        // Editar
        const { error } = await supabase
          .from('services')
          .update({
            name: data.name,
            category_id: data.category_id,
            description: data.description || null,
            default_hourly_rate: data.default_hourly_rate,
            is_active: data.is_active,
            icon: selectedIconName || data.icon,
          })
          .eq('id', service.id);
        if (error) throw error;
        toast.success("✅ Servicio actualizado exitosamente");
      } else {
        // Crear
        const { error } = await supabase
          .from('services')
          .insert({
            name: data.name,
            category_id: data.category_id,
            description: data.description || null,
            default_hourly_rate: data.default_hourly_rate,
            is_active: data.is_active,
            icon: selectedIconName,
          });
        if (error) throw error;
        toast.success("✅ Servicio creado exitosamente");
      }
      
      queryClient.invalidateQueries({ queryKey: ['services'] });
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`❌ Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryIcon = (categoryName: string) => {
    return categoryIcons[categoryName] || Tag;
  };

  const getCategoryColor = (categoryName: string) => {
    return categoryColors[categoryName] || "bg-muted/30 text-muted-foreground border-muted";
  };

  // ============================================
  // RENDER
  // ============================================

  const watchedName = form.watch("name");
  const watchedRate = form.watch("default_hourly_rate");
  const watchedCategory = form.watch("category_id");
  const selectedCategory = categories.find(c => c.id === watchedCategory);
  const watchedActive = form.watch("is_active");
  
  // Determinar si el botón "Crear Servicio" debe estar habilitado
  const canSubmit = !isEditing 
    ? (watchedName?.length >= 2 && watchedCategory && isConfigComplete)
    : (watchedName?.length >= 2 && watchedCategory);

  return (
    <>
      {/* MODAL PRINCIPAL */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[520px] bg-card border-border p-0 overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-[#0DA2E7]/10 via-[#0DA2E7]/5 to-transparent border-b border-border/50">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0DA2E7]/20 ring-4 ring-[#0DA2E7]/10">
                  {isEditing ? (
                    <Pencil className="h-5 w-5" style={{ color: HORMI_BLUE }} />
                  ) : (
                    <Wrench className="h-5 w-5" style={{ color: HORMI_BLUE }} />
                  )}
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                    {isEditing ? "Editar Servicio" : "Nuevo Servicio"}
                    {isEditing && service?.is_active !== undefined && (
                      <Badge 
                        variant="outline" 
                        className={`text-[9px] px-2 py-0 ${
                          service.is_active 
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' 
                            : 'bg-red-500/10 text-red-600 border-red-200'
                        }`}
                      >
                        {service.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    )}
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isEditing 
                      ? `Modificando: ${service?.name}` 
                      : "Completa los datos del nuevo servicio"}
                  </p>
                </div>
              </div>
              {isEditing && service?.created_at && (
                <div className="text-right">
                  <p className="text-[9px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(service.created_at).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Formulario */}
          <div className="p-5 max-h-[60vh] overflow-y-auto">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                {/* Nombre */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium flex items-center gap-1">
                        Nombre del Servicio <span className="text-red-500">*</span>
                        <span className="text-[9px] text-muted-foreground font-normal ml-auto">
                          {field.value?.length || 0}/100
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: Desarrollo de API Bancaria"
                          className="h-9 text-sm bg-background border-border focus:ring-[#0DA2E7] focus:border-[#0DA2E7] transition-all"
                          {...field}
                          maxLength={100}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Categoría y Tarifa */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">
                          Categoría <span className="text-red-500">*</span>
                        </FormLabel>
                        <div className="flex gap-1.5">
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={loadingCategories}
                          >
                            <FormControl>
                              <SelectTrigger className="h-9 text-sm bg-background border-border flex-1 transition-all focus:ring-[#0DA2E7] focus:border-[#0DA2E7]">
                                <FolderKanban className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                                <SelectValue placeholder="Categoría" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((cat) => {
                                const Icon = getCategoryIcon(cat.name);
                                return (
                                  <SelectItem key={cat.id} value={cat.id}>
                                    <span className="flex items-center gap-2">
                                      <Icon className="h-3.5 w-3.5" />
                                      {cat.name}
                                    </span>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          
                          {/* Botón "+" para agregar categoría */}
                          {!isEditing && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-9 w-9 shrink-0 hover:border-[#0DA2E7] hover:text-[#0DA2E7] hover:bg-[#0DA2E7]/5 transition-all"
                                    onClick={() => {
                                      setCategoryDialog(true);
                                      setNewCategoryName("");
                                      setNewCategoryDesc("");
                                    }}
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  <p className="text-xs">Agregar categoría</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="default_hourly_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">
                          Tarifa por Hora ($) <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              className="pl-8 h-9 text-sm bg-background border-border focus:ring-[#0DA2E7] focus:border-[#0DA2E7] transition-all"
                              {...field}
                              onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Descripción */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium flex items-center gap-1">
                        Descripción
                        <span className="text-[9px] text-muted-foreground font-normal ml-auto">
                          {field.value?.length || 0}/500
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe el servicio, alcance, entregables..."
                          className="resize-none bg-background border-border text-sm focus:ring-[#0DA2E7] focus:border-[#0DA2E7] transition-all"
                          rows={3}
                          {...field}
                          value={field.value || ""}
                          maxLength={500}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Estado Activo/Inactivo (solo en edición) */}
                {isEditing && (
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50">
                        <div>
                          <FormLabel className="text-xs font-medium">
                            Estado del Servicio
                          </FormLabel>
                          <p className="text-[10px] text-muted-foreground">
                            {field.value ? 'Visible y disponible para técnicos' : 'Oculto y no disponible'}
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-[#0DA2E7]"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}

                {/* BOTÓN PARA CONFIGURAR ICONO (nuevo servicio) */}
                {!isEditing && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/50">
                    <div className="flex-1">
                      <Label className="text-xs font-medium flex items-center gap-2">
                        <Grid3x3 className="h-3.5 w-3.5" />
                        Configuración del icono
                        <span className="text-red-500">*</span>
                      </Label>
                      <p className="text-[10px] text-muted-foreground">
                        {isConfigComplete 
                          ? `✅ Icono seleccionado: ${selectedIconName}` 
                          : "Selecciona un icono para el servicio"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant={isConfigComplete ? "default" : "outline"}
                      size="sm"
                      className={`h-8 gap-1.5 text-xs ${
                        isConfigComplete 
                          ? 'text-white' 
                          : 'hover:border-[#0DA2E7] hover:text-[#0DA2E7]'
                      }`}
                      style={isConfigComplete ? { backgroundColor: HORMI_BLUE } : {}}
                      onClick={() => setConfigDialog(true)}
                    >
                      {isConfigComplete ? (
                        <>
                          <Check className="h-3 w-3" />
                          Configurado
                        </>
                      ) : (
                        <>
                          <Settings className="h-3 w-3" />
                          Configurar
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Icono seleccionado (edición) */}
                {isEditing && selectedIconName && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 border border-border/50">
                    <span className="text-xs font-medium text-muted-foreground">Icono:</span>
                    <Badge className="bg-[#0DA2E7] text-white border-none">
                      {selectedIconName}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs ml-auto"
                      onClick={() => setConfigDialog(true)}
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Cambiar
                    </Button>
                  </div>
                )}

                {/* Vista previa */}
                {(watchedName || watchedCategory || watchedRate > 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg bg-gradient-to-r from-[#0DA2E7]/5 to-transparent p-3 border border-[#0DA2E7]/20"
                  >
                    <div className="flex items-center gap-2">
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        Vista previa
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mt-1.5">
                      {selectedCategory && (
                        <Badge 
                          variant="outline" 
                          className={`${getCategoryColor(selectedCategory.name)} border text-[10px] px-2 py-0`}
                        >
                          {selectedCategory.name}
                        </Badge>
                      )}
                      {watchedName && (
                        <span className="font-medium text-sm text-foreground">
                          {watchedName}
                        </span>
                      )}
                      {watchedRate > 0 && (
                        <span className="text-sm font-semibold text-emerald-600 flex items-center gap-0.5 ml-auto">
                          <DollarSign className="h-3 w-3" />
                          {watchedRate.toFixed(2)}/hr
                        </span>
                      )}
                      {selectedIconName && (
                        <Badge className="bg-[#0DA2E7] text-white border-none text-[9px] px-2 py-0">
                          {selectedIconName}
                        </Badge>
                      )}
                      {isEditing && (
                        <Badge 
                          variant="outline" 
                          className={`text-[9px] px-2 py-0 ${
                            watchedActive 
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' 
                              : 'bg-red-500/10 text-red-600 border-red-200'
                          }`}
                        >
                          {watchedActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Acciones */}
                <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isSubmitting}
                    className="h-8 text-xs hover:bg-muted/50 transition-all"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !canSubmit}
                    className="h-8 gap-1.5 text-xs text-white shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: HORMI_BLUE }}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Save className="h-3 w-3" />
                    )}
                    {isEditing ? "Guardar Cambios" : "Crear Servicio"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL AGREGAR CATEGORÍA */}
      <Dialog open={categoryDialog} onOpenChange={setCategoryDialog}>
        <DialogContent className="sm:max-w-[400px] bg-card border-border p-0 overflow-hidden">
          <div className="p-4 bg-gradient-to-br from-[#0DA2E7]/10 via-[#0DA2E7]/5 to-transparent border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0DA2E7]/20 ring-4 ring-[#0DA2E7]/10">
                <Tag className="h-4 w-4" style={{ color: HORMI_BLUE }} />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Agregar Categoría
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Crea una nueva categoría para el servicio
                </p>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-medium">
                  Nombre <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Ej: Mantenimiento Preventivo"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  className="h-8 text-sm mt-1 bg-background border-border focus:ring-[#0DA2E7] focus:border-[#0DA2E7] transition-all"
                  onKeyDown={e => e.key === 'Enter' && handleCategoryCreate()}
                />
              </div>
              <div>
                <Label className="text-xs font-medium">Descripción (opcional)</Label>
                <Input
                  placeholder="Breve descripción de la categoría"
                  value={newCategoryDesc}
                  onChange={e => setNewCategoryDesc(e.target.value)}
                  className="h-8 text-sm mt-1 bg-background border-border focus:ring-[#0DA2E7] focus:border-[#0DA2E7] transition-all"
                  onKeyDown={e => e.key === 'Enter' && handleCategoryCreate()}
                />
              </div>
              
              <Button
                onClick={handleCategoryCreate}
                size="sm"
                className="gap-1.5 w-full h-8 text-xs text-white hover:shadow-md transition-all"
                style={{ backgroundColor: HORMI_BLUE }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Continuar
              </Button>
              
              <p className="text-[10px] text-muted-foreground text-center">
                Al hacer clic en "Continuar", se abrirá la configuración de iconos
              </p>
            </div>
          </div>

          <DialogFooter className="p-3 pt-0 border-t border-border/50">
            <Button
              variant="outline"
              onClick={() => setCategoryDialog(false)}
              className="w-full h-8 text-xs hover:bg-muted/50 transition-all"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE CONFIGURACIÓN (ICONOS) */}
      <Dialog open={configDialog} onOpenChange={setConfigDialog}>
        <DialogContent className="sm:max-w-[450px] bg-card border-border p-0 overflow-hidden">
          <div className="p-4 bg-gradient-to-br from-[#0DA2E7]/10 via-[#0DA2E7]/5 to-transparent border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0DA2E7]/20 ring-4 ring-[#0DA2E7]/10">
                <Grid3x3 className="h-4 w-4" style={{ color: HORMI_BLUE }} />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Configurar Icono
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Selecciona un icono para el servicio
                </p>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium flex items-center gap-2 mb-3">
                  <span>Iconos disponibles</span>
                  <span className="text-red-500 text-[10px]">*</span>
                  {selectedIconName && (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-[8px] px-1.5 py-0">
                      <Check className="h-2.5 w-2.5 mr-0.5" />
                      {selectedIconName}
                    </Badge>
                  )}
                </Label>
                
                <div className="grid grid-cols-5 gap-2">
                  {AVAILABLE_ICONS.map(({ name, icon: Icon }) => {
                    const isSelected = selectedIconName === name;
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => handleIconSelect(name)}
                        className={`
                          p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-1
                          ${isSelected 
                            ? 'bg-[#0DA2E7] text-white border-[#0DA2E7] shadow-lg shadow-[#0DA2E7]/20 scale-105' 
                            : 'bg-muted/20 text-muted-foreground border-transparent hover:border-[#0DA2E7]/30 hover:bg-muted/40'
                          }
                        `}
                      >
                        <Icon className={`h-5 w-5 ${isSelected ? 'text-white' : ''}`} />
                        <span className={`text-[7px] font-medium ${isSelected ? 'text-white/90' : 'text-muted-foreground'}`}>
                          {name}
                        </span>
                      </button>
                    );
                  })}
                </div>
                
                {!selectedIconName && (
                  <p className="text-[10px] text-muted-foreground mt-3">
                    Haz clic en un icono para seleccionarlo
                  </p>
                )}
              </div>

              <Button
                onClick={handleSaveConfig}
                disabled={!selectedIconName}
                className="w-full h-8 gap-1.5 text-xs text-white hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: HORMI_BLUE }}
              >
                <Save className="h-3.5 w-3.5" />
                Guardar Configuración
              </Button>
            </div>
          </div>

          <DialogFooter className="p-3 pt-0 border-t border-border/50">
            <Button
              variant="outline"
              onClick={() => setConfigDialog(false)}
              className="w-full h-8 text-xs hover:bg-muted/50 transition-all"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}