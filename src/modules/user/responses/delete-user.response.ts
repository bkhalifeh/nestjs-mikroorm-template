import { ApiProperty } from '@nestjs/swagger';
import { OkResponse } from '../../../common/responses/ok.response';

export class DeleteUserData {}
export class DeleteUserResponse extends OkResponse {
  @ApiProperty({
    type: () => DeleteUserData,
  })
  data!: DeleteUserData;
  constructor(data: DeleteUserData) {
    super();
    this.data = data;
  }
}
