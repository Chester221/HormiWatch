import { Injectable, Logger } from '@nestjs/common';
import { FileValidationService } from './storage-validations.service';
import { Express } from 'express';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(
    private readonly fileValidationService: FileValidationService,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    destinationPath: string,
    allowedMimeTypes: string[],
    maxFileSize: number,
  ): Promise<{ url: string; key: string }> {
    this.logger.warn('⚠️ StorageService está en modo mock. Los archivos no se guardan realmente.');
    
    // Simular una URL de archivo
    const fakeUrl = `https://example.com/uploads/${Date.now()}-${file.originalname}`;
    const fakeKey = `${destinationPath}/${Date.now()}-${file.originalname}`;
    
    return {
      url: fakeUrl,
      key: fakeKey,
    };
  }

  async deleteFile(fileKey: string): Promise<void> {
    this.logger.warn(`⚠️ StorageService mock: No se eliminó el archivo ${fileKey}`);
    return;
  }
}