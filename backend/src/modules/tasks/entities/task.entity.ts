import { BaseUuidEntity } from 'src/common/entities/baseUuid.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { TaskStatus } from '../enums/task-status.enum';
import { User } from 'src/modules/users/entities/user.entity';
import { Project } from 'src/modules/projects/entities/project.entity';
import { Service } from 'src/modules/services/entities/service.entity';
import { TaskExecutionType } from '../enums/task-execution-type.enum';
import { TaskPriority } from '../enums/task-priority.enum';
import { TemporalInstantTransformer } from 'src/common/transform/temporal.transformer';
import { Temporal } from 'temporal-polyfill';

@Entity('tasks')
@Index(['project', 'startDateTime'])
@Index(['technician', 'startDateTime'])
@Index(['service', 'startDateTime'])
@Index(['status', 'startDateTime'])
@Index(['priority', 'startDateTime'])
@Index(['executionType', 'startDateTime'])
export class Task extends BaseUuidEntity {
  // entity attributes
  @Column({
    type: 'timestamp',
    name: 'start_datetime',
    nullable: false,
    transformer: TemporalInstantTransformer,
  })
  startDateTime: Temporal.Instant;

  @Column({
    type: 'timestamp',
    name: 'end_datetime',
    nullable: false,
    transformer: TemporalInstantTransformer,
  })
  endDateTime: Temporal.Instant;

  @Column({ type: 'enum', enum: TaskStatus, nullable: true })
  status: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskExecutionType,
    name: 'execution_type',
    nullable: true,
  })
  executionType: TaskExecutionType;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    name: 'priority',
    nullable: false,
  })
  priority: TaskPriority;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @Column({
    type: 'decimal',
    name: 'applied_hourly_rate',
    precision: 13,
    scale: 4,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  appliedHourlyRate: number;

  //entity relations
  @ManyToOne(() => User, (u) => u.technician_tasks, {
    nullable: false,
  })
  @JoinColumn({ name: 'technician_id' })
  technician: User;

  @ManyToOne(() => Project, (p) => p.tasks, {
    nullable: true,
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => Service, (s) => s.tasks, {
    nullable: false,
  })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  // Ejemplo de campo calculado (Virtual) usando la potencia de Temporal
  // Nota: Esto no se guarda en BD, es un getter de la clase
  get durationInHours(): number {
    if (!this.startDateTime || !this.endDateTime) return 0;

    // ¡Aquí está la magia de Temporal!
    // Cálculo preciso de duración sin matemáticas manuales de milisegundos
    const duration = this.startDateTime.until(this.endDateTime);

    // Retorna total de horas con decimales (ej: 2.5 horas)
    return duration.total({ unit: 'hours' });
  }
}