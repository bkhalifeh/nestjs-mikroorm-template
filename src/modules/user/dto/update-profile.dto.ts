import { ApiProperty } from '../../../common/decorators/api-property.decorator';

export class UpdateProfileDto {
  // <properties>
  // <property name="firstName">
  @ApiProperty({
    name: 'first_name',
    type: 'string',
    nullable: true,
    addValidator: true,
    maxLength: 128,
  })
  firstName?: string | null;
  // </property>
  // <property name="lastName">
  @ApiProperty({
    name: 'last_name',
    type: 'string',
    nullable: true,
    addValidator: true,
    maxLength: 128,
  })
  lastName?: string | null;
  // </property>
  // <property name="avatarUrl">
  @ApiProperty({
    name: 'avatar_url',
    type: 'string',
    nullable: true,
    addValidator: true,
    format: 'Url',
    maxLength: 1024,
  })
  avatarUrl?: string | null;
  // </property>
  // </properties>
}
