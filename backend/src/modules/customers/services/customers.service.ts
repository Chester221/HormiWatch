import { Injectable, NotFoundException } from '@nestjs/common';
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

  // ✅ HARD DELETE: Eliminación permanente
  async deleteCustomer(id: string) {
    // Primero eliminar los contactos asociados
    await this.customerContactRepository.delete({ customer: { id } });

    // Luego eliminar el cliente
    const result = await this.customerRepository
      .createQueryBuilder()
      .delete()
      .from(Customer)
      .where('id = :id', { id })
      .execute();

    if (result.affected === 0) {
      throw new NotFoundException(`Customer with ID "${id}" not found`);
    }
    return { message: `Customer with ID "${id}" has been permanently deleted.` };
  }

  // 🔥 Mantener softDelete por compatibilidad, pero redirigir a hard delete
  async softDeleteCustomer(id: string) {
    return this.deleteCustomer(id);
  }
}