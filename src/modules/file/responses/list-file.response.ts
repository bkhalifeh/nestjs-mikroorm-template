import { ApiProperty } from '@nestjs/swagger';
import { OkResponse } from '../../../common/responses/ok.response';
import { PaginationMeta } from '../../../common/responses/pagination-meta';
import { File } from '../domains/file';

export class ListFileData {
  @ApiProperty({ type: File, isArray: true })
  items!: File[];

  constructor(items: File[]) {
    this.items = items;
  }
}

export class ListFileResponse extends OkResponse {
  @ApiProperty({ type: ListFileData })
  data!: ListFileData;

  @ApiProperty({ type: PaginationMeta })
  meta!: PaginationMeta;

  constructor(
    items: File[],
    total: number,
    pagination: { page: number; perPage: number },
  ) {
    super();
    this.data = new ListFileData(items);
    this.meta = new PaginationMeta(total, pagination.page, pagination.perPage);
  }
}
