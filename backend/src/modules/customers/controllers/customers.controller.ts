import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PageDto } from 'src/common/pagination/pagination.dto';
import { CustomersService } from '../services/customers.service';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';
import { FindAllCustomersQueryDto } from '../dto/find-all-customers-query.dto';
import { SkipAuth } from 'src/modules/auth/decorator/skipAuth.decorator';

@ApiBearerAuth()
@ApiTags('Customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  // --- Endpoints para Customer ---
  @Post()
  @SkipAuth()
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({ status: 201, description: 'Customer created successfully.' })
  @ApiBody({ type: CreateCustomerDto })
  createCustomer(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.createCustomer(createCustomerDto);
  }

  @Get('dashboard')
  @SkipAuth()
  @ApiOperation({ summary: 'Get customers dashboard data' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        totalCustomers: { type: 'number' },
        totalContacts: { type: 'number' },
      },
    },
  })
  getDashboard() {
    return this.customersService.getDashboardData();
  }

  @Get()
  @SkipAuth()
  @ApiOperation({ summary: 'Get all customers with optional filtering' })
  @ApiResponse({ status: 200, description: 'List of customers.' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name' })
  @ApiQuery({
    name: 'withDeleted',
    required: false,
    type: Boolean,
    description: 'Include soft-deleted customers',
  })
  @ApiQuery({
    name: 'includeContacts',
    required: false,
    type: Boolean,
    description: 'Include customer contacts',
  })
  findAllCustomers(@Query() query: FindAllCustomersQueryDto) {
    return this.customersService.findAllCustomers(query);
  }

  @Get(':id')
  @SkipAuth()
  @ApiOperation({ summary: 'Get a customer by ID' })
  @ApiResponse({ status: 200, description: 'The customer details.' })
  @ApiResponse({ status: 404, description: 'Customer not found.' })
  @ApiParam({ name: 'id', description: 'UUID of the customer' })
  findCustomerById(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.findCustomerById(id);
  }

  @Patch(':id')
  @SkipAuth()
  @ApiOperation({ summary: 'Update a customer' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully.' })
  @ApiResponse({ status: 404, description: 'Customer not found.' })
  @ApiParam({ name: 'id', description: 'UUID of the customer' })
  @ApiBody({ type: UpdateCustomerDto })
  updateCustomer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.updateCustomer(id, updateCustomerDto);
  }

  @Delete(':id')
  @SkipAuth()
  @ApiOperation({ summary: 'Soft delete a customer' })
  @ApiResponse({ status: 200, description: 'Customer deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Customer not found.' })
  @ApiParam({ name: 'id', description: 'UUID of the customer' })
  @HttpCode(HttpStatus.OK)
  softDeleteCustomer(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.softDeleteCustomer(id);
  }
}
