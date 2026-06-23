import { Module } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

import { MAILER, type Mailer } from './interfaces/mailer.interface';
import { SmtpMailer } from './strategies/smtp-mailer';
import { LogMailer } from './strategies/log-mailer';
import {
  MAIL_CONFIG_PROVIDER,
  MailConfigType,
} from '../config/resources/mail-resource';

@Module({
  providers: [
    {
      provide: MAILER,
      useFactory: (config: MailConfigType, logger: Logger): Mailer => {
        if (config.transport === 'log') {
          return new LogMailer(logger);
        }
        return new SmtpMailer(config);
      },
      inject: [MAIL_CONFIG_PROVIDER.KEY, Logger],
    },
  ],
  exports: [MAILER],
})
export class MailerModule {}
