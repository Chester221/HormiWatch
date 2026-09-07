import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { IStorageService } from '../interfaces/storage.interface';
import supabaseConfig from 'src/config/supabase.config';
import { v4 as uuid } from 'uuid';
import { extname } from 'path';
import type { ConfigType } from '@nestjs/config';

@Injectable()
export class SupabaseService implements IStorageService {
  private readonly logger = new Logger(SupabaseService.name);

  constructor(
    @Inject(supabaseConfig.KEY)
    private readonly config: ConfigType<typeof supabaseConfig>,
    @Inject('SUPABASE_CLIENT') private readonly supabase: SupabaseClient,
  ) {}

  async upload(
    file: Express.Multer.File,
    path: string,
  ): Promise<{ url: string; key: string }> {
    const extension = extname(file.originalname);

    const fileName = `${path}/${uuid()}${extension}`;

    const { error } = await this.supabase.storage
      .from(this.config.bucket)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      this.logger.error(
        `Error uploading file to Supabase: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Error uploading file: ${error.message}`,
      );
    }

    return {
      url: this.getPublicUrl(fileName),
      key: fileName,
    };
  }

  async delete(fileKey: string): Promise<boolean> {
    const { error } = await this.supabase.storage
      .from(this.config.bucket)
      .remove([fileKey]);

    if (error) {
      this.logger.error(
        `Error deleting file from Supabase: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Error deleting file: ${error.message}`,
      );
    }

    return true;
  }

  getPublicUrl(fileKey: string): string {
    const { data } = this.supabase.storage
      .from(this.config.bucket)
      .getPublicUrl(fileKey);

    return data.publicUrl;
  }

  async getSignedUrl(fileKey: string, expiresInSeconds = 60): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(this.config.bucket)
      .createSignedUrl(fileKey, expiresInSeconds);

    if (error) {
      this.logger.error(
        `Error creating signed URL: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Could not create signed URL: ${error.message}`,
      );
    }

    return data.signedUrl;
  }
}
