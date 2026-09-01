import { BaseUuidEntity } from 'src/common/entities/baseUuid.entity';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { Service } from './service.entity';

@Entity({ name: 'services_category' })
export class ServiceCategory extends BaseUuidEntity {
  //entity attributes
  @Column({ type: 'varchar', length: 100, unique: true })
  @Index('idx_category_service')
  name: string;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  //entity relations
  @OneToMany(() => Service, (s) => s.category)
  service: Service[];
}
