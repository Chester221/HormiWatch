import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Camera, Loader2, Mail, UserRound, UserCircle, ContactRound, ShieldCheck, LifeBuoy, Save, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function Profile() {
    const { user, profile, updateProfile, uploadAvatar, isManager, refreshProfile } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [fullName, setFullName] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // ✅ Sincronizar fullName cuando profile carga
    useEffect(() => {
        if (profile?.full_name) {
            setFullName(profile.full_name);
        } else if (profile?.name && profile?.lastName) {
            // Fallback: combinar name + lastName
            setFullName(`${profile.name} ${profile.lastName || ''}`.trim());
        }
    }, [profile]);

    // Iniciales para el avatar
    const userInitials = (profile?.full_name || profile?.name || user?.email || "U")
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    // Manejar selección de archivo
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Por favor selecciona una imagen válida");
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error("La imagen no debe superar los 2MB");
            return;
        }

        setIsUploading(true);

        try {
            const { error } = await uploadAvatar(file);
            if (error) {
                toast.error(`Error al subir la imagen: ${error.message}`);
            } else {
                toast.success("Foto de perfil actualizada correctamente");
                await refreshProfile();
            }
        } catch (error: any) {
            toast.error(`Error: ${error.message}`);
        }

        setIsUploading(false);
    };

    // ✅ Guardar cambios del perfil - enviar full_name correctamente
    const handleSaveProfile = async () => {
        if (!fullName.trim()) {
            toast.error("El nombre no puede estar vacío");
            return;
        }

        setIsSaving(true);

        try {
            const { error } = await updateProfile({ full_name: fullName.trim() });

            if (error) {
                toast.error(`Error al guardar: ${error.message}`);
            } else {
                await refreshProfile();
                toast.success("Perfil actualizado correctamente");
            }
        } catch (error: any) {
            toast.error(`Error: ${error.message}`);
        }

        setIsSaving(false);
    };

    const fadeUp = {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 }
    };

    // ✅ Obtener el nombre del rol correctamente
    const roleName = typeof profile?.role === 'string' 
        ? profile.role 
        : profile?.role?.name || 'Technician';
    const isAdmin = roleName === 'Admin';
    const isManagerOrAdmin = isManager || isAdmin;

    const getRoleLabel = () => {
        if (isAdmin) return 'Administrador';
        if (isManager) return 'Manager';
        return 'Técnico';
    };

    const getRoleDescription = () => {
        if (isAdmin) return 'Acceso total al sistema. Puedes gestionar usuarios, proyectos y configuraciones.';
        if (isManager) return 'Puedes gestionar proyectos, asignar técnicos y ver reportes.';
        return 'Puedes registrar horas en proyectos asignados.';
    };

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="mb-6 flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0DA2E7]/10">
                            <UserCircle className="h-6 w-6 text-[#0DA2E7]" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground tracking-tight">
                                Mi Perfil
                            </h1>
                            <p className="mt-0.5 text-sm text-muted-foreground">{fullName || profile?.full_name || "No configurado"}</p>
                            <p className="text-sm text-muted-foreground">
                                Gestiona tu información personal y foto de perfil
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Card de Perfil */}
                <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
                    <Card className="border-border/40 shadow-sm hover:shadow-md transition-all duration-300">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-semibold tracking-tight flex items-center gap-2.5">
                                <div className="p-1.5 rounded-lg bg-[#0DA2E7]/10">
                                    <ContactRound className="h-4 w-4 text-[#0DA2E7]" />
                                </div>
                                Información Personal
                            </CardTitle>
                            <CardDescription className="text-sm">
                                Actualiza tu foto y nombre de perfil
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Avatar Section */}
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                                        <AvatarImage src={profile?.avatar_url || undefined} />
                                        <AvatarFallback className="bg-[#0DA2E7]/10 text-[#0DA2E7] text-2xl font-bold">
                                            {userInitials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <Button
                                        size="icon"
                                        variant="secondary"
                                        className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md hover:bg-[#0DA2E7] hover:text-white transition-colors duration-200"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                    >
                                        {isUploading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Camera className="h-4 w-4" />
                                        )}
                                    </Button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileSelect}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-medium text-foreground">Foto de Perfil</p>
                                    <p className="text-sm text-muted-foreground">
                                        JPG, PNG o GIF. Máximo 2MB.
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="hover:border-[#0DA2E7]/30 hover:text-[#0DA2E7] transition-colors duration-200"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                    >
                                        {isUploading ? "Subiendo..." : "Cambiar foto"}
                                    </Button>
                                </div>
                            </div>

                            <Separator className="bg-border/30" />

                            {/* Formulario */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName" className="text-xs font-semibold text-foreground">
                                        Nombre Completo
                                    </Label>
                                    <div className="relative">
                                        <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="fullName"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Tu nombre completo"
                                            autoComplete="name"
                                            className="pl-10 h-10 text-sm bg-background border-border/60 rounded-lg focus:border-[#0DA2E7]/50 transition-colors"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Escribe tu nombre completo y pulsa{" "}
                                        <span className="font-medium text-foreground">Guardar Cambios</span>.
                                        Se actualizará en toda la aplicación.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                                        Correo Electrónico
                                    </Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            value={user?.email || ""}
                                            disabled
                                            className="pl-10 h-10 text-sm bg-muted/30 border-border/60 rounded-lg cursor-not-allowed"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        El correo electrónico no puede ser modificado
                                    </p>
                                </div>
                            </div>

                            <Separator className="bg-border/30" />

                            {/* Rol */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0DA2E7]/10">
                                        <ShieldCheck className="h-5 w-5 text-[#0DA2E7]" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">Rol en el Sistema</p>
                                        <p className="text-sm text-muted-foreground">
                                            {getRoleDescription()}
                                        </p>
                                    </div>
                                </div>
                                <Badge
                                    className={`gap-1 px-3 py-1 text-xs font-medium ${
                                        isManagerOrAdmin 
                                            ? "bg-[#0DA2E7]/10 text-[#0DA2E7] border-[#0DA2E7]/20" 
                                            : "bg-muted/30 text-muted-foreground border-border/30"
                                    }`}
                                >
                                    {isManagerOrAdmin ? (
                                        <>
                                            <CheckCircle className="h-3 w-3" />
                                            {getRoleLabel()}
                                        </>
                                    ) : (
                                        "Técnico"
                                    )}
                                </Badge>
                            </div>

                            <Separator className="bg-border/30" />

                            {/* Botón Guardar */}
                            <div className="flex justify-end">
                                <Button
                                    onClick={handleSaveProfile}
                                    disabled={isSaving}
                                    className="gap-2 bg-[#0DA2E7] hover:bg-[#0B8BC7] text-white shadow-sm hover:shadow-md transition-all duration-200"
                                >
                                    {isSaving ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    Guardar Cambios
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Info Card */}
                <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
                    <Card className="bg-muted/30 border-border/70 shadow-sm">
                        <CardContent className="flex items-start gap-4 pt-6">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0DA2E7]/10">
                                <LifeBuoy className="h-5 w-5 text-[#0DA2E7]" />
                            </div>
                            <div>
                                <p className="font-medium text-foreground">¿Necesitas cambiar tu rol?</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Los roles son asignados por administradores del sistema. Si necesitas acceso como Líder de Proyecto, contacta al administrador.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </DashboardLayout>
    );
}