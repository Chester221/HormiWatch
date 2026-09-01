import { BaseUuidEntity } from 'src/common/entities/baseUuid.entity';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { ProjectStatus } from '../enums/project-status.enum';
import { User } from 'src/modules/users/entities/user.entity';
import { CustomerContact } from 'src/modules/customers/entities/customer_contact.entity';
import { Task } from 'src/modules/tasks/entities/task.entity';
import { TemporalPlainDateTransformer } from 'src/common/transform/temporal.transformer';
import { Temporal } from 'temporal-polyfill';

@Entity({ name: 'projects' })
export class Project extends BaseUuidEntity {
  // entity attributes
  @Column({ type: 'varchar', length: 100, nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'decimal',
    name: 'hourly_rate',
    precision: 13,
    scale: 4,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  hourlyRate: number;

  @Column({ type: 'enum', enum: ProjectStatus, nullable: true })
  status: ProjectStatus;

  @Column({ type: 'integer', name: 'pool_hours', default: 0 })
  poolHours: number;

  /**
   * Calculated property: Sum of duration of all assigned tasks.
   * Note: Requires 'tasks' relation to be loaded.
   */
  get poolHoursWorked(): number {
    if (!this.tasks) return 0;
    return this.tasks
      .filter((t) => t.status === 'COMPLETED')
      .reduce((total, task) => total + (task.durationInHours || 0), 0);
  }

  @Column({
    type: 'date',
    name: 'start_date',
    nullable: false,
    transformer: TemporalPlainDateTransformer,
  })
  startDate: Temporal.PlainDate;

  @Column({
    type: 'date',
    name: 'end_date',
    nullable: false,
    transformer: TemporalPlainDateTransformer,
  })
  endDate: Temporal.PlainDate;

  //entity relations
  @ManyToOne(() => User, (u) => u.leaderProjects, {
    nullable: false,
  })
  @JoinColumn({ name: 'project_leader_id' })
  projectLeader: User;

  @ManyToMany(() => User, (u) => u.assignedProjects)
  @JoinTable({
    name: 'assigned_technicians',
    joinColumn: { name: 'project_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  technicians: User[];

  @ManyToOne(() => CustomerContact, (cc) => cc.projects, {
    nullable: false,
  })
  @JoinColumn({ name: 'customer_contact_id' })
  customerContact: CustomerContact;

  @OneToMany(() => Task, (t) => t.project)
  tasks: Task[];
}
