import { BaseUuidEntity } from 'src/common/entities/baseUuid.entity';
import { Role } from 'src/modules/role/entities/role.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Profile } from './profile.entity';
import { Project } from 'src/modules/projects/entities/project.entity';
import { Task } from 'src/modules/tasks/entities/task.entity';
import { UtcDateTransformer } from 'src/common/transformers/utc-date.transformer';

@Entity({ name: 'users' })
export class User extends BaseUuidEntity {
  // entity attributes
  @Column({ type: 'varchar' })
  password: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  @Index('idx_email')
  email: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  @Index('idx_is_actived_user')
  isActive: boolean;

  @Column({
    type: 'timestamp',
    nullable: true,
    transformer: UtcDateTransformer,
  })
  lastConnection: Date;

  @Column({ type: 'varchar', nullable: true })
  refreshToken: string;

  @Column({ type: 'varchar', nullable: true, name: 'auth_user_id' })
  authUserId: string;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  preferences: {
    tasks_view?: 'list' | 'calendar';
    projects_view?: 'grid' | 'table';
    tasks_filters?: {
      project?: string;
      status?: string;
    };
    dark_mode?: boolean;
  };

  // ✅ NOTA: createdAt y updatedAt YA ESTÁN en BaseUuidEntity
  // NO los declares aquí para evitar duplicación

  //entity relations
  @ManyToOne(() => Role, (rol) => rol.users, { nullable: false })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @OneToOne(() => Profile, (p) => p.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  profile: Profile;

  @OneToMany(() => Project, (p) => p.projectLeader)
  leaderProjects: Project[];

  @ManyToMany(() => Project, (p) => p.technicians)
  assignedProjects: Project[];

  @OneToMany(() => Task, (t) => t.technician)
  technician_tasks: Task[];
}