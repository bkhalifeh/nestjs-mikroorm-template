import { ConfigType } from '@nestjs/config';
import { createValidatedConfig } from '../../../common/helper/functions';
import { IsUrl } from 'class-validator';
import { Expose } from 'class-transformer';

export class RedisConfig {
  @Expose({ name: 'REDIS__URL' })
  // require_tld:false so container hostnames (redis://redis:6379) and localhost validate.
  @IsUrl({ protocols: ['redis'], require_tld: false })
  url!: string;
}
export const REDIS_CONFIG_PROVIDER = createValidatedConfig(
  'redis',
  RedisConfig,
);
export type RedisConfigType = ConfigType<typeof REDIS_CONFIG_PROVIDER>;
