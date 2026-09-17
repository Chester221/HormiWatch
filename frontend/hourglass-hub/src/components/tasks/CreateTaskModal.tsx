import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, isBefore, startOfToday } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2, Clock, Briefcase, Wrench, FileText, Sun, Moon, X, CalendarIcon, ClipboardList, AlignLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const HORMI_BLUE = '#0DA2E7';
const HORMI_GRADIENT = 'linear-gradient(135deg, #0DA2E7 0%, #0B8BC7 100%)';

const FieldLabel = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <span className="flex items-center gap-1.5">
    <span className="text-[#0DA2E7]">{icon}</span>
    <span className="text-xs font-bold text-foreground uppercase tracking-wide">{children}</span>
  </span>
);

const taskSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  projectId: z.string().min(1, "Selecciona un proyecto"),
  serviceId: z.string().min(1, "Selecciona un servicio"),
  date: z.date({ required_error: "Selecciona una fecha" }),
  status: z.enum(["Pending", "In Progress", "Completed"]),  // ✅ CORREGIDO: Con espacio
  startTime: z.string().min(1, "Selecciona hora de inicio"),
  endTime: z.string().min(1, "Selecciona hora de fin"),
  description: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: any[];
  services: any[];
  onSuccess: (data: any) => void;
}

// Horas en formato 12h con AM/PM
const timeSlots = [
  "12:00 AM", "12:30 AM", "01:00 AM", "01:30 AM", "02:00 AM", "02:30 AM", "03:00 AM", "03:30 AM",
  "04:00 AM", "04:30 AM", "05:00 AM", "05:30 AM", "06:00 AM", "06:30 AM", "07:00 AM", "07:30 AM",
  "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM",
  "08:00 PM", "08:30 PM", "09:00 PM", "09:30 PM", "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM"
];

// Función para convertir formato 12h a 24h
const convertTo24Hour = (time12h: string): string => {
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');
  
  let hours24 = parseInt(hours);
  if (modifier === 'PM' && hours24 !== 12) {
    hours24 += 12;
  }
  if (modifier === 'AM' && hours24 === 12) {
    hours24 = 0;
  }
  
  return `${hours24.toString().padStart(2, '0')}:${minutes}`;
};

// Función para obtener el icono según la hora
const getTimeIcon = (time: string) => {
  const hour = parseInt(time.split(':')[0]);
  const isPM = time.includes('PM');
  
  if ((isPM && hour !== 12) || hour >= 12 && !isPM) {
    return <Moon className="h-3 w-3" />;
  }
  return <Sun className="h-3 w-3" />;
};

// ✅ Horas por defecto en el PASADO: inicio = media hora actual redondeada hacia
// abajo, fin = inicio + 1h. Así "Crear Tarea" nunca falla por el backend que
// rechaza tareas futuras (antes el default era 09:00 AM, futuro si se probaba temprano).
const getDefaultTimes = () => {
  const now = new Date();
  const start = new Date(now);
  start.setSeconds(0, 0);
  if (now.getMinutes() < 30) {
    start.setMinutes(0);
  } else {
    start.setMinutes(30);
  }
  // Si justo ahora es :00 o :30 en punto, retroceder media hora para no quedar en futuro
  if (start.getTime() >= now.getTime()) {
    start.setMinutes(start.getMinutes() - 30);
  }

  const to12h = (d: Date): string => {
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  };

  return {
    startTime: to12h(start),
    endTime: to12h(new Date(start.getTime() + 3_600_000)),
  };
};

export function CreateTaskModal({ open, onOpenChange, projects, services, onSuccess }: CreateTaskModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const defaultTimes = useMemo(getDefaultTimes, []);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      projectId: "",
      serviceId: "",
      date: new Date(),
      status: "Pending",
      ...defaultTimes,
      description: "",
    },
  });

  const handleSubmit = async (data: TaskFormValues) => {
    setIsSubmitting(true);
    try {
      const submitData = {
        ...data,
        startTime: convertTo24Hour(data.startTime),
        endTime: convertTo24Hour(data.endTime),
      };

      // ✅ Validación local: no registrar tareas con inicio futuro.
      // El backend también lo rechaza; aquí se avisa antes y en español.
      const startDate = new Date(`${format(data.date, "yyyy-MM-dd")}T${submitData.startTime}:00`);
      if (startDate.getTime() > Date.now() + 5 * 60_000) {
        toast.error("La hora de inicio no puede estar en el futuro");
        return;
      }

      await onSuccess(submitData);
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border p-0 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header neutro */}
        <div className="flex items-center gap-3 p-5 pb-4 bg-muted/5 border-b border-border">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted/40">
            <ClipboardList className="h-5 w-5 text-muted-foreground/70" />
          </div>
          <div>
            <DialogTitle className="text-lg font-bold text-foreground">
              Crear Nueva Tarea
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Completa los detalles para registrar una nueva tarea
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                {/* Título */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="text-xs font-medium text-muted-foreground">
                        <FieldLabel icon={<FileText className="h-3.5 w-3.5" />}>Título <span className="text-red-500">*</span></FieldLabel>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej: Implementar autenticación..."
                          className="h-9 text-sm bg-background border-border rounded-lg focus:ring-2 focus:ring-[#0DA2E7]/20 focus:border-[#0DA2E7] transition-all"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Proyecto */}
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-muted-foreground">
                        <FieldLabel icon={<Briefcase className="h-3.5 w-3.5" />}>Proyecto <span className="text-red-500">*</span></FieldLabel>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-sm bg-background border-border rounded-lg focus:ring-2 focus:ring-[#0DA2E7]/20 focus:border-[#0DA2E7]">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-card border-border max-h-[200px]">
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Servicio */}
                <FormField
                  control={form.control}
                  name="serviceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-muted-foreground">
                        <FieldLabel icon={<Wrench className="h-3.5 w-3.5" />}>Servicio <span className="text-red-500">*</span></FieldLabel>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-sm bg-background border-border rounded-lg focus:ring-2 focus:ring-[#0DA2E7]/20 focus:border-[#0DA2E7]">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-card border-border max-h-[200px]">
                          {services.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              <div className="flex items-center gap-2">
                                <span>{service.name}</span>
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-emerald-50 text-emerald-600 border-emerald-200">
                                  ${service.default_hourly_rate}/h
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Fecha */}
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-muted-foreground">
                        <FieldLabel icon={<CalendarIcon className="h-3.5 w-3.5" />}>Fecha <span className="text-red-500">*</span></FieldLabel>
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "h-9 w-full pl-3 text-left font-normal bg-background border-border rounded-lg focus:ring-2 focus:ring-[#0DA2E7]/20 focus:border-[#0DA2E7]",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: es })
                              ) : (
                                <span>Seleccionar fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-card border-border rounded-xl shadow-xl" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => isBefore(date, startOfToday())}
                            initialFocus
                            className="rounded-xl"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Estado - ✅ CORREGIDO */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-muted-foreground">
                        <FieldLabel icon={<Clock className="h-3.5 w-3.5" />}>Estado <span className="text-red-500">*</span></FieldLabel>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-sm bg-background border-border rounded-lg focus:ring-2 focus:ring-[#0DA2E7]/20 focus:border-[#0DA2E7]">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-card border-border">
                          {[
                            { value: 'Pending', label: 'Pendiente', color: 'bg-amber-500' },
                            { value: 'In Progress', label: 'En progreso', color: 'bg-blue-500' },  // ✅ CORREGIDO
                            { value: 'Completed', label: 'Completada', color: 'bg-emerald-500' },
                          ].map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <span className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${option.color}`} />
                                {option.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Hora Inicio */}
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-muted-foreground">
                        <FieldLabel icon={getTimeIcon(field.value)}>Inicio <span className="text-red-500">*</span></FieldLabel>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-sm bg-background border-border rounded-lg focus:ring-2 focus:ring-[#0DA2E7]/20 focus:border-[#0DA2E7]">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-card border-border max-h-[200px]">
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              <span className="flex items-center gap-2">
                                {getTimeIcon(time)}
                                {time}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Hora Fin */}
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-muted-foreground">
                        <FieldLabel icon={getTimeIcon(field.value)}>Fin <span className="text-red-500">*</span></FieldLabel>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-sm bg-background border-border rounded-lg focus:ring-2 focus:ring-[#0DA2E7]/20 focus:border-[#0DA2E7]">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-card border-border max-h-[200px]">
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              <span className="flex items-center gap-2">
                                {getTimeIcon(time)}
                                {time}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Descripción */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="text-xs font-medium text-muted-foreground">
                        <FieldLabel icon={<AlignLeft className="h-3.5 w-3.5" />}>Descripción</FieldLabel>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe los detalles de la tarea..."
                          className="min-h-[80px] text-sm bg-background border-border rounded-lg resize-none focus:ring-2 focus:ring-[#0DA2E7]/20 focus:border-[#0DA2E7] transition-all"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="px-6 pb-6 pt-4 gap-2 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-9 px-6 text-sm rounded-lg flex-1 hover:bg-muted/50 transition-all"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="h-9 px-6 gap-2 text-white text-sm rounded-lg flex-1 shadow-sm hover:shadow-md transition-all"
                style={{ background: '#0DA2E7' }}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? "Creando..." : "Crear Tarea"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}