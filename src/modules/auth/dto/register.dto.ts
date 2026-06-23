import { ApiProperty } from '../../../common/decorators/api-property.decorator';

export class RegisterDto {
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
    addValidator: true,
    minLength: 8,
    maxLength: 128,
  })
  password!: string;
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
  // </properties>
}
