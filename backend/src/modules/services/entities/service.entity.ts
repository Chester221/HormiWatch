import { BaseUuidEntity } from 'src/common/entities/baseUuid.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { ServiceCategory } from './service-category.entity';
import { ServicePlatform } from './service-platform.entity';
import { ServiceType } from './service-type.entity';
import { Task } from 'src/modules/tasks/entities/task.entity';
import { User } from 'src/modules/users/entities/user.entity';

@Entity({ name: 'services' })
export class Service extends BaseUuidEntity {
  //entity attributes
  @Column({ type: 'varchar', length: 100, unique: true })
  @Index('idx_name_service')
  name: string;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'hourly_rate',
  })
  hourlyRate: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'icon' })
  icon: string | null;

  @Column({ type: 'varchar', length: 7, nullable: true, name: 'color' })
  color: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: User | null;

  // @Column({ type: 'varchar', length: 15, unique: true, nullable: true })
  // @Index('idx_redable_id_service')
  // redable_id: string;

  //entity relations
  @ManyToOne(() => ServiceCategory, (category) => category.service, {
    nullable: false,
  })
  @JoinColumn({ name: 'category_id' })
  category: ServiceCategory;

  @ManyToOne(() => ServicePlatform, (platform) => platform.service, {
    nullable: false,
  })
  @JoinColumn({ name: 'platform_id' })
  platform: ServicePlatform;

  @ManyToOne(() => ServiceType, (type) => type.service, {
    nullable: false,
  })
  @JoinColumn({ name: 'type_id' })
  type: ServiceType;

  @OneToMany(() => Task, (t) => t.service)
  tasks: Task[];
}
