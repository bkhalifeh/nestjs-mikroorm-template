import { Base } from '../../orm/base.entity';
import { ApiProperty } from '../../../common/decorators/api-property.decorator';
import { UserRole } from '../enums/user-role.enum';
import { UserStatus } from '../enums/user-status.enum';

export class User extends Base {
  // <properties>
  // <property name="email">
  @ApiProperty({
    name: 'email',
    type: 'string',
    nullable: true,
    format: 'Email',
    maxLength: 255,
  })
  email?: string | null;
  // </property>
  // <property name="emailVerifiedAt">
  @ApiProperty({
    name: 'email_verified_at',
    type: 'datetime',
    nullable: true,
  })
  emailVerifiedAt?: Date | null;
  // </property>
  // <property name="phoneNumber">
  @ApiProperty({
    name: 'phone_number',
    type: 'string',
    nullable: true,
    maxLength: 32,
  })
  phoneNumber?: string | null;
  // </property>
  // <property name="phoneVerifiedAt">
  @ApiProperty({
    name: 'phone_verified_at',
    type: 'datetime',
    nullable: true,
  })
  phoneVerifiedAt?: Date | null;
  // </property>
  // <property name="username">
  @ApiProperty({
    name: 'username',
    type: 'string',
    nullable: true,
    maxLength: 64,
  })
  username?: string | null;
  // </property>
  // <property name="passwordHash">
  @ApiProperty({
    name: 'password_hash',
    type: 'string',
    nullable: true,
    swagger: false,
    maxLength: 512,
  })
  passwordHash?: string | null;
  // </property>
  // <property name="passwordUpdatedAt">
  @ApiProperty({
    name: 'password_updated_at',
    type: 'datetime',
    nullable: true,
    swagger: false,
  })
  passwordUpdatedAt?: Date | null;
  // </property>
  // <property name="firstName">
  @ApiProperty({
    name: 'first_name',
    type: 'string',
    nullable: true,
    maxLength: 128,
  })
  firstName?: string | null;
  // </property>
  // <property name="lastName">
  @ApiProperty({
    name: 'last_name',
    type: 'string',
    nullable: true,
    maxLength: 128,
  })
  lastName?: string | null;
  // </property>
  // <property name="avatarUrl">
  @ApiProperty({
    name: 'avatar_url',
    type: 'string',
    nullable: true,
    maxLength: 1024,
  })
  avatarUrl?: string | null;
  // </property>
  // <property name="role">
  @ApiProperty({
    name: 'role',
    type: 'enum',
    enum: UserRole,
  })
  role!: UserRole;
  // </property>
  // <property name="status">
  @ApiProperty({
    name: 'status',
    type: 'enum',
    enum: UserStatus,
  })
  status!: UserStatus;
  // </property>
  // <property name="lastLoginAt">
  @ApiProperty({
    name: 'last_login_at',
    type: 'datetime',
    nullable: true,
  })
  lastLoginAt?: Date | null;
  // </property>
  // <property name="tokenVersion">
  @ApiProperty({
    name: 'token_version',
    type: 'integer',
    swagger: false,
  })
  tokenVersion!: number;
  // </property>
  // </properties>
}
