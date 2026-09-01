import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Res,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MetricFilterDto } from './dto/metric-filter.dto';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Response } from 'express';

@ApiBearerAuth()
@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  // 1. Completed Projects by User
  @Get('completed-projects/:userId')
  @ApiOperation({ summary: 'Get number of projects completed by a user' })
  async getCompletedProjectsByUser(
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    const data = await this.metricsService.getCompletedProjectsByUser(userId);
    return { data };
  }

  // 2. Recent Projects
  @Get('recent-projects')
  @ApiOperation({ summary: 'Get recent projects with task metrics' })
  async getRecentProjects(
    @Query() pageOptions: MetricFilterDto,
    @Res() res: Response,
  ) {
    const result = await this.metricsService.getRecentProjects(pageOptions);
    if (!result.records || result.records.length === 0) {
      return res.status(HttpStatus.NO_CONTENT).send();
    }
    return res.status(HttpStatus.OK).json(result);
  }

  // 3. Project Metrics by ID
  // Note: Using Body in GET is non-standard but requested. NestJS allows it via @Body.
  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get specific project metrics in date range' })
  async getProjectMetricsById(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() dateRange: MetricFilterDto,
  ) {
    const data = await this.metricsService.getProjectMetricsById(
      projectId,
      dateRange,
    );
    return { data };
  }

  // 4. Recent Projects by User
  @Get('recent-projects-by-user/:userId')
  @ApiOperation({ summary: 'Get recent projects associated with a user' })
  async getRecentProjectsByUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() pageOptions: MetricFilterDto,
    @Res() res: Response,
  ) {
    const result = await this.metricsService.getRecentProjectsByUser(
      userId,
      pageOptions,
    );
    if (!result.records || result.records.length === 0) {
      return res.status(HttpStatus.NO_CONTENT).send();
    }
    return res.status(HttpStatus.OK).json(result);
  }

  // 5. Tasks Registered by Technician
  @Get('registered-tasks/:userId')
  @ApiOperation({ summary: 'Get total tasks registered by a technician' })
  async getRegisteredTasksByTechnician(
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    const data =
      await this.metricsService.getRegisteredTasksByTechnician(userId);
    return { data };
  }

  // 6. Total Task Time by User
  @Get('total-task-time/:userId')
  @ApiOperation({ summary: 'Get total task time factor sum for a user' })
  async getTotalTaskTimeByUser(@Param('userId', ParseUUIDPipe) userId: string) {
    const data = await this.metricsService.getTotalTaskTimeByUser(userId);
    return { data };
  }

  // 7. Tasks by Technician in Project
  @Get('tasks-by-technician-project/:projectId')
  @ApiOperation({
    summary: 'Get breakdown of tasks and hours by technician in a project',
  })
  async getTasksByTechnicianInProject(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() pageOptions: MetricFilterDto,
  ) {
    const data = await this.metricsService.getTasksByTechnicianInProject(
      projectId,
      pageOptions,
    );
    return { data };
  }
}
