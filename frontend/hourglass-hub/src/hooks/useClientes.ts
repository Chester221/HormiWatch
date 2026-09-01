import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner';

export interface ClientContact {
    id: string
    client_id: string
    name: string
    email: string | null
    phone: string | null
    position: string | null
    department?: string | null
    created_at?: string
}

export interface ClientWithContacts extends Client {
    contacts: ClientContact[]
}

export interface Client {
    id: string
    name: string
    ruc: string | null
    address: string | null
    logo_url?: string | null
    code?: string | null
    department?: string | null
    position?: string | null
    phone?: string | null
    channel?: string | null
    management?: string | null
    created_at?: string
    updated_at?: string
}

export const useClientsWithContacts = (searchQuery?: string) => {
    const fetchClientsWithContacts = async (): Promise<ClientWithContacts[]> => {
        try {
            // ✅ YA NO FILTRA POR is_active
            const { data: clientsData, error: clientsError } = await supabase
                .from('clients')
                .select('*')
                .order('name', { ascending: true })

            if (clientsError) {
                if (clientsError.code === '42P01' || clientsError.message.includes('does not exist')) {
                    console.warn('La tabla clients no existe.')
                    return []
                }
                throw new Error(clientsError.message)
            }

            if (!clientsData || clientsData.length === 0) return [];

            const clientIds = clientsData.map((c: any) => c.id);
            const { data: contactsData, error: contactsError } = await supabase
                .from('client_contacts')
                .select('*')
                .in('client_id', clientIds)
                .order('name', { ascending: true })

            if (contactsError) {
                console.warn('Error fetching contacts:', contactsError.message)
            }

            const contacts = (contactsData || []) as ClientContact[]

            let clients: ClientWithContacts[] = clientsData.map((client: any) => ({
                ...client,
                contacts: contacts.filter(c => c.client_id === client.id)
            }))

            if (searchQuery) {
                const search = searchQuery.toLowerCase()
                clients = clients.filter(c =>
                    c.name.toLowerCase().includes(search) ||
                    (c.address && c.address.toLowerCase().includes(search)) ||
                    (c.ruc && c.ruc.toLowerCase().includes(search))
                )
            }

            return clients
        } catch (err) {
            console.error('Error en useClientsWithContacts:', err)
            return []
        }
    }

    return useQuery({
        queryKey: ['clients_with_contacts', searchQuery],
        queryFn: fetchClientsWithContacts,
        retry: false,
    })
}

export const useClients = (searchQuery?: string) => {
    const fetchClients = async (): Promise<Client[]> => {
        try {
            // ✅ YA NO FILTRA POR is_active
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .order('name', { ascending: true })

            if (error) throw error;

            let clients = (data || []) as Client[]
            if (searchQuery) {
                const search = searchQuery.toLowerCase()
                clients = clients.filter(c =>
                    c.name.toLowerCase().includes(search) ||
                    (c.ruc && c.ruc.toLowerCase().includes(search))
                )
            }
            return clients
        } catch (err) {
            console.error('Error en useClients:', err)
            return []
        }
    }

    return useQuery({ queryKey: ['clients', searchQuery], queryFn: fetchClients, retry: false })
}

export const useClientContacts = (clientId: string | undefined) => {
    const fetchContacts = async (): Promise<ClientContact[]> => {
        if (!clientId) return []
        try {
            const { data, error } = await supabase
                .from('client_contacts')
                .select('*')
                .eq('client_id', clientId)
                .order('name', { ascending: true })
            if (error) return []
            return (data || []) as ClientContact[]
        } catch (err) {
            return []
        }
    }
    return useQuery({ queryKey: ['client_contacts', clientId], queryFn: fetchContacts, enabled: !!clientId, retry: false })
}

export const useCreateClient = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data: { name: string; ruc?: string; address?: string }) => {
            const { data: newClient, error } = await supabase
                .from('clients')
                .insert(data)
                .select().single()
            if (error) throw new Error(error.message)
            return newClient as Client
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] })
            queryClient.invalidateQueries({ queryKey: ['clients_with_contacts'] })
        },
        onError: (error: Error) => toast.error(`Error: ${error.message}`),
    })
}

export const useUpdateClient = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Client> }) => {
            const { data: updated, error } = await supabase
                .from('clients')
                .update({ ...data, updated_at: new Date().toISOString() })
                .eq('id', id).select().single()
            if (error) throw new Error(error.message)
            return updated as Client
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] })
            queryClient.invalidateQueries({ queryKey: ['clients_with_contacts'] })
        },
        onError: (error: Error) => toast.error(`Error: ${error.message}`),
    })
}

export const useDeleteClient = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            // ✅ ELIMINAR PERMANENTEMENTE (NO DESACTIVAR)
            const { error } = await supabase
                .from('clients')
                .delete()
                .eq('id', id)
            if (error) throw new Error(error.message)
            return true
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] })
            queryClient.invalidateQueries({ queryKey: ['clients_with_contacts'] })
            toast.success('Cliente eliminado correctamente')
        },
        onError: (error: Error) => toast.error(`Error: ${error.message}`),
    })
}

export const useCreateContact = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data: { client_id: string; name: string; email?: string; phone?: string; position?: string; department?: string }) => {
            const { data: newContact, error } = await supabase
                .from('client_contacts')
                .insert(data).select().single()
            if (error) throw new Error(error.message)
            return newContact as ClientContact
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['client_contacts', variables.client_id] })
            queryClient.invalidateQueries({ queryKey: ['clients_with_contacts'] })
        },
    })
}

export const useDeleteContact = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('client_contacts').delete().eq('id', id)
            if (error) throw new Error(error.message)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['client_contacts'] })
            queryClient.invalidateQueries({ queryKey: ['clients_with_contacts'] })
        },
    })
}

export const useSaveClientWithContacts = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ client, contacts, isEditing }: {
            client: { id?: string; name: string; ruc?: string; address?: string }
            contacts: { name: string; email?: string; phone?: string; position?: string; department?: string }[]
            isEditing: boolean
        }) => {
            let clientId: string

            if (isEditing && client.id) {
                const { error: updateError } = await supabase
                    .from('clients')
                    .update({ name: client.name, ruc: client.ruc, address: client.address, updated_at: new Date().toISOString() })
                    .eq('id', client.id)
                if (updateError) throw new Error(updateError.message)
                clientId = client.id
                await supabase.from('client_contacts').delete().eq('client_id', clientId)
            } else {
                const { data: newClient, error: createError } = await supabase
                    .from('clients')
                    .insert({ name: client.name, ruc: client.ruc, address: client.address })
                    .select().single()
                if (createError) throw new Error(createError.message)
                clientId = newClient.id
            }

            if (contacts.length > 0) {
                const contactsToInsert = contacts.map(c => ({
                    client_id: clientId,
                    name: c.name,
                    email: c.email,
                    phone: c.phone,
                    position: c.position,
                    department: c.department,
                }))
                const { error: contactsError } = await supabase.from('client_contacts').insert(contactsToInsert)
                if (contactsError) throw new Error(contactsError.message)
            }

            return { clientId }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] })
            queryClient.invalidateQueries({ queryKey: ['clients_with_contacts'] })
            queryClient.invalidateQueries({ queryKey: ['client_contacts'] })
        },
        onError: (error: Error) => toast.error(`Error: ${error.message}`),
    })
}
