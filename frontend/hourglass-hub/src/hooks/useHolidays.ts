import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

export interface Holiday {
    id: number;
    date: string; // YYYY-MM-DD
    name: string;
    is_working_day: boolean;
}

// Helper para convertir fecha YYYY-MM-DD a ISO con mediodía UTC
// Esto evita problemas de zona horaria
const toUTCDateString = (dateStr: string): string => {
    // Si ya tiene hora, usarla tal cual
    if (dateStr.includes('T')) return dateStr;
    // Agregar mediodía UTC para evitar desplazamiento de zona horaria
    return `${dateStr}T12:00:00.000Z`;
};

export const useHolidays = () => {
    const queryClient = useQueryClient();

    const fetchHolidays = async (): Promise<Holiday[]> => {
        const { data, error } = await supabase
            .from('holidays')
            .select('*')
            .order('date', { ascending: true });

        if (error) throw error;
        return data || [];
    };

    const addHolidayMutation = useMutation({
        mutationFn: async (holiday: Omit<Holiday, 'id'>) => {
            // Convertir la fecha a UTC con mediodía para evitar desplazamiento
            const correctedHoliday = {
                ...holiday,
                date: toUTCDateString(holiday.date)
            };
            
            console.log('Enviando feriado con fecha:', correctedHoliday.date);
            
            const { data, error } = await (supabase as any)
                .from('holidays')
                .insert(correctedHoliday)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['holidays'] });
            toast.success('Feriado agregado correctamente');
        },
        onError: (error: any) => {
            toast.error(`Error al agregar feriado: ${error.message}`);
        }
    });

    const deleteHolidayMutation = useMutation({
        mutationFn: async (id: number) => {
            const { error } = await (supabase as any)
                .from('holidays')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['holidays'] });
            toast.success('Feriado eliminado');
        },
        onError: (error: any) => {
            toast.error(`Error al eliminar feriado: ${error.message}`);
        }
    });

    const syncHolidaysMutation = useMutation({
        mutationFn: async (year: number) => {
            const response = await fetch(`https://date.nager.at/api/v3/publicholidays/${year}/VE`);
            if (!response.ok) throw new Error('Error fetching from public API');
            
            const publicHolidays = await response.json();

            // Corregir las fechas a UTC con mediodía
            const holidaysToInsert = publicHolidays.map((h: any) => ({
                date: toUTCDateString(h.date),
                name: h.localName,
                is_working_day: false
            }));

            console.log('Sincronizando feriados:', holidaysToInsert);

            const { error } = await (supabase as any)
                .from('holidays')
                .upsert(holidaysToInsert, { onConflict: 'date', ignoreDuplicates: true });

            if (error) throw error;
            return holidaysToInsert.length;
        },
        onSuccess: (count) => {
            queryClient.invalidateQueries({ queryKey: ['holidays'] });
            toast.success(`${count} feriados sincronizados exitosamente`);
        },
        onError: (error: any) => {
            console.error(error);
            toast.error(`Error al sincronizar: ${error.message}`);
        }
    });

    return {
        holidays: useQuery({
            queryKey: ['holidays'],
            queryFn: fetchHolidays,
        }),
        addHoliday: addHolidayMutation,
        deleteHoliday: deleteHolidayMutation,
        syncHolidays: syncHolidaysMutation
    };
};