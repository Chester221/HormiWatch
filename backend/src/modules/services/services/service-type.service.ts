import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceType } from '../entities/service-type.entity';
import { CreateServiceTypeDto } from '../dto/create-service-type.dto';
import { UpdateServiceTypeDto } from '../dto/update-service-type.dto';
import { ServiceTypeResponseDto } from '../dto/service-type-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ServiceTypeService {
  constructor(
    @InjectRepository(ServiceType)
    private readonly typeRepository: Repository<ServiceType>,
  ) {}

  async create(
    createDto: CreateServiceTypeDto,
  ): Promise<ServiceTypeResponseDto> {
    const type = this.typeRepository.create(createDto);
    const savedType = await this.typeRepository.save(type);
    return plainToInstance(ServiceTypeResponseDto, savedType);
  }

  async findAll(): Promise<ServiceTypeResponseDto[]> {
    const types = await this.typeRepository.find();
    return plainToInstance(ServiceTypeResponseDto, types);
  }

  async findOne(id: string): Promise<ServiceTypeResponseDto> {
    const type = await this.typeRepository.findOneBy({ id });
    if (!type) {
      throw new NotFoundException(`Service Type with ID ${id} not found`);
    }
    return plainToInstance(ServiceTypeResponseDto, type);
  }

  async update(
    id: string,
    updateDto: UpdateServiceTypeDto,
  ): Promise<ServiceTypeResponseDto> {
    const type = await this.typeRepository.findOneBy({ id });
    if (!type) {
      throw new NotFoundException(`Service Type with ID ${id} not found`);
    }
    this.typeRepository.merge(type, updateDto);
    const updatedType = await this.typeRepository.save(type);
    return plainToInstance(ServiceTypeResponseDto, updatedType);
  }

  async remove(id: string): Promise<ServiceTypeResponseDto> {
    const type = await this.typeRepository.findOneBy({ id });
    if (!type) {
      throw new NotFoundException(`Service Type with ID ${id} not found`);
    }
    const removedType = await this.typeRepository.softRemove(type);
    return plainToInstance(ServiceTypeResponseDto, removedType);
  }
}
