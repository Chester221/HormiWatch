import { BaseUuidEntity } from 'src/common/entities/baseUuid.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { NotificationCategory } from '../enums/notification-category.enum';
import { NotificationLevel } from '../enums/notification-level.enum';

@Entity({ name: 'notifications' })
@Index(['user', 'readAt'])
export class Notification extends BaseUuidEntity {
  @Column({ type: 'uuid', name: 'user_id', nullable: false })
  userId: string;

  @Column({ type: 'enum', enum: NotificationCategory, nullable: false })
  category: NotificationCategory;

  @Column({
    type: 'enum',
    enum: NotificationLevel,
    default: NotificationLevel.INFO,
    nullable: false,
  })
  level: NotificationLevel;

  @Column({ type: 'varchar', length: 200, nullable: false })
  title: string;

  @Column({ type: 'text', nullable: false })
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, any> | null;

  /** Clave única por usuario para evitar duplicados */
  @Column({ type: 'varchar', length: 200, name: 'event_key', nullable: true })
  eventKey: string | null;

  @Column({ type: 'timestamp', name: 'read_at', nullable: true })
  readAt: Date | null;

  /** false = pendiente de incluir en el resumen diario (8:00 AM) */
  @Column({ type: 'boolean', name: 'digest_sent', default: false })
  digestSent: boolean;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
