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
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ServicesService } from '../services/services.service';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { ServiceResponseDto } from '../dto/service-response.dto';
import { ServicePageOptionsDto } from '../dto/service-page-options.dto';
import { PageDto } from '../../../common/pagination/pagination.dto';
import { IActiveUser } from '../../auth/interface/payload.interface';
import { RolesGuard } from '../../auth/guard/authorization.guard';
import { Roles } from '../../auth/decorator/roles.decorator';
import { Role } from '../../auth/enums/roles.enum';

import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user?: IActiveUser;
}

@ApiBearerAuth()
@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new service' })
  @UseGuards(RolesGuard)
  @Roles(Role.admin, Role.manager)
  async create(
    @Body() createDto: CreateServiceDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ServiceResponseDto> {
    const user = req.user;
    return this.servicesService.create(createDto, user?.userId);
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
  @UseGuards(RolesGuard)
  @Roles(Role.admin, Role.manager)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateServiceDto,
  ): Promise<ServiceResponseDto> {
    return this.servicesService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a service by ID' })
  @UseGuards(RolesGuard)
  @Roles(Role.admin, Role.manager)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ServiceResponseDto> {
    return this.servicesService.remove(id);
  }
}
