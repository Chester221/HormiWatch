import { Module } from '@nestjs/common';
import { HashingService } from './hashing.service';
import { ConfigModule } from '@nestjs/config';
import hashingConfig from 'src/config/hashing.config';

@Module({
  imports: [ConfigModule.forFeature(hashingConfig)],
  providers: [HashingService],
  exports: [HashingService],
})
export class HashingModule {}
