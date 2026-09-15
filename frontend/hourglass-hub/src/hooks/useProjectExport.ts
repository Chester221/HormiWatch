import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

// Plantilla por defecto (base sin logo; el logo se inserta por cliente al exportar)
const DEFAULT_TEMPLATE_URL = '/templates/plantilla_reporte.xlsx';

// Logo + proveedor + plantilla por cliente
const CLIENT_LOGOS: Record<string, { logo: string; provider: string; template: string }> = {
  'Bytes Creativos': {
    logo: '/logos/bytes-creativos.png',
    provider: 'Por Bytes Creativos',
    template: '/templates/plantilla_reporte.xlsx',
  },
  'Gal Secure': {
    logo: '/logos/gal-secure.png',
    provider: 'Por Gal Secure',
    template: '/templates/plantilla_gal.xlsx',
  },
};

// Lineas maximas (tareas) por hoja: parrilla de la fila 18 a la 40
const TASKS_PER_REPORT = 23;

// Factor por tipo de horario (columnas O/P/Q)
const HOUR_TYPE_FACTOR: Record<string, number> = {
  HO: 1,
  EH: 1.5,
  DF: 2,
};

// Posiciones reales de la plantilla (verificadas con ExcelJS)
const LAYOUT = {
  numeroSolicitud: { row: 2, col: 12 }, // L2
  fecha: { row: 3, col: 12 }, // L3
  pagina: { row: 4, col: 12 }, // L4
  cliente: { row: 7, col: 3 }, // C7
  contacto: { row: 7, col: 9 }, // I7
  codigo: { row: 8, col: 3 }, // C8
  cargo: { row: 8, col: 9 }, // I8
  departamento: { row: 9, col: 3 }, // C9
  telefono: { row: 9, col: 9 }, // I9
  canal: { row: 11, col: 3 }, // C11
  tipoServicio: { row: 11, col: 9 }, // I11
  actividad: { row: 12, col: 3 }, // C12
  gerencia: { row: 12, col: 9 }, // I12
  consultor: { row: 13, col: 3 }, // C13
  otros: { row: 13, col: 9 }, // I13
  tareasInicio: 18,
  tareasFin: 40,
  totalFila: 41,
  totalHorasDefinitivas: { row: 41, col: 12 }, // L41 (label "Total de Horas" y valor)
  observaciones: { row: 42, col: 3 }, // C42
  nombreCliente: { row: 46, col: 3 }, // C46
  nombreProveedor: { row: 46, col: 9 }, // I46
  proveedorLabel: { row: 45, col: 8 }, // H45
};

// Columnas (1-based) en cada fila de tarea
const TASK_COLS = {
  descripcion: 2, // B
  fecha: 4, // D
  horaInicio: 5, // E
  horaFin: 6, // F
  horas: 8, // H (horas brutas)
  horasDefinitivas: 9, // I (con factor)
  statusC: 10, // J
  statusP: 11, // K
  motivo: 12, // L
  horasHO: 15, // O
  horasEH: 16, // P
  horasDF: 17, // Q
  horasFactor: 19, // S (total con factor)
  costo: 20, // T
};

const getClientInfo = (clientName: string | undefined) => {
  const name = (clientName || '').trim();
  if (CLIENT_LOGOS[name]) return CLIENT_LOGOS[name];
  const match = Object.keys(CLIENT_LOGOS).find((k) =>
    name.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(name.toLowerCase()),
  );
  return match ? CLIENT_LOGOS[match] : null;
};

// URL (activo estatico) a base64 para insertarla en Excel
const urlToBase64 = (url: string): Promise<string> =>
  fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`No se pudo cargar el logo: ${res.status}`);
      return res.blob();
    })
    .then(
      (blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        }),
    );

const getExtension = (url: string): 'png' | 'jpeg' => {
  const ext = (url.split('.').pop() || '').toLowerCase();
  return ext === 'png' ? 'png' : 'jpeg';
};

// Escribe en la celda master de una fusion
const setCell = (ws: ExcelJS.Worksheet, row: number, col: number, value: unknown) => {
  try {
    const cell = ws.getCell(row, col);
    if (value === '' || value === null || value === undefined) {
      if (cell.value !== null && cell.value !== undefined) cell.value = null;
    } else {
      cell.value = value as never;
    }
  } catch {
    // Ignorar celdas fusionadas
  }
};

// N de solicitud aleatorio (SOL-AAAAMMDD-NNNNN). No se guarda en BD.
const generateSolicitud = () => {
  const now = new Date();
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');
  const random = String(Math.floor(10000 + Math.random() * 90000));
  return `SOL-${date}-${random}`;
};

const pad2 = (n: number) => String(n).padStart(2, '0');

const formatDate = (d: Date) => `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;

const formatTime = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

const round2 = (n: number) => Math.round(n * 100) / 100;

// Horas brutas de una tarea
const taskHours = (task: any): number => {
  if (task.duration_in_minutes) return round2(task.duration_in_minutes / 60);
  const raw = Number(task.hours || 0);
  if (raw) return round2(raw);
  if (task.start_time && task.end_time) {
    const diff = (new Date(task.end_time).getTime() - new Date(task.start_time).getTime()) / 3600000;
    if (diff > 0) return round2(diff);
  }
  return 0;
};

// Clasifica horas de una tarea en HO (O), EH (P) y DF (Q)
const splitTaskHours = (task: any, hours: number) => {
  let ho = 0;
  let eh = 0;
  let df = 0;
  if (task.hours_type && HOUR_TYPE_FACTOR[task.hours_type]) {
    if (task.hours_type === 'HO') ho = hours;
    else if (task.hours_type === 'EH') eh = hours;
    else df = hours;
    return { ho, eh, df };
  }
  const start = task.start_time ? new Date(task.start_time) : null;
  if (start) {
    const day = start.getDay();
    if (day === 0) df = hours; // Domingo -> DF (x2)
    else if (day === 6) eh = hours; // Sabado -> EH (x1.5)
    else {
      ho = Number(task.normal_hours) || hours;
      eh = Number(task.overtime_hours) || 0;
    }
  } else {
    ho = hours;
  }
  return { ho, eh, df };
};

// Llena una hoja del reporte sobre la plantilla
const buildReport = async (
  project: any,
  tasks: any[],
  opts: { solicitud: string; parte: number; partes: number },
): Promise<Blob> => {
  const clientInfo = getClientInfo(project.client);
  const templateUrl = clientInfo?.template || DEFAULT_TEMPLATE_URL;

  const response = await fetch(templateUrl);
  if (!response.ok) throw new Error(`Plantilla no encontrada (${templateUrl}): ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);
  const ws = workbook.worksheets[0] || workbook.addWorksheet('Reporte');

  // Logo del cliente
  if (clientInfo) {
    try {
      const base64 = await urlToBase64(clientInfo.logo);
      const imageId = workbook.addImage({ base64, extension: getExtension(clientInfo.logo) });
      ws.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: 190, height: 63 } });
    } catch (err) {
      console.warn('No se pudo insertar el logo:', err);
    }
  }

  // Limpiar datos de ejemplo/previos
  for (let r = LAYOUT.tareasInicio; r <= LAYOUT.tareasFin; r++) {
    for (let c = 2; c <= 22; c++) setCell(ws, r, c, '');
  }

  // Cabecera
  const hourlyRate = Number(project.rate ?? project.hourly_rate ?? 0) || 0;
  const page = opts.partes > 1 ? `${opts.parte}/${opts.partes}` : String(opts.parte);

  setCell(ws, LAYOUT.numeroSolicitud.row, LAYOUT.numeroSolicitud.col, opts.solicitud);
  setCell(ws, LAYOUT.fecha.row, LAYOUT.fecha.col, project.fecha || formatDate(new Date()));
  setCell(ws, LAYOUT.pagina.row, LAYOUT.pagina.col, page);

  // Datos del cliente y de la actividad
  setCell(ws, LAYOUT.cliente.row, LAYOUT.cliente.col, project.client || 'Sin cliente');
  setCell(ws, LAYOUT.contacto.row, LAYOUT.contacto.col, project.clientContact || '');
  setCell(ws, LAYOUT.codigo.row, LAYOUT.codigo.col, project.codigo || project.ruc || project.clientId || '');
  setCell(ws, LAYOUT.cargo.row, LAYOUT.cargo.col, project.cargo || '');
  setCell(ws, LAYOUT.departamento.row, LAYOUT.departamento.col, project.departamento || '');
  setCell(ws, LAYOUT.telefono.row, LAYOUT.telefono.col, project.telefono || '');
  setCell(ws, LAYOUT.canal.row, LAYOUT.canal.col, project.canal || '');
  setCell(ws, LAYOUT.tipoServicio.row, LAYOUT.tipoServicio.col, project.type || 'Consultoría');
  setCell(ws, LAYOUT.actividad.row, LAYOUT.actividad.col, project.name || '');
  setCell(ws, LAYOUT.gerencia.row, LAYOUT.gerencia.col, project.gerencia || '');
  setCell(ws, LAYOUT.consultor.row, LAYOUT.consultor.col, project.teamLead?.name || 'Sin asignar');
  setCell(ws, LAYOUT.otros.row, LAYOUT.otros.col, project.otros || '');
  setCell(ws, LAYOUT.observaciones.row, LAYOUT.observaciones.col, project.notes || '');

  // Proveedor (etiqueta estatica "Por Bytes Creativos" -> cambio si es Gal Secure)
  if (clientInfo) setCell(ws, LAYOUT.proveedorLabel.row, LAYOUT.proveedorLabel.col, clientInfo.provider);

  // Tareas + horas + costos
  let totalHO = 0;
  let totalEH = 0;
  let totalDF = 0;
  let totalPonderado = 0;
  let totalCosto = 0;

  tasks.forEach((task, i) => {
    const row = LAYOUT.tareasInicio + i;
    if (row > LAYOUT.tareasFin) return;

    const start = task.start_time ? new Date(task.start_time) : null;
    const end = task.end_time ? new Date(task.end_time) : null;
    const hours = taskHours(task);
    const { ho, eh, df } = splitTaskHours(task, hours);
    const ponderado = round2(ho * 1 + eh * 1.5 + df * 2);
    const costo = round2(ponderado * hourlyRate);

    totalHO = round2(totalHO + ho);
    totalEH = round2(totalEH + eh);
    totalDF = round2(totalDF + df);
    totalPonderado = round2(totalPonderado + ponderado);
    totalCosto = round2(totalCosto + costo);

    setCell(ws, row, TASK_COLS.descripcion, task.description || task.title || '');
    setCell(ws, row, TASK_COLS.fecha, start ? formatDate(start) : '');
    setCell(ws, row, TASK_COLS.horaInicio, start ? formatTime(start) : '');
    setCell(ws, row, TASK_COLS.horaFin, end ? formatTime(end) : '');
    setCell(ws, row, TASK_COLS.horas, hours > 0 ? hours : '');
    setCell(ws, row, TASK_COLS.horasDefinitivas, ponderado > 0 ? ponderado : '');
    setCell(ws, row, TASK_COLS.statusC, task.status === 'Completed' ? 'C' : '');
    setCell(ws, row, TASK_COLS.statusP, task.status === 'Completed' ? '' : 'P');
    setCell(ws, row, TASK_COLS.motivo, task.status === 'Completed' ? '' : task.notes || '');
    setCell(ws, row, TASK_COLS.horasHO, ho > 0 ? ho : '');
    setCell(ws, row, TASK_COLS.horasEH, eh > 0 ? eh : '');
    setCell(ws, row, TASK_COLS.horasDF, df > 0 ? df : '');
    setCell(ws, row, TASK_COLS.horasFactor, ponderado > 0 ? ponderado : '');
    setCell(ws, row, TASK_COLS.costo, costo > 0 ? costo : '');
  });

  // Totales (fila 41)
  const f = LAYOUT.totalFila;
  setCell(ws, f, TASK_COLS.horasDefinitivas, totalPonderado > 0 ? totalPonderado : '');
  setCell(ws, LAYOUT.totalHorasDefinitivas.row, LAYOUT.totalHorasDefinitivas.col, totalPonderado > 0 ? totalPonderado : '');
  setCell(ws, f, TASK_COLS.horasHO, totalHO > 0 ? totalHO : '');
  setCell(ws, f, TASK_COLS.horasEH, totalEH > 0 ? totalEH : '');
  setCell(ws, f, TASK_COLS.horasDF, totalDF > 0 ? totalDF : '');
  setCell(ws, f, TASK_COLS.horasFactor, totalPonderado > 0 ? totalPonderado : '');
  setCell(ws, f, TASK_COLS.costo, totalCosto > 0 ? totalCosto : '');

  // Aceptacion: nombres
  setCell(ws, LAYOUT.nombreCliente.row, LAYOUT.nombreCliente.col, project.clientContact || project.client || '');
  setCell(ws, LAYOUT.nombreProveedor.row, LAYOUT.nombreProveedor.col, project.teamLead?.name || '');

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
};

export const useProjectExport = () => {
  const exportProjectReport = async (project: any) => {
    try {
      const tasks = (project.tasks || []).filter((t: any) => taskHours(t) > 0 || t.description);

      // Si el proyecto excede las lineas por hoja, se parte en varios archivos
      const partes = Math.max(1, Math.ceil(tasks.length / TASKS_PER_REPORT));
      const solicitud = generateSolicitud();

      const sanitizedClient = (project.client || 'Reporte').replace(/[^a-zA-Z0-9]/g, '');

      for (let parte = 1; parte <= partes; parte++) {
        const slice = tasks.slice((parte - 1) * TASKS_PER_REPORT, parte * TASKS_PER_REPORT);
        const blob = await buildReport(project, slice, { solicitud, parte, partes });

        if (partes === 1) {
          saveAs(blob, `Reporte_${sanitizedClient}.xlsx`);
        } else {
          saveAs(blob, `Reporte_${sanitizedClient}_Parte${parte}.xlsx`);
        }

        // Pequeña pausa entre descargas por si el navegador activa protecciones
        if (parte < partes) await new Promise((r) => setTimeout(r, 500));
      }

      const msg =
        partes === 1
          ? `Reporte de "${project.name}" exportado (N. Solicitud ${solicitud})`
          : `Reporte de "${project.name}" exportado en ${partes} partes (N. Solicitud ${solicitud})`;
      toast.success(msg);
    } catch (error) {
      console.error('Error al exportar el reporte:', error);
      toast.error('Error al exportar el reporte');
    }
  };

  return { exportProjectReport };
};