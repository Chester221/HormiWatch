import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PageOptionsDto } from '../../../common/pagination/pagination-options.dto';

export class FindAllCustomersQueryDto extends PageOptionsDto {
  @ApiProperty({
    description: 'Text to search in customer names',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'Flag to include soft-deleted records in the result',
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  withDeleted?: boolean;

  @ApiProperty({
    description: 'Flag to include the list of contacts for each customer',
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  includeContacts?: boolean;
}
