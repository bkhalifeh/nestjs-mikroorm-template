import { ApiProperty } from '@nestjs/swagger';
import { OkResponse } from '../../../common/responses/ok.response';

export class DeleteFileData {}
export class DeleteFileResponse extends OkResponse {
  @ApiProperty({ type: () => DeleteFileData })
  data!: DeleteFileData;
  constructor(data: DeleteFileData) {
    super();
    this.data = data;
  }
}
