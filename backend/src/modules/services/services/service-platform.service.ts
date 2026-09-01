import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServicePlatform } from '../entities/service-platform.entity';
import { CreateServicePlatformDto } from '../dto/create-service-platform.dto';
import { UpdateServicePlatformDto } from '../dto/update-service-platform.dto';
import { ServicePlatformResponseDto } from '../dto/service-platform-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ServicePlatformService {
  constructor(
    @InjectRepository(ServicePlatform)
    private readonly platformRepository: Repository<ServicePlatform>,
  ) {}

  async create(
    createDto: CreateServicePlatformDto,
  ): Promise<ServicePlatformResponseDto> {
    const platform = this.platformRepository.create(createDto);
    const savedPlatform = await this.platformRepository.save(platform);
    return plainToInstance(ServicePlatformResponseDto, savedPlatform);
  }

  async findAll(): Promise<ServicePlatformResponseDto[]> {
    const platforms = await this.platformRepository.find();
    return plainToInstance(ServicePlatformResponseDto, platforms);
  }

  async findOne(id: string): Promise<ServicePlatformResponseDto> {
    const platform = await this.platformRepository.findOneBy({ id });
    if (!platform) {
      throw new NotFoundException(`Service Platform with ID ${id} not found`);
    }
    return plainToInstance(ServicePlatformResponseDto, platform);
  }

  async update(
    id: string,
    updateDto: UpdateServicePlatformDto,
  ): Promise<ServicePlatformResponseDto> {
    const platform = await this.platformRepository.findOneBy({ id });
    if (!platform) {
      throw new NotFoundException(`Service Platform with ID ${id} not found`);
    }
    this.platformRepository.merge(platform, updateDto);
    const updatedPlatform = await this.platformRepository.save(platform);
    return plainToInstance(ServicePlatformResponseDto, updatedPlatform);
  }

  async remove(id: string): Promise<ServicePlatformResponseDto> {
    const platform = await this.platformRepository.findOneBy({ id });
    if (!platform) {
      throw new NotFoundException(`Service Platform with ID ${id} not found`);
    }
    const removedPlatform = await this.platformRepository.softRemove(platform);
    return plainToInstance(ServicePlatformResponseDto, removedPlatform);
  }
}
