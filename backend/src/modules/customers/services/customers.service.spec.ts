import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CustomersService } from './customers.service';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { CreateUserDto } from '../../users/dto/create-user.dto';

describe('CustomersService - saneamiento de payload', () => {
  let service: CustomersService;
  let qb: Record<string, jest.Mock>;
  let customerRepo: { createQueryBuilder: jest.Mock; findOne: jest.Mock };
  let contactRepo: {
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
    update: jest.Mock;
    find: jest.Mock;
  };
  let notifications: { toAdmins: jest.Mock };

  beforeEach(() => {
    qb = {
      insert: jest.fn().mockReturnThis(),
      into: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      execute: jest
        .fn()
        .mockResolvedValue({ identifiers: [{ id: 'customer-1' }] }),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      cache: jest.fn().mockReturnThis(),
      getOne: jest
        .fn()
        .mockResolvedValue({ id: 'customer-1', name: 'Acme' }),
    };
    customerRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      findOne: jest.fn().mockResolvedValue({ id: 'customer-1', name: 'Acme' }),
    };
    contactRepo = {
      create: jest.fn((data) => data),
      save: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      find: jest.fn().mockResolvedValue([]),
    };
    notifications = { toAdmins: jest.fn() };

    service = new CustomersService(
      customerRepo as never,
      contactRepo as never,
      notifications as never,
    );
  });

  it('inserta solo columnas de customers (rif y teléfono partido) y usa email/phone como fallback', async () => {
    await service.createCustomer({
      name: 'Acme',
      rif: 'J-12345678-9',
      phone_country: '+58',
      phone_area: '212',
      phone_number: '2384510',
      email: 'root@acme.com',
      phone: '+58 412 123-4567',
      contacts: [{ name: 'Juan', phone: '099 123 4567' }],
    } as never);

    expect(qb.values).toHaveBeenCalledWith({
      name: 'Acme',
      rif: 'J-12345678-9',
      phone_country: '+58',
      phone_area: '212',
      phone_number: '2384510',
    });

    const saved = contactRepo.save.mock.calls[0][0];
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({
      name: 'Juan',
      lastName: '',
      email: 'root@acme.com',
      phone: '099 123 4567',
      customer: { id: 'customer-1' },
    });
  });

  it('crea un contacto por defecto si solo hay email/phone en la raíz', async () => {
    await service.createCustomer({
      name: 'Acme',
      rif: 'J-12345678-9',
      email: 'root@acme.com',
      phone: '+58 412 1234567',
    } as never);

    expect(contactRepo.save.mock.calls[0][0]).toMatchObject([
      {
        name: 'Acme',
        lastName: '',
        email: 'root@acme.com',
        phone: '+58 412 1234567',
        customer: { id: 'customer-1' },
      },
    ]);
  });

  it('conserva department, mapea idCard a id_card y conserva el teléfono libre', async () => {
    await service.createCustomer({
      name: 'Acme',
      rif: 'G-12345678-9',
      contacts: [
        {
          name: 'Juan',
          department: 'Ventas',
          idCard: '1712345678',
          phone: '  +54 11 1234-5678  ',
          position: 'Gerente',
        },
      ],
    } as never);

    const contact = contactRepo.save.mock.calls[0][0][0];
    expect(contact).toMatchObject({
      name: 'Juan',
      lastName: '',
      id_card: '1712345678',
      position: 'Gerente',
      department: 'Ventas',
      phone: '+54 11 1234-5678',
    });
    expect(contact).not.toHaveProperty('idCard');
  });

  it('un PATCH que solo trae contactos no ejecuta un UPDATE vacío', async () => {
    await service.updateCustomer('customer-1', {
      contacts: [{ name: 'Juan' }],
    } as never);

    expect(qb.update).not.toHaveBeenCalled();
    expect(customerRepo.findOne).toHaveBeenCalled();
    expect(contactRepo.save).toHaveBeenCalled();
  });
});

describe('CustomersService - sincronización diferencial de contactos', () => {
  let service: CustomersService;
  let qb: Record<string, jest.Mock>;
  let customerRepo: { createQueryBuilder: jest.Mock; findOne: jest.Mock };
  let contactRepo: {
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
    update: jest.Mock;
    find: jest.Mock;
  };

  beforeEach(() => {
    qb = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 1 }),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      cache: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({ id: 'customer-1', name: 'Acme' }),
    };
    customerRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      findOne: jest.fn().mockResolvedValue({ id: 'customer-1', name: 'Acme' }),
    };
    contactRepo = {
      create: jest.fn((data) => data),
      save: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      find: jest.fn().mockResolvedValue([]),
    };
    service = new CustomersService(
      customerRepo as never,
      contactRepo as never,
      { toAdmins: jest.fn() } as never,
    );
  });

  it('hace UPDATE de los existentes, INSERT de los nuevos y DELETE de los eliminados', async () => {
    contactRepo.find.mockResolvedValue([
      { id: 'contact-1' },
      { id: 'contact-2' },
      { id: 'contact-3' },
    ]);

    await service.updateCustomer('customer-1', {
      contacts: [
        { id: 'contact-1', name: 'Juan Actualizado', email: 'juan@acme.com', department: 'Ventas' },
        { id: 'contact-2', name: 'María' },
        { name: 'Nuevo Contacto', department: 'Soporte' },
      ],
    } as never);

    expect(contactRepo.update).toHaveBeenCalledTimes(2);
    expect(contactRepo.update).toHaveBeenCalledWith(
      { id: 'contact-1', customer: { id: 'customer-1' } },
      expect.objectContaining({
        name: 'Juan Actualizado',
        email: 'juan@acme.com',
        department: 'Ventas',
      }),
    );
    expect(contactRepo.update).toHaveBeenCalledWith(
      { id: 'contact-2', customer: { id: 'customer-1' } },
      expect.objectContaining({ name: 'María' }),
    );

    const inserted = contactRepo.save.mock.calls[0][0];
    expect(inserted).toHaveLength(1);
    expect(inserted[0]).toMatchObject({
      name: 'Nuevo Contacto',
      lastName: '',
      department: 'Soporte',
      customer: { id: 'customer-1' },
    });
    expect(inserted[0]).not.toHaveProperty('id');

    expect(contactRepo.delete).toHaveBeenCalledTimes(1);
    expect(contactRepo.delete.mock.calls[0][0].customer).toEqual({
      id: 'customer-1',
    });
    expect(contactRepo.delete.mock.calls[0][0].id.value).toEqual(['contact-3']);
  });

  it('no toca los contactos si el payload no trae contacts', async () => {
    await service.updateCustomer('customer-1', { name: 'Acme SA' } as never);

    expect(contactRepo.find).not.toHaveBeenCalled();
    expect(contactRepo.update).not.toHaveBeenCalled();
    expect(contactRepo.save).not.toHaveBeenCalled();
    expect(contactRepo.delete).not.toHaveBeenCalled();
  });

  it('no actualiza contactos de otro cliente: los trata como nuevos sin su ID', async () => {
    contactRepo.find.mockResolvedValue([{ id: 'contact-1' }]);

    await service.updateCustomer('customer-1', {
      contacts: [
        { id: 'contact-ajeno', name: 'Infiltrado' },
        { id: 'contact-1', name: 'Juan' },
      ],
    } as never);

    expect(contactRepo.update).toHaveBeenCalledTimes(1);
    expect(contactRepo.update.mock.calls[0][0].id).toBe('contact-1');

    const inserted = contactRepo.save.mock.calls[0][0];
    expect(inserted).toHaveLength(1);
    expect(inserted[0].name).toBe('Infiltrado');
    expect(inserted[0]).not.toHaveProperty('id');
    expect(contactRepo.delete).not.toHaveBeenCalled();
  });

  it('no sobrescribe lastName ni id del contacto al actualizarlo', async () => {
    contactRepo.find.mockResolvedValue([{ id: 'contact-1' }]);

    await service.updateCustomer('customer-1', {
      contacts: [{ id: 'contact-1', name: 'Juan' }],
    } as never);

    const [, changes] = contactRepo.update.mock.calls[0];
    expect(changes).not.toHaveProperty('lastName');
    expect(changes).not.toHaveProperty('id');
  });

  it('borra todos los contactos cuando el array viene vacío', async () => {
    contactRepo.find.mockResolvedValue([
      { id: 'contact-1' },
      { id: 'contact-2' },
    ]);

    await service.updateCustomer('customer-1', { contacts: [] } as never);

    expect(contactRepo.update).not.toHaveBeenCalled();
    expect(contactRepo.save).not.toHaveBeenCalled();
    expect(contactRepo.delete.mock.calls[0][0].id.value).toEqual([
      'contact-1',
      'contact-2',
    ]);
  });
});

describe('CreateCustomerDto - validación de RIF y teléfono de empresa', () => {
  const base = {
    name: 'Acme',
    rif: 'J-12345678-9',
    phone_country: '+58',
    phone_area: '212',
    phone_number: '2384510',
  };

  const errorsFor = async (data: Record<string, unknown>) =>
    validate(plainToInstance(CreateCustomerDto, data));

  it('acepta RIF J/G con 9 dígitos y lo normaliza a mayúsculas', async () => {
    const dto = plainToInstance(CreateCustomerDto, {
      ...base,
      rif: ' g-12345678-9 ',
    });
    expect(dto.rif).toBe('G-12345678-9');
    expect(await validate(dto)).toHaveLength(0);
  });

  it.each(['123456789', 'X-12345678-9', 'J-12345678', 'J-123456789'])(
    'rechaza el RIF inválido %s',
    async (rif) => {
      const errors = await errorsFor({ ...base, rif });
      expect(errors.some((e) => e.property === 'rif')).toBe(true);
    },
  );

  it('exige el RIF en la creación', async () => {
    const { rif: _rif, ...withoutRif } = base;
    const errors = await errorsFor(withoutRif);
    expect(errors.some((e) => e.property === 'rif')).toBe(true);
  });

  it('rechaza prefijos de país fuera del catálogo y áreas no numéricas', async () => {
    expect(
      (await errorsFor({ ...base, phone_country: '+44' })).some(
        (e) => e.property === 'phone_country',
      ),
    ).toBe(true);
    expect(
      (await errorsFor({ ...base, phone_area: 'ABC' })).some(
        (e) => e.property === 'phone_area',
      ),
    ).toBe(true);
    expect(
      (await errorsFor({ ...base, phone_number: '123' })).some(
        (e) => e.property === 'phone_number',
      ),
    ).toBe(true);
  });

  it('rechaza teléfonos de contacto enviados como número', async () => {
    const errors = await errorsFor({
      ...base,
      contacts: [{ name: 'Juan', phone: 4121234567 }],
    });
    expect(
      errors.some((e) => e.property === 'contacts' && (e.children?.length ?? 0) > 0),
    ).toBe(true);
  });
});

describe('CustomersService - búsqueda parcial', () => {
  it('usa ILIKE %término% para palabras sueltas y frases completas', async () => {
    const qb: Record<string, jest.Mock> = {
      andWhere: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    const service = new CustomersService(
      { createQueryBuilder: jest.fn().mockReturnValue(qb) } as never,
      {} as never,
      {} as never,
    );

    await service.findAllCustomers({ search: ' ju ', skip: 0, take: 5 } as never);

    expect(qb.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('customer.name ILIKE :term'),
      { term: '%ju%' },
    );

    await service.findAllCustomers(
      { search: 'Juan Alberto', skip: 0, take: 5 } as never,
    );

    expect(qb.andWhere).toHaveBeenLastCalledWith(
      expect.stringContaining('ILIKE :term'),
      { term: '%Juan Alberto%' },
    );
  });
});

describe('CreateUserDto - teléfono libre de personas naturales', () => {
  it.each(['+54 11 1234-5678', '0414-1234567', '+58 (412) 1234567'])(
    'acepta el formato libre %s',
    async (phone) => {
      const dto = plainToInstance(CreateUserDto, {
        name: 'Juan',
        email: 'juan@example.com',
        password: 'Secret123!',
        phone,
      });
      expect(await validate(dto)).toHaveLength(0);
    },
  );
});
