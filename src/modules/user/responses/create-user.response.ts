import { ApiProperty } from '@nestjs/swagger';
import { CreatedResponse } from '../../../common/responses/created.response';
import { User } from '../domains/user';

export type CreateUserData = User;
export class CreateUserResponse extends CreatedResponse {
  @ApiProperty({ type: () => User })
  public readonly data!: CreateUserData;

  constructor(data: CreateUserData) {
    super();
    this.data = data;
  }
}
