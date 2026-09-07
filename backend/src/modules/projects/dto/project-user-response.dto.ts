import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class ProjectUserResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  lastName: string;

  @ApiProperty()
  @Expose()
  role: string;

  @ApiProperty()
  @Expose()
  position: string;

  @ApiProperty()
  @Expose()
  idCard: string;

  @ApiProperty({ description: 'Profile picture URL', nullable: true })
  @Expose()
  profilePicture: string;

  @ApiProperty()
  @Expose()
  @Type(() => Object)
  metadata: Record<string, any>;
}
