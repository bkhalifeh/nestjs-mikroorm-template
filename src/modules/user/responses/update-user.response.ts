import { ApiProperty } from '@nestjs/swagger';
import { OkResponse } from '../../../common/responses/ok.response';
import { User } from '../domains/user';

export type UpdateUserData = User;
export class UpdateUserResponse extends OkResponse {
  @ApiProperty({
    type: () => User,
  })
  data!: UpdateUserData;
  constructor(data: UpdateUserData) {
    super();
    this.data = data;
  }
}
