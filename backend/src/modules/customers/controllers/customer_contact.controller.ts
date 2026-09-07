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
import { CustomerContactService } from '../services/customer_contact.service';
import { CreateCustomerContactDto } from '../dto/create-customer-contact.dto';
import { UpdateCustomerContactDto } from '../dto/update-customer-contact.dto';
import { FindAllCustomerContactsQueryDto } from '../dto/find-all-customer-contacts-query.dto';
import { SkipAuth } from 'src/modules/auth/decorator/skipAuth.decorator';

@ApiBearerAuth()
@ApiTags('Customer Contacts')
@Controller('customers/:customerId/contacts')
export class CustomerContactController {
  constructor(
    private readonly customerContactService: CustomerContactService,
  ) {}

  @Post()
  @SkipAuth()
  @ApiOperation({ summary: 'Create a new contact for a specific customer' })
  @ApiResponse({ status: 201, description: 'Contact created successfully.' })
  @ApiParam({ name: 'customerId', description: 'UUID of the customer' })
  @ApiBody({ type: CreateCustomerContactDto })
  create(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Body() createCustomerContactDto: CreateCustomerContactDto,
  ) {
    return this.customerContactService.create(
      customerId,
      createCustomerContactDto,
    );
  }

  @Get()
  @SkipAuth()
  @ApiOperation({ summary: 'Get all contacts for a specific customer' })
  @ApiResponse({ status: 200, description: 'List of contacts.' })
  @ApiParam({ name: 'customerId', description: 'UUID of the customer' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name, email, etc.',
  })
  @ApiQuery({
    name: 'withDeleted',
    required: false,
    type: Boolean,
    description: 'Include soft-deleted contacts',
  })
  findAll(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Query() query: FindAllCustomerContactsQueryDto,
  ) {
    return this.customerContactService.findAllByCustomer(customerId, query);
  }

  @Get(':id')
  @SkipAuth()
  @ApiOperation({ summary: 'Get a contact by ID' })
  @ApiResponse({ status: 200, description: 'The contact details.' })
  @ApiResponse({ status: 404, description: 'Contact not found.' })
  @ApiParam({ name: 'id', description: 'UUID of the contact' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.customerContactService.findOne(id);
  }

  @Patch(':id')
  @SkipAuth()
  @ApiOperation({ summary: 'Update a contact' })
  @ApiResponse({ status: 200, description: 'Contact updated successfully.' })
  @ApiParam({ name: 'id', description: 'UUID of the contact' })
  @ApiBody({ type: UpdateCustomerContactDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCustomerContactDto: UpdateCustomerContactDto,
  ) {
    return this.customerContactService.update(id, updateCustomerContactDto);
  }

  @Delete(':id')
  @SkipAuth()
  @ApiOperation({ summary: 'Soft delete a contact' })
  @ApiResponse({ status: 200, description: 'Contact deleted successfully.' })
  @ApiParam({ name: 'id', description: 'UUID of the contact' })
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.customerContactService.remove(id);
  }
}
