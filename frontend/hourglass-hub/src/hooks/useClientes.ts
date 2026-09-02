import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customersApi } from '@/lib/api'
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
            // Obtener todos los clientes desde la API
            const clientsData = await customersApi.getAll();
            
            if (!clientsData || clientsData.length === 0) return [];

            // Obtener contactos para todos los clientes
            // Nota: Asumimos que la API devuelve los contactos anidados
            // Si no, necesitaríamos un endpoint separado para contactos
            let clients: ClientWithContacts[] = clientsData.map((client: any) => ({
                ...client,
                contacts: client.contacts || []
            }));

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
            const data = await customersApi.getAll();
            
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
            // Si la API no tiene endpoint específico para contactos,
            // obtenemos el cliente completo con sus contactos
            const client = await customersApi.getById(clientId);
            return (client?.contacts || []) as ClientContact[]
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
            const newClient = await customersApi.create(data);
            return newClient as Client
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] })
            queryClient.invalidateQueries({ queryKey: ['clients_with_contacts'] })
            toast.success('Cliente creado correctamente')
        },
        onError: (error: Error) => toast.error(`Error: ${error.message}`),
    })
}

export const useUpdateClient = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Client> }) => {
            const updated = await customersApi.update(id, data);
            return updated as Client
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] })
            queryClient.invalidateQueries({ queryKey: ['clients_with_contacts'] })
            toast.success('Cliente actualizado correctamente')
        },
        onError: (error: Error) => toast.error(`Error: ${error.message}`),
    })
}

export const useDeleteClient = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            await customersApi.delete(id);
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
            // Si la API tiene endpoint para contactos, usarlo
            // Si no, actualizar el cliente con el nuevo contacto
            const client = await customersApi.getById(data.client_id);
            const contacts = [...(client?.contacts || []), data];
            await customersApi.update(data.client_id, { contacts });
            return data as ClientContact
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['client_contacts', variables.client_id] })
            queryClient.invalidateQueries({ queryKey: ['clients_with_contacts'] })
            toast.success('Contacto agregado correctamente')
        },
        onError: (error: Error) => toast.error(`Error: ${error.message}`),
    })
}

export const useDeleteContact = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            // Si la API tiene endpoint para eliminar contactos
            // Si no, necesitamos obtener el cliente y eliminar el contacto de la lista
            // Por ahora, lanzamos un error indicando que no está implementado
            throw new Error('Eliminar contactos individuales no está implementado en la API')
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
            const clientData = {
                name: client.name,
                ruc: client.ruc,
                address: client.address,
                contacts: contacts
            };

            if (isEditing && client.id) {
                await customersApi.update(client.id, clientData);
                return { clientId: client.id };
            } else {
                const newClient = await customersApi.create(clientData);
                return { clientId: newClient.id };
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] })
            queryClient.invalidateQueries({ queryKey: ['clients_with_contacts'] })
            queryClient.invalidateQueries({ queryKey: ['client_contacts'] })
            toast.success('Cliente guardado correctamente')
        },
        onError: (error: Error) => toast.error(`Error: ${error.message}`),
    })
}