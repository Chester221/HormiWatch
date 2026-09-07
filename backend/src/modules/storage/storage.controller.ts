import {
  Controller,
  // Post,
  // UploadedFile,
  // UseInterceptors,
  // ParseFilePipe,
  // HttpCode,
  // HttpStatus,
  // Logger,
  // Get,
  // Param,
  // Delete,
  // Query,
  // ParseIntPipe,
  // DefaultValuePipe,
  // Body,
} from '@nestjs/common';
// import { FileInterceptor } from '@nestjs/platform-express';
// import { StorageService } from './services/storage.service';
// import { FileValidationService } from './services/storage-validations.service';
// import type { Express } from 'express';
// import { SkipAuth } from '../auth/decorator/skipAuth.decorator';

@Controller('storage')
export class StorageController {
  // private readonly logger = new Logger(StorageController.name);
  // constructor(
  //   private readonly storageService: StorageService,
  //   private readonly fileValidationService: FileValidationService,
  // ) {}
  // @Post('upload/image')
  // @SkipAuth()
  // @HttpCode(HttpStatus.OK)
  // @UseInterceptors(FileInterceptor('file'))
  // async uploadImage(
  //   @UploadedFile(new ParseFilePipe())
  //   file: Express.Multer.File,
  // ) {
  //   this.logger.verbose(
  //     `Received request to upload image: ${file.originalname}`,
  //   );
  //   const destinationPath = 'public-images';
  //   const allowedMimeTypes =
  //     this.fileValidationService.getMimeTypesByGroup('image');
  //   const maxFileSize = 5 * 1024 * 1024; // 5 MB
  //   const uploadedFileUrl = await this.storageService.uploadFile(
  //     file,
  //     destinationPath,
  //     allowedMimeTypes,
  //     maxFileSize,
  //   );
  //   return {
  //     message: 'File uploaded successfully!',
  //     url: uploadedFileUrl,
  //   };
  // }
  // @Post('public-url')
  // @SkipAuth()
  // @HttpCode(HttpStatus.OK)
  // getPublicUrl(@Body('fileKey') fileKey: string) {
  //   const url = this.storageService.getPublicUrl(fileKey);
  //   return {
  //     message: 'Public URL retrieved successfully!',
  //     url,
  //   };
  // }
  // @Post('signed-url')
  // @SkipAuth()
  // @HttpCode(HttpStatus.OK)
  // async getSignedUrl(
  //   @Body('fileKey') fileKey: string,
  //   @Query('expiresIn', new DefaultValuePipe(3600), ParseIntPipe)
  //   expiresIn: number,
  // ) {
  //   const url = await this.storageService.getSignedUrl(fileKey, expiresIn);
  //   return {
  //     message: 'Signed URL generated successfully!',
  //     url,
  //   };
  // }
  // @Post('delete')
  // @SkipAuth()
  // @HttpCode(HttpStatus.OK)
  // async deleteFile(@Body('fileKey') fileKey: string) {
  //   await this.storageService.deleteFile(fileKey);
  //   return {
  //     message: `File ${fileKey} deleted successfully!`,
  //   };
  // }
}
