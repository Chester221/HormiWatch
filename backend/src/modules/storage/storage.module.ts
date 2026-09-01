import { Module } from '@nestjs/common';
import { StorageController } from './storage.controller';
import { StorageService } from './services/storage.service';
import { SupabaseService } from './services/supabase.service';
import { FileValidationService } from './services/storage-validations.service';
import { STORAGE_SERVICE } from './interfaces/storage.interface';
import { ConfigModule, ConfigType } from '@nestjs/config';
import supabaseConfig from 'src/config/supabase.config';
import { createClient } from '@supabase/supabase-js';

@Module({
  imports: [ConfigModule.forFeature(supabaseConfig)],
  controllers: [StorageController],
  providers: [
    StorageService,
    FileValidationService,
    SupabaseService,
    {
      provide: STORAGE_SERVICE,
      useClass: SupabaseService,
    },
    {
      provide: 'SUPABASE_CLIENT',
      inject: [supabaseConfig.KEY], // Use the key from the default export
      useFactory: (config: ConfigType<typeof supabaseConfig>) => {
        return createClient(config.url, config.key, {
          auth: {
            persistSession: false,
          },
        });
      },
    },
  ],
  exports: [StorageService, FileValidationService],
})
export class StorageModule {}
