import { ApiProperty } from '../../../common/decorators/api-property.decorator';

export class RefreshTokenDto {
  // <properties>
  // <property name="refreshToken">
  @ApiProperty({
    name: 'refresh_token',
    type: 'string',
    addValidator: true,
    format: 'JWT',
  })
  refreshToken!: string;
  // </property>
  // </properties>
}
