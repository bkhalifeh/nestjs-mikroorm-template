// <imports>
// <import name="Module">
import { Module } from '@nestjs/common';
// </import>
// <import name="APP_FILTER">
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AllExceptionsFilter } from '../../common/filters/all-exceptions.filter';
// </import>
// <import name="ThrottlerModule">
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { throttlerModuleOptions } from '../throttler/throttler-module-options';
// </import>
// <import name="BullModule">
import { BullModule } from '@nestjs/bullmq';
// </import>
// <import name="ConfigModule">
import { ConfigModule } from '@nestjs/config';
// </import>
// <import name="ServeStaticModule">
import { ServeStaticModule } from '@nestjs/serve-static';
// </import>
// <import name="ClsModule">
import { ClsModule } from 'nestjs-cls';
// </import>
// <import name="I18nModule">
import { I18nModule } from 'nestjs-i18n';
// </import>
// <import name="LoggerModule">
import { LoggerModule } from 'nestjs-pino';
// </import>
// <import name="MikroOrmModule">
import { MikroOrmModule } from '@mikro-orm/nestjs';
// </import>
// <import name="S3Module">
import { S3Module } from 'nestjs-s3';
// </import>
// <import name="configModuleOptions">
import { configModuleOptions } from '../config/config-module-options';
// </import>
// <import name="loggerModuleOption">
import { loggerModuleOption } from '../logger/logger-module-options';
// </import>
// <import name="i18nOptions">
import { i18nOptions } from '../i18n/i18n-options';
// </import>
// <import name="clsOptions">
import { clsOptions } from '../cls/cls-options';
// </import>
// <import name="serveStaticOptions">
import { serveStaticOptions } from '../serve-static/serve-static-options';
// </import>
// <import name="bullmqModuleOptions">
import { bullmqModuleOptions } from '../bullmq/bullmq-module-options';
// </import>
// <import name="ormModuleConfig">
import { ormModuleConfig } from '../orm/orm-module-config';
// </import>
// <import name="s3ModuleOptions">
import { s3ModuleOptions } from '../s3/s3-module-options';
// </import>
// <import name="RedisModule">
import { RedisModule } from '../redis/redis.module';
// </import>
// <import name="HashModule">
import { HashModule } from '../hash/hash.module';
// </import>
// <import name="MailerModule">
import { MailerModule } from '../mailer/mailer.module';
// </import>
// <import name="SmsModule">
import { SmsModule } from '../sms/sms.module';
// </import>
// <import name="HealthModule">
import { HealthModule } from '../health/health.module';
// </import>
// <import name="FileModule">
import { FileModule } from '../file/file.module';
// </import>
// <import name="UserModule">
import { UserModule } from '../user/user.module';
// </import>
// <import name="AuthModule">
import { AuthModule } from '../auth/auth.module';
// </import>
// </imports>

@Module({
  imports: [
    // <dependencies>
    // <dependency name="ConfigModule">
    ConfigModule.forRoot(configModuleOptions),
    // </dependency>
    // <dependency name="LoggerModule">
    LoggerModule.forRootAsync(loggerModuleOption),
    // </dependency>
    // <dependency name="I18nModule">
    I18nModule.forRootAsync(i18nOptions),
    // </dependency>
    // <dependency name="ClsModule">
    ClsModule.forRootAsync(clsOptions),
    // </dependency>
    // <dependency name="ServeStaticModule">
    ServeStaticModule.forRootAsync(serveStaticOptions),
    // </dependency>
    // <dependency name="BullModule">
    BullModule.forRootAsync(bullmqModuleOptions),
    // </dependency>
    // <dependency name="MikroOrmModule">
    MikroOrmModule.forRootAsync(ormModuleConfig),
    // </dependency>
    // <dependency name="ThrottlerModule">
    ThrottlerModule.forRootAsync(throttlerModuleOptions),
    // </dependency>
    // <dependency name="S3Module">
    S3Module.forRootAsync(s3ModuleOptions),
    // </dependency>
    // <dependency name="RedisModule">
    RedisModule,
    // </dependency>
    // <dependency name="HealthModule">
    HealthModule,
    // </dependency>
    // <dependency name="HashModule">
    HashModule,
    // </dependency>
    // <dependency name="MailerModule">
    MailerModule,
    // </dependency>
    // <dependency name="SmsModule">
    SmsModule,
    // </dependency>
    // <dependency name="FileModule">
    FileModule,
    // </dependency>
    // <dependency name="UserModule">
    UserModule,
    // </dependency>
    // <dependency name="AuthModule">
    AuthModule,
    // </dependency>
    // </dependencies>
  ],
  providers: [
    // <providers>
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // </providers>
  ],
})
export class AppModule {}
