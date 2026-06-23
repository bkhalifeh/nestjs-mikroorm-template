import { ApiProperty } from '../../../common/decorators/api-property.decorator';

export class ChangePasswordDto {
  // <properties>
  // <property name="currentPassword">
  @ApiProperty({
    name: 'current_password',
    type: 'string',
    nullable: true,
    addValidator: true,
    maxLength: 128,
  })
  currentPassword?: string | null;
  // </property>
  // <property name="newPassword">
  @ApiProperty({
    name: 'new_password',
    type: 'string',
    addValidator: true,
    minLength: 8,
    maxLength: 128,
  })
  newPassword!: string;
  // </property>
  // </properties>
}
