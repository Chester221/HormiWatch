import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { HolidaysService } from '../services/holidays.service';
import { CreateHolidayDto } from '../dto/create-holiday.dto';
import { UpdateHolidayDto } from '../dto/update-holiday.dto';

import { HolidayPageOptionsDto } from '../dto/holiday-page-options.dto';
import { HolidayResponseDto } from '../dto/holiday-response.dto';
import { PageDto } from '../../../common/pagination/pagination.dto';

@ApiBearerAuth()
@ApiTags('Holidays')
@Controller('holidays')
export class HolidaysController {
  constructor(private readonly holidaysService: HolidaysService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new holiday' })
  @ApiResponse({
    status: 201,
    description: 'Holiday created successfully',
    type: HolidayResponseDto,
  })
  @ApiResponse({ status: 406, description: 'Duplicate date' }) // As per doc
  create(@Body() createHolidayDto: CreateHolidayDto) {
    return this.holidaysService.create(createHolidayDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all holidays with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of holidays',
    type: PageDto,
  })
  @ApiResponse({ status: 404, description: 'No holidays found' })
  findAll(@Query() query: HolidayPageOptionsDto) {
    return this.holidaysService.findAll(query);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a holiday' })
  @ApiResponse({
    status: 200,
    description: 'Holiday updated successfully',
    type: HolidayResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Holiday not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateHolidayDto: UpdateHolidayDto,
  ) {
    return this.holidaysService.update(id, updateHolidayDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a holiday' })
  @ApiResponse({ status: 200, description: 'Holiday deleted successfully' })
  @ApiResponse({ status: 404, description: 'Holiday not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.holidaysService.remove(id);
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sync holidays with Google Calendar' })
  @ApiResponse({ status: 201, description: 'Synchronization completed' })
  sync() {
    return this.holidaysService.syncWithGoogle();
  }
}
