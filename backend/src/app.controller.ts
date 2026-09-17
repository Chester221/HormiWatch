import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { AppService } from './app.service';
import { SkipAuth } from './modules/auth/decorator/skipAuth.decorator';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // ✅ Healthcheck para Railway (/api/v1/health): responde 200 solo si la app
  // está viva Y la base de datos responde. Si la BD falla → 503 → Railway
  // marca la instancia como no saludable y la reinicia.
  @SkipAuth()
  @Get('health')
  async getHealth(): Promise<{ status: string; database: string }> {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok', database: 'ok' };
    } catch {
      throw new ServiceUnavailableException({ status: 'error', database: 'error' });
    }
  }
}