import { Inject, Injectable, Logger } from '@nestjs/common';
import * as argon2 from 'argon2';
import hashingConfig from '../../config/hashing.config';
import type { ConfigType } from '@nestjs/config';

@Injectable()
export class HashingService {
  private readonly logger = new Logger(HashingService.name);

  constructor(
    @Inject(hashingConfig.KEY)
    private readonly config: ConfigType<typeof hashingConfig>,
  ) {}

  async hash(data: string | Buffer): Promise<string> {
    try {
      this.logger.verbose('Hashing data...');

      return await argon2.hash(data, {
        type: argon2.argon2id,
        secret: Buffer.from(this.config.pepper),
        timeCost: 2,
        parallelism: 1,
        memoryCost: 19456, // 19 MiB
      });
    } catch (error) {
      this.logger.error('Error hashing data', error);
      throw error;
    }
  }

  async compare(data: string | Buffer, encrypted: string): Promise<boolean> {
    try {
      this.logger.verbose('Comparing data...');
      return await argon2.verify(encrypted, data, {
        secret: Buffer.from(this.config.pepper),
      });
    } catch (error) {
      this.logger.error('Error comparing data', error);
      throw error;
    }
  }
}
