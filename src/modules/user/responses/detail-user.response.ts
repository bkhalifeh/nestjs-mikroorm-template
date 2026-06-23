import { ApiProperty } from '@nestjs/swagger';
import { OkResponse } from '../../../common/responses/ok.response';
import { User } from '../domains/user';

export type DetailUserData = User;
export class DetailUserResponse extends OkResponse {
  @ApiProperty({
    type: () => User,
  })
  data!: DetailUserData;
  constructor(data: DetailUserData) {
    super();
    this.data = data;
  }
}
