import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import type { UserRole } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export interface TeamMember {
    id: string
    full_name: string | null
    email: string | null
    avatar_url: string | null
    role: UserRole
    phone?: string | null
    cedula?: string | null
    is_active?: boolean
    profile?: {
        name: string
        lastName: string
        avatar_url?: string
        phone?: string
    }
}

// ✅ FUNCIÓN PARA OBTENER NOMBRE COMPLETO
const getFullName = (user: any): string => {
    if (user?.full_name) return user.full_name;
    if (user?.profile?.name) {
        return `${user.profile.name} ${user.profile.lastName || ''}`.trim();
    }
    if (user?.name) return user.name;
    return 'Sin nombre';
};

// ✅ FUNCIÓN PARA OBTENER EL NOMBRE DEL ROL
const getRoleName = (role: any): string => {
    if (typeof role === 'string') return role;
    if (role?.name) return role.name;
    return 'Technician';
};

export const useTeamMembers = (options?: {
    role?: UserRole | 'all'
    searchQuery?: string
}) => {
    const { role = 'all', searchQuery } = options || {}
    const { profile } = useAuth()
    const currentRole = profile?.role || 'Technician'
    const canSeeAllUsers = currentRole === 'Admin' || currentRole === 'Manager'

    const fetchMembers = async (): Promise<TeamMember[]> => {
        try {
            // ✅ ROL-AWARE: Admin/Manager ven el listado completo; Técnico/Empleado
            // solo Managers + Técnicos (evita 403 de GET /users y no expone admins)
            let response: any;
            if (canSeeAllUsers) {
                response = await usersApi.getAll();
            } else {
                const [managers, technicians] = await Promise.all([
                    usersApi.getManagers(),
                    usersApi.getTechnicians(),
                ]);
                response = [
                    ...(Array.isArray(managers) ? managers : managers?.records || []),
                    ...(Array.isArray(technicians) ? technicians : technicians?.records || []),
                ];
            }
            let members = Array.isArray(response) ? response : response?.records || [];
            
            // ✅ CONSTRUIR full_name correctamente
            members = members.map((m: any) => ({
                ...m,
                full_name: getFullName(m),
                role: getRoleName(m.role),
            }));

            if (role && role !== 'all') {
                members = members.filter((m: any) => m.role === role);
            }

            if (searchQuery) {
                const search = searchQuery.toLowerCase()
                members = members.filter((m: any) =>
                    (m.full_name && m.full_name.toLowerCase().includes(search)) ||
                    (m.email && m.email.toLowerCase().includes(search))
                )
            }

            members.sort((a: any, b: any) => {
                return (a.full_name || '').localeCompare(b.full_name || '');
            });

            return members as TeamMember[];
        } catch (err) {
            console.error('Error en useTeamMembers:', err)
            return []
        }
    }

    return useQuery({
        queryKey: ['team_members', role, searchQuery],
        queryFn: fetchMembers,
        retry: false,
        staleTime: 0,
    })
}

export const useUpdateTeamMember = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<TeamMember> }) => {
            console.log('Actualizando miembro:', id, data)
            
            const { updated_at, ...cleanData } = data;
            
            const updated = await usersApi.update(id, cleanData);
            return updated;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['team_members'] })
            toast.success('Miembro actualizado correctamente')
        },
        onError: (error: any) => {
            console.error('Error en mutación:', error)
            toast.error(`Error al actualizar: ${error.message}`)
        }
    })
}

export const useDeleteTeamMember = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (id: string) => {
            console.log('Eliminando miembro:', id)
            await usersApi.delete(id);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['team_members'] })
            toast.success('Miembro eliminado del equipo')
        },
        onError: (error: any) => {
            console.error('Error en eliminación:', error)
            toast.error(`Error al eliminar: ${error.message}`)
        }
    })
}

export const useTechnicians = (searchQuery?: string) => {
    return useTeamMembers({ role: 'Technician', searchQuery })
}

export const useAllUsers = (searchQuery?: string) => {
    return useTeamMembers({ role: 'all', searchQuery })
}