import { BaseUuidEntity } from 'src/common/entities/baseUuid.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Column, Entity, Index, OneToMany } from 'typeorm';

@Entity('roles')
export class Role extends BaseUuidEntity {
  // entity attributes
  @Column({ type: 'varchar', length: 15, unique: true })
  @Index('idx_role_name')
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  description: string;

  //entity relations
  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
