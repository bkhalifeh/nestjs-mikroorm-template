import { ApiProperty } from '../../../common/decorators/api-property.decorator';
import { OtpChannel } from '../enums/otp-channel.enum';
import { OtpPurpose } from '../enums/otp-purpose.enum';

export class VerifyOtpDto {
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
  // <property name="purpose">
  @ApiProperty({
    name: 'purpose',
    type: 'enum',
    enum: OtpPurpose,
    addValidator: true,
  })
  purpose!: OtpPurpose;
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
  // </properties>
}
