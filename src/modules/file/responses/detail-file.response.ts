import { ApiProperty } from '@nestjs/swagger';
import { OkResponse } from '../../../common/responses/ok.response';
import { File } from '../domains/file';

export type DetailFileData = File;
export class DetailFileResponse extends OkResponse {
  @ApiProperty({ type: () => File })
  data!: DetailFileData;

  constructor(data: DetailFileData) {
    super();
    this.data = data;
  }
}
