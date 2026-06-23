import { ApiProperty } from '@nestjs/swagger';
import { CreatedResponse } from '../../../common/responses/created.response';
import { File } from '../domains/file';

export class PresignedUploadData {
  @ApiProperty({ type: () => File })
  file!: File;

  @ApiProperty({
    type: 'string',
    description:
      'Pre-signed URL the client must PUT the file body to. The request MUST set Content-Type and Content-Length to match the values returned here.',
  })
  url!: string;

  @ApiProperty({
    type: 'string',
    enum: ['PUT'],
    description: 'HTTP method to use against `url`.',
  })
  method = 'PUT' as const;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
    description:
      'Headers the client MUST send with the PUT request — they were embedded in the signature.',
  })
  headers!: Record<string, string>;

  @ApiProperty({
    type: 'integer',
    description: 'Seconds until the pre-signed URL expires.',
  })
  expiresIn!: number;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    description: 'Absolute expiry timestamp for the pre-signed URL.',
  })
  expiresAt!: string;

  constructor(args: {
    file: File;
    url: string;
    headers: Record<string, string>;
    expiresIn: number;
    expiresAt: Date;
  }) {
    this.file = args.file;
    this.url = args.url;
    this.headers = args.headers;
    this.expiresIn = args.expiresIn;
    this.expiresAt = args.expiresAt.toISOString();
  }
}

export class PresignedUploadResponse extends CreatedResponse {
  @ApiProperty({ type: () => PresignedUploadData })
  public readonly data!: PresignedUploadData;

  constructor(data: PresignedUploadData) {
    super();
    this.data = data;
  }
}
