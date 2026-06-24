// <imports>
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { HashModule } from '../hash/hash.module';
import { MailerModule } from '../mailer/mailer.module';
import { RedisModule } from '../redis/redis.module';
import { SmsModule } from '../sms/sms.module';
import { UserModule } from '../user/user.module';

import { AuthController } from './controllers/auth.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AuthService } from './services/auth.service';
import { OtpService } from './services/otp.service';
import { TokenService } from './services/token.service';
import { GithubStrategy } from './strategies/github.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
// </imports>

@Module({
  imports: [
    // <dependencies>
    PassportModule.register({ session: false, defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    HashModule,
    RedisModule,
    MailerModule,
    SmsModule,
    UserModule,
    // </dependencies>
  ],
  providers: [
    // <providers>
    AuthService,
    OtpService,
    TokenService,
    JwtStrategy,
    LocalStrategy,
    GoogleStrategy,
    GithubStrategy,
    JwtAuthGuard,
    RolesGuard,
    { provide: APP_GUARD, useExisting: JwtAuthGuard },
    { provide: APP_GUARD, useExisting: RolesGuard },
    // </providers>
  ],
  controllers: [
    // <controllers>
    AuthController,
    // </controllers>
  ],
  exports: [
    // <exports>
    AuthService,
    TokenService,
    JwtAuthGuard,
    RolesGuard,
    // </exports>
  ],
})
export class AuthModule {}
