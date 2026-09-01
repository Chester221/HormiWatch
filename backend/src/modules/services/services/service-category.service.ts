import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceCategory } from '../entities/service-category.entity';
import { CreateServiceCategoryDto } from '../dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from '../dto/update-service-category.dto';
import { ServiceCategoryResponseDto } from '../dto/service-category-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ServiceCategoryService {
  constructor(
    @InjectRepository(ServiceCategory)
    private readonly categoryRepository: Repository<ServiceCategory>,
  ) {}

  async create(
    createDto: CreateServiceCategoryDto,
  ): Promise<ServiceCategoryResponseDto> {
    const category = this.categoryRepository.create(createDto);
    const savedCategory = await this.categoryRepository.save(category);
    return plainToInstance(ServiceCategoryResponseDto, savedCategory);
  }

  async findAll(): Promise<ServiceCategoryResponseDto[]> {
    const categories = await this.categoryRepository.find();
    return plainToInstance(ServiceCategoryResponseDto, categories);
  }

  async findOne(id: string): Promise<ServiceCategoryResponseDto> {
    const category = await this.categoryRepository.findOneBy({ id });
    if (!category) {
      throw new NotFoundException(`Service Category with ID ${id} not found`);
    }
    return plainToInstance(ServiceCategoryResponseDto, category);
  }

  async update(
    id: string,
    updateDto: UpdateServiceCategoryDto,
  ): Promise<ServiceCategoryResponseDto> {
    const category = await this.categoryRepository.findOneBy({ id });
    if (!category) {
      throw new NotFoundException(`Service Category with ID ${id} not found`);
    }
    this.categoryRepository.merge(category, updateDto);
    const updatedCategory = await this.categoryRepository.save(category);
    return plainToInstance(ServiceCategoryResponseDto, updatedCategory);
  }

  async remove(id: string): Promise<ServiceCategoryResponseDto> {
    const category = await this.categoryRepository.findOneBy({ id });
    if (!category) {
      throw new NotFoundException(`Service Category with ID ${id} not found`);
    }
    const removedCategory = await this.categoryRepository.softRemove(category);
    return plainToInstance(ServiceCategoryResponseDto, removedCategory);
  }
}
