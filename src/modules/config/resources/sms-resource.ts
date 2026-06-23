import { ConfigType } from '@nestjs/config';
import { Expose, Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

import {
  createValidatedConfig,
  transformString,
} from '../../../common/helper/functions';

export class SmsConfig {
  @Expose({ name: 'SMS__PROVIDER' })
  @Transform(({ value }) => transformString(value, 'log'))
  @IsString()
  provider!: 'log' | 'twilio';

  @Expose({ name: 'SMS__TWILIO_ACCOUNT_SID' })
  @IsOptional()
  @IsString()
  twilioAccountSid?: string;

  @Expose({ name: 'SMS__TWILIO_AUTH_TOKEN' })
  @IsOptional()
  @IsString()
  twilioAuthToken?: string;

  @Expose({ name: 'SMS__TWILIO_FROM' })
  @IsOptional()
  @IsString()
  twilioFrom?: string;
}

export const SMS_CONFIG_PROVIDER = createValidatedConfig('sms', SmsConfig);
export type SmsConfigType = ConfigType<typeof SMS_CONFIG_PROVIDER>;
