import { ConfigType } from '@nestjs/config';
import { Expose, Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

import {
  createValidatedConfig,
  transformNumber,
  transformString,
} from '../../../common/helper/functions';

export class AuthConfig {
  @Expose({ name: 'AUTH__JWT_ACCESS_SECRET' })
  @IsNotEmpty()
  @IsString()
  jwtAccessSecret!: string;

  @Expose({ name: 'AUTH__JWT_REFRESH_SECRET' })
  @IsNotEmpty()
  @IsString()
  jwtRefreshSecret!: string;

  @Expose({ name: 'AUTH__JWT_ACCESS_TTL_SECONDS' })
  @Transform(({ value }) => transformNumber(value, 900))
  @IsInt()
  @Min(60)
  jwtAccessTtlSeconds!: number;

  @Expose({ name: 'AUTH__JWT_REFRESH_TTL_SECONDS' })
  @Transform(({ value }) => transformNumber(value, 60 * 60 * 24 * 30))
  @IsInt()
  @Min(60)
  jwtRefreshTtlSeconds!: number;

  @Expose({ name: 'AUTH__JWT_ISSUER' })
  @Transform(({ value }) => transformString(value, 'nestjs-mikroorm-template'))
  @IsString()
  jwtIssuer!: string;

  @Expose({ name: 'AUTH__JWT_AUDIENCE' })
  @Transform(({ value }) => transformString(value, 'nestjs-mikroorm-template'))
  @IsString()
  jwtAudience!: string;

  @Expose({ name: 'AUTH__OTP_LENGTH' })
  @Transform(({ value }) => transformNumber(value, 6))
  @IsInt()
  @Min(4)
  otpLength!: number;

  @Expose({ name: 'AUTH__OTP_TTL_SECONDS' })
  @Transform(({ value }) => transformNumber(value, 300))
  @IsInt()
  @Min(30)
  otpTtlSeconds!: number;

  @Expose({ name: 'AUTH__OTP_RESEND_INTERVAL_SECONDS' })
  @Transform(({ value }) => transformNumber(value, 60))
  @IsInt()
  @Min(0)
  otpResendIntervalSeconds!: number;

  @Expose({ name: 'AUTH__OTP_MAX_ATTEMPTS' })
  @Transform(({ value }) => transformNumber(value, 5))
  @IsInt()
  @Min(1)
  otpMaxAttempts!: number;
}

export const AUTH_CONFIG_PROVIDER = createValidatedConfig('auth', AuthConfig);
export type AuthConfigType = ConfigType<typeof AUTH_CONFIG_PROVIDER>;
