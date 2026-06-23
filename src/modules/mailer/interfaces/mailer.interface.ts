export interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface Mailer {
  send(options: SendMailOptions): Promise<void>;
}

export const MAILER = 'MAILER';
