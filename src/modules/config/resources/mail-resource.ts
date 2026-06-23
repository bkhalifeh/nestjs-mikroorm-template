import { ConfigType } from '@nestjs/config';
import { Expose, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import {
  createValidatedConfig,
  transformBoolean,
  transformNumber,
  transformString,
} from '../../../common/helper/functions';

export class MailConfig {
  @Expose({ name: 'MAIL__HOST' })
  @Transform(({ value }) => transformString(value, 'localhost'))
  @IsString()
  host!: string;

  @Expose({ name: 'MAIL__PORT' })
  @Transform(({ value }) => transformNumber(value, 587))
  @IsInt()
  @Min(1)
  @Max(65535)
  port!: number;

  @Expose({ name: 'MAIL__SECURE' })
  @Transform(({ value }) => transformBoolean(value, false))
  @IsBoolean()
  secure!: boolean;

  @Expose({ name: 'MAIL__USERNAME' })
  @IsOptional()
  @IsString()
  username?: string;

  @Expose({ name: 'MAIL__PASSWORD' })
  @IsOptional()
  @IsString()
  password?: string;

  @Expose({ name: 'MAIL__FROM' })
  @Transform(({ value }) => transformString(value, 'no-reply@localhost'))
  @IsString()
  from!: string;

  @Expose({ name: 'MAIL__TRANSPORT' })
  @Transform(({ value }) => transformString(value, 'smtp'))
  @IsString()
  transport!: 'smtp' | 'log';
}

export const MAIL_CONFIG_PROVIDER = createValidatedConfig('mail', MailConfig);
export type MailConfigType = ConfigType<typeof MAIL_CONFIG_PROVIDER>;
