import { BaseUuidEntity } from 'src/common/entities/baseUuid.entity';
import { Customer } from 'src/modules/customers/entities/customer.entity';
import { Project } from 'src/modules/projects/entities/project.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity({ name: 'customers_contacts' })
export class CustomerContact extends BaseUuidEntity {
  // entity attributes
  @Column({ type: 'varchar', name: 'name', length: 60, nullable: false })
  name: string;

  @Column({ type: 'varchar', name: 'last_name', length: 60, nullable: false })
  lastName: string;

  @Column({ type: 'varchar', name: 'id_card', length: 15, nullable: true })
  id_card: string;

  @Column({ type: 'varchar', name: 'position', length: 100, nullable: true })
  position: string;

  @Column({ type: 'varchar', name: 'phone', length: 16, nullable: true })
  phone: string;

  @Column({ type: 'varchar', name: 'email', length: 100, nullable: true })
  email: string;

  //entity relations
  @ManyToOne(() => Customer, (customer) => customer.contact, {
    nullable: true,
  })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @OneToMany(() => Project, (p) => p.customerContact)
  projects: Project[];
}
