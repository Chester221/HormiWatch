import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerContact } from '../entities/customer_contact.entity';
import { CreateCustomerContactDto } from '../dto/create-customer-contact.dto';
import { UpdateCustomerContactDto } from '../dto/update-customer-contact.dto';
import { FindAllCustomerContactsQueryDto } from '../dto/find-all-customer-contacts-query.dto';
import { CustomersService } from './customers.service';
import { PageDto } from 'src/common/pagination/pagination.dto';
import { PageMeta } from 'src/common/pagination/metadata';

@Injectable()
export class CustomerContactService {
  constructor(
    @InjectRepository(CustomerContact)
    private readonly customerContactRepository: Repository<CustomerContact>,
    private readonly customersService: CustomersService,
  ) {}

  async create(
    customerId: string,
    createCustomerContactDto: CreateCustomerContactDto,
  ): Promise<CustomerContact> {
    const customer = await this.customersService.findCustomerById(customerId);

    const result = await this.customerContactRepository
      .createQueryBuilder()
      .insert()
      .into(CustomerContact)
      .values({
        ...createCustomerContactDto,
        customer,
      })
      .execute();

    const id = result.identifiers[0].id as string;
    return this.findOne(id);
  }

  async findAllByCustomer(
    customerId: string,
    query?: FindAllCustomerContactsQueryDto,
  ): Promise<PageDto<CustomerContact>> {
    await this.customersService.findCustomerById(customerId);

    const qb = this.customerContactRepository.createQueryBuilder('contact');
    qb.where('contact.customer = :customerId', { customerId });

    if (query) {
      const { search, withDeleted, skip, take } = query;

      if (search) {
        const term = `%${search.trim().toLowerCase()}%`;
        qb.andWhere(
          '(LOWER(contact.name) LIKE :term OR LOWER(contact.lastName) LIKE :term OR LOWER(contact.email) LIKE :term OR LOWER(contact.position) LIKE :term)',
          { term },
        );
      }

      if (withDeleted) {
        qb.withDeleted();
      }

      if (skip) qb.skip(skip);
      if (take) qb.take(take);
    } else {
      // Default pagination if query is not provided
      qb.take(10);
      qb.skip(0);
    }

    qb.orderBy('contact.createdAt', 'DESC'); // Default order, can be customizable if needed

    const [entities, itemCount] = await qb.getManyAndCount();

    const pageMetaDto = new PageMeta(
      query || new FindAllCustomerContactsQueryDto(),
      itemCount,
    );

    return new PageDto(entities, pageMetaDto);
  }

  async findOne(id: string): Promise<CustomerContact> {
    const qb = this.customerContactRepository.createQueryBuilder('contact');
    qb.where('contact.id = :id', { id });
    qb.cache(true);

    const contact = await qb.getOne();

    if (!contact) {
      throw new NotFoundException(`Contact with ID "${id}" not found`);
    }
    return contact;
  }

  async update(id: string, updateCustomerContactDto: UpdateCustomerContactDto) {
    const result = await this.customerContactRepository
      .createQueryBuilder()
      .update(CustomerContact)
      .set(updateCustomerContactDto)
      .where('id = :id', { id })
      .execute();

    if (result.affected === 0) {
      throw new NotFoundException(`Contact with ID "${id}" not found`);
    }
    return this.findOne(id);
  }

  async remove(id: string) {
    const result = await this.customerContactRepository
      .createQueryBuilder()
      .softDelete()
      .from(CustomerContact)
      .where('id = :id', { id })
      .execute();

    if (result.affected === 0) {
      throw new NotFoundException(`Contact with ID "${id}" not found`);
    }
    return { message: `Contact with ID "${id}" has been soft-deleted.` };
  }
}
