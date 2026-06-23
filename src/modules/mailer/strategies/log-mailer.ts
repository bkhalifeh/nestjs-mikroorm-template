import type { Logger } from 'nestjs-pino';
import type { Mailer, SendMailOptions } from '../interfaces/mailer.interface';

export class LogMailer implements Mailer {
  constructor(private readonly logger: Logger) {}

  send(options: SendMailOptions): Promise<void> {
    this.logger.log(
      {
        channel: 'mail',
        to: options.to,
        subject: options.subject,
        text: options.text,
      },
      'LogMailer: would have sent email',
    );
    return Promise.resolve();
  }
}
