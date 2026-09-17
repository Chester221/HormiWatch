import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";

// ⚡ CODE-SPLITTING: cada página se descarga bajo demanda (chunk propio),
// reduciendo el bundle inicial y acelerando la carga de la app.
const TechnicianDashboard = lazy(() => import("./pages/TechnicianDashboard"));
const ManagerDashboard = lazy(() => import("./pages/DashboardMG"));
const Projects = lazy(() => import("./pages/Projects"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Clients = lazy(() => import("./pages/Clients"));
const Team = lazy(() => import("./pages/Team"));
const Services = lazy(() => import("./pages/Services"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

// ✅ Fuente única del tema: modo oscuro SOLO con sesión activa y fuera de /auth.
// La página de login/registro SIEMPRE se muestra clara.
const ThemeController = () => {
  const { profile } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const isAuthRoute = location.pathname === "/auth";
    if (isAuthRoute || !profile?.dark_mode) {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  }, [location.pathname, profile]);

  return null;
};

const AuthErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const { error, refreshProfile } = useAuth();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
        <h2 className="text-2xl font-bold text-destructive mb-2">Error de Conexión</h2>
        <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
        <Button onClick={() => window.location.reload()} variant="default">
          Reintentar
        </Button>
        <Button onClick={refreshProfile} variant="outline" className="mt-2">
          Intentar reconectar sesión
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};

// Componente para redirigir según el rol al dashboard principal
const RoleBasedDashboard = () => {
  const { profile, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  
  const rawRole = profile?.role;
  const role = rawRole ? rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase() : null;
  
  // Manager Y Leader van al Dashboard Gerencial
  if (role === 'Manager' || role === 'Leader') return <Navigate to="/gerencial" replace />;
  if (role === 'Admin') return <Navigate to="/control-usuarios" replace />;
  return <Navigate to="/dashboard" replace />;
};

// 🔥 Componente para BLOQUEAR acceso de Manager/Leader/Admin al dashboard de técnico
const TechnicianDashboardGuard = () => {
  const { profile } = useAuth();
  const role = profile?.role;
  
  // Si es Manager, Leader o Admin, redirigir al dashboard gerencial
  if (role === 'Manager' || role === 'Leader') {
    return <Navigate to="/gerencial" replace />;
  }
  if (role === 'Admin') {
    return <Navigate to="/control-usuarios" replace />;
  }
  
  return <TechnicianDashboard />;
};

// 🔥 Componente para BLOQUEAR acceso de Admin al dashboard gerencial
const ManagerDashboardGuard = () => {
  const { profile } = useAuth();
  const role = profile?.role;
  
  // Si es Admin, redirigir a su dashboard
  if (role === 'Admin') {
    return <Navigate to="/control-usuarios" replace />;
  }
  
  return <ManagerDashboard />;
};

// 🔥 Componente para BLOQUEAR acceso de no-Admins al panel de admin
const AdminDashboardGuard = () => {
  const { profile } = useAuth();
  const role = profile?.role;
  
  // Si NO es Admin, redirigir según su rol
  if (role !== 'Admin') {
    if (role === 'Manager' || role === 'Leader') {
      return <Navigate to="/gerencial" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  
  return <AdminDashboard />;
};

// Fallback de carga mientras se descarga el chunk de la página
const PageLoader = () => (
  <div className="flex justify-center items-center h-screen bg-background">
    <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <ThemeController />
          <AuthErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={<RoleBasedDashboard />} />
                
                {/* 🔥 Dashboard técnico - BLOQUEADO para Manager/Leader/Admin */}
                <Route path="/dashboard" element={
                  <ProtectedRoute><TechnicianDashboardGuard /></ProtectedRoute>
                } />
                
                {/* 🔥 Dashboard gerencial - BLOQUEADO para Admin */}
                <Route path="/gerencial" element={
                  <ProtectedRoute requiredRole={['Manager', 'Leader']}><ManagerDashboardGuard /></ProtectedRoute>
                } />
                
                {/* 🔥 Panel Admin - BLOQUEADO para no-Admins */}
                <Route path="/control-usuarios" element={
                  <ProtectedRoute requiredRole={['Admin']}><AdminDashboardGuard /></ProtectedRoute>
                } />
                
                <Route path="/tasks" element={
                  <ProtectedRoute><Tasks /></ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute><Profile /></ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute><Settings /></ProtectedRoute>
                } />
                <Route path="/projects" element={
                  <ProtectedRoute requiredRole={['Manager', 'Leader', 'Admin', 'Technician']}><Projects /></ProtectedRoute>
                } />
                <Route path="/clients" element={
                  <ProtectedRoute requiredRole={['Manager', 'Leader', 'Admin']}><Clients /></ProtectedRoute>
                } />
                <Route path="/team" element={
                  <ProtectedRoute requiredRole={['Manager', 'Leader', 'Admin']}><Team /></ProtectedRoute>
                } />
                <Route path="/services" element={
                  <ProtectedRoute requiredRole={['Manager', 'Leader', 'Admin', 'Technician']}><Services /></ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthErrorBoundary>
        </HashRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;