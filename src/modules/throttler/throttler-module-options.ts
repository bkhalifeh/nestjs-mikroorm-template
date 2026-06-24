import { ThrottlerAsyncOptions } from '@nestjs/throttler';
import {
  THROTTLER_CONFIG_PROVIDER,
  ThrottlerConfigType,
} from '../config/resources/throttler-resource';

export const throttlerModuleOptions: ThrottlerAsyncOptions = {
  inject: [THROTTLER_CONFIG_PROVIDER.KEY],
  useFactory: (throttlerConfig: ThrottlerConfigType) => ({
    throttlers: [
      {
        ttl: throttlerConfig.ttl,
        limit: throttlerConfig.limit,
      },
    ],
  }),
};
