import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { usersApi } from "@/lib/api";
import { KeyRound, Lock, Eye, EyeOff, Loader2, Check, X } from "lucide-react";

interface ResetPasswordUser {
  id: string;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
}

interface ResetPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: ResetPasswordUser | null;
  onSuccess?: () => void;
}

const getDisplayName = (user: ResetPasswordUser | null) =>
  user?.full_name || user?.email || "Usuario";

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U";

export function ResetPasswordModal({
  open,
  onOpenChange,
  user,
  onSuccess,
}: ResetPasswordModalProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
    }
  }, [open]);

  const checks = {
    length: password.length >= 6,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };
  const passwordValid = Object.values(checks).every(Boolean);
  const matches = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!passwordValid) {
      toast.error("La contraseña no cumple los requisitos");
      return;
    }
    if (!matches) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    setIsLoading(true);
    try {
      await usersApi.update(user.id, { password });
      toast.success(`Contraseña restablecida para ${getDisplayName(user)}`);
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error?.message || "No se pudo restablecer la contraseña");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border p-0 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-5 bg-gradient-to-r from-[#0DA2E7]/15 via-[#0DA2E7]/5 to-transparent border-b border-border">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0DA2E7] shadow-lg shadow-[#0DA2E7]/25">
              <KeyRound className="h-5 w-5 text-white" />
            </span>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Restablecer contraseña
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Asigna una nueva contraseña al usuario
              </DialogDescription>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {user && (
            <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 p-3">
              <Avatar className="h-10 w-10 ring-2 ring-[#0DA2E7]/20">
                <AvatarImage src={user.avatar_url || ""} />
                <AvatarFallback className="bg-[#0DA2E7]/10 text-[#0DA2E7] text-xs font-bold">
                  {getInitials(getDisplayName(user))}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {getDisplayName(user)}
                </p>
                {user.email && (
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Nueva contraseña
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="h-10 pl-10 pr-10 rounded-lg bg-muted/20 border-border/60 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {password.length > 0 && (
              <div className="grid grid-cols-2 gap-x-1 gap-y-0.5">
                {(["length", "upper", "lower", "number", "symbol"] as const).map((k) => (
                  <span
                    key={k}
                    className={`flex items-center gap-1 text-[9px] leading-none ${
                      checks[k] ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/60"
                    }`}
                  >
                    {checks[k] ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
                    {k === "length"
                      ? "6+ chars"
                      : k === "upper"
                        ? "Mayús."
                        : k === "lower"
                          ? "Minús."
                          : k === "number"
                            ? "Número"
                            : "Símbolo"}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Confirmar contraseña
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="h-10 pl-10 rounded-lg bg-muted/20 border-border/60 text-sm"
              />
            </div>
            {confirmPassword.length > 0 && !matches && (
              <p className="text-[10px] text-red-500">Las contraseñas no coinciden</p>
            )}
          </div>

          <DialogFooter className="gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="h-10 flex-1 rounded-lg text-sm border-border/60"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !passwordValid || !matches}
              className="h-10 flex-1 gap-2 rounded-lg bg-[#0DA2E7] text-white text-sm hover:bg-[#0B8BC7]"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              {isLoading ? "Guardando..." : "Restablecer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
