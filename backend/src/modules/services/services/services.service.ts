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
import { User } from 'src/modules/users/entities/user.entity';
import { pickServiceColor } from '../service-color';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    private readonly categoryService: ServiceCategoryService,
    private readonly platformService: ServicePlatformService,
    private readonly typeService: ServiceTypeService,
  ) {}

  async create(
    createDto: CreateServiceDto,
    createdByUserId?: string,
  ): Promise<ServiceResponseDto> {
    const { categoryId, ...serviceData } = createDto;

    await this.categoryService.findOne(categoryId);

    // El cliente no envía plataforma/tipo; se asigna el valor por defecto "General"
    const platform = await this.findDefaultPlatform();
    const type = await this.findDefaultType();

    const service = this.serviceRepository.create({
      ...serviceData,
      hourlyRate:
        serviceData.hourlyRate != null
          ? String(serviceData.hourlyRate)
          : undefined,
      color: serviceData.color ?? pickServiceColor(serviceData.name),
      createdBy: createdByUserId ? ({ id: createdByUserId } as User) : null,
      category: { id: categoryId },
      platform: { id: platform.id },
      type: { id: type.id },
    });

    const savedService = await this.serviceRepository.save(service);

    // We need to return full relations. save() might not return them populated.
    return this.findOne(savedService.id);
  }

  private async findDefaultPlatform(): Promise<{ id: string }> {
    const platforms = await this.platformService.findAll();
    const platform =
      platforms.find((p) => p.name === 'General') || platforms[0];
    if (!platform) {
      throw new NotFoundException('No hay plataformas de servicio configuradas');
    }
    return { id: platform.id };
  }

  private async findDefaultType(): Promise<{ id: string }> {
    const types = await this.typeService.findAll();
    const type = types.find((t) => t.name === 'General') || types[0];
    if (!type) {
      throw new NotFoundException('No hay tipos de servicio configurados');
    }
    return { id: type.id };
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
      .leftJoin('service.tasks', 'tasks') // Solo para filtros; no cargar tareas (evita transformar Temporal.Instant)
      .leftJoinAndSelect('service.createdBy', 'createdBy')
      .leftJoinAndSelect('createdBy.profile', 'createdByProfile');

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
      relations: ['category', 'platform', 'type', 'createdBy'],
    });

    if (!service) {
      throw new NotFoundException(`Servicio con ID ${id} no encontrado`);
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
      throw new NotFoundException(`Servicio con ID ${id} no encontrado`);
    }

    const { categoryId, ...serviceData } = updateDto;

    if (categoryId) {
      await this.categoryService.findOne(categoryId);
      service.category = { id: categoryId } as ServiceCategory;
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
      throw new NotFoundException(`Servicio con ID ${id} no encontrado`);
    }

    const removedService = await this.serviceRepository.softRemove(service);
    return plainToInstance(ServiceResponseDto, removedService);
  }
}
