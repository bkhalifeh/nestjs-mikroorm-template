import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { InjectPasswordHasher } from '../../hash/decorators/inject-password-hasher.decorator';
import type { PasswordHasher } from '../../hash/interfaces/password-hasher.interface';
import { User } from '../../user/domains/user';
import { UserService } from '../../user/services/user.service';
import { AuthProvider } from '../../user/enums/auth-provider.enum';
import { UserRole } from '../../user/enums/user-role.enum';
import { UserStatus } from '../../user/enums/user-status.enum';

import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { OtpChannel } from '../enums/otp-channel.enum';
import { OtpPurpose } from '../enums/otp-purpose.enum';
import { OtpService } from './otp.service';
import { TokenService, TokenPair } from './token.service';

export interface OAuthProfile {
  provider: AuthProvider;
  providerUserId: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  emailVerified?: boolean;
}

export interface AuthResult {
  user: User;
  tokens: TokenPair;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectPinoLogger(AuthService.name)
    private readonly logger: PinoLogger,
    private readonly clsService: ClsService,
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
    private readonly otpService: OtpService,
    @InjectPasswordHasher()
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const requestId = this.clsService.get<string>('requestId');
    this.logger.info({ requestId, email: dto.email }, 'Registering user');

    if (!dto.email && !dto.username) {
      throw new BadRequestException(
        'Either email or username is required to register.',
      );
    }

    const user = await this.userService.create({
      email: dto.email ?? null,
      username: dto.username ?? null,
      password: dto.password,
      firstName: dto.firstName ?? null,
      lastName: dto.lastName ?? null,
      role: UserRole.USER,
      status: dto.email ? UserStatus.PENDING : UserStatus.ACTIVE,
    });

    if (dto.email) {
      await this.otpService
        .issue(OtpChannel.EMAIL, OtpPurpose.VERIFY_EMAIL, dto.email)
        .catch((err: unknown) => {
          this.logger.error(
            { requestId, err },
            'Failed to send verification email at registration',
          );
        });
    }

    const tokens = await this.tokenService.issuePair(user);
    await this.userService.touchLastLogin(user.id);
    return { user, tokens };
  }

  async loginWithPassword(dto: LoginDto): Promise<AuthResult> {
    const requestId = this.clsService.get<string>('requestId');
    this.logger.info(
      { requestId, identifier: dto.identifier },
      'Password login attempt',
    );

    const user = await this.userService.findByLogin(dto.identifier);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials.');
    }
    const ok = await this.passwordHasher.verify(
      user.passwordHash,
      dto.password,
    );
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials.');
    }
    this.assertActive(user);

    const tokens = await this.tokenService.issuePair(user);
    await this.userService.touchLastLogin(user.id);
    return { user, tokens };
  }

  async requestOtp(
    channel: OtpChannel,
    purpose: OtpPurpose,
    destination: string,
  ): Promise<void> {
    if (purpose === OtpPurpose.LOGIN) {
      const user = await this.lookupUserByDestination(channel, destination);
      if (!user) {
        return;
      }
      this.assertActive(user);
    }
    if (purpose === OtpPurpose.PASSWORD_RESET) {
      const user = await this.lookupUserByDestination(channel, destination);
      if (!user) {
        return;
      }
    }
    await this.otpService.issue(channel, purpose, destination);
  }

  async loginWithOtp(
    channel: OtpChannel,
    destination: string,
    code: string,
  ): Promise<AuthResult> {
    await this.otpService.verify(channel, OtpPurpose.LOGIN, destination, code);
    const user = await this.lookupUserByDestination(channel, destination);
    if (!user) {
      throw new UnauthorizedException('Account not found.');
    }
    this.assertActive(user);

    if (channel === OtpChannel.EMAIL && !user.emailVerifiedAt) {
      await this.userService.markEmailVerified(user.id);
    }
    if (channel === OtpChannel.SMS && !user.phoneVerifiedAt) {
      await this.userService.markPhoneVerified(user.id);
    }

    const tokens = await this.tokenService.issuePair(user);
    await this.userService.touchLastLogin(user.id);
    return { user, tokens };
  }

  async verifyOtp(
    channel: OtpChannel,
    purpose: OtpPurpose,
    destination: string,
    code: string,
  ): Promise<void> {
    await this.otpService.verify(channel, purpose, destination, code);
    if (purpose === OtpPurpose.VERIFY_EMAIL) {
      const user = await this.userService.findByEmail(destination);
      if (user) await this.userService.markEmailVerified(user.id);
    } else if (purpose === OtpPurpose.VERIFY_PHONE) {
      const user = await this.userService.findByPhone(destination);
      if (user) await this.userService.markPhoneVerified(user.id);
    }
  }

  async resetPassword(
    channel: OtpChannel,
    destination: string,
    code: string,
    newPassword: string,
  ): Promise<void> {
    await this.otpService.verify(
      channel,
      OtpPurpose.PASSWORD_RESET,
      destination,
      code,
    );

    const user = await this.lookupUserByDestination(channel, destination);
    if (!user) {
      throw new UnauthorizedException('Account not found.');
    }
    const passwordHash = await this.passwordHasher.hash(newPassword);
    await this.userService.setPasswordHash(user.id, passwordHash);
    await this.tokenService.revokeAllRefreshForUser(user.id);
  }

  async loginOAuth(profile: OAuthProfile): Promise<AuthResult> {
    if (!profile.providerUserId) {
      throw new BadRequestException(
        `OAuth profile for ${profile.provider} is missing a stable id.`,
      );
    }
    const user = await this.userService.findOrCreateOAuth({
      provider: profile.provider,
      providerUserId: profile.providerUserId,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      avatarUrl: profile.avatarUrl,
      emailVerified: profile.emailVerified,
    });
    this.assertActive(user);

    const tokens = await this.tokenService.issuePair(user);
    await this.userService.touchLastLogin(user.id);
    return { user, tokens };
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    const { payload } = await this.tokenService.rotateRefresh(refreshToken);
    const user = await this.userService.findOne(payload.sub);
    if (user.tokenVersion !== payload.tv) {
      throw new UnauthorizedException('Refresh token superseded.');
    }
    this.assertActive(user);
    const tokens = await this.tokenService.issuePair(user);
    return { user, tokens };
  }

  async logout(
    _userId: string,
    accessJti: string,
    accessExpUnix: number,
  ): Promise<void> {
    await this.tokenService.revokeAccess(accessJti, accessExpUnix);
  }

  async logoutAll(userId: string): Promise<void> {
    await this.userService.bumpTokenVersion(userId);
    await this.tokenService.revokeAllRefreshForUser(userId);
  }

  async changePassword(
    userId: string,
    currentPassword: string | undefined,
    newPassword: string,
  ): Promise<void> {
    await this.userService.changePassword(
      userId,
      currentPassword ?? undefined,
      newPassword,
    );
    await this.tokenService.revokeAllRefreshForUser(userId);
  }

  private async lookupUserByDestination(
    channel: OtpChannel,
    destination: string,
  ): Promise<User | null> {
    if (channel === OtpChannel.EMAIL) {
      return this.userService.findByEmail(destination);
    }
    return this.userService.findByPhone(destination);
  }

  private assertActive(user: User): void {
    if (user.status === UserStatus.BANNED) {
      throw new ForbiddenException('Account is banned.');
    }
    if (user.status === UserStatus.DISABLED) {
      throw new ForbiddenException('Account is disabled.');
    }
  }
}
