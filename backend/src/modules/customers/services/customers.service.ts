import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Es necesario que crees estas entidades de TypeORM
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

  // NOTA: No olvides envolver las operaciones de escritura en transacciones
  // y añadir la lógica de auditoría como se indica en tu guía de migración.

  async createCustomer(
    createCustomerDto: CreateCustomerDto,
  ): Promise<Customer> {
    const result = await this.customerRepository
      .createQueryBuilder()
      .insert()
      .into(Customer)
      .values(createCustomerDto)
      .execute();

    const id = result.identifiers[0].id as string;
    return this.findCustomerById(id);
  }

  async findAllCustomers(
    query: FindAllCustomersQueryDto,
  ): Promise<PageDto<Customer>> {
    const { search, withDeleted, includeContacts, skip, take } = query;

    const qb = this.customerRepository.createQueryBuilder('customer');

    if (includeContacts) {
      qb.leftJoinAndSelect('customer.contact', 'contact');
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

    // Por defecto, incluye los contactos como se especifica en la guía
    qb.leftJoinAndSelect('customer.contact', 'contact');
    qb.where('customer.id = :id', { id });
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
    const result = await this.customerRepository
      .createQueryBuilder()
      .update(Customer)
      .set(updateCustomerDto)
      .where('id = :id', { id })
      .execute();

    if (result.affected === 0) {
      throw new NotFoundException(`Customer with ID "${id}" not found`);
    }

    return this.findCustomerById(id);
  }

  async softDeleteCustomer(id: string) {
    const result = await this.customerRepository
      .createQueryBuilder()
      .softDelete()
      .from(Customer)
      .where('id = :id', { id })
      .execute();

    if (result.affected === 0) {
      throw new NotFoundException(`Customer with ID "${id}" not found`);
    }
    return { message: `Customer with ID "${id}" has been soft-deleted.` };
  }
}
