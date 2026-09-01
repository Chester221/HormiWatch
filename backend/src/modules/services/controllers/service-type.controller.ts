import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ServiceTypeService } from '../services/service-type.service';
import { CreateServiceTypeDto } from '../dto/create-service-type.dto';
import { UpdateServiceTypeDto } from '../dto/update-service-type.dto';
import { ServiceTypeResponseDto } from '../dto/service-type-response.dto';

import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Service Types')
@Controller('services/types')
export class ServiceTypeController {
  constructor(private readonly typeService: ServiceTypeService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new service type' })
  async create(
    @Body() createDto: CreateServiceTypeDto,
  ): Promise<ServiceTypeResponseDto> {
    return this.typeService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Find all service types' })
  async findAll(): Promise<ServiceTypeResponseDto[]> {
    return this.typeService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a service type by ID' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ServiceTypeResponseDto> {
    return this.typeService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a service type by ID' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateServiceTypeDto,
  ): Promise<ServiceTypeResponseDto> {
    return this.typeService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a service type by ID' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ServiceTypeResponseDto> {
    return this.typeService.remove(id);
  }
}
