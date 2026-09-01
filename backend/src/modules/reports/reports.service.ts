import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../projects/entities/project.entity';
import { Task } from '../tasks/entities/task.entity';
import { Customer } from '../customers/entities/customer.entity';
import { CustomerContact } from '../customers/entities/customer_contact.entity';
// import * as PdfPrinter from 'pdfmake'; // Broken import
const PdfPrinter = require('pdfmake');
import QuickChart from 'quickchart-js';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { Temporal } from 'temporal-polyfill';

@Injectable()
export class ReportsService {
  private printer: any; // Type as any or PdfPrinter from pdfmake types if available via require

  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(CustomerContact)
    private readonly contactRepository: Repository<CustomerContact>,
  ) {
    const fonts = {
      Roboto: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique',
      },
    };
    this.printer = new PdfPrinter(fonts);
  }

  // --- Helper Methods ---

  private async getProjectData(projectId: string) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: [
        'customerContact',
        'customerContact.customer',
        'tasks',
        'tasks.service',
        'tasks.technician',
        'tasks.technician.profile', // Assuming profile exists on User
        'projectLeader',
        'projectLeader.profile', // For leader name
        'technicians',
        'technicians.profile', // For technician names
      ],
    });

    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  private generatePdfBuffer(
    docDefinition: TDocumentDefinitions,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const pdfDoc = this.printer.createPdfKitDocument(docDefinition);
      const chunks: Buffer[] = [];
      pdfDoc.on('data', (chunk: any) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', (err: any) => reject(err));
      pdfDoc.end();
    });
  }

  private formatInstantDate(instant: Temporal.Instant): string {
    if (!instant) return 'N/A';
    return instant.toZonedDateTimeISO('UTC').toPlainDate().toString();
  }

  private formatInstantTime(instant: Temporal.Instant): string {
    if (!instant) return 'N/A';
    return instant.toZonedDateTimeISO('UTC').toPlainTime().toString();
  }

  // --- Report 1: Simple Project Report ---

  async generateProjectReport(projectId: string): Promise<Buffer> {
    const project = await this.getProjectData(projectId);

    // Calculations
    const totalHours = project.tasks.reduce((sum, task) => {
      return sum + (task.durationInHours || 0);
    }, 0);

    const docDefinition: TDocumentDefinitions = {
      content: [
        this.buildHeader(project),
        { text: '1. Datos del Cliente', style: 'sectionHeader' },
        this.buildClientData(project),
        { text: '2. Datos del Proyecto', style: 'sectionHeader' },
        this.buildProjectData(project),
        { text: '3. Detalles del Proyecto', style: 'sectionHeader' },
        this.buildTasksTable(project, totalHours),
        { text: '4. Aceptación', style: 'sectionHeader' },
        this.buildAcceptanceSection(project, true),
        this.buildFooter(),
      ],
      styles: this.getStyles(),
      defaultStyle: {
        fontSize: 10,
      },
    };

    return this.generatePdfBuffer(docDefinition);
  }

  // --- Report 2: User/Technician Report ---

  async generateProjectUserReport(projectId: string): Promise<Buffer> {
    const project = await this.getProjectData(projectId);

    const docDefinition: TDocumentDefinitions = {
      content: [
        this.buildHeader(project),
        { text: '1. Datos del Cliente', style: 'sectionHeader' },
        this.buildClientData(project),
        { text: '2. Datos del Proyecto', style: 'sectionHeader' },
        this.buildProjectData(project),
        { text: '3. Detalles del Proyecto', style: 'sectionHeader' },
        this.buildTechniciansTable(project),
        { text: '4. Aceptación', style: 'sectionHeader' },
        this.buildAcceptanceSection(project, false),
        this.buildFooter(),
      ],
      styles: this.getStyles(),
      defaultStyle: {
        fontSize: 10,
      },
    };

    return this.generatePdfBuffer(docDefinition);
  }

  // --- Report 3: Graphic Report ---

  async generateProjectGraphicReport(projectId: string): Promise<Buffer> {
    const project = await this.getProjectData(projectId);

    // Generate Chart Image
    const chartImage = await this.generateChartImage(project);

    const docDefinition: TDocumentDefinitions = {
      content: [
        this.buildHeader(project),
        { text: '1. Datos del Cliente', style: 'sectionHeader' },
        this.buildClientData(project),
        { text: '2. Datos del Proyecto', style: 'sectionHeader' },
        this.buildProjectData(project, true),
        { text: '3. Gráficas del Proyecto', style: 'sectionHeader' },
        {
          image: chartImage,
          width: 500,
          alignment: 'center',
          margin: [0, 20],
        },
      ],
      styles: this.getStyles(),
      defaultStyle: {
        fontSize: 10,
      },
    };

    return this.generatePdfBuffer(docDefinition);
  }

  // --- Building Blocks ---

  private buildHeader(project: Project): any {
    return {
      style: 'infoBox',
      table: {
        widths: ['20%', '50%', '30%'],
        body: [
          [
            {
              text: [
                { text: 'Hormi', bold: true, fontSize: 16 },
                { text: 'Watch', color: '#0ea5e9', bold: true, fontSize: 16 },
              ],
              alignment: 'center',
              margin: [0, 10],
            },
            {
              text: 'Reporte de Atencion al Cliente',
              style: 'headerTitle',
              alignment: 'center',
              margin: [0, 10],
            },
            {
              stack: [
                {
                  text: [
                    { text: 'Fecha: ', bold: true },
                    new Date().toLocaleDateString(),
                  ],
                },
                {
                  text: [
                    { text: 'Codigo Proyecto: ', bold: true },
                    project.id.split('-')[0],
                  ],
                },
              ],
              alignment: 'right',
              margin: [0, 10],
              border: [true, false, false, false],
              borderColor: ['#0ea5e9', '', '', ''],
            },
          ],
        ],
      },
      layout: {
        hLineWidth: () => 0,
        vLineWidth: (i: number) => (i === 2 ? 2 : 0),
        vLineColor: () => '#0ea5e9',
        paddingLeft: () => 8,
        paddingRight: () => 8,
        paddingTop: () => 8,
        paddingBottom: () => 8,
      },
    };
  }

  private buildClientData(project: Project): any {
    const contact = project.customerContact;
    const customer = contact?.customer;
    return {
      style: 'infoBox',
      table: {
        widths: ['50%', '50%'],
        body: [
          [
            {
              stack: [
                {
                  text: [
                    { text: 'Nombre: ', bold: true },
                    customer?.name || 'N/A',
                  ],
                  margin: [0, 2],
                },
                {
                  canvas: [
                    {
                      type: 'line',
                      x1: 0,
                      y1: 0,
                      x2: 230,
                      y2: 0,
                      lineWidth: 1,
                      lineColor: '#gray',
                    },
                  ],
                  margin: [0, 2],
                },
                {
                  text: [
                    { text: 'Codigo Cliente: ', bold: true },
                    (customer?.id || 'N/A').split('-')[0],
                  ],
                  margin: [0, 2],
                },
                {
                  canvas: [
                    {
                      type: 'line',
                      x1: 0,
                      y1: 0,
                      x2: 230,
                      y2: 0,
                      lineWidth: 1,
                      lineColor: '#gray',
                    },
                  ],
                  margin: [0, 2],
                },
                {
                  text: [{ text: 'Departamento: ', bold: true }, 'N/A'],
                  margin: [0, 2],
                },
              ],
              margin: [10, 5],
            },
            {
              stack: [
                {
                  text: [
                    { text: 'Responsable Cliente: ', bold: true },
                    `${contact?.name || ''} ${contact?.lastName || ''}`,
                  ],
                  margin: [0, 2],
                },
                {
                  canvas: [
                    {
                      type: 'line',
                      x1: 0,
                      y1: 0,
                      x2: 230,
                      y2: 0,
                      lineWidth: 1,
                      lineColor: '#gray',
                    },
                  ],
                  margin: [0, 2],
                },
                {
                  text: [
                    { text: 'Cargo: ', bold: true },
                    contact?.position || 'N/A',
                  ],
                  margin: [0, 2],
                },
                {
                  canvas: [
                    {
                      type: 'line',
                      x1: 0,
                      y1: 0,
                      x2: 230,
                      y2: 0,
                      lineWidth: 1,
                      lineColor: '#gray',
                    },
                  ],
                  margin: [0, 2],
                },
                {
                  text: [
                    { text: 'Telefono: ', bold: true },
                    contact?.phone || 'N/A',
                  ],
                  margin: [0, 2],
                },
              ],
              margin: [10, 5],
              border: [true, false, false, false],
              borderColor: ['#0ea5e9', '', '', ''],
            },
          ],
        ],
      },
      layout: this.getCustomLayout(),
    };
  }

  private buildProjectData(project: Project, showPools = false): any {
    // Collect technician names from task assignments or project assignment?
    // Project entity has "technicians" ManyToMany.
    const technicians =
      project.technicians
        ?.map((t) => `${t.profile?.name} ${t.profile?.lastName}`)
        .join(', ') || 'N/A';

    // Simulating pools logic if not in entity
    const poolContratado = project.poolHours || '0';
    const poolRestante = '0'; // Logic for remaining hours not apparent in entity, assuming 0 or calc needed.

    const content: any[] = [
      {
        text: [{ text: 'Nombre del Proyecto: ', bold: true }, project.title],
        margin: [0, 2],
      },
      {
        canvas: [
          {
            type: 'line',
            x1: 0,
            y1: 0,
            x2: 500,
            y2: 0,
            lineWidth: 1,
            lineColor: '#gray',
          },
        ],
        margin: [0, 2],
      },
      {
        text: [
          { text: 'Fecha de Inicio: ', bold: true },
          project.startDate ? project.startDate.toString() : 'N/A',
        ],
        margin: [0, 2],
      },
      {
        canvas: [
          {
            type: 'line',
            x1: 0,
            y1: 0,
            x2: 500,
            y2: 0,
            lineWidth: 1,
            lineColor: '#gray',
          },
        ],
        margin: [0, 2],
      },
      {
        text: [
          { text: 'Pool de Horas Asignadas: ', bold: true },
          showPools ? poolContratado : poolContratado,
        ],
        margin: [0, 2],
      }, // Always show assigned
    ];

    if (showPools) {
      content.push(
        {
          canvas: [
            {
              type: 'line',
              x1: 0,
              y1: 0,
              x2: 500,
              y2: 0,
              lineWidth: 1,
              lineColor: '#gray',
            },
          ],
          margin: [0, 2],
        },
        {
          text: [
            { text: 'Pool de Horas Restantes: ', bold: true },
            poolRestante,
          ],
          margin: [0, 2],
        },
      );
    }

    content.push(
      {
        canvas: [
          {
            type: 'line',
            x1: 0,
            y1: 0,
            x2: 500,
            y2: 0,
            lineWidth: 1,
            lineColor: '#gray',
          },
        ],
        margin: [0, 2],
      },
      {
        text: [
          { text: 'Tarifa por Hora: ', bold: true },
          String(project.hourlyRate || 0),
        ],
        margin: [0, 2],
      },
      {
        canvas: [
          {
            type: 'line',
            x1: 0,
            y1: 0,
            x2: 500,
            y2: 0,
            lineWidth: 1,
            lineColor: '#gray',
          },
        ],
        margin: [0, 2],
      },
      {
        text: [{ text: 'Tecnico Asignado: ', bold: true }, technicians],
        margin: [0, 2],
      },
    );

    return {
      style: 'infoBox',
      stack: content,
      margin: [0, 5, 0, 10],
      padding: 10,
    };
  }

  private buildTasksTable(project: Project, totalHours: number): any {
    const tasks = project.tasks || [];

    const rows = tasks.map((t) => [
      t.service?.name || t.description || 'OTR',
      this.formatInstantDate(t.startDateTime),
      this.formatInstantTime(t.startDateTime),
      this.formatInstantTime(t.endDateTime),
      t.durationInHours?.toFixed(2) || '0',
      t.appliedHourlyRate || '0',
      (t.durationInHours * t.appliedHourlyRate).toFixed(2), // Total Tariff
    ]);

    return {
      style: 'tableExample',
      table: {
        headerRows: 1,
        widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
        body: [
          [
            { text: 'Servicio', style: 'tableHeader' },
            { text: 'Fecha', style: 'tableHeader' },
            { text: 'Hora Inicio', style: 'tableHeader' },
            { text: 'Hora Fin', style: 'tableHeader' },
            { text: 'Total Horas', style: 'tableHeader' },
            { text: 'Valor Factor', style: 'tableHeader' },
            { text: 'Total Tarifa', style: 'tableHeader' },
          ],
          ...rows,
          [
            { text: '', border: [false, false, false, false] },
            { text: '', border: [false, false, false, false] },
            { text: '', border: [false, false, false, false] },
            { text: '', border: [false, false, false, false] },
            {
              text: 'Total de Horas',
              style: 'tableHeader',
              alignment: 'center',
            },
            {
              text: totalHours.toFixed(2),
              style: 'tableCell',
              alignment: 'center',
            },
            { text: '', border: [false, false, false, false] },
          ],
        ],
      },
      layout: {
        fillColor: (rowIndex: number) => (rowIndex === 0 ? '#0ea5e9' : null),
      },
    };
  }

  private buildTechniciansTable(project: Project): any {
    const techStats = new Map<
      string,
      { name: string; id: string; email: string; count: number; hours: number }
    >();

    project.tasks?.forEach((t) => {
      const tech = t.technician;
      if (tech) {
        const existing = techStats.get(tech.id) || {
          name: `${tech.profile?.name} ${tech.profile?.lastName}`,
          id: tech.id, // Or CEDULA from profile if available
          email: tech.email,
          count: 0,
          hours: 0,
        };
        existing.count++;
        existing.hours += t.durationInHours || 0;
        techStats.set(tech.id, existing);
      }
    });

    const rows = Array.from(techStats.values()).map((tech) => [
      tech.name,
      tech.id,
      tech.email,
      tech.count,
      tech.hours.toFixed(2),
    ]);

    return {
      style: 'tableExample',
      table: {
        headerRows: 1,
        widths: ['*', 'auto', '*', 'auto', 'auto'],
        body: [
          [
            { text: 'Tecnico', style: 'tableHeader' },
            { text: 'Cedula', style: 'tableHeader' },
            { text: 'Correo Electronico', style: 'tableHeader' },
            { text: 'Cantidad de Tareas', style: 'tableHeader' },
            { text: 'Tiempo total', style: 'tableHeader' },
          ],
          ...rows,
        ],
      },
    };
  }

  private buildAcceptanceSection(
    project: Project,
    fullSignatures: boolean,
  ): any {
    const technicians = project.technicians || [];
    const techNames = technicians
      .map((t) => `${t.profile?.name} ${t.profile?.lastName}`)
      .join(', ');

    if (!fullSignatures) {
      return {
        style: 'infoBox',
        table: {
          widths: ['100%'],
          body: [
            [
              {
                stack: [
                  { text: 'Por el Lider Tecnico:', bold: true },
                  {
                    text: [
                      { text: 'Nombre: ', bold: true },
                      `${project.projectLeader?.profile?.name} ${project.projectLeader?.profile?.lastName}`,
                    ],
                    margin: [0, 5],
                  },
                  {
                    canvas: [
                      {
                        type: 'line',
                        x1: 0,
                        y1: 0,
                        x2: 200,
                        y2: 0,
                        lineWidth: 1,
                      },
                    ],
                    margin: [0, 5],
                  },
                  { text: [{ text: 'C.I: ', bold: true }, ''], margin: [0, 5] },
                  {
                    text: 'Firma: __________________________',
                    margin: [0, 10],
                  },
                ],
                margin: [10, 5],
              },
            ],
          ],
        },
        layout: this.getCustomLayout(),
      };
    }

    return {
      style: 'infoBox',
      table: {
        widths: ['50%', '50%'],
        body: [
          [
            {
              stack: [
                { text: 'Por el Cliente:', bold: true },
                {
                  text: [
                    { text: 'Nombre del Cliente: ', bold: true },
                    project.customerContact?.name || '',
                  ],
                  margin: [0, 5],
                },
                {
                  canvas: [
                    {
                      type: 'line',
                      x1: 0,
                      y1: 0,
                      x2: 230,
                      y2: 0,
                      lineWidth: 1,
                    },
                  ],
                  margin: [0, 5],
                },
                {
                  text: [
                    { text: 'C.I: ', bold: true },
                    project.customerContact?.id_card || '',
                  ],
                  margin: [0, 5],
                },
                { text: 'Firma: __________________', margin: [0, 10] },
              ],
              margin: [10, 5],
            },
            {
              stack: [
                { text: 'Por el Tecnico:', bold: true },
                {
                  text: [
                    { text: 'Nombre del Tecnico: ', bold: true },
                    techNames,
                  ],
                  margin: [0, 5],
                },
                {
                  canvas: [
                    {
                      type: 'line',
                      x1: 0,
                      y1: 0,
                      x2: 230,
                      y2: 0,
                      lineWidth: 1,
                    },
                  ],
                  margin: [0, 5],
                },
                { text: [{ text: 'C.I: ', bold: true }, ''], margin: [0, 5] },
                {
                  text: 'Firma: ______________________________________________________',
                  margin: [0, 10],
                },
              ],
              margin: [10, 5],
              border: [true, false, false, false],
              borderColor: ['#0ea5e9', '', '', ''],
            },
          ],
        ],
      },
      layout: this.getCustomLayout(),
    };
  }

  private buildFooter(): any {
    return {
      style: 'infoBox',
      text: 'Al firmar este reporte como receptor del servicio prestado, el cliente acepta y está conforme con el mismo, así como que ha verificado su efectiva ejecución. Los términos para el posterior pago de la correspondiente factura, si el caso amerita, será según las tarifas vigentes para el tipo de servicio prestado y/o cotizado, previamente autorizado por el Cliente.',
      margin: [0, 10],
    };
  }

  private async generateChartImage(project: Project): Promise<string> {
    const dataMap = new Map<string, number>();
    project.tasks?.forEach((t) => {
      const serviceName = t.service?.name || 'Unknown';
      dataMap.set(
        serviceName,
        (dataMap.get(serviceName) || 0) + (t.durationInHours || 0),
      );
    });

    const labels = Array.from(dataMap.keys());
    const data = Array.from(dataMap.values());

    const chart = new QuickChart();
    chart.setWidth(800);
    chart.setHeight(400);
    chart.setVersion('4'); // Ensure Chart.js v4 is used to support 'plugins' config
    chart.setConfig({
      type: 'pie',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Tiempo por Servicio',
            data: data,
            backgroundColor: [
              '#3b82f6',
              '#ef4444',
              '#10b981',
              '#f59e0b',
              '#8b5cf6',
              '#ec4899',
            ],
          },
        ],
      },
      options: {
        plugins: {
          legend: { position: 'bottom' },
        },
      },
    });

    // Return Data URL (Base64)
    return chart.toDataUrl();
  }

  // --- Styles ---

  private getStyles(): { [name: string]: any } {
    return {
      headerTitle: { fontSize: 18, bold: true, color: '#1f2937' },
      sectionHeader: {
        fontSize: 12,
        bold: true,
        margin: [0, 10, 0, 5] as [number, number, number, number],
      },
      infoBox: {
        margin: [0, 5] as [number, number],
      },
      tableExample: {
        margin: [0, 5, 0, 15] as [number, number, number, number],
      },
      tableHeader: {
        bold: true,
        fontSize: 10,
        color: 'white',
        fillColor: '#0ea5e9',
        alignment: 'center',
      },
      tableCell: {
        fontSize: 10,
        color: '#1f2937',
      },
    };
  }

  private getCustomLayout() {
    return {
      hLineWidth: () => 1,
      vLineWidth: () => 1,
      hLineColor: '#0ea5e9',
      vLineColor: '#0ea5e9',
      paddingLeft: () => 8,
      paddingRight: () => 8,
      paddingTop: () => 8,
      paddingBottom: () => 8,
    };
  }
}
