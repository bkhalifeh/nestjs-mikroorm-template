import nodemailer, { Transporter } from 'nodemailer';
import type { Mailer, SendMailOptions } from '../interfaces/mailer.interface';
import type { MailConfigType } from '../../config/resources/mail-resource';

export class SmtpMailer implements Mailer {
  private readonly transporter: Transporter;

  constructor(private readonly config: MailConfigType) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth:
        config.username && config.password
          ? { user: config.username, pass: config.password }
          : undefined,
    });
  }

  async send(options: SendMailOptions): Promise<void> {
    await this.transporter.sendMail({
      from: this.config.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
  }
}
