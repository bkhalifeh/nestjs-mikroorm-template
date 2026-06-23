import { ApiProperty } from '../../../common/decorators/api-property.decorator';

export class LoginDto {
  // <properties>
  // <property name="identifier">
  @ApiProperty({
    name: 'identifier',
    type: 'string',
    addValidator: true,
    minLength: 3,
    maxLength: 255,
  })
  identifier!: string;
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
  // </properties>
}
