import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AUTH_CONFIG_PROVIDER } from '../../config/resources/auth-resource';
import type { AuthConfigType } from '../../config/resources/auth-resource';
import { UserService } from '../../user/services/user.service';
import { UserStatus } from '../../user/enums/user-status.enum';
import type { JwtPayload, JwtUser } from '../types/jwt-user.type';
import { TokenService } from '../services/token.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(AUTH_CONFIG_PROVIDER.KEY)
    authConfig: AuthConfigType,
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: authConfig.jwtAccessSecret,
      issuer: authConfig.jwtIssuer,
      audience: authConfig.jwtAudience,
      passReqToCallback: false,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtUser> {
    if (!payload.jti) {
      throw new UnauthorizedException('Token is missing jti.');
    }
    if (await this.tokenService.isJtiRevoked(payload.jti)) {
      throw new UnauthorizedException('Access token has been revoked.');
    }

    const user = await this.userService.findOne(payload.sub).catch(() => null);
    if (!user) throw new UnauthorizedException('User not found.');
    if (
      user.status === UserStatus.BANNED ||
      user.status === UserStatus.DISABLED
    ) {
      throw new UnauthorizedException('Account is not active.');
    }
    if (user.tokenVersion !== payload.tv) {
      throw new UnauthorizedException('Token superseded.');
    }
    return {
      id: user.id,
      role: user.role,
      tokenVersion: user.tokenVersion,
      jti: payload.jti,
    };
  }
}
