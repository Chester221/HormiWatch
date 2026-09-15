import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  UserPlus,
  Mail,
  Shield,
  Phone,
  User,
  Key,
  CreditCard,
  Settings2,
  Briefcase,
  Wrench,
  Camera,
  Check,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { usersApi, rolesApi, storageApi } from "@/lib/api";
import { motion } from "framer-motion";

interface AddUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const getRoleIcon = (name: string) => {
  switch (name) {
    case "Admin": return Settings2;
    case "Manager": return Briefcase;
    case "Technician": return Wrench;
    default: return User;
  }
};

const getRoleAccent = (name: string) => {
  switch (name) {
    case "Admin": return { icon: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30", desc: "Acceso total al sistema. Gestiona usuarios, proyectos, clientes y configuración." };
    case "Manager": return { icon: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30", desc: "Gestiona proyectos y equipos. Visualiza reportes y estadísticas." };
    case "Technician": return { icon: "text-[#0DA2E7]", bg: "bg-[#0DA2E7]/10", desc: "Registra horas, completa tareas asignadas y gestiona su carga de trabajo." };
    default: return { icon: "text-muted-foreground", bg: "bg-muted", desc: "" };
  }
};

export function AddUserModal({ open, onOpenChange, onSuccess }: AddUserModalProps) {
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [roleName, setRoleName] = useState("Technician");
  const [roleUuid, setRoleUuid] = useState("");
  const [phone, setPhone] = useState("+58 ");
  const [cedulaType, setCedulaType] = useState("V");
  const [cedula, setCedula] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activeAdmins, setActiveAdmins] = useState(0);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    rolesApi.getAll().then((data: any[]) => {
      setRoles(data);
      const tech = data.find((r) => r.name === "Technician");
      setRoleUuid(tech?.id || data[0]?.id || "");
    }).catch(() => {});
    usersApi.getAll().then((data: any) => {
      const list = Array.isArray(data) ? data : data?.records || data?.data || [];
      const admins = list.filter(
        (u: any) => (u.role?.name === "Admin" || u.role_name === "Admin") && u.is_active !== false && u.isActive !== false
      ).length;
      setActiveAdmins(admins);
    }).catch(() => {});
  }, [open]);

  const reset = () => {
    setEmail(""); setPassword(""); setFullName(""); setRoleName("Technician");
    setPhone("+58 "); setCedulaType("V"); setCedula("");
    setAvatarPreview(null); setAvatarFile(null); setErrors({});
  };

  const validateEmail = (e: string) => e.includes("@") && e.includes(".");

  const pwChecks = {
    length: password.length >= 6,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };
  const passwordValid = Object.values(pwChecks).every(Boolean);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith("+58")) val = "+58 " + val.replace(/[^\d\s]/g, "");
    const digits = val.slice(3).replace(/\s/g, "");
    let f = "+58";
    if (digits.length > 0) f += " " + digits.slice(0, 3);
    if (digits.length > 3) f += " " + digits.slice(3, 6);
    if (digits.length > 6) f += " " + digits.slice(6, 10);
    setPhone(f.trim());
  };

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { toast.error("Máximo 5 MB"); return; }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const validate = (): boolean => {
    const err: Record<string, string> = {};
    if (!fullName.trim()) err.fullName = "Requerido";
    if (!email.trim() || !validateEmail(email)) err.email = "Email inválido";
    if (!password || !passwordValid) err.password = "La contraseña no cumple los requisitos";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) { toast.error("Corrige los errores"); return; }

    setIsSubmitting(true);
    try {
      const phoneDigits = phone.replace(/[^\d]/g, "");
      const hasPhone = phoneDigits.length >= 10;
      const created: any = await usersApi.create({
        name: fullName.split(" ")[0] || fullName,
        lastName: fullName.split(" ").slice(1).join(" ") || undefined,
        email,
        password,
        roleId: roleUuid,
        phone: hasPhone ? `+${phoneDigits}` : undefined,
        idCard: cedula ? `${cedulaType}-${cedula}` : undefined,
      });

      const userId = created?.id || created?.data?.id;

      if (avatarFile && userId) {
        try {
          const up = await storageApi.upload(avatarFile, "avatars");
          if (up?.publicUrl) {
            await usersApi.update(userId, { avatar_url: up.publicUrl, full_name: fullName });
          }
        } catch {}
      }

      toast.success(`¡${fullName} creado exitosamente!`);
      reset();
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.message || "Error al crear usuario");
    } finally {
      setIsSubmitting(false);
    }
  };

  const RoleIcon = getRoleIcon(roleName);
  const accent = getRoleAccent(roleName);
  const roleData = roles.find((r) => r.id === roleUuid);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-md border-border/60 bg-card p-0 rounded-2xl overflow-hidden shadow-xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>Nuevo Usuario</DialogTitle>
          <DialogDescription>Crea la cuenta de un nuevo miembro</DialogDescription>
        </DialogHeader>

        <div className="p-5 pb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0DA2E7] to-[#0B8BC7] shadow-md shadow-[#0DA2E7]/25">
              <UserPlus className="h-5 w-5 text-white" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-foreground">Nuevo Usuario</h2>
              <p className="text-xs text-muted-foreground">Crea la cuenta de un nuevo miembro del equipo</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Avatar + Nombre */}
          <div className="flex items-end gap-3">
            <div className="relative shrink-0">
              <Avatar className="h-14 w-14 ring-2 ring-border">
                <AvatarImage src={avatarPreview || ""} />
                <AvatarFallback className="text-base font-bold bg-muted text-muted-foreground">
                  {fullName ? fullName.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#0DA2E7] text-white shadow-md hover:bg-[#0B8BC7] transition-colors"
              >
                <Camera className="h-3 w-3" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
            </div>
            <div className="flex-1 min-w-0">
              <Label className="text-[11px] font-medium text-muted-foreground">Nombre completo *</Label>
              <Input
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setErrors((p) => ({ ...p, fullName: "" })); }}
                placeholder="Juan Pérez"
                className={`mt-1 h-9 rounded-lg bg-muted/20 border-border/60 text-sm ${errors.fullName ? "border-red-400" : ""}`}
              />
              {errors.fullName && <p className="mt-0.5 text-[10px] text-red-500">{errors.fullName}</p>}
            </div>
          </div>

          {/* Email + Password */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px] font-medium text-muted-foreground">Email *</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: "" })); }}
                placeholder="usuario@correo.com"
                className={`mt-1 h-9 rounded-lg bg-muted/20 border-border/60 text-sm ${errors.email ? "border-red-400" : ""}`}
              />
              {errors.email && <p className="mt-0.5 text-[10px] text-red-500">{errors.email}</p>}
            </div>
            <div>
              <Label className="text-[11px] font-medium text-muted-foreground">Contraseña *</Label>
              <div className="relative mt-1">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: "" })); }}
                  placeholder="Mín. 6 caracteres"
                  className={`h-9 rounded-lg bg-muted/20 border-border/60 text-sm pr-9 ${errors.password ? "border-red-400" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="mt-1 grid grid-cols-2 gap-x-1 gap-y-0.5">
                  {(["length", "upper", "lower", "number", "symbol"] as const).map((k) => (
                    <span key={k} className={`flex items-center gap-1 text-[9px] leading-none ${pwChecks[k] ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/60"}`}>
                      {pwChecks[k] ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
                      {k === "length" ? "6+ chars" : k === "upper" ? "Mayús." : k === "lower" ? "Minús." : k === "number" ? "Número" : "Símbolo"}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Rol + Teléfono */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px] font-medium text-muted-foreground">Rol *</Label>
              <Select
                value={roleUuid}
                onValueChange={(v) => {
                  setRoleUuid(v);
                  const r = roles.find((x) => x.id === v);
                  if (r) setRoleName(r.name);
                }}
              >
                <SelectTrigger className="mt-1 h-9 rounded-lg bg-muted/20 border-border/60 text-sm">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {roles.map((r) => {
                    const I = getRoleIcon(r.name);
                    const adminFull = r.name === "Admin" && activeAdmins >= 2;
                    return (
                      <SelectItem
                        key={r.id}
                        value={r.id}
                        disabled={adminFull}
                        className={`text-sm ${adminFull ? "opacity-50" : ""}`}
                      >
                        <span className="flex items-center gap-2">
                          <I className={`h-3.5 w-3.5 ${getRoleAccent(r.name).icon}`} />
                          {r.name}
                          {adminFull && <span className="ml-1 text-[10px] text-muted-foreground">(límite 2)</span>}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] font-medium text-muted-foreground">Teléfono</Label>
              <Input
                value={phone}
                onChange={handlePhoneChange}
                placeholder="+58 412 413 4891"
                className="mt-1 h-9 rounded-lg bg-muted/20 border-border/60 text-sm font-mono"
              />
            </div>
          </div>

          {/* Cédula */}
          <div>
            <Label className="text-[11px] font-medium text-muted-foreground">Cédula</Label>
            <div className="flex gap-2 mt-1">
              <Select value={cedulaType} onValueChange={setCedulaType}>
                <SelectTrigger className="w-16 h-9 rounded-lg bg-muted/20 border-border/60 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="V">V</SelectItem>
                  <SelectItem value="E">E</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={cedula}
                onChange={(e) => setCedula(e.target.value.replace(/[^\d]/g, "").slice(0, 8))}
                placeholder="12345678"
                className="flex-1 h-9 rounded-lg bg-muted/20 border-border/60 text-sm"
                inputMode="numeric"
              />
            </div>
          </div>

          {/* Info del rol seleccionado */}
          {roleData && (
            <motion.div
              key={roleData.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-xl border border-border/50 ${accent.bg}`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <RoleIcon className={`h-4 w-4 ${accent.icon}`} />
                <span className={`text-sm font-semibold ${accent.icon}`}>{roleData.name}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{accent.desc}</p>
            </motion.div>
          )}

          <DialogFooter className="gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-lg h-9 px-4 text-xs border-border/60 flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-lg h-9 px-4 gap-1.5 bg-[#0DA2E7] text-white text-xs flex-1 hover:bg-[#0B8BC7]">
              {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
              {isSubmitting ? "Creando..." : "Crear Usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}