import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Customer } from '../entities/customer.entity';
import { CustomerContact } from '../entities/customer_contact.entity';

import { CreateCustomerDto } from '../dto/create-customer.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';
import { FindAllCustomersQueryDto } from '../dto/find-all-customers-query.dto';
import { PageDto } from 'src/common/pagination/pagination.dto';
import { PageMeta } from 'src/common/pagination/metadata';
import { NotificationEmitterService } from '../../notifications/services/notification-emitter.service';
import { NotificationCategory } from '../../notifications/enums/notification-category.enum';
import { NotificationLevel } from '../../notifications/enums/notification-level.enum';

/** Forma normalizada de un contacto entrante (create o update). Los DTOs
 *  pueden traer campos extra que NO son columnas (department, id, etc.). */
interface IncomingContactData {
  id?: string;
  name?: string;
  lastName?: string;
  idCard?: string;
  id_card?: string;
  position?: string;
  phone?: string;
  email?: string;
}

type CustomerColumns = Partial<
  Pick<
    Customer,
    | 'name'
    | 'rif'
    | 'country'
    | 'city'
    | 'address'
    | 'phone_country'
    | 'phone_area'
    | 'phone_number'
  >
>;

/** Los DTOs actuales no declaran country/city, pero la entidad sí los tiene;
 *  se aceptan igualmente si llegan en el payload. */
type IncomingCustomerData = Partial<CreateCustomerDto> &
  Partial<UpdateCustomerDto> &
  Partial<Pick<Customer, 'country' | 'city'>>;

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(CustomerContact)
    private readonly customerContactRepository: Repository<CustomerContact>,
    private readonly notifications: NotificationEmitterService,
  ) {}

  /** Columnas reales de `customers`. Evita que email/phone/logo_url/etc.
   *  lleguen al QueryBuilder y provoquen "Property X was not found". */
  private sanitizeCustomerData(dto: IncomingCustomerData): CustomerColumns {
    const data: CustomerColumns = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.rif !== undefined) data.rif = dto.rif;
    if (dto.phone_country !== undefined) data.phone_country = dto.phone_country;
    if (dto.phone_area !== undefined) data.phone_area = dto.phone_area;
    if (dto.phone_number !== undefined) data.phone_number = dto.phone_number;
    if (dto.country !== undefined) data.country = dto.country;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.address !== undefined) data.address = dto.address;
    return data;
  }

  /** Personas naturales: se guarda tal como lo escribió el usuario, solo trim. */
  private trimPhone(value?: string | null): string | undefined {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  /** Solo columnas reales de `customers_contacts`, con lastName por defecto
   *  '' (la columna es NOT NULL) y mapeo idCard → id_card.
   *  En updates solo se incluyen los campos enviados, para no borrar valores
   *  existentes (por ejemplo lastName) con un PATCH parcial del contacto. */
  private sanitizeContact(
    contact: IncomingContactData,
    customerName: string,
    isUpdate = false,
  ): Partial<CustomerContact> {
    const data: Partial<CustomerContact> = {
      name: contact.name || customerName,
    };

    if (!isUpdate || contact.lastName !== undefined) {
      data.lastName = contact.lastName ?? '';
    }
    if (contact.idCard !== undefined || contact.id_card !== undefined) {
      data.id_card = contact.idCard ?? contact.id_card;
    }
    if (contact.position !== undefined) data.position = contact.position;
    if (contact.email !== undefined) data.email = contact.email;
    if (contact.id) data.id = contact.id;

    const phone = this.trimPhone(contact.phone);
    if (phone !== undefined) data.phone = phone;
    return data;
  }

  /** Construye los contactos a persistir. Si el cliente trae email/teléfono
   *  en la raíz, los inyecta como fallback en el primer contacto; si no hay
   *  contactos, crea uno usando el nombre del cliente. */
  private buildContacts(
    contacts: IncomingContactData[] | undefined,
    customerName: string,
    rootEmail?: string,
    rootPhone?: string,
  ): Array<Partial<CustomerContact>> {
    const result = (contacts ?? []).map((contact) =>
      this.sanitizeContact(contact, customerName),
    );

    const rootPhoneTrimmed = this.trimPhone(rootPhone);
    if (rootEmail || rootPhoneTrimmed) {
      if (!result.length) {
        result.push({ name: customerName, lastName: '' });
      }
      const first = result[0];
      if (rootEmail && !first.email) first.email = rootEmail;
      if (rootPhoneTrimmed && !first.phone) first.phone = rootPhoneTrimmed;
    }

    return result;
  }

  /** Sincroniza la lista completa de contactos de un cliente sin recrearlos:
   *  - con ID propio → UPDATE (conserva el ID y sus relaciones con proyectos)
   *  - sin ID (o ID ajeno al cliente) → INSERT
   *  - existentes que ya no vienen en la lista → DELETE (el usuario los quitó)
   *  Si `contacts` no viene en el payload no se llama a este método, de modo
   *  que un PATCH parcial (logo_url, etc.) nunca borra contactos.
   */
  private async syncCustomerContacts(
    customerId: string,
    contacts: IncomingContactData[],
    customerName: string,
  ): Promise<void> {
    const existing = await this.customerContactRepository.find({
      where: { customer: { id: customerId } },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((contact) => contact.id));

    const toUpdate: Array<{ id: string; changes: Partial<CustomerContact> }> = [];
    const toCreate: Array<Partial<CustomerContact>> = [];

    for (const incoming of contacts) {
      // Solo es UPDATE si el ID pertenece a este cliente. Un ID ajeno (o
      // ausente) se trata como contacto nuevo y se inserta sin ese ID: nunca
      // se secuestra un contacto de otro cliente. Los contactos nuevos se
      // sanitizan con isUpdate=false para que reciban lastName: '' (NOT NULL).
      const isUpdate = Boolean(incoming.id && existingIds.has(incoming.id));
      const sanitized = this.sanitizeContact(incoming, customerName, isUpdate);
      const { id, ...changes } = sanitized;

      if (isUpdate && id) {
        toUpdate.push({ id, changes });
      } else {
        toCreate.push(changes);
      }
    }

    for (const { id, changes } of toUpdate) {
      await this.customerContactRepository.update(
        { id, customer: { id: customerId } },
        changes,
      );
    }

    if (toCreate.length > 0) {
      const contactEntities = toCreate.map((contact) =>
        this.customerContactRepository.create({
          ...contact,
          customer: { id: customerId },
        }),
      );
      await this.customerContactRepository.save(contactEntities);
    }

    const keptIds = new Set(toUpdate.map(({ id }) => id));
    const toDeleteIds = existing
      .map((contact) => contact.id)
      .filter((id) => !keptIds.has(id));

    if (toDeleteIds.length > 0) {
      await this.customerContactRepository.delete({
        id: In(toDeleteIds),
        customer: { id: customerId },
      });
    }
  }

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
    // email/phone viven en customers_contacts, nunca en customers.
    const { contacts, email, phone, ...rest } = createCustomerDto;
    const customerData = this.sanitizeCustomerData(rest);

    const result = await this.customerRepository
      .createQueryBuilder()
      .insert()
      .into(Customer)
      .values(customerData)
      .execute();

    const id = result.identifiers[0].id as string;

    const contactData = this.buildContacts(
      contacts as IncomingContactData[] | undefined,
      customerData.name || '',
      email,
      phone,
    );
    if (contactData.length > 0) {
      const contactEntities = contactData.map((contact) =>
        this.customerContactRepository.create({
          ...contact,
          customer: { id },
        }),
      );
      await this.customerContactRepository.save(contactEntities);
    }

    // Notificación multicanal: cliente creado
    this.notifications.toAdmins(
      'customer.created',
      NotificationCategory.CUSTOMERS,
      NotificationLevel.INFO,
      'Cliente creado',
      `Se registró el cliente "${customerData.name || ''}" en el sistema.`,
      { customerId: id, name: customerData.name },
    );

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
        '(LOWER(customer.name) LIKE :term OR LOWER(customer.city) LIKE :term OR LOWER(customer.country) LIKE :term OR LOWER(customer.rif) LIKE :term)',
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
    const { contacts, email: _email, phone: _phone, ...rest } = updateCustomerDto;
    const customerData = this.sanitizeCustomerData(rest);

    // Un PATCH que solo trae contactos no debe ejecutar un UPDATE vacío.
    if (Object.keys(customerData).length > 0) {
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
    }

    if (contacts !== undefined) {
      // Validamos existencia y obtenemos el nombre para el fallback de los
      // contactos que no traigan el suyo.
      const existing = await this.customerRepository.findOne({
        where: { id },
        select: ['name'],
      });
      if (!existing) {
        throw new NotFoundException(`Customer with ID "${id}" not found`);
      }

      await this.syncCustomerContacts(
        id,
        contacts as IncomingContactData[],
        customerData.name || existing.name,
      );
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
    // IMPORTANTE: se castean a ::text para que PostgreSQL no falle con
    // "operator does not exist: uuid = text" (mezcla de columnas uuid/varchar
    // contra el mismo parámetro $1).
    const active = await this.customerRepository.manager.query(
      `SELECT COUNT(*)::int AS count
         FROM projects p
        WHERE p.deleted_at IS NULL
          AND (p.customer_id::text = $1 OR p.client_id::text = $1 OR EXISTS (
            SELECT 1 FROM customers_contacts cc
             WHERE cc.id::text = p.customer_contact_id::text AND cc.customer_id::text = $1
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

    // Notificación multicanal: cliente eliminado
    this.notifications.toAdmins(
      'customer.deleted',
      NotificationCategory.CUSTOMERS,
      NotificationLevel.WARNING,
      'Cliente eliminado',
      `El cliente con ID ${id} fue eliminado permanentemente del sistema.`,
      { customerId: id },
    );

    return {
      message: `Customer with ID "${id}" has been permanently deleted.`,
    };
  }

  // 🔥 Mantener softDelete por compatibilidad, pero redirigir a hard delete
  async softDeleteCustomer(id: string) {
    return this.deleteCustomer(id);
  }
}
