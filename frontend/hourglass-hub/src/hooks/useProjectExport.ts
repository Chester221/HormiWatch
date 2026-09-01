import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

// ✅ URL PÚBLICA DE LA PLANTILLA
const PLANTILLA_URL = 'https://tniprkdojqzpicukqvbe.supabase.co/storage/v1/object/public/logos/plantilla_reporte.xlsx';

export const useProjectExport = () => {
  
  const exportProjectReport = async (project: any) => {
    try {
      console.log('📤 Exportando proyecto...');
      
      // 1️⃣ DESCARGAR LA PLANTILLA DESDE SUPABASE
      const response = await fetch(PLANTILLA_URL);
      
      if (!response.ok) {
        console.error('❌ Error al descargar:', response.status);
        throw new Error(`Error al descargar la plantilla: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      console.log('✅ Plantilla descargada correctamente');
      
      // 2️⃣ LEER LA PLANTILLA
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // 3️⃣ RELLENAR DATOS DEL PROYECTO
      // (Aquí van todas las posiciones que ya definimos)
      
      // Nº Solicitud (Fila 2, Columna J-K)
      if (data[1]) data[1][9] = `PROY-${project.id?.substring(0, 8) || '001'}`;
      
      // Fecha (Fila 3, Columna J-K)
      if (data[2]) data[2][9] = new Date().toLocaleDateString('es-ES');
      
      // Página (Fila 4, Columna J-K)
      if (data[3]) data[3][9] = '1';
      
      // Cliente (Fila 8, Columna C-F)
      if (data[7]) data[7][2] = project.client || 'Sin cliente';
      
      // Usuario / Contacto (Fila 8, Columna I-M)
      if (data[7]) data[7][8] = project.clientContact || '';
      
      // Código Cliente (Fila 9, Columna C-F)
      if (data[8]) data[8][2] = project.clientId || '';
      
      // Cargo (Fila 9, Columna I-M)
      if (data[8]) data[8][8] = project.cargo || '';
      
      // Departamento (Fila 10, Columna C-F)
      if (data[9]) data[9][2] = project.departamento || '';
      
      // Teléfono(s) (Fila 10, Columna I-M)
      if (data[9]) data[9][8] = project.telefono || '';
      
      // Canal de Comunicación (Fila 13, Columna C-F)
      if (data[12]) data[12][2] = 'Email / Portal';
      
      // Tipo de Servicio (Fila 13, Columna I-M)
      if (data[12]) data[12][8] = project.type || 'Consultoría';
      
      // Consultor (Fila 14, Columna C-F)
      if (data[13]) data[13][2] = project.teamLead?.name || 'Sin asignar';
      
      // TAREAS (Filas 21-43)
      const tasks = project.tasks || [];
      for (let i = 0; i < Math.min(tasks.length, 23); i++) {
        const rowIndex = 20 + i;
        const task = tasks[i];
        
        if (data[rowIndex]) {
          data[rowIndex][1] = task.description || task.title || '';
          data[rowIndex][3] = task.start_time ? new Date(task.start_time).toLocaleDateString('es-ES') : '';
          data[rowIndex][4] = task.start_time ? new Date(task.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '';
          data[rowIndex][5] = task.end_time ? new Date(task.end_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '';
          data[rowIndex][6] = task.hours_type || 'HO';
          const hours = task.duration_in_minutes ? (task.duration_in_minutes / 60).toFixed(1) : task.hours?.toFixed(1) || '0';
          data[rowIndex][7] = hours;
          data[rowIndex][8] = hours;
          data[rowIndex][9] = task.status === 'Completed' ? 'C' : '';
          data[rowIndex][10] = task.status === 'Completed' ? '' : 'P';
          data[rowIndex][11] = task.status === 'Completed' ? '' : task.notes || '';
        }
      }
      
      // Total de Horas (Fila 44, Columna I)
      if (data[43]) {
        data[43][8] = `${project.hoursConsumed || 0}h / ${project.hoursPool || 0}h`;
      }
      
      // Observaciones (Fila 45, Columna C-M)
      if (data[44]) {
        data[44][2] = project.notes || 'Sin observaciones';
      }
      
      // Aceptación (Fila 50, Columna C-F y I-M)
      if (data[49]) {
        data[49][2] = project.client || '';
        data[49][8] = project.teamLead?.name || '';
      }
      
      // 4️⃣ GUARDAR Y DESCARGAR
      const newWs = XLSX.utils.aoa_to_sheet(data);
      const newWb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(newWb, newWs, 'Reporte');
      
      const excelBuffer = XLSX.write(newWb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const sanitizedName = project.name.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${sanitizedName}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      saveAs(blob, fileName);
      toast.success(`✅ Reporte de "${project.name}" exportado`);
    } catch (error) {
      console.error('❌ Error:', error);
      toast.error('Error al exportar el reporte');
    }
  };

  return {
    exportProjectReport,
  };
};