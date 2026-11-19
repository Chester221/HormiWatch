import { BaseUuidEntity } from 'src/common/entities/baseUuid.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { CustomerContact } from './customer_contact.entity';

@Entity({ name: 'customers' })
export class Customer extends BaseUuidEntity {
  @Column({ type: 'varchar' })
  name: string;

  /** RIF venezolano: J-12345678-9 / G-12345678-9. Nullable en BD (datos
   *  legacy); obligatorio a nivel de DTO y formulario. */
  @Column({ type: 'varchar', length: 12, nullable: true })
  rif: string;

  @Column({ type: 'varchar', nullable: true })
  country: string;

  @Column({ type: 'varchar', nullable: true })
  city: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  /** Teléfono de empresa, separado en 3 columnas. phone_country incluye
   *  el signo '+' (ej. '+58'). */
  @Column({ type: 'varchar', name: 'phone_country', length: 4, nullable: true })
  phone_country: string;

  @Column({ type: 'varchar', name: 'phone_area', length: 6, nullable: true })
  phone_area: string;

  @Column({ type: 'varchar', name: 'phone_number', length: 15, nullable: true })
  phone_number: string;

  @OneToMany(() => CustomerContact, (contact) => contact.customer)
  contacts: CustomerContact[];
}
