import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { v7 } from 'uuid';
import type { RedisClientType } from 'redis';

import { AUTH_CONFIG_PROVIDER } from '../../config/resources/auth-resource';
import type { AuthConfigType } from '../../config/resources/auth-resource';
import { InjectRedisClient } from '../../redis/decorators/inject-redis-client.decorator';
import { User } from '../../user/domains/user';
import {
  REFRESH_TOKEN_REDIS_PREFIX,
  REVOKED_JTI_REDIS_PREFIX,
} from '../constants';
import type { JwtPayload, RefreshPayload } from '../types/jwt-user.type';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: number;
  refreshExpiresIn: number;
  tokenType: 'Bearer';
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    @Inject(AUTH_CONFIG_PROVIDER.KEY)
    private readonly authConfig: AuthConfigType,
    @InjectRedisClient()
    private readonly redis: RedisClientType,
  ) {}

  async issuePair(user: User): Promise<TokenPair> {
    const accessJti = v7();
    const refreshJti = v7();

    const accessPayload: JwtPayload = {
      sub: user.id,
      role: user.role,
      tv: user.tokenVersion,
      jti: accessJti,
    };
    const refreshPayload: RefreshPayload = {
      sub: user.id,
      tv: user.tokenVersion,
      jti: refreshJti,
    };

    const accessToken = await this.jwt.signAsync(accessPayload, {
      secret: this.authConfig.jwtAccessSecret,
      expiresIn: this.authConfig.jwtAccessTtlSeconds,
      issuer: this.authConfig.jwtIssuer,
      audience: this.authConfig.jwtAudience,
    });
    const refreshToken = await this.jwt.signAsync(refreshPayload, {
      secret: this.authConfig.jwtRefreshSecret,
      expiresIn: this.authConfig.jwtRefreshTtlSeconds,
      issuer: this.authConfig.jwtIssuer,
      audience: this.authConfig.jwtAudience,
    });

    await this.redis.set(
      `${REFRESH_TOKEN_REDIS_PREFIX}${user.id}:${refreshJti}`,
      '1',
      {
        expiration: {
          type: 'EX',
          value: this.authConfig.jwtRefreshTtlSeconds,
        },
      },
    );

    return {
      accessToken,
      refreshToken,
      accessExpiresIn: this.authConfig.jwtAccessTtlSeconds,
      refreshExpiresIn: this.authConfig.jwtRefreshTtlSeconds,
      tokenType: 'Bearer',
    };
  }

  async rotateRefresh(refreshToken: string): Promise<{
    payload: RefreshPayload;
  }> {
    let payload: RefreshPayload;
    try {
      payload = await this.jwt.verifyAsync<RefreshPayload>(refreshToken, {
        secret: this.authConfig.jwtRefreshSecret,
        issuer: this.authConfig.jwtIssuer,
        audience: this.authConfig.jwtAudience,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    const key = `${REFRESH_TOKEN_REDIS_PREFIX}${payload.sub}:${payload.jti}`;
    const existed = await this.redis.del(key);
    if (existed === 0) {
      throw new UnauthorizedException(
        'Refresh token has been revoked or already used.',
      );
    }

    return { payload };
  }

  async verifyAccess(token: string): Promise<JwtPayload> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.authConfig.jwtAccessSecret,
        issuer: this.authConfig.jwtIssuer,
        audience: this.authConfig.jwtAudience,
      });
    } catch {
      throw new UnauthorizedException('Invalid access token.');
    }

    const revoked = await this.redis.exists(
      `${REVOKED_JTI_REDIS_PREFIX}${payload.jti}`,
    );
    if (revoked) {
      throw new UnauthorizedException('Access token has been revoked.');
    }
    return payload;
  }

  async isJtiRevoked(jti: string): Promise<boolean> {
    const exists = await this.redis.exists(`${REVOKED_JTI_REDIS_PREFIX}${jti}`);
    return exists > 0;
  }

  async revokeAccess(jti: string, expiresAtUnix: number): Promise<void> {
    const ttl = Math.max(1, expiresAtUnix - Math.floor(Date.now() / 1000));
    await this.redis.set(`${REVOKED_JTI_REDIS_PREFIX}${jti}`, '1', {
      expiration: { type: 'EX', value: ttl },
    });
  }

  async revokeRefresh(userId: string, jti: string): Promise<void> {
    await this.redis.del(`${REFRESH_TOKEN_REDIS_PREFIX}${userId}:${jti}`);
  }

  async revokeAllRefreshForUser(userId: string): Promise<number> {
    const pattern = `${REFRESH_TOKEN_REDIS_PREFIX}${userId}:*`;
    let count = 0;
    for await (const batch of this.redis.scanIterator({ MATCH: pattern })) {
      const keys = Array.isArray(batch) ? batch : [batch];
      if (keys.length > 0) {
        count += await this.redis.del(keys);
      }
    }
    return count;
  }
}
