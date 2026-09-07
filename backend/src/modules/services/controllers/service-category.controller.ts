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
import { ServiceCategoryService } from '../services/service-category.service'; // Corrected import path
import { CreateServiceCategoryDto } from '../dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from '../dto/update-service-category.dto';
import { ServiceCategoryResponseDto } from '../dto/service-category-response.dto';

import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Service Categories')
@Controller('services/categories')
export class ServiceCategoryController {
  constructor(private readonly categoryService: ServiceCategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new service category' })
  async create(
    @Body() createDto: CreateServiceCategoryDto,
  ): Promise<ServiceCategoryResponseDto> {
    return this.categoryService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Find all service categories' })
  async findAll(): Promise<ServiceCategoryResponseDto[]> {
    return this.categoryService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a service category by ID' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ServiceCategoryResponseDto> {
    return this.categoryService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a service category by ID' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateServiceCategoryDto,
  ): Promise<ServiceCategoryResponseDto> {
    return this.categoryService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a service category by ID' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ServiceCategoryResponseDto> {
    return this.categoryService.remove(id);
  }
}
