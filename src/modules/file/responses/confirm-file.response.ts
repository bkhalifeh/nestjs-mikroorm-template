import { ApiProperty } from '@nestjs/swagger';
import { OkResponse } from '../../../common/responses/ok.response';
import { File } from '../domains/file';

export type ConfirmFileData = File;
export class ConfirmFileResponse extends OkResponse {
  @ApiProperty({ type: () => File })
  data!: ConfirmFileData;

  constructor(data: ConfirmFileData) {
    super();
    this.data = data;
  }
}
