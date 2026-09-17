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

const TEAM_KEY = ['team_members'];

const restorePrevious = (queryClient: ReturnType<typeof useQueryClient>, previous: [unknown, unknown][]) => {
    if (!previous) return;
    for (const [key, data] of previous) {
        queryClient.setQueryData(key as any, data);
    }
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
                is_active: m.is_active ?? m.isActive ?? true,
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
        staleTime: 30_000,
    })
}

export const useCreateTeamMember = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: any) => {
            return usersApi.create(data);
        },
        onMutate: async (data) => {
            await queryClient.cancelQueries({ queryKey: TEAM_KEY });
            const previous = queryClient.getQueriesData({ queryKey: TEAM_KEY });

            // ✅ UPDATE OPTIMISTA: el miembro aparece al instante
            const fullName =
                data._fullName ||
                [data.name, data.lastName].filter(Boolean).join(' ') ||
                data.email ||
                'Sin nombre';
            const optimistic = {
                id: `temp-member-${Date.now()}`,
                full_name: fullName,
                email: data.email || null,
                role: data._role || 'Technician',
                phone: data.phone || null,
                is_active: true,
                avatar_url: null,
            };

            queryClient.setQueriesData({ queryKey: TEAM_KEY }, (old) => {
                if (!Array.isArray(old)) return old;
                return [optimistic, ...old].sort((a: any, b: any) =>
                    (a.full_name || '').localeCompare(b.full_name || ''),
                );
            });

            return { previous, tempId: optimistic.id };
        },
        onSuccess: (created: any, variables, context) => {
            if (context?.tempId) {
                queryClient.setQueriesData({ queryKey: TEAM_KEY }, (old) => {
                    if (!Array.isArray(old)) return old;
                    return old.map((m: any) => {
                        if (m.id !== context.tempId) return m;
                        const fullName =
                            variables._fullName ||
                            [variables.name, variables.lastName].filter(Boolean).join(' ') ||
                            m.full_name;
                        return {
                            ...m,
                            id: created?.id,
                            full_name: fullName,
                            email: variables.email || m.email,
                            role: variables._role || m.role,
                            is_active: true,
                        };
                    });
                });
            }
            queryClient.invalidateQueries({ queryKey: TEAM_KEY });
            toast.success('Miembro del equipo creado correctamente');
        },
        onError: (error: any, _vars, context) => {
            restorePrevious(queryClient, context?.previous ?? []);
            toast.error(`Error al crear: ${error.message}`);
        },
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
        onMutate: async ({ id, data }) => {
            await queryClient.cancelQueries({ queryKey: TEAM_KEY });
            const previous = queryClient.getQueriesData({ queryKey: TEAM_KEY });

            // ✅ UPDATE OPTIMISTA: los campos editados cambian al instante
            queryClient.setQueriesData({ queryKey: TEAM_KEY }, (old) => {
                if (!Array.isArray(old)) return old;
                return old.map((m: any) => {
                    if (String(m.id) !== String(id)) return m;
                    const patch: any = {};
                    if (data.name !== undefined) patch.full_name = data.name;
                    if (data.full_name !== undefined) patch.full_name = data.full_name;
                    if (data.email !== undefined) patch.email = data.email;
                    if (data.phone !== undefined) patch.phone = data.phone;
                    if (data.role !== undefined) patch.role = data.role;
                    if (data.isActive !== undefined || data.is_active !== undefined) {
                        patch.is_active = data.isActive ?? data.is_active;
                        patch.isActive = data.isActive ?? data.is_active;
                    }
                    if (data.avatar_url !== undefined) patch.avatar_url = data.avatar_url;
                    return { ...m, ...patch };
                });
            });

            return { previous };
        },
        onSuccess: (updated) => {
            if (updated) {
                const real = {
                    ...updated,
                    full_name: getFullName(updated),
                    role: getRoleName(updated.role),
                    is_active: updated.is_active ?? updated.isActive ?? true,
                };
                queryClient.setQueriesData({ queryKey: TEAM_KEY }, (old) => {
                    if (!Array.isArray(old)) return old;
                    return old.map((m: any) => (String(m.id) === String(real.id) ? { ...m, ...real } : m));
                });
            }
            queryClient.invalidateQueries({ queryKey: TEAM_KEY });
            toast.success('Miembro actualizado correctamente');
        },
        onError: (error: any, _vars, context) => {
            console.error('Error en mutación:', error)
            restorePrevious(queryClient, context?.previous ?? []);
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
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: TEAM_KEY });
            const previous = queryClient.getQueriesData({ queryKey: TEAM_KEY });

            // ✅ DELETE OPTIMISTA: desaparece al instante
            queryClient.setQueriesData({ queryKey: TEAM_KEY }, (old) => {
                if (!Array.isArray(old)) return old;
                return old.filter((m: any) => String(m.id) !== String(id));
            });

            return { previous };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TEAM_KEY });
            toast.success('Miembro eliminado del equipo');
        },
        onError: (error: any, _vars, context) => {
            console.error('Error en eliminación:', error)
            restorePrevious(queryClient, context?.previous ?? []);
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