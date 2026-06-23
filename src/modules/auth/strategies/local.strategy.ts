import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

import { User } from '../../user/domains/user';
import { UserStatus } from '../../user/enums/user-status.enum';
import { UserService } from '../../user/services/user.service';
import type { PasswordHasher } from '../../hash/interfaces/password-hasher.interface';
import { InjectPasswordHasher } from '../../hash/decorators/inject-password-hasher.decorator';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(
    private readonly userService: UserService,
    @InjectPasswordHasher()
    private readonly passwordHasher: PasswordHasher,
  ) {
    super({ usernameField: 'identifier', passwordField: 'password' });
  }

  async validate(identifier: string, password: string): Promise<User> {
    const user = await this.userService.findByLogin(identifier);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials.');
    }
    const ok = await this.passwordHasher.verify(user.passwordHash, password);
    if (!ok) throw new UnauthorizedException('Invalid credentials.');
    if (
      user.status === UserStatus.BANNED ||
      user.status === UserStatus.DISABLED
    ) {
      throw new UnauthorizedException('Account is not active.');
    }
    return user;
  }
}
