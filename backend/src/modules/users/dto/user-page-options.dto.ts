import { PageOptionsDto } from 'src/common/pagination/pagination-options.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { Transform, Type } from 'class-transformer';

import { Role } from 'src/modules/auth/enums/roles.enum';

export enum UserOrderBy {
  EMAIL = 'email',
  NAME = 'name',
  LAST_NAME = 'lastName',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  ROLE = 'role',
}

export class UserPageOptionsDto extends PageOptionsDto {
  @ApiPropertyOptional({
    enum: UserOrderBy,
    default: UserOrderBy.NAME,
    description: 'Field to order by',
  })
  @IsEnum(UserOrderBy)
  @IsOptional()
  readonly by: UserOrderBy = UserOrderBy.NAME;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: string | boolean }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  readonly isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Include deleted users',
    default: false,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  readonly includeDeleted: boolean = false;

  @ApiPropertyOptional({
    description: 'Filter by role name (optional)',
    enum: Role,
  })
  @IsOptional()
  @IsEnum(Role)
  readonly roleName?: Role;
}
