import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { CreateAuditDto } from './dto/create-audit.dto';
import { UpdateAuditDto } from './dto/update-audit.dto';

@ApiBearerAuth()
@ApiTags('Audit')
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Post()
  @ApiOperation({ summary: 'Create an audit log' })
  @ApiResponse({ status: 201, description: 'Audit log created.' })
  create(@Body() createAuditDto: CreateAuditDto) {
    return this.auditService.create(createAuditDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all audit logs' })
  @ApiResponse({ status: 200, description: 'List of audit logs.' })
  findAll() {
    return this.auditService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get audit log by ID' })
  @ApiResponse({ status: 200, description: 'The audit log.' })
  @ApiResponse({ status: 404, description: 'Audit log not found.' })
  findOne(@Param('id') id: string) {
    return this.auditService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update audit log' })
  @ApiResponse({ status: 200, description: 'Audit log updated.' })
  update(@Param('id') id: string, @Body() updateAuditDto: UpdateAuditDto) {
    return this.auditService.update(+id, updateAuditDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete audit log' })
  @ApiResponse({ status: 200, description: 'Audit log deleted.' })
  remove(@Param('id') id: string) {
    return this.auditService.remove(+id);
  }
}
