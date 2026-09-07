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
import { ServicePlatformService } from '../services/service-platform.service';
import { CreateServicePlatformDto } from '../dto/create-service-platform.dto';
import { UpdateServicePlatformDto } from '../dto/update-service-platform.dto';
import { ServicePlatformResponseDto } from '../dto/service-platform-response.dto';

import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Service Platforms')
@Controller('services/platforms')
export class ServicePlatformController {
  constructor(private readonly platformService: ServicePlatformService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new service platform' })
  async create(
    @Body() createDto: CreateServicePlatformDto,
  ): Promise<ServicePlatformResponseDto> {
    return this.platformService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Find all service platforms' })
  async findAll(): Promise<ServicePlatformResponseDto[]> {
    return this.platformService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a service platform by ID' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ServicePlatformResponseDto> {
    return this.platformService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a service platform by ID' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateServicePlatformDto,
  ): Promise<ServicePlatformResponseDto> {
    return this.platformService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a service platform by ID' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ServicePlatformResponseDto> {
    return this.platformService.remove(id);
  }
}
