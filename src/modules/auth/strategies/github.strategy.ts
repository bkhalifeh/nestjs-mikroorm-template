import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type Profile } from 'passport-github2';

import { OAUTH_CONFIG_PROVIDER } from '../../config/resources/oauth-resource';
import type { OAuthConfigType } from '../../config/resources/oauth-resource';
import { AuthProvider } from '../../user/enums/auth-provider.enum';
import type { OAuthProfile } from '../services/auth.service';

type GithubDone = (err: Error | null, user?: unknown) => void;

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    @Inject(OAUTH_CONFIG_PROVIDER.KEY)
    config: OAuthConfigType,
  ) {
    super({
      // Fall back to placeholders when OAuth is unconfigured so the app still
      // boots; the GitHub routes only fail if actually used without real creds.
      clientID: config.githubClientId || 'unconfigured',
      clientSecret: config.githubClientSecret || 'unconfigured',
      callbackURL: config.githubCallbackUrl,
      scope: ['user:email'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: GithubDone,
  ): void {
    const email = profile.emails?.find((e) => Boolean(e.value))?.value ?? null;
    const [firstName, ...rest] = (profile.displayName ?? '').split(' ');
    const lastName = rest.join(' ') || null;
    const result: OAuthProfile = {
      provider: AuthProvider.GITHUB,
      providerUserId: profile.id,
      email,
      emailVerified: Boolean(email),
      firstName: firstName || null,
      lastName,
      avatarUrl: profile.photos?.[0]?.value ?? null,
    };
    done(null, result);
  }
}
