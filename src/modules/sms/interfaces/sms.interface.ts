export interface SendSmsOptions {
  to: string;
  message: string;
}

export interface SmsSender {
  send(options: SendSmsOptions): Promise<void>;
}

export const SMS_SENDER = 'SMS_SENDER';
