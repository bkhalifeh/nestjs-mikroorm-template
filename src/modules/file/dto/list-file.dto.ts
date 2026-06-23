import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { SortOrder } from '../../../common/enums/sort-order.enum';
import { IsOrderQuery } from '../../../common/validators/is-order-query';
import type { OrderQuery } from '../../../common/validators/is-order-query';
import { FileStatus } from '../enums/file-status.enum';

export const LIST_FILE_SORTABLE_FIELDS: readonly string[] = [
  'id',
  'createdAt',
  'updatedAt',
  // <sortable-fields>
  'originalName',
  'size',
  'uploadedAt',
  // </sortable-fields>
];

export const LIST_FILE_SEARCHABLE_FIELDS: readonly string[] = [
  // <searchable-fields>
  'originalName',
  'mimeType',
  // </searchable-fields>
];

export class ListFileQueryDto extends PaginationQueryDto {
  // <properties>
  // <property name="status">
  @ApiPropertyOptional({
    name: 'status',
    enum: FileStatus,
  })
  @Expose({ name: 'status' })
  @IsOptional()
  @IsEnum(FileStatus)
  status?: FileStatus;
  // </property>
  // </properties>

  @ApiPropertyOptional({
    name: 'search',
    type: String,
    description: 'Free-text search across original_name and mime_type.',
  })
  @Expose({ name: 'search' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    name: 'order',
    type: Object,
    example: { id: SortOrder.ASC },
    description:
      'Bracket-style ordering, e.g. ?order[created_at]=DESC&order[id]=ASC',
  })
  @Expose({ name: 'order' })
  @IsOptional()
  @IsOrderQuery(LIST_FILE_SORTABLE_FIELDS)
  order?: OrderQuery;
}
