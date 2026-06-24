import { HealthCheckService, MikroOrmHealthIndicator } from '@nestjs/terminus';
import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { RedisHealthIndicator } from './health-indicators/redis-health-indicator';
import { REDIS_CLIENT } from '../redis/constants';
import { NODE_CONFIG_PROVIDER } from '../config/resources/node-resource';
import { NodeEnv } from '../../common/enums/node-env.enum';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: { check: vi.fn() } },
        { provide: MikroOrmHealthIndicator, useValue: { pingCheck: vi.fn() } },
        { provide: RedisHealthIndicator, useValue: { pingCheck: vi.fn() } },
        { provide: REDIS_CLIENT, useValue: { ping: vi.fn() } },
        { provide: NODE_CONFIG_PROVIDER.KEY, useValue: { env: NodeEnv.TEST } },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
