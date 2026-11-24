import { ApiProperty } from '@nestjs/swagger';

/**
 * Métricas del módulo de usuarios, calculadas en la base de datos.
 * `inactive` = cuenta activa sin conexión en USER_INACTIVITY_DAYS (30 por defecto).
 */
export class UserStatsDto {
  @ApiProperty({ description: 'Total de usuarios vigentes dentro del scope' })
  total: number;

  @ApiProperty({ description: 'Usuarios con isActive = true' })
  active: number;

  @ApiProperty({ description: 'Usuarios activos sin conexión reciente' })
  inactive: number;

  @ApiProperty({ description: 'Usuarios con isActive = false' })
  suspended: number;

  @ApiProperty({ description: 'Usuarios con rol Admin' })
  admins: number;

  @ApiProperty({ description: 'Usuarios con rol Manager' })
  managers: number;

  @ApiProperty({ description: 'Usuarios con rol Technician o Employee' })
  technicians: number;

  @ApiProperty({ description: 'Usuarios con rol Leader' })
  leaders: number;

  @ApiProperty({ description: 'Usuarios con cualquier otro rol' })
  other: number;

  @ApiProperty({ description: 'Momento en que se generaron las métricas' })
  generatedAt: string;

  constructor(partial: Partial<UserStatsDto>) {
    Object.assign(this, partial);
  }
}
