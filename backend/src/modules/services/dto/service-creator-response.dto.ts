import { Exclude, Expose, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Profile } from 'src/modules/users/entities/profile.entity';

@Exclude()
export class ServiceCreatorResponseDto {
  @ApiProperty({ description: 'ID del usuario que creó el servicio' })
  @Expose()
  id: string;

  @ApiPropertyOptional({
    description: 'Email del usuario que creó el servicio',
  })
  @Expose()
  email?: string;

  @ApiPropertyOptional({
    description: 'Nombre completo del usuario que creó el servicio',
  })
  @Expose()
  @Transform(({ obj }: { obj?: { profile?: Profile } }) => {
    const profile = obj?.profile;
    if (!profile) return null;
    const composed = `${profile.name || ''} ${profile.lastName || ''}`.trim();
    return profile.full_name?.trim() || composed || null;
  })
  name: string | null;
}
