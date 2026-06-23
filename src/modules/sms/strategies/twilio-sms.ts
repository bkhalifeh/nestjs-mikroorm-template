import type { SendSmsOptions, SmsSender } from '../interfaces/sms.interface';
import type { SmsConfigType } from '../../config/resources/sms-resource';

export class TwilioSms implements SmsSender {
  private readonly endpoint: string;
  private readonly authHeader: string;
  private readonly from: string;

  constructor(config: SmsConfigType) {
    if (
      !config.twilioAccountSid ||
      !config.twilioAuthToken ||
      !config.twilioFrom
    ) {
      throw new Error(
        'TwilioSms requires SMS__TWILIO_ACCOUNT_SID, SMS__TWILIO_AUTH_TOKEN, and SMS__TWILIO_FROM',
      );
    }
    this.endpoint = `https://api.twilio.com/2010-04-01/Accounts/${config.twilioAccountSid}/Messages.json`;
    this.authHeader = `Basic ${Buffer.from(
      `${config.twilioAccountSid}:${config.twilioAuthToken}`,
    ).toString('base64')}`;
    this.from = config.twilioFrom;
  }

  async send(options: SendSmsOptions): Promise<void> {
    const body = new URLSearchParams({
      To: options.to,
      From: this.from,
      Body: options.message,
    });

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(
        `Twilio send failed (${String(response.status)}): ${detail}`,
      );
    }
  }
}
