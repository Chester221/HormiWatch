import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PageDto } from '../../common/pagination/pagination.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectPageOptionsDto } from './dto/project-page-options.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';
import { RolesGuard } from '../auth/guard/authorization.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { Role } from '../auth/enums/roles.enum';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import type { IActiveUser } from '../auth/interface/payload.interface';

@Controller('projects')
@ApiTags('Projects')
@ApiBearerAuth()
@ApiExtraModels(ProjectResponseDto, PageDto)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @UseGuards(RolesGuard)
  @Roles(Role.admin, Role.manager)
  @ApiOkResponse({ type: ProjectResponseDto })
  async create(
    @Body() createProjectDto: CreateProjectDto,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects with pagination and filters' })
  @ApiOkResponse({ type: PageDto })
  async findAll(
    @Query() pageOptionsDto: ProjectPageOptionsDto,
    @CurrentUser() user: IActiveUser,
  ): Promise<PageDto<ProjectResponseDto>> {
    return this.projectsService.findAll(pageOptionsDto, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project by ID' })
  @ApiOkResponse({ type: ProjectResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: IActiveUser,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project' })
  @UseGuards(RolesGuard)
  @Roles(Role.admin, Role.manager)
  @ApiOkResponse({ type: ProjectResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a project' })
  @UseGuards(RolesGuard)
  @Roles(Role.admin, Role.manager)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.projectsService.remove(id);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted project' })
  @UseGuards(RolesGuard)
  @Roles(Role.admin, Role.manager)
  @ApiOkResponse({ type: ProjectResponseDto })
  async restore(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.restore(id);
  }
}
