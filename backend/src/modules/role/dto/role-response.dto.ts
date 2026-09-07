import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RoleResponseDto {
  @ApiProperty({ description: 'The unique identifier of the role' })
  @Expose()
  id: string;

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;

  @Exclude()
  deleteAt: Date;

  @ApiProperty({ description: 'The name of the role' })
  @Expose()
  name: string;

  @ApiProperty({ description: 'The description of the role' })
  @Expose()
  description: string;
}
