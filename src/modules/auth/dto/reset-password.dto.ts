import { ApiProperty } from '../../../common/decorators/api-property.decorator';
import { OtpChannel } from '../enums/otp-channel.enum';

export class ResetPasswordDto {
  // <properties>
  // <property name="channel">
  @ApiProperty({
    name: 'channel',
    type: 'enum',
    enum: OtpChannel,
    addValidator: true,
  })
  channel!: OtpChannel;
  // </property>
  // <property name="destination">
  @ApiProperty({
    name: 'destination',
    type: 'string',
    addValidator: true,
    maxLength: 255,
  })
  destination!: string;
  // </property>
  // <property name="code">
  @ApiProperty({
    name: 'code',
    type: 'string',
    addValidator: true,
    minLength: 4,
    maxLength: 10,
  })
  code!: string;
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
