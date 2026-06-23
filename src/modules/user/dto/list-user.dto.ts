import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { SortOrder } from '../../../common/enums/sort-order.enum';
import { IsOrderQuery } from '../../../common/validators/is-order-query';
import type { OrderQuery } from '../../../common/validators/is-order-query';
import { UserRole } from '../enums/user-role.enum';
import { UserStatus } from '../enums/user-status.enum';

export const LIST_USER_SORTABLE_FIELDS: readonly string[] = [
  'id',
  'createdAt',
  'updatedAt',
  // <sortable-fields>
  'email',
  'username',
  'lastLoginAt',
  // </sortable-fields>
];

export const LIST_USER_SEARCHABLE_FIELDS: readonly string[] = [
  // <searchable-fields>
  'email',
  'username',
  'phoneNumber',
  'firstName',
  'lastName',
  // </searchable-fields>
];

export class ListUserQueryDto extends PaginationQueryDto {
  // <properties>
  // <property name="role">
  @ApiPropertyOptional({ name: 'role', enum: UserRole })
  @Expose({ name: 'role' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
  // </property>
  // <property name="status">
  @ApiPropertyOptional({ name: 'status', enum: UserStatus })
  @Expose({ name: 'status' })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
  // </property>
  // </properties>

  @ApiPropertyOptional({
    name: 'search',
    type: String,
    description: 'Free-text search across email, username, phone, and name.',
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
  @IsOrderQuery(LIST_USER_SORTABLE_FIELDS)
  order?: OrderQuery;
}
