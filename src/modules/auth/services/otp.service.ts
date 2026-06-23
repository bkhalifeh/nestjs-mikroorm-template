import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { createHash, randomInt, timingSafeEqual } from 'crypto';
import type { RedisClientType } from 'redis';

import { AUTH_CONFIG_PROVIDER } from '../../config/resources/auth-resource';
import type { AuthConfigType } from '../../config/resources/auth-resource';
import { InjectRedisClient } from '../../redis/decorators/inject-redis-client.decorator';
import { MAILER, type Mailer } from '../../mailer/interfaces/mailer.interface';
import { SMS_SENDER, type SmsSender } from '../../sms/interfaces/sms.interface';
import { OTP_REDIS_PREFIX, OTP_RESEND_REDIS_PREFIX } from '../constants';
import { OtpChannel } from '../enums/otp-channel.enum';
import { OtpPurpose } from '../enums/otp-purpose.enum';

interface OtpRecord {
  codeHash: string;
  attempts: number;
  createdAt: number;
}

@Injectable()
export class OtpService {
  constructor(
    @InjectPinoLogger(OtpService.name)
    private readonly logger: PinoLogger,
    @InjectRedisClient()
    private readonly redis: RedisClientType,
    @Inject(AUTH_CONFIG_PROVIDER.KEY)
    private readonly authConfig: AuthConfigType,
    @Inject(MAILER)
    private readonly mailer: Mailer,
    @Inject(SMS_SENDER)
    private readonly sms: SmsSender,
  ) {}

  async issue(
    channel: OtpChannel,
    purpose: OtpPurpose,
    destination: string,
  ): Promise<void> {
    const normalized = this.normalizeDestination(channel, destination);
    const resendKey = `${OTP_RESEND_REDIS_PREFIX}${channel}:${purpose}:${normalized}`;

    if (this.authConfig.otpResendIntervalSeconds > 0) {
      const exists = await this.redis.exists(resendKey);
      if (exists) {
        throw new HttpException(
          'Please wait before requesting a new code.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    const code = this.generateNumericCode(this.authConfig.otpLength);
    const record: OtpRecord = {
      codeHash: this.hashCode(code),
      attempts: 0,
      createdAt: Date.now(),
    };

    const otpKey = this.buildOtpKey(channel, purpose, normalized);
    await this.redis.set(otpKey, JSON.stringify(record), {
      expiration: { type: 'EX', value: this.authConfig.otpTtlSeconds },
    });

    if (this.authConfig.otpResendIntervalSeconds > 0) {
      await this.redis.set(resendKey, '1', {
        expiration: {
          type: 'EX',
          value: this.authConfig.otpResendIntervalSeconds,
        },
      });
    }

    await this.deliver(channel, normalized, code, purpose);
  }

  async verify(
    channel: OtpChannel,
    purpose: OtpPurpose,
    destination: string,
    code: string,
  ): Promise<void> {
    const normalized = this.normalizeDestination(channel, destination);
    const otpKey = this.buildOtpKey(channel, purpose, normalized);
    const raw = await this.redis.get(otpKey);
    if (!raw) {
      throw new BadRequestException('Code expired or never issued.');
    }

    const record = JSON.parse(raw) as OtpRecord;
    if (record.attempts >= this.authConfig.otpMaxAttempts) {
      await this.redis.del(otpKey);
      throw new HttpException(
        'Too many incorrect attempts. Request a new code.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const provided = this.hashCode(code);
    const providedBuf = Buffer.from(provided, 'hex');
    const expectedBuf = Buffer.from(record.codeHash, 'hex');
    const match =
      providedBuf.length === expectedBuf.length &&
      timingSafeEqual(providedBuf, expectedBuf);

    if (!match) {
      record.attempts += 1;
      await this.redis.set(otpKey, JSON.stringify(record), {
        expiration: { type: 'KEEPTTL' },
      });
      throw new BadRequestException('Incorrect code.');
    }

    await this.redis.del(otpKey);
  }

  private buildOtpKey(
    channel: OtpChannel,
    purpose: OtpPurpose,
    destination: string,
  ): string {
    return `${OTP_REDIS_PREFIX}${channel}:${purpose}:${destination}`;
  }

  private hashCode(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }

  private generateNumericCode(length: number): string {
    let out = '';
    for (let i = 0; i < length; i += 1) {
      out += String(randomInt(0, 10));
    }
    return out;
  }

  private normalizeDestination(
    channel: OtpChannel,
    destination: string,
  ): string {
    const trimmed = destination.trim();
    return channel === OtpChannel.EMAIL ? trimmed.toLowerCase() : trimmed;
  }

  private async deliver(
    channel: OtpChannel,
    destination: string,
    code: string,
    purpose: OtpPurpose,
  ): Promise<void> {
    const subject = this.subjectFor(purpose);
    const message = `Your verification code is ${code}. It expires in ${String(
      Math.round(this.authConfig.otpTtlSeconds / 60),
    )} minutes.`;

    try {
      if (channel === OtpChannel.EMAIL) {
        await this.mailer.send({
          to: destination,
          subject,
          text: message,
          html: `<p>${message}</p>`,
        });
      } else {
        await this.sms.send({ to: destination, message });
      }
    } catch (err) {
      this.logger.error({ err, channel, purpose }, 'OTP delivery failed');
      throw err;
    }
  }

  private subjectFor(purpose: OtpPurpose): string {
    switch (purpose) {
      case OtpPurpose.LOGIN:
        return 'Your login code';
      case OtpPurpose.REGISTER:
        return 'Verify your account';
      case OtpPurpose.VERIFY_EMAIL:
        return 'Confirm your email';
      case OtpPurpose.VERIFY_PHONE:
        return 'Confirm your phone';
      case OtpPurpose.PASSWORD_RESET:
        return 'Reset your password';
    }
  }
}
