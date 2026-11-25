/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Temporal } from 'temporal-polyfill';
import { Profile } from 'src/modules/users/entities/profile.entity';
import { Notification } from '../entities/notification.entity';
import { NotificationCategory } from '../enums/notification-category.enum';
import { NotificationLevel } from '../enums/notification-level.enum';
import {
  PROFILE_INCOMPLETE_MESSAGE,
  PROFILE_INCOMPLETE_TITLE,
  ProfileCompletenessService,
} from './profile-completeness.service';
import { NotificationsService } from './notifications.service';

const completeProfile = {
  idCard: 'V-12345678',
  deparment: 'Sistemas',
  company: 'Bytes Creativos',
  position: 'Desarrollador',
  whatsappPhone: '+584120000000',
} as Profile;

const incompleteProfile = {
  idCard: 'V-12345678',
  deparment: '',
  company: null,
  position: 'Desarrollador',
  whatsappPhone: null,
} as unknown as Profile;

function qbMock(rows: any[]) {
  const qb: any = {
    innerJoin: jest.fn(() => qb),
    select: jest.fn(() => qb),
    where: jest.fn(() => qb),
    andWhere: jest.fn(() => qb),
    getRawMany: jest.fn(async () => rows),
  };
  return qb;
}

describe('ProfileCompletenessService', () => {
  let service: ProfileCompletenessService;
  let profileRepo: any;
  let notificationRepo: any;
  let notifications: any;

  beforeEach(async () => {
    profileRepo = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    notificationRepo = { update: jest.fn() };
    notifications = { createInApp: jest.fn(async () => ({ id: 'n1' })) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileCompletenessService,
        { provide: getRepositoryToken(Profile), useValue: profileRepo },
        { provide: getRepositoryToken(Notification), useValue: notificationRepo },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = module.get(ProfileCompletenessService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('considera completo solo si los 5 campos tienen texto', () => {
    expect(service.isComplete(completeProfile)).toBe(true);
    expect(service.isComplete(incompleteProfile)).toBe(false);
    expect(service.isComplete({ ...completeProfile, company: '   ' } as Profile)).toBe(false);
    expect(service.isComplete(null)).toBe(false);
  });

  it('calcula la clave del mes en YYYY-MM', () => {
    expect(service.periodKey(Temporal.PlainDate.from('2026-11-24'))).toBe('2026-11');
    expect(service.periodKey(Temporal.PlainDate.from('2027-01-03'))).toBe('2027-01');
  });

  it('notifica con el texto exacto y la clave mensual cuando está incompleto', async () => {
    jest.spyOn(service, 'periodKey').mockReturnValue('2026-11');
    profileRepo.findOne.mockResolvedValue(incompleteProfile);

    await expect(service.notifyIfIncomplete('u1')).resolves.toBe(true);
    expect(notifications.createInApp).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        category: NotificationCategory.USERS,
        level: NotificationLevel.WARNING,
        title: PROFILE_INCOMPLETE_TITLE,
        message: PROFILE_INCOMPLETE_MESSAGE,
        data: { route: '/profile', reason: 'incomplete_profile' },
        eventKey: 'profile.incomplete:2026-11',
        digestSent: true,
      }),
    );
  });

  it('no notifica si el perfil ya está completo o si el dedupe devolvió null', async () => {
    profileRepo.findOne.mockResolvedValueOnce(completeProfile);
    await expect(service.notifyIfIncomplete('u1')).resolves.toBe(false);
    expect(notifications.createInApp).not.toHaveBeenCalled();

    profileRepo.findOne.mockResolvedValueOnce(incompleteProfile);
    notifications.createInApp.mockResolvedValueOnce(null);
    await expect(service.notifyIfIncomplete('u2')).resolves.toBe(false);
  });

  it('el chequeo masivo solo evalúa perfiles incompletos activos', async () => {
    const qb = qbMock([{ id: 'u1' }, { id: 'u2' }]);
    profileRepo.createQueryBuilder.mockReturnValue(qb);
    profileRepo.findOne.mockResolvedValue(incompleteProfile);

    await expect(service.notifyAllIncomplete()).resolves.toBe(2);
    expect(qb.innerJoin).toHaveBeenCalledWith('p.user', 'u');
    expect(qb.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('TRIM(p.company)'),
    );
    expect(notifications.createInApp).toHaveBeenCalledTimes(2);
  });

  it('marca como leída la alerta cuando el perfil se completó', async () => {
    profileRepo.findOne.mockResolvedValueOnce(completeProfile);
    await expect(service.markCompleteIfNeeded('u1')).resolves.toBe(true);
    expect(notificationRepo.update).toHaveBeenCalled();

    profileRepo.findOne.mockResolvedValueOnce(incompleteProfile);
    await expect(service.markCompleteIfNeeded('u2')).resolves.toBe(false);
    expect(notificationRepo.update).toHaveBeenCalledTimes(1);
  });
});
