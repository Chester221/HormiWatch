import { useMemo } from 'react';
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
    rif: string | null
    phone_country?: string | null
    phone_area?: string | null
    phone_number?: string | null
    address: string | null
    email?: string | null
    logo_url?: string | null
    code?: string | null
    department?: string | null
    position?: string | null
    /** Legacy: el antiguo phone raíz se inyectaba en el primer contacto. */
    phone?: string | null
    channel?: string | null
    management?: string | null
    created_at?: string
    updated_at?: string
}

/** Teléfono de empresa compuesto desde sus 3 columnas (ej. +58 212-2384510). */
export const formatCompanyPhone = (client?: {
    phone_country?: string | null
    phone_area?: string | null
    phone_number?: string | null
} | null): string => {
    if (!client) return '';
    const { phone_country: country, phone_area: area, phone_number: number } = client;
    // Sin área y número no hay teléfono: el país suelto (+58) no es un teléfono.
    if (!area || !number) return '';
    return country ? `${country} ${area}-${number}` : `${area}-${number}`;
}

export const companyPhoneHref = (client?: {
    phone_country?: string | null
    phone_area?: string | null
    phone_number?: string | null
} | null): string => formatCompanyPhone(client).replace(/[^\d+]/g, '');

/** Garantiza que el backend reciba SIEMPRE un string en contacts[].phone. */
const normalizeContactForApi = <T extends { phone?: unknown }>(contact: T) => ({
    ...contact,
    phone: contact.phone === null || contact.phone === undefined || contact.phone === ''
        ? undefined
        : String(contact.phone).trim() || undefined,
});

// ✅ Llaves ESTABLES: las listas se cachean una sola vez y el buscador filtra en memoria
// (antes cada tecleo disparaba un refetch).
// IMPORTANTE: la página de Clientes consume CLIENTS_WITH_CONTACTS_KEY, pero otras
// pantallas usan CLIENTS_KEY. Los updates optimistas DEBEN tocar AMBAS llaves
// (['clients'] NO hace match con ['clients_with_contacts'] en TanStack Query).
const CLIENTS_KEY = ['clients'];
const CLIENTS_WITH_CONTACTS_KEY = ['clients_with_contacts'];
const CLIENTS_SOURCE_KEYS = [CLIENTS_KEY, CLIENTS_WITH_CONTACTS_KEY];

// Aplica un updater a AMBAS llaves de clientes (optimistic create/edit/delete).
const runOnClients = (queryClient: ReturnType<typeof useQueryClient>, updater: (old: any) => any) => {
  for (const key of CLIENTS_SOURCE_KEYS) {
    queryClient.setQueriesData({ queryKey: key }, updater);
  }
};

// Invalida AMBAS llaves para reconciliar con el servidor.
const invalidateClients = (queryClient: ReturnType<typeof useQueryClient>) => {
  for (const key of CLIENTS_SOURCE_KEYS) {
    queryClient.invalidateQueries({ queryKey: key });
  }
};

// Snapshot de AMBAS llaves para poder restaurar si la mutación falla.
const clientsSnapshot = (queryClient: ReturnType<typeof useQueryClient>): [unknown, unknown][] => {
  const pairs: [unknown, unknown][] = [];
  for (const key of CLIENTS_SOURCE_KEYS) {
    pairs.push(...queryClient.getQueriesData({ queryKey: key }));
  }
  return pairs;
};

const restorePrevious = (queryClient: ReturnType<typeof useQueryClient>, previous: [unknown, unknown][]) => {
  if (!previous) return;
  for (const [key, data] of previous) {
    queryClient.setQueryData(key as any, data);
  }
};

export const useClientsWithContacts = (searchQuery?: string) => {
    const fetchClientsWithContacts = async (): Promise<ClientWithContacts[]> => {
        try {
            const response = await customersApi.getAll();
            const clientsData = Array.isArray(response) ? response : response?.records || [];

            if (!clientsData || clientsData.length === 0) return [];

            const activeClients = clientsData.filter((client: any) =>
                client.deleted_at === null ||
                client.deleted_at === undefined ||
                client.deleted_at === 'null'
            );

            const clients: ClientWithContacts[] = activeClients.map((client: any) => ({
                ...client,
                contacts: client.contacts || []
            }));

            clients.sort((a, b) => a.name.localeCompare(b.name, 'es'));

            return clients;
        } catch (err) {
            console.error('Error en useClientsWithContacts:', err)
            return []
        }
    }

    const query = useQuery({
        queryKey: CLIENTS_WITH_CONTACTS_KEY,
        queryFn: fetchClientsWithContacts,
        retry: false,
        staleTime: 30_000,
    });

    // ✅ Filtro client-side por invocación (sin duplicar peticiones por tecleo)
    const data = useMemo(() => {
        const all = query.data ?? [];
        if (!searchQuery) return all;
        const search = searchQuery.toLowerCase();
        return all.filter(c =>
            c.name.toLowerCase().includes(search) ||
            (c.address && c.address.toLowerCase().includes(search)) ||
            (c.rif && c.rif.toLowerCase().includes(search))
        );
    }, [query.data, searchQuery]);

    return { ...query, data };
}

export const useClients = (searchQuery?: string) => {
    const fetchClients = async (): Promise<Client[]> => {
        try {
            const response = await customersApi.getAll();
            const clientsData = Array.isArray(response) ? response : response?.records || [];

            const activeClients = clientsData.filter((c: any) =>
                c.deleted_at === null ||
                c.deleted_at === undefined ||
                c.deleted_at === 'null'
            );

            return (activeClients || []) as Client[];
        } catch (err) {
            console.error('Error en useClients:', err)
            return []
        }
    }

    const query = useQuery({ queryKey: CLIENTS_KEY, queryFn: fetchClients, retry: false, staleTime: 30_000 });

    const data = useMemo(() => {
        const all = query.data ?? [];
        if (!searchQuery) return all;
        const search = searchQuery.toLowerCase();
        return all.filter(c =>
            c.name.toLowerCase().includes(search) ||
            (c.rif && c.rif.toLowerCase().includes(search))
        );
    }, [query.data, searchQuery]);

    return { ...query, data };
}

export const useClientContacts = (clientId: string | undefined) => {
    const fetchContacts = async (): Promise<ClientContact[]> => {
        if (!clientId) return []
        try {
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
        mutationFn: async (data: {
            name: string;
            rif?: string;
            address?: string;
            phone_country?: string;
            phone_area?: string;
            phone_number?: string;
        }) => {
            const newClient = await customersApi.create(data);
            return newClient as Client
        },
        onMutate: async (data) => {
            await queryClient.cancelQueries({ queryKey: CLIENTS_KEY });
            await queryClient.cancelQueries({ queryKey: CLIENTS_WITH_CONTACTS_KEY });
            const previous = clientsSnapshot(queryClient);

            // ✅ UPDATE OPTIMISTA: el cliente aparece al instante
            const optimistic = {
                id: `temp-client-${Date.now()}`,
                name: data.name,
                rif: data.rif || null,
                phone_country: data.phone_country || null,
                phone_area: data.phone_area || null,
                phone_number: data.phone_number || null,
                address: data.address || null,
                contacts: [] as ClientContact[],
                created_at: new Date().toISOString(),
            };

            runOnClients(queryClient, (old) => {
                if (!Array.isArray(old)) return old;
                return [optimistic, ...old];
            });

            return { previous, tempId: optimistic.id };
        },
        onSuccess: (newClient: any, _vars, context) => {
            if (context?.tempId) {
                runOnClients(queryClient, (old) => {
                    if (!Array.isArray(old)) return old;
                    return old.map((c: any) =>
                        c.id === context.tempId
                            ? { ...(newClient || {}), id: newClient?.id, contacts: c.contacts || [] }
                            : c,
                    );
                });
            }
            invalidateClients(queryClient)
            toast.success('Cliente creado correctamente')
        },
        onError: (error: Error, _vars, context) => {
            restorePrevious(queryClient, context?.previous ?? []);
            toast.error(`Error: ${error.message}`)
        },
    })
}

export const useUpdateClient = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Client> }) => {
            const updated = await customersApi.update(id, data);
            return updated as Client
        },
        onMutate: async ({ id, data }) => {
            await queryClient.cancelQueries({ queryKey: CLIENTS_KEY });
            await queryClient.cancelQueries({ queryKey: CLIENTS_WITH_CONTACTS_KEY });
            const previous = clientsSnapshot(queryClient);

            // ✅ UPDATE OPTIMISTA: los campos editados cambian al instante
            runOnClients(queryClient, (old) => {
                if (!Array.isArray(old)) return old;
                return old.map((c: any) => {
                    if (String(c.id) !== String(id)) return c;
                    const patch: any = {};
                    if (data.name !== undefined) patch.name = data.name;
                    if (data.rif !== undefined) patch.rif = data.rif;
                    if (data.phone_country !== undefined) patch.phone_country = data.phone_country;
                    if (data.phone_area !== undefined) patch.phone_area = data.phone_area;
                    if (data.phone_number !== undefined) patch.phone_number = data.phone_number;
                    if (data.address !== undefined) patch.address = data.address;
                    if (data.email !== undefined) patch.email = data.email;
                    if (data.phone !== undefined) patch.phone = data.phone;
                    return { ...c, ...patch };
                });
            });

            return { previous };
        },
        onSuccess: (updated: any, _vars, context) => {
            if (updated) {
                runOnClients(queryClient, (old) => {
                    if (!Array.isArray(old)) return old;
                    return old.map((c: any) => (String(c.id) === String(updated.id) ? { ...c, ...updated } : c));
                });
            }
            invalidateClients(queryClient)
            toast.success('Cliente actualizado correctamente')
        },
        onError: (error: Error, _vars, context) => {
            restorePrevious(queryClient, context?.previous ?? []);
            toast.error(`Error: ${error.message}`)
        },
    })
}

export const useDeleteClient = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            await customersApi.delete(id);
            return true
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: CLIENTS_KEY });
            await queryClient.cancelQueries({ queryKey: CLIENTS_WITH_CONTACTS_KEY });
            const previous = clientsSnapshot(queryClient);

            // ✅ DELETE OPTIMISTA: desaparece al instante
            runOnClients(queryClient, (old) => {
                if (!Array.isArray(old)) return old;
                return old.filter((c: any) => String(c.id) !== String(id));
            });

            return { previous };
        },
        onSuccess: () => {
            invalidateClients(queryClient)
            toast.success('Cliente eliminado correctamente')
        },
        onError: (error: Error, _vars, context) => {
            restorePrevious(queryClient, context?.previous ?? []);
            toast.error(`Error: ${error.message}`)
        },
    })
}

export const useCreateContact = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data: { client_id: string; name: string; email?: string; phone?: string; position?: string; department?: string }) => {
            const client = await customersApi.getById(data.client_id);
            const contacts = [...(client?.contacts || []), data].map(normalizeContactForApi);
            await customersApi.update(data.client_id, { contacts });
            return data as ClientContact
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['client_contacts', variables.client_id] })
            queryClient.invalidateQueries({ queryKey: CLIENTS_KEY })
            queryClient.invalidateQueries({ queryKey: CLIENTS_WITH_CONTACTS_KEY })
            toast.success('Contacto agregado correctamente')
        },
        onError: (error: Error) => toast.error(`Error: ${error.message}`),
    })
}

export const useDeleteContact = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            throw new Error('Eliminar contactos individuales no está implementado en la API')
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['client_contacts'] })
            queryClient.invalidateQueries({ queryKey: CLIENTS_KEY })
            queryClient.invalidateQueries({ queryKey: CLIENTS_WITH_CONTACTS_KEY })
        },
    })
}

export const useSaveClientWithContacts = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ client, contacts, isEditing }: {
            client: {
                id?: string; name: string; rif?: string; address?: string;
                email?: string; phone?: string;
                phone_country?: string; phone_area?: string; phone_number?: string;
            }
            contacts: { name: string; email?: string; phone?: string | number | null; position?: string; department?: string }[]
            isEditing: boolean
        }) => {
            const clientData = {
                name: client.name,
                rif: client.rif,
                address: client.address,
                email: client.email || undefined,
                phone: client.phone || undefined,
                phone_country: client.phone_country || undefined,
                phone_area: client.phone_area || undefined,
                phone_number: client.phone_number || undefined,
                contacts: contacts.map(normalizeContactForApi),
            };

            if (isEditing && client.id) {
                await customersApi.update(client.id, clientData);
                return { clientId: client.id };
            } else {
                const newClient = await customersApi.create(clientData);
                return { clientId: newClient.id };
            }
        },
        onMutate: async ({ client, contacts, isEditing }) => {
            await queryClient.cancelQueries({ queryKey: CLIENTS_KEY });
            await queryClient.cancelQueries({ queryKey: CLIENTS_WITH_CONTACTS_KEY });
            const previous = clientsSnapshot(queryClient);
            let tempId: string | null = null;

            if (isEditing && client.id) {
                // ✅ UPDATE OPTIMISTA: edición → los datos cambian al instante
                runOnClients(queryClient, (old) => {
                    if (!Array.isArray(old)) return old;
                    return old.map((c: any) => {
                        if (String(c.id) !== String(client.id)) return c;
                        const patch: any = {};
                        if (client.name !== undefined) patch.name = client.name;
                        if (client.rif !== undefined) patch.rif = client.rif;
                        if (client.phone_country !== undefined) patch.phone_country = client.phone_country;
                        if (client.phone_area !== undefined) patch.phone_area = client.phone_area;
                        if (client.phone_number !== undefined) patch.phone_number = client.phone_number;
                        if (client.address !== undefined) patch.address = client.address;
                        if (client.email !== undefined) patch.email = client.email;
                        if (client.phone !== undefined) patch.phone = client.phone;
                        patch.contacts = contacts.map(normalizeContactForApi);
                        return { ...c, ...patch };
                    });
                });
            } else {
                // ✅ CREATE OPTIMISTA: nuevo cliente aparece al instante
                tempId = `temp-client-${Date.now()}`;
                const optimistic = {
                    id: tempId,
                    name: client.name,
                    rif: client.rif || null,
                    phone_country: client.phone_country || null,
                    phone_area: client.phone_area || null,
                    phone_number: client.phone_number || null,
                    address: client.address || null,
                    email: client.email,
                    phone: client.phone,
                    contacts: contacts.map(normalizeContactForApi),
                    created_at: new Date().toISOString(),
                };
                runOnClients(queryClient, (old) => {
                    if (!Array.isArray(old)) return old;
                    return [optimistic, ...old];
                });
            }

            return { previous, tempId };
        },
        onSuccess: (result, { isEditing }, context) => {
            if (!isEditing && context?.tempId) {
                // ✅ Reemplazar temporal por id real (el resto lo reconcilia el invalidate)
                runOnClients(queryClient, (old) => {
                    if (!Array.isArray(old)) return old;
                    return old.map((c: any) =>
                        c.id === context.tempId ? { ...c, id: result.clientId } : c,
                    );
                });
            }
            invalidateClients(queryClient)
            queryClient.invalidateQueries({ queryKey: ['client_contacts'] })
            toast.success('Cliente guardado correctamente')
        },
        onError: (error: Error, _vars, context) => {
            restorePrevious(queryClient, context?.previous ?? []);
            toast.error(`Error: ${error.message}`)
        },
    })
}