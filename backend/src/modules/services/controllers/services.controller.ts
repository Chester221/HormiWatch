import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ServicesService } from '../services/services.service';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { ServiceResponseDto } from '../dto/service-response.dto';
import { ServicePageOptionsDto } from '../dto/service-page-options.dto';
import { PageDto } from '../../../common/pagination/pagination.dto';

import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new service' })
  async create(
    @Body() createDto: CreateServiceDto,
  ): Promise<ServiceResponseDto> {
    return this.servicesService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Find all services' })
  async findAll(
    @Query() pageOptionsDto: ServicePageOptionsDto,
  ): Promise<PageDto<ServiceResponseDto>> {
    return this.servicesService.findAll(pageOptionsDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a service by ID' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ServiceResponseDto> {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a service by ID' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateServiceDto,
  ): Promise<ServiceResponseDto> {
    return this.servicesService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a service by ID' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ServiceResponseDto> {
    return this.servicesService.remove(id);
  }
}
