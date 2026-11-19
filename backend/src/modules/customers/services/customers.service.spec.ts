import { CustomersService } from './customers.service';

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

  it('no envía email/phone al INSERT de customers y los usa como fallback del contacto', async () => {
    await service.createCustomer({
      name: 'Acme',
      email: 'root@acme.com',
      phone: '+58 (412) 123-4567',
      contacts: [{ name: 'Juan', phone: '099 123 4567' }],
    } as never);

    expect(qb.values).toHaveBeenCalledWith({ name: 'Acme' });

    const saved = contactRepo.save.mock.calls[0][0];
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({
      name: 'Juan',
      lastName: '',
      email: 'root@acme.com',
      phone: '0991234567',
      customer: { id: 'customer-1' },
    });
    // El teléfono del contacto prevalece sobre el del cliente.
    expect(saved[0].phone).not.toBe('+584121234567');
  });

  it('crea un contacto por defecto si solo hay email/phone en la raíz', async () => {
    await service.createCustomer({
      name: 'Acme',
      email: 'root@acme.com',
      phone: '+58 412 1234567',
    } as never);

    expect(contactRepo.save.mock.calls[0][0]).toMatchObject([
      {
        name: 'Acme',
        lastName: '',
        email: 'root@acme.com',
        phone: '+584121234567',
        customer: { id: 'customer-1' },
      },
    ]);
  });

  it('descarta department, mapea idCard a id_card y normaliza el teléfono', async () => {
    await service.createCustomer({
      name: 'Acme',
      contacts: [
        {
          name: 'Juan',
          department: 'Ventas',
          idCard: '1712345678',
          phone: '(02) 1234-567',
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
      phone: '021234567',
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
