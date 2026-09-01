import { Inject, Injectable, Logger } from '@nestjs/common';
import { FileValidationService } from './storage-validations.service';
import { Express } from 'express';
import * as storageInterface from '../interfaces/storage.interface';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(
    @Inject(storageInterface.STORAGE_SERVICE)
    private readonly storageProvider: storageInterface.IStorageService,
    private readonly validationService: FileValidationService,
  ) {}

  /**
   * Valida y sube un archivo a una ruta específica.
   * @param file El archivo a subir.
   * @param path La subcarpeta de destino (ej: 'user-avatars').
   * @param allowedMimeTypes Lista de tipos MIME permitidos para este upload.
   * @param maxSizeInBytes Tamaño máximo permitido en bytes.
   * @returns La URL del archivo subido.
   */
  async uploadFile(
    file: Express.Multer.File,
    path: string,
    allowedMimeTypes: string[],
    maxSizeInBytes: number,
  ): Promise<{ url: string; key: string }> {
    this.logger.verbose(
      `Validating file ${file.originalname} for path ${path}`,
    );

    // 1. Validar
    this.validationService.allowedMimeType(file, allowedMimeTypes);
    this.validationService.MaxSize(file, maxSizeInBytes);

    this.logger.verbose(
      'File validation successful. Uploading to storage provider...',
    );

    // 2. Delegar la subida al proveedor de almacenamiento
    const uploadedFile = await this.storageProvider.upload(file, path);

    this.logger.log(
      `File successfully uploaded. URL: ${uploadedFile.url}, Key: ${uploadedFile.key}`,
    );

    return uploadedFile;
  }

  /**
   * Elimina un archivo utilizando su clave.
   * @param fileKey La clave/ruta del archivo en el bucket.
   */
  async deleteFile(fileKey: string): Promise<boolean> {
    return this.storageProvider.delete(fileKey);
  }

  /**
   * Obtiene la URL pública de un archivo.
   * @param fileKey La clave/ruta del archivo en el bucket.
   */
  getPublicUrl(fileKey: string): string {
    return this.storageProvider.getPublicUrl(fileKey);
  }

  /**
   * Obtiene una URL firmada para un archivo.
   * @param fileKey La clave/ruta del archivo en el bucket.
   * @param expiresInSeconds Tiempo de validez de la URL en segundos.
   */
  async getSignedUrl(
    fileKey: string,
    expiresInSeconds = 3600,
  ): Promise<string> {
    return this.storageProvider.getSignedUrl(fileKey, expiresInSeconds);
  }
}
