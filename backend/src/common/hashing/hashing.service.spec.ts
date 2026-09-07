import { Test, TestingModule } from '@nestjs/testing';
import { HashingService } from './hashing.service';
import hashingConfig from '../../config/hashing.config';

describe('HashingService', () => {
  let service: HashingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HashingService,
        {
          provide: hashingConfig.KEY,
          useValue: { pepper: 'test-pepper', saltLength: 16 },
        },
      ],
    }).compile();

    service = module.get<HashingService>(HashingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should hash a password', async () => {
    const password = 'password123';
    const hash = await service.hash(password);
    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
    expect(hash).not.toBe(password);
  });

  it('should compare a password correctly', async () => {
    const password = 'password123';
    const hash = await service.hash(password);
    const isValid = await service.compare(password, hash);
    expect(isValid).toBe(true);
  });

  it('should return false for incorrect password', async () => {
    const password = 'password123';
    const hash = await service.hash(password);
    const isValid = await service.compare('wrongpassword', hash);
    expect(isValid).toBe(false);
  });

  it('should generate different hashes for the same password (salting)', async () => {
    const password = 'password123';
    const hash1 = await service.hash(password);
    const hash2 = await service.hash(password);
    expect(hash1).not.toBe(hash2);
  });
});
