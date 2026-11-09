import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, isAfter, parseISO, startOfToday } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarIcon,
  Check,
  ChevronDown,
  Clock,
  Crown,
  DollarSign,
  FileText,
  FolderKanban,
  Hash,
  Loader2,
  Pencil,
  User,
  Users,
  X,
  Building2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import {
  useCreateProject,
  useUpdateProject,
  type ProjectMutationPayload,
} from "@/hooks/useProjects";
import { useClientContacts, useClients } from "@/hooks/useClientes";
import { useAllUsers, useTechnicians } from "@/hooks/useTeamMembers";

const projectFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(100, "El nombre no puede superar los 100 caracteres"),
  description: z
    .string()
    .max(500, "La descripción no puede superar los 500 caracteres")
    .optional(),
  rate: z
    .number({ invalid_type_error: "Ingresa una tarifa válida" })
    .min(1, "La tarifa mínima es $1")
    .max(10000, "La tarifa máxima es $10.000"),
  hoursPool: z
    .number({ invalid_type_error: "Ingresa un pool de horas válido" })
    .min(1, "El pool mínimo es 1 hora")
    .max(10000, "El pool máximo es 10.000 horas"),
  endDate: z.date({ required_error: "Selecciona una fecha de fin" }),
  clientId: z.string().min(1, "Selecciona un cliente"),
  clientContactId: z.string().min(1, "Selecciona un contacto"),
  leaderId: z.string().min(1, "Selecciona un líder"),
  technicianIds: z
    .array(z.string())
    .min(1, "Selecciona al menos un técnico"),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface Project {
  id: string;
  name: string;
  description?: string | null;
  client: string;
  clientId?: string;
  contactId?: string | null;
  status: string;
  progress: number;
  hoursConsumed: number;
  hoursPool: number;
  endDate: string;
  startDate?: string;
  rate?: number;
  teamLead: { name: string; avatar: string; id?: string };
  team: { name: string; avatar: string; id?: string }[];
}

interface ProjectFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
  onSubmit?: (data: ProjectFormValues) => void;
}

const getRoleName = (role: unknown): string => {
  if (typeof role === "string") return role;
  if (role && typeof role === "object" && "name" in role) {
    return String((role as { name?: string }).name || "");
  }
  return "";
};

const getMemberName = (member: {
  full_name?: string | null;
  name?: string | null;
  email?: string | null;
}): string => member.full_name || member.name || member.email || "Sin nombre";

export function ProjectFormModal({
  open,
  onOpenChange,
  project,
  onSubmit,
}: ProjectFormModalProps) {
  const isEditing = Boolean(project);
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const [clientOpen, setClientOpen] = useState(false);
  const [technicianOpen, setTechnicianOpen] = useState(false);

  const { data: clients = [] } = useClients();
  const { data: allUsers = [] } = useAllUsers();
  const { data: technicians = [] } = useTechnicians();

  const defaultValues = useMemo<ProjectFormValues>(
    () => ({
      name: "",
      description: "",
      rate: 85,
      hoursPool: 100,
      endDate: undefined as unknown as Date,
      clientId: "",
      clientContactId: "",
      leaderId: "",
      technicianIds: [],
    }),
    [],
  );

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    mode: "onTouched",
    defaultValues,
  });

  const watchedClientId = form.watch("clientId");
  const watchedLeaderId = form.watch("leaderId");
  const selectedTechnicianIds = form.watch("technicianIds") || [];

  const { data: clientContacts = [], isLoading: contactsLoading } =
    useClientContacts(watchedClientId || undefined);

  const sortedClients = useMemo(
    () => [...clients].sort((a, b) => a.name.localeCompare(b.name, "es")),
    [clients],
  );

  const managers = useMemo(
    () =>
      allUsers
        .filter((user) => {
          const role = getRoleName(user.role);
          return role === "Manager" || role === "Admin";
        })
        .sort((a, b) => getMemberName(a).localeCompare(getMemberName(b), "es")),
    [allUsers],
  );

  const sortedTechnicians = useMemo(
    () =>
      [...technicians].sort((a, b) =>
        getMemberName(a).localeCompare(getMemberName(b), "es"),
      ),
    [technicians],
  );

  const availableTechnicians = useMemo(
    () => sortedTechnicians.filter((tech) => tech.id !== watchedLeaderId),
    [sortedTechnicians, watchedLeaderId],
  );

  const selectedClient = useMemo(
    () => sortedClients.find((client) => client.id === watchedClientId),
    [sortedClients, watchedClientId],
  );

  useEffect(() => {
    if (!open) {
      setClientOpen(false);
      setTechnicianOpen(false);
      return;
    }

    if (project) {
      const parsedEndDate = project.endDate ? parseISO(project.endDate) : undefined;
      const validEndDate =
        parsedEndDate && !Number.isNaN(parsedEndDate.getTime())
          ? parsedEndDate
          : undefined;
      const leaderId = project.teamLead?.id || "";

      form.reset({
        name: project.name || "",
        description: project.description || "",
        rate: project.rate || 85,
        hoursPool: project.hoursPool || 100,
        endDate: validEndDate as Date,
        clientId: project.clientId || "",
        clientContactId: project.contactId || "",
        leaderId,
        technicianIds: (project.team || [])
          .map((member) => member.id)
          .filter((id): id is string => Boolean(id) && id !== leaderId),
      });
    } else {
      form.reset(defaultValues);
    }
  }, [open, project, form, defaultValues]);

  useEffect(() => {
    if (!watchedClientId || contactsLoading) return;

    const currentContactId = form.getValues("clientContactId");
    if (
      currentContactId &&
      !clientContacts.some((contact) => contact.id === currentContactId)
    ) {
      form.setValue("clientContactId", "", {
        shouldDirty: true,
        shouldValidate: false,
      });
    }
  }, [watchedClientId, contactsLoading, clientContacts, form]);

  const handleMutationError = (error: unknown) => {
    const status =
      (error as { status?: number; statusCode?: number } | null)?.status ??
      (error as { statusCode?: number } | null)?.statusCode;

    form.setError("root", {
      message:
        status === 403
          ? "No tienes permisos para crear o editar proyectos."
          : error instanceof Error
            ? error.message
            : "No se pudo guardar el proyecto",
    });
  };

  const handleMutationSuccess = (data: ProjectFormValues) => {
    onOpenChange(false);
    onSubmit?.(data);
  };

  const handleSubmit = (data: ProjectFormValues) => {
    if (!isEditing && !isAfter(data.endDate, startOfToday())) {
      form.setError("endDate", {
        message: "La fecha de fin debe ser posterior a hoy",
      });
      return;
    }

    const description = data.description?.trim()
      ? data.description.trim()
      : isEditing
        ? null
        : undefined;

    const payload: ProjectMutationPayload = {
      title: data.name.trim(),
      description,
      hourlyRate: data.rate,
      poolHours: data.hoursPool,
      endDate: format(data.endDate, "yyyy-MM-dd"),
      customerContactId: data.clientContactId,
      projectLeaderId: data.leaderId,
      technicianIds: data.technicianIds,
    };

    const mutationOptions = {
      onSuccess: () => handleMutationSuccess(data),
      onError: handleMutationError,
    };

    if (isEditing && project) {
      updateProject.mutate(
        { id: project.id, data: payload },
        mutationOptions,
      );
    } else {
      createProject.mutate(
        {
          ...payload,
          status: "IN_PROGRESS",
          startDate: format(new Date(), "yyyy-MM-dd"),
          clientId: data.clientId,
          customerName: selectedClient?.name,
        },
        mutationOptions,
      );
    }
  };

  const isPending = createProject.isPending || updateProject.isPending;
  const contactPlaceholder = !watchedClientId
    ? "Primero selecciona un cliente"
    : contactsLoading
      ? "Cargando contactos..."
      : clientContacts.length === 0
        ? "Este cliente no tiene contactos"
        : "Selecciona un contacto";

  const handleLeaderChange = (value: string, onChange: (value: string) => void) => {
    onChange(value);

    if (selectedTechnicianIds.includes(value)) {
      form.setValue(
        "technicianIds",
        selectedTechnicianIds.filter((id) => id !== value),
        { shouldDirty: true, shouldValidate: true },
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[95vw] max-w-3xl flex-col gap-0 overflow-hidden rounded-2xl border-border bg-card p-0 shadow-2xl">
        <div className="flex shrink-0 items-start gap-3 border-b border-border bg-muted/5 p-5 pr-12">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0DA2E7]/10">
            {isEditing ? (
              <Pencil className="h-5 w-5 text-[#0DA2E7]" />
            ) : (
              <FolderKanban className="h-5 w-5 text-[#0DA2E7]" />
            )}
          </div>
          <div className="min-w-0">
            <DialogTitle className="text-xl font-bold text-foreground">
              {isEditing ? "Editar Proyecto" : "Nuevo Proyecto"}
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              {isEditing
                ? `Actualiza la información de ${project?.name || "este proyecto"}.`
                : "Completa la información del proyecto en una sola pantalla."}
            </DialogDescription>
          </div>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
              <section className="space-y-4 rounded-xl border border-border bg-muted/5 p-4 sm:p-5">
                <div className="flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-[#0DA2E7]" />
                  <h3 className="text-sm font-semibold text-foreground">
                    Datos del proyecto
                  </h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          <Hash className="h-3.5 w-3.5 text-[#0DA2E7]" />
                          Nombre <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ej: Migración de Datos 2026"
                            className="h-10"
                            autoFocus
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          <FileText className="h-3.5 w-3.5 text-[#0DA2E7]" />
                          Descripción
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Objetivo y alcance del proyecto..."
                            rows={3}
                            className="resize-none"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          <DollarSign className="h-3.5 w-3.5 text-[#0DA2E7]" />
                          Tarifa por hora <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            step="0.01"
                            inputMode="decimal"
                            placeholder="85"
                            className="h-10"
                            value={Number.isFinite(field.value) ? field.value : ""}
                            onChange={(event) =>
                              field.onChange(
                                event.target.value === ""
                                  ? undefined
                                  : Number(event.target.value),
                              )
                            }
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hoursPool"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 text-[#0DA2E7]" />
                          Pool de horas <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            step="1"
                            inputMode="numeric"
                            placeholder="100"
                            className="h-10"
                            value={Number.isFinite(field.value) ? field.value : ""}
                            onChange={(event) =>
                              field.onChange(
                                event.target.value === ""
                                  ? undefined
                                  : Number(event.target.value),
                              )
                            }
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          <CalendarIcon className="h-3.5 w-3.5 text-[#0DA2E7]" />
                          Fecha de fin <span className="text-destructive">*</span>
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                type="button"
                                variant="outline"
                                className={cn(
                                  "h-10 w-full justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value
                                  ? format(field.value, "PPP", { locale: es })
                                  : "Selecciona una fecha de fin"}
                                <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-auto p-0"
                            align="start"
                          >
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                !isEditing && !isAfter(date, startOfToday())
                              }
                              locale={es}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <p className="text-xs text-muted-foreground">
                          {isEditing
                            ? "La fecha de inicio no se modifica al editar."
                            : "El proyecto comenzará automáticamente hoy."}
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              <section className="space-y-4 rounded-xl border border-border bg-muted/5 p-4 sm:p-5">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#0DA2E7]" />
                  <h3 className="text-sm font-semibold text-foreground">
                    Cliente
                  </h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5 text-[#0DA2E7]" />
                          Cliente <span className="text-destructive">*</span>
                        </FormLabel>
                        <Popover open={clientOpen} onOpenChange={setClientOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                type="button"
                                variant="outline"
                                role="combobox"
                                aria-expanded={clientOpen}
                                className={cn(
                                  "h-10 w-full justify-between font-normal",
                                  !field.value && "text-muted-foreground",
                                )}
                              >
                                <span className="flex min-w-0 items-center gap-2">
                                  <Building2 className="h-4 w-4 shrink-0 opacity-60" />
                                  <span className="truncate">
                                    {selectedClient?.name ||
                                      "Selecciona un cliente"}
                                  </span>
                                </span>
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-[var(--radix-popover-trigger-width)] p-0"
                            align="start"
                          >
                            <Command>
                              <CommandInput placeholder="Buscar cliente..." />
                              <CommandList>
                                <CommandEmpty>
                                  No se encontraron clientes.
                                </CommandEmpty>
                                <CommandGroup>
                                  {sortedClients.map((client) => (
                                    <CommandItem
                                      key={client.id}
                                      value={`${client.name} ${
                                        client.ruc || ""
                                      } ${client.id}`}
                                      onSelect={() => {
                                        if (field.value !== client.id) {
                                          field.onChange(client.id);
                                          form.setValue(
                                            "clientContactId",
                                            "",
                                            {
                                              shouldDirty: true,
                                              shouldValidate: false,
                                            },
                                          );
                                          form.clearErrors("clientContactId");
                                        }
                                        setClientOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          field.value === client.id
                                            ? "opacity-100"
                                            : "opacity-0",
                                        )}
                                      />
                                      <span className="truncate">
                                        {client.name}
                                      </span>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientContactId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          <User className="h-3.5 w-3.5 text-[#0DA2E7]" />
                          Contacto <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select
                          value={field.value || undefined}
                          onValueChange={field.onChange}
                          disabled={
                            !watchedClientId ||
                            contactsLoading ||
                            clientContacts.length === 0
                          }
                        >
                          <FormControl>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder={contactPlaceholder} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clientContacts.map((contact) => (
                              <SelectItem key={contact.id} value={contact.id}>
                                <span className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="bg-[#0DA2E7]/10 text-[10px] text-[#0DA2E7]">
                                      {(contact.name || "C")
                                        .charAt(0)
                                        .toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="flex flex-col">
                                    <span>{contact.name}</span>
                                    {(contact.position || contact.email) && (
                                      <span className="text-xs text-muted-foreground">
                                        {contact.position || contact.email}
                                      </span>
                                    )}
                                  </span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {watchedClientId &&
                          !contactsLoading &&
                          clientContacts.length === 0 && (
                            <p className="text-xs text-muted-foreground">
                              Este cliente no tiene contactos. Créalo desde la
                              sección Clientes para poder continuar.
                            </p>
                          )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              <section className="space-y-4 rounded-xl border border-border bg-muted/5 p-4 sm:p-5">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#0DA2E7]" />
                  <h3 className="text-sm font-semibold text-foreground">
                    Equipo
                  </h3>
                </div>

                <div className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="leaderId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          <Crown className="h-3.5 w-3.5 text-amber-500" />
                          Líder del proyecto <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select
                          value={field.value || undefined}
                          onValueChange={(value) =>
                            handleLeaderChange(value, field.onChange)
                          }
                        >
                          <FormControl>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Selecciona un líder" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {managers.map((manager) => {
                              const fullName = getMemberName(manager);
                              return (
                                <SelectItem key={manager.id} value={manager.id}>
                                  <span className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage
                                        src={manager.avatar_url || undefined}
                                      />
                                      <AvatarFallback className="bg-amber-100 text-[10px] font-semibold text-amber-700">
                                        {fullName.charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span>{fullName}</span>
                                      <Badge
                                        variant="secondary"
                                        className="ml-1 px-1.5 py-0 text-[9px]"
                                      >
                                        {getRoleName(manager.role) || "Manager"}
                                      </Badge>
                                  </span>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        {managers.length === 0 && (
                          <p className="text-xs text-muted-foreground">
                            No hay líderes disponibles.
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="technicianIds"
                    render={({ field }) => {
                      const value = field.value || [];

                      return (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            <Users className="h-3.5 w-3.5 text-[#0DA2E7]" />
                            Técnicos <span className="text-destructive">*</span>
                          </FormLabel>
                          <Popover
                            open={technicianOpen}
                            onOpenChange={setTechnicianOpen}
                          >
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  type="button"
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={technicianOpen}
                                  className={cn(
                                    "h-10 w-full justify-between font-normal",
                                    value.length === 0 &&
                                      "text-muted-foreground",
                                  )}
                                >
                                  <span className="flex min-w-0 items-center gap-2">
                                    <Users className="h-4 w-4 shrink-0 opacity-60" />
                                    <span className="truncate">
                                      {value.length === 0
                                        ? "Selecciona al menos un técnico"
                                        : `${value.length} técnico${
                                            value.length === 1 ? "" : "s"
                                          } seleccionado${
                                            value.length === 1 ? "" : "s"
                                          }`}
                                    </span>
                                  </span>
                                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-[var(--radix-popover-trigger-width)] p-0"
                              align="start"
                            >
                              <Command>
                                <CommandInput placeholder="Buscar técnico..." />
                                <CommandList>
                                  <CommandEmpty>
                                    No se encontraron técnicos.
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {availableTechnicians.map((technician) => {
                                      const fullName =
                                        getMemberName(technician);
                                      const isSelected = value.includes(
                                        technician.id,
                                      );

                                      return (
                                        <CommandItem
                                          key={technician.id}
                                          value={`${fullName} ${
                                            technician.email || ""
                                          } ${technician.id}`}
                                          onSelect={() => {
                                            const next = isSelected
                                              ? value.filter(
                                                  (id) => id !== technician.id,
                                                )
                                              : [...value, technician.id];
                                            field.onChange(next);
                                          }}
                                        >
                                          <Checkbox
                                            checked={isSelected}
                                            className="pointer-events-none mr-3"
                                            aria-hidden="true"
                                          />
                                          <Avatar className="mr-2 h-6 w-6">
                                            <AvatarImage
                                              src={
                                                technician.avatar_url ||
                                                undefined
                                              }
                                            />
                                            <AvatarFallback className="text-[10px]">
                                              {fullName
                                                .charAt(0)
                                                .toUpperCase()}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span className="truncate">
                                            {fullName}
                                          </span>
                                        </CommandItem>
                                      );
                                    })}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>

                          {value.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {value.map((technicianId) => {
                                const technician = sortedTechnicians.find(
                                  (item) => item.id === technicianId,
                                );
                                if (!technician) return null;
                                const fullName = getMemberName(technician);

                                return (
                                  <Badge
                                    key={technicianId}
                                    variant="secondary"
                                    className="gap-1.5 py-1 pl-1 pr-2 font-normal"
                                  >
                                    <Avatar className="h-5 w-5">
                                      <AvatarImage
                                        src={
                                          technician.avatar_url || undefined
                                        }
                                      />
                                      <AvatarFallback className="text-[9px]">
                                        {fullName.charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="max-w-[180px] truncate">
                                      {fullName}
                                    </span>
                                    <button
                                      type="button"
                                      className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                                      onClick={() =>
                                        field.onChange(
                                          value.filter(
                                            (id) => id !== technicianId,
                                          ),
                                        )
                                      }
                                      aria-label={`Quitar a ${fullName}`}
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                );
                              })}
                            </div>
                          )}

                          <p className="text-xs text-muted-foreground">
                            El líder no puede asignarse también como técnico.
                          </p>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>
              </section>

              {form.formState.errors.root?.message && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  {form.formState.errors.root.message}
                </div>
              )}
            </div>

            <DialogFooter className="shrink-0 gap-2 border-t border-border bg-card p-4 sm:flex-row sm:justify-end sm:px-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="w-full sm:w-auto"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isEditing ? (
                  <Pencil className="h-4 w-4" />
                ) : (
                  <FolderKanban className="h-4 w-4" />
                )}
                {isPending
                  ? isEditing
                    ? "Guardando..."
                    : "Creando..."
                  : isEditing
                    ? "Guardar cambios"
                    : "Crear proyecto"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
