import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import {
  Strategy,
  type Profile,
  type VerifyCallback,
} from 'passport-google-oauth20';

import { OAUTH_CONFIG_PROVIDER } from '../../config/resources/oauth-resource';
import type { OAuthConfigType } from '../../config/resources/oauth-resource';
import { AuthProvider } from '../../user/enums/auth-provider.enum';
import type { OAuthProfile } from '../services/auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    @Inject(OAUTH_CONFIG_PROVIDER.KEY)
    config: OAuthConfigType,
  ) {
    super({
      clientID: config.googleClientId,
      clientSecret: config.googleClientSecret,
      callbackURL: config.googleCallbackUrl,
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const email = profile.emails?.[0]?.value ?? null;
    const verified = profile.emails?.[0]?.verified ?? false;
    const result: OAuthProfile = {
      provider: AuthProvider.GOOGLE,
      providerUserId: profile.id,
      email,
      emailVerified: Boolean(verified),
      firstName: profile.name?.givenName ?? null,
      lastName: profile.name?.familyName ?? null,
      avatarUrl: profile.photos?.[0]?.value ?? null,
    };
    done(null, result);
  }
}
