import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class GlobalSearchQueryDto {
  @ApiProperty({
    description: 'Término a buscar (mínimo 1 carácter)',
    example: 'a',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(1)
  @MaxLength(100)
  q: string;

  @ApiPropertyOptional({
    description: 'Máximo de resultados por categoría',
    default: 5,
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  limit: number = 5;
}
