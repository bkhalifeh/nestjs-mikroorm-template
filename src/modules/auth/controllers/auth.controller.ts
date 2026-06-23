import {
  Body,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { ApiController } from '../../../common/decorators/api-controller.decorator';
import {
  OAUTH_CONFIG_PROVIDER,
  type OAuthConfigType,
} from '../../config/resources/oauth-resource';

import { ChangePasswordDto } from '../dto/change-password.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { RegisterDto } from '../dto/register.dto';
import { RequestOtpDto } from '../dto/request-otp.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';

import { CurrentUser } from '../decorators/current-user.decorator';
import { Public } from '../decorators/public.decorator';
import { GithubAuthGuard } from '../guards/github-auth.guard';
import { GoogleAuthGuard } from '../guards/google-auth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

import { AckResponse } from '../responses/ack.response';
import {
  AuthTokensCreatedResponse,
  AuthTokensOkResponse,
} from '../responses/auth-tokens.response';
import { AuthService, type OAuthProfile } from '../services/auth.service';
import { OtpPurpose } from '../enums/otp-purpose.enum';
import type { JwtUser } from '../types/jwt-user.type';

@ApiController({ options: 'auth' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(OAUTH_CONFIG_PROVIDER.KEY)
    private readonly oauthConfig: OAuthConfigType,
  ) {}

  // <routes>

  // <route name="register">
  @Public()
  @ApiOperation({
    summary: 'Create a new account with email/username + password.',
  })
  @ApiCreatedResponse({ type: AuthTokensCreatedResponse })
  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<AuthTokensCreatedResponse> {
    const result = await this.authService.register(dto);
    return new AuthTokensCreatedResponse(result);
  }
  // </route>

  // <route name="login">
  @Public()
  @ApiOperation({ summary: 'Log in with username/email + password.' })
  @ApiOkResponse({ type: AuthTokensOkResponse })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto): Promise<AuthTokensOkResponse> {
    const result = await this.authService.loginWithPassword(dto);
    return new AuthTokensOkResponse(result);
  }
  // </route>

  // <route name="otpRequest">
  @Public()
  @ApiOperation({ summary: 'Request a one-time code via SMS or email.' })
  @ApiOkResponse({ type: AckResponse })
  @HttpCode(HttpStatus.OK)
  @Post('otp/request')
  async otpRequest(@Body() dto: RequestOtpDto): Promise<AckResponse> {
    await this.authService.requestOtp(
      dto.channel,
      dto.purpose,
      dto.destination,
    );
    return new AckResponse();
  }
  // </route>

  // <route name="otpLogin">
  @Public()
  @ApiOperation({ summary: 'Log in with a one-time code (SMS or email).' })
  @ApiOkResponse({ type: AuthTokensOkResponse })
  @HttpCode(HttpStatus.OK)
  @Post('otp/login')
  async otpLogin(@Body() dto: VerifyOtpDto): Promise<AuthTokensOkResponse> {
    if (dto.purpose !== OtpPurpose.LOGIN) {
      dto.purpose = OtpPurpose.LOGIN;
    }
    const result = await this.authService.loginWithOtp(
      dto.channel,
      dto.destination,
      dto.code,
    );
    return new AuthTokensOkResponse(result);
  }
  // </route>

  // <route name="otpVerify">
  @Public()
  @ApiOperation({
    summary:
      'Verify a one-time code for email/phone verification (not for login).',
  })
  @ApiOkResponse({ type: AckResponse })
  @HttpCode(HttpStatus.OK)
  @Post('otp/verify')
  async otpVerify(@Body() dto: VerifyOtpDto): Promise<AckResponse> {
    await this.authService.verifyOtp(
      dto.channel,
      dto.purpose,
      dto.destination,
      dto.code,
    );
    return new AckResponse();
  }
  // </route>

  // <route name="forgotPassword">
  @Public()
  @ApiOperation({ summary: 'Send a password-reset code.' })
  @ApiOkResponse({ type: AckResponse })
  @HttpCode(HttpStatus.OK)
  @Post('password/forgot')
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<AckResponse> {
    await this.authService.requestOtp(
      dto.channel,
      OtpPurpose.PASSWORD_RESET,
      dto.destination,
    );
    return new AckResponse();
  }
  // </route>

  // <route name="resetPassword">
  @Public()
  @ApiOperation({ summary: 'Reset a password using a one-time code.' })
  @ApiOkResponse({ type: AckResponse })
  @HttpCode(HttpStatus.OK)
  @Post('password/reset')
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<AckResponse> {
    await this.authService.resetPassword(
      dto.channel,
      dto.destination,
      dto.code,
      dto.newPassword,
    );
    return new AckResponse();
  }
  // </route>

  // <route name="changePassword">
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Change the current user’s password.' })
  @ApiOkResponse({ type: AckResponse })
  @HttpCode(HttpStatus.OK)
  @Post('password/change')
  async changePassword(
    @CurrentUser() user: JwtUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<AckResponse> {
    await this.authService.changePassword(
      user.id,
      dto.currentPassword ?? undefined,
      dto.newPassword,
    );
    return new AckResponse();
  }
  // </route>

  // <route name="refresh">
  @Public()
  @ApiOperation({ summary: 'Exchange a refresh token for a new pair.' })
  @ApiOkResponse({ type: AuthTokensOkResponse })
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto): Promise<AuthTokensOkResponse> {
    const result = await this.authService.refresh(dto.refreshToken);
    return new AuthTokensOkResponse(result);
  }
  // </route>

  // <route name="logout">
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Revoke the current access token.' })
  @ApiOkResponse({ type: AckResponse })
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(
    @CurrentUser() user: JwtUser,
    @Req() req: Request,
  ): Promise<AckResponse> {
    const exp = this.extractExp(req);
    await this.authService.logout(user.id, user.jti, exp);
    return new AckResponse();
  }
  // </route>

  // <route name="logoutAll">
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Sign out from every device by bumping the token version.',
  })
  @ApiOkResponse({ type: AckResponse })
  @HttpCode(HttpStatus.OK)
  @Post('logout-all')
  async logoutAll(@CurrentUser() user: JwtUser): Promise<AckResponse> {
    await this.authService.logoutAll(user.id);
    return new AckResponse();
  }
  // </route>

  // <route name="googleStart">
  @Public()
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Begin Google OAuth login.' })
  @Get('google')
  googleStart(): void {
    /* handled by GoogleAuthGuard */
  }
  // </route>

  // <route name="googleCallback">
  @Public()
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback.' })
  @Get('google/callback')
  async googleCallback(
    @Req() req: Request & { user?: OAuthProfile },
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthTokensOkResponse | void> {
    const profile = req.user;
    if (!profile) throw new Error('Google profile missing on request.');
    const result = await this.authService.loginOAuth(profile);
    return this.deliverOAuth(result, res);
  }
  // </route>

  // <route name="githubStart">
  @Public()
  @UseGuards(GithubAuthGuard)
  @ApiOperation({ summary: 'Begin GitHub OAuth login.' })
  @Get('github')
  githubStart(): void {
    /* handled by GithubAuthGuard */
  }
  // </route>

  // <route name="githubCallback">
  @Public()
  @UseGuards(GithubAuthGuard)
  @ApiOperation({ summary: 'GitHub OAuth callback.' })
  @Get('github/callback')
  async githubCallback(
    @Req() req: Request & { user?: OAuthProfile },
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthTokensOkResponse | void> {
    const profile = req.user;
    if (!profile) throw new Error('GitHub profile missing on request.');
    const result = await this.authService.loginOAuth(profile);
    return this.deliverOAuth(result, res);
  }
  // </route>
  // </routes>

  private deliverOAuth(
    result: Awaited<ReturnType<AuthService['loginOAuth']>>,
    res: Response,
  ): AuthTokensOkResponse | void {
    if (this.oauthConfig.successRedirectUrl) {
      const url = new URL(this.oauthConfig.successRedirectUrl);
      url.searchParams.set('access_token', result.tokens.accessToken);
      url.searchParams.set('refresh_token', result.tokens.refreshToken);
      res.redirect(url.toString());
      return;
    }
    return new AuthTokensOkResponse(result);
  }

  private extractExp(req: Request): number {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return 0;
    const token = header.slice('Bearer '.length);
    const segments = token.split('.');
    if (segments.length < 2) return 0;
    try {
      const payload = JSON.parse(
        Buffer.from(segments[1] ?? '', 'base64url').toString('utf8'),
      ) as { exp?: number };
      return payload.exp ?? 0;
    } catch {
      return 0;
    }
  }
}
