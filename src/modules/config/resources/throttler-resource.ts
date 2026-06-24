import { ConfigType } from '@nestjs/config';
import { Expose, Transform } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';
import {
  createValidatedConfig,
  transformNumber,
} from '../../../common/helper/functions';

export class ThrottlerConfig {
  // Time window in milliseconds.
  @Expose({ name: 'THROTTLER__TTL' })
  @Transform(({ value }) => transformNumber(value, 60000))
  @IsNumber()
  @Min(1)
  ttl!: number;

  // Max requests allowed per window per client.
  @Expose({ name: 'THROTTLER__LIMIT' })
  @Transform(({ value }) => transformNumber(value, 100))
  @IsNumber()
  @Min(1)
  limit!: number;
}

export const THROTTLER_CONFIG_PROVIDER = createValidatedConfig(
  'throttler',
  ThrottlerConfig,
);
export type ThrottlerConfigType = ConfigType<typeof THROTTLER_CONFIG_PROVIDER>;
