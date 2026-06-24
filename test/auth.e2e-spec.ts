import {
  ClassSerializerInterceptor,
  Global,
  INestApplication,
  Module,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ClsModule } from 'nestjs-cls';
import { LoggerModule } from 'nestjs-pino';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import {
  MikroORM,
  PostgreSqlConnection,
  PostgreSqlDriver,
  SchemaGenerator,
} from '@mikro-orm/postgresql';
import { PostgresDialect } from 'kysely';
import { newDb } from 'pg-mem';
import { v7 } from 'uuid';
import {
  describe,
  beforeAll,
  afterAll,
  beforeEach,
  it,
  expect,
  vi,
} from 'vitest';
import request from 'supertest';
import type { App } from 'supertest/types';
import type { RedisClientType } from 'redis';

import { AuthModule } from '../src/modules/auth/auth.module';
import { UserModule } from '../src/modules/user/user.module';
import { User } from '../src/modules/user/domains/user';
import { UserIdentity } from '../src/modules/user/domains/user-identity';
import { REDIS_CLIENT } from '../src/modules/redis/constants';
import {
  MAILER,
  type Mailer,
} from '../src/modules/mailer/interfaces/mailer.interface';
import {
  SMS_SENDER,
  type SmsSender,
} from '../src/modules/sms/interfaces/sms.interface';
import {
  AUTH_CONFIG_PROVIDER,
  type AuthConfigType,
} from '../src/modules/config/resources/auth-resource';
import {
  SECURITY_CONFIG_PROVIDER,
  type SecurityConfigType,
} from '../src/modules/config/resources/security-resource';
import {
  OAUTH_CONFIG_PROVIDER,
  type OAuthConfigType,
} from '../src/modules/config/resources/oauth-resource';
import { HashStrategy } from '../src/modules/hash/enums/hash.strategy.enum';
import { OtpChannel } from '../src/modules/auth/enums/otp-channel.enum';
import { OtpPurpose } from '../src/modules/auth/enums/otp-purpose.enum';

// ── Response typing ──────────────────────────────────────────────
interface TokensData {
  access_token: string;
  refresh_token: string;
  token_type: string;
  access_expires_in: number;
  refresh_expires_in: number;
  user: { id: string; email?: string | null };
}
interface ApiResponse<T> {
  is_success: boolean;
  status: number;
  data: T;
}
function tokens(res: { body: unknown }): TokensData {
  return (res.body as ApiResponse<TokensData>).data;
}

// ── In-memory Redis fake (matches token.service + otp.service usage) ──
function globToRegExp(glob: string): RegExp {
  const escaped = glob.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped.replace(/\\\*/g, '.*')}$`);
}

class FakeRedis {
  private store = new Map<string, string>();
  reset(): void {
    this.store.clear();
  }
  set(key: string, value: string): Promise<string> {
    this.store.set(key, value);
    return Promise.resolve('OK');
  }
  get(key: string): Promise<string | null> {
    return Promise.resolve(this.store.get(key) ?? null);
  }
  del(keyOrKeys: string | string[]): Promise<number> {
    const keys = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys];
    let removed = 0;
    for (const key of keys) if (this.store.delete(key)) removed += 1;
    return Promise.resolve(removed);
  }
  exists(key: string): Promise<number> {
    return Promise.resolve(this.store.has(key) ? 1 : 0);
  }
  async *scanIterator(options?: { MATCH?: string }): AsyncGenerator<string> {
    await Promise.resolve();
    const re = options?.MATCH ? globToRegExp(options.MATCH) : null;
    for (const key of [...this.store.keys()]) {
      if (!re || re.test(key)) yield key;
    }
  }
  connect(): Promise<this> {
    return Promise.resolve(this);
  }
  quit(): Promise<void> {
    return Promise.resolve();
  }
  disconnect(): Promise<void> {
    return Promise.resolve();
  }
}

// ── Test config values ───────────────────────────────────────────
const authConfig: AuthConfigType = {
  jwtAccessSecret: 'test-access-secret',
  jwtRefreshSecret: 'test-refresh-secret',
  jwtAccessTtlSeconds: 900,
  jwtRefreshTtlSeconds: 2592000,
  jwtIssuer: 'test-issuer',
  jwtAudience: 'test-audience',
  otpLength: 6,
  otpTtlSeconds: 300,
  otpResendIntervalSeconds: 60,
  otpMaxAttempts: 5,
};
const securityConfig: SecurityConfigType = { hash: HashStrategy.ARGON2 };
// Non-empty creds so the passport OAuth strategies construct without throwing.
const oauthConfig: OAuthConfigType = {
  googleClientId: 'test-google-id',
  googleClientSecret: 'test-google-secret',
  googleCallbackUrl: 'http://localhost/auth/google/callback',
  githubClientId: 'test-github-id',
  githubClientSecret: 'test-github-secret',
  githubCallbackUrl: 'http://localhost/auth/github/callback',
};

const fakeRedis = new FakeRedis();
const mailerSend = vi.fn().mockResolvedValue(undefined);
const smsSend = vi.fn().mockResolvedValue(undefined);
const mailerStub: Mailer = { send: mailerSend };
const smsStub: SmsSender = { send: smsSend };

// pg-mem wiring (same pattern as test/file.e2e-spec.ts)
const db = newDb();
const pgMem = db.adapters.createPg();
class PgMemConnection extends PostgreSqlConnection {
  override createKyselyDialect() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    return new PostgresDialect({ pool: new pgMem.Pool() });
  }
}
class PgMemDriver extends PostgreSqlDriver {
  constructor(config: never) {
    super(config);
    Object.assign(this, {
      connection: new PgMemConnection(this.config),
      replicas: [],
    });
  }
}

@Global()
@Module({
  providers: [
    { provide: AUTH_CONFIG_PROVIDER.KEY, useValue: authConfig },
    { provide: SECURITY_CONFIG_PROVIDER.KEY, useValue: securityConfig },
    { provide: OAUTH_CONFIG_PROVIDER.KEY, useValue: oauthConfig },
  ],
  exports: [
    AUTH_CONFIG_PROVIDER.KEY,
    SECURITY_CONFIG_PROVIDER.KEY,
    OAUTH_CONFIG_PROVIDER.KEY,
  ],
})
class TestConfigModule {}

@Module({
  imports: [
    LoggerModule.forRoot({ pinoHttp: { enabled: false, level: 'silent' } }),
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        setup: (cls) => {
          cls.set('requestId', v7());
        },
      },
    }),
    MikroOrmModule.forRoot({
      driver: PgMemDriver as never,
      dbName: 'public',
      // Entities are registered via UserModule's forFeature; autoLoad keeps a
      // single schema instance so the UserIdentity.user relation resolves.
      autoLoadEntities: true,
      allowGlobalContext: true,
      extensions: [SchemaGenerator],
    }),
    TestConfigModule,
    UserModule,
    AuthModule,
  ],
})
class TestRootModule {}

// ── Helpers ──────────────────────────────────────────────────────
function latestOtpCode(): string {
  const calls = mailerSend.mock.calls;
  const last = calls[calls.length - 1] as [{ text?: string }] | undefined;
  const text = last?.[0]?.text ?? '';
  const match = /code is (\d+)/.exec(text);
  if (!match) throw new Error(`No OTP code found in mailer call: "${text}"`);
  return match[1]!;
}

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let orm: MikroORM;
  let server: App;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestRootModule],
    })
      .overrideProvider(REDIS_CLIENT)
      .useValue(fakeRedis as unknown as RedisClientType)
      .overrideProvider(MAILER)
      .useValue(mailerStub)
      .overrideProvider(SMS_SENDER)
      .useValue(smsStub)
      .compile();

    app = moduleFixture.createNestApplication({ bufferLogs: true });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        stopAtFirstError: true,
      }),
    );
    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
    );
    await app.init();

    orm = app.get(MikroORM);
    await orm.schema.create();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    fakeRedis.reset();
    mailerSend.mockClear();
    smsSend.mockClear();
    await orm.em.nativeDelete(UserIdentity, {});
    await orm.em.nativeDelete(User, {});
    orm.em.clear();
  });

  const validRegister = {
    email: 'alice@example.com',
    username: 'alice',
    password: 'sup3rsecret',
    first_name: 'Alice',
    last_name: 'Smith',
  };

  async function registerAndLogin(): Promise<TokensData> {
    await request(server)
      .post('/auth/register')
      .send(validRegister)
      .expect(201);
    const res = await request(server)
      .post('/auth/login')
      .send({
        identifier: validRegister.email,
        password: validRegister.password,
      })
      .expect(200);
    return tokens(res);
  }

  describe('POST /auth/register', () => {
    it('creates a user and returns a token pair', async () => {
      const res = await request(server)
        .post('/auth/register')
        .send(validRegister)
        .expect(201);
      const data = tokens(res);
      expect(data.access_token).toEqual(expect.any(String));
      expect(data.refresh_token).toEqual(expect.any(String));
      expect(data.token_type).toBe('Bearer');
      expect(data.user.id).toEqual(expect.any(String));
      // verification email OTP issued at registration
      expect(mailerSend).toHaveBeenCalledTimes(1);
    });

    it('rejects a duplicate email with 409', async () => {
      await request(server)
        .post('/auth/register')
        .send(validRegister)
        .expect(201);
      await request(server)
        .post('/auth/register')
        .send({ ...validRegister, username: 'alice2' })
        .expect(409);
    });

    it('rejects a too-short password with 400', async () => {
      await request(server)
        .post('/auth/register')
        .send({ ...validRegister, password: 'short' })
        .expect(400);
    });

    it('rejects when neither email nor username is supplied with 400', async () => {
      await request(server)
        .post('/auth/register')
        .send({ password: 'sup3rsecret' })
        .expect(400);
    });

    it('rejects unknown fields via the global ValidationPipe', async () => {
      await request(server)
        .post('/auth/register')
        .send({ ...validRegister, rogue: 'evil' })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('logs in with correct credentials', async () => {
      await request(server)
        .post('/auth/register')
        .send(validRegister)
        .expect(201);
      const res = await request(server)
        .post('/auth/login')
        .send({
          identifier: validRegister.username,
          password: validRegister.password,
        })
        .expect(200);
      expect(tokens(res).access_token).toEqual(expect.any(String));
    });

    it('rejects a wrong password with 401', async () => {
      await request(server)
        .post('/auth/register')
        .send(validRegister)
        .expect(201);
      await request(server)
        .post('/auth/login')
        .send({ identifier: validRegister.email, password: 'wrongpassword' })
        .expect(401);
    });

    it('rejects an unknown identifier with 401', async () => {
      await request(server)
        .post('/auth/login')
        .send({ identifier: 'ghost@example.com', password: 'sup3rsecret' })
        .expect(401);
    });
  });

  describe('protected routes', () => {
    it('rejects a request with no bearer token (401)', async () => {
      await request(server).post('/auth/logout').expect(401);
    });

    it('allows a request with a valid bearer token', async () => {
      const { access_token } = await registerAndLogin();
      await request(server)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${access_token}`)
        .expect(200);
    });
  });

  describe('POST /auth/refresh', () => {
    it('exchanges a refresh token for a new pair', async () => {
      const { refresh_token } = await registerAndLogin();
      const res = await request(server)
        .post('/auth/refresh')
        .send({ refresh_token })
        .expect(200);
      expect(tokens(res).access_token).toEqual(expect.any(String));
    });

    it('rejects reuse of an already-rotated refresh token (401)', async () => {
      const { refresh_token } = await registerAndLogin();
      await request(server)
        .post('/auth/refresh')
        .send({ refresh_token })
        .expect(200);
      // second use of the same token must fail (rotation deletes the jti)
      await request(server)
        .post('/auth/refresh')
        .send({ refresh_token })
        .expect(401);
    });

    it('rejects a malformed refresh token (400)', async () => {
      await request(server)
        .post('/auth/refresh')
        .send({ refresh_token: 'not-a-jwt' })
        .expect(400);
    });
  });

  describe('OTP login', () => {
    it('logs in with a one-time code delivered by email', async () => {
      await request(server)
        .post('/auth/register')
        .send(validRegister)
        .expect(201);
      mailerSend.mockClear();

      await request(server)
        .post('/auth/otp/request')
        .send({
          channel: OtpChannel.EMAIL,
          purpose: OtpPurpose.LOGIN,
          destination: validRegister.email,
        })
        .expect(200);

      const code = latestOtpCode();
      const res = await request(server)
        .post('/auth/otp/login')
        .send({
          channel: OtpChannel.EMAIL,
          purpose: OtpPurpose.LOGIN,
          destination: validRegister.email,
          code,
        })
        .expect(200);
      expect(tokens(res).access_token).toEqual(expect.any(String));
    });

    it('rejects a wrong OTP code (400)', async () => {
      await request(server)
        .post('/auth/register')
        .send(validRegister)
        .expect(201);
      await request(server)
        .post('/auth/otp/request')
        .send({
          channel: OtpChannel.EMAIL,
          purpose: OtpPurpose.LOGIN,
          destination: validRegister.email,
        })
        .expect(200);
      await request(server)
        .post('/auth/otp/login')
        .send({
          channel: OtpChannel.EMAIL,
          purpose: OtpPurpose.LOGIN,
          destination: validRegister.email,
          code: '000000',
        })
        .expect(400);
    });

    it('throttles a too-soon resend (429)', async () => {
      await request(server)
        .post('/auth/register')
        .send(validRegister)
        .expect(201);
      const reqBody = {
        channel: OtpChannel.EMAIL,
        purpose: OtpPurpose.LOGIN,
        destination: validRegister.email,
      };
      await request(server).post('/auth/otp/request').send(reqBody).expect(200);
      await request(server).post('/auth/otp/request').send(reqBody).expect(429);
    });
  });

  describe('password reset flow', () => {
    it('resets the password with an emailed code, then logs in with the new one', async () => {
      await request(server)
        .post('/auth/register')
        .send(validRegister)
        .expect(201);
      mailerSend.mockClear();

      await request(server)
        .post('/auth/password/forgot')
        .send({ channel: OtpChannel.EMAIL, destination: validRegister.email })
        .expect(200);

      const code = latestOtpCode();
      await request(server)
        .post('/auth/password/reset')
        .send({
          channel: OtpChannel.EMAIL,
          destination: validRegister.email,
          code,
          new_password: 'brandNewPass1',
        })
        .expect(200);

      // old password no longer works
      await request(server)
        .post('/auth/login')
        .send({
          identifier: validRegister.email,
          password: validRegister.password,
        })
        .expect(401);
      // new password works
      await request(server)
        .post('/auth/login')
        .send({ identifier: validRegister.email, password: 'brandNewPass1' })
        .expect(200);
    });
  });

  describe('POST /auth/logout', () => {
    it('revokes the access token so it can no longer be used', async () => {
      const { access_token } = await registerAndLogin();
      await request(server)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${access_token}`)
        .expect(200);
      // revoked jti → subsequent use rejected
      await request(server)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${access_token}`)
        .expect(401);
    });
  });

  describe('POST /auth/logout-all', () => {
    it('bumps the token version, invalidating existing tokens', async () => {
      const { access_token, refresh_token } = await registerAndLogin();
      await request(server)
        .post('/auth/logout-all')
        .set('Authorization', `Bearer ${access_token}`)
        .expect(200);
      // access token superseded by token-version bump
      await request(server)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${access_token}`)
        .expect(401);
      // refresh token revoked
      await request(server)
        .post('/auth/refresh')
        .send({ refresh_token })
        .expect(401);
    });
  });

  describe('POST /auth/password/change', () => {
    it('changes the password and invalidates the old one', async () => {
      const { access_token } = await registerAndLogin();
      await request(server)
        .post('/auth/password/change')
        .set('Authorization', `Bearer ${access_token}`)
        .send({
          current_password: validRegister.password,
          new_password: 'changedPass99',
        })
        .expect(200);

      await request(server)
        .post('/auth/login')
        .send({
          identifier: validRegister.email,
          password: validRegister.password,
        })
        .expect(401);
      await request(server)
        .post('/auth/login')
        .send({ identifier: validRegister.email, password: 'changedPass99' })
        .expect(200);
    });

    it('rejects an unauthenticated change-password request (401)', async () => {
      await request(server)
        .post('/auth/password/change')
        .send({ current_password: 'x', new_password: 'changedPass99' })
        .expect(401);
    });
  });
});
