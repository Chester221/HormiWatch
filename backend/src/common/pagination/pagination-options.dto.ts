import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

enum Order {
  ASC = 'ASC',
  DESC = 'DESC',
}
export class PageOptionsDto {
  @ApiPropertyOptional({
    description: 'Order direction (ASC or DESC)',
    enum: Order,
    default: Order.ASC,
  })
  @IsEnum(Order)
  @IsOptional()
  readonly order?: Order = Order.ASC;

  @ApiPropertyOptional({
    description: 'Current page number',
    minimum: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  readonly page: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  readonly take: number = 10;

  @Expose()
  @Exclude()
  get skip(): number {
    return (this.page - 1) * this.take;
  }

  @ApiPropertyOptional({
    description: 'Search query string',
    maxLength: 255,
  })
  @IsString()
  @Transform(({ value }: { value: string }) => value?.trim())
  @MaxLength(255)
  @IsOptional()
  readonly q?: string;
}
