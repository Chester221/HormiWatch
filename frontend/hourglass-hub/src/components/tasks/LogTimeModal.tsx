import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Clock, Loader2, Sun, Moon, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { calculateTaskBreakdown } from "@/lib/hoursCalculator";
import { motion, AnimatePresence } from "framer-motion";
import { useProjects, type ProjectWithDetails } from "@/hooks/useProjects";
import { useServices } from "@/hooks/useServices";
import { useHolidays } from "@/hooks/useHolidays";

const taskFormSchema = z.object({
  date: z.date({ required_error: "La fecha es requerida" }),
  startTime: z.string().min(1, "Hora de inicio requerida"),
  endTime: z.string().min(1, "Hora de fin requerida"),
  projectId: z.string().min(1, "Selecciona un proyecto"),
  serviceId: z.string().min(1, "Selecciona un servicio"),
  completed: z.boolean().default(false),
  description: z.string().optional(),
  motivo: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface LogTimeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects?: ProjectWithDetails[];
  onSubmit?: (data: TaskFormValues) => void;
}

export function LogTimeModal({ open, onOpenChange, onSubmit, projects: propProjects }: LogTimeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const { data: fetchedProjects = [] } = useProjects();
  const projectsList = propProjects || fetchedProjects;
  const { data: services = [] } = useServices();
  const { holidays } = useHolidays();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      date: new Date(),
      startTime: "06:00",
      endTime: "18:00",
      projectId: "",
      serviceId: "",
      completed: false,
      description: "",
      motivo: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        date: new Date(),
        startTime: "06:00",
        endTime: "18:00",
        projectId: "",
        serviceId: "",
        completed: false,
        description: "",
        motivo: "",
      });
      setTimeout(() => {
        form.trigger("date");
      }, 100);
    }
  }, [open, form]);

  const handleSubmit = async (data: TaskFormValues) => {
    const startH = parseInt(data.startTime.split(':')[0]);
    const endH = parseInt(data.endTime.split(':')[0]);
    const isNextDay = endH < startH || (endH === startH && data.endTime <= data.startTime);
    
    if (!isNextDay && data.startTime >= data.endTime) {
      toast.error("La hora de inicio debe ser menor a la hora de fin");
      return;
    }
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    if (onSubmit) onSubmit(data);
  };

  const watchedStartTime = form.watch("startTime");
  const watchedEndTime = form.watch("endTime");
  const watchedServiceId = form.watch("serviceId");
  const watchedDate = form.watch("date");

  const service = services.find(s => s.id === watchedServiceId);
  const rate = service?.default_hourly_rate || 0;

  const isWeekend = watchedDate ? (watchedDate.getDay() === 0 || watchedDate.getDay() === 6) : false;
  const dateStr = watchedDate ? format(watchedDate, "yyyy-MM-dd") : "";
  const isHoliday = holidays.data?.some(h => h.date === dateStr && !h.is_working_day) || false;
  const isSpecialDay = isWeekend || isHoliday;

  let taskBreakdown = null;
  if (watchedStartTime && watchedEndTime && rate > 0 && watchedDate) {
    const startH = parseInt(watchedStartTime.split(':')[0]);
    const endH = parseInt(watchedEndTime.split(':')[0]);
    const isNextDay = endH < startH || (endH === startH && watchedEndTime <= watchedStartTime);

    let endDateTime: string;
    if (isNextDay) {
      const nextDay = new Date(watchedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      endDateTime = `${format(nextDay, "yyyy-MM-dd")}T${watchedEndTime}:00`;
    } else {
      endDateTime = `${dateStr}T${watchedEndTime}:00`;
    }

    const holidaysList = (holidays.data || [])
      .filter(h => !h.is_working_day)
      .map(h => h.date);

    taskBreakdown = calculateTaskBreakdown(
      `${dateStr}T${watchedStartTime}:00`,
      endDateTime,
      rate,
      holidaysList
    );
  }

  const getJornadaInfo = () => {
    if (!taskBreakdown) return { label: "", color: "", icon: null };
    if (taskBreakdown.hasHoliday || taskBreakdown.hasWeekend)
      return { label: "Feriado/Finde", color: "text-red-600 bg-red-500/10 border-red-500/30", icon: <CalendarIcon className="h-3 w-3" /> };
    if (!taskBreakdown.hasOvertime)
      return { label: "Diurno", color: "text-green-600 bg-green-500/10 border-green-500/30", icon: <Sun className="h-3 w-3" /> };
    if (taskBreakdown.days.every(d => d.normalHours === 0))
      return { label: "Extraordinario", color: "text-amber-600 bg-amber-500/10 border-amber-500/30", icon: <Moon className="h-3 w-3" /> };
    return { label: "Mixto", color: "text-purple-600 bg-purple-500/10 border-purple-500/30", icon: <Moon className="h-3 w-3" /> };
  };

  const jornada = getJornadaInfo();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Registrar Tiempo
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            <Button type="button" variant="ghost" size="sm" className="w-full text-xs text-muted-foreground gap-1" onClick={() => setShowInfo(!showInfo)}>
              <Info className="h-3 w-3" />
              {showInfo ? "Ocultar tarifas" : "Ver tarifas"}
            </Button>

            <AnimatePresence>
              {showInfo && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
                    <p className="text-xs font-medium text-foreground">Tarifas automáticas</p>
                    <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                      <div className="text-center p-1.5 rounded bg-green-500/5 border border-green-500/10">
                        <Sun className="h-3 w-3 text-green-500 mx-auto mb-0.5" />
                        <p className="font-medium text-green-600">Normal</p>
                        <p className="text-muted-foreground">6AM-7PM</p>
                        <p className="text-green-600 font-medium">×1</p>
                      </div>
                      <div className="text-center p-1.5 rounded bg-amber-500/5 border border-amber-500/10">
                        <Moon className="h-3 w-3 text-amber-500 mx-auto mb-0.5" />
                        <p className="font-medium text-amber-600">Extra</p>
                        <p className="text-muted-foreground">7PM-6AM</p>
                        <p className="text-amber-600 font-medium">×1.5</p>
                      </div>
                      <div className="text-center p-1.5 rounded bg-red-500/5 border border-red-500/10">
                        <CalendarIcon className="h-3 w-3 text-red-500 mx-auto mb-0.5" />
                        <p className="font-medium text-red-600">Sáb/Dom/Fer</p>
                        <p className="text-muted-foreground">×1.5 / ×2</p>
                        <p className="text-red-600 font-medium">×1.5-2</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <FormField control={form.control} name="date" render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-foreground">Fecha</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" className={cn("w-full pl-3 text-left font-normal bg-muted/50 border-border", !field.value && "text-muted-foreground")}>
                        {field.value ? format(field.value, "PPP") : "Selecciona una fecha"}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={(date) => { field.onChange(date); form.trigger("date"); }} initialFocus />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="startTime" render={({ field }) => (
                <FormItem><FormLabel className="text-foreground">Hora Inicio</FormLabel><FormControl><Input type="time" className="bg-muted/50 border-border" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="endTime" render={({ field }) => (
                <FormItem><FormLabel className="text-foreground">Hora Fin</FormLabel><FormControl><Input type="time" className="bg-muted/50 border-border" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            {jornada.label && (
              <Badge variant="outline" className={cn("text-xs gap-1", jornada.color)}>
                {jornada.icon} {jornada.label}
                {taskBreakdown && ` · ${taskBreakdown.overallMultiplier}`}
              </Badge>
            )}

            <AnimatePresence>
              {taskBreakdown && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                  <div className="rounded-xl border border-border bg-gradient-to-br from-card to-muted/20 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <p className="text-sm font-semibold">Desglose{taskBreakdown.days.length > 1 ? ` · ${taskBreakdown.days.length} días` : ''}</p>
                    </div>
                    {taskBreakdown.days.map((day, i) => (
                      <div key={i} className="space-y-1.5 p-2 rounded-lg bg-muted/10">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          📅 {day.date} · {day.dayOfWeek}
                          {day.isHoliday && <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-600 border-red-500/20">🎉 Feriado</Badge>}
                          {day.isWeekend && !day.isHoliday && <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">📅 Finde</Badge>}
                          <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">×{day.multiplier}</Badge>
                        </p>
                        {day.normalHours > 0 && (
                          <div className="flex justify-between py-1 px-2 rounded bg-green-500/5">
                            <span className="text-xs">☀️ Diurno ({day.normalHours}h × ${rate}/h)</span>
                            <span className="text-xs font-bold text-green-600">${day.normalPay.toFixed(2)}</span>
                          </div>
                        )}
                        {day.overtimeHours > 0 && (
                          <div className="flex justify-between py-1 px-2 rounded bg-amber-500/5">
                            <span className="text-xs">🌙 Nocturno ({day.overtimeHours}h × ${(rate * 1.5).toFixed(2)}/h)</span>
                            <span className="text-xs font-bold text-amber-600">${day.overtimePay.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-1 border-t border-border/50">
                          <span className="text-xs font-medium">Subtotal día</span>
                          <span className="text-xs font-bold">${day.totalPay.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 border-t border-border">
                      <span className="font-semibold text-sm">Total · {taskBreakdown.grandTotalHours}h</span>
                      <span className="text-lg font-bold text-primary">${taskBreakdown.grandTotalPay.toFixed(2)}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <FormField control={form.control} name="projectId" render={({ field }) => (
              <FormItem><FormLabel>Proyecto</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="bg-muted/50 border-border"><SelectValue placeholder="Selecciona un proyecto" /></SelectTrigger></FormControl><SelectContent className="bg-card border-border max-h-[200px]">{projectsList.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
            )} />

            <FormField control={form.control} name="serviceId" render={({ field }) => (
              <FormItem><FormLabel>Servicio</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="bg-muted/50 border-border"><SelectValue placeholder="Selecciona un servicio" /></SelectTrigger></FormControl><SelectContent className="bg-card border-border max-h-[200px]">{services.map(s => <SelectItem key={s.id} value={s.id}>{s.name} (${s.default_hourly_rate}/hr)</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
            )} />

            {/* ✅ NUEVO: Motivo */}
            <FormField control={form.control} name="motivo" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Motivo</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Mantenimiento, Soporte, Revisión..." className="bg-muted/50 border-border" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Descripción</FormLabel><FormControl><Input placeholder="Detalles..." className="bg-muted/50 border-border" {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            <FormField control={form.control} name="completed" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-xl border border-border bg-muted/50 p-4"><div><FormLabel className="font-medium">Completada</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
            )} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}Registrar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}