import { BaseUuidEntity } from 'src/common/entities/baseUuid.entity';
import { Column, Entity } from 'typeorm';

enum actionAudit {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

@Entity('audit_logs')
export class Audit extends BaseUuidEntity {
  @Column({ type: 'enum', enum: ['CREATE', 'UPDATE', 'DELETE'] })
  action: actionAudit;

  @Column({ name: 'affected_entity' })
  affectedEntity: string; // Ej: 'Tarea', 'Proyecto'

  // Datos del actor (Snapshot)
  @Column({ name: 'user_name', nullable: true, length: 70 })
  userName: string;

  @Column('json', { name: 'old_values', nullable: true })
  oldValues: Record<string, any>; // { estado: 'pendiente', name: 'test' }

  @Column('json', { name: 'new_values', nullable: true })
  newValues: Record<string, any>; // { estado: 'finalizado', name: 'test2' }
}
