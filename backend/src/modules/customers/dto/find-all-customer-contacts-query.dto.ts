import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PageOptionsDto } from '../../../common/pagination/pagination-options.dto';

export class FindAllCustomerContactsQueryDto extends PageOptionsDto {
  @ApiPropertyOptional({
    description:
      'Search by name, last name, email, or position (partial match)',
    example: 'manager',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Flag to include soft-deleted records in the result',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  withDeleted?: boolean;
}
