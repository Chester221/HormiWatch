import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CustomersService } from './customers.service';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { CreateUserDto } from '../../users/dto/create-user.dto';

describe('CustomersService - saneamiento de payload', () => {
  let service: CustomersService;
  let qb: Record<string, jest.Mock>;
  let customerRepo: { createQueryBuilder: jest.Mock; findOne: jest.Mock };
  let contactRepo: { create: jest.Mock; save: jest.Mock; delete: jest.Mock };
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

  it('descarta department, mapea idCard a id_card y conserva el teléfono libre', async () => {
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
      phone: '+54 11 1234-5678',
    });
    expect(contact).not.toHaveProperty('department');
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
