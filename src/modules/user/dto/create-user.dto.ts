import { ApiProperty } from '../../../common/decorators/api-property.decorator';
import { UserRole } from '../enums/user-role.enum';
import { UserStatus } from '../enums/user-status.enum';

export class CreateUserDto {
  // <properties>
  // <property name="email">
  @ApiProperty({
    name: 'email',
    type: 'string',
    nullable: true,
    addValidator: true,
    format: 'Email',
    maxLength: 255,
  })
  email?: string | null;
  // </property>
  // <property name="phoneNumber">
  @ApiProperty({
    name: 'phone_number',
    type: 'string',
    nullable: true,
    addValidator: true,
    maxLength: 32,
  })
  phoneNumber?: string | null;
  // </property>
  // <property name="username">
  @ApiProperty({
    name: 'username',
    type: 'string',
    nullable: true,
    addValidator: true,
    minLength: 3,
    maxLength: 64,
  })
  username?: string | null;
  // </property>
  // <property name="password">
  @ApiProperty({
    name: 'password',
    type: 'string',
    nullable: true,
    addValidator: true,
    minLength: 8,
    maxLength: 128,
  })
  password?: string | null;
  // </property>
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
  // <property name="role">
  @ApiProperty({
    name: 'role',
    type: 'enum',
    enum: UserRole,
    nullable: true,
    addValidator: true,
  })
  role?: UserRole;
  // </property>
  // <property name="status">
  @ApiProperty({
    name: 'status',
    type: 'enum',
    enum: UserStatus,
    nullable: true,
    addValidator: true,
  })
  status?: UserStatus;
  // </property>
  // </properties>
}
