import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
    children: ReactNode
    requiredRole?: ('Admin' | 'Manager' | 'Technician')[]
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    const { user, profile, loading, isCreatingUser } = useAuth()
    const location = useLocation()

    // 1. Mientras carga la sesión, mostrar spinner
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Verificando sesión...</p>
                </div>
            </div>
        )
    }

    // 2. Sin usuario → redirigir al login
    if (!user) {
        return <Navigate to="/auth" state={{ from: location }} replace />
    }

    // ✅ FIX: Si hay usuario pero el perfil aún no está disponible, mostrar spinner
    // Esto evita que rutas con requiredRole fallen silenciosamente antes de tener el rol
    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Cargando perfil...</p>
                </div>
            </div>
        )
    }

    // 3. Si se está creando usuario desde AdminDashboard, permitir acceso sin verificar rol
    if (isCreatingUser) {
        return <>{children}</>
    }

    // 4. Normalizar el rol del usuario (primera letra mayúscula)
    const userRole = profile.role
        ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1).toLowerCase()
        : null;

    // 5. Normalizar los roles requeridos para comparación
    const normalizedRequiredRole = requiredRole?.map(role =>
        role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
    );

    // 6. Verificar rol si se requiere
    if (requiredRole && userRole && normalizedRequiredRole && !normalizedRequiredRole.includes(userRole)) {
        switch (userRole) {
            case 'Admin':
                return <Navigate to="/control-usuarios" replace />
            case 'Manager':
                return <Navigate to="/gerencial" replace />
            case 'Technician':
                return <Navigate to="/dashboard" replace />
            default:
                return <Navigate to="/dashboard" replace />
        }
    }

    return <>{children}</>
}
