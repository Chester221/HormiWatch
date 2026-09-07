import { BaseUuidEntity } from 'src/common/entities/baseUuid.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { CustomerContact } from './customer_contact.entity';

@Entity({ name: 'customers' })
export class Customer extends BaseUuidEntity {
  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  ruc: string; 

  @Column({ type: 'varchar', nullable: true })
  country: string;

  @Column({ type: 'varchar', nullable: true })
  city: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @OneToMany(() => CustomerContact, (contact) => contact.customer)
  contacts: CustomerContact[];
}