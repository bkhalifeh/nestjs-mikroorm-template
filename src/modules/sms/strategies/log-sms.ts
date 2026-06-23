import type { Logger } from 'nestjs-pino';
import type { SendSmsOptions, SmsSender } from '../interfaces/sms.interface';

export class LogSms implements SmsSender {
  constructor(private readonly logger: Logger) {}

  send(options: SendSmsOptions): Promise<void> {
    this.logger.log(
      { channel: 'sms', to: options.to, message: options.message },
      'LogSms: would have sent SMS',
    );
    return Promise.resolve();
  }
}
