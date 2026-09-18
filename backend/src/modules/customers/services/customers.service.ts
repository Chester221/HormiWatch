import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Customer } from '../entities/customer.entity';
import { CustomerContact } from '../entities/customer_contact.entity';

import { CreateCustomerDto } from '../dto/create-customer.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';
import { FindAllCustomersQueryDto } from '../dto/find-all-customers-query.dto';
import { PageDto } from 'src/common/pagination/pagination.dto';
import { PageMeta } from 'src/common/pagination/metadata';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(CustomerContact)
    private readonly customerContactRepository: Repository<CustomerContact>,
  ) {}

  async getDashboardData() {
    const totalCustomers = await this.customerRepository.count();
    const totalContacts = await this.customerContactRepository.count();

    return {
      totalCustomers,
      totalContacts,
    };
  }

  async createCustomer(
    createCustomerDto: CreateCustomerDto,
  ): Promise<Customer> {
    const { contacts, ...customerData } = createCustomerDto;

    const result = await this.customerRepository
      .createQueryBuilder()
      .insert()
      .into(Customer)
      .values(customerData)
      .execute();

    const id = result.identifiers[0].id as string;

    if (contacts && contacts.length > 0) {
      const contactEntities = contacts.map((contact) =>
        this.customerContactRepository.create({
          ...contact,
          customer: { id: id },
        })
      );
      await this.customerContactRepository.save(contactEntities);
    }

    return this.findCustomerById(id);
  }

  async findAllCustomers(
    query: FindAllCustomersQueryDto,
  ): Promise<PageDto<Customer>> {
    const { search, withDeleted, includeContacts, skip, take } = query;

    const qb = this.customerRepository.createQueryBuilder('customer');

    if (includeContacts) {
      qb.leftJoinAndSelect('customer.contacts', 'contact');
    }

    // ✅ FILTRAR ELIMINADOS (solo mostrar activos)
    if (!withDeleted) {
      qb.andWhere('customer.deleted_at IS NULL');
    }

    if (search) {
      const term = `%${search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(customer.name) LIKE :term OR LOWER(customer.city) LIKE :term OR LOWER(customer.country) LIKE :term)',
        { term },
      );
    }

    if (withDeleted) {
      qb.withDeleted();
    }

    qb.skip(skip);
    qb.take(take);
    qb.orderBy('customer.createdAt', 'DESC');

    const [entities, itemCount] = await qb.getManyAndCount();
    const pageMetaDto = new PageMeta(query, itemCount);

    return new PageDto(entities, pageMetaDto);
  }

  async findCustomerById(id: string): Promise<Customer> {
    const qb = this.customerRepository.createQueryBuilder('customer');

    qb.leftJoinAndSelect('customer.contacts', 'contact');
    qb.where('customer.id = :id', { id });
    qb.andWhere('customer.deleted_at IS NULL');
    qb.cache(true);

    const customer = await qb.getOne();

    if (!customer) {
      throw new NotFoundException(`Customer with ID "${id}" not found`);
    }
    return customer;
  }

  async updateCustomer(
    id: string,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<Customer> {
    const { contacts, ...customerData } = updateCustomerDto;

    const result = await this.customerRepository
      .createQueryBuilder()
      .update(Customer)
      .set(customerData)
      .where('id = :id', { id })
      .andWhere('deleted_at IS NULL')
      .execute();

    if (result.affected === 0) {
      throw new NotFoundException(`Customer with ID "${id}" not found`);
    }

    if (contacts !== undefined) {
      await this.customerContactRepository.delete({ customer: { id } });

      if (contacts.length > 0) {
        const contactEntities = contacts.map((contact) =>
          this.customerContactRepository.create({
            ...contact,
            customer: { id: id },
          })
        );
        await this.customerContactRepository.save(contactEntities);
      }
    }

    return this.findCustomerById(id);
  }

  // ✅ HARD DELETE: Eliminación permanente.
  // Al igual que con los usuarios, solo las referencias ACTIVAS bloquean:
  // los proyectos soft-deleted que apuntan a los contactos se DESVINCULAN
  // (customer_contact_id → NULL) para que el DELETE no viole la FK 23503.
  async deleteCustomer(id: string) {
    // 1) Referencias ACTIVAS (proyectos vigentes vinculados por cliente_id,
    //    customer_id o vía contactos) → bloquean el borrado.
    const active = await this.customerRepository.manager.query(
      `SELECT COUNT(*)::int AS count
         FROM projects p
        WHERE p.deleted_at IS NULL
          AND (p.customer_id = $1 OR p.client_id = $1 OR EXISTS (
            SELECT 1 FROM customers_contacts cc
             WHERE cc.id = p.customer_contact_id AND cc.customer_id = $1
          ))`,
      [id],
    );
    const activeCount = Number(active?.[0]?.count ?? 0);
    if (activeCount > 0) {
      throw new ConflictException(
        `No se puede eliminar: el cliente tiene ${activeCount} proyecto(s) activo(s) asociados.`,
      );
    }

    // 2) Todo en UNA transacción: desvincular proyectos soft-deleted y
    //    limpiar FKs antes de borrar contactos y cliente.
    await this.customerRepository.manager.transaction(async (manager) => {
      await manager.query(
        `UPDATE projects SET customer_contact_id = NULL
          WHERE customer_contact_id IN (SELECT id FROM customers_contacts WHERE customer_id = $1)`,
        [id],
      );
      await manager.query(
        `UPDATE projects SET customer_id = NULL WHERE customer_id = $1`,
        [id],
      );
      await manager.delete(CustomerContact, { customer: { id } });
      const result = await manager
        .createQueryBuilder()
        .delete()
        .from(Customer)
        .where('id = :id', { id })
        .execute();
      if (result.affected === 0) {
        throw new NotFoundException(`Customer with ID "${id}" not found`);
      }
    });

    return {
      message: `Customer with ID "${id}" has been permanently deleted.`,
    };
  }

  // 🔥 Mantener softDelete por compatibilidad, pero redirigir a hard delete
  async softDeleteCustomer(id: string) {
    return this.deleteCustomer(id);
  }
}