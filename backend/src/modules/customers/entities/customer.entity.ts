import { BaseUuidEntity } from 'src/common/entities/baseUuid.entity';
import { CustomerContact } from 'src/modules/customers/entities/customer_contact.entity';
import { Column, Entity, OneToMany } from 'typeorm';

@Entity({ name: 'customers' })
export class Customer extends BaseUuidEntity {
  // entity attributes
  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 60, nullable: true })
  country: string;

  @Column({ type: 'varchar', length: 60, nullable: true })
  city: string;

  @Column({ type: 'varchar', nullable: true })
  address: string;

  //entity relations
  @OneToMany(() => CustomerContact, (contact) => contact.customer)
  contact: CustomerContact[];
}
