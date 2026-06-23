import { ApiProperty } from '../../../common/decorators/api-property.decorator';
import { OtpChannel } from '../enums/otp-channel.enum';

export class ForgotPasswordDto {
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
  // </properties>
}
