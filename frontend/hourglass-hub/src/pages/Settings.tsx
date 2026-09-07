import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Bell, 
  Moon, 
  Sun, 
  Shield, 
  Trash2, 
  Info, 
  Loader2,
  User,
  Mail,
  Calendar,
  Palette,
  AlertTriangle,
  Settings as SettingsIcon
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function Settings() {
    const { user, profile, updatePreferences } = useAuth();
    const [loading, setLoading] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    // 🔥 Cargar preferencia de dark_mode desde el perfil
    useEffect(() => {
        if (profile) {
            // Cargar dark_mode desde el perfil
            const savedDark = profile.dark_mode ?? false;
            setDarkMode(savedDark);
            if (savedDark) {
                document.documentElement.classList.add("dark");
            } else {
                document.documentElement.classList.remove("dark");
            }
        }
    }, [profile]);

    // 🔥 Guardar dark_mode en la base de datos
    const handleDarkModeToggle = async (checked: boolean) => {
        setLoading(true);
        try {
            // Guardar en la base de datos
            await updatePreferences({ dark_mode: checked });
            
            setDarkMode(checked);
            
            // Aplicar en el DOM
            if (checked) {
                document.documentElement.classList.add("dark");
                toast.success("Modo oscuro activado");
            } else {
                document.documentElement.classList.remove("dark");
                toast.success("Modo claro activado");
            }
        } catch (error) {
            toast.error("Error al guardar la preferencia");
            // Revertir el estado local
            setDarkMode(!checked);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = () => {
        if (confirm("¿Estás seguro? Esta acción no se puede deshacer.")) {
            toast.error("Eliminación de cuenta no implementada aún");
        }
    };

    const fadeUp = {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 }
    };

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-6"
                >
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 rounded-xl bg-[#0DA2E7]/10">
                            <SettingsIcon className="h-5 w-5 text-[#0DA2E7]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground tracking-tight">
                                Configuración
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Personaliza tu experiencia en Hormiwatch
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Apariencia */}
                <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
                    <Card className="border-border/40 shadow-sm hover:shadow-md transition-all duration-300">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold flex items-center gap-2.5">
                                <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                                    <Palette className="h-4 w-4 text-purple-500" />
                                </div>
                                Apariencia
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Personaliza cómo se ve la aplicación
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/5 hover:bg-muted/10 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-muted/30">
                                        {darkMode ? (
                                            <Moon className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <Sun className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">
                                            {darkMode ? "Modo Oscuro" : "Modo Claro"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {darkMode 
                                                ? "Reduce la fatiga visual en entornos con poca luz" 
                                                : "Ideal para entornos con buena iluminación"
                                            }
                                        </p>
                                    </div>
                                </div>
                                <Switch 
                                    checked={darkMode} 
                                    onCheckedChange={handleDarkModeToggle} 
                                    disabled={loading}
                                    className="data-[state=checked]:bg-[#0DA2E7]"
                                />
                            </div>
                            {loading && (
                                <p className="text-xs text-muted-foreground text-center mt-2">
                                    Guardando preferencia...
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Información de la Cuenta */}
                <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
                    <Card className="border-border/40 shadow-sm hover:shadow-md transition-all duration-300">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold flex items-center gap-2.5">
                                <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
                                    <User className="h-4 w-4 text-emerald-500" />
                                </div>
                                Información de la Cuenta
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Detalles de tu cuenta
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-3 rounded-lg bg-muted/5 border border-border/20">
                                    <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider flex items-center gap-1.5">
                                        <Mail className="h-3 w-3" />
                                        Email
                                    </p>
                                    <p className="text-sm font-medium text-foreground mt-1">{user?.email}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-muted/5 border border-border/20">
                                    <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider flex items-center gap-1.5">
                                        <Shield className="h-3 w-3" />
                                        Rol
                                    </p>
                                    <p className="text-sm font-medium text-foreground mt-1">{profile?.role || 'Técnico'}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-muted/5 border border-border/20">
                                    <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider flex items-center gap-1.5">
                                        <User className="h-3 w-3" />
                                        Nombre
                                    </p>
                                    <p className="text-sm font-medium text-foreground mt-1">{profile?.full_name || 'No configurado'}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-muted/5 border border-border/20">
                                    <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider flex items-center gap-1.5">
                                        <Calendar className="h-3 w-3" />
                                        Miembro desde
                                    </p>
                                    <p className="text-sm font-medium text-foreground mt-1">
                                        {user?.created_at 
                                            ? new Date(user.created_at).toLocaleDateString("es-ES", { 
                                                year: "numeric", 
                                                month: "long", 
                                                day: "numeric" 
                                            }) 
                                            : "N/A"
                                        }
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Notificaciones (Próximamente) */}
                <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
                    <Card className="border-border/40 shadow-sm hover:shadow-md transition-all duration-300 bg-muted/5">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold flex items-center gap-2.5 text-muted-foreground">
                                <div className="p-1.5 rounded-lg bg-muted/30">
                                    <Bell className="h-4 w-4 text-muted-foreground" />
                                </div>
                                Notificaciones
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Próximamente
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center py-6 text-center">
                                <div className="space-y-2">
                                    <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                                    <p className="text-sm text-muted-foreground/60">
                                        La configuración de notificaciones estará disponible pronto
                                    </p>
                                    <p className="text-xs text-muted-foreground/40">
                                        Podrás controlar qué notificaciones recibes
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Zona de Peligro */}
                <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
                    <Card className="border-destructive/30 shadow-sm hover:shadow-md transition-all duration-300 bg-red-50/10 dark:bg-red-950/5">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold flex items-center gap-2.5 text-destructive">
                                <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/20">
                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                </div>
                                Zona de Peligro
                            </CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">
                                Acciones irreversibles
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-red-50/30 dark:bg-red-950/10 border border-red-200/50 dark:border-red-900/30">
                                <div>
                                    <p className="text-sm font-medium text-foreground">Eliminar Cuenta</p>
                                    <p className="text-xs text-muted-foreground">Elimina permanentemente tu cuenta y todos sus datos</p>
                                </div>
                                <Button 
                                    variant="destructive" 
                                    size="sm" 
                                    className="gap-2 rounded-lg hover:bg-red-600 transition-all duration-200"
                                    onClick={handleDeleteAccount}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Eliminar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </DashboardLayout>
    );
}