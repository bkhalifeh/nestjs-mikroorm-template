import { ApiProperty } from '@nestjs/swagger';
import { OkResponse } from '../../../common/responses/ok.response';
import { PaginationMeta } from '../../../common/responses/pagination-meta';
import { User } from '../domains/user';

export class ListUserData {
  @ApiProperty({
    type: User,
    isArray: true,
  })
  items!: User[];

  constructor(items: User[]) {
    this.items = items;
  }
}

export class ListUserResponse extends OkResponse {
  @ApiProperty({
    type: ListUserData,
  })
  data!: ListUserData;

  @ApiProperty({
    type: PaginationMeta,
  })
  meta!: PaginationMeta;

  constructor(
    items: User[],
    total: number,
    pagination: { page: number; perPage: number },
  ) {
    super();
    this.data = new ListUserData(items);
    this.meta = new PaginationMeta(total, pagination.page, pagination.perPage);
  }
}
