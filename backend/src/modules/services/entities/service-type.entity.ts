import { BaseUuidEntity } from 'src/common/entities/baseUuid.entity';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { Service } from './service.entity';

@Entity({ name: 'services_types' })
export class ServiceType extends BaseUuidEntity {
  //entity attributes
  @Column({ type: 'varchar', length: 100, unique: true })
  @Index('idx_type_service')
  name: string;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  //entity relations
  @OneToMany(() => Service, (s) => s.type)
  service: Service[];
}
