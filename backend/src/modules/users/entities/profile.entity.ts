import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { UtcDateTransformer } from 'src/common/transformers/utc-date.transformer';

@Entity({ name: 'users_profiles' })
export class Profile {
  @PrimaryColumn('uuid')
  id: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    transformer: UtcDateTransformer,
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    transformer: UtcDateTransformer,
  })
  updatedAt: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamp',
    nullable: true,
    transformer: UtcDateTransformer,
  })
  deleteAt: Date;

  // entity attributes
  @Column({ type: 'varchar', length: 50, name: 'name' })
  name: string;

  @Column({ type: 'varchar', length: 50, name: 'last_name', nullable: true })
  lastName: string;

  @Column({ type: 'varchar', length: 16, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  idCard: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  position: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  deparment: string;

  @Column({ type: 'varchar', nullable: true })
  profilePicture: string;

  //entity relations
  @OneToOne(() => User, (u) => u.profile, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
