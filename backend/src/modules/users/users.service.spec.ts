import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UsersService } from './users.service';
import {
  UserOrderBy,
  UserPageOptionsDto,
  UserStatusFilter,
} from './dto/user-page-options.dto';

const RAW_STATS = {
  total: '10',
  active: '7',
  inactive: '2',
  suspended: '3',
  admins: '1',
  managers: '2',
  technicians: '6',
  leaders: '1',
  other: '0',
};

function createService(queryBuilder: Record<string, jest.Mock>): UsersService {
  return new UsersService(
    {} as never,
    { createQueryBuilder: jest.fn().mockReturnValue(queryBuilder) } as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    { del: jest.fn() } as never,
    { emit: jest.fn() } as never,
    {
      toAdmins: jest.fn(),
      toUsers: jest.fn(),
    } as never,
  );
}

function statsQueryBuilder(): Record<string, jest.Mock> {
  return {
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue(RAW_STATS),
  };
}

function findAllQueryBuilder(): Record<string, jest.Mock> {
  return {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    withDeleted: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  };
}

describe('UsersService - métricas y filtros del módulo de usuarios', () => {
  const previousInactivityDays = process.env.USER_INACTIVITY_DAYS;

  beforeEach(() => {
    process.env.USER_INACTIVITY_DAYS = '7';
  });

  afterAll(() => {
    if (previousInactivityDays === undefined) {
      delete process.env.USER_INACTIVITY_DAYS;
    } else {
      process.env.USER_INACTIVITY_DAYS = previousInactivityDays;
    }
  });

  it('devuelve KPIs numéricos y calcula el corte con USER_INACTIVITY_DAYS', async () => {
    const qb = statsQueryBuilder();
    const service = createService(qb);

    const stats = await service.getStats('Admin');

    expect(stats).toEqual(
      expect.objectContaining({
        total: 10,
        active: 7,
        inactive: 2,
        suspended: 3,
        admins: 1,
        managers: 2,
        technicians: 6,
        leaders: 1,
        other: 0,
      }),
    );
    expect(stats.generatedAt).toEqual(expect.any(String));
    expect(qb.andWhere).not.toHaveBeenCalled();

    const selection: string[] = qb.select.mock.calls[0][0];
    expect(selection.join(' ')).toContain('"u"."lastConnection" < :inactiveBefore');

    const params = qb.setParameters.mock.calls[0][0];
    expect(params.inactiveBefore).toBeInstanceOf(Date);
    const expected = Date.now() - 7 * 24 * 60 * 60 * 1000;
    expect(params.inactiveBefore.getTime()).toBeGreaterThan(expected - 5000);
    expect(params.inactiveBefore.getTime()).toBeLessThan(expected + 5000);
  });

  it('oculta a los administradores del scope de un Manager', async () => {
    const qb = statsQueryBuilder();
    const service = createService(qb);

    await service.getStats('Manager');

    expect(qb.andWhere).toHaveBeenCalledWith(
      'LOWER("r"."name") <> :adminRole',
    );
  });

  it('filtra por usuarios inactivos en el listado', async () => {
    const qb = findAllQueryBuilder();
    const service = createService(qb);
    const options = Object.assign(new UserPageOptionsDto(), {
      by: UserOrderBy.NAME,
      status: UserStatusFilter.INACTIVE,
      order: 'ASC',
      take: 10,
      page: 1,
    });

    await service.findAll(options);

    const inactiveCall = qb.andWhere.mock.calls.find((call) =>
      String(call[0]).includes('inactiveBefore'),
    );
    expect(inactiveCall).toBeDefined();
    expect(inactiveCall?.[1]).toEqual({
      isActive: true,
      inactiveBefore: expect.any(Date),
    });
    expect(qb.select).toHaveBeenCalledWith(
      expect.arrayContaining([
        'user.preferences',
        'profile.company',
        'profile.whatsappPhone',
      ]),
    );
  });

  it('valida el nuevo filtro status', async () => {
    expect(
      await validate(plainToInstance(UserPageOptionsDto, { status: 'inactive' })),
    ).toHaveLength(0);
    expect(
      await validate(plainToInstance(UserPageOptionsDto, { status: 'bogus' })),
    ).not.toHaveLength(0);
  });
});
