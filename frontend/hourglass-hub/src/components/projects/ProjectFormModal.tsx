import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  CalendarIcon, X, Check, Loader2, Search, FolderKanban, User, Crown, Users, 
  Clock, DollarSign, Hash, Pencil, Building2, Sparkles, Calendar as CalendarIcon2, 
  Users2, ArrowRight, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft,
  Rocket, Gift, TrendingUp, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

const HORMI_BLUE = '#0DA2E7';
const HORMI_GRADIENT = "linear-gradient(135deg, #0DA2E7 0%, #0B8BC7 100%)";

import { useClients, useClientContacts } from "@/hooks/useClientes";
import { useTechnicians, useAllUsers } from "@/hooks/useTeamMembers";

const projectFormSchema = z.object({
  name: z.string().trim().min(3, "Mínimo 3 caracteres").max(100),
  rate: z.number().min(1, "Mínimo $1").max(10000),
  hoursPool: z.number().min(1, "Mínimo 1 hora").max(10000),
  endDate: z.date({ required_error: "Selecciona una fecha" }),
  clientId: z.string().min(1, "Selecciona un cliente"),
  clientContactId: z.string().optional(),
  leaderId: z.string().min(1, "Selecciona un líder"),
  technicianIds: z.array(z.string()).min(0),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface Project {
  id: string; name: string; client: string; clientId?: string;
  status: string; progress: number; hoursConsumed: number; hoursPool: number;
  endDate: string; startDate?: string; rate?: number;
  teamLead: { name: string; avatar: string; id?: string };
  team: { name: string; avatar: string; id?: string }[];
}

interface ProjectFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
  onSubmit?: (data: ProjectFormValues) => void;
}

type TabType = 'general' | 'cliente' | 'equipo';
type StepType = 'basicos' | 'cliente' | 'equipo' | 'resumen';

export function ProjectFormModal({ open, onOpenChange, project, onSubmit }: ProjectFormModalProps) {
  const isEditing = !!project;
  
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [currentStep, setCurrentStep] = useState<StepType>('basicos');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [leaderSearch, setLeaderSearch] = useState("");
  const [techSearch, setTechSearch] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: clients = [] } = useClients(clientSearch);
  const { data: allUsers = [] } = useAllUsers(leaderSearch);
  const managers = allUsers.filter((u: any) => u.role === 'Manager');
  const { data: technicians = [] } = useTechnicians(techSearch);
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>();
  const { data: clientContacts = [] } = useClientContacts(selectedClientId);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: { name: "", rate: 85, hoursPool: 100, endDate: undefined, clientId: "", clientContactId: "", leaderId: "", technicianIds: [] },
  });

  const formValues = form.watch();

  useEffect(() => {
    if (open) {
      if (project) {
        form.reset({
          name: project.name, rate: project.rate || 85, hoursPool: project.hoursPool,
          endDate: new Date(project.endDate), clientId: project.clientId || "",
          clientContactId: "", leaderId: project.teamLead.id || "",
          technicianIds: project.team.map(t => t.id).filter(Boolean) as string[],
        });
        setSelectedTechnicians(project.team.map(t => t.id).filter(Boolean) as string[]);
        setSelectedClientId(project.clientId);
      } else {
        form.reset({ name: "", rate: 85, hoursPool: 100, endDate: undefined, clientId: "", clientContactId: "", leaderId: "", technicianIds: [] });
        setSelectedTechnicians([]);
        setSelectedClientId(undefined);
      }
      setCurrentStep('basicos');
      setActiveTab('general');
      setShowSuccess(false);
      setIsSubmitting(false);
    }
  }, [open, project, form]);

  // ✅ FUNCIÓN HANDLE SUBMIT CORREGIDA
  const handleSubmit = async (data: ProjectFormValues) => {
    setIsSubmitting(true);
    try {
      const projectData = {
        name: data.name,
        hourly_rate: data.rate,
        pool_hours: data.hoursPool,
        start_date: new Date().toISOString().split('T')[0],
        end_date: data.endDate.toISOString().split('T')[0],
        client_id: data.clientId,
        status: 'In Progress',
      };
      let projectId = project?.id || '';

      if (isEditing && project) {
        const { error } = await supabase.from('projects').update(projectData).eq('id', project.id);
        if (error) throw error;
        projectId = project.id;
        
        const { error: deleteError } = await supabase.from('project_members').delete().eq('project_id', projectId);
        if (deleteError) throw deleteError;
      } else {
        const { data: newProject, error } = await supabase.from('projects').insert(projectData).select().single();
        if (error) throw error;
        projectId = newProject.id;
      }

      if (data.leaderId && projectId) {
        const { error } = await supabase.from('project_members').insert({
          project_id: projectId,
          user_id: data.leaderId,
          role_in_project: 'leader'
        });
        if (error) throw error;
      }

      if (data.technicianIds.length > 0 && projectId) {
        const { error } = await supabase.from('project_members').insert(
          data.technicianIds.map(techId => ({
            project_id: projectId,
            user_id: techId,
            role_in_project: 'member'
          }))
        );
        if (error) throw error;
      }

      // ✅ RESETEAR ESTADO Y MOSTRAR ÉXITO
      setShowSuccess(true);
      toast.success(isEditing ? "Proyecto actualizado" : "Proyecto creado");
      
      // ✅ RESETEAR isSubmitting
      setIsSubmitting(false);
      
      if (onSubmit) onSubmit(data);
      
      setTimeout(() => {
        onOpenChange(false);
        setShowSuccess(false);
      }, 1500);

    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
      setIsSubmitting(false);
    }
  };

  const toggleTechnician = (techId: string) => {
    const ns = selectedTechnicians.includes(techId) ? selectedTechnicians.filter(id => id !== techId) : [...selectedTechnicians, techId];
    setSelectedTechnicians(ns);
    form.setValue("technicianIds", ns);
  };

  const availableTechnicians = technicians.filter(m => m.id !== form.watch("leaderId"));

  const isStepValid = (step: StepType): boolean => {
    const errors = form.formState.errors;
    switch (step) {
      case 'basicos':
        return !errors.name && !errors.rate && !errors.hoursPool && !!formValues.name && !!formValues.rate && !!formValues.hoursPool;
      case 'cliente':
        return !errors.clientId && !errors.endDate && !!formValues.clientId && !!formValues.endDate;
      case 'equipo':
        return !errors.leaderId && !!formValues.leaderId;
      case 'resumen':
        return true;
      default:
        return false;
    }
  };

  const steps: { id: StepType; label: string; icon: any; color: string; description: string }[] = [
    { id: 'basicos', label: 'Básicos', icon: FolderKanban, color: '#0DA2E7', description: 'Nombre, tarifa y horas' },
    { id: 'cliente', label: 'Cliente', icon: Building2, color: '#F59E0B', description: 'Cliente y fecha de fin' },
    { id: 'equipo', label: 'Equipo', icon: Users2, color: '#10B981', description: 'Líder y técnicos' },
    { id: 'resumen', label: 'Resumen', icon: Rocket, color: '#8B5CF6', description: 'Confirmar y crear' },
  ];

  const tabs: { id: TabType; label: string; icon: any; color: string }[] = [
    { id: 'general', label: 'General', icon: FolderKanban, color: '#0DA2E7' },
    { id: 'cliente', label: 'Cliente', icon: Building2, color: '#F59E0B' },
    { id: 'equipo', label: 'Equipo', icon: Users2, color: '#10B981' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const stepContentVariants = {
    hidden: { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 }
  };

  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // ──────────────────────────────────────────────
  // RENDER: VERSIÓN CREACIÓN (WIZARD)
  // ──────────────────────────────────────────────
  const renderCreationMode = () => {
    const renderStep = () => {
      switch (currentStep) {
        case 'basicos': return renderBasicStep();
        case 'cliente': return renderClientStep();
        case 'equipo': return renderTeamStep();
        case 'resumen': return renderSummaryStep();
        default: return null;
      }
    };

    return (
      <>
        <div className="px-6 pt-3 flex-shrink-0">
          <div className="relative h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
            <motion.div 
              className="h-full rounded-full"
              style={{ background: HORMI_GRADIENT }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            {steps.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isActive = index === currentStepIndex;
              const Icon = step.icon;
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={cn(
                    "flex items-center gap-1 transition-all duration-200",
                    isCompleted ? "text-[#0DA2E7]" : isActive ? "text-foreground font-medium" : "text-muted-foreground"
                  )}>
                    <Icon className={cn("h-3.5 w-3.5", isCompleted && "text-[#0DA2E7]")} />
                    <span className="hidden sm:inline text-[10px]">{step.label}</span>
                    {isCompleted && <Check className="h-3 w-3 text-[#0DA2E7]" />}
                  </div>
                  <div className={cn(
                    "h-1 w-1 rounded-full mt-0.5",
                    isActive ? "bg-[#0DA2E7]" : isCompleted ? "bg-[#0DA2E7]" : "bg-muted-foreground/30"
                  )} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              variants={stepContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="p-6 pt-0 border-t border-border/30 flex-shrink-0">
          <div className="flex items-center gap-3">
            {currentStepIndex > 0 && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(steps[currentStepIndex - 1].id)}
                  className="gap-2 rounded-xl h-11 px-6 text-sm font-medium border-2 border-border/50 hover:border-[#0DA2E7]/30 hover:bg-[#0DA2E7]/5"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Atrás
                </Button>
              </motion.div>
            )}

            <div className="flex-1" />

            {currentStepIndex < steps.length - 1 ? (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  type="button"
                  onClick={() => {
                    if (isStepValid(currentStep)) {
                      setCurrentStep(steps[currentStepIndex + 1].id);
                    } else {
                      toast.warning("Completa todos los campos requeridos");
                    }
                  }}
                  disabled={!isStepValid(currentStep)}
                  className="gap-2 rounded-xl h-11 px-6 text-white font-medium shadow-md hover:shadow-lg"
                  style={{ background: HORMI_GRADIENT }}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </motion.div>
            ) : (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                <Button 
                  type="button"
                  onClick={form.handleSubmit(handleSubmit)}
                  disabled={isSubmitting || showSuccess}
                  className="w-full gap-2.5 rounded-xl h-11 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                  style={{ background: HORMI_GRADIENT }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : showSuccess ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      ¡Creado!
                    </>
                  ) : (
                    <>
                      <Rocket className="h-4 w-4" />
                      Crear Proyecto
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </>
    );
  };

  // ──────────────────────────────────────────────
  // RENDER: VERSIÓN EDICIÓN (TABS)
  // ──────────────────────────────────────────────
  const renderEditMode = () => {
    const renderTabContent = () => {
      switch (activeTab) {
        case 'general': return renderBasicStep();
        case 'cliente': return renderClientStep();
        case 'equipo': return renderTeamStep();
        default: return null;
      }
    };

    return (
      <>
        <div className="px-6 pt-3 border-b border-border/50 flex-shrink-0">
          <div className="flex items-center gap-1 bg-muted/10 p-1 rounded-xl">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex-1 text-xs rounded-lg px-4 py-2 transition-all duration-300",
                    "flex items-center justify-center gap-2 font-medium",
                    isActive
                      ? 'bg-white text-[#0DA2E7] shadow-md shadow-[#0DA2E7]/10'
                      : 'text-muted-foreground/70 hover:text-foreground hover:bg-muted/30'
                  )}
                >
                  <Icon className={cn(
                    "h-4 w-4 transition-colors",
                    isActive ? "text-[#0DA2E7]" : "text-muted-foreground/50"
                  )} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={stepContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="p-6 pt-0 border-t border-border/30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex-1" />
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
              <Button 
                type="button"
                onClick={form.handleSubmit(handleSubmit)}
                disabled={isSubmitting || showSuccess}
                className="w-full gap-2.5 rounded-xl h-11 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                style={{ background: HORMI_GRADIENT }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : showSuccess ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    ¡Actualizado!
                  </>
                ) : (
                  <>
                    <Pencil className="h-4 w-4" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        </div>
      </>
    );
  };

  // ──────────────────────────────────────────────
  // RENDER DE PASOS (COMPARTIDOS)
  // ──────────────────────────────────────────────

  const renderBasicStep = () => (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium flex items-center gap-2 text-foreground">
          <Hash className="h-4 w-4 text-[#0DA2E7]" />
          Nombre del Proyecto
          <span className="text-red-500 text-xs">*</span>
        </Label>
        <div className="relative">
          <Input 
            placeholder="Ej: Migración de Datos 2026" 
            {...form.register("name")} 
            className={cn(
              "bg-muted/10 border-2 h-12 rounded-xl pl-4 text-sm transition-all duration-200",
              "focus:border-[#0DA2E7]/50 focus:bg-white focus:shadow-lg focus:shadow-[#0DA2E7]/5",
              form.formState.errors.name && "border-red-300 focus:border-red-500"
            )}
            autoFocus={!isEditing}
          />
          {form.formState.errors.name && (
            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
          )}
        </div>
        {form.formState.errors.name && (
          <motion.p 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-red-500 flex items-center gap-1"
          >
            <X className="h-3 w-3" /> {form.formState.errors.name.message}
          </motion.p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium flex items-center gap-2 text-foreground">
            <DollarSign className="h-4 w-4 text-[#0DA2E7]" />
            Tarifa/hora
            <span className="text-red-500 text-xs">*</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input 
              type="number" 
              placeholder="85" 
              {...form.register("rate", { valueAsNumber: true })} 
              className="pl-7 bg-muted/10 border-2 h-12 rounded-xl text-sm transition-all duration-200 focus:border-[#0DA2E7]/50 focus:bg-white focus:shadow-lg focus:shadow-[#0DA2E7]/5" 
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium flex items-center gap-2 text-foreground">
            <Clock className="h-4 w-4 text-[#0DA2E7]" />
            Pool de Horas
            <span className="text-red-500 text-xs">*</span>
          </Label>
          <div className="relative">
            <Input 
              type="number" 
              placeholder="100" 
              {...form.register("hoursPool", { valueAsNumber: true })} 
              className={cn(
                "bg-muted/10 border-2 h-12 rounded-xl pl-4 text-sm transition-all duration-200",
                "focus:border-[#0DA2E7]/50 focus:bg-white focus:shadow-lg focus:shadow-[#0DA2E7]/5",
                form.formState.errors.hoursPool && "border-red-300 focus:border-red-500"
              )}
            />
            {form.formState.errors.hoursPool && (
              <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
            )}
          </div>
          {form.formState.errors.hoursPool && (
            <motion.p 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-red-500 flex items-center gap-1"
            >
              <X className="h-3 w-3" /> {form.formState.errors.hoursPool.message}
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );

  const renderClientStep = () => (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium flex items-center gap-2 text-foreground">
          <Building2 className="h-4 w-4 text-[#0DA2E7]" />
          Cliente
          <span className="text-red-500 text-xs">*</span>
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar cliente..." 
            value={clientSearch} 
            onChange={e => setClientSearch(e.target.value)} 
            className="pl-10 bg-muted/10 border-2 h-12 rounded-xl text-sm transition-all duration-200 focus:border-[#0DA2E7]/50 focus:bg-white focus:shadow-lg focus:shadow-[#0DA2E7]/5" 
          />
        </div>
        <Select 
          value={form.watch("clientId")} 
          onValueChange={(v) => { 
            form.setValue("clientId", v); 
            setSelectedClientId(v); 
            form.setValue("clientContactId", ""); 
          }}
        >
          <SelectTrigger className={cn(
            "bg-muted/10 border-2 h-12 rounded-xl text-sm transition-all duration-200",
            "focus:border-[#0DA2E7]/50 focus:shadow-lg focus:shadow-[#0DA2E7]/5",
            form.formState.errors.clientId && "border-red-300 focus:border-red-500"
          )}>
            <SelectValue placeholder="Seleccionar cliente" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border shadow-xl rounded-xl max-h-60">
            {clients.map(c => (
              <SelectItem key={c.id} value={c.id} className="cursor-pointer py-2.5">
                <div className="flex items-center gap-3">
                  {c.logo_url ? (
                    <img src={c.logo_url} alt={c.name} className="h-6 w-6 rounded-lg object-cover" />
                  ) : (
                    <div className="h-6 w-6 rounded-lg bg-muted flex items-center justify-center">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                  <span className="font-medium">{c.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.clientId && (
          <motion.p 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-red-500 flex items-center gap-1"
          >
            <X className="h-3 w-3" /> {form.formState.errors.clientId.message}
          </motion.p>
        )}
      </div>

      {selectedClientId && clientContacts.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1.5"
        >
          <Label className="text-sm font-medium flex items-center gap-2 text-foreground">
            <User className="h-4 w-4 text-[#0DA2E7]" />
            Contacto del Cliente
          </Label>
          <Select 
            value={form.watch("clientContactId")} 
            onValueChange={(v) => form.setValue("clientContactId", v)}
          >
            <SelectTrigger className="bg-muted/10 border-2 h-12 rounded-xl text-sm transition-all duration-200 focus:border-[#0DA2E7]/50 focus:bg-white focus:shadow-lg focus:shadow-[#0DA2E7]/5">
              <SelectValue placeholder="Seleccionar contacto (opcional)" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border shadow-xl rounded-xl">
              {clientContacts.map(c => (
                <SelectItem key={c.id} value={c.id} className="cursor-pointer py-2.5">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs bg-[#0DA2E7]/10 text-[#0DA2E7]">
                        {(c.name || "C")[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.position}</p>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>
      )}

      <div className="space-y-1.5">
        <Label className="text-sm font-medium flex items-center gap-2 text-foreground">
          <CalendarIcon className="h-4 w-4 text-[#0DA2E7]" />
          Fecha de Fin
          <span className="text-red-500 text-xs">*</span>
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className={cn(
                "w-full h-12 pl-4 text-left font-normal bg-muted/10 border-2 rounded-xl text-sm transition-all duration-200",
                "hover:bg-muted/20 hover:border-[#0DA2E7]/30",
                "focus:border-[#0DA2E7]/50 focus:shadow-lg focus:shadow-[#0DA2E7]/5",
                !form.watch("endDate") && "text-muted-foreground",
                form.formState.errors.endDate && "border-red-300 focus:border-red-500"
              )}
            >
              {form.watch("endDate") ? (
                format(form.watch("endDate"), "PPP", { locale: es })
              ) : (
                "Seleccionar fecha de fin"
              )}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-card border-border shadow-xl rounded-xl" align="start">
            <Calendar 
              mode="single" 
              selected={form.watch("endDate")} 
              onSelect={(d) => form.setValue("endDate", d as Date)} 
              disabled={(date) => date < new Date()} 
              initialFocus 
              className="rounded-xl"
              locale={es}
            />
          </PopoverContent>
        </Popover>
        {form.formState.errors.endDate && (
          <motion.p 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-red-500 flex items-center gap-1"
          >
            <X className="h-3 w-3" /> {form.formState.errors.endDate.message}
          </motion.p>
        )}
        <p className="text-xs text-muted-foreground/60 flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          El proyecto comenzará automáticamente el día de creación
        </p>
      </div>
    </div>
  );

  const renderTeamStep = () => (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium flex items-center gap-2 text-foreground">
          <Crown className="h-4 w-4 text-amber-400" />
          Líder del Proyecto
          <span className="text-red-500 text-xs">*</span>
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar líder..." 
            value={leaderSearch} 
            onChange={e => setLeaderSearch(e.target.value)} 
            className="pl-10 bg-muted/10 border-2 h-12 rounded-xl text-sm transition-all duration-200 focus:border-[#0DA2E7]/50 focus:bg-white focus:shadow-lg focus:shadow-[#0DA2E7]/5" 
          />
        </div>
        <Select 
          value={form.watch("leaderId")} 
          onValueChange={(v) => { 
            form.setValue("leaderId", v); 
            if (selectedTechnicians.includes(v)) toggleTechnician(v); 
          }}
        >
          <SelectTrigger className={cn(
            "bg-muted/10 border-2 h-12 rounded-xl text-sm transition-all duration-200",
            "focus:border-[#0DA2E7]/50 focus:shadow-lg focus:shadow-[#0DA2E7]/5",
            form.formState.errors.leaderId && "border-red-300 focus:border-red-500"
          )}>
            <SelectValue placeholder="Seleccionar líder" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border shadow-xl rounded-xl">
            {managers.map(m => (
              <SelectItem key={m.id} value={m.id} className="cursor-pointer py-2.5">
                <div className="flex items-center gap-3">
                  <Avatar className="h-6 w-6 ring-2 ring-amber-400/30">
                    <AvatarImage src={m.avatar_url} />
                    <AvatarFallback className="text-xs bg-amber-100 text-amber-700 font-bold">
                      {(m.full_name || "U")[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{m.full_name || m.email}</p>
                    <Badge className="text-[9px] bg-amber-100 text-amber-700 border-amber-200 px-1.5 py-0">Líder</Badge>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.leaderId && (
          <motion.p 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-red-500 flex items-center gap-1"
          >
            <X className="h-3 w-3" /> {form.formState.errors.leaderId.message}
          </motion.p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium flex items-center gap-2 text-foreground">
          <Users className="h-4 w-4 text-[#0DA2E7]" />
          Técnicos Asignados
        </Label>
        <div className="rounded-2xl border-2 border-border/30 bg-muted/5 p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar técnicos..." 
              value={techSearch} 
              onChange={e => setTechSearch(e.target.value)} 
              className="pl-10 bg-white border-2 h-10 rounded-xl text-sm transition-all duration-200 focus:border-[#0DA2E7]/50 focus:shadow-md focus:shadow-[#0DA2E7]/5" 
            />
          </div>
          
          {selectedTechnicians.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTechnicians.map(tid => {
                const tech = technicians.find(m => m.id === tid);
                if (!tech) return null;
                return (
                  <motion.div
                    key={tid}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Badge className="gap-1.5 pl-1 pr-2.5 py-1.5 text-xs bg-[#0DA2E7]/10 text-foreground border-[#0DA2E7]/20 rounded-full">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={tech.avatar_url} />
                        <AvatarFallback className="text-[9px] bg-[#0DA2E7]/20 text-[#0DA2E7]">
                          {(tech.full_name || "T")[0]}
                        </AvatarFallback>
                      </Avatar>
                      {tech.full_name}
                      <button 
                        type="button" 
                        onClick={() => toggleTechnician(tid)} 
                        className="ml-1 hover:text-red-500 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  </motion.div>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1">
            {availableTechnicians.length === 0 ? (
              <p className="text-xs text-muted-foreground col-span-2 text-center py-4">
                {techSearch ? "No se encontraron técnicos" : "No hay técnicos disponibles"}
              </p>
            ) : (
              availableTechnicians.map(m => {
                const isSel = selectedTechnicians.includes(m.id);
                return (
                  <motion.button 
                    key={m.id} 
                    type="button" 
                    onClick={() => toggleTechnician(m.id)}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    className={cn(
                      "flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-all duration-200 text-sm",
                      isSel 
                        ? "bg-[#0DA2E7]/10 border-2 border-[#0DA2E7]/30 shadow-sm" 
                        : "bg-white border-2 border-border/30 hover:border-[#0DA2E7]/20 hover:shadow-md"
                    )}
                  >
                    <Avatar className="h-7 w-7 ring-1 ring-border/30">
                      <AvatarImage src={m.avatar_url} />
                      <AvatarFallback className="text-[9px] bg-muted/30 font-medium">
                        {(m.full_name || "T")[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 truncate text-xs font-medium">{m.full_name || m.email}</span>
                    {isSel && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        <Check className="h-4 w-4 text-[#0DA2E7] shrink-0" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSummaryStep = () => {
    const data = formValues;
    const client = clients.find(c => c.id === data.clientId);
    const leader = managers.find(m => m.id === data.leaderId);
    const techs = technicians.filter(t => selectedTechnicians.includes(t.id));
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-[#0DA2E7]/5 border border-[#0DA2E7]/10 p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Nombre</p>
            <p className="text-sm font-medium mt-0.5">{data.name || "—"}</p>
          </div>
          <div className="rounded-xl bg-[#0DA2E7]/5 border border-[#0DA2E7]/10 p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tarifa</p>
            <p className="text-sm font-medium mt-0.5">${data.rate || 0}/h</p>
          </div>
          <div className="rounded-xl bg-[#0DA2E7]/5 border border-[#0DA2E7]/10 p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pool de Horas</p>
            <p className="text-sm font-medium mt-0.5">{data.hoursPool || 0}h</p>
          </div>
          <div className="rounded-xl bg-[#0DA2E7]/5 border border-[#0DA2E7]/10 p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Fecha de Fin</p>
            <p className="text-sm font-medium mt-0.5">
              {data.endDate ? format(data.endDate, "PPP", { locale: es }) : "—"}
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-amber-50/30 border border-amber-200/20 p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Cliente</p>
          <p className="text-sm font-medium mt-0.5">{client?.name || "—"}</p>
        </div>

        <div className="rounded-xl bg-emerald-50/30 border border-emerald-200/20 p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Equipo</p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {leader && (
              <Badge className="gap-1.5 bg-amber-100 text-amber-700 border-amber-200">
                <Crown className="h-3 w-3" />
                {leader.full_name}
              </Badge>
            )}
            {techs.map(t => (
              <Badge key={t.id} variant="secondary" className="gap-1">
                <Avatar className="h-4 w-4">
                  <AvatarFallback className="text-[8px]">{(t.full_name || "T")[0]}</AvatarFallback>
                </Avatar>
                {t.full_name}
              </Badge>
            ))}
            {techs.length === 0 && <span className="text-sm text-muted-foreground">Sin técnicos asignados</span>}
          </div>
        </div>
      </div>
    );
  };

  // ──────────────────────────────────────────────
  // RENDER PRINCIPAL
  // ──────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[92vh] overflow-hidden flex flex-col bg-card border-border p-0 rounded-2xl shadow-2xl">
        
        <div className="relative p-6 bg-gradient-to-br from-[#0DA2E7]/20 via-[#0DA2E7]/5 to-transparent border-b border-border/50 flex-shrink-0 overflow-hidden">
          <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[#0DA2E7]/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-[#0DA2E7]/5 blur-3xl" />
          
          <div className="relative flex items-center gap-4">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: -5 }}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0DA2E7] to-[#0B8BC7] shadow-lg shadow-[#0DA2E7]/30"
            >
              {isEditing ? (
                <Pencil className="h-7 w-7 text-white" />
              ) : (
                <FolderKanban className="h-7 w-7 text-white" />
              )}
            </motion.div>
            
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-3 flex-wrap">
                {isEditing ? "Editar Proyecto" : "Nuevo Proyecto"}
                {isEditing && project && (
                  <Badge className="bg-[#0DA2E7]/10 text-[#0DA2E7] border-none text-[10px] px-3 py-0.5 rounded-full">
                    {project.status || "Activo"}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground/80 mt-0.5 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0DA2E7]" />
                {isEditing 
                  ? `Editando: ${project?.name}`
                  : `Paso ${currentStepIndex + 1} de ${steps.length}: ${steps[currentStepIndex].description}`
                }
              </DialogDescription>
            </div>
          </div>
        </div>

        {isEditing ? renderEditMode() : renderCreationMode()}
        
      </DialogContent>
    </Dialog>
  );
}