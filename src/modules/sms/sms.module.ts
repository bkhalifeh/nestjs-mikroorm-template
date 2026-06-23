import { Module } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

import { SMS_SENDER, type SmsSender } from './interfaces/sms.interface';
import { LogSms } from './strategies/log-sms';
import { TwilioSms } from './strategies/twilio-sms';
import {
  SMS_CONFIG_PROVIDER,
  SmsConfigType,
} from '../config/resources/sms-resource';

@Module({
  providers: [
    {
      provide: SMS_SENDER,
      useFactory: (config: SmsConfigType, logger: Logger): SmsSender => {
        switch (config.provider) {
          case 'twilio':
            return new TwilioSms(config);
          case 'log':
          default:
            return new LogSms(logger);
        }
      },
      inject: [SMS_CONFIG_PROVIDER.KEY, Logger],
    },
  ],
  exports: [SMS_SENDER],
})
export class SmsModule {}
