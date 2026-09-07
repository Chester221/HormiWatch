import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { holidaysApi } from '@/lib/api';
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
        const data = await holidaysApi.getAll();
        return data || [];
    };

    const addHolidayMutation = useMutation({
        mutationFn: async (holiday: Omit<Holiday, 'id'>) => {
            const correctedHoliday = {
                ...holiday,
                date: toUTCDateString(holiday.date)
            };
            
            console.log('Enviando feriado con fecha:', correctedHoliday.date);
            
            const data = await holidaysApi.create(correctedHoliday);
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
            await holidaysApi.delete(id);
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

            const holidaysToInsert = publicHolidays.map((h: any) => ({
                date: toUTCDateString(h.date),
                name: h.localName,
                is_working_day: false
            }));

            console.log('Sincronizando feriados:', holidaysToInsert);

            // Usar el endpoint de sync si existe, o crear uno por uno
            const results = await Promise.all(
                holidaysToInsert.map(h => holidaysApi.create(h).catch(() => null))
            );
            const successCount = results.filter(r => r !== null).length;

            return successCount;
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