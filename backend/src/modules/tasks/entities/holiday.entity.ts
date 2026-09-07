import { BaseUuidEntity } from 'src/common/entities/baseUuid.entity';
import { Column, Entity } from 'typeorm';

@Entity('holidays')
export class Holiday extends BaseUuidEntity {
  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ nullable: true, type: 'varchar', length: 255 })
  description: string;

  @Column({ type: 'boolean', name: 'is_working_day', default: true })
  isWorkingDay: boolean;
}
