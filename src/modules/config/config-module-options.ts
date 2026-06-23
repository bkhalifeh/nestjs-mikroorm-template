import { ConfigModuleOptions } from '@nestjs/config';
// <imports>
// <import name="NodeConfig">
import { NODE_CONFIG_PROVIDER } from './resources/node-resource';
// </import>
// <import name="AppConfig">
import { APP_CONFIG_PROVIDER } from './resources/app-resource';
// </import>
// <import name="SwaggerConfig">
import { SWAGGER_CONFIG_PROVIDER } from './resources/swagger-resource';
// </import>
// <import name="DatabaseConfig">
import { DATABASE_CONFIG_PROVIDER } from './resources/database-resource';
// </import>
// <import name="LogConfig">
import { LOG_CONFIG_PROVIDER } from './resources/log-resource';
// </import>
// <import name="RedisConfig">
import { REDIS_CONFIG_PROVIDER } from './resources/redis-resource';
// </import>
// <import name="SecurityConfig">
import { SECURITY_CONFIG_PROVIDER } from './resources/security-resource';
// </import>
// <import name="S3Config">
import { S3_CONFIG_PROVIDER } from './resources/s3-resource';
// </import>
// <import name="AuthConfig">
import { AUTH_CONFIG_PROVIDER } from './resources/auth-resource';
// </import>
// <import name="OAuthConfig">
import { OAUTH_CONFIG_PROVIDER } from './resources/oauth-resource';
// </import>
// <import name="MailConfig">
import { MAIL_CONFIG_PROVIDER } from './resources/mail-resource';
// </import>
// <import name="SmsConfig">
import { SMS_CONFIG_PROVIDER } from './resources/sms-resource';
// </import>
// </imports>
export const configModuleOptions: ConfigModuleOptions = {
  isGlobal: true,
  load: [
    // <providers>
    // <provider name="AppConfig">
    APP_CONFIG_PROVIDER,
    // </provider>
    // <provider name="DatabaseConfig">
    DATABASE_CONFIG_PROVIDER,
    // </provider>
    // <provider name="LogConfig">
    LOG_CONFIG_PROVIDER,
    // </provider>
    // <provider name="NodeConfig">
    NODE_CONFIG_PROVIDER,
    // </provider>
    // <provider name="RedisConfig">
    REDIS_CONFIG_PROVIDER,
    // </provider>
    // <provider name="SecurityConfig">
    SECURITY_CONFIG_PROVIDER,
    // </provider>
    // <provider name="SwaggerConfig">
    SWAGGER_CONFIG_PROVIDER,
    // </provider>
    // <provider name="S3Config">
    S3_CONFIG_PROVIDER,
    // </provider>
    // <provider name="AuthConfig">
    AUTH_CONFIG_PROVIDER,
    // </provider>
    // <provider name="OAuthConfig">
    OAUTH_CONFIG_PROVIDER,
    // </provider>
    // <provider name="MailConfig">
    MAIL_CONFIG_PROVIDER,
    // </provider>
    // <provider name="SmsConfig">
    SMS_CONFIG_PROVIDER,
    // </provider>
    // </providers>
  ],
};
