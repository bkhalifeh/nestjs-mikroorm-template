import { ApiProperty } from '@nestjs/swagger';
import { OkResponse } from '../../../common/responses/ok.response';
import { File } from '../domains/file';

export class PresignedDownloadData {
  @ApiProperty({ type: () => File })
  file!: File;

  @ApiProperty({
    type: 'string',
    description: 'Pre-signed URL the client should GET to download the file.',
  })
  url!: string;

  @ApiProperty({
    type: 'string',
    enum: ['GET'],
  })
  method = 'GET' as const;

  @ApiProperty({ type: 'integer' })
  expiresIn!: number;

  @ApiProperty({ type: 'string', format: 'date-time' })
  expiresAt!: string;

  constructor(args: {
    file: File;
    url: string;
    expiresIn: number;
    expiresAt: Date;
  }) {
    this.file = args.file;
    this.url = args.url;
    this.expiresIn = args.expiresIn;
    this.expiresAt = args.expiresAt.toISOString();
  }
}

export class PresignedDownloadResponse extends OkResponse {
  @ApiProperty({ type: () => PresignedDownloadData })
  public readonly data!: PresignedDownloadData;

  constructor(data: PresignedDownloadData) {
    super();
    this.data = data;
  }
}
