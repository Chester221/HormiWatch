import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, UserPlus, Mail, Shield, Phone, User, Key, CreditCard, Settings2, Briefcase, Wrench, CheckCircle, Camera } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { motion } from "framer-motion";

const HORMI_BLUE = '#0DA2E7';

interface AddUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddUserModal({ open, onOpenChange, onSuccess }: AddUserModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("Technician");
  const [phone, setPhone] = useState("+58 ");
  const [cedula, setCedula] = useState("");
  const [cedulaType, setCedulaType] = useState("V");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [errors, setErrors] = useState({ fullName: "", email: "", password: "" });

  const resetForm = () => {
    setEmail(""); 
    setPassword(""); 
    setFullName(""); 
    setRole("Technician");
    setPhone("+58 "); 
    setCedula(""); 
    setCedulaType("V");
    setAvatarPreview(null); 
    setAvatarFile(null);
    setErrors({ fullName: "", email: "", password: "" });
  };

  const validateEmail = (email: string) => email.includes('@') && email.includes('.');

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (e.target.value && !validateEmail(e.target.value)) {
      setErrors(prev => ({ ...prev, email: "Debe contener @" }));
    } else {
      setErrors(prev => ({ ...prev, email: "" }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (e.target.value && e.target.value.length < 6) {
      setErrors(prev => ({ ...prev, password: "Mínimo 6 caracteres" }));
    } else {
      setErrors(prev => ({ ...prev, password: "" }));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith("+58")) val = "+58 " + val.replace(/[^\d\s]/g, "");
    const digits = val.slice(3).replace(/\s/g, "");
    let formatted = "+58";
    if (digits.length > 0) formatted += " " + digits.slice(0, 3);
    if (digits.length > 3) formatted += " " + digits.slice(3, 6);
    if (digits.length > 6) formatted += " " + digits.slice(6, 10);
    setPhone(formatted.trim());
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { 
        toast.error("Máximo 5MB"); 
        return; 
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const getRoleInfo = (r: string) => {
    switch (r) {
      case 'Admin': 
        return { 
          icon: Settings2, 
          color: '#f59e0b', 
          bg: 'bg-amber-50', 
          text: 'text-amber-700', 
          label: 'Administrador',
          description: 'Acceso total al sistema. Puede gestionar usuarios, visualizar proyectos, clientes y configurar la plataforma.'
        };
      case 'Manager': 
        return { 
          icon: Briefcase, 
          color: '#3b82f6', 
          bg: 'bg-blue-50', 
          text: 'text-blue-700', 
          label: 'Manager',
          description: 'Gestiona proyectos, equipos de trabajo y clientes. Puede ver reportes y estadísticas del equipo.'
        };
      case 'Technician': 
        return { 
          icon: Wrench, 
          color: HORMI_BLUE, 
          bg: 'bg-sky-50', 
          text: 'text-sky-700', 
          label: 'Técnico',
          description: 'Registra horas trabajadas, completa tareas asignadas.'
        };
      default: 
        return { 
          icon: User, 
          color: '#6b7280', 
          bg: 'bg-gray-50', 
          text: 'text-gray-700', 
          label: r,
          description: ''
        };
    }
  };

  // ✅ HANDLE SUBMIT - Usa el token del BACKEND
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    const newErrors = { fullName: "", email: "", password: "" };
    let hasError = false;
    
    if (!fullName.trim()) { 
      newErrors.fullName = "Requerido"; 
      hasError = true; 
    }
    if (!email.trim() || !validateEmail(email)) { 
      newErrors.email = "Email inválido"; 
      hasError = true; 
    }
    if (!password.trim() || password.length < 6) { 
      newErrors.password = "Mínimo 6 caracteres"; 
      hasError = true; 
    }
    
    setErrors(newErrors);
    if (hasError) { 
      toast.error("Corrige los errores"); 
      return; 
    }

    setIsSubmitting(true);
    
    try {
      // 🔥 OBTENER TOKEN DEL BACKEND (desde localStorage)
      const token = localStorage.getItem('auth_token');

      if (!token) {
        toast.error('No tienes sesión activa. Inicia sesión de nuevo.');
        setIsSubmitting(false);
        return;
      }

      // 🔥 URL CORRECTA (siempre con /api/v1)
      const apiUrl = 'https://hormiwatch2-main-production.up.railway.app/api/v1';
      
      const response = await fetch(`${apiUrl}/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          password: password,
          full_name: fullName,
          role: role,
          phone: phone || null,
          cedula: cedula || null,
          avatar_url: null,
          is_active: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear usuario');
      }

      // ✅ ÉXITO - Sin redirección, solo cerrar modal
      toast.success(`¡${fullName} creado exitosamente!`);
      resetForm();
      onSuccess?.(); // Actualizar lista de usuarios
      onOpenChange(false); // Cerrar modal
      
    } catch (error: any) {
      console.error('Error en handleSubmit:', error);
      toast.error(error.message || 'Error al crear usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleInfo = getRoleInfo(role);
  const RoleIcon = roleInfo.icon;

  return (
    <Dialog open={open} onOpenChange={(o) => { 
      if (!o) resetForm(); 
      onOpenChange(o); 
    }}>
      <DialogContent className="max-w-md bg-card border-border p-0 rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header compacto */}
        <div className="relative p-4 bg-gradient-to-r from-[#0DA2E7]/15 via-[#0DA2E7]/5 to-transparent border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0DA2E7] to-[#0B8BC7] shadow-lg shadow-[#0DA2E7]/30">
              <UserPlus className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-1.5">
                Nuevo Usuario
              </DialogTitle>
              <DialogDescription className="text-[11px] text-muted-foreground">
                Crear cuenta de usuario
              </DialogDescription>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {/* Avatar + Nombre en una fila */}
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <Avatar className="h-14 w-14 ring-2 ring-border">
                <AvatarImage src={avatarPreview || ""} />
                <AvatarFallback className="text-base font-bold bg-muted text-muted-foreground">
                  {fullName ? fullName.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
              <label className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#0DA2E7] text-white cursor-pointer hover:bg-[#0B8BC7] transition-colors shadow-lg">
                <Camera className="h-3 w-3" />
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  accept="image/*" 
                  onChange={handleAvatarChange} 
                  className="hidden" 
                />
              </label>
            </div>
            <div className="flex-1">
              <Label className="text-[11px] font-medium flex items-center gap-1 mb-1">
                <User className="h-3 w-3 text-muted-foreground" /> Nombre *
              </Label>
              <Input 
                value={fullName} 
                onChange={e => { 
                  setFullName(e.target.value); 
                  setErrors(prev => ({ ...prev, fullName: "" })); 
                }} 
                placeholder="Juan Pérez" 
                className={`bg-muted/30 border-border h-9 rounded-lg text-sm ${errors.fullName ? 'border-red-500' : ''}`} 
              />
              {errors.fullName && <p className="text-[10px] text-red-500 mt-0.5">{errors.fullName}</p>}
            </div>
          </div>

          {/* Email + Contraseña en 2 columnas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px] font-medium flex items-center gap-1 mb-1">
                <Mail className="h-3 w-3 text-muted-foreground" /> Email *
              </Label>
              <Input 
                type="email" 
                value={email} 
                onChange={handleEmailChange} 
                placeholder="usuario@email.com" 
                className={`bg-muted/30 border-border h-9 rounded-lg text-sm ${errors.email ? 'border-red-500' : ''}`} 
              />
              {errors.email && <p className="text-[10px] text-red-500 mt-0.5">{errors.email}</p>}
            </div>
            <div>
              <Label className="text-[11px] font-medium flex items-center gap-1 mb-1">
                <Key className="h-3 w-3 text-muted-foreground" /> Contraseña *
              </Label>
              <Input 
                type="password" 
                value={password} 
                onChange={handlePasswordChange} 
                placeholder="Mínimo 6" 
                className={`bg-muted/30 border-border h-9 rounded-lg text-sm ${errors.password ? 'border-red-500' : ''}`} 
              />
              {errors.password && <p className="text-[10px] text-red-500 mt-0.5">{errors.password}</p>}
            </div>
          </div>

          {/* Rol + Teléfono en 2 columnas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px] font-medium flex items-center gap-1 mb-1">
                <Shield className="h-3 w-3 text-muted-foreground" /> Rol *
              </Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="bg-muted/30 border-border h-9 rounded-lg text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="Admin">
                    <span className="flex items-center gap-2 text-sm">
                      <Settings2 className="h-3.5 w-3.5 text-amber-500" /> Admin
                    </span>
                  </SelectItem>
                  <SelectItem value="Manager">
                    <span className="flex items-center gap-2 text-sm">
                      <Briefcase className="h-3.5 w-3.5 text-blue-500" /> Manager
                    </span>
                  </SelectItem>
                  <SelectItem value="Technician">
                    <span className="flex items-center gap-2 text-sm">
                      <Wrench className="h-3.5 w-3.5 text-sky-500" /> Técnico
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] font-medium flex items-center gap-1 mb-1">
                <Phone className="h-3 w-3 text-muted-foreground" /> Teléfono (Opcional)
              </Label>
              <Input 
                value={phone} 
                onChange={handlePhoneChange} 
                placeholder="+58 412 413 4891" 
                className="bg-muted/30 border-border h-9 rounded-lg text-sm font-mono" 
              />
            </div>
          </div>

          {/* Cédula */}
          <div>
            <Label className="text-[11px] font-medium flex items-center gap-1 mb-1">
              <CreditCard className="h-3 w-3 text-muted-foreground" /> Cédula (Opcional)
            </Label>
            <div className="flex gap-2">
              <Select value={cedulaType} onValueChange={setCedulaType}>
                <SelectTrigger className="w-16 bg-muted/30 border-border h-9 rounded-lg text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="V">V</SelectItem>
                  <SelectItem value="E">E</SelectItem>
                </SelectContent>
              </Select>
              <Input 
                value={cedula} 
                onChange={e => setCedula(e.target.value.replace(/[^\d]/g, "").slice(0, 8))} 
                placeholder="12345678" 
                className="bg-muted/30 border-border h-9 rounded-lg text-sm flex-1" 
                inputMode="numeric" 
              />
            </div>
          </div>

          {/* Preview del rol */}
          <motion.div 
            key={role} 
            initial={{ opacity: 0, y: 5 }} 
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-xl border ${roleInfo.bg} border-border/50`}
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: roleInfo.color + '20' }}>
                <RoleIcon className="h-4 w-4" style={{ color: roleInfo.color }} />
              </div>
              <p className={`text-sm font-semibold ${roleInfo.text}`}>{roleInfo.label}</p>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {roleInfo.description}
            </p>
          </motion.div>

          {/* Footer */}
          <DialogFooter className="gap-2 pt-1">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="rounded-lg h-9 px-3 text-xs border-border flex-1"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="rounded-lg h-9 px-3 gap-1.5 text-white text-xs flex-1" 
              style={{ backgroundColor: HORMI_BLUE }}
            >
              {isSubmitting ? 
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 
                <CheckCircle className="h-3.5 w-3.5" />
              }
              {isSubmitting ? "Creando..." : "Crear Usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}