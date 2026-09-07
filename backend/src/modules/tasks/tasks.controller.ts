import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FilterTaskDto } from './dto/filter-task.dto';
import { Task } from './entities/task.entity';
import { PageDto } from '../../common/pagination/pagination.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { SkipAuth } from '../auth/decorator/skipAuth.decorator';

@ApiBearerAuth()
@ApiTags('Tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({
    status: 201,
    description: 'The task has been successfully created.',
    type: [TaskResponseDto],
  })
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks with filters and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Return all tasks.',
    type: PageDto,
  })
  findAll(@Query() filterDto: FilterTaskDto) {
    return this.tasksService.findAll(filterDto);
  }

  @Get('statuses')
  @ApiOperation({ summary: 'Get all possible task statuses' })
  @ApiResponse({
    status: 200,
    description: 'Return all possible task statuses.',
    type: [String],
  })
  @SkipAuth()
  getStatuses() {
    return this.tasksService.getTaskStatuses();
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiResponse({
    status: 200,
    description: 'The task has been successfully updated.',
    type: Task,
  })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  @ApiResponse({
    status: 200,
    description: 'The task has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.remove(id);
  }
}
