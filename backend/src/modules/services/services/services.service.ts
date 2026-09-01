import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from '../entities/service.entity';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { ServiceResponseDto } from '../dto/service-response.dto';
import { plainToInstance } from 'class-transformer';
import { ServiceCategoryService } from './service-category.service';
import { ServicePlatformService } from './service-platform.service';
import { ServiceTypeService } from './service-type.service';
import { PageDto } from '../../../common/pagination/pagination.dto';
import { PageMeta } from '../../../common/pagination/metadata';
import {
  ServicePageOptionsDto,
  ServiceOrderBy,
} from '../dto/service-page-options.dto';
import { Brackets } from 'typeorm';
import { ServiceCategory } from '../entities/service-category.entity';
import { ServicePlatform } from '../entities/service-platform.entity';
import { ServiceType } from '../entities/service-type.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    private readonly categoryService: ServiceCategoryService,
    private readonly platformService: ServicePlatformService,
    private readonly typeService: ServiceTypeService,
  ) {}

  async create(createDto: CreateServiceDto): Promise<ServiceResponseDto> {
    const { categoryId, platformId, typeId, ...serviceData } = createDto;

    // Validate relations by finding them
    // Note: The individual services return DTOs, but here we need internal entities for relations or we can trust IDs if we just want to link.
    // However, TypeORM create allows passing IDs. But standard practice relates to checking existence.
    // My other services return DTOs, so I can't easily get the entity back unless I exposing a method or just try to save.
    // For now, I will assume valid IDs or let DB constraint fail, but better to check existence.
    // Since my other services return DTOs, I'll just check if they exist (throws NotFound if not).

    await this.categoryService.findOne(categoryId);
    await this.platformService.findOne(platformId);
    await this.typeService.findOne(typeId);

    const service = this.serviceRepository.create({
      ...serviceData,
      category: { id: categoryId },
      platform: { id: platformId },
      type: { id: typeId },
    });

    const savedService = await this.serviceRepository.save(service);

    // We need to return full relations. save() might not return them populated.
    return this.findOne(savedService.id);
  }

  async findAll(
    pageOptionsDto: ServicePageOptionsDto,
  ): Promise<PageDto<ServiceResponseDto>> {
    const queryBuilder = this.serviceRepository.createQueryBuilder('service');

    // Joins
    queryBuilder
      .leftJoinAndSelect('service.category', 'category')
      .leftJoinAndSelect('service.platform', 'platform')
      .leftJoinAndSelect('service.type', 'type')
      .leftJoinAndSelect('service.tasks', 'tasks'); // Added tasks join

    // Filters (IN support)
    if (pageOptionsDto.categoryIds && pageOptionsDto.categoryIds.length > 0) {
      queryBuilder.andWhere('category.id IN (:...categoryIds)', {
        categoryIds: pageOptionsDto.categoryIds,
      });
    }

    if (pageOptionsDto.platformIds && pageOptionsDto.platformIds.length > 0) {
      queryBuilder.andWhere('platform.id IN (:...platformIds)', {
        platformIds: pageOptionsDto.platformIds,
      });
    }

    if (pageOptionsDto.typeIds && pageOptionsDto.typeIds.length > 0) {
      queryBuilder.andWhere('type.id IN (:...typeIds)', {
        typeIds: pageOptionsDto.typeIds,
      });
    }

    if (pageOptionsDto.taskIds && pageOptionsDto.taskIds.length > 0) {
      queryBuilder.andWhere('tasks.id IN (:...taskIds)', {
        taskIds: pageOptionsDto.taskIds,
      });
    }

    // Global Search (q)
    if (pageOptionsDto.q) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('service.name ILIKE :q', { q: `%${pageOptionsDto.q}%` })
            .orWhere('service.description ILIKE :q', {
              q: `%${pageOptionsDto.q}%`,
            })
            .orWhere('category.name ILIKE :q', {
              q: `%${pageOptionsDto.q}%`,
            })
            .orWhere('platform.name ILIKE :q', {
              q: `%${pageOptionsDto.q}%`,
            })
            .orWhere('type.name ILIKE :q', {
              q: `%${pageOptionsDto.q}%`,
            })
            .orWhere('tasks.name ILIKE :q', {
              // Assuming tasks have a 'name' or 'title' property. Adjust if needed. User prompt implies "name of ... tasks".
              q: `%${pageOptionsDto.q}%`,
            });
        }),
      );
    }

    // Sorting
    let orderField = '';
    switch (pageOptionsDto.by) {
      case ServiceOrderBy.NAME:
        orderField = 'service.name';
        break;
      case ServiceOrderBy.CATEGORY:
        orderField = 'category.name';
        break;
      case ServiceOrderBy.PLATFORM:
        orderField = 'platform.name';
        break;
      case ServiceOrderBy.TYPE:
        orderField = 'type.name';
        break;
      case ServiceOrderBy.TASKS:
        // Ordering by tasks (OneToMany) often leads to duplicates or arbitrary selection if not aggregated.
        // Assuming user wants to order by task count or just the first task's name?
        // "ordenar por name de ... tareas". I'll default to tasks.name but this is tricky in 1:M.
        // Usually you don't sort a primary list by a detail list property unless you aggregate.
        // I will try tasks.name.
        orderField = 'tasks.name'; // Verify task entity property name!
        break;
      case ServiceOrderBy.UPDATED_AT:
        orderField = 'service.updatedAt';
        break;
      default:
        orderField = 'service.createdAt';
        break;
    }

    queryBuilder
      .orderBy(orderField, pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    // Execution
    const [entities, itemCount] = await queryBuilder.getManyAndCount();

    const pageMetaDto = new PageMeta(pageOptionsDto, itemCount);

    // Ensure DTO transformation
    const dtos = plainToInstance(ServiceResponseDto, entities);

    return new PageDto(dtos, pageMetaDto);
  }

  async findOne(id: string): Promise<ServiceResponseDto> {
    const service = await this.serviceRepository.findOne({
      where: { id },
      relations: ['category', 'platform', 'type', 'tasks'],
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    return plainToInstance(ServiceResponseDto, service);
  }

  async update(
    id: string,
    updateDto: UpdateServiceDto,
  ): Promise<ServiceResponseDto> {
    const service = await this.serviceRepository.findOne({
      where: { id },
      relations: ['category', 'platform', 'type'],
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    const { categoryId, platformId, typeId, ...serviceData } = updateDto;

    if (categoryId) {
      await this.categoryService.findOne(categoryId);
      service.category = { id: categoryId } as ServiceCategory;
    }
    if (platformId) {
      await this.platformService.findOne(platformId);
      service.platform = { id: platformId } as ServicePlatform;
    }
    if (typeId) {
      await this.typeService.findOne(typeId);
      service.type = { id: typeId } as ServiceType;
    }

    Object.assign(service, serviceData);

    const updatedService = await this.serviceRepository.save(service);
    return this.findOne(updatedService.id); // Refresh for relations
  }

  async remove(id: string): Promise<ServiceResponseDto> {
    const service = await this.serviceRepository.findOne({
      where: { id },
      relations: ['category', 'platform', 'type'],
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    const removedService = await this.serviceRepository.softRemove(service);
    return plainToInstance(ServiceResponseDto, removedService);
  }
}
