import { Module } from '@nestjs/common';
import { StorageController } from './storage.controller';
import { StorageService } from './services/storage.service';
import { FileValidationService } from './services/storage-validations.service';

@Module({
  imports: [],
  controllers: [StorageController],
  providers: [
    StorageService,
    FileValidationService,
  ],
  exports: [StorageService, FileValidationService],
})
export class StorageModule {}