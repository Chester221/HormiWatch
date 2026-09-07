import { Controller, Get, Param, Res } from '@nestjs/common';
import { ReportsService } from './reports.service';
import type { Response } from 'express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get(':id/pdf')
  async generateProjectReport(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.reportsService.generateProjectReport(id);
    this.sendPdfResponse(res, buffer, 'reporte_atencion.pdf');
  }

  @Get(':id/pdf-usuarios')
  async generateProjectUserReport(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.generateProjectUserReport(id);
    this.sendPdfResponse(res, buffer, 'reporte_usuarios.pdf');
  }

  @Get(':id/pdf-grafico')
  async generateProjectGraphicReport(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.generateProjectGraphicReport(id);
    this.sendPdfResponse(res, buffer, 'reporte_grafico.pdf');
  }

  private sendPdfResponse(res: Response, buffer: Buffer, filename: string) {
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
