import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/lib/api'
import type { UserRole } from '@/contexts/AuthContext'
import { toast } from 'sonner'

// Tipo para usuario/perfil
export interface TeamMember {
    id: string
    full_name: string | null
    email: string | null
    avatar_url: string | null
    role: UserRole
    phone?: string | null
    cedula?: string | null
    is_active?: boolean
}

// Hook para obtener usuarios por rol
export const useTeamMembers = (options?: {
    role?: UserRole | 'all'
    searchQuery?: string
}) => {
    const { role = 'all', searchQuery } = options || {}

    const fetchMembers = async (): Promise<TeamMember[]> => {
        try {
            let members = await usersApi.getAll();

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

            // Ordenar por full_name
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
    })
}

// Hook para actualizar un miembro del equipo
export const useUpdateTeamMember = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<TeamMember> }) => {
            console.log('Actualizando miembro:', id, data)
            
            const updated = await usersApi.update(id, {
                ...data,
                updated_at: new Date().toISOString(),
            });
            
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

// 🔥 NUEVO: Hook para eliminar un miembro del equipo
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

// Hook para obtener solo técnicos
export const useTechnicians = (searchQuery?: string) => {
    return useTeamMembers({ role: 'Technician', searchQuery })
}

// Hook para obtener todos los usuarios (para seleccionar líder)
export const useAllUsers = (searchQuery?: string) => {
    return useTeamMembers({ role: 'all', searchQuery })
}