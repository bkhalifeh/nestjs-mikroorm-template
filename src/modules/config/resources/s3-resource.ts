import { ConfigType } from '@nestjs/config';
import { Expose, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import {
  createValidatedConfig,
  transformBoolean,
  transformNumber,
  transformString,
} from '../../../common/helper/functions';

export class S3Config {
  // <properties>
  // <property name="region">
  @Expose({ name: 'S3__REGION' })
  @Transform(({ value }) => transformString(value, 'us-east-1'))
  @IsString()
  region!: string;
  // </property>
  // <property name="endpoint">
  @Expose({ name: 'S3__ENDPOINT' })
  @IsOptional()
  @IsString()
  endpoint?: string;
  // </property>
  // <property name="accessKeyId">
  @Expose({ name: 'S3__ACCESS_KEY_ID' })
  @IsNotEmpty()
  @IsString()
  accessKeyId!: string;
  // </property>
  // <property name="secretAccessKey">
  @Expose({ name: 'S3__SECRET_ACCESS_KEY' })
  @IsNotEmpty()
  @IsString()
  secretAccessKey!: string;
  // </property>
  // <property name="bucket">
  @Expose({ name: 'S3__BUCKET' })
  @IsNotEmpty()
  @IsString()
  bucket!: string;
  // </property>
  // <property name="forcePathStyle">
  @Expose({ name: 'S3__FORCE_PATH_STYLE' })
  @Transform(({ value }) => transformBoolean(value, false))
  @IsBoolean()
  forcePathStyle!: boolean;
  // </property>
  // <property name="uploadUrlTtlSeconds">
  @Expose({ name: 'S3__UPLOAD_URL_TTL_SECONDS' })
  @Transform(({ value }) => transformNumber(value, 900))
  @IsInt()
  @Min(60)
  @Max(3600)
  uploadUrlTtlSeconds!: number;
  // </property>
  // <property name="downloadUrlTtlSeconds">
  @Expose({ name: 'S3__DOWNLOAD_URL_TTL_SECONDS' })
  @Transform(({ value }) => transformNumber(value, 900))
  @IsInt()
  @Min(60)
  @Max(86400)
  downloadUrlTtlSeconds!: number;
  // </property>
  // <property name="maxUploadSizeBytes">
  @Expose({ name: 'S3__MAX_UPLOAD_SIZE_BYTES' })
  @Transform(({ value }) => transformNumber(value, 50 * 1024 * 1024))
  @IsInt()
  @Min(1)
  maxUploadSizeBytes!: number;
  // </property>
  // <property name="keyPrefix">
  @Expose({ name: 'S3__KEY_PREFIX' })
  @Transform(({ value }) => transformString(value, 'uploads'))
  @IsString()
  keyPrefix!: string;
  // </property>
  // </properties>
}

export const S3_CONFIG_PROVIDER = createValidatedConfig('s3', S3Config);

export type S3ConfigType = ConfigType<typeof S3_CONFIG_PROVIDER>;
