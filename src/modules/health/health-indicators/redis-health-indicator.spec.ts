import { HealthIndicatorService } from '@nestjs/terminus';
import { Test, TestingModule } from '@nestjs/testing';
import { RedisHealthIndicator } from './redis-health-indicator';

describe('RedisHealthIndicator', () => {
  let provider: RedisHealthIndicator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisHealthIndicator,
        {
          provide: HealthIndicatorService,
          useValue: {
            check: vi.fn().mockReturnValue({
              up: vi.fn(),
              down: vi.fn(),
            }),
          },
        },
      ],
    }).compile();

    provider = module.get<RedisHealthIndicator>(RedisHealthIndicator);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
