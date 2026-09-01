import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
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
            let query = supabase
                .from('profiles')
                .select('*')
                .order('full_name', { ascending: true })

            if (role && role !== 'all') {
                query = query.eq('role', role)
            }

            const { data, error } = await query

            if (error) {
                if (error.code === '42P01' || error.message.includes('does not exist')) {
                    console.warn('La tabla profiles no existe en Supabase.')
                    return []
                }
                console.error('Error fetching team members:', error)
                throw new Error(error.message)
            }

            let members = (data || []) as TeamMember[]
            if (searchQuery) {
                const search = searchQuery.toLowerCase()
                members = members.filter(m =>
                    (m.full_name && m.full_name.toLowerCase().includes(search)) ||
                    (m.email && m.email.toLowerCase().includes(search))
                )
            }

            return members
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
            
            const { data: updated, error } = await supabase
                .from('profiles')
                .update({
                    ...data,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single()

            if (error) {
                console.error('Error al actualizar perfil:', error)
                throw error
            }
            
            return updated
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
            
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', id)

            if (error) {
                console.error('Error al eliminar perfil:', error)
                throw error
            }
            
            return id
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