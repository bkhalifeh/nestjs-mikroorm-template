import { Expose, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsSemVer,
  IsString,
  Max,
  Min,
  Validate,
} from 'class-validator';
import { BooleanOrString } from '../../../common/validators/boolean-or-string';
import { IpOrFqdn } from '../../../common/validators/ip-or-fqdn';
import {
  createValidatedConfig,
  transformBoolean,
  transformNumber,
  transformString,
} from '../../../common/helper/functions';
import { ConfigType } from '@nestjs/config';

export class AppConfig {
  @Expose({ name: 'APP__HOST' })
  @Transform(({ value }) => transformString(value, '0.0.0.0'))
  @IsString()
  @Validate(IpOrFqdn)
  host!: string;

  @Expose({ name: 'APP__PORT' })
  @Transform(({ value }) => transformNumber(value, 3000))
  @IsNumber()
  @Min(0)
  @Max(65535)
  port!: number;

  @Expose({ name: 'APP__NAME' })
  @Transform(({ value }) => transformString(value, 'NestJS-MikroOrm-Template'))
  @IsString()
  name!: string;

  @Expose({ name: 'APP__VERSION' })
  @Transform(({ value }) => transformString(value, '1.0.0'))
  @IsString()
  @IsSemVer()
  version!: `${number}.${number}.${number}`;

  @Expose({ name: 'APP__TRUST_PROXY' })
  @Transform(({ value }): boolean | string =>
    value == null ? true : (value as boolean | string),
  )
  @Validate(BooleanOrString)
  trustProxy!: boolean | string;

  @Expose({ name: 'APP__ENABLE_GLOBAL_PREFIX' })
  @Transform(({ value }) => transformBoolean(value, true))
  @IsBoolean()
  enableGloablPrefix!: boolean;

  @Expose({ name: 'APP__GLOBAL_PREFIX' })
  @Transform(({ value }) => transformString(value, 'api'))
  @IsString()
  globalPrefix!: string;

  @Expose({ name: 'APP__ENABLE_VERSION' })
  @Transform(({ value }) => transformBoolean(value, true))
  @IsBoolean()
  enableVersion!: boolean;

  // Comma-separated list of allowed origins, or "*" to allow any.
  @Expose({ name: 'APP__CORS_ORIGIN' })
  @Transform(({ value }): string | string[] => {
    const raw = typeof value === 'string' ? value : '*';
    if (raw === '*') return '*';
    return raw
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  })
  corsOrigin!: string | string[];

  @Expose({ name: 'APP__CORS_CREDENTIALS' })
  @Transform(({ value }) => transformBoolean(value, false))
  @IsBoolean()
  corsCredentials!: boolean;
}

export const APP_CONFIG_PROVIDER = createValidatedConfig('app', AppConfig);
export type AppConfigType = ConfigType<typeof APP_CONFIG_PROVIDER>;
