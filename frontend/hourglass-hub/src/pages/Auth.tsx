import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Mail, Lock, User, Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, loading: authLoading, signIn, signUp, isCreatingUser, setCreatingUser } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  const [isSigningUp, setIsSigningUp] = useState(false);
  const signupSuccessRef = useRef(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");

  useEffect(() => {
    if (isLoading) return;
    if (isSigningUp) return;
    if (isCreatingUser) return;
    if (signupSuccessRef.current) return;
  
    if (!authLoading && user && profile && location.pathname === '/auth') {
  
      if (profile.is_active === false) {
        toast.error("Tu cuenta está desactivada. Contacta al administrador.");
        authApi.logout();
        return;
      }
  
      // ✅ CORREGIDO: NO usar la ruta guardada, siempre redirigir por rol
      // Esto evita que te lleve a la última página donde estuviste
      const roleName = typeof profile.role === 'string' 
        ? profile.role 
        : profile.role?.name || 'Technician';
      
      const rawRole = roleName;
      let normalizedRole = rawRole;
      if (rawRole) {
        normalizedRole = rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase() as typeof rawRole;
      }
  
      switch (normalizedRole) {
        case 'Admin':
          navigate('/control-usuarios', { replace: true });
          break;
        case 'Manager':
          navigate('/gerencial', { replace: true });
          break;
        case 'Technician':
          navigate('/dashboard', { replace: true });
          break;
        default:
          navigate('/dashboard', { replace: true });
      }
    }
  }, [user, profile, authLoading, navigate, location, isLoading, isSigningUp, isCreatingUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error("Por favor completa todos los campos");
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await signIn(loginEmail, loginPassword);
      if (error) {
        const msg = error.message || "";
        if (msg.includes("La cuenta no existe")) {
          toast.error("La cuenta no existe.");
        } else if (msg.includes("Credenciales inválidas")) {
          toast.error("Credenciales inválidas.");
        } else if (msg.includes("desactivada")) {
          toast.error("Tu cuenta está desactivada. Contacta al administrador.");
        } else {
          toast.error(msg);
        }
        return;
      }

      // 💨 LOGIN INSTANTÁNEO: el perfil ya viene en la respuesta del login
      // (role + is_active), sin el segundo roundtrip que había antes.
      const profileData = data?.profile;
      if (profileData) {
        if (profileData.is_active === false) {
          await authApi.logout();
          toast.error("Tu cuenta está desactivada. Contacta al administrador.");
          return;
        }

        toast.success("¡Bienvenido de nuevo!");

        const roleName = profileData.role || 'Technician';
        const normalizedRole = roleName.charAt(0).toUpperCase() + roleName.slice(1).toLowerCase();

        if (normalizedRole === 'Admin') {
          navigate('/control-usuarios', { replace: true });
        } else if (normalizedRole === 'Manager') {
          navigate('/gerencial', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (error: any) {
      console.error('Error en login:', error);
      toast.error("Error de conexión. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signupName || !signupEmail || !signupPassword) {
      toast.error("Por favor completa todos los campos");
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (signupPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    // 💨 REGISTRO INSTANTÁNEO (optimista): toast + redirección inmediata.
    // La creación avanza en segundo plano; si falla, se muestra el error.
    signupSuccessRef.current = true;

    toast.success("¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.", {
      icon: <CheckCircle className="h-5 w-5 text-emerald-500" />,
      duration: 5000,
    });

    setSignupName("");
    setSignupEmail("");
    setSignupPassword("");
    setSignupConfirmPassword("");
    setActiveTab("login");
    setIsSigningUp(true);

    try {
      const result = await authApi.register({
        email: signupEmail,
        password: signupPassword,
        name: signupName,
      });

      if (result?.error) {
        toast.error(result.error.message || "Error al crear la cuenta");
      }
    } catch (error: any) {
      console.error("Error en registro:", error);
      toast.error(error.message || "Error al crear la cuenta. Intenta de nuevo.");
    } finally {
      signupSuccessRef.current = false;
      setIsSigningUp(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-primary blur-3xl" />
          <div className="absolute bottom-32 right-20 w-96 h-96 rounded-full bg-primary/50 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 py-12">
          <div className="flex items-center gap-3 mb-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-glow">
              <Clock className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-sidebar-primary-foreground">Hormiwatch</span>
          </div>
          <h1 className="text-4xl font-bold text-sidebar-primary-foreground mb-4 leading-tight">
            Controla tu tiempo,<br /><span className="text-primary">impulsa tu productividad</span>
          </h1>
          <p className="text-lg text-sidebar-foreground max-w-md mb-8">
            La forma moderna de gestionar proyectos, registrar horas y colaborar con tu equipo.
          </p>
          <div className="space-y-4">
            {["Seguimiento de proyectos en tiempo real", "Herramientas de colaboración para equipos", "Métricas detalladas y reportes", "Gestión de usuarios y roles"].map((feature, index) => (
              <div key={index} className="flex items-center gap-3 text-sidebar-foreground opacity-0 animate-fade-in" style={{ animationDelay: `${index * 150}ms` }}>
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 lg:hidden justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-glow">
              <Clock className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Hormiwatch</span>
          </div>

          <Card className="border-border bg-card shadow-card">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <CardHeader className="pb-4">
                <TabsList className="grid w-full grid-cols-2 bg-muted">
                  <TabsTrigger value="login" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">
                    Iniciar Sesión
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">
                    Registrarse
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <AnimatePresence mode="wait" initial={false}>
                {activeTab === "login" ? (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <CardHeader className="pt-0 pb-2">
                      <CardTitle className="text-xl">Bienvenido de nuevo</CardTitle>
                      <CardDescription>Ingresa tus credenciales para acceder</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Correo Electrónico</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="tu@empresa.com"
                          value={loginEmail}
                          onChange={e => setLoginEmail(e.target.value)}
                          className="pl-10 bg-muted/50 border-transparent focus:border-primary focus:bg-card"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Contraseña</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={e => setLoginPassword(e.target.value)}
                          className="pl-10 pr-10 bg-muted/50 border-transparent focus:border-primary focus:bg-card"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full gap-2 shadow-glow" disabled={isLoading}>
                      {isLoading ? (
                        <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      ) : (
                        <>Entrar <ArrowRight className="h-4 w-4" /></>
                      )}
                    </Button>
                  </form>
                  </CardContent>
                  </motion.div>
                ) : (
                  <motion.div
                    key="signup"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <CardHeader className="pt-0 pb-2">
                      <CardTitle className="text-xl">Crear una cuenta</CardTitle>
                      <CardDescription>Comienza gratis hoy mismo</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Nombre Completo</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-name"
                          placeholder="Juan Pérez"
                          value={signupName}
                          onChange={e => setSignupName(e.target.value)}
                          className="pl-10 bg-muted/50 border-transparent focus:border-primary focus:bg-card"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Correo Electrónico</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="juan@empresa.com"
                          value={signupEmail}
                          onChange={e => setSignupEmail(e.target.value)}
                          className="pl-10 bg-muted/50 border-transparent focus:border-primary focus:bg-card"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Contraseña</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Mínimo 6 caracteres"
                          value={signupPassword}
                          onChange={e => setSignupPassword(e.target.value)}
                          className="pl-10 pr-10 bg-muted/50 border-transparent focus:border-primary focus:bg-card"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm">Confirmar Contraseña</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-confirm"
                          type={showPassword ? "text" : "password"}
                          placeholder="Repite tu contraseña"
                          value={signupConfirmPassword}
                          onChange={e => setSignupConfirmPassword(e.target.value)}
                          className="pl-10 bg-muted/50 border-transparent focus:border-primary focus:bg-card"
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full gap-2 shadow-glow" disabled={isLoading || isSigningUp}>
                      {isLoading ? (
                        <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      ) : (
                        <>Crear Cuenta <ArrowRight className="h-4 w-4" /></>
                      )}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Al crear una cuenta, aceptas nuestros <button type="button" className="text-primary hover:underline">Términos</button> y <button type="button" className="text-primary hover:underline">Privacidad</button>
                    </p>
                  </form>
                  </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;