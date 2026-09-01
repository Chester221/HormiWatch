import { BadRequestException, Injectable } from '@nestjs/common';
import { extname } from 'path';

@Injectable()
export class FileValidationService {
  /**
   * Validates if the file has an allowed MIME type.
   */
  allowedMimeType(
    file: Express.Multer.File,
    allowedTypes: string[],
    customMessage?: string,
  ): void {
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        customMessage ||
          `File type "${file.mimetype}" is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      );
    }
  }

  /**
   * Validates if the file's MIME type is explicitly disallowed.
   */
  disallowedMimeType(
    file: Express.Multer.File,
    blockedTypes: string[],
    customMessage?: string,
  ): void {
    if (blockedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        customMessage ||
          `File type "${file.mimetype}" is blocked. Disallowed types: ${blockedTypes.join(', ')}`,
      );
    }
  }

  /**
   * Validates the maximum size allowed for the file.
   */
  MaxSize(
    file: Express.Multer.File,
    maxBytes: number,
    customMessage?: string,
  ): void {
    if (file.size > maxBytes) {
      throw new BadRequestException(
        customMessage ||
          `File is too large: ${(file.size / (1024 * 1024)).toFixed(2)} MB. Maximum allowed size is ${(maxBytes / (1024 * 1024)).toFixed(2)} MB.`,
      );
    }
  }

  /**
   * Validates the minimum size required for the file.
   */
  MinSize(
    file: Express.Multer.File,
    minBytes: number,
    customMessage?: string,
  ): void {
    if (file.size < minBytes) {
      throw new BadRequestException(
        customMessage ||
          `File is too small: ${(file.size / 1024).toFixed(2)} KB. Minimum required size is ${(minBytes / 1024).toFixed(2)} KB.`,
      );
    }
  }

  /**
   * Validates the file extension by comparing against a whitelist.
   */
  allowedExtension(
    file: Express.Multer.File,
    allowedExtensions: string[],
    customMessage?: string,
  ): void {
    const extension = extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      throw new BadRequestException(
        customMessage ||
          `Extension "${extension}" is not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`,
      );
    }
  }

  /**
   * Returns a predefined list of MIME types grouped by file category.
   */
  getMimeTypesByGroup(group: 'image' | 'pdf' | 'document'): string[] {
    const mimeGroups: Record<string, string[]> = {
      image: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/svg+xml',
        'image/bmp',
        'image/tiff',
        'image/avif',
        'image/x-icon',
        'image/vnd.microsoft.icon',
      ],
      pdf: ['application/pdf'],
      document: [
        'application/msword',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv',
      ],
    };

    return mimeGroups[group] || [];
  }
}
