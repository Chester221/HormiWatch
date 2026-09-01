import { PartialType } from '@nestjs/swagger';
import { CreateCustomerContactDto } from './create-customer_contact.dto';

export class UpdateCustomerContactDto extends PartialType(
  CreateCustomerContactDto,
) {}
