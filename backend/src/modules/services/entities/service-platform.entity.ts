import { BaseUuidEntity } from 'src/common/entities/baseUuid.entity';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { Service } from './service.entity';

@Entity({ name: 'services_plaftorms' })
export class ServicePlatform extends BaseUuidEntity {
  //entity attributes
  @Column({ type: 'varchar', length: 100, unique: true })
  @Index('idx_platform_service')
  name: string;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  //entity relations
  @OneToMany(() => Service, (s) => s.platform)
  service: Service[];
}
