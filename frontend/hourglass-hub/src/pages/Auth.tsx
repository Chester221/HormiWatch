import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Mail, Lock, User, Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";

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

  // ✅ FIX: useEffect simplificado — solo actúa cuando llega a /auth con sesión preexistente.
  // Se bloquea con isLoading para no competir con handleLogin que ya tiene su propia redirección.
  useEffect(() => {
    // No redirigir si hay algún proceso activo
    if (isLoading) return;
    if (isSigningUp) return;
    if (isCreatingUser) return;
    if (signupSuccessRef.current) return;

    if (!authLoading && user && profile && location.pathname === '/auth') {
      console.log("=====================================");
      console.log("🔍 Auth.tsx - useEffect: sesión preexistente detectada");
      console.log("🔍 Auth.tsx - user:", user?.id);
      console.log("🔍 Auth.tsx - profile.role:", profile.role);
      console.log("=====================================");

      if (profile.is_active === false) {
        toast.error("Tu cuenta está desactivada. Contacta al administrador.");
        supabase.auth.signOut();
        return;
      }

      const from = (location.state as any)?.from?.pathname;

      if (from) {
        console.log("🔍 Auth.tsx - Redirigiendo a ruta guardada:", from);
        navigate(from, { replace: true });
        return;
      }

      const rawRole = profile.role;
      let normalizedRole = rawRole;
      if (rawRole) {
        normalizedRole = rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase() as typeof rawRole;
      }

      switch (normalizedRole) {
        case 'Admin':
          console.log("➡️ Redirigiendo a /control-usuarios");
          navigate('/control-usuarios', { replace: true });
          break;
        case 'Manager':
          console.log("➡️ Redirigiendo a /gerencial");
          navigate('/gerencial', { replace: true });
          break;
        case 'Technician':
          console.log("➡️ Redirigiendo a /dashboard");
          navigate('/dashboard', { replace: true });
          break;
        default:
          console.log("➡️ Redirigiendo a /dashboard (default)");
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
      // 1. Iniciar sesión en Supabase
      // ✅ FIX: signIn ahora retorna { data, error } correctamente (antes solo retornaba { error })
      const { data, error } = await signIn(loginEmail, loginPassword);
      if (error) {
        if (error.message.includes("Invalid login credentials") || error.message.includes("incorrectos")) {
          toast.error("Credenciales incorrectas.");
        } else if (error.message.includes("Email not confirmed") || error.message.includes("confirmar")) {
          toast.error("Por favor confirma tu email antes de iniciar sesión.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data?.user) {
        // 2. Verificar perfil en Supabase
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('is_active, role')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error("Error al verificar perfil:", profileError);
          toast.error("Error al verificar tu cuenta");
          await supabase.auth.signOut();
          return;
        }

        if (profileData?.is_active === false) {
          await supabase.auth.signOut();
          toast.error("Tu cuenta está desactivada. Contacta al administrador.");
          return;
        }

        // 3. OBTENER TOKEN DEL BACKEND
        const backendUrl = 'https://hormiwatch2-main-production.up.railway.app/api/v1';
        const response = await fetch(`${backendUrl}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: loginEmail, password: loginPassword })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error al obtener token del backend:', errorData);
          toast.error('Error al obtener token de autenticación');
          await supabase.auth.signOut();
          return;
        }

        const tokenData = await response.json();
        if (tokenData.access_token) {
          localStorage.setItem('auth_token', tokenData.access_token);
          console.log('✅ Token del backend guardado en localStorage');
        } else {
          console.error('No se recibió access_token del backend');
          toast.error('Error al obtener token de autenticación');
          await supabase.auth.signOut();
          return;
        }

        toast.success("¡Bienvenido de nuevo!");

        // 4. REDIRECCIÓN SEGÚN ROL
        const role = profileData?.role;
        console.log("🔍 Rol del usuario:", role);

        if (!role) {
          console.error("❌ El usuario no tiene rol asignado");
          toast.error("Error: No tienes un rol asignado");
          await supabase.auth.signOut();
          return;
        }

        const normalizedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
        console.log("🔍 Rol normalizado:", normalizedRole);

        // ✅ FIX: Usar navigate() en vez de window.location.hash para evitar reloads
        // y conflictos con HashRouter
        if (normalizedRole === 'Admin') {
          console.log("➡️ Redirigiendo a /control-usuarios");
          navigate('/control-usuarios', { replace: true });
        } else if (normalizedRole === 'Manager') {
          console.log("➡️ Redirigiendo a /gerencial");
          navigate('/gerencial', { replace: true });
        } else {
          console.log("➡️ Redirigiendo a /dashboard");
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

    setIsSigningUp(true);
    setIsLoading(true);

    try {
      const { error } = await signUp(signupEmail, signupPassword, { full_name: signupName });

      if (error) {
        if (error.message.includes("already registered") || error.message.includes("registrado")) {
          toast.error("Este email ya está registrado. Inicia sesión.");
        } else {
          toast.error(error.message);
        }
        setIsSigningUp(false);
        return;
      }

      // ✅ FIX: Marcar el ref ANTES de signOut para que el useEffect no redirija
      // si Supabase dispara SIGNED_IN antes de que el signOut lo deshaga
      signupSuccessRef.current = true;
      await supabase.auth.signOut();

      toast.success("¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.", {
        icon: <CheckCircle className="h-5 w-5 text-emerald-500" />,
        duration: 5000,
      });

      setSignupName("");
      setSignupEmail("");
      setSignupPassword("");
      setSignupConfirmPassword("");
      setActiveTab("login");

      setTimeout(() => {
        signupSuccessRef.current = false;
        setIsSigningUp(false);
      }, 500);

    } catch (error: any) {
      console.error("Error en registro:", error);
      toast.error("Error al crear la cuenta. Intenta de nuevo.");
      setIsSigningUp(false);
    } finally {
      setIsLoading(false);
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

              <TabsContent value="login" className="mt-0">
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
              </TabsContent>

              <TabsContent value="signup" className="mt-0">
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
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
