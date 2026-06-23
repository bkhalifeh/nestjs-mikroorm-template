import { ConfigType } from '@nestjs/config';
import { Expose, Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

import {
  createValidatedConfig,
  transformString,
} from '../../../common/helper/functions';

export class OAuthConfig {
  @Expose({ name: 'OAUTH__GOOGLE_CLIENT_ID' })
  @Transform(({ value }) => transformString(value, ''))
  @IsString()
  googleClientId!: string;

  @Expose({ name: 'OAUTH__GOOGLE_CLIENT_SECRET' })
  @Transform(({ value }) => transformString(value, ''))
  @IsString()
  googleClientSecret!: string;

  @Expose({ name: 'OAUTH__GOOGLE_CALLBACK_URL' })
  @Transform(({ value }) =>
    transformString(value, 'http://localhost:3000/api/v1/auth/google/callback'),
  )
  @IsString()
  googleCallbackUrl!: string;

  @Expose({ name: 'OAUTH__GITHUB_CLIENT_ID' })
  @Transform(({ value }) => transformString(value, ''))
  @IsString()
  githubClientId!: string;

  @Expose({ name: 'OAUTH__GITHUB_CLIENT_SECRET' })
  @Transform(({ value }) => transformString(value, ''))
  @IsString()
  githubClientSecret!: string;

  @Expose({ name: 'OAUTH__GITHUB_CALLBACK_URL' })
  @Transform(({ value }) =>
    transformString(value, 'http://localhost:3000/api/v1/auth/github/callback'),
  )
  @IsString()
  githubCallbackUrl!: string;

  @Expose({ name: 'OAUTH__SUCCESS_REDIRECT_URL' })
  @IsOptional()
  @IsString()
  successRedirectUrl?: string;
}

export const OAUTH_CONFIG_PROVIDER = createValidatedConfig(
  'oauth',
  OAuthConfig,
);
export type OAuthConfigType = ConfigType<typeof OAUTH_CONFIG_PROVIDER>;
