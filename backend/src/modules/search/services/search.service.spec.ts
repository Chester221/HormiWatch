import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { GlobalSearchQueryDto } from '../dto/global-search-query.dto';
import { SearchService } from './search.service';

const page = (records: unknown[]) => ({ records, meta: {} });

describe('SearchService', () => {
  let service: SearchService;
  let projects: { findAll: jest.Mock };
  let tasks: { findAll: jest.Mock };
  let customers: { findAllCustomers: jest.Mock };
  let users: { findAll: jest.Mock };
  let services: { findAll: jest.Mock };

  beforeEach(() => {
    projects = {
      findAll: jest.fn().mockResolvedValue(
        page([
          {
            id: 'p1',
            title: 'Proyecto Andrés',
            description: 'Seguimiento',
            customer_name: 'Acme',
            status: 'in_progress',
          },
        ]),
      ),
    };
    tasks = {
      findAll: jest.fn().mockResolvedValue(
        page([
          {
            id: 't1',
            title: 'Llamar a Andrés',
            description: '',
            status: 'pending',
            project: { title: 'Proyecto Andrés' },
            service: null,
          },
        ]),
      ),
    };
    customers = {
      findAllCustomers: jest
        .fn()
        .mockResolvedValue(
          page([{ id: 'c1', name: 'Andrés SA', rif: 'J-1', city: 'Caracas', country: 'VE' }]),
        ),
    };
    users = {
      findAll: jest.fn().mockResolvedValue(
        page([
          {
            id: 'u2',
            email: 'andres@example.com',
            profile: { full_name: 'Andrés Pérez' },
            role: { name: 'Technician' },
          },
        ]),
      ),
    };
    services = {
      findAll: jest
        .fn()
        .mockResolvedValue(
          page([{ id: 's1', name: 'Hosting Andrés', description: 'Web', category: { name: 'TI' } }]),
        ),
    };

    service = new SearchService(
      projects as never,
      tasks as never,
      customers as never,
      users as never,
      services as never,
    );
  });

  it('agrupa y mapea las cinco categorías con el límite pedido', async () => {
    const user = { userId: 'u1', role: 'Admin' };

    const result = await service.search({ q: ' andres ', limit: 3 } as never, user);

    expect(result.projects).toEqual([
      {
        id: 'p1',
        title: 'Proyecto Andrés',
        subtitle: 'Acme',
        meta: 'in_progress',
      },
    ]);
    expect(result.tasks).toEqual([
      {
        id: 't1',
        title: 'Llamar a Andrés',
        subtitle: 'Proyecto Andrés',
        meta: 'pending',
      },
    ]);
    expect(result.customers).toEqual([
      { id: 'c1', title: 'Andrés SA', subtitle: 'J-1 · Caracas · VE' },
    ]);
    expect(result.users).toEqual([
      {
        id: 'u2',
        title: 'Andrés Pérez',
        subtitle: 'andres@example.com',
        meta: 'Technician',
      },
    ]);
    expect(result.services).toEqual([
      { id: 's1', title: 'Hosting Andrés', subtitle: 'Web', meta: 'TI' },
    ]);

    expect(projects.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ q: 'andres', take: 3 }),
      user,
    );
    expect(tasks.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ q: 'andres', take: 3 }),
      user,
    );
    expect(customers.findAllCustomers).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'andres', take: 3, includeContacts: false }),
    );
    expect(users.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ q: 'andres', take: 3 }),
    );
    expect(services.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ q: 'andres', take: 3 }),
    );
  });

  it('oculta clientes y usuarios a técnicos', async () => {
    const user = { userId: 'u1', role: 'Technician' };

    const result = await service.search({ q: 'andres', limit: 5 } as never, user);

    expect(result.customers).toEqual([]);
    expect(result.users).toEqual([]);
    expect(customers.findAllCustomers).not.toHaveBeenCalled();
    expect(users.findAll).not.toHaveBeenCalled();
    expect(result.projects).toHaveLength(1);
    expect(result.tasks).toHaveLength(1);
    expect(result.services).toHaveLength(1);
  });

  it('excluye admins para manager/leader y pide más resultados antes de filtrar', async () => {
    users.findAll.mockResolvedValue(
      page([
        {
          id: 'admin',
          email: 'admin@example.com',
          profile: { full_name: 'Root' },
          role: { name: 'Admin' },
        },
        {
          id: 'leader',
          email: 'leader@example.com',
          profile: { name: 'Ana', lastName: 'Pérez' },
          role: { name: 'Leader' },
        },
        {
          id: 'tech',
          email: 'tech@example.com',
          profile: { full_name: 'Pedro' },
          role: { name: 'Technician' },
        },
      ]),
    );
    const user = { userId: 'u1', role: 'Leader' };

    const result = await service.search({ q: 'an', limit: 5 } as never, user);

    expect(result.users.map((item) => item.id)).toEqual(['leader', 'tech']);
    expect(result.users[0].title).toBe('Ana Pérez');
    expect(users.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ take: 20 }),
    );
  });

  it('degrada solo el grupo que falla y registra el error', async () => {
    tasks.findAll.mockRejectedValue(new Error('DB caída'));
    const errorSpy = jest
      .spyOn((service as unknown as { logger: { error: jest.Mock } }).logger, 'error')
      .mockImplementation(() => undefined);

    const result = await service.search(
      { q: 'andres', limit: 5 } as never,
      { userId: 'u1', role: 'Admin' },
    );

    expect(result.tasks).toEqual([]);
    expect(result.projects).toHaveLength(1);
    expect(result.customers).toHaveLength(1);
    expect(result.users).toHaveLength(1);
    expect(result.services).toHaveLength(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('"tasks"'),
      expect.anything(),
    );
  });

  it('valida longitud del término y rango del límite', async () => {
    expect(
      await validate(plainToInstance(GlobalSearchQueryDto, { q: 'a' })),
    ).not.toHaveLength(0);
    expect(
      await validate(plainToInstance(GlobalSearchQueryDto, { q: 'an', limit: '11' })),
    ).not.toHaveLength(0);
    expect(
      await validate(plainToInstance(GlobalSearchQueryDto, { q: ' an ', limit: '5' })),
    ).toHaveLength(0);
  });
});
